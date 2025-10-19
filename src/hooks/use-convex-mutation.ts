import { useMutation } from "convex/react";
import { toast } from "sonner";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

/**
 * Enhanced useMutation hook with better error handling
 * Shows detailed error messages to users and logs to console
 */
export function useConvexMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
) {
  const mutateFn = useMutation(mutation);

  const mutate = async (
    ...args: FunctionArgs<Mutation>
  ): Promise<FunctionReturnType<Mutation>> => {
    try {
      const result = await mutateFn(...args);
      return result;
    } catch (error) {
      // Extract meaningful error message
      let errorMessage = "حدث خطأ غير متوقع";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = String(error.message);
      }

      // Show to user
      toast.error(errorMessage, { duration: 6000 });
      
      // Log full error for debugging
      console.error("Mutation error:", {
        mutation: mutation.toString(),
        args,
        error,
      });

      throw error; // Re-throw for caller to handle if needed
    }
  };

  return mutate;
}
