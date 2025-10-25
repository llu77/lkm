import { useCallback } from "react";
import {
  AuthProvider as ReactAuthProvider,
  type AuthProviderProps,
} from "react-oidc-context";

// Check if OIDC is properly configured
const isAuthConfigured =
  import.meta.env.VITE_HERCULES_OIDC_AUTHORITY &&
  import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID;

const AUTH_CONFIG: AuthProviderProps = {
  authority: import.meta.env.VITE_HERCULES_OIDC_AUTHORITY || "https://example.com",
  client_id: import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID || "dummy-client-id",
  prompt: import.meta.env.VITE_HERCULES_OIDC_PROMPT ?? "select_account",
  response_type: import.meta.env.VITE_HERCULES_OIDC_RESPONSE_TYPE ?? "code",
  scope: import.meta.env.VITE_HERCULES_OIDC_SCOPE ?? "openid profile email",
  redirect_uri:
    import.meta.env.VITE_HERCULES_OIDC_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
  automaticSilentRenew: false,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const onSigninCallback = useCallback(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);
  const onSignoutCallback = useCallback(() => {
    window.location.pathname = "";
  }, []);

  // If OIDC is not configured, skip authentication provider
  if (!isAuthConfigured) {
    console.warn(
      "⚠️ OIDC Authentication not configured. Add VITE_HERCULES_OIDC_AUTHORITY and VITE_HERCULES_OIDC_CLIENT_ID to enable authentication."
    );
    return <>{children}</>;
  }

  return (
    <ReactAuthProvider
      {...AUTH_CONFIG}
      onSigninCallback={onSigninCallback}
      onSignoutCallback={onSignoutCallback}
    >
      {children}
    </ReactAuthProvider>
  );
}
