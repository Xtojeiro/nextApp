import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Get workout logs for user
export const getWorkoutLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      return [];
    }

    if (!user) {
      return [];
    }

    const logs = await ctx.db
      .query('workoutLogs')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(args.limit || 100);

    return logs;
  },
});

// Get workouts for user
export const getWorkouts = query({
  args: {
    status: v.optional(v.union(v.literal('scheduled'), v.literal('in_progress'), v.literal('completed'), v.literal('skipped'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let workouts;
    if (args.status) {
      workouts = await ctx.db
        .query('workouts')
        .filter((q) => 
          q.and(q.eq(q.field('user_id'), user._id), q.eq(q.field('status'), args.status))
        )
        .order('desc')
        .take(args.limit || 50);
    } else {
      workouts = await ctx.db
        .query('workouts')
        .filter((q) => q.eq(q.field('user_id'), user._id))
        .order('desc')
        .take(args.limit || 50);
    }
    return workouts;
  },
});

// Create new workout
export const createWorkout = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    exercises: v.array(v.object({
      name: v.string(),
      sets: v.number(),
      reps: v.number(),
      weight: v.optional(v.number()),
      duration: v.optional(v.number()),
    })),
    scheduledDate: v.optional(v.number()),
    duration: v.optional(v.number()),
    difficulty: v.union(v.literal('beginner'), v.literal('intermediate'), v.literal('advanced')),
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

    const now = Date.now();
    const workoutId = await ctx.db.insert('workouts', {
      user_id: user._id,
      name: args.name,
      description: args.description,
      type: 'custom',
      duration_minutes: args.duration,
      objective: args.description,
      scheduledDate: args.scheduledDate,
      difficulty: args.difficulty,
      status: args.scheduledDate ? 'scheduled' : 'in_progress',
      created_at: now,
    });

    return workoutId;
  },
});

// Start workout
export const startWorkout = mutation({
  args: {
    workoutId: v.id('workouts'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const workout = await ctx.db.get(args.workoutId);
    if (!workout) {
      throw new Error('Workout not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user || workout.user_id !== user._id) {
      throw new Error('Not authorized');
    }

    await ctx.db.patch(args.workoutId, {
      status: 'in_progress',
    });

    return { success: true };
  },
});

// Complete workout
export const completeWorkout = mutation({
  args: {
    workoutId: v.id('workouts'),
    actualDuration: v.optional(v.number()),
    exercises: v.optional(v.array(v.object({
      name: v.string(),
      sets: v.number(),
      reps: v.number(),
      weight: v.optional(v.number()),
      duration: v.optional(v.number()),
    }))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const workout = await ctx.db.get(args.workoutId);
    if (!workout) {
      throw new Error('Workout not found');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', identity.email!))
      .first();

    if (!user || workout.user_id !== user._id) {
      throw new Error('Not authorized');
    }

    const completedDate = Date.now();

    await ctx.db.patch(args.workoutId, {
      status: 'completed',
    });

    await ctx.db.insert('workoutLogs', {
      userId: user._id,
      workoutId: args.workoutId,
      completedDate,
      duration: args.actualDuration || workout.duration_minutes || 0,
      exercises: args.exercises || [],
      notes: args.notes,
    });

    return { success: true };
  },
});