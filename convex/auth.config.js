import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

// Convex Auth configuration
export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Anonymous],
});

// Legacy auth config (empty - using Convex Auth instead)
export default {
  providers: [],
};
