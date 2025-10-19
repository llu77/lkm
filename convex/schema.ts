import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    username: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    followerCount: v.number(),
    followingCount: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username", ["username"]),

  posts: defineTable({
    userId: v.id("users"),
    imageUrl: v.string(),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
    likeCount: v.number(),
  }).index("by_user", ["userId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_and_following", ["followerId", "followingId"]),

  likes: defineTable({
    userId: v.id("users"),
    postId: v.id("posts"),
  })
    .index("by_user", ["userId"])
    .index("by_post", ["postId"])
    .index("by_user_and_post", ["userId", "postId"]),
});
