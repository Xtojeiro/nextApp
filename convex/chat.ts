import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";

export const getConversations = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    const allConversations = await ctx.db.query("conversations").collect();
    const conversations = allConversations
      .filter(
        (conversation) =>
          conversation.user_one_id === user._id ||
          conversation.user_two_id === user._id,
      )
      .sort(
        (a, b) =>
          (b.updated_at || b.created_at) - (a.updated_at || a.created_at),
      )
      .slice(0, args.limit || 50);

    return await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipantId =
          conversation.user_one_id === user._id
            ? conversation.user_two_id
            : conversation.user_one_id;
        const otherParticipant = await ctx.db.get(otherParticipantId);
        const latestMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_id", (q) =>
            q.eq("conversation_id", conversation._id),
          )
          .order("desc")
          .take(1);
        const allMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_id", (q) =>
            q.eq("conversation_id", conversation._id),
          )
          .collect();

        return {
          id: conversation._id,
          _id: conversation._id,
          otherUser: otherParticipant
            ? {
                id: otherParticipant._id,
                _id: otherParticipant._id,
                full_name: otherParticipant.full_name,
                avatar_url: otherParticipant.avatar,
              }
            : null,
          lastMessage: latestMessages[0]
            ? {
                ...latestMessages[0],
                id: latestMessages[0]._id,
              }
            : null,
          unreadCount: allMessages.filter(
            (message) => !message.is_read && message.sender_id !== user._id,
          ).length,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
        };
      }),
    );
  },
});

export const getMessages = query({
  args: {
    sessionUserId: v.id("users"),
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const conversation = await ctx.db.get(args.conversationId);
    if (
      !conversation ||
      (conversation.user_one_id !== user._id &&
        conversation.user_two_id !== user._id)
    ) {
      throw new Error("Not authorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversation_id", args.conversationId),
      )
      .order("desc")
      .take(args.limit || 50);

    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.sender_id);
        return {
          id: message._id,
          _id: message._id,
          sender_id: message.sender_id,
          conversation_id: message.conversation_id,
          content: message.content,
          created_at: message.created_at,
          is_read: message.is_read,
          sender: sender
            ? {
                _id: sender._id,
                id: sender._id,
                name: sender.full_name,
                avatar: sender.avatar,
              }
            : null,
        };
      }),
    );

    return messagesWithSenders.reverse();
  },
});

export const sendMessage = mutation({
  args: {
    sessionUserId: v.id("users"),
    conversationId: v.optional(v.id("conversations")),
    recipientId: v.optional(v.id("users")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const sender = await requireSessionUser(ctx, args.sessionUserId);
    let conversationId = args.conversationId;

    if (!conversationId) {
      if (!args.recipientId) {
        throw new Error("Recipient ID required for new conversation");
      }

      const allConversations = await ctx.db.query("conversations").collect();
      const existingConversation = allConversations.find(
        (conversation) =>
          (conversation.user_one_id === sender._id &&
            conversation.user_two_id === args.recipientId) ||
          (conversation.user_one_id === args.recipientId &&
            conversation.user_two_id === sender._id),
      );

      conversationId =
        existingConversation?._id ||
        (await ctx.db.insert("conversations", {
          user_one_id: sender._id,
          user_two_id: args.recipientId,
          last_message: args.content,
          last_message_at: Date.now(),
          created_at: Date.now(),
          updated_at: Date.now(),
        }));
    }

    const conversation = await ctx.db.get(conversationId);
    if (
      !conversation ||
      (conversation.user_one_id !== sender._id &&
        conversation.user_two_id !== sender._id)
    ) {
      throw new Error("Not authorized");
    }

    const timestamp = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversation_id: conversationId,
      sender_id: sender._id,
      content: args.content,
      created_at: timestamp,
      is_read: true,
    });

    await ctx.db.patch(conversationId, {
      last_message: args.content,
      last_message_at: timestamp,
      updated_at: timestamp,
    });

    return { success: true, messageId, conversationId };
  },
});

export const createConversation = mutation({
  args: {
    sessionUserId: v.id("users"),
    recipientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sender = await requireSessionUser(ctx, args.sessionUserId);
    if (sender._id === args.recipientId) {
      throw new Error("Cannot start conversation with yourself");
    }

    const allConversations = await ctx.db.query("conversations").collect();
    const existingConversation = allConversations.find(
      (conversation) =>
        (conversation.user_one_id === sender._id &&
          conversation.user_two_id === args.recipientId) ||
        (conversation.user_one_id === args.recipientId &&
          conversation.user_two_id === sender._id),
    );

    if (existingConversation) {
      return { success: true, conversationId: existingConversation._id };
    }

    const conversationId = await ctx.db.insert("conversations", {
      user_one_id: sender._id,
      user_two_id: args.recipientId,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return { success: true, conversationId };
  },
});

export const markMessagesAsRead = mutation({
  args: {
    sessionUserId: v.id("users"),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const conversation = await ctx.db.get(args.conversationId);
    if (
      !conversation ||
      (conversation.user_one_id !== user._id &&
        conversation.user_two_id !== user._id)
    ) {
      throw new Error("Not authorized");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversation_id", args.conversationId),
      )
      .collect();

    let updatedCount = 0;
    for (const message of messages) {
      if (!message.is_read) {
        await ctx.db.patch(message._id, { is_read: true });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});

export const blockUser = mutation({
  args: {
    sessionUserId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const blocker = await requireSessionUser(ctx, args.sessionUserId);
    if (blocker._id === args.userId) {
      throw new Error("Cannot block yourself");
    }

    const existingBlock = await ctx.db
      .query("blockedUsers")
      .filter((q) =>
        q.and(
          q.eq(q.field("blockerId"), blocker._id),
          q.eq(q.field("blockedId"), args.userId),
        ),
      )
      .first();

    if (existingBlock) {
      throw new Error("User already blocked");
    }

    await ctx.db.insert("blockedUsers", {
      blockerId: blocker._id,
      blockedId: args.userId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const unblockUser = mutation({
  args: {
    sessionUserId: v.id("users"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const blocker = await requireSessionUser(ctx, args.sessionUserId);
    const block = await ctx.db
      .query("blockedUsers")
      .filter((q) =>
        q.and(
          q.eq(q.field("blockerId"), blocker._id),
          q.eq(q.field("blockedId"), args.userId),
        ),
      )
      .first();

    if (!block) {
      throw new Error("User not blocked");
    }

    await ctx.db.delete(block._id);
    return { success: true };
  },
});

export const getBlockedUsers = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await resolveSessionUser(ctx, args.sessionUserId);
    if (!user) {
      return [];
    }

    const blockedRelations = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blockerId", (q) => q.eq("blockerId", user._id))
      .collect();

    const blockedUsers = await Promise.all(
      blockedRelations.map(async (relation) => {
        const blockedUser = await ctx.db.get(relation.blockedId);
        return blockedUser
          ? {
              _id: blockedUser._id,
              id: blockedUser._id,
              name: blockedUser.full_name,
              avatar: blockedUser.avatar,
              blockedAt: relation.createdAt,
            }
          : null;
      }),
    );

    return blockedUsers.filter(Boolean);
  },
});

export const searchUsersToMessage = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
    if (!currentUser) {
      return [];
    }

    const blockedRelations = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blockerId", (q) => q.eq("blockerId", currentUser._id))
      .collect();
    const blockedIds = new Set(blockedRelations.map((relation) => relation.blockedId));
    const searchLower = args.searchQuery.toLowerCase();
    const allUsers = await ctx.db.query("users").collect();

    return allUsers
      .filter((user) => {
        if (user._id === currentUser._id) return false;
        if (blockedIds.has(user._id)) return false;
        return (
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower)
        );
      })
      .map((user) => ({
        id: user._id,
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar,
        role: user.role,
      }))
      .slice(0, 20);
  },
});
