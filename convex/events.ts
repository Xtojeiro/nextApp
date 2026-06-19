import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";
import {
  assertEventSchedule,
  cleanOptionalText,
  cleanText,
  parseEventDateTime,
} from "./validation";

type EventType = "game" | "training" | "meeting" | "other";

type SyncedTrainingEvent = {
  _id: Id<"events">;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  type: EventType;
  user_id: Id<"users">;
  notes?: string;
  created_at: number;
};

function getEventDurationMinutes(event: SyncedTrainingEvent) {
  const start = parseEventDateTime(event.date, event.start_time).getTime();
  const end = parseEventDateTime(event.date, event.end_time).getTime();
  return Math.max(1, Math.round((end - start) / 60000));
}

function getWorkoutDataFromEvent(event: SyncedTrainingEvent) {
  const description = event.description ?? event.notes;
  return {
    user_id: event.user_id,
    eventId: event._id,
    name: event.title,
    description,
    type: "event",
    duration_minutes: getEventDurationMinutes(event),
    objective: description,
    scheduledDate: parseEventDateTime(event.date, event.start_time).getTime(),
    difficulty: "intermediate" as const,
    created_at: event.created_at,
  };
}

async function getWorkoutForEvent(ctx: MutationCtx, eventId: Id<"events">) {
  return await ctx.db
    .query("workouts")
    .withIndex("by_eventId", (q) => q.eq("eventId", eventId))
    .first();
}

async function syncTrainingWorkout(ctx: MutationCtx, event: SyncedTrainingEvent) {
  const workout = await getWorkoutForEvent(ctx, event._id);

  if (event.type !== "training") {
    if (workout) {
      const logs = await ctx.db
        .query("workoutLogs")
        .withIndex("by_workoutId", (q) => q.eq("workoutId", workout._id))
        .collect();
      await Promise.all(logs.map((log) => ctx.db.delete(log._id)));
      await ctx.db.delete(workout._id);
    }
    return;
  }

  const workoutData = getWorkoutDataFromEvent(event);
  if (workout) {
    await ctx.db.patch(workout._id, workoutData);
    return;
  }

  await ctx.db.insert("workouts", {
    ...workoutData,
    status: "scheduled",
  });
}

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
    assertEventSchedule(args.date, args.start_time, args.end_time);
    const eventData = {
      title: cleanText(args.title, "Title"),
      description: cleanOptionalText(args.description, "Description"),
      date: args.date,
      start_time: args.start_time,
      end_time: args.end_time,
      location: cleanOptionalText(args.location, "Location", 120),
      type: args.type,
      user_id: user._id,
      notes: cleanOptionalText(args.notes, "Notes"),
      created_at: Date.now(),
    };
    const eventId = await ctx.db.insert("events", eventData);

    await syncTrainingWorkout(ctx, { _id: eventId, ...eventData });

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

    const nextDate = args.date ?? event.date;
    const nextStartTime = args.start_time ?? event.start_time;
    const nextEndTime = args.end_time ?? event.end_time;
    const originalStart = parseEventDateTime(event.date, event.start_time);
    assertEventSchedule(nextDate, nextStartTime, nextEndTime, {
      allowPast: originalStart.getTime() < Date.now(),
    });

    const updateData: Record<string, any> = {};
    if (args.title !== undefined) updateData.title = cleanText(args.title, "Title");
    if (args.description !== undefined) updateData.description = cleanOptionalText(args.description, "Description");
    if (args.date !== undefined) updateData.date = args.date;
    if (args.start_time !== undefined) updateData.start_time = args.start_time;
    if (args.end_time !== undefined) updateData.end_time = args.end_time;
    if (args.location !== undefined) updateData.location = cleanOptionalText(args.location, "Location", 120);
    if (args.type !== undefined) updateData.type = args.type;
    if (args.notes !== undefined) updateData.notes = cleanOptionalText(args.notes, "Notes");

    await ctx.db.patch(args.id, updateData);
    await syncTrainingWorkout(ctx, { ...event, ...updateData });
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

    await syncTrainingWorkout(ctx, { ...event, type: "other" });
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
    if (coachProfile?.teamId !== args.teamId) {
      throw new Error("Not authorized for this team");
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();
    const playerUserIds = new Set(players.map((player) => player.userId));

    let events = await ctx.db.query("events").collect();
    events = events.filter((event) => playerUserIds.has(event.user_id));
    if (args.startDate) events = events.filter((event) => event.date >= args.startDate!);
    if (args.endDate) events = events.filter((event) => event.date <= args.endDate!);
    events.sort((a, b) => a.date.localeCompare(b.date));

    return events;
  },
});
