import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all achievements
export const getAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("achievements").collect();
  },
});

// Get achievement by ID
export const getById = query({
  args: { id: v.id("achievements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create achievement definition
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    criteria: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Achievement name is required");
    }

    const achievementId = await ctx.db.insert("achievements", {
      ...args,
      createdAt: Date.now(),
    });
    return achievementId;
  },
});

// Get achievements for a user
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const achievements = [];
    for (const ua of userAchievements) {
      const achievement = await ctx.db.get(ua.achievementId);
      if (achievement) {
        achievements.push({ ...achievement, earnedAt: ua.earnedAt });
      }
    }
    return achievements;
  },
});

// Check if user has a specific achievement
export const hasAchievement = query({
  args: { userId: v.id("users"), achievementId: v.id("achievements") },
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return userAchievements.some(
      (ua) => ua.achievementId === args.achievementId,
    );
  },
});

// Award achievement to user
export const award = mutation({
  args: {
    userId: v.id("users"),
    achievementId: v.id("achievements"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if already has the achievement
    const existing = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const alreadyHas = existing.some(
      (ua) => ua.achievementId === args.achievementId,
    );
    if (alreadyHas) {
      throw new Error("User already has this achievement");
    }

    const userAchievementId = await ctx.db.insert("userAchievements", {
      userId: args.userId,
      achievementId: args.achievementId,
      earnedAt: Date.now(),
    });

    return userAchievementId;
  },
});

// Remove achievement from user
export const remove = mutation({
  args: {
    userId: v.id("users"),
    achievementId: v.id("achievements"),
  },
  handler: async (ctx, args) => {
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const userAchievement = userAchievements.find(
      (ua) => ua.achievementId === args.achievementId,
    );

    if (userAchievement) {
      await ctx.db.delete(userAchievement._id);
    }
  },
});

// Delete achievement definition
export const deleteAchievement = mutation({
  args: { id: v.id("achievements") },
  handler: async (ctx, args) => {
    // Delete all user achievements for this achievement
    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_achievementId", (q) => q.eq("achievementId", args.id))
      .collect();

    for (const ua of userAchievements) {
      await ctx.db.delete(ua._id);
    }

    // Delete the achievement
    await ctx.db.delete(args.id);
  },
});

// Initialize default achievements
export const initializeDefaults = mutation({
  handler: async (ctx) => {
    const defaults = [
      { name: "First Game", description: "Play your first game", icon: "game" },
      { name: "First Win", description: "Win your first game", icon: "trophy" },
      {
        name: "Perfect Season",
        description: "Complete a season without losses",
        icon: "star",
      },
      { name: "Team Player", description: "Join a team", icon: "users" },
      {
        name: "100 Points",
        description: "Score 100 total points",
        icon: "target",
      },
      { name: "Assist King", description: "Make 50 assists", icon: "hand" },
      {
        name: "Sharpshooter",
        description: "Make 20 three-pointers",
        icon: "bullseye",
      },
      {
        name: "Iron Player",
        description: "Attend 10 trainings in a row",
        icon: "muscle",
      },
      {
        name: "Social Butterfly",
        description: "Make 10 friends",
        icon: "heart",
      },
      {
        name: "Scout's Favorite",
        description: "Receive 5 scout reports",
        icon: "clipboard",
      },
    ];

    for (const achievement of defaults) {
      await ctx.db.insert("achievements", {
        ...achievement,
        createdAt: Date.now(),
      });
    }
  },
});
