import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get games
export const getGames = query({
  args: {
    status: v.optional(v.union(v.literal('scheduled'), v.literal('in_progress'), v.literal('completed'), v.literal('cancelled'))),
    teamId: v.optional(v.id('teams')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    let games;
    
    if (args.status && args.teamId) {
      // Filter by both status and team
      const allGames = await ctx.db
        .query('games')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
      
      games = allGames.filter(game => 
        game.team1Id === args.teamId || game.team2Id === args.teamId
      );
    } else if (args.status) {
      games = await ctx.db
        .query('games')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
    } else if (args.teamId) {
      const allGames = await ctx.db.query('games').collect();
      games = allGames.filter(game => 
        game.team1Id === args.teamId || game.team2Id === args.teamId
      );
    } else {
      games = await ctx.db.query('games').collect();
    }

    // Sort by date (most recent first)
    games.sort((a, b) => b.date - a.date);

    // Get team details and creator info
    const gamesWithDetails = await Promise.all(
      games.slice(0, args.limit || 50).map(async (game) => {
        const [team1, team2, creator] = await Promise.all([
          ctx.db.get(game.team1Id),
          ctx.db.get(game.team2Id),
          ctx.db.get(game.createdBy)
        ]);

        return {
          ...game,
          team1,
          team2,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
          } : null,
        };
      })
    );

    return gamesWithDetails;
  },
});

// Create game
export const createGame = mutation({
  args: {
    name: v.string(),
    team1Id: v.id('teams'),
    team2Id: v.id('teams'),
    date: v.number(),
    location: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Validate teams exist
    const [team1, team2] = await Promise.all([
      ctx.db.get(args.team1Id),
      ctx.db.get(args.team2Id)
    ]);

    if (!team1 || !team2) {
      throw new Error('One or both teams not found');
    }

    if (args.team1Id === args.team2Id) {
      throw new Error('Teams must be different');
    }

    const now = Date.now();
    const gameId = await ctx.db.insert('games', {
      name: args.name,
      team1Id: args.team1Id,
      team2Id: args.team2Id,
      date: args.date,
      location: args.location,
      status: 'scheduled',
      notes: args.notes,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, gameId };
  },
});

// Update game
export const updateGame = mutation({
  args: {
    gameId: v.id('games'),
    status: v.optional(v.union(v.literal('scheduled'), v.literal('in_progress'), v.literal('completed'), v.literal('cancelled'))),
    score1: v.optional(v.number()),
    score2: v.optional(v.number()),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Check if user has permission (created the game or is coach of one of the teams)
    let hasPermission = game.createdBy === user._id;
    
    if (!hasPermission) {
      // Check if user is coach of either team
      const [team1, team2] = await Promise.all([
        ctx.db.get(game.team1Id),
        ctx.db.get(game.team2Id)
      ]);

      if ((team1 && team1.coachId === user._id) || (team2 && team2.coachId === user._id)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new Error('Not authorized to update this game');
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

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

// Get games for user's teams (helper query)
export const getMyTeamGames = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Get teams the user is associated with
    let userTeams: string[] = [];

    if (user.role === 'coach') {
      const coachProfile = await ctx.db
        .query('coaches')
        .withIndex('by_userId', (q) => q.eq('userId', user._id))
        .first();
      
      if (coachProfile?.teamId) {
        userTeams.push(coachProfile.teamId);
      }
    } else if (user.role === 'athlete') {
      const playerProfile = await ctx.db
        .query('players')
        .withIndex('by_userId', (q) => q.eq('userId', user._id))
        .first();
      
      if (playerProfile?.teamId) {
        userTeams.push(playerProfile.teamId);
      }
    }

    if (userTeams.length === 0) {
      return [];
    }

    // Get games for these teams
    const allGames = await ctx.db.query('games').collect();
    const userGames = allGames.filter(game => 
      userTeams.includes(game.team1Id) || userTeams.includes(game.team2Id)
    );

    // Sort by date
    userGames.sort((a, b) => b.date - a.date);

    // Get team details
    const gamesWithDetails = await Promise.all(
      userGames.slice(0, args.limit || 50).map(async (game) => {
        const [team1, team2] = await Promise.all([
          ctx.db.get(game.team1Id),
          ctx.db.get(game.team2Id)
        ]);

        return {
          ...game,
          team1,
          team2,
        };
      })
    );

    return gamesWithDetails;
  },
});