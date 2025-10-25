// Custom Convex functions with automatic authentication
// Based on convex-helpers best practices

import { query, mutation, action } from "./_generated/server";
import { customQuery, customMutation, customAction, customCtx } from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { auth } from "./auth";

/**
 * Custom query that automatically validates authentication
 * Use this instead of regular `query` for protected queries
 */
export const authenticatedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }
    
    // Return enhanced context with user
    const user = await ctx.db.get(userId);
    return { user };
  })
);

/**
 * Custom mutation that automatically validates authentication
 * Use this instead of regular `mutation` for protected mutations
 */
export const authenticatedMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }
    
    const user = await ctx.db.get(userId);
    return { user };
  })
);

/**
 * Custom action that automatically validates authentication
 * Use this instead of regular `action` for protected actions
 */
export const authenticatedAction = customAction(
  action,
  customCtx(async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      });
    }
    
    const user = await ctx.runQuery(api.users.getCurrentUser);
    return { user };
  })
);

// Example usage:
// import { authenticatedQuery } from "./customFunctions";
//
// export const getMyData = authenticatedQuery({
//   args: {},
//   handler: async (ctx, args) => {
//     // ctx.user is automatically available!
//     return { userId: ctx.user._id, name: ctx.user.name };
//   },
// });

