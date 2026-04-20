import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get stats for a specific game
export const getByGameId = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameStats")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
  },
});

// Get stats for a specific player
export const getByPlayerId = query({
  args: { playerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameStats")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerId))
      .collect();
  },
});

// Get stats for a specific game and player
export const getByGameAndPlayer = query({
  args: { gameId: v.id("games"), playerId: v.id("users") },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query("gameStats")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();
    return stats.find((s) => s.playerId === args.playerId);
  },
});

// Create game stats
export const create = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("users"),
    teamId: v.optional(v.id("teams")),
    points: v.optional(v.number()),
    assists: v.optional(v.number()),
    rebounds: v.optional(v.number()),
    minutesPlayed: v.optional(v.number()),
    fouls: v.optional(v.number()),
    steals: v.optional(v.number()),
    blocks: v.optional(v.number()),
    turnovers: v.optional(v.number()),
    fieldGoalsMade: v.optional(v.number()),
    fieldGoalsAttempted: v.optional(v.number()),
    threePointersMade: v.optional(v.number()),
    threePointersAttempted: v.optional(v.number()),
    freeThrowsMade: v.optional(v.number()),
    freeThrowsAttempted: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const statsId = await ctx.db.insert("gameStats", {
      ...args,
      createdAt: Date.now(),
    });
    return statsId;
  },
});

// Update game stats
export const update = mutation({
  args: {
    id: v.id("gameStats"),
    points: v.optional(v.number()),
    assists: v.optional(v.number()),
    rebounds: v.optional(v.number()),
    minutesPlayed: v.optional(v.number()),
    fouls: v.optional(v.number()),
    steals: v.optional(v.number()),
    blocks: v.optional(v.number()),
    turnovers: v.optional(v.number()),
    fieldGoalsMade: v.optional(v.number()),
    fieldGoalsAttempted: v.optional(v.number()),
    threePointersMade: v.optional(v.number()),
    threePointersAttempted: v.optional(v.number()),
    freeThrowsMade: v.optional(v.number()),
    freeThrowsAttempted: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete game stats
export const remove = mutation({
  args: { id: v.id("gameStats") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
