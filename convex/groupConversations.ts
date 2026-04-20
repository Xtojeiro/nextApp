import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get group conversation by ID
export const getById = query({
  args: { id: v.id("groupConversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get groups where user is a member
export const getGroupsByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    const groups = [];
    for (const membership of memberships) {
      const group = await ctx.db.get(membership.groupId);
      if (group) {
        groups.push({ ...group, role: membership.role, joinedAt: membership.joinedAt });
      }
    }
    return groups;
  },
});

// Get members of a group
export const getMembers = query({
  args: { groupId: v.id("groupConversations") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    
    const members = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        members.push({ ...membership, user });
      }
    }
    return members;
  },
});

// Get messages from a group
export const getMessages = query({
  args: { groupId: v.id("groupConversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupMessages")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .order("asc")
      .take(100);
  },
});

// Create group conversation
export const create = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    adminId: v.id("users"),
    avatar: v.optional(v.string()),
    memberIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { memberIds, adminId, ...groupData } = args;
    const now = Date.now();
    
    // Create the group
    const groupId = await ctx.db.insert("groupConversations", {
      ...groupData,
      adminId,
      createdAt: now,
      updatedAt: now,
    });
    
    // Add admin as member
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: adminId,
      role: "admin",
      joinedAt: now,
    });
    
    // Add other members
    for (const userId of memberIds) {
      if (userId !== adminId) {
        await ctx.db.insert("groupMembers", {
          groupId,
          userId,
          role: "member",
          joinedAt: now,
        });
      }
    }
    
    return groupId;
  },
});

// Add member to group
export const addMember = mutation({
  args: {
    groupId: v.id("groupConversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if already a member
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    
    const alreadyMember = existing.some((m) => m.userId === args.userId);
    if (alreadyMember) {
      throw new Error("User is already a member of this group");
    }
    
    const memberId = await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });
    
    // Update group timestamp
    await ctx.db.patch(args.groupId, { updatedAt: Date.now() });
    
    return memberId;
  },
});

// Remove member from group
export const removeMember = mutation({
  args: {
    groupId: v.id("groupConversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.groupId))
      .collect();
    
    const membership = memberships.find((m) => m.userId === args.userId);
    if (membership) {
      await ctx.db.delete(membership._id);
    }
    
    // Update group timestamp
    await ctx.db.patch(args.groupId, { updatedAt: Date.now() });
  },
});

// Send message to group
export const sendMessage = mutation({
  args: {
    groupId: v.id("groupConversations"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("groupMessages", {
      groupId: args.groupId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),
      isRead: false,
    });
    
    // Update group timestamp
    await ctx.db.patch(args.groupId, { updatedAt: Date.now() });
    
    return messageId;
  },
});

// Update group
export const update = mutation({
  args: {
    id: v.id("groupConversations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

// Delete group
export const remove = mutation({
  args: { id: v.id("groupConversations") },
  handler: async (ctx, args) => {
    // Delete all members
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.id))
      .collect();
    
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    
    // Delete all messages
    const messages = await ctx.db
      .query("groupMessages")
      .withIndex("by_groupId", (q) => q.eq("groupId", args.id))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete the group
    await ctx.db.delete(args.id);
  },
});
