import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get conversations for current user
export const getConversations = query({
  args: {
    limit: v.optional(v.number()),
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

    // Get conversations where user is a participant
    const allConversations = await ctx.db.query("conversations").collect();

    const conversations = allConversations
      .filter(
        (conv) =>
          conv.user_one_id === user._id || conv.user_two_id === user._id,
      )
      .sort(
        (a, b) =>
          (b.updated_at || b.created_at) - (a.updated_at || a.created_at),
      )
      .slice(0, args.limit || 50);

    // Get participant details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conversation) => {
        const otherParticipantId =
          conversation.user_one_id === user._id
            ? conversation.user_two_id
            : conversation.user_one_id;
        const otherParticipant = await ctx.db.get(otherParticipantId);

        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_id", (q) =>
            q.eq("conversation_id", conversation._id),
          )
          .order("desc")
          .take(1);

        return {
          ...conversation,
          otherParticipant,
          lastMessage: messages[0] || null,
        };
      }),
    );

    return conversationsWithDetails;
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
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

    // Get sender details for each message
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.sender_id);
        return {
          ...message,
          sender: sender
            ? {
                _id: sender._id,
                name: sender.full_name,
                avatar: sender.avatar,
              }
            : null,
        };
      }),
    );

    return messagesWithSenders.reverse(); // Return in chronological order
  },
});

// Send message
export const sendMessage = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    recipientId: v.optional(v.id("users")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const sender = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!sender) {
      throw new Error("User not found");
    }

    let conversationId = args.conversationId;

    // If no conversationId provided, create new conversation
    if (!conversationId) {
      if (!args.recipientId) {
        throw new Error("Recipient ID required for new conversation");
      }

      // Check if conversation already exists
      const allConversations = await ctx.db.query("conversations").collect();

      const existingConversation = allConversations.find(
        (conv) =>
          (conv.user_one_id === sender._id &&
            conv.user_two_id === args.recipientId!) ||
          (conv.user_one_id === args.recipientId! &&
            conv.user_two_id === sender._id),
      );

      if (existingConversation) {
        conversationId = existingConversation._id;
      } else {
        // Create new conversation
        conversationId = await ctx.db.insert("conversations", {
          user_one_id: sender._id,
          user_two_id: args.recipientId!,
          last_message: args.content,
          last_message_at: Date.now(),
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }

    // Verify user is part of the conversation
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

    // Update conversation with last message
    await ctx.db.patch(conversationId, {
      last_message: args.content,
      last_message_at: timestamp,
      updated_at: timestamp,
    });

    return { success: true, messageId };
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (
      !conversation ||
      (conversation.user_one_id !== user._id &&
        conversation.user_two_id !== user._id)
    ) {
      throw new Error("Not authorized");
    }

    // Get unread messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_id", (q) =>
        q.eq("conversation_id", args.conversationId),
      )
      .collect();

    let updatedCount = 0;
    for (const message of messages) {
      if (!message.is_read) {
        await ctx.db.patch(message._id, {
          is_read: true,
        });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});

// Block user
export const blockUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const blocker = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!blocker) {
      throw new Error("User not found");
    }

    if (blocker._id === args.userId) {
      throw new Error("Cannot block yourself");
    }

    // Check if already blocked
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

// Unblock user
export const unblockUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const blocker = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!blocker) {
      throw new Error("User not found");
    }

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

// Get blocked users
export const getBlockedUsers = query({
  args: {},
  handler: async (ctx) => {
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
