// إعداد Convex Auth الكامل لمشروع LKM
// المرجع: https://docs.convex.dev/auth/convex-auth

import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // ✅ Google OAuth (Recommended - Trusted by default)
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // تعطيل account linking الخطير إذا أردت
      // allowDangerousEmailAccountLinking: false,
    }),
    
    // ✅ GitHub OAuth (Optional - Trusted by default)
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    
    // ⚠️ Password (Untrusted unless email verification is required)
    // يُنصح بعدم خلطه مع OAuth لتجنب duplicate accounts
    // Password({
    //   verify: true, // يجعله trusted
    // }),
  ],

  callbacks: {
    /**
     * Custom user creation and account linking
     * هذا يعطيك تحكم كامل في كيفية ربط الحسابات
     */
    async createOrUpdateUser(ctx: MutationCtx, args) {
      // إذا كان المستخدم موجود بالفعل (account linking)
      if (args.existingUserId) {
        const existingUser = await ctx.db.get(args.existingUserId);
        if (existingUser) {
          // تحديث بيانات المستخدم الموجود
          await ctx.db.patch(args.existingUserId, {
            name: args.profile.name ?? existingUser.name,
            email: args.profile.email ?? existingUser.email,
            avatar: args.profile.image ?? existingUser.avatar,
            emailVerified: args.profile.emailVerified ?? existingUser.emailVerified,
          });
        }
        return args.existingUserId;
      }

      // البحث عن مستخدم بنفس البريد (custom account linking)
      const existingUserByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.profile.email))
        .first();

      if (existingUserByEmail) {
        console.log(
          `Account linking: Linking ${args.provider.id} to existing user ${existingUserByEmail._id}`
        );
        return existingUserByEmail._id;
      }

      // إنشاء مستخدم جديد
      const username = await generateUniqueUsername(
        ctx,
        args.profile.name || args.profile.email?.split("@")[0] || "user"
      );

      const userId = await ctx.db.insert("users", {
        name: args.profile.name ?? null,
        email: args.profile.email!,
        emailVerified: args.profile.emailVerified ?? false,
        avatar: args.profile.image ?? null,
        username,
        role: "employee", // Default role
        tokenIdentifier: "", // سيتم ملؤه من Convex Auth
      });

      console.log(`New user created: ${userId} via ${args.provider.id}`);
      return userId;
    },

    /**
     * إجراءات إضافية بعد إنشاء/تحديث المستخدم
     * مفيد لإنشاء سجلات إضافية (audit logs, notifications, etc.)
     */
    async afterUserCreatedOrUpdated(ctx: MutationCtx, { userId, existingUserId }) {
      if (!existingUserId) {
        // مستخدم جديد - يمكن إنشاء سجلات ترحيب
        console.log(`Welcome new user: ${userId}`);
        
        // مثال: إنشاء notification ترحيبي
        // await ctx.db.insert("notifications", {
        //   userId,
        //   message: "Welcome to LKM HR System!",
        //   type: "welcome",
        //   read: false,
        // });
      }
    },
  },
});

/**
 * Helper: Generate unique username
 */
async function generateUniqueUsername(
  ctx: MutationCtx,
  baseName: string
): Promise<string> {
  const baseUsername = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 20);

  let username = baseUsername;
  let counter = 1;

  while (
    (await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first()) !== null
  ) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

// Re-export for convenience
export const isAuthenticated = store.isAuthenticated;

