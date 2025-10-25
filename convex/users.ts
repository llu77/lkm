import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    // Check if user exists
    const existingUser = await ctx.db.get(userId);
    if (existingUser !== null) {
      return existingUser._id;
    }

    // For anonymous auth, create a user automatically
    const username = `user_${Date.now()}`;
    
    return await ctx.db.insert("users", {
      name: null,
      email: null,
      tokenIdentifier: userId,
      username,
      avatar: null,
      role: "employee",
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return null; // Return null instead of throwing for better UX
    }
    return await ctx.db.get(userId);
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  },
});
