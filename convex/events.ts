import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getEvents = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(v.union(v.literal("game"), v.literal("training"), v.literal("meeting"), v.literal("other"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      return [];
    }

    let events = await ctx.db.query("events").collect();

    events = events.filter((e) => e.user_id === user._id);

    if (args.startDate) {
      events = events.filter((e) => e.date >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.date <= args.endDate!);
    }
    if (args.type) {
      events = events.filter((e) => e.type === args.type);
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    return events;
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    start_time: v.string(),
    end_time: v.string(),
    location: v.optional(v.string()),
    type: v.union(v.literal("game"), v.literal("training"), v.literal("meeting"), v.literal("other")),
    notes: v.optional(v.string()),
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
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.string()),
    start_time: v.optional(v.string()),
    end_time: v.optional(v.string()),
    location: v.optional(v.string()),
    type: v.optional(v.union(v.literal("game"), v.literal("training"), v.literal("meeting"), v.literal("other"))),
    notes: v.optional(v.string()),
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

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.user_id !== user._id) {
      throw new Error("Not authorized to update this event");
    }

    const updateData: any = {};
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
    id: v.id("events"),
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

    const event = await ctx.db.get(args.id);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.user_id !== user._id) {
      throw new Error("Not authorized to delete this event");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const getTeamEvents = query({
  args: {
    teamId: v.id("teams"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
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
      throw new Error("Not authorized");
    }

    const coachProfile = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q) => q.eq("userId", coach._id))
      .first();

    if (!coachProfile || coachProfile.teamId !== args.teamId) {
      throw new Error("Not authorized for this team");
    }

    let events = await ctx.db.query("events").collect();

    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    const playerUserIds = players.map((p) => p.userId);

    events = events.filter((e) => playerUserIds.includes(e.user_id));

    if (args.startDate) {
      events = events.filter((e) => e.date >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.date <= args.endDate!);
    }

    events.sort((a, b) => a.date.localeCompare(b.date));

    return events;
  },
});
