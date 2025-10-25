// Testing utilities for development and testing environments
// Based on convex-helpers testing patterns

import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { mutation, query, internalMutation } from "./_generated/server";
import schema from "./schema";

/**
 * Custom query wrapper that only works in test environment
 * Prevents accidental use in production
 */
export const testingQuery = customQuery(query, {
  args: {},
  input: async (_ctx, _args) => {
    if (process.env.IS_TEST === undefined) {
      throw new Error("This function can only be called in test environment");
    }
    return { ctx: {}, args: {} };
  },
});

/**
 * Custom mutation wrapper that only works in test environment
 * Optionally restrict to dev-only
 */
export const testingMutation = customMutation(mutation, {
  args: {},
  input: async (_ctx, _args, options?: { devOnly?: boolean }) => {
    if (process.env.IS_TEST === undefined) {
      throw new Error("This function can only be called in test environment");
    }
    if (options?.devOnly && process.env.IS_PROD) {
      throw new Error("This function is only available in development");
    }
    return { ctx: {}, args: {} };
  },
});

/**
 * Clear all data from the database (TEST ONLY!)
 * Use with extreme caution - only for test environments
 * 
 * Usage: npx convex run testingHelpers:clearAll
 */
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Safety check
    if (process.env.IS_TEST === undefined) {
      throw new Error("clearAll can only be run in test environment!");
    }
    
    // Delete all documents from all tables
    for (const tableName of Object.keys(schema.tables)) {
      const docs = await ctx.db.query(tableName as any).collect();
      await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)));
    }
    
    // Cancel all scheduled functions
    const scheduled = await ctx.db.system.query("_scheduled_functions").collect();
    await Promise.all(scheduled.map((s) => ctx.scheduler.cancel(s._id)));
    
    // Delete all stored files
    const storedFiles = await ctx.db.system.query("_storage").collect();
    await Promise.all(storedFiles.map((s) => ctx.storage.delete(s._id)));
    
    return { 
      message: "All data cleared successfully",
      tablesCleared: Object.keys(schema.tables).length,
    };
  },
});

/**
 * Seed test data for development
 * Only runs in test/dev environments
 */
export const seedTestData = testingMutation({
  devOnly: true,
  handler: async (ctx) => {
    // Example: Create test branch
    const branchId = await ctx.db.insert("branches", {
      branchId: "test-branch-001",
      branchName: "فرع الاختبار",
      supervisorEmail: "test@example.com",
      isActive: true,
      employeeCount: 0,
      location: "الرياض",
    });
    
    // Example: Create test user
    const userId = await ctx.db.insert("users", {
      tokenIdentifier: "test-user-token",
      username: "testuser",
      role: "admin",
    });
    
    return {
      message: "Test data seeded successfully",
      branchId,
      userId,
    };
  },
});

