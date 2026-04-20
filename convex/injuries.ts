import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all injuries for a player
export const getByPlayerId = query({
  args: { playerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("injuries")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerId))
      .order("desc")
      .collect();
  },
});

// Get active injuries for a player
export const getActiveByPlayerId = query({
  args: { playerId: v.id("users") },
  handler: async (ctx, args) => {
    const injuries = await ctx.db
      .query("injuries")
      .withIndex("by_playerId", (q) => q.eq("playerId", args.playerId))
      .collect();
    return injuries.filter((i) => i.status !== "recovered");
  },
});

// Get injuries by status
export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("active"),
      v.literal("recovering"),
      v.literal("recovered"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("injuries")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

// Get all active injuries (for coaches)
export const getAllActive = query({
  handler: async (ctx) => {
    const injuries = await ctx.db.query("injuries").collect();
    return injuries.filter((i) => i.status !== "recovered");
  },
});

// Create injury record
export const create = mutation({
  args: {
    playerId: v.id("users"),
    type: v.union(
      v.literal("sprain"),
      v.literal("strain"),
      v.literal("fracture"),
      v.literal("contusion"),
      v.literal("dislocation"),
      v.literal("other"),
    ),
    description: v.optional(v.string()),
    bodyPart: v.optional(v.string()),
    severity: v.union(
      v.literal("mild"),
      v.literal("moderate"),
      v.literal("severe"),
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("recovering"),
      v.literal("recovered"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const injuryId = await ctx.db.insert("injuries", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return injuryId;
  },
});

// Update injury
export const update = mutation({
  args: {
    id: v.id("injuries"),
    type: v.optional(
      v.union(
        v.literal("sprain"),
        v.literal("strain"),
        v.literal("fracture"),
        v.literal("contusion"),
        v.literal("dislocation"),
        v.literal("other"),
      ),
    ),
    description: v.optional(v.string()),
    bodyPart: v.optional(v.string()),
    severity: v.optional(
      v.union(v.literal("mild"), v.literal("moderate"), v.literal("severe")),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("recovering"),
        v.literal("recovered"),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

// Mark injury as recovered
export const markRecovered = mutation({
  args: { id: v.id("injuries") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "recovered",
      endDate: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Delete injury record
export const remove = mutation({
  args: { id: v.id("injuries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
