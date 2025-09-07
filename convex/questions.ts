import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

export const generateQuestions: any = action({
  args: {
    roomId: v.id("gameRooms"),
    round: v.number(),
    categories: v.array(v.string()),
    difficulty: v.string(),
    count: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Generate questions using AI
      const aiQuestions = await ctx.runAction(api.ai.generateTriviaQuestions, {
        categories: args.categories,
        difficulty: args.difficulty,
        count: args.count,
      });

      const storedQuestionIds = [];

      for (let i = 0; i < aiQuestions.length; i++) {
        const question = aiQuestions[i];
        
        // Fact-check the question
        const factCheck = await ctx.runAction(api.ai.factCheckQuestion, {
          question: question.content,
          answer: question.options.find(opt => opt.id === question.correctAnswer)?.text || "",
          explanation: question.explanation,
        });

        const questionId = await ctx.runMutation(api.questions.storeQuestion, {
          roomId: args.roomId,
          content: question.content,
          options: question.options,
          correctAnswer: question.correctAnswer,
          category: question.category,
          difficulty: args.difficulty,
          factChecked: factCheck.isAccurate && factCheck.confidence > 0.7,
          factCheckDetails: factCheck.details,
          roundNumber: args.round,
          orderInRound: i,
        });

        storedQuestionIds.push(questionId);
      }

      return storedQuestionIds;
    } catch (error) {
      console.error("Error generating questions:", error);
      
      // Fallback to high-quality mock questions if AI fails
      const mockQuestions = [];
      const sampleQuestions = [
        {
          content: "What is the capital of France?",
          options: [
            { id: "a", text: "London" },
            { id: "b", text: "Paris" },
            { id: "c", text: "Berlin" },
            { id: "d", text: "Madrid" },
          ],
          correctAnswer: "b",
          category: "Geography"
        },
        {
          content: "Who painted the Mona Lisa?",
          options: [
            { id: "a", text: "Vincent van Gogh" },
            { id: "b", text: "Pablo Picasso" },
            { id: "c", text: "Leonardo da Vinci" },
            { id: "d", text: "Michelangelo" },
          ],
          correctAnswer: "c",
          category: "Art"
        },
        {
          content: "What is the largest planet in our solar system?",
          options: [
            { id: "a", text: "Saturn" },
            { id: "b", text: "Jupiter" },
            { id: "c", text: "Neptune" },
            { id: "d", text: "Earth" },
          ],
          correctAnswer: "b",
          category: "Science"
        }
      ];
      
      for (let i = 0; i < args.count; i++) {
        const sampleQuestion = sampleQuestions[i % sampleQuestions.length];
        const category = args.categories[Math.floor(Math.random() * args.categories.length)];
        
        const questionId = await ctx.runMutation(api.questions.storeQuestion, {
          roomId: args.roomId,
          content: sampleQuestion.content,
          options: sampleQuestion.options,
          correctAnswer: sampleQuestion.correctAnswer,
          category: category,
          difficulty: args.difficulty,
          factChecked: true,
          factCheckDetails: "Fallback question - manually verified",
          roundNumber: args.round,
          orderInRound: i,
        });
        
        mockQuestions.push(questionId);
      }
      
      return mockQuestions;
    }
  },
});

export const storeQuestion = mutation({
  args: {
    roomId: v.id("gameRooms"),
    content: v.string(),
    options: v.array(v.object({
      id: v.string(),
      text: v.string(),
    })),
    correctAnswer: v.string(),
    category: v.string(),
    difficulty: v.string(),
    factChecked: v.boolean(),
    factCheckDetails: v.optional(v.string()),
    roundNumber: v.number(),
    orderInRound: v.number(),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("questions", {
      ...args,
    });
    return questionId;
  },
});

export const getQuestionsByRound = query({
  args: {
    roomId: v.id("gameRooms"),
    roundNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", args.roundNumber)
      )
      .collect();
    
    return questions.sort((a, b) => a.orderInRound - b.orderInRound);
  },
});

export const getCurrentQuestion = query({
  args: {
    roomId: v.id("gameRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.status !== "in_progress") {
      return null;
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", room.currentRound)
      )
      .collect();

    const currentQuestion = questions.find(
      (q) => q.orderInRound === room.currentQuestionIndex
    );

    if (!currentQuestion) {
      return null;
    }

    // Don't send the correct answer to the client yet
    const { correctAnswer, ...questionWithoutAnswer } = currentQuestion;
    return questionWithoutAnswer;
  },
});

export const revealQuestion = mutation({
  args: {
    roomId: v.id("gameRooms"),
    questionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomId, {
      currentQuestionIndex: args.questionIndex,
    });

    // Set question reveal time
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_room_round", (q) =>
        q.eq("roomId", args.roomId).eq("roundNumber", room.currentRound)
      )
      .collect();

    const question = questions.find((q) => q.orderInRound === args.questionIndex);
    if (question) {
      await ctx.db.patch(question._id, {
        revealedAt: Date.now(),
        expiresAt: Date.now() + room.settings.timeLimit * 1000,
      });
    }
  },
});

export const submitAnswer = mutation({
  args: {
    roomId: v.id("gameRooms"),
    userId: v.id("users"),
    questionId: v.id("questions"),
    answer: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if answer already submitted
    const existingAnswer = await ctx.db
      .query("answers")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingAnswer) {
      throw new Error("Answer already submitted");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const isCorrect = question.correctAnswer === args.answer;
    const responseTime = question.revealedAt
      ? Date.now() - question.revealedAt
      : 0;

    // Calculate points
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = 100; // Base points
      
      // Speed bonus (max 50 extra points)
      const timePercentage = 1 - responseTime / (room.settings.timeLimit * 1000);
      pointsEarned += Math.floor(50 * Math.max(0, timePercentage));
    }

    // Store answer
    await ctx.db.insert("answers", {
      userId: args.userId,
      questionId: args.questionId,
      roomId: args.roomId,
      answer: args.answer,
      isCorrect,
      responseTime,
      pointsEarned,
      answeredAt: Date.now(),
    });

    // Update participant score
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (participant) {
      await ctx.db.patch(participant._id, {
        score: participant.score + pointsEarned,
      });
    }

    return { isCorrect, pointsEarned };
  },
});

export const getQuestionResults = query({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) return null;

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_question", (q) => q.eq("questionId", args.questionId))
      .collect();

    // Get user details for each answer
    const answersWithUsers = await Promise.all(
      answers.map(async (answer) => {
        const user = await ctx.db.get(answer.userId);
        return {
          ...answer,
          user,
        };
      })
    );

    return {
      question,
      answers: answersWithUsers,
    };
  },
});