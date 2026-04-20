import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all seasons
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("seasons").collect();
  },
});

// Get active season
export const getActive = query({
  handler: async (ctx) => {
    const seasons = await ctx.db
      .query("seasons")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return seasons[0];
  },
});

// Get season by ID
export const getById = query({
  args: { id: v.id("seasons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create season
export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Deactivate all other seasons
    const allSeasons = await ctx.db.query("seasons").collect();
    for (const season of allSeasons) {
      await ctx.db.patch(season._id, { isActive: false });
    }

    const seasonId = await ctx.db.insert("seasons", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
    return seasonId;
  },
});

// Update season
export const update = mutation({
  args: {
    id: v.id("seasons"),
    name: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If activating, deactivate others
    if (updates.isActive) {
      const allSeasons = await ctx.db.query("seasons").collect();
      for (const season of allSeasons) {
        if (season._id !== id) {
          await ctx.db.patch(season._id, { isActive: false });
        }
      }
    }

    await ctx.db.patch(id, updates);
  },
});

// Delete season
export const remove = mutation({
  args: { id: v.id("seasons") },
  handler: async (ctx, args) => {
    // Delete related leagues
    const leagues = await ctx.db
      .query("league")
      .withIndex("by_seasonId", (q) => q.eq("seasonId", args.id))
      .collect();

    for (const league of leagues) {
      // Delete league teams
      const leagueTeams = await ctx.db
        .query("leagueTeams")
        .withIndex("by_leagueId", (q) => q.eq("leagueId", league._id))
        .collect();

      for (const lt of leagueTeams) {
        await ctx.db.delete(lt._id);
      }

      await ctx.db.delete(league._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Get leagues
export const getLeagues = query({
  args: { seasonId: v.optional(v.id("seasons")) },
  handler: async (ctx, args) => {
    if (args.seasonId) {
      return await ctx.db
        .query("league")
        .withIndex("by_seasonId", (q) => q.eq("seasonId", args.seasonId!))
        .collect();
    }
    return await ctx.db.query("league").collect();
  },
});

// Get league by ID
export const getLeagueById = query({
  args: { id: v.id("league") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create league
export const createLeague = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    seasonId: v.optional(v.id("seasons")),
  },
  handler: async (ctx, args) => {
    const leagueId = await ctx.db.insert("league", {
      ...args,
      createdAt: Date.now(),
    });
    return leagueId;
  },
});

// Update league
export const updateLeague = mutation({
  args: {
    id: v.id("league"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete league
export const deleteLeague = mutation({
  args: { id: v.id("league") },
  handler: async (ctx, args) => {
    // Delete league teams
    const leagueTeams = await ctx.db
      .query("leagueTeams")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.id))
      .collect();

    for (const lt of leagueTeams) {
      await ctx.db.delete(lt._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Add team to league
export const addTeamToLeague = mutation({
  args: {
    leagueId: v.id("league"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    // Check if already in league
    const existing = await ctx.db
      .query("leagueTeams")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const alreadyIn = existing.some((lt) => lt.teamId === args.teamId);
    if (alreadyIn) {
      throw new Error("Team is already in this league");
    }

    const id = await ctx.db.insert("leagueTeams", {
      leagueId: args.leagueId,
      teamId: args.teamId,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
    });
    return id;
  },
});

// Remove team from league
export const removeTeamFromLeague = mutation({
  args: {
    leagueId: v.id("league"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const leagueTeams = await ctx.db
      .query("leagueTeams")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const leagueTeam = leagueTeams.find((lt) => lt.teamId === args.teamId);
    if (leagueTeam) {
      await ctx.db.delete(leagueTeam._id);
    }
  },
});

// Get league standings
export const getLeagueStandings = query({
  args: { leagueId: v.id("league") },
  handler: async (ctx, args) => {
    const leagueTeams = await ctx.db
      .query("leagueTeams")
      .withIndex("by_leagueId", (q) => q.eq("leagueId", args.leagueId))
      .collect();

    const standings = [];
    for (const lt of leagueTeams) {
      const team = await ctx.db.get(lt.teamId);
      if (team) {
        standings.push({ ...lt, team });
      }
    }

    // Sort by points, then wins
    return standings.sort((a, b) => {
      const pointsA = (a.points as number) ?? 0;
      const pointsB = (b.points as number) ?? 0;
      if (pointsB !== pointsA) return pointsB - pointsA;
      const winsA = (a.wins as number) ?? 0;
      const winsB = (b.wins as number) ?? 0;
      return winsB - winsA;
    });
  },
});

// Update team stats in league
export const updateTeamStats = mutation({
  args: {
    id: v.id("leagueTeams"),
    wins: v.optional(v.number()),
    losses: v.optional(v.number()),
    draws: v.optional(v.number()),
    points: v.optional(v.number()),
    rank: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});
