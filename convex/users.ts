import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get current user from auth
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    return user;
  },
});

// Register new user
export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal('athlete'), v.literal('coach'), v.literal('scout')),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existingUser) {
      throw new Error('User already exists');
    }

    const now = Date.now();
    const userId = await ctx.db.insert('users', {
      name: args.name,
      email: args.email,
      password: args.password, // Note: In production, this should be hashed
      role: args.role,
      bio: args.bio,
      location: args.location,
      age: args.age,
      gender: args.gender,
      phoneNumber: args.phoneNumber,
      isPublic: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create role-specific profile
    if (args.role === 'athlete') {
      await ctx.db.insert('players', {
        userId,
        stats: {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          points: 0,
          assists: 0,
          rebounds: 0,
        },
      });
    } else if (args.role === 'coach') {
      await ctx.db.insert('coaches', {
        userId,
      });
    }

    return userId;
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(v.union(v.literal('male'), v.literal('female'), v.literal('other'))),
    phoneNumber: v.optional(v.string()),
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

    const updateData: any = {};
    Object.keys(args).forEach(key => {
      if (args[key as keyof typeof args] !== undefined) {
        updateData[key] = args[key as keyof typeof args];
      }
    });
    updateData.updatedAt = Date.now();

    await ctx.db.patch(user._id, updateData);
    return { success: true };
  },
});

// Generate upload URL for avatar
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Update user avatar
export const updateAvatar = mutation({
  args: {
    storageId: v.id('_storage'),
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

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error('Failed to get avatar URL');
    }

    await ctx.db.patch(user._id, {
      avatar: url,
      updatedAt: Date.now(),
    });

    return { success: true, url };
  },
});

// Toggle profile visibility
export const toggleProfileVisibility = mutation({
  args: {},
  handler: async (ctx) => {
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

    await ctx.db.patch(user._id, {
      isPublic: !user.isPublic,
      updatedAt: Date.now(),
    });

    return { isPublic: !user.isPublic };
  },
});

// Get profile visibility
export const getProfileVisibility = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user.isPublic;
  },
});

// Search users
export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Get all public users
    const publicUsers = await ctx.db
      .query('users')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .take(limit);

    // Filter by search query (basic text search)
    const filteredUsers = publicUsers.filter(user => 
      user.name.toLowerCase().includes(args.query.toLowerCase()) ||
      user.bio?.toLowerCase().includes(args.query.toLowerCase()) ||
      user.location?.toLowerCase().includes(args.query.toLowerCase())
    );

    return filteredUsers;
  },
});

// Get team athletes (for coaches)
export const getTeamAthletes = query({
  args: {
    teamId: v.optional(v.id('teams')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const coach = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!coach || coach.role !== 'coach') {
      throw new Error('Not authorized');
    }

    let targetTeamId = args.teamId;
    
    // If no teamId provided, get coach's team
    if (!targetTeamId) {
      const coachProfile = await ctx.db
        .query('coaches')
        .withIndex('by_userId', (q) => q.eq('userId', coach._id))
        .first();
      
      if (coachProfile?.teamId) {
        targetTeamId = coachProfile.teamId;
      }
    }

    if (!targetTeamId) {
      return [];
    }

    const players = await ctx.db
      .query('players')
      .withIndex('by_teamId', (q) => q.eq('teamId', targetTeamId))
      .collect();

    const users = await Promise.all(
      players.map(async (player) => {
        return await ctx.db.get(player.userId);
      })
    );

    return users.filter(Boolean);
  },
});

// Add athlete note (for coaches)
export const addAthleteNote = mutation({
  args: {
    athleteId: v.id('users'),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const coach = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!coach || coach.role !== 'coach') {
      throw new Error('Not authorized');
    }

    // This would typically be stored in a separate notes table
    // For now, returning success as placeholder
    return { success: true };
  },
});

// Get player stats
export const getPlayerStats = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query('players')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first();

    if (!player) {
      throw new Error('Player not found');
    }

    return player.stats || {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      points: 0,
      assists: 0,
      rebounds: 0,
    };
  },
});

// Get coach dashboard
export const getCoachDashboard = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const coach = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!coach || coach.role !== 'coach') {
      throw new Error('Not authorized');
    }

    const coachProfile = await ctx.db
      .query('coaches')
      .withIndex('by_userId', (q) => q.eq('userId', coach._id))
      .first();

    let athletes: any[] = [];
    if (coachProfile?.teamId) {
      athletes = await ctx.db
        .query('players')
        .withIndex('by_teamId', (q) => q.eq('teamId', coachProfile.teamId))
        .collect();
    }

    const recentWorkouts = await ctx.db
      .query('workoutLogs')
      .withIndex('by_userId', (q) => q.eq('userId', coach._id))
      .order('desc')
      .take(5);

    const upcomingEvents = await ctx.db
      .query('events')
      .withIndex('by_date', (q) => q.gte('date', Date.now()))
      .filter((q) => q.eq(q.field('userId'), coach._id))
      .take(5);

    return {
      totalAthletes: athletes.length,
      recentWorkouts: recentWorkouts.length,
      upcomingEvents: upcomingEvents.length,
      athletes,
    };
  },
});