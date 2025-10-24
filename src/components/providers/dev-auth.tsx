/**
 * Development Authentication Provider
 * Bypasses OIDC authentication for local development when VITE_DEV_MODE=true
 */
import { createContext, useContext, useMemo, useCallback } from "react";
import type { AuthProviderProps, User } from "react-oidc-context";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

// Mock user for development
const DEV_USER: User = {
  id_token: "dev-token",
  session_state: "dev-session",
  access_token: "dev-access-token",
  refresh_token: "dev-refresh-token",
  token_type: "Bearer",
  scope: "openid profile email",
  profile: {
    sub: "dev-user-123",
    name: "Developer User",
    email: "dev@local.test",
    picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=developer",
  },
  expires_at: Date.now() + 86400000, // 24 hours from now
} as User;

interface DevAuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null | undefined;
  error: Error | undefined;
  signoutRedirect: () => Promise<void>;
  signinRedirect: () => Promise<void>;
  removeUser: () => Promise<void>;
}

const DevAuthContext = createContext<DevAuthContextValue | null>(null);

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const signoutRedirect = useCallback(async () => {
    console.log("[DEV MODE] Sign out redirected");
  }, []);

  const signinRedirect = useCallback(async () => {
    console.log("[DEV MODE] Sign in redirected");
  }, []);

  const removeUser = useCallback(async () => {
    console.log("[DEV MODE] User removed");
  }, []);

  const value = useMemo<DevAuthContextValue>(
    () => ({
      isAuthenticated: true,
      isLoading: false,
      user: DEV_USER,
      error: undefined,
      signoutRedirect,
      signinRedirect,
      removeUser,
    }),
    [signoutRedirect, signinRedirect, removeUser]
  );

  // Show dev mode indicator
  if (DEV_MODE) {
    return (
      <>
        {/* Dev mode indicator */}
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            background: "#10b981",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "600",
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          🔧 DEV MODE
        </div>
        <DevAuthContext.Provider value={value}>
          {children}
        </DevAuthContext.Provider>
      </>
    );
  }

  return <DevAuthContext.Provider value={value}>{children}</DevAuthContext.Provider>;
}

export function useDevAuth(): DevAuthContextValue {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error("useDevAuth must be used within DevAuthProvider");
  }
  return context;
}

export { DEV_MODE };
