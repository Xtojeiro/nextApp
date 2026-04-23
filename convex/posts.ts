import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";

export const getPosts = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let posts = await ctx.db.query("posts").collect();
    if (args.userId) {
      posts = posts.filter((post) => post.user_id === args.userId);
    }
    posts.sort((a, b) => b.created_at - a.created_at);
    return posts.slice(0, args.limit || 50);
  },
});

export const getFeed = query({
  args: {
    sessionUserId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireSessionUser(ctx, args.sessionUserId);
    const allPosts = await ctx.db.query("posts").collect();
    const publicPosts = allPosts.filter((post) => post.is_public !== false);
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", currentUser._id))
      .collect();
    const followingIds = following.map((follow) => follow.following_id);

    return publicPosts
      .filter(
        (post) =>
          followingIds.includes(post.user_id) || post.user_id === currentUser._id,
      )
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, args.limit || 50);
  },
});

export const createPost = mutation({
  args: {
    sessionUserId: v.id("users"),
    content: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const postId = await ctx.db.insert("posts", {
      user_id: user._id,
      content: args.content,
      image_url: args.imageUrl,
      likes: [],
      comments: [],
      is_public: true,
      created_at: Date.now(),
    });

    return { success: true, postId };
  },
});

export const deletePost = mutation({
  args: {
    sessionUserId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.user_id !== user._id) throw new Error("Not authorized to delete this post");

    await ctx.db.delete(args.postId);
    return { success: true };
  },
});

export const likePost = mutation({
  args: {
    sessionUserId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const likes = post.likes || [];
    const userId = user._id as any;

    if (likes.includes(userId)) {
      await ctx.db.patch(args.postId, {
        likes: likes.filter((id: any) => id !== userId),
      });
      return { success: true, liked: false };
    }

    await ctx.db.patch(args.postId, {
      likes: [...likes, userId],
    });
    return { success: true, liked: true };
  },
});

export const addComment = mutation({
  args: {
    sessionUserId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const comments = post.comments || [];
    comments.push({
      user_id: user._id,
      content: args.content,
      timestamp: Date.now(),
    });

    await ctx.db.patch(args.postId, { comments });
    return { success: true };
  },
});

export const getPostsWithUsers = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
    const allPosts = await ctx.db.query("posts").collect();
    allPosts.sort((a, b) => b.created_at - a.created_at);

    return await Promise.all(
      allPosts.slice(0, args.limit || 50).map(async (post) => {
        const user = await ctx.db.get(post.user_id);
        return {
          ...post,
          user: user
            ? {
                _id: user._id,
                full_name: user.full_name,
                avatar: user.avatar,
                role: user.role,
              }
            : null,
          likesCount: post.likes?.length || 0,
          commentsCount: post.comments?.length || 0,
          isLiked: currentUser ? post.likes?.includes(currentUser._id as any) || false : false,
        };
      }),
    );
  },
});
