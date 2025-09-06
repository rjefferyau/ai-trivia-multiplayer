import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { api } from "./_generated/api";

export const startGame = action({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.runQuery(api.gameRooms.getRoomById, { roomId: args.roomId });
    if (!room) throw new Error("Room not found");

    if (room.status !== "waiting") {
      throw new Error("Game already started or finished");
    }

    // Check if all players are ready
    const allReady = room.participants.every(p => p.isReady);
    if (!allReady || room.participants.length < 2) {
      throw new Error("Not all players are ready or insufficient players");
    }

    // Start the game by updating the room status
    await ctx.runMutation(api.gameRooms.updateRoomStatus, {
      roomId: args.roomId,
      status: "in_progress",
      currentRound: 1,
      currentQuestionIndex: 0,
    });

    // Generate questions for the first round
    await ctx.runAction(api.questions.generateQuestions, {
      roomId: args.roomId,
      round: 1,
      categories: room.settings.categories,
      difficulty: room.settings.difficulty,
      count: room.settings.questionsPerRound,
    });

    return { success: true };
  },
});

export const nextRound = action({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.runQuery(api.gameRooms.getRoomById, { roomId: args.roomId });
    if (!room) throw new Error("Room not found");

    const nextRound = room.currentRound + 1;

    if (nextRound > room.settings.rounds) {
      // Game is finished
      await ctx.runMutation(api.gameRooms.updateRoomStatus, {
        roomId: args.roomId,
        status: "finished",
      });

      // Update player stats
      const sortedParticipants = [...room.participants].sort((a, b) => b.score - a.score);
      
      for (let i = 0; i < sortedParticipants.length; i++) {
        const participant = sortedParticipants[i];
        await ctx.runMutation(api.users.updateUserStats, {
          userId: participant.userId,
          won: i === 0, // Winner is first in sorted list
          score: participant.score,
        });
      }

      return { gameFinished: true };
    }

    // Start next round
    await ctx.runMutation(api.gameRooms.updateRoomStatus, {
      roomId: args.roomId,
      currentRound: nextRound,
      currentQuestionIndex: 0,
    });

    // Generate questions for the next round
    await ctx.runAction(api.questions.generateQuestions, {
      roomId: args.roomId,
      round: nextRound,
      categories: room.settings.categories,
      difficulty: room.settings.difficulty,
      count: room.settings.questionsPerRound,
    });

    return { nextRound };
  },
});

export const nextQuestion = mutation({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const nextQuestionIndex = (room.currentQuestionIndex || 0) + 1;
    
    // Check if we've finished all questions in this round
    if (nextQuestionIndex >= room.settings.questionsPerRound) {
      // This will trigger the next round via scheduled function
      return { roundComplete: true };
    }

    // Move to next question
    await ctx.db.patch(args.roomId, {
      currentQuestionIndex: nextQuestionIndex,
    });

    // Set the reveal time for the new question
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", room.currentRound)
      )
      .collect();

    const currentQuestion = questions.find(q => q.orderInRound === nextQuestionIndex);
    if (currentQuestion) {
      await ctx.db.patch(currentQuestion._id, {
        revealedAt: Date.now(),
        expiresAt: Date.now() + room.settings.timeLimit * 1000,
      });
    }

    return { nextQuestionIndex };
  },
});

// Get game stats and results
export const getGameResults = query({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get all answers for this game
    const allAnswers = await ctx.db
      .query("answers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get user details and calculate stats
    const participantsWithStats = await Promise.all(
      participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);
        const userAnswers = allAnswers.filter(a => a.userId === participant.userId);
        
        const correctAnswers = userAnswers.filter(a => a.isCorrect).length;
        const totalAnswers = userAnswers.length;
        const averageResponseTime = userAnswers.length > 0 
          ? userAnswers.reduce((sum, a) => sum + a.responseTime, 0) / userAnswers.length 
          : 0;

        return {
          ...participant,
          user,
          stats: {
            correctAnswers,
            totalAnswers,
            accuracy: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
            averageResponseTime: Math.round(averageResponseTime),
          },
        };
      })
    );

    return {
      room,
      participants: participantsWithStats.sort((a, b) => b.score - a.score),
      totalQuestions: room.settings.rounds * room.settings.questionsPerRound,
    };
  },
});