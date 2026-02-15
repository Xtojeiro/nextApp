import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getObservedAthletes = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const scout = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!scout || scout.role !== "SCOUT") {
      throw new Error("Not authorized");
    }

    const allPlayers = await ctx.db.query("players").collect();

    const observedAthletes = await Promise.all(
      allPlayers.slice(0, args.limit || 50).map(async (player) => {
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

    return observedAthletes;
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
    position: v.optional(v.string()),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
    location: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let players = await ctx.db.query("players").collect();

    if (args.position) {
      players = players.filter((p) => p.position === args.position);
    }

    const users = await Promise.all(
      players.map(async (player) => {
        const user = await ctx.db.get(player.userId);
        return { player, user };
      }),
    );

    let filtered = users.filter(({ user, player }) => {
      if (!user) return false;
      if (args.minAge !== undefined && (user.age || 0) < args.minAge) return false;
      if (args.maxAge !== undefined && (user.age || 0) > args.maxAge) return false;
      if (args.location && !user.location?.toLowerCase().includes(args.location.toLowerCase()))
        return false;
      return true;
    });

    return filtered
      .map(({ player, user }) => ({
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
      }))
      .slice(0, args.limit || 50);
  },
});

export const createScoutReport = mutation({
  args: {
    athleteId: v.id("users"),
    content: v.string(),
    rating: v.optional(v.number()),
    position: v.optional(v.string()),
    strengths: v.optional(v.array(v.string())),
    weaknesses: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const scout = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!scout || scout.role !== "SCOUT") {
      throw new Error("Only scouts can create reports");
    }

    const athlete = await ctx.db.get(args.athleteId);
    if (!athlete) {
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

    return { success: true, reportId };
  },
});

export const getScoutReports = query({
  args: {
    athleteId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let reports = await ctx.db.query("scoutReports").collect();

    if (args.athleteId) {
      reports = reports.filter((r) => r.athleteId === args.athleteId);
    }

    reports.sort((a, b) => b.createdAt - a.createdAt);

    return reports.slice(0, args.limit || 50);
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
