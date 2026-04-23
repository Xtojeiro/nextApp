import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";

export const getTrainingPlans = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    coachId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    let plans = await ctx.db.query("trainingPlans").collect();
    if (args.coachId) plans = plans.filter((plan) => plan.coachId === args.coachId);
    if (args.isActive !== undefined) {
      plans = plans.filter((plan) => plan.isActive === args.isActive);
    }

    plans.sort((a, b) => b.createdAt - a.createdAt);
    return plans.slice(0, args.limit || 50);
  },
});

export const getMyTrainingPlans = query({
  args: {
    sessionUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);

    let plans: any[] = [];
    if (user.role === "COACH") {
      plans = await ctx.db
        .query("trainingPlans")
        .withIndex("by_coachId", (q) => q.eq("coachId", user._id))
        .collect();
    } else {
      const playerProfile = await ctx.db
        .query("players")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (playerProfile?.teamId) {
        const allPlans = await ctx.db.query("trainingPlans").collect();
        plans = allPlans.filter((plan) => plan.isActive);
      }
    }

    return plans.slice(0, args.limit || 50);
  },
});

export const createTrainingPlan = mutation({
  args: {
    sessionUserId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    goals: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const coach = await requireSessionUser(ctx, args.sessionUserId);
    if (coach.role !== "COACH") {
      throw new Error("Only coaches can create training plans");
    }

    const planId = await ctx.db.insert("trainingPlans", {
      name: args.name,
      description: args.description,
      coachId: coach._id,
      workouts: [],
      duration: args.duration,
      difficulty: args.difficulty,
      goals: args.goals,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, planId };
  },
});

export const updateTrainingPlan = mutation({
  args: {
    sessionUserId: v.id("users"),
    id: v.id("trainingPlans"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
      ),
    ),
    goals: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const coach = await requireSessionUser(ctx, args.sessionUserId);
    if (coach.role !== "COACH") {
      throw new Error("Only coaches can update training plans");
    }

    const plan = await ctx.db.get(args.id);
    if (!plan) throw new Error("Training plan not found");
    if (plan.coachId !== coach._id) throw new Error("Not authorized to update this plan");

    const updateData: Record<string, any> = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.duration !== undefined) updateData.duration = args.duration;
    if (args.difficulty !== undefined) updateData.difficulty = args.difficulty;
    if (args.goals !== undefined) updateData.goals = args.goals;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;

    await ctx.db.patch(args.id, updateData);
    return { success: true };
  },
});

export const addWorkoutToPlan = mutation({
  args: {
    sessionUserId: v.id("users"),
    planId: v.id("trainingPlans"),
    workoutId: v.id("workouts"),
  },
  handler: async (ctx, args) => {
    const coach = await requireSessionUser(ctx, args.sessionUserId);
    if (coach.role !== "COACH") {
      throw new Error("Only coaches can modify training plans");
    }

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Training plan not found");
    if (plan.coachId !== coach._id) throw new Error("Not authorized");

    const workouts = plan.workouts || [];
    if (!workouts.includes(args.workoutId)) {
      workouts.push(args.workoutId);
      await ctx.db.patch(args.planId, { workouts, updatedAt: Date.now() });
    }

    return { success: true };
  },
});

export const getTrainingPlanStats = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    planId: v.id("trainingPlans"),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Training plan not found");
    }

    const workouts = await Promise.all(plan.workouts.map((id) => ctx.db.get(id)));
    const playerProfiles = await ctx.db.query("players").collect();

    return {
      totalWorkouts: workouts.length,
      activeWorkouts: workouts.filter(Boolean).length,
      totalPlayers: playerProfiles.length,
      difficulty: plan.difficulty,
      duration: plan.duration,
    };
  },
});

export const deleteTrainingPlan = mutation({
  args: {
    sessionUserId: v.id("users"),
    id: v.id("trainingPlans"),
  },
  handler: async (ctx, args) => {
    const coach = await requireSessionUser(ctx, args.sessionUserId);
    if (coach.role !== "COACH") {
      throw new Error("Only coaches can delete training plans");
    }

    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Training plan not found");
    }

    if (plan.coachId !== coach._id) {
      throw new Error("Not authorized to delete this plan");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
