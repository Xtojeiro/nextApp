import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";
import {
  assertFutureTimestamp,
  assertNonNegativeInteger,
  cleanOptionalText,
  cleanText,
} from "./validation";

async function getGameTeams(ctx: any, game: any) {
  const [team1, team2] = await Promise.all([
    ctx.db.get(game.team1Id),
    ctx.db.get(game.team2Id),
  ]);
  if (!team1 || !team2) {
    throw new Error("One or both teams not found");
  }
  return { team1, team2 };
}

function getCoachTeamSide(userId: any, team1: any, team2: any) {
  if (team1.coachId === userId) return "team1";
  if (team2.coachId === userId) return "team2";
  return null;
}

function getOpponentCoachId(coachSide: "team1" | "team2", team1: any, team2: any) {
  return coachSide === "team1" ? team2.coachId : team1.coachId;
}

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
    assertFutureTimestamp(args.date, "Game date");

    const now = Date.now();
    const gameId = await ctx.db.insert("games", {
      name: cleanText(args.name, "Game name"),
      team1Id: args.team1Id,
      team2Id: args.team2Id,
      date: args.date,
      location: cleanText(args.location, "Location", 120),
      status: "scheduled",
      notes: cleanOptionalText(args.notes, "Notes"),
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

    const { team1, team2 } = await getGameTeams(ctx, game);
    const coachSide = getCoachTeamSide(user._id, team1, team2);
    let hasPermission = game.createdBy === user._id || coachSide !== null;

    if (!hasPermission) {
      throw new Error("Not authorized to update this game");
    }

    const targetDate = args.date ?? game.date;
    const targetStatus = args.status ?? game.status;
    if (targetStatus === "scheduled" || targetStatus === "in_progress") {
      assertFutureTimestamp(targetDate, "Game date");
    }

    const score1 =
      args.score1 !== undefined
        ? assertNonNegativeInteger(args.score1, "Score 1")
        : game.score1;
    const score2 =
      args.score2 !== undefined
        ? assertNonNegativeInteger(args.score2, "Score 2")
        : game.score2;

    const updateData: Record<string, any> = { updatedAt: Date.now() };
    if (args.status !== undefined) updateData.status = args.status;
    if (args.notes !== undefined) updateData.notes = cleanOptionalText(args.notes, "Notes");
    if (args.location !== undefined) updateData.location = cleanText(args.location, "Location", 120);
    if (args.date !== undefined) updateData.date = args.date;

    const isSubmittingCompletedResult =
      targetStatus === "completed" &&
      (args.status === "completed" || args.score1 !== undefined || args.score2 !== undefined);

    if (isSubmittingCompletedResult) {
      if (!coachSide) {
        throw new Error("Only a team coach can submit a game result");
      }
      if (score1 === undefined || score2 === undefined) {
        throw new Error("Both scores are required to submit a completed result");
      }

      delete updateData.status;
      updateData.pendingScore1 = score1;
      updateData.pendingScore2 = score2;
      updateData.pendingStatus = "completed";
      updateData.resultStatus = "pending_approval";
      updateData.submittedBy = user._id;
      updateData.submittedAt = Date.now();
      updateData.approvedBy = undefined;
      updateData.approvedAt = undefined;
      updateData.rejectedBy = undefined;
      updateData.rejectedAt = undefined;
    } else {
      if (args.score1 !== undefined) updateData.score1 = score1;
      if (args.score2 !== undefined) updateData.score2 = score2;
    }

    await ctx.db.patch(args.gameId, updateData);
    return { success: true };
  },
});

export const approveGameResult = mutation({
  args: {
    sessionUserId: v.id("users"),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.resultStatus !== "pending_approval") {
      throw new Error("This game does not have a pending result");
    }
    if (
      game.pendingScore1 === undefined ||
      game.pendingScore2 === undefined ||
      !game.pendingStatus ||
      !game.submittedBy
    ) {
      throw new Error("Pending result is incomplete");
    }

    const { team1, team2 } = await getGameTeams(ctx, game);
    const submitterSide = getCoachTeamSide(game.submittedBy, team1, team2);
    if (!submitterSide) {
      throw new Error("Submitting coach is not linked to this game");
    }
    if (getOpponentCoachId(submitterSide, team1, team2) !== user._id) {
      throw new Error("Only the opposing coach can approve this result");
    }

    await ctx.db.patch(args.gameId, {
      status: game.pendingStatus,
      score1: game.pendingScore1,
      score2: game.pendingScore2,
      resultStatus: "approved",
      approvedBy: user._id,
      approvedAt: Date.now(),
      rejectedBy: undefined,
      rejectedAt: undefined,
      pendingScore1: undefined,
      pendingScore2: undefined,
      pendingStatus: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const rejectGameResult = mutation({
  args: {
    sessionUserId: v.id("users"),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.resultStatus !== "pending_approval") {
      throw new Error("This game does not have a pending result");
    }
    if (!game.submittedBy) {
      throw new Error("Pending result is incomplete");
    }

    const { team1, team2 } = await getGameTeams(ctx, game);
    const submitterSide = getCoachTeamSide(game.submittedBy, team1, team2);
    if (!submitterSide) {
      throw new Error("Submitting coach is not linked to this game");
    }
    if (getOpponentCoachId(submitterSide, team1, team2) !== user._id) {
      throw new Error("Only the opposing coach can reject this result");
    }

    await ctx.db.patch(args.gameId, {
      resultStatus: "rejected",
      rejectedBy: user._id,
      rejectedAt: Date.now(),
      approvedBy: undefined,
      approvedAt: undefined,
      pendingScore1: undefined,
      pendingScore2: undefined,
      pendingStatus: undefined,
      updatedAt: Date.now(),
    });

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
