import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

const defaultPlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  points: 0,
  assists: 0,
  rebounds: 0,
};

async function ensureRoleProfile(ctx: any, userId: any, role?: string) {
  if (role === "PLAYER") {
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (!existingPlayer) {
      await ctx.db.insert("players", {
        userId,
        stats: defaultPlayerStats,
      });
    }
  }

  if (role === "COACH") {
    const existingCoach = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (!existingCoach) {
      await ctx.db.insert("coaches", { userId });
    }
  }
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params: Record<string, unknown>) {
        const emailParam = typeof params.email === "string" ? params.email : "";
        const nameParam = typeof params.name === "string" ? params.name : "";
        const roleParam = typeof params.role === "string" ? params.role : "PLAYER";
        const email = emailParam.toLowerCase();
        const fullName = (nameParam || email || "User").trim();
        const rawRole = roleParam.toUpperCase();
        const role =
          rawRole === "COACH" || rawRole === "SCOUT" ? rawRole : "PLAYER";
        const now = Date.now();

        return {
          email,
          name: fullName,
          full_name: fullName,
          role,
          is_active: true,
          is_public: true,
          created_at: now,
          updated_at: now,
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId, existingUserId, type, provider, profile }) {
      if (
        existingUserId !== null ||
        type !== "credentials" ||
        provider.id !== "password" ||
        typeof profile.email !== "string"
      ) {
        return;
      }

      const email = profile.email.trim().toLowerCase();
      const existingUsers = await (ctx.db as any)
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", email))
        .take(2);

      if (existingUsers.some((user: any) => user._id !== userId)) {
        throw new Error("Email already in use");
      }

      await ensureRoleProfile(
        ctx,
        userId,
        typeof profile.role === "string" ? profile.role : undefined,
      );
    },
  },
});
