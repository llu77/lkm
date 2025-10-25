/**
 * Environment Variables Validation
 *
 * Provides type-safe access to environment variables with runtime validation
 */

interface EnvConfig {
  // Development
  DEV_MODE: boolean;

  // Convex
  CONVEX_URL: string;

  // Hercules OIDC
  HERCULES_OIDC_AUTHORITY: string;
  HERCULES_OIDC_CLIENT_ID: string;
  HERCULES_OIDC_PROMPT?: string;
  HERCULES_OIDC_RESPONSE_TYPE?: string;
  HERCULES_OIDC_SCOPE?: string;
  HERCULES_OIDC_REDIRECT_URI?: string;

  // Passwords (should be removed in production!)
  MANAGE_REQUESTS_PASSWORD?: string;
  PAYROLL_PASSWORD?: string;
  EMPLOYEES_PASSWORD?: string;

  // Hercules Website ID (optional)
  HERCULES_WEBSITE_ID?: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentError";
  }
}

/**
 * Get environment variable with validation
 */
function getEnv(key: string, required: boolean = true): string | undefined {
  const value = import.meta.env[`VITE_${key}`];

  if (required && !value) {
    throw new EnvironmentError(
      `Missing required environment variable: VITE_${key}\n` +
        `Please add it to your .env.local file or Cloudflare Pages environment variables.`
    );
  }

  return value;
}

/**
 * Validate and export environment variables
 */
export const env: EnvConfig = {
  // Development mode
  DEV_MODE: getEnv("DEV_MODE", false) === "true",

  // Convex (required)
  CONVEX_URL: getEnv("CONVEX_URL") || "",

  // Hercules OIDC (required in production)
  HERCULES_OIDC_AUTHORITY:
    getEnv("HERCULES_OIDC_AUTHORITY", !getEnv("DEV_MODE", false)) ||
    "https://accounts.hercules.app",
  HERCULES_OIDC_CLIENT_ID:
    getEnv("HERCULES_OIDC_CLIENT_ID", !getEnv("DEV_MODE", false)) ||
    "your-client-id-here",

  // Optional OIDC settings
  HERCULES_OIDC_PROMPT: getEnv("HERCULES_OIDC_PROMPT", false),
  HERCULES_OIDC_RESPONSE_TYPE: getEnv("HERCULES_OIDC_RESPONSE_TYPE", false),
  HERCULES_OIDC_SCOPE: getEnv("HERCULES_OIDC_SCOPE", false),
  HERCULES_OIDC_REDIRECT_URI: getEnv("HERCULES_OIDC_REDIRECT_URI", false),

  // Page passwords (optional, should use proper auth in production)
  MANAGE_REQUESTS_PASSWORD: getEnv("MANAGE_REQUESTS_PASSWORD", false),
  PAYROLL_PASSWORD: getEnv("PAYROLL_PASSWORD", false),
  EMPLOYEES_PASSWORD: getEnv("EMPLOYEES_PASSWORD", false),

  // Hercules Website ID (optional)
  HERCULES_WEBSITE_ID: getEnv("HERCULES_WEBSITE_ID", false),
};

/**
 * Validate environment configuration
 * Call this early in app initialization
 */
export function validateEnv(): void {
  // Check critical variables
  if (!env.DEV_MODE) {
    // Production checks
    if (!env.CONVEX_URL) {
      throw new EnvironmentError("VITE_CONVEX_URL is required in production");
    }

    if (
      !env.HERCULES_OIDC_AUTHORITY ||
      env.HERCULES_OIDC_AUTHORITY === "https://accounts.hercules.app"
    ) {
      console.warn(
        "⚠️  Warning: Using default OIDC authority. Please configure VITE_HERCULES_OIDC_AUTHORITY"
      );
    }

    if (
      !env.HERCULES_OIDC_CLIENT_ID ||
      env.HERCULES_OIDC_CLIENT_ID === "your-client-id-here"
    ) {
      throw new EnvironmentError(
        "VITE_HERCULES_OIDC_CLIENT_ID must be configured in production"
      );
    }

    // Warn about password-based authentication
    if (
      env.MANAGE_REQUESTS_PASSWORD ||
      env.PAYROLL_PASSWORD ||
      env.EMPLOYEES_PASSWORD
    ) {
      console.warn(
        "⚠️  Warning: Password-based authentication detected. Consider using proper role-based access control."
      );
    }
  }

  // Log environment status
  console.log(`🔧 Environment: ${env.DEV_MODE ? "Development" : "Production"}`);
  console.log(`🔗 Convex URL: ${env.CONVEX_URL || "Not configured"}`);
  console.log(
    `🔐 OIDC Authority: ${env.HERCULES_OIDC_AUTHORITY || "Not configured"}`
  );
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return env.DEV_MODE;
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return !env.DEV_MODE;
}
