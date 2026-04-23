import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";

export const getEvents = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("game"),
        v.literal("training"),
        v.literal("meeting"),
        v.literal("other"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    let events = await ctx.db.query("events").collect();
    events = events.filter((event) => event.user_id === user._id);

    if (args.startDate) events = events.filter((event) => event.date >= args.startDate!);
    if (args.endDate) events = events.filter((event) => event.date <= args.endDate!);
    if (args.type) events = events.filter((event) => event.type === args.type);

    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  },
});

export const createEvent = mutation({
  args: {
    sessionUserId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    start_time: v.string(),
    end_time: v.string(),
    location: v.optional(v.string()),
    type: v.union(
      v.literal("game"),
      v.literal("training"),
      v.literal("meeting"),
      v.literal("other"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: args.description,
      date: args.date,
      start_time: args.start_time,
      end_time: args.end_time,
      location: args.location,
      type: args.type,
      user_id: user._id,
      notes: args.notes,
      created_at: Date.now(),
    });

    return { success: true, eventId };
  },
});

export const updateEvent = mutation({
  args: {
    sessionUserId: v.id("users"),
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    start_time: v.optional(v.string()),
    end_time: v.optional(v.string()),
    location: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("game"),
        v.literal("training"),
        v.literal("meeting"),
        v.literal("other"),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    if (event.user_id !== user._id) throw new Error("Not authorized to update this event");

    const updateData: Record<string, any> = {};
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.date !== undefined) updateData.date = args.date;
    if (args.start_time !== undefined) updateData.start_time = args.start_time;
    if (args.end_time !== undefined) updateData.end_time = args.end_time;
    if (args.location !== undefined) updateData.location = args.location;
    if (args.type !== undefined) updateData.type = args.type;
    if (args.notes !== undefined) updateData.notes = args.notes;

    await ctx.db.patch(args.id, updateData);
    return { success: true };
  },
});

export const deleteEvent = mutation({
  args: {
    sessionUserId: v.id("users"),
    id: v.id("events"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    if (event.user_id !== user._id) throw new Error("Not authorized to delete this event");

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const getTeamEvents = query({
  args: {
    sessionUserId: v.id("users"),
    teamId: v.id("teams"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const coach = await requireSessionUser(ctx, args.sessionUserId);
    if (coach.role !== "COACH") {
      throw new Error("Not authorized");
    }

    const coachProfile = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q) => q.eq("userId", coach._id))
      .first();
    if (!coachProfile || coachProfile.teamId !== args.teamId) {
      throw new Error("Not authorized for this team");
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
    const playerUserIds = players.map((player) => player.userId);

    let events = await ctx.db.query("events").collect();
    events = events.filter((event) => playerUserIds.includes(event.user_id));
    if (args.startDate) events = events.filter((event) => event.date >= args.startDate!);
    if (args.endDate) events = events.filter((event) => event.date <= args.endDate!);
    events.sort((a, b) => a.date.localeCompare(b.date));

    return events;
  },
});
