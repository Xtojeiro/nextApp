import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";
import { cleanOptionalText, cleanText } from "./validation";

const emptyTeamStats = { totalGames: 0, wins: 0, losses: 0, draws: 0 };

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(timestamp: number) {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function calculateBestStreak(timestamps: number[]) {
  const days = Array.from(new Set(timestamps.map(startOfUtcDay))).sort((a, b) => a - b);
  let best = 0;
  let current = 0;
  let previousDay: number | null = null;

  for (const day of days) {
    current = previousDay !== null && day === previousDay + DAY_MS ? current + 1 : 1;
    best = Math.max(best, current);
    previousDay = day;
  }

  return best;
}

function calculateCurrentStreak(timestamps: number[], now: number) {
  const days = new Set(timestamps.map(startOfUtcDay));
  let day = startOfUtcDay(now);

  if (!days.has(day)) {
    day -= DAY_MS;
  }

  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= DAY_MS;
  }

  return streak;
}

function calculateProgressScore(args: {
  monthlyFrequency: number;
  currentStreak: number;
  presentAttendance: number;
  totalAttendance: number;
}) {
  const workoutScore = Math.min(args.monthlyFrequency / 16, 1) * 60;
  const attendanceScore =
    args.totalAttendance > 0 ? (args.presentAttendance / args.totalAttendance) * 30 : 0;
  const streakScore = Math.min(args.currentStreak / 7, 1) * 10;

  return Math.round(workoutScore + attendanceScore + streakScore);
}

async function resolveTeamIdForStats(ctx: any, user: any, requestedTeamId?: any) {
  if (requestedTeamId) {
    return requestedTeamId;
  }
  if (user.role !== "COACH") {
    return undefined;
  }

  const coach = await ctx.db
    .query("coaches")
    .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
    .first();

  return coach?.teamId;
}

function getGameResultForTeam(game: any, targetTeamId: any) {
  if (game.score1 === undefined || game.score2 === undefined) {
    return null;
  }

  const isTeam1 = game.team1Id === targetTeamId;
  const teamScore = isTeam1 ? game.score1 : game.score2;
  const opponentScore = isTeam1 ? game.score2 : game.score1;

  if (teamScore > opponentScore) return "wins";
  if (teamScore < opponentScore) return "losses";
  return "draws";
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export const getTeam = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return null;
    }

    let targetTeamId = args.teamId;
    if (!targetTeamId) {
      if (user.role === "COACH") {
        const coach = await ctx.db
          .query("coaches")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first();
        if (coach?.teamId) targetTeamId = coach.teamId;
      } else if (user.role === "PLAYER") {
        const player = await ctx.db
          .query("players")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first();
        if (player?.teamId) targetTeamId = player.teamId;
      }
    }

    return targetTeamId ? await ctx.db.get(targetTeamId) : null;
  },
});

export const listTeams = query({
  args: {
    excludeTeamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const teams = await ctx.db.query("teams").collect();
    return teams.filter((team) => team._id !== args.excludeTeamId);
  },
});

export const getTeamAthletes = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    let targetTeamId = args.teamId;
    if (!targetTeamId && user.role === "COACH") {
      const coach = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (coach?.teamId) targetTeamId = coach.teamId;
    }

    if (!targetTeamId) {
      return [];
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", targetTeamId))
      .collect();

    return await Promise.all(
      players.map(async (player) => {
        const athleteUser = await ctx.db.get(player.userId);
        return {
          ...player,
          user: athleteUser
            ? {
                _id: athleteUser._id,
                full_name: athleteUser.full_name,
                avatar: athleteUser.avatar,
                email: athleteUser.email,
                bio: athleteUser.bio,
                role: athleteUser.role,
              }
            : null,
        };
      }),
    );
  },
});

export const getTeamPerformanceAnalysis = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (user?.role !== "COACH") {
      return [];
    }

    let targetTeamId = args.teamId;
    if (!targetTeamId) {
      const coach = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      targetTeamId = coach?.teamId;
    }

    if (!targetTeamId) {
      return [];
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", targetTeamId))
      .collect();

    const now = Date.now();
    const weekStart = now - 7 * DAY_MS;
    const monthStart = now - 30 * DAY_MS;
    const quarterStart = now - 90 * DAY_MS;

    return await Promise.all(
      players.map(async (player) => {
        const [athleteUser, workoutLogs, attendanceRecords] = await Promise.all([
          ctx.db.get(player.userId),
          ctx.db
            .query("workoutLogs")
            .withIndex("by_userId", (q) => q.eq("userId", player.userId))
            .collect(),
          ctx.db
            .query("attendance")
            .withIndex("by_userId", (q) => q.eq("userId", player.userId))
            .collect(),
        ]);

        const completedDates = workoutLogs.map((log) => log.completedDate);
        const weeklyFrequency = completedDates.filter((date) => date >= weekStart).length;
        const monthlyFrequency = completedDates.filter((date) => date >= monthStart).length;
        const quarterlyFrequency = completedDates.filter((date) => date >= quarterStart).length;
        const currentStreak = calculateCurrentStreak(completedDates, now);
        const bestStreak = calculateBestStreak(completedDates);
        const relevantAttendance = attendanceRecords.filter(
          (record) => record.status !== "pending",
        );
        const presentAttendance = relevantAttendance.filter(
          (record) => record.status === "present",
        ).length;

        return {
          id: player.userId,
          name:
            athleteUser?.full_name ||
            athleteUser?.name ||
            athleteUser?.email ||
            "Atleta",
          position: player.position || "Sem posição",
          weeklyFrequency,
          monthlyFrequency,
          quarterlyFrequency,
          totalWorkouts: workoutLogs.length,
          currentStreak,
          bestStreak,
          progressScore: calculateProgressScore({
            monthlyFrequency,
            currentStreak,
            presentAttendance,
            totalAttendance: relevantAttendance.length,
          }),
        };
      }),
    );
  },
});

export const searchAvailableAthletes = query({
  args: {
    sessionUserId: v.id("users"),
    query: v.string(),
    teamId: v.optional(v.id("teams")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const coach = await requireSessionUser(ctx, args.sessionUserId);
    if (coach.role !== "COACH") {
      return [];
    }

    let targetTeamId = args.teamId;
    if (!targetTeamId) {
      const coachProfile = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", coach._id))
        .first();
      targetTeamId = coachProfile?.teamId;
    }
    if (!targetTeamId) {
      return [];
    }

    const search = normalizeSearchText(cleanText(args.query, "Search query", 80));
    const limit = args.limit || 20;
    const players = await ctx.db.query("players").collect();
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_coachId", (q) => q.eq("coachId", coach._id))
      .collect();
    const inviteByAthlete = new Map(invites.map((invite) => [invite.athleteId, invite]));

    const results = [];
    for (const player of players) {
      if (player.teamId === targetTeamId) continue;
      const athleteUser = await ctx.db.get(player.userId);
      if (!athleteUser || athleteUser.role !== "PLAYER" || athleteUser.is_public === false) continue;

      const searchable = normalizeSearchText(
        [
          athleteUser.full_name,
          athleteUser.name,
          athleteUser.email,
          athleteUser.bio,
          athleteUser.location,
          player.position,
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (!searchable.includes(search)) continue;
      const invite = inviteByAthlete.get(athleteUser._id);
      results.push({
        playerId: player._id,
        athleteId: athleteUser._id,
        full_name: athleteUser.full_name || athleteUser.name || athleteUser.email || "Atleta",
        email: athleteUser.email,
        avatar: athleteUser.avatar,
        bio: athleteUser.bio,
        position: player.position,
        teamId: player.teamId,
        inviteStatus: invite?.status,
      });

      if (results.length >= limit) break;
    }

    return results;
  },
});

export const createTeam = mutation({
  args: {
    sessionUserId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    if (user.role !== "COACH") {
      throw new Error("Only coaches can create teams");
    }

    const now = Date.now();
    const teamId = await ctx.db.insert("teams", {
      name: cleanText(args.name, "Team name"),
      description: cleanOptionalText(args.description, "Description"),
      coachId: user._id,
      createdAt: now,
      updatedAt: now,
    });

    const coachProfile = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (coachProfile) {
      await ctx.db.patch(coachProfile._id, { teamId });
    } else {
      await ctx.db.insert("coaches", { userId: user._id, teamId });
    }

    return { success: true, teamId };
  },
});

export const associateCoachToTeam = mutation({
  args: {
    sessionUserId: v.id("users"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    if (user.role !== "COACH") {
      throw new Error("Only coaches can associate with a team");
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const now = Date.now();
    if (team.coachId !== user._id) {
      const previousCoachProfile = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", team.coachId))
        .first();
      if (previousCoachProfile?.teamId === args.teamId) {
        await ctx.db.patch(previousCoachProfile._id, { teamId: undefined });
      }
    }

    await ctx.db.patch(args.teamId, {
      coachId: user._id,
      updatedAt: now,
    });

    const coachProfile = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (coachProfile) {
      await ctx.db.patch(coachProfile._id, { teamId: args.teamId });
    } else {
      await ctx.db.insert("coaches", { userId: user._id, teamId: args.teamId });
    }

    return { success: true };
  },
});

export const updateTeam = mutation({
  args: {
    sessionUserId: v.id("users"),
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (team.coachId !== user._id) throw new Error("Not authorized to update this team");

    const updateData: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = cleanText(args.name, "Team name");
    if (args.description !== undefined) updateData.description = cleanOptionalText(args.description, "Description");
    if (args.logo !== undefined) updateData.logo = args.logo;

    await ctx.db.patch(args.teamId, updateData);
    return { success: true };
  },
});

export const addAthleteToTeam = mutation({
  args: {
    sessionUserId: v.id("users"),
    teamId: v.id("teams"),
    athleteId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (team.coachId !== user._id) {
      throw new Error("Not authorized to add athletes to this team");
    }

    const playerProfile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.athleteId))
      .first();
    if (playerProfile) {
      await ctx.db.patch(playerProfile._id, { teamId: args.teamId });
    }

    return { success: true };
  },
});

export const removeAthleteFromTeam = mutation({
  args: {
    sessionUserId: v.id("users"),
    teamId: v.id("teams"),
    athleteId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");
    if (team.coachId !== user._id) {
      throw new Error("Not authorized to remove athletes from this team");
    }

    const playerProfile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", args.athleteId))
      .first();
    if (playerProfile) {
      await ctx.db.patch(playerProfile._id, { teamId: undefined });
    }

    return { success: true };
  },
});

export const getTeamStats = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return emptyTeamStats;
    }

    const targetTeamId = await resolveTeamIdForStats(ctx, user, args.teamId);
    if (!targetTeamId) {
      return emptyTeamStats;
    }

    const games = await ctx.db.query("games").collect();
    const teamGames = games.filter(
      (game) => game.team1Id === targetTeamId || game.team2Id === targetTeamId,
    );
    const completedGames = teamGames.filter((game) => game.status === "completed");

    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const game of completedGames) {
      const result = getGameResultForTeam(game, targetTeamId);
      if (result === "wins") wins++;
      if (result === "losses") losses++;
      if (result === "draws") draws++;
    }

    return {
      totalGames: completedGames.length,
      wins,
      losses,
      draws,
    };
  },
});
