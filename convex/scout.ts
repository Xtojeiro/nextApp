import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";

export const getObservedAthletes = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const scout = await requireSessionUser(ctx, args.sessionUserId);
    if (scout?.role !== "SCOUT") {
      throw new Error("Not authorized");
    }

    const observed = await ctx.db
      .query("scoutObservedAthletes")
      .withIndex("by_scoutId", (q) => q.eq("scoutId", scout._id))
      .collect();

    const observedAthletes = await Promise.all(
      observed.slice(0, args.limit || 50).map(async (item) => {
        const player = await ctx.db
          .query("players")
          .withIndex("by_userId", (q) => q.eq("userId", item.athleteId))
          .first();
        if (!player) return null;
        const user = await ctx.db.get(item.athleteId);
        const team = player.teamId ? await ctx.db.get(player.teamId) : null;
        return {
          ...player,
          observedAt: item.createdAt,
          user: user
            ? {
                _id: user._id,
                full_name: user.full_name,
                avatar: user.avatar,
                location: user.location,
                age: user.age,
              }
            : null,
          team,
        };
      }),
    );

    return observedAthletes.filter(Boolean);
  },
});

export const addObservedAthlete = mutation({
  args: {
    sessionUserId: v.optional(v.id("users")),
    athleteId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const scout = await requireSessionUser(ctx, args.sessionUserId);
    if (scout?.role !== "SCOUT") {
      throw new Error("Only scouts can add observed athletes");
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.athleteId))
      .first();
    if (!player) {
      throw new Error("Athlete not found");
    }

    const existing = await ctx.db
      .query("scoutObservedAthletes")
      .withIndex("by_scoutId", (q) => q.eq("scoutId", scout._id))
      .filter((q) => q.eq(q.field("athleteId"), args.athleteId))
      .first();

    if (existing) {
      return { success: true, observedAthleteId: existing._id };
    }

    const observedAthleteId = await ctx.db.insert("scoutObservedAthletes", {
      scoutId: scout._id,
      athleteId: args.athleteId,
      createdAt: Date.now(),
    });

    return { success: true, observedAthleteId };
  },
});

export const getFeaturedAthletes = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allPlayers = await ctx.db.query("players").collect();

    const featured = await Promise.all(
      allPlayers.slice(0, args.limit || 10).map(async (player) => {
        const user = await ctx.db.get(player.userId);
        const team = player.teamId ? await ctx.db.get(player.teamId) : null;
        return {
          ...player,
          user: user
            ? {
                _id: user._id,
                full_name: user.full_name,
                avatar: user.avatar,
                location: user.location,
                age: user.age,
              }
            : null,
          team,
        };
      }),
    );

    return featured;
  },
});

export const searchAthletesAdvanced = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    query: v.optional(v.string()),
    position: v.optional(v.string()),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
    location: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSessionUser(ctx, args.sessionUserId);

    let players = await ctx.db.query("players").collect();

    if (args.position) {
      players = players.filter((p) => p.position === args.position);
    }

    const users = await Promise.all(
      players.map(async (player) => {
        const [user, team] = await Promise.all([
          ctx.db.get(player.userId),
          player.teamId ? ctx.db.get(player.teamId) : null,
        ]);
        return { player, team, user };
      }),
    );

    let filtered = users.filter(({ player, team, user }) => {
      if (!user) return false;
      if (args.minAge !== undefined && (user.age || 0) < args.minAge) return false;
      if (args.maxAge !== undefined && (user.age || 0) > args.maxAge) return false;
      if (args.location && !user.location?.toLowerCase().includes(args.location.toLowerCase()))
        return false;
      if (args.query?.trim()) {
        const search = args.query.trim().toLowerCase();
        const searchable = [
          user.full_name,
          user.name,
          user.email,
          user.location,
          player.position,
          team?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(search)) return false;
      }
      return true;
    });

    return filtered
      .map(({ player, team, user }) => ({
        ...player,
        user: user
          ? {
              _id: user._id,
              full_name: user.full_name,
              avatar: user.avatar,
              location: user.location,
              age: user.age,
            }
          : null,
        team,
      }))
      .slice(0, args.limit || 50);
  },
});

export const createScoutReport = mutation({
  args: {
    sessionUserId: v.optional(v.id("users")),
    athleteId: v.id("users"),
    content: v.string(),
    rating: v.optional(v.number()),
    position: v.optional(v.string()),
    strengths: v.optional(v.array(v.string())),
    weaknesses: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const scout = await requireSessionUser(ctx, args.sessionUserId);

    if (scout?.role !== "SCOUT") {
      throw new Error("Only scouts can create reports");
    }

    const athlete = await ctx.db.get(args.athleteId);
    if (!athlete) {
      throw new Error("Athlete not found");
    }
    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.athleteId))
      .first();
    if (!player) {
      throw new Error("Athlete not found");
    }

    const reportId = await ctx.db.insert("scoutReports", {
      scoutId: scout._id,
      athleteId: args.athleteId,
      content: args.content,
      rating: args.rating,
      position: args.position,
      strengths: args.strengths,
      weaknesses: args.weaknesses,
      createdAt: Date.now(),
    });

    const existingObserved = await ctx.db
      .query("scoutObservedAthletes")
      .withIndex("by_scoutId", (q) => q.eq("scoutId", scout._id))
      .filter((q) => q.eq(q.field("athleteId"), args.athleteId))
      .first();

    if (!existingObserved) {
      await ctx.db.insert("scoutObservedAthletes", {
        scoutId: scout._id,
        athleteId: args.athleteId,
        createdAt: Date.now(),
      });
    }

    return { success: true, reportId };
  },
});

export const getScoutReports = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    athleteId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    let reports = await ctx.db.query("scoutReports").collect();

    if (args.athleteId) {
      reports = reports.filter((r) => r.athleteId === args.athleteId);
    } else if (currentUser?.role === "SCOUT") {
      reports = reports.filter((r) => r.scoutId === currentUser._id);
    } else {
      reports = [];
    }

    reports.sort((a, b) => b.createdAt - a.createdAt);

    const limitedReports = reports.slice(0, args.limit || 50);

    return await Promise.all(
      limitedReports.map(async (report) => {
        const [athlete, scout] = await Promise.all([
          ctx.db.get(report.athleteId),
          ctx.db.get(report.scoutId),
        ]);

        return {
          ...report,
          athlete: athlete
            ? {
                _id: athlete._id,
                full_name: athlete.full_name || athlete.name,
                avatar: athlete.avatar,
                location: athlete.location,
              }
            : null,
          scout: scout
            ? {
                _id: scout._id,
                full_name: scout.full_name || scout.name,
              }
            : null,
        };
      }),
    );
  },
});

export const getAthleteReports = query({
  args: {
    athleteId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const reports = await ctx.db
      .query("scoutReports")
      .filter((q) => q.eq(q.field("athleteId"), args.athleteId))
      .collect();

    const reportsWithScouts = await Promise.all(
      reports.map(async (report) => {
        const scout = await ctx.db.get(report.scoutId);
        return {
          ...report,
          scout: scout
            ? {
                _id: scout._id,
                full_name: scout.full_name,
              }
            : null,
        };
      }),
    );

    return reportsWithScouts;
  },
});
