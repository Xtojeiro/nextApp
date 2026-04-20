import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get attendance for an event
export const getByEventId = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

// Get attendance for a user
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("attendance")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get attendance for a specific user and event
export const getByUserAndEvent = query({
  args: { eventId: v.id("events"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .collect();
    return records.find((r) => r.userId === args.userId);
  },
});

// Create attendance record
export const create = mutation({
  args: {
    eventId: v.id("events"),
    userId: v.id("users"),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("excused"),
      v.literal("pending"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const attendanceId = await ctx.db.insert("attendance", {
      ...args,
      createdAt: Date.now(),
    });
    return attendanceId;
  },
});

// Update attendance status
export const update = mutation({
  args: {
    id: v.id("attendance"),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("excused"),
      v.literal("pending"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete attendance record
export const remove = mutation({
  args: { id: v.id("attendance") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Bulk create attendance for team members
export const bulkCreateForTeam = mutation({
  args: {
    eventId: v.id("events"),
    teamId: v.id("teams"),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("excused"),
      v.literal("pending"),
    ),
  },
  handler: async (ctx, args) => {
    // Get all players in the team
    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    const createdIds = [];
    for (const player of players) {
      const existing = await ctx.db
        .query("attendance")
        .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
        .collect();

      const alreadyExists = existing.some((r) => r.userId === player.userId);

      if (!alreadyExists) {
        const id = await ctx.db.insert("attendance", {
          eventId: args.eventId,
          userId: player.userId,
          status: args.status,
          createdAt: Date.now(),
        });
        createdIds.push(id);
      }
    }
    return createdIds;
  },
});
