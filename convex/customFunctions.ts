// Custom Convex functions with automatic authentication
// Based on convex-helpers best practices

import { query, mutation, action } from "./_generated/server";
import { customQuery, customMutation, customAction, customCtx } from "convex-helpers/server/customFunctions";
import { ConvexError } from "convex/values";
import { auth } from "./auth";
import { api } from "./_generated/api";
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { CustomBuilder } from "convex-helpers/server/customFunctions";

type UserDoc = Doc<"users">;
type EmptyArgsValidator = Record<string, never>;
type EmptyArgsObject = Record<string, never>;
type EmptyExtraArgs = Record<string, never>;

type AuthenticatedQueryBuilder = CustomBuilder<
  "query",
  EmptyArgsValidator,
  { user: UserDoc },
  EmptyArgsObject,
  QueryCtx,
  "public",
  EmptyExtraArgs
>;

type AuthenticatedMutationBuilder = CustomBuilder<
  "mutation",
  EmptyArgsValidator,
  { user: UserDoc },
  EmptyArgsObject,
  MutationCtx,
  "public",
  EmptyExtraArgs
>;

type AuthenticatedActionBuilder = CustomBuilder<
  "action",
  EmptyArgsValidator,
  { user: UserDoc },
  EmptyArgsObject,
  ActionCtx,
  "public",
  EmptyExtraArgs
>;

async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx | ActionCtx): Promise<UserDoc> {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Authentication required",
    });
  }

  if ("db" in ctx) {
    const user = await ctx.db.get(userId);
    if (user) {
      return user;
    }
  }

  if ("runQuery" in ctx) {
    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (user) {
      return user;
    }
  }

  throw new ConvexError({
    code: "NOT_FOUND",
    message: "Authenticated user record not found",
  });
}

/**
 * Custom query that automatically validates authentication
 * Use this instead of regular `query` for protected queries
 */
export const authenticatedQuery: AuthenticatedQueryBuilder = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return { user };
  })
);

/**
 * Custom mutation that automatically validates authentication
 * Use this instead of regular `mutation` for protected mutations
 */
export const authenticatedMutation: AuthenticatedMutationBuilder = customMutation(
  mutation,
  customCtx(async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return { user };
  })
);

/**
 * Custom action that automatically validates authentication
 * Use this instead of regular `action` for protected actions
 */
export const authenticatedAction: AuthenticatedActionBuilder = customAction(
  action,
  customCtx(async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
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

