import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTeam = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

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
        if (coach?.teamId) {
          targetTeamId = coach.teamId;
        }
      } else if (user.role === "PLAYER") {
        const player = await ctx.db
          .query("players")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first();
        if (player?.teamId) {
          targetTeamId = player.teamId;
        }
      }
    }

    if (!targetTeamId) {
      return null;
    }

    return await ctx.db.get(targetTeamId);
  },
});

export const getTeamAthletes = query({
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let targetTeamId = args.teamId;

    if (!targetTeamId) {
      if (user.role === "COACH") {
        const coach = await ctx.db
          .query("coaches")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first();
        if (coach?.teamId) {
          targetTeamId = coach.teamId;
        }
      }
    }

    if (!targetTeamId) {
      return [];
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", targetTeamId))
      .collect();

    const athletesWithDetails = await Promise.all(
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
      })
    );

    return athletesWithDetails;
  },
});

export const createTeam = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
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

    if (user.role !== "COACH") {
      throw new Error("Only coaches can create teams");
    }

    const now = Date.now();
    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      description: args.description,
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
      await ctx.db.insert("coaches", {
        userId: user._id,
        teamId,
      });
    }

    return { success: true, teamId };
  },
});

export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
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

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.coachId !== user._id) {
      throw new Error("Not authorized to update this team");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.logo !== undefined) updateData.logo = args.logo;

    await ctx.db.patch(args.teamId, updateData);
    return { success: true };
  },
});

export const addAthleteToTeam = mutation({
  args: {
    teamId: v.id("teams"),
    athleteId: v.id("users"),
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

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    if (team.coachId !== user._id) {
      throw new Error("Not authorized to add athletes to this team");
    }

    const athlete = await ctx.db.get(args.athleteId);
    if (!athlete) {
      throw new Error("Athlete not found");
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
    teamId: v.id("teams"),
    athleteId: v.id("users"),
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

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

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
  args: { teamId: v.optional(v.id("teams")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { totalGames: 0, wins: 0, losses: 0, draws: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return { totalGames: 0, wins: 0, losses: 0, draws: 0 };
    }

    let targetTeamId = args.teamId;

    if (!targetTeamId) {
      if (user.role === "COACH") {
        const coach = await ctx.db
          .query("coaches")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .first();
        if (coach?.teamId) {
          targetTeamId = coach.teamId;
        }
      }
    }

    if (!targetTeamId) {
      return { totalGames: 0, wins: 0, losses: 0, draws: 0 };
    }

    const games = await ctx.db.query("games").collect();
    const teamGames = games.filter(
      (g) => g.team1Id === targetTeamId || g.team2Id === targetTeamId
    );

    const completedGames = teamGames.filter((g) => g.status === "completed");
    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const game of completedGames) {
      if (game.score1 === undefined || game.score2 === undefined) continue;

      const isTeam1 = game.team1Id === targetTeamId;
      const teamScore = isTeam1 ? game.score1 : game.score2;
      const opponentScore = isTeam1 ? game.score2 : game.score1;

      if (teamScore > opponentScore) wins++;
      else if (teamScore < opponentScore) losses++;
      else draws++;
    }

    return {
      totalGames: completedGames.length,
      wins,
      losses,
      draws,
    };
  },
});
