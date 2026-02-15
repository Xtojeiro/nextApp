import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTrainingPlans = query({
  args: {
    coachId: v.optional(v.id("users")),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let plans = await ctx.db.query("trainingPlans").collect();

    if (args.coachId) {
      plans = plans.filter((p) => p.coachId === args.coachId);
    }
    if (args.isActive !== undefined) {
      plans = plans.filter((p) => p.isActive === args.isActive);
    }

    plans.sort((a, b) => b.createdAt - a.createdAt);

    return plans.slice(0, args.limit || 50);
  },
});

export const getMyTrainingPlans = query({
  args: {
    limit: v.optional(v.number()),
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
        plans = allPlans.filter((p) => p.isActive);
      }
    }

    return plans.slice(0, args.limit || 50);
  },
});

export const createTrainingPlan = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    difficulty: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced")),
    goals: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!coach || coach.role !== "COACH") {
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
    id: v.id("trainingPlans"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    duration: v.optional(v.number()),
    difficulty: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    goals: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!coach || coach.role !== "COACH") {
      throw new Error("Only coaches can update training plans");
    }

    const plan = await ctx.db.get(args.id);
    if (!plan) {
      throw new Error("Training plan not found");
    }

    if (plan.coachId !== coach._id) {
      throw new Error("Not authorized to update this plan");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };
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
    planId: v.id("trainingPlans"),
    workoutId: v.id("workouts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!coach || coach.role !== "COACH") {
      throw new Error("Only coaches can modify training plans");
    }

    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Training plan not found");
    }

    if (plan.coachId !== coach._id) {
      throw new Error("Not authorized");
    }

    const workouts = plan.workouts || [];
    if (!workouts.includes(args.workoutId)) {
      workouts.push(args.workoutId);
      await ctx.db.patch(args.planId, {
        workouts,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const getTrainingPlanStats = query({
  args: { planId: v.id("trainingPlans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Training plan not found");
    }

    const workouts = await Promise.all(
      (plan.workouts || []).map(async (id) => await ctx.db.get(id)),
    );

    const completedWorkouts = await ctx.db.query("workoutLogs").collect();
    const playerProfiles = await ctx.db.query("players").collect();
    const playersCount = playerProfiles.length;

    return {
      totalWorkouts: workouts.length,
      activeWorkouts: workouts.filter((w) => w !== null).length,
      totalPlayers: playersCount,
      difficulty: plan.difficulty,
      duration: plan.duration,
    };
  },
});
