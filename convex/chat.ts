import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: {
    roomId: v.id("gameRooms"),
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("chatMessages", {
      roomId: args.roomId,
      userId: args.userId,
      message: args.message,
      timestamp: Date.now(),
    });
    return messageId;
  },
});

export const getMessages = query({
  args: {
    roomId: v.id("gameRooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(limit);

    // Get user details for each message
    const messagesWithUsers = await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db.get(msg.userId);
        return {
          ...msg,
          user,
        };
      })
    );

    // Return in chronological order
    return messagesWithUsers.reverse();
  },
});