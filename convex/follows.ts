import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

interface User {
  _id: any;
  full_name: string;
  avatar?: string;
}

export const getFollowers = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const follows = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("following_id"), args.userId.toString()))
      .collect();

    const followers = await Promise.all(
      follows.slice(0, args.limit || 50).map(async (follow) => {
        const followerUser = await ctx.db.get(follow.follower_id as any) as User | null;
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
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let targetUserId = args.userId;
    if (!targetUserId) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!currentUser) {
        throw new Error("User not found");
      }
      targetUserId = currentUser._id;
    }

    const following = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("follower_id"), targetUserId.toString()))
      .collect();

    const followingUsers = await Promise.all(
      following.slice(0, args.limit || 50).map(async (follow) => {
        const followedUser = await ctx.db.get(follow.following_id as any) as User | null;
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
      .filter((q) => q.eq(q.field("following_id"), args.userId.toString()))
      .collect();
    return follows.length;
  },
});

export const getFollowingCount = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    let targetUserId = args.userId;
    if (!targetUserId) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!currentUser) {
        throw new Error("User not found");
      }
      targetUserId = currentUser._id;
    }

    const follows = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("follower_id"), targetUserId.toString()))
      .collect();
    return follows.length;
  },
});

export const followUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const follower = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!follower) {
      throw new Error("User not found");
    }

    if (follower._id === args.userId) {
      throw new Error("Cannot follow yourself");
    }

    const existingFollow = await ctx.db
      .query("follows")
      .filter((q) =>
        q.and(
          q.eq(q.field("follower_id"), follower._id.toString()),
          q.eq(q.field("following_id"), args.userId.toString()),
        ),
      )
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    await ctx.db.insert("follows", {
      follower_id: follower._id.toString(),
      following_id: args.userId.toString(),
      created_at: Date.now(),
    });

    return { success: true };
  },
});

export const unfollowUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const follower = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!follower) {
      throw new Error("User not found");
    }

    const follow = await ctx.db
      .query("follows")
      .filter((q) =>
        q.and(
          q.eq(q.field("follower_id"), follower._id.toString()),
          q.eq(q.field("following_id"), args.userId.toString()),
        ),
      )
      .first();

    if (!follow) {
      throw new Error("Not following this user");
    }

    await ctx.db.delete(follow._id);
    return { success: true };
  },
});

export const isFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      return false;
    }

    const follow = await ctx.db
      .query("follows")
      .filter((q) =>
        q.and(
          q.eq(q.field("follower_id"), currentUser._id.toString()),
          q.eq(q.field("following_id"), args.userId.toString()),
        ),
      )
      .first();

    return !!follow;
  },
});
