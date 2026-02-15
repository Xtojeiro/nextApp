import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createInvite = mutation({
  args: {
    athleteId: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!coach || coach.role !== "COACH") {
      throw new Error("Only coaches can send invites");
    }

    const athlete = await ctx.db.get(args.athleteId);
    if (!athlete) {
      throw new Error("Athlete not found");
    }

    const existingInvite = await ctx.db
      .query("invites")
      .filter((q) =>
        q.and(
          q.eq(q.field("coachId"), coach._id),
          q.eq(q.field("athleteId"), args.athleteId),
        ),
      )
      .first();

    if (existingInvite && existingInvite.status === "pending") {
      throw new Error("Invite already sent");
    }

    const inviteId = await ctx.db.insert("invites", {
      coachId: coach._id,
      athleteId: args.athleteId,
      status: "pending",
      message: args.message,
      createdAt: Date.now(),
    });

    return { success: true, inviteId };
  },
});

export const getPendingInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === "COACH") {
      const invites = await ctx.db
        .query("invites")
        .withIndex("by_coachId", (q) => q.eq("coachId", user._id))
        .collect();

      const invitesWithAthletes = await Promise.all(
        invites.map(async (invite) => {
          const athlete = await ctx.db.get(invite.athleteId);
          return {
            ...invite,
            athlete: athlete
              ? {
                  _id: athlete._id,
                  full_name: athlete.full_name,
                  avatar: athlete.avatar,
                }
              : null,
          };
        }),
      );

      return invitesWithAthletes;
    } else {
      const invites = await ctx.db
        .query("invites")
        .withIndex("by_athleteId", (q) => q.eq("athleteId", user._id))
        .collect();

      const invitesWithCoaches = await Promise.all(
        invites.map(async (invite) => {
          const coach = await ctx.db.get(invite.coachId);
          return {
            ...invite,
            coach: coach
              ? {
                  _id: coach._id,
                  full_name: coach.full_name,
                  avatar: coach.avatar,
                }
              : null,
          };
        }),
      );

      return invitesWithCoaches;
    }
  },
});

export const respondToInvite = mutation({
  args: {
    inviteId: v.id("invites"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    if (invite.athleteId !== user._id) {
      throw new Error("Not authorized");
    }

    if (invite.status !== "pending") {
      throw new Error("Invite already responded");
    }

    await ctx.db.patch(args.inviteId, {
      status: args.accept ? "accepted" : "rejected",
    });

    if (args.accept) {
      const playerProfile = await ctx.db
        .query("players")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();

      if (playerProfile) {
        const coachProfile = await ctx.db
          .query("coaches")
          .withIndex("by_userId", (q) => q.eq("userId", invite.coachId))
          .first();

        if (coachProfile) {
          await ctx.db.patch(playerProfile._id, {
            coachId: invite.coachId,
          });
        }
      }
    }

    return { success: true };
  },
});

export const getCoachInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!coach || coach.role !== "COACH") {
      throw new Error("Only coaches can view their invites");
    }

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_coachId", (q) => q.eq("coachId", coach._id))
      .collect();

    return invites;
  },
});
