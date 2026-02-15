import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPosts = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    let posts = await ctx.db.query("posts").collect();

    if (args.userId) {
      posts = posts.filter((p) => p.user_id === args.userId);
    }

    posts.sort((a, b) => b.created_at - a.created_at);

    return posts.slice(0, args.limit || 50);
  },
});

export const getFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const allPosts = await ctx.db.query("posts").collect();

    const publicPosts = allPosts.filter((p) => p.is_public !== false);

    const following = await ctx.db
      .query("follows")
      .filter((q) => q.eq(q.field("follower_id"), currentUser._id))
      .collect();

    const followingIds = following.map((f) => f.following_id);

    const feedPosts = publicPosts.filter(
      (p) => followingIds.includes(p.user_id) || p.user_id === currentUser._id,
    );

    feedPosts.sort((a, b) => b.created_at - a.created_at);

    return feedPosts.slice(0, args.limit || 50);
  },
});

export const createPost = mutation({
  args: {
    content: v.string(),
    imageUrl: v.optional(v.string()),
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
    postId: v.id("posts"),
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

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.user_id !== user._id) {
      throw new Error("Not authorized to delete this post");
    }

    await ctx.db.delete(args.postId);
    return { success: true };
  },
});

export const likePost = mutation({
  args: {
    postId: v.id("posts"),
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

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const likes = post.likes || [];
    const userId = user._id;

    if (likes.includes(userId)) {
      await ctx.db.patch(args.postId, {
        likes: likes.filter((id: string) => id !== userId),
      });
      return { success: true, liked: false };
    } else {
      await ctx.db.patch(args.postId, {
        likes: [...likes, userId],
      });
      return { success: true, liked: true };
    }
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
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

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

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
