import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    stats: v.object({
      gamesPlayed: v.number(),
      gamesWon: v.number(),
      totalScore: v.number(),
      categoryStats: v.optional(v.any())
    })
  }).index("by_clerk", ["clerkId"])
    .index("by_username", ["username"]),

  gameRooms: defineTable({
    code: v.string(),
    hostId: v.id("users"),
    settings: v.object({
      maxPlayers: v.number(),
      rounds: v.number(),
      categories: v.array(v.string()),
      difficulty: v.string(),
      timeLimit: v.number(),
      questionsPerRound: v.number()
    }),
    status: v.union(
      v.literal("waiting"),
      v.literal("in_progress"),
      v.literal("finished")
    ),
    isPublic: v.boolean(),
    currentRound: v.number(),
    currentQuestionIndex: v.optional(v.number()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number())
  }).index("by_code", ["code"])
    .index("by_status", ["status"])
    .index("by_public", ["isPublic", "status"]),

  participants: defineTable({
    roomId: v.id("gameRooms"),
    userId: v.id("users"),
    score: v.number(),
    isReady: v.boolean(),
    isActive: v.boolean(),
    joinedAt: v.number()
  }).index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_user", ["roomId", "userId"]),

  questions: defineTable({
    roomId: v.id("gameRooms"),
    content: v.string(),
    options: v.array(v.object({
      id: v.string(),
      text: v.string()
    })),
    correctAnswer: v.string(),
    category: v.string(),
    difficulty: v.string(),
    factChecked: v.boolean(),
    factCheckDetails: v.optional(v.string()),
    roundNumber: v.number(),
    orderInRound: v.number(),
    revealedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number())
  }).index("by_room", ["roomId"])
    .index("by_room_round", ["roomId", "roundNumber"]),

  answers: defineTable({
    userId: v.id("users"),
    questionId: v.id("questions"),
    roomId: v.id("gameRooms"),
    answer: v.string(),
    isCorrect: v.boolean(),
    responseTime: v.number(),
    pointsEarned: v.number(),
    answeredAt: v.number()
  }).index("by_question", ["questionId"])
    .index("by_user", ["userId"])
    .index("by_room_user", ["roomId", "userId"]),

  chatMessages: defineTable({
    roomId: v.id("gameRooms"),
    userId: v.id("users"),
    message: v.string(),
    timestamp: v.number()
  }).index("by_room", ["roomId"])
});