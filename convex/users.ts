import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

const PASSWORD_MIN_LENGTH = 8;

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

async function comparePassword(hash: string, password: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hash === computedHash;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, "");
}

export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidEmail(sanitizeString(args.email))) {
      throw new Error("Invalid email format");
    }

    if (args.password.length === 0) {
      throw new Error("Password is required");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.password_hash) {
      throw new Error("Invalid email or password");
    }

    const emailLower = args.email.toLowerCase();
    const userEmailLower = user.email.toLowerCase();
    if (emailLower !== userEmailLower) {
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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    return user;
  },
});

export const registerUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
    role: v.union(v.literal("athlete"), v.literal("coach"), v.literal("scout")),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    ),
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isValidEmail(sanitizeString(args.email))) {
      throw new Error("Invalid email format");
    }

    if (args.password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    if (args.password !== args.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    const passwordHash = await hashPassword(args.password);
    const now = Date.now();

    const roleMap: Record<string, "PLAYER" | "COACH" | "SCOUT"> = {
      athlete: "PLAYER",
      coach: "COACH",
      scout: "SCOUT",
    };

    const userId = await ctx.db.insert("users", {
      full_name: sanitizeString(args.name),
      email: args.email.toLowerCase(),
      password_hash: passwordHash,
      role: roleMap[args.role],
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

    if (args.role === "athlete") {
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
    } else if (args.role === "coach") {
      await ctx.db.insert("coaches", {
        userId,
      });
    }

    return userId;
  },
});

export const updateUser = mutation({
  args: {
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

    const updateData: any = {};
    if (args.name !== undefined) updateData.full_name = sanitizeString(args.name);
    if (args.bio !== undefined) updateData.bio = sanitizeString(args.bio);
    if (args.location !== undefined) updateData.location = sanitizeString(args.location);
    if (args.age !== undefined) updateData.age = args.age;
    if (args.gender !== undefined) updateData.gender = args.gender;
    if (args.phoneNumber !== undefined) updateData.push_token = args.phoneNumber;
    updateData.updated_at = Date.now();

    await ctx.db.patch(user._id, updateData);
    return { success: true };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const updateAvatar = mutation({
  args: {
    storageId: v.id("_storage"),
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
  args: {},
  handler: async (ctx) => {
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

    await ctx.db.patch(user._id, {
      is_public: !user.is_public,
      updated_at: Date.now(),
    });

    return { is_public: !user.is_public };
  },
});

export const getProfileVisibility = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;

    if (!targetUserId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return false;
      }
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!user) {
        return false;
      }
      targetUserId = user._id;
    }

    const user = await ctx.db.get(targetUserId);
    if (!user) {
      return false;
    }

    return user.is_public;
  },
});

export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const sanitizedQuery = sanitizeString(args.query);

    const publicUsers = await ctx.db.query("users").collect();

    const filteredUsers = publicUsers.filter(
      (user) =>
        user.is_public &&
        (user.full_name.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
          user.bio?.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
          user.location?.toLowerCase().includes(sanitizedQuery.toLowerCase())),
    );

    return filteredUsers.slice(0, limit);
  },
});

export const getTeamAthletes = query({
  args: {
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

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

    const users = await Promise.all(
      players.map(async (player) => {
        return await ctx.db.get(player.userId);
      }),
    );

    return users.filter(Boolean);
  },
});

export const addAthleteNote = mutation({
  args: {
    athleteId: v.id("users"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!coach || coach.role !== "COACH") {
      throw new Error("Not authorized");
    }

    return { success: true };
  },
});

export const getPlayerStats = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;

    if (!targetUserId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return { gamesPlayed: 0, wins: 0, losses: 0, points: 0, assists: 0, rebounds: 0 };
      }
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!user) {
        return { gamesPlayed: 0, wins: 0, losses: 0, points: 0, assists: 0, rebounds: 0 };
      }
      targetUserId = user._id;
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .first();

    if (!player) {
      return { gamesPlayed: 0, wins: 0, losses: 0, points: 0, assists: 0, rebounds: 0 };
    }

    return (
      player.stats || {
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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { totalAthletes: 0, recentWorkouts: 0, upcomingEvents: 0, athletes: [] };
    }

    const coach = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

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
