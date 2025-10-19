import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const followUser = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const follower = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!follower) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Can't follow yourself
    if (follower._id === args.followingId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Cannot follow yourself",
      });
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", follower._id).eq("followingId", args.followingId),
      )
      .unique();

    if (existingFollow) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Already following this user",
      });
    }

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId: follower._id,
      followingId: args.followingId,
    });

    // Update follower count for the user being followed
    const following = await ctx.db.get(args.followingId);
    if (following) {
      await ctx.db.patch(args.followingId, {
        followerCount: following.followerCount + 1,
      });
    }

    // Update following count for the follower
    await ctx.db.patch(follower._id, {
      followingCount: follower.followingCount + 1,
    });
  },
});

export const unfollowUser = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const follower = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!follower) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Find the follow relationship
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", follower._id).eq("followingId", args.followingId),
      )
      .unique();

    if (!existingFollow) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Not following this user",
      });
    }

    // Delete follow relationship
    await ctx.db.delete(existingFollow._id);

    // Update follower count for the user being unfollowed
    const following = await ctx.db.get(args.followingId);
    if (following) {
      await ctx.db.patch(args.followingId, {
        followerCount: Math.max(0, following.followerCount - 1),
      });
    }

    // Update following count for the follower
    await ctx.db.patch(follower._id, {
      followingCount: Math.max(0, follower.followingCount - 1),
    });
  },
});

export const isFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return false;
    }

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId),
      )
      .unique();

    return follow !== null;
  },
});
