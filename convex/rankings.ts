import { v } from "convex/values";
import { query } from "./_generated/server";

interface PlayerStats {
  userId: string;
  fullName: string;
  avatar: string | undefined;
  position: string | undefined;
  gamesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  wins: number;
  losses: number;
  goals: number;
}

export const getRankingsByGoals = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const allStats = await ctx.db.query("gameStats").collect();
    
    const playerTotals = new Map<string, PlayerStats>();
    
    for (const stat of allStats) {
      const user = await ctx.db.get(stat.playerId);
      if (!user) continue;
      
      const existing = playerTotals.get(stat.playerId) || {
        userId: stat.playerId,
        fullName: user.full_name,
        avatar: user.avatar,
        position: undefined,
        gamesPlayed: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
        wins: 0,
        losses: 0,
        goals: 0,
      };
      
      const game = await ctx.db.get(stat.gameId);
      if (game) {
        existing.gamesPlayed += 1;
        existing.points += stat.points || 0;
        existing.assists += stat.assists || 0;
        existing.rebounds += stat.rebounds || 0;
        existing.goals += stat.points || 0;
      }
      
      playerTotals.set(stat.playerId, existing);
    }
    
    const rankings = Array.from(playerTotals.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
    
    return rankings;
  },
});

export const getRankingsByAssists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const allStats = await ctx.db.query("gameStats").collect();
    
    const playerTotals = new Map<string, PlayerStats>();
    
    for (const stat of allStats) {
      const user = await ctx.db.get(stat.playerId);
      if (!user) continue;
      
      const existing = playerTotals.get(stat.playerId) || {
        userId: stat.playerId,
        fullName: user.full_name,
        avatar: user.avatar,
        position: undefined,
        gamesPlayed: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
        wins: 0,
        losses: 0,
        goals: 0,
      };
      
      existing.gamesPlayed += 1;
      existing.assists += stat.assists || 0;
      existing.points += stat.points || 0;
      existing.goals += stat.points || 0;
      
      playerTotals.set(stat.playerId, existing);
    }
    
    const rankings = Array.from(playerTotals.values())
      .sort((a, b) => b.assists - a.assists)
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
    
    return rankings;
  },
});

export const getRankingsByGamesPlayed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const allStats = await ctx.db.query("gameStats").collect();
    
    const playerTotals = new Map<string, PlayerStats>();
    
    for (const stat of allStats) {
      const user = await ctx.db.get(stat.playerId);
      if (!user) continue;
      
      const existing = playerTotals.get(stat.playerId) || {
        userId: stat.playerId,
        fullName: user.full_name,
        avatar: user.avatar,
        position: undefined,
        gamesPlayed: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
        wins: 0,
        losses: 0,
        goals: 0,
      };
      
      existing.gamesPlayed += 1;
      existing.assists += stat.assists || 0;
      existing.points += stat.points || 0;
      existing.goals += stat.points || 0;
      
      playerTotals.set(stat.playerId, existing);
    }
    
    const rankings = Array.from(playerTotals.values())
      .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
    
    return rankings;
  },
});

export const getRankingsByPoints = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const allStats = await ctx.db.query("gameStats").collect();
    
    const playerTotals = new Map<string, PlayerStats>();
    
    for (const stat of allStats) {
      const user = await ctx.db.get(stat.playerId);
      if (!user) continue;
      
      const existing = playerTotals.get(stat.playerId) || {
        userId: stat.playerId,
        fullName: user.full_name,
        avatar: user.avatar,
        position: undefined,
        gamesPlayed: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
        wins: 0,
        losses: 0,
        goals: 0,
      };
      
      existing.gamesPlayed += 1;
      existing.assists += stat.assists || 0;
      existing.points += stat.points || 0;
      existing.rebounds += stat.rebounds || 0;
      existing.goals += stat.points || 0;
      
      playerTotals.set(stat.playerId, existing);
    }
    
    const rankings = Array.from(playerTotals.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
    
    return rankings;
  },
});

export const getRankingsByRebounds = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const allStats = await ctx.db.query("gameStats").collect();
    
    const playerTotals = new Map<string, PlayerStats>();
    
    for (const stat of allStats) {
      const user = await ctx.db.get(stat.playerId);
      if (!user) continue;
      
      const existing = playerTotals.get(stat.playerId) || {
        userId: stat.playerId,
        fullName: user.full_name,
        avatar: user.avatar,
        position: undefined,
        gamesPlayed: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
        wins: 0,
        losses: 0,
        goals: 0,
      };
      
      existing.gamesPlayed += 1;
      existing.rebounds += stat.rebounds || 0;
      existing.points += stat.points || 0;
      existing.goals += stat.points || 0;
      
      playerTotals.set(stat.playerId, existing);
    }
    
    const rankings = Array.from(playerTotals.values())
      .sort((a, b) => b.rebounds - a.rebounds)
      .slice(0, limit)
      .map((player, index) => ({
        ...player,
        rank: index + 1,
      }));
    
    return rankings;
  },
});
