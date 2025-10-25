/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as advances from "../advances.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as backup_index from "../backup/index.js";
import type * as backup_public from "../backup/public.js";
import type * as bonus from "../bonus.js";
import type * as branches from "../branches.js";
import type * as clearRevenues from "../clearRevenues.js";
import type * as crons from "../crons.js";
import type * as dashboard from "../dashboard.js";
import type * as deductions from "../deductions.js";
import type * as emailLogs from "../emailLogs.js";
import type * as emailSettings from "../emailSettings.js";
import type * as emailSystem from "../emailSystem.js";
import type * as employeeRequests from "../employeeRequests.js";
import type * as employees from "../employees.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as migration from "../migration.js";
import type * as notifications from "../notifications.js";
import type * as payroll from "../payroll.js";
import type * as payrollAutomation from "../payrollAutomation.js";
import type * as payrollEmail from "../payrollEmail.js";
import type * as pdfAgent from "../pdfAgent.js";
import type * as productOrders from "../productOrders.js";
import type * as revenues from "../revenues.js";
import type * as scheduledEmails from "../scheduledEmails.js";
import type * as scheduledEmailsQueries from "../scheduledEmailsQueries.js";
import type * as users from "../users.js";
import type * as zapier from "../zapier.js";
import type * as zapierHelper from "../zapierHelper.js";
import type * as zapierQueries from "../zapierQueries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  advances: typeof advances;
  ai: typeof ai;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  "backup/index": typeof backup_index;
  "backup/public": typeof backup_public;
  bonus: typeof bonus;
  branches: typeof branches;
  clearRevenues: typeof clearRevenues;
  crons: typeof crons;
  dashboard: typeof dashboard;
  deductions: typeof deductions;
  emailLogs: typeof emailLogs;
  emailSettings: typeof emailSettings;
  emailSystem: typeof emailSystem;
  employeeRequests: typeof employeeRequests;
  employees: typeof employees;
  expenses: typeof expenses;
  http: typeof http;
  migration: typeof migration;
  notifications: typeof notifications;
  payroll: typeof payroll;
  payrollAutomation: typeof payrollAutomation;
  payrollEmail: typeof payrollEmail;
  pdfAgent: typeof pdfAgent;
  productOrders: typeof productOrders;
  revenues: typeof revenues;
  scheduledEmails: typeof scheduledEmails;
  scheduledEmailsQueries: typeof scheduledEmailsQueries;
  users: typeof users;
  zapier: typeof zapier;
  zapierHelper: typeof zapierHelper;
  zapierQueries: typeof zapierQueries;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
