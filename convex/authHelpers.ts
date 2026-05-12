import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

type ConvexCtx = {
  db: any;
  auth: any;
};

export async function resolveSessionUser(
  ctx: ConvexCtx,
  sessionUserId?: Id<"users">,
) {
  const authUserId = await getAuthUserId(ctx);
  if (authUserId) {
    return await ctx.db.get(authUserId);
  }

  return sessionUserId ? await ctx.db.get(sessionUserId) : null;
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
