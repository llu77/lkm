/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as ai from "../ai.js";
import type * as backup_index from "../backup/index.js";
import type * as backup_public from "../backup/public.js";
import type * as bonus from "../bonus.js";
import type * as clearRevenues from "../clearRevenues.js";
import type * as dashboard from "../dashboard.js";
import type * as employeeRequests from "../employeeRequests.js";
import type * as expenses from "../expenses.js";
import type * as migration from "../migration.js";
import type * as notifications from "../notifications.js";
import type * as productOrders from "../productOrders.js";
import type * as revenues from "../revenues.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  "backup/index": typeof backup_index;
  "backup/public": typeof backup_public;
  bonus: typeof bonus;
  clearRevenues: typeof clearRevenues;
  dashboard: typeof dashboard;
  employeeRequests: typeof employeeRequests;
  expenses: typeof expenses;
  migration: typeof migration;
  notifications: typeof notifications;
  productOrders: typeof productOrders;
  revenues: typeof revenues;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
