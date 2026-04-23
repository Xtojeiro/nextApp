import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";

export const getFollowers = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following_id", (q) => q.eq("following_id", args.userId))
      .collect();

    const followers = await Promise.all(
      follows.slice(0, args.limit || 50).map(async (follow) => {
        const followerUser = await ctx.db.get(follow.follower_id);
        return followerUser
          ? {
              _id: followerUser._id,
              full_name: followerUser.full_name,
              avatar: followerUser.avatar,
              followedAt: follow.created_at,
            }
          : null;
      }),
    );

    return followers.filter(Boolean);
  },
});

export const getFollowing = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;
    if (!targetUserId) {
      const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
      if (!currentUser) {
        throw new Error("User not found");
      }
      targetUserId = currentUser._id;
    }

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", targetUserId!))
      .collect();

    const followingUsers = await Promise.all(
      following.slice(0, args.limit || 50).map(async (follow) => {
        const followedUser = await ctx.db.get(follow.following_id);
        return followedUser
          ? {
              _id: followedUser._id,
              full_name: followedUser.full_name,
              avatar: followedUser.avatar,
              followedAt: follow.created_at,
            }
          : null;
      }),
    );

    return followingUsers.filter(Boolean);
  },
});

export const getFollowersCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following_id", (q) => q.eq("following_id", args.userId))
      .collect();
    return follows.length;
  },
});

export const getFollowingCount = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;
    if (!targetUserId) {
      const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
      if (!currentUser) {
        return 0;
      }
      targetUserId = currentUser._id;
    }

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", targetUserId!))
      .collect();
    return follows.length;
  },
});

export const followUser = mutation({
  args: {
    sessionUserId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follower = await requireSessionUser(ctx, args.sessionUserId);
    if (follower._id === args.userId) {
      throw new Error("Cannot follow yourself");
    }

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", follower._id))
      .filter((q) => q.eq(q.field("following_id"), args.userId))
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    await ctx.db.insert("follows", {
      follower_id: follower._id,
      following_id: args.userId,
      created_at: Date.now(),
    });

    return { success: true };
  },
});

export const unfollowUser = mutation({
  args: {
    sessionUserId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follower = await requireSessionUser(ctx, args.sessionUserId);
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", follower._id))
      .filter((q) => q.eq(q.field("following_id"), args.userId))
      .first();

    if (!follow) {
      throw new Error("Not following this user");
    }

    await ctx.db.delete(follow._id);
    return { success: true };
  },
});

export const isFollowing = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
    if (!currentUser) {
      return false;
    }

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", currentUser._id))
      .filter((q) => q.eq(q.field("following_id"), args.userId))
      .first();

    return !!follow;
  },
});
