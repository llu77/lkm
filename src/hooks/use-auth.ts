import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMemo } from "react";

/**
 * Custom auth hook compatible with Convex Auth
 * Provides backward compatibility with OIDC-based auth interface
 */
export function useAuth() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      // Backward compatibility: map to OIDC interface
      signinRedirect: () => void signIn("anonymous"),
      signoutRedirect: signOut,
      user: null,
      error: null,
    }),
    [isLoading, isAuthenticated, signIn, signOut]
  );
}

type UseUserProps = {
  /**
   * Whether to automatically redirect to the login if the user is not authenticated
   */
  shouldRedirect?: boolean;
};

/**
 * Hook for accessing user information
 * With Anonymous auth, automatically signs in if needed
 */
export function useUser({ shouldRedirect }: UseUserProps = {}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signIn } = useAuthActions();

  // Auto sign-in with anonymous auth if needed
  if (!isLoading && !isAuthenticated && shouldRedirect) {
    void signIn("anonymous");
  }

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      id: null, // Can be fetched from getCurrentUser query
      name: null,
      email: null,
      avatar: null,
      error: null,
    }),
    [isLoading, isAuthenticated]
  );
}
