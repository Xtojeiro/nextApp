import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";
import {
  assertFutureTimestamp,
  assertPositiveInteger,
  cleanOptionalText,
  cleanText,
} from "./validation";

export const getWorkoutLogs = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    return await ctx.db
      .query("workoutLogs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 100);
  },
});

export const getWorkouts = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("in_progress"),
        v.literal("completed"),
        v.literal("skipped"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    let workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .collect();

    const eventBackedKeys = new Set(
      workouts
        .filter((workout) => workout.eventId)
        .map((workout) => getWorkoutIdentityKey(workout)),
    );
    workouts = workouts.filter((workout) => {
      if (workout.eventId) return true;
      return !eventBackedKeys.has(getWorkoutIdentityKey(workout));
    });

    const workoutsBySource = new Map<string, (typeof workouts)[number]>();
    workouts.forEach((workout) => {
      const sourceKey = workout.eventId
        ? `event:${workout.eventId}`
        : `workout:${workout._id}`;
      const current = workoutsBySource.get(sourceKey);
      if (!current || workout.created_at > current.created_at) {
        workoutsBySource.set(sourceKey, workout);
      }
    });
    workouts = Array.from(workoutsBySource.values());

    if (args.status) {
      workouts = workouts.filter((workout) => workout.status === args.status);
    }

    workouts.sort((a, b) => b.created_at - a.created_at);
    return workouts.slice(0, args.limit || 50);
  },
});

function getWorkoutIdentityKey(workout: {
  name: string;
  scheduledDate?: number;
  duration_minutes?: number;
}) {
  return [
    workout.name.trim().toLowerCase(),
    workout.scheduledDate ?? "unscheduled",
    workout.duration_minutes ?? "unknown",
  ].join(":");
}

export const createWorkout = mutation({
  args: {
    sessionUserId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.number(),
        weight: v.optional(v.number()),
        duration: v.optional(v.number()),
      }),
    ),
    scheduledDate: v.optional(v.number()),
    duration: v.optional(v.number()),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const now = Date.now();
    const scheduledDate = assertFutureTimestamp(args.scheduledDate, "Scheduled date");
    const duration = assertPositiveInteger(args.duration, "Duration");
    return await ctx.db.insert("workouts", {
      user_id: user._id,
      name: cleanText(args.name, "Workout name"),
      description: cleanOptionalText(args.description, "Description"),
      type: "custom",
      duration_minutes: duration,
      objective: cleanOptionalText(args.description, "Objective"),
      scheduledDate,
      difficulty: args.difficulty,
      status: scheduledDate ? "scheduled" : "in_progress",
      created_at: now,
    });
  },
});

export const startWorkout = mutation({
  args: {
    sessionUserId: v.id("users"),
    workoutId: v.id("workouts"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) throw new Error("Workout not found");
    if (workout.user_id !== user._id) throw new Error("Not authorized");

    await ctx.db.patch(args.workoutId, { status: "in_progress" });
    return { success: true };
  },
});

export const completeWorkout = mutation({
  args: {
    sessionUserId: v.id("users"),
    workoutId: v.id("workouts"),
    actualDuration: v.optional(v.number()),
    exercises: v.optional(
      v.array(
        v.object({
          name: v.string(),
          sets: v.number(),
          reps: v.number(),
          weight: v.optional(v.number()),
          duration: v.optional(v.number()),
        }),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) throw new Error("Workout not found");
    if (workout.user_id !== user._id) throw new Error("Not authorized");

    const completedDate = Date.now();
    await ctx.db.patch(args.workoutId, { status: "completed" });
    await ctx.db.insert("workoutLogs", {
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
