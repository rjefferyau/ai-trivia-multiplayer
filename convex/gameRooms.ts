import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const generateRoomCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export const createRoom = mutation({
  args: {
    hostId: v.id("users"),
    settings: v.object({
      maxPlayers: v.number(),
      rounds: v.number(),
      categories: v.array(v.string()),
      difficulty: v.string(),
      timeLimit: v.number(),
      questionsPerRound: v.number(),
    }),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    let code = generateRoomCode();
    
    // Ensure code is unique
    let existingRoom = await ctx.db
      .query("gameRooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    
    while (existingRoom) {
      code = generateRoomCode();
      existingRoom = await ctx.db
        .query("gameRooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    const roomId = await ctx.db.insert("gameRooms", {
      code,
      hostId: args.hostId,
      settings: args.settings,
      status: "waiting",
      isPublic: args.isPublic,
      currentRound: 0,
      createdAt: Date.now(),
    });

    // Add host as first participant
    await ctx.db.insert("participants", {
      roomId,
      userId: args.hostId,
      score: 0,
      isReady: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return { roomId, code };
  },
});

export const joinRoom = mutation({
  args: {
    code: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("gameRooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.status !== "waiting") {
      throw new Error("Game already started");
    }

    // Check if user is already in the room
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", room._id).eq("userId", args.userId)
      )
      .first();

    if (existingParticipant) {
      return room._id;
    }

    // Check if room is full
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    if (participants.length >= room.settings.maxPlayers) {
      throw new Error("Room is full");
    }

    // Add participant
    await ctx.db.insert("participants", {
      roomId: room._id,
      userId: args.userId,
      score: 0,
      isReady: false,
      isActive: true,
      joinedAt: Date.now(),
    });

    return room._id;
  },
});

export const getRoomByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("gameRooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    return room;
  },
});

export const getRoomById = query({
  args: { roomId: v.id("gameRooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get user details for each participant
    const participantsWithDetails = await Promise.all(
      participants.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return {
          ...p,
          user,
        };
      })
    );

    return {
      ...room,
      participants: participantsWithDetails,
    };
  },
});

export const getPublicRooms = query({
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("gameRooms")
      .withIndex("by_public", (q) => q.eq("isPublic", true).eq("status", "waiting"))
      .collect();

    // Get participant count for each room
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const participants = await ctx.db
          .query("participants")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        
        return {
          ...room,
          participantCount: participants.length,
        };
      })
    );

    return roomsWithCounts;
  },
});

export const setPlayerReady = mutation({
  args: {
    roomId: v.id("gameRooms"),
    userId: v.id("users"),
    isReady: v.boolean(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!participant) {
      throw new Error("Participant not found");
    }

    await ctx.db.patch(participant._id, { isReady: args.isReady });

    // Check if all players are ready
    const allParticipants = await ctx.db
      .query("participants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const allReady = allParticipants.every((p) => p.isReady);

    if (allReady && allParticipants.length >= 2) {
      // Start the game
      await ctx.db.patch(args.roomId, {
        status: "in_progress",
        startedAt: Date.now(),
        currentRound: 1,
      });
    }
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("gameRooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_room_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!participant) {
      return;
    }

    await ctx.db.patch(participant._id, { isActive: false });

    // Check if this was the host
    const room = await ctx.db.get(args.roomId);
    if (room && room.hostId === args.userId) {
      // Find a new host
      const activeParticipants = await ctx.db
        .query("participants")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      if (activeParticipants.length > 0) {
        await ctx.db.patch(args.roomId, { hostId: activeParticipants[0].userId });
      } else {
        // No active participants, close the room
        await ctx.db.patch(args.roomId, { status: "finished", finishedAt: Date.now() });
      }
    }
  },
});

export const updateRoomStatus = mutation({
  args: {
    roomId: v.id("gameRooms"),
    status: v.optional(v.union(
      v.literal("waiting"),
      v.literal("in_progress"),
      v.literal("finished")
    )),
    currentRound: v.optional(v.number()),
    currentQuestionIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    
    if (args.status !== undefined) {
      updates.status = args.status;
      
      if (args.status === "in_progress") {
        updates.startedAt = Date.now();
      } else if (args.status === "finished") {
        updates.finishedAt = Date.now();
      }
    }
    
    if (args.currentRound !== undefined) {
      updates.currentRound = args.currentRound;
    }
    
    if (args.currentQuestionIndex !== undefined) {
      updates.currentQuestionIndex = args.currentQuestionIndex;
    }

    await ctx.db.patch(args.roomId, updates);
  },
});