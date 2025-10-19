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
    role: v.optional(v.string()), // "admin", "employee", "manager"
    // Temporary fields for migration
    followerCount: v.optional(v.number()),
    followingCount: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username", ["username"]),

  revenues: defineTable({
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.id("users"),
  }).index("by_date", ["date"]),

  expenses: defineTable({
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.id("users"),
  }).index("by_date", ["date"]),

  productOrders: defineTable({
    productName: v.string(),
    quantity: v.number(),
    price: v.number(),
    status: v.string(), // "pending", "approved", "rejected", "completed"
    requestedBy: v.id("users"),
    notes: v.optional(v.string()),
  }).index("by_status", ["status"]),

  employeeOrders: defineTable({
    requestType: v.string(),
    description: v.string(),
    status: v.string(), // "pending", "approved", "rejected", "completed"
    priority: v.string(), // "low", "medium", "high"
    requestedBy: v.id("users"),
  }).index("by_status", ["status"]),
});
