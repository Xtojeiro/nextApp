import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notifications for a user
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// Get unread notifications count
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return notifications.filter((n) => !n.isRead).length;
  },
});

// Create notification
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("message"),
      v.literal("invite"),
      v.literal("game"),
      v.literal("workout"),
      v.literal("follow"),
      v.literal("report"),
    ),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
    return notificationId;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

// Mark all notifications as read for a user
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const unread = notifications.filter((n) => !n.isRead);
    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

// Delete notification
export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Delete all read notifications for a user
export const deleteReadNotifications = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const read = notifications.filter((n) => n.isRead);
    for (const notification of read) {
      await ctx.db.delete(notification._id);
    }
  },
});
