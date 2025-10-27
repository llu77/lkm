import { ConvexReactClient } from "convex/react";

export const convexUrl =
  import.meta.env.VITE_CONVEX_URL ?? "https://careful-clownfish-771.convex.cloud";

// Enable verbose logging for debugging authentication issues
export const convex = new ConvexReactClient(convexUrl, {
  verbose: import.meta.env.DEV, // Enable only in development
});
