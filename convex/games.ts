import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";

export const getGames = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    teamId: v.optional(v.id("teams")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    let games = await ctx.db.query("games").collect();
    if (args.status) {
      games = games.filter((game) => game.status === args.status);
    }
    if (args.teamId) {
      games = games.filter(
        (game) => game.team1Id === args.teamId || game.team2Id === args.teamId,
      );
    }

    games.sort((a, b) => b.date - a.date);
    return await Promise.all(
      games.slice(0, args.limit || 50).map(async (game) => {
        const [team1, team2, creator] = await Promise.all([
          ctx.db.get(game.team1Id),
          ctx.db.get(game.team2Id),
          ctx.db.get(game.createdBy),
        ]);

        return {
          ...game,
          team1,
          team2,
          creator: creator
            ? {
                _id: creator._id,
                full_name: creator.full_name || creator.name || creator.email || "User",
              }
            : null,
        };
      }),
    );
  },
});

export const createGame = mutation({
  args: {
    sessionUserId: v.id("users"),
    name: v.string(),
    team1Id: v.id("teams"),
    team2Id: v.id("teams"),
    date: v.number(),
    location: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const [team1, team2] = await Promise.all([
      ctx.db.get(args.team1Id),
      ctx.db.get(args.team2Id),
    ]);

    if (!team1 || !team2) {
      throw new Error("One or both teams not found");
    }
    if (args.team1Id === args.team2Id) {
      throw new Error("Teams must be different");
    }

    const now = Date.now();
    const gameId = await ctx.db.insert("games", {
      name: args.name,
      team1Id: args.team1Id,
      team2Id: args.team2Id,
      date: args.date,
      location: args.location,
      status: "scheduled",
      notes: args.notes,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, gameId };
  },
});

export const updateGame = mutation({
  args: {
    sessionUserId: v.id("users"),
    gameId: v.id("games"),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
    score1: v.optional(v.number()),
    score2: v.optional(v.number()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    let hasPermission = game.createdBy === user._id;
    if (!hasPermission) {
      const [team1, team2] = await Promise.all([
        ctx.db.get(game.team1Id),
        ctx.db.get(game.team2Id),
      ]);
      if ((team1 && team1.coachId === user._id) || (team2 && team2.coachId === user._id)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new Error("Not authorized to update this game");
    }

    const updateData: Record<string, any> = { updatedAt: Date.now() };
    if (args.status !== undefined) updateData.status = args.status;
    if (args.score1 !== undefined) updateData.score1 = args.score1;
    if (args.score2 !== undefined) updateData.score2 = args.score2;
    if (args.notes !== undefined) updateData.notes = args.notes;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.date !== undefined) updateData.date = args.date;

    await ctx.db.patch(args.gameId, updateData);
    return { success: true };
  },
});

export const deleteGame = mutation({
  args: {
    sessionUserId: v.id("users"),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    let hasPermission = game.createdBy === user._id;
    if (!hasPermission) {
      const [team1, team2] = await Promise.all([
        ctx.db.get(game.team1Id),
        ctx.db.get(game.team2Id),
      ]);
      if ((team1 && team1.coachId === user._id) || (team2 && team2.coachId === user._id)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new Error("Not authorized to delete this game");
    }

    await ctx.db.delete(args.gameId);
    return { success: true };
  },
});

export const getMyTeamGames = query({
  args: {
    sessionUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const userTeams: any[] = [];

    if (user.role === "COACH") {
      const coachProfile = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (coachProfile?.teamId) userTeams.push(coachProfile.teamId);
    } else if (user.role === "PLAYER") {
      const playerProfile = await ctx.db
        .query("players")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (playerProfile?.teamId) userTeams.push(playerProfile.teamId);
    }

    if (userTeams.length === 0) return [];

    const allGames = await ctx.db.query("games").collect();
    const userGames = allGames
      .filter(
        (game) => userTeams.includes(game.team1Id) || userTeams.includes(game.team2Id),
      )
      .sort((a, b) => b.date - a.date);

    return await Promise.all(
      userGames.slice(0, args.limit || 50).map(async (game) => {
        const [team1, team2] = await Promise.all([
          ctx.db.get(game.team1Id),
          ctx.db.get(game.team2Id),
        ]);
        return {
          ...game,
          team1,
          team2,
        };
      }),
    );
  },
});
