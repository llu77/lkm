import { useCallback } from "react";
import {
  AuthProvider as ReactAuthProvider,
  type AuthProviderProps,
} from "react-oidc-context";
import { DevAuthProvider, DEV_MODE } from "./dev-auth";

const AUTH_CONFIG: AuthProviderProps = {
  authority: import.meta.env.VITE_HERCULES_OIDC_AUTHORITY || "https://accounts.hercules.app",
  client_id: import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID || "dev-client-id",
  prompt: import.meta.env.VITE_HERCULES_OIDC_PROMPT ?? "select_account",
  response_type: import.meta.env.VITE_HERCULES_OIDC_RESPONSE_TYPE ?? "code",
  scope: import.meta.env.VITE_HERCULES_OIDC_SCOPE ?? "openid profile email",
  redirect_uri:
    import.meta.env.VITE_HERCULES_OIDC_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const onSigninCallback = useCallback(() => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);
  const onSignoutCallback = useCallback(() => {
    window.location.pathname = "";
  }, []);

  // Use dev auth provider in development mode
  if (DEV_MODE) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
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
