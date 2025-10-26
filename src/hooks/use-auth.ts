import { useCallback, useMemo } from "react";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";

type FetchAccessTokenArgs = { forceRefreshToken: boolean };

/**
 * Custom auth hook compatible with Convex Auth
 * Provides backward compatibility with OIDC-based auth interface
 */
export type AuthResult = {
  isLoading: boolean;
  isAuthenticated: boolean;
  signinRedirect: () => Promise<void>;
  signoutRedirect: () => Promise<void>;
  user: null;
  error: string | null;
  fetchAccessToken: (options: FetchAccessTokenArgs) => Promise<string | null>;
};

export function useAuth(): AuthResult {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const authActions = useAuthActions() as ReturnType<typeof useAuthActions> & {
    fetchAccessToken?: (options: FetchAccessTokenArgs) => Promise<string | null>;
  };
  const { signIn, signOut } = authActions;
  const fetchToken = authActions.fetchAccessToken;

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: FetchAccessTokenArgs) => {
      if (!fetchToken) {
        console.warn("fetchAccessToken is not available from useAuthActions");
        return null;
      }
      try {
        return await fetchToken({ forceRefreshToken });
      } catch (error) {
        console.error("Failed to fetch access token", error);
        return null;
      }
    },
    [fetchToken]
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      signinRedirect: async () => {
        try {
          await signIn("anonymous");
        } catch (error) {
          console.error("Anonymous sign-in failed", error);
        }
      },
      signoutRedirect: signOut,
      user: null,
      error: null,
      fetchAccessToken,
    }),
    [isLoading, isAuthenticated, signIn, signOut, fetchAccessToken]
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
