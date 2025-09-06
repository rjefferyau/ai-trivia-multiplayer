import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      avatarUrl: args.avatarUrl,
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalScore: 0,
        categoryStats: {},
      },
    });

    return userId;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

export const updateUserStats = mutation({
  args: {
    userId: v.id("users"),
    won: v.boolean(),
    score: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const newStats = {
      ...user.stats,
      gamesPlayed: user.stats.gamesPlayed + 1,
      gamesWon: user.stats.gamesWon + (args.won ? 1 : 0),
      totalScore: user.stats.totalScore + args.score,
    };

    if (args.category && user.stats.categoryStats) {
      const categoryStats = user.stats.categoryStats as Record<string, number>;
      categoryStats[args.category] = (categoryStats[args.category] || 0) + 1;
      newStats.categoryStats = categoryStats;
    }

    await ctx.db.patch(args.userId, { stats: newStats });
  },
});

export const getLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const users = await ctx.db.query("users").collect();
    
    // Sort by games won, then by total score
    const sorted = users.sort((a, b) => {
      if (b.stats.gamesWon !== a.stats.gamesWon) {
        return b.stats.gamesWon - a.stats.gamesWon;
      }
      return b.stats.totalScore - a.stats.totalScore;
    });

    return sorted.slice(0, limit);
  },
});