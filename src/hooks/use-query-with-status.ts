// Enhanced useQuery with status tracking
// Based on convex-helpers/react patterns

import { useQuery as useQueryOriginal } from "convex/react";
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { useQueries } from "convex/react";
import type { FunctionReference } from "convex/server";
import { useConvexAuth } from "convex/react";

/**
 * Enhanced useQuery that returns { status, data, error, isSuccess, isPending, isError }
 * instead of just data | undefined
 * 
 * Example:
 * const { data, isSuccess, isPending, error } = useQuery(api.users.list, {});
 * if (isPending) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 * return <UserList users={data} />;
 */
export const useQuery = makeUseQueryWithStatus(useQueries);

/**
 * Automatically skips query if user is not authenticated
 * Prevents race conditions and unauthorized queries
 * 
 * Example:
 * const { data, isSuccess } = useAuthenticatedQuery(api.myData.get, { id: "123" });
 */
export function useAuthenticatedQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: any
) {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(query, isAuthenticated ? args : "skip");
}

