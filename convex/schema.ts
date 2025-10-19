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
    date: v.number(),
    cash: v.optional(v.number()),
    network: v.optional(v.number()),
    budget: v.optional(v.number()),
    total: v.optional(v.number()), // كاش + شبكة فقط
    calculatedTotal: v.optional(v.number()), // المجموع المحسوب
    isMatched: v.optional(v.boolean()), // حالة المطابقة
    mismatchReason: v.optional(v.string()), // سبب عدم المطابقة
    userId: v.id("users"),
    branchId: v.optional(v.string()), // معرف الفرع
    branchName: v.optional(v.string()), // اسم الفرع
    employees: v.optional(v.array(v.object({
      name: v.string(),
      revenue: v.number(),
    }))), // موظفي الإيراد
    isApprovedForBonus: v.optional(v.boolean()), // معتمد في البونص
    // Old fields for migration
    title: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_branch", ["branchId"]),

  expenses: defineTable({
    title: v.string(),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.id("users"),
    branchId: v.optional(v.string()), // معرف الفرع
    branchName: v.optional(v.string()), // اسم الفرع
  })
    .index("by_date", ["date"])
    .index("by_branch", ["branchId"]),

  productOrders: defineTable({
    productName: v.string(),
    quantity: v.number(),
    price: v.number(),
    status: v.string(), // "pending", "approved", "rejected", "completed"
    requestedBy: v.id("users"),
    notes: v.optional(v.string()),
    branchId: v.optional(v.string()), // معرف الفرع
    branchName: v.optional(v.string()), // اسم الفرع
  })
    .index("by_status", ["status"])
    .index("by_branch", ["branchId"]),

  employeeOrders: defineTable({
    requestType: v.string(),
    description: v.string(),
    status: v.string(), // "pending", "approved", "rejected", "completed"
    priority: v.string(), // "low", "medium", "high"
    requestedBy: v.id("users"),
    branchId: v.optional(v.string()), // معرف الفرع
    branchName: v.optional(v.string()), // اسم الفرع
  })
    .index("by_status", ["status"])
    .index("by_branch", ["branchId"]),

  bonusRecords: defineTable({
    branchId: v.string(),
    branchName: v.string(),
    weekNumber: v.number(), // رقم الأسبوع (1-5)
    weekLabel: v.string(), // "الأسبوع الأول" أو "أيام متبقية"
    startDate: v.number(),
    endDate: v.number(),
    month: v.number(),
    year: v.number(),
    employeeBonuses: v.array(v.object({
      employeeName: v.string(),
      totalRevenue: v.number(),
      bonusAmount: v.number(),
      isEligible: v.boolean(),
    })),
    totalBonusPaid: v.number(),
    approvedBy: v.id("users"),
    approvedAt: v.number(),
    revenueSnapshot: v.array(v.object({
      date: v.number(),
      employeeName: v.string(),
      revenue: v.number(),
    })),
  })
    .index("by_branch_and_date", ["branchId", "year", "month", "weekNumber"])
    .index("by_branch", ["branchId"]),
});
