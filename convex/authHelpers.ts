import type { Id } from "./_generated/dataModel";

type ConvexCtx = {
  db: any;
  auth: {
    getUserIdentity: () => Promise<{ email?: string | null } | null>;
  };
};

export async function resolveSessionUser(
  ctx: ConvexCtx,
  sessionUserId?: Id<"users">,
) {
  if (sessionUserId) {
    return await ctx.db.get(sessionUserId);
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.email) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_email", (q: any) => q.eq("email", identity.email))
    .first();
}

export async function requireSessionUser(
  ctx: ConvexCtx,
  sessionUserId?: Id<"users">,
) {
  const user = await resolveSessionUser(ctx, sessionUserId);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
