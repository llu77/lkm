import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logEmail = internalMutation({
  args: {
    to: v.array(v.string()),
    subject: v.string(),
    status: v.string(),
    emailId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("emailLogs", {
      ...args,
      sentAt: Date.now(),
    });
  },
});

export const getEmailLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const logs = await ctx.db
      .query("emailLogs")
      .order("desc")
      .take(limit);
    
    return logs.map(log => ({
      ...log,
      sentAt: log.sentAt ? new Date(log.sentAt).toISOString() : undefined,
    }));
  },
});

export const getEmailStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("emailLogs").collect();
    
    const sent = allLogs.filter(l => l.status === "sent").length;
    const failed = allLogs.filter(l => l.status === "failed").length;
    const pending = allLogs.filter(l => l.status === "pending").length;
    
    return {
      total: allLogs.length,
      sent,
      failed,
      pending,
      successRate: allLogs.length > 0 ? ((sent / allLogs.length) * 100).toFixed(1) : "0",
    };
  },
});