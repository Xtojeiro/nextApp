import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";
import { assertPositiveInteger, cleanOptionalText, cleanText } from "./validation";
import { Scrypt } from "lucia";

const PASSWORD_MIN_LENGTH = 8;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function comparePassword(hash: string, password: string): Promise<boolean> {
  return hash === (await hashPassword(password));
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, "").trim();
}

function normalizeRole(role: string): "PLAYER" | "COACH" | "SCOUT" {
  if (role === "athlete" || role === "PLAYER") return "PLAYER";
  if (role === "coach" || role === "COACH") return "COACH";
  return "SCOUT";
}

export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = sanitizeString(args.email).toLowerCase();
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (!args.password) {
      throw new Error("Password is required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (!user?.password_hash) {
      throw new Error("Invalid email or password");
    }

    const passwordValid = await comparePassword(user.password_hash, args.password);
    if (!passwordValid) {
      throw new Error("Invalid email or password");
    }

    await ctx.db.patch(user._id, {
      is_active: true,
      updated_at: Date.now(),
    });

    return {
      userId: user._id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };
  },
});

export const getCurrentUser = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await resolveSessionUser(ctx, args.sessionUserId);
  },
});

export const ensureUserProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    role: v.optional(v.union(v.literal("PLAYER"), v.literal("COACH"), v.literal("SCOUT"))),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx);
    const now = Date.now();
    const fullName = sanitizeString(args.fullName || user.full_name || user.name || user.email || "User");
    const role = args.role || user.role || "PLAYER";

    await ctx.db.patch(user._id, {
      full_name: fullName,
      name: user.name || fullName,
      role,
      is_active: true,
      is_public: user.is_public ?? true,
      created_at: user.created_at || now,
      updated_at: now,
    });

    if (role === "PLAYER") {
      const existingPlayer = await ctx.db
        .query("players")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (!existingPlayer) {
        await ctx.db.insert("players", {
          userId: user._id,
          stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            points: 0,
            assists: 0,
            rebounds: 0,
          },
        });
      }
    }

    if (role === "COACH") {
      const existingCoach = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (!existingCoach) {
        await ctx.db.insert("coaches", { userId: user._id });
      }
    }

    return { success: true };
  },
});

export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
    role: v.union(
      v.literal("athlete"),
      v.literal("coach"),
      v.literal("scout"),
      v.literal("PLAYER"),
      v.literal("COACH"),
      v.literal("SCOUT"),
    ),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    ),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = sanitizeString(args.email).toLowerCase();
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (sanitizeString(args.name).length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    if (args.password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      );
    }

    if (args.password !== args.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const passwordHash = await hashPassword(args.password);
    const now = Date.now();
    const normalizedRole = normalizeRole(args.role);

    const userId = await ctx.db.insert("users", {
      full_name: sanitizeString(args.name),
      email,
      password_hash: passwordHash,
      role: normalizedRole,
      bio: args.bio ? sanitizeString(args.bio) : undefined,
      location: args.location ? sanitizeString(args.location) : undefined,
      age: args.age,
      gender: args.gender,
      push_token: args.phoneNumber,
      is_active: true,
      is_public: true,
      created_at: now,
      updated_at: now,
    });

    if (normalizedRole === "PLAYER") {
      await ctx.db.insert("players", {
        userId,
        teamId: undefined,
        position: undefined,
        stats: {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          points: 0,
          assists: 0,
          rebounds: 0,
        },
      });
    } else if (normalizedRole === "COACH") {
      await ctx.db.insert("coaches", {
        userId,
      });
    }

    return { success: true, userId, role: normalizedRole };
  },
});

export const updateUser = mutation({
  args: {
    sessionUserId: v.id("users"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    ),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);

    const updateData: Record<string, any> = {
      updated_at: Date.now(),
    };
    if (args.name !== undefined) updateData.full_name = cleanText(args.name, "Name");
    if (args.bio !== undefined) updateData.bio = cleanOptionalText(args.bio, "Bio");
    if (args.location !== undefined) {
      updateData.location = cleanOptionalText(args.location, "Location", 120);
    }
    if (args.age !== undefined) updateData.age = assertPositiveInteger(args.age, "Age");
    if (args.gender !== undefined) updateData.gender = args.gender;
    if (args.phoneNumber !== undefined) updateData.push_token = args.phoneNumber;

    await ctx.db.patch(user._id, updateData);
    return { success: true };
  },
});

export const generateUploadUrl = mutation({
  args: {
    sessionUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireSessionUser(ctx, args.sessionUserId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateAvatar = mutation({
  args: {
    sessionUserId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get avatar URL");
    }

    await ctx.db.patch(user._id, {
      avatar: url,
      updated_at: Date.now(),
    });

    return { success: true, url };
  },
});

export const toggleProfileVisibility = mutation({
  args: {
    sessionUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const nextVisibility = !user.is_public;

    await ctx.db.patch(user._id, {
      is_public: nextVisibility,
      updated_at: Date.now(),
    });

    return { success: true, is_public: nextVisibility };
  },
});

export const getProfileVisibility = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;
    if (!targetUserId) {
      const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
      if (!currentUser) {
        return false;
      }
      targetUserId = currentUser._id;
    }

    const user = (await ctx.db.get(targetUserId!)) as any;
    return user?.is_public ?? false;
  },
});

export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const sanitizedQuery = cleanText(args.query, "Search query", 80).toLowerCase();
    const publicUsers = await ctx.db.query("users").collect();

    return publicUsers
      .filter(
        (user) =>
          user.is_public &&
          ((user.full_name || user.name || user.email || "").toLowerCase().includes(sanitizedQuery) ||
            user.bio?.toLowerCase().includes(sanitizedQuery) ||
            user.location?.toLowerCase().includes(sanitizedQuery)),
      )
      .slice(0, limit);
  },
});

export const getTeamAthletes = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const coach = await resolveSessionUser(ctx, args.sessionUserId);
    if (!coach || coach.role !== "COACH") {
      return [];
    }

    let targetTeamId = args.teamId;
    if (!targetTeamId) {
      const coachProfile = await ctx.db
        .query("coaches")
        .withIndex("by_userId", (q) => q.eq("userId", coach._id))
        .first();
      if (coachProfile?.teamId) {
        targetTeamId = coachProfile.teamId;
      }
    }

    if (!targetTeamId) {
      return [];
    }

    const players = await ctx.db
      .query("players")
      .withIndex("by_teamId", (q) => q.eq("teamId", targetTeamId))
      .collect();

    const users = await Promise.all(players.map((player) => ctx.db.get(player.userId)));
    return users.filter(Boolean);
  },
});

export const addAthleteNote = mutation({
  args: {
    sessionUserId: v.id("users"),
    athleteId: v.id("users"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const coach = await requireSessionUser(ctx, args.sessionUserId);
    if (coach.role !== "COACH") {
      throw new Error("Not authorized");
    }

    return {
      success: true,
      athleteId: args.athleteId,
      note: cleanText(args.note, "Note", 500),
    };
  },
});

export const changePassword = mutation({
  args: {
    sessionUserId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    if (args.newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    const passwordAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", user._id).eq("provider", "password"),
      )
      .first();

    if (!passwordAccount?.secret) {
      if (!user.password_hash) {
        throw new Error("Password account not found");
      }
      if (!(await comparePassword(user.password_hash, args.currentPassword))) {
        throw new Error("Current password is incorrect");
      }
    } else {
      const currentPasswordValid = await new Scrypt().verify(
        passwordAccount.secret,
        args.currentPassword,
      );
      if (!currentPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      await ctx.db.patch(passwordAccount._id, {
        secret: await new Scrypt().hash(args.newPassword),
      });
    }

    await ctx.db.patch(user._id, {
      password_hash: await hashPassword(args.newPassword),
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const getPlayerStats = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;
    if (!targetUserId) {
      const user = await resolveSessionUser(ctx, args.sessionUserId);
      if (!user) {
        return {
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          points: 0,
          assists: 0,
          rebounds: 0,
        };
      }
      targetUserId = user._id;
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId!))
      .first();

    return (
      player?.stats || {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        points: 0,
        assists: 0,
        rebounds: 0,
      }
    );
  },
});

export const getCoachDashboard = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const coach = await resolveSessionUser(ctx, args.sessionUserId);
    if (!coach || coach.role !== "COACH") {
      return { totalAthletes: 0, recentWorkouts: 0, upcomingEvents: 0, athletes: [] };
    }

    const coachProfile = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q) => q.eq("userId", coach._id))
      .first();

    let athletes: any[] = [];
    if (coachProfile?.teamId) {
      athletes = await ctx.db
        .query("players")
        .withIndex("by_teamId", (q) => q.eq("teamId", coachProfile.teamId))
        .collect();
    }

    const recentWorkouts = await ctx.db
      .query("workoutLogs")
      .withIndex("by_userId", (q) => q.eq("userId", coach._id))
      .order("desc")
      .take(5);

    const upcomingEvents = await ctx.db
      .query("events")
      .filter((q) => q.gte(q.field("date"), new Date().toISOString()))
      .filter((q) => q.eq(q.field("user_id"), coach._id))
      .take(5);

    return {
      totalAthletes: athletes.length,
      recentWorkouts: recentWorkouts.length,
      upcomingEvents: upcomingEvents.length,
      athletes,
    };
  },
});

export const deleteAccount = mutation({
  args: {
    sessionUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireSessionUser(ctx, args.sessionUserId);
    const userId = user._id;

    const authAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of authAccounts) {
      const verificationCodes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of verificationCodes) {
        await ctx.db.delete(code._id);
      }
      await ctx.db.delete(account._id);
    }

    const authSessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of authSessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of refreshTokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    const playerProfile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (playerProfile) {
      await ctx.db.delete(playerProfile._id);
    }

    const coachProfile = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (coachProfile) {
      await ctx.db.delete(coachProfile._id);
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();
    for (const post of posts) {
      await ctx.db.delete(post._id);
    }

    const workoutLogs = await ctx.db
      .query("workoutLogs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const log of workoutLogs) {
      await ctx.db.delete(log._id);
    }

    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();
    for (const workout of workouts) {
      await ctx.db.delete(workout._id);
    }

    const followsAsFollower = await ctx.db
      .query("follows")
      .withIndex("by_follower_id", (q) => q.eq("follower_id", userId))
      .collect();
    for (const follow of followsAsFollower) {
      await ctx.db.delete(follow._id);
    }

    const followsAsFollowing = await ctx.db
      .query("follows")
      .withIndex("by_following_id", (q) => q.eq("following_id", userId))
      .collect();
    for (const follow of followsAsFollowing) {
      await ctx.db.delete(follow._id);
    }

    const blockedByUser = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blockerId", (q) => q.eq("blockerId", userId))
      .collect();
    for (const blocked of blockedByUser) {
      await ctx.db.delete(blocked._id);
    }

    const blockedUsers = await ctx.db
      .query("blockedUsers")
      .withIndex("by_blockedId", (q) => q.eq("blockedId", userId))
      .collect();
    for (const blocked of blockedUsers) {
      await ctx.db.delete(blocked._id);
    }

    const conversations = await ctx.db.query("conversations").collect();
    const userConversations = conversations.filter(
      (conversation) =>
        conversation.user_one_id === userId || conversation.user_two_id === userId,
    );
    for (const conversation of userConversations) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation_id", (q) =>
          q.eq("conversation_id", conversation._id),
        )
        .collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      await ctx.db.delete(conversation._id);
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    const userAchievements = await ctx.db
      .query("userAchievements")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const achievement of userAchievements) {
      await ctx.db.delete(achievement._id);
    }

    await ctx.db.delete(userId);
    return { success: true };
  },
});
