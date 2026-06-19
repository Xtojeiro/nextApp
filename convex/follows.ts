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
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", follower._id))
      .filter((q) => q.eq(q.field("following_id"), args.userId))
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    if (targetUser.is_public === false) {
      const existingRequest = await ctx.db
        .query("followRequests")
        .withIndex("by_requester_id", (q) => q.eq("requester_id", follower._id))
        .filter((q) => q.eq(q.field("target_id"), args.userId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .first();

      if (existingRequest) {
        return { success: true, status: "pending" };
      }

      await ctx.db.insert("followRequests", {
        requester_id: follower._id,
        target_id: args.userId,
        status: "pending",
        created_at: Date.now(),
      });
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "follow",
        title: "Novo pedido para seguir",
        body: `${follower.full_name || follower.name || "Um utilizador"} quer seguir o teu perfil.`,
        data: JSON.stringify({ requesterId: follower._id }),
        isRead: false,
        createdAt: Date.now(),
      });

      return { success: true, status: "pending" };
    }

    await ctx.db.insert("follows", {
      follower_id: follower._id,
      following_id: args.userId,
      created_at: Date.now(),
    });

    return { success: true, status: "following" };
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

export const getPendingFollowRequests = query({
  args: {
    sessionUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const requests = await ctx.db
      .query("followRequests")
      .withIndex("by_target_id", (q) => q.eq("target_id", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const enriched = await Promise.all(
      requests.slice(0, args.limit || 50).map(async (request) => {
        const requester = await ctx.db.get(request.requester_id);
        return requester
          ? {
              _id: request._id,
              created_at: request.created_at,
              requester: {
                _id: requester._id,
                full_name: requester.full_name || requester.name || "Utilizador",
                avatar: requester.avatar,
                role: requester.role,
              },
            }
          : null;
      }),
    );

    return enriched.filter(Boolean);
  },
});

export const respondToFollowRequest = mutation({
  args: {
    sessionUserId: v.id("users"),
    requestId: v.id("followRequests"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const request = await ctx.db.get(args.requestId);
    if (!request || request.target_id !== user._id) {
      throw new Error("Follow request not found");
    }
    if (request.status !== "pending") {
      throw new Error("Follow request already answered");
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: args.accept ? "accepted" : "rejected",
      responded_at: now,
    });

    if (args.accept) {
      const existingFollow = await ctx.db
        .query("follows")
        .withIndex("by_follower_id", (q) => q.eq("follower_id", request.requester_id))
        .filter((q) => q.eq(q.field("following_id"), user._id))
        .first();

      if (!existingFollow) {
        await ctx.db.insert("follows", {
          follower_id: request.requester_id,
          following_id: user._id,
          created_at: now,
        });
      }
    }

    await ctx.db.insert("notifications", {
      userId: request.requester_id,
      type: "follow",
      title: args.accept ? "Pedido aceite" : "Pedido rejeitado",
      body: `${user.full_name || user.name || "O utilizador"} ${args.accept ? "aceitou" : "rejeitou"} o teu pedido para seguir.`,
      data: JSON.stringify({ targetId: user._id }),
      isRead: false,
      createdAt: now,
    });

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
