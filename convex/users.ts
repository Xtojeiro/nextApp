import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSessionUser, resolveSessionUser } from "./authHelpers";
import { assertPositiveInteger, cleanOptionalText, cleanText } from "./validation";
import { Scrypt } from "lucia";

const PASSWORD_MIN_LENGTH = 8;
const defaultPlayerStats = {
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  points: 0,
  assists: 0,
  rebounds: 0,
};

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
  const trimmedEmail = email.trim();
  if (trimmedEmail.length > 254 || trimmedEmail.includes(" ")) return false;

  const atIndex = trimmedEmail.indexOf("@");
  const lastAtIndex = trimmedEmail.lastIndexOf("@");
  if (atIndex <= 0 || atIndex !== lastAtIndex) return false;

  const domain = trimmedEmail.slice(atIndex + 1);
  const localPart = trimmedEmail.slice(0, atIndex);
  const dotIndex = domain.lastIndexOf(".");

  return (
    localPart.length > 0 &&
    domain.length > 3 &&
    dotIndex > 0 &&
    dotIndex < domain.length - 1 &&
    !domain.includes(" ")
  );
}

function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, "").trim();
}

function normalizeRole(role: string): "PLAYER" | "COACH" | "SCOUT" {
  if (role === "athlete" || role === "PLAYER") return "PLAYER";
  if (role === "coach" || role === "COACH") return "COACH";
  return "SCOUT";
}

async function ensureRoleProfile(ctx: any, user: any) {
  if (user.role === "PLAYER") {
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .first();
    if (!existingPlayer) {
      await ctx.db.insert("players", {
        userId: user._id,
        stats: defaultPlayerStats,
      });
      return "player";
    }
  }

  if (user.role === "COACH") {
    const existingCoach = await ctx.db
      .query("coaches")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .first();
    if (!existingCoach) {
      await ctx.db.insert("coaches", { userId: user._id });
      return "coach";
    }
  }

  return null;
}

async function deleteByIndex(ctx: any, table: string, index: string, field: string, value: any) {
  const docs = await ctx.db
    .query(table)
    .withIndex(index, (q: any) => q.eq(field, value))
    .collect();

  for (const doc of docs) {
    await ctx.db.delete(doc._id);
  }
}

async function deleteFirstByIndex(ctx: any, table: string, index: string, field: string, value: any) {
  const doc = await ctx.db
    .query(table)
    .withIndex(index, (q: any) => q.eq(field, value))
    .first();

  if (doc) {
    await ctx.db.delete(doc._id);
  }
}

async function deleteIndexedParentsWithChildren(
  ctx: any,
  parent: UserCleanupTask,
  child: UserCleanupTask,
  value: any,
) {
  const parents = await ctx.db
    .query(parent.table)
    .withIndex(parent.index, (q: any) => q.eq(parent.field, value))
    .collect();

  for (const item of parents) {
    await deleteByIndex(ctx, child.table, child.index, child.field, item._id);
    await ctx.db.delete(item._id);
  }
}

async function deleteUserConversations(ctx: any, userId: any) {
  const conversations = await ctx.db.query("conversations").collect();
  const userConversations = conversations.filter(
    (conversation: any) =>
      conversation.user_one_id === userId || conversation.user_two_id === userId,
  );

  for (const conversation of userConversations) {
    await deleteByIndex(ctx, "messages", "by_conversation_id", "conversation_id", conversation._id);
    await ctx.db.delete(conversation._id);
  }
}

type UserCleanupTask = {
  table: string;
  index: string;
  field: string;
  deleteFirst?: boolean;
};

type CleanupTuple = [table: string, index: string, field: string, deleteFirst?: boolean];

function cleanupTask([table, index, field, deleteFirst]: CleanupTuple): UserCleanupTask {
  return { table, index, field, deleteFirst };
}

const userCleanupTaskTuples: CleanupTuple[] = [
  ["players", "by_userId", "userId", true],
  ["coaches", "by_userId", "userId", true],
  ["posts", "by_user_id", "user_id"],
  ["workoutLogs", "by_userId", "userId"],
  ["workouts", "by_user_id", "user_id"],
  ["follows", "by_follower_id", "follower_id"],
  ["follows", "by_following_id", "following_id"],
  ["followRequests", "by_requester_id", "requester_id"],
  ["followRequests", "by_target_id", "target_id"],
  ["blockedUsers", "by_blockerId", "blockerId"],
  ["blockedUsers", "by_blockedId", "blockedId"],
  ["notifications", "by_userId", "userId"],
  ["userAchievements", "by_userId", "userId"],
];

const userCleanupTasks = userCleanupTaskTuples.map(cleanupTask);

const authCleanupPairs = [
  {
    parent: cleanupTask(["authAccounts", "userIdAndProvider", "userId"]),
    child: cleanupTask(["authVerificationCodes", "accountId", "accountId"]),
  },
  {
    parent: cleanupTask(["authSessions", "userId", "userId"]),
    child: cleanupTask(["authRefreshTokens", "sessionId", "sessionId"]),
  },
];

async function deleteUserRelatedData(ctx: any, userId: any) {
  for (const pair of authCleanupPairs) {
    await deleteIndexedParentsWithChildren(ctx, pair.parent, pair.child, userId);
  }

  for (const task of userCleanupTasks) {
    if (task.deleteFirst) {
      await deleteFirstByIndex(ctx, task.table, task.index, task.field, userId);
    } else {
      await deleteByIndex(ctx, task.table, task.index, task.field, userId);
    }
  }
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

export const isEmailAvailable = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = sanitizeString(args.email).toLowerCase();
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    return existingUser === null;
  },
});

export const auditDuplicateEmails = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const usersByEmail = new Map<string, any[]>();

    for (const user of users) {
      const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
      if (!email) continue;
      usersByEmail.set(email, [...(usersByEmail.get(email) || []), user]);
    }

    return Array.from(usersByEmail.entries())
      .filter(([, emailUsers]) => emailUsers.length > 1)
      .map(([email, emailUsers]) => ({
        email,
        count: emailUsers.length,
        users: emailUsers.map((user) => ({
          _id: user._id,
          full_name: user.full_name || user.name,
          role: user.role,
          created_at: user.created_at,
        })),
      }));
  },
});

export const repairMissingRoleProfiles = mutation({
  args: {
    sessionUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireSessionUser(ctx, args.sessionUserId);
    const users = await ctx.db.query("users").collect();
    let playersCreated = 0;
    let coachesCreated = 0;

    for (const user of users) {
      const created = await ensureRoleProfile(ctx, user);
      if (created === "player") playersCreated += 1;
      if (created === "coach") coachesCreated += 1;
    }

    return { success: true, playersCreated, coachesCreated };
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
          stats: defaultPlayerStats,
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
      throw new Error("Email already in use");
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
        stats: defaultPlayerStats,
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
    if (!targetUserId) {
      return false;
    }

    const user = (await ctx.db.get(targetUserId)) as any;
    return user?.is_public ?? false;
  },
});

export const searchUsers = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
    const limit = args.limit || 20;
    const sanitizedQuery = cleanText(args.query, "Search query", 80).toLowerCase();
    const users = await ctx.db.query("users").collect();

    const matches = users
      .filter((user) => {
        if (user._id === currentUser?._id) return false;
        const publicProfile = user.is_public !== false;
        const publicText = [
          user.full_name,
          user.name,
          user.email,
          publicProfile ? user.bio : undefined,
          publicProfile ? user.location : undefined,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return publicText.includes(sanitizedQuery);
      })
      .slice(0, limit);

    return await Promise.all(
      matches.map(async (user) => {
        const follow = currentUser
          ? await ctx.db
              .query("follows")
              .withIndex("by_follower_id", (q) => q.eq("follower_id", currentUser._id))
              .filter((q) => q.eq(q.field("following_id"), user._id))
              .first()
          : null;
        const request = currentUser
          ? await ctx.db
              .query("followRequests")
              .withIndex("by_requester_id", (q) => q.eq("requester_id", currentUser._id))
              .filter((q) => q.eq(q.field("target_id"), user._id))
              .filter((q) => q.eq(q.field("status"), "pending"))
              .first()
          : null;
        const canViewActivity = Boolean(user.is_public !== false || follow || user._id === currentUser?._id);

        return {
          _id: user._id,
          full_name: user.full_name || user.name || "Utilizador",
          avatar: user.avatar,
          bio: canViewActivity ? user.bio : undefined,
          location: canViewActivity ? user.location : undefined,
          role: user.role,
          is_public: user.is_public ?? true,
          canViewActivity,
          followStatus: follow ? "following" : request ? "pending" : "none",
        };
      }),
    );
  },
});

export const getUserProfileView = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await resolveSessionUser(ctx, args.sessionUserId);
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return null;
    }

    const follow = currentUser
      ? await ctx.db
          .query("follows")
          .withIndex("by_follower_id", (q) => q.eq("follower_id", currentUser._id))
          .filter((q) => q.eq(q.field("following_id"), args.userId))
          .first()
      : null;
    const request = currentUser
      ? await ctx.db
          .query("followRequests")
          .withIndex("by_requester_id", (q) => q.eq("requester_id", currentUser._id))
          .filter((q) => q.eq(q.field("target_id"), args.userId))
          .filter((q) => q.eq(q.field("status"), "pending"))
          .first()
      : null;
    const isOwnProfile = currentUser?._id === args.userId;
    const canViewActivity = Boolean(isOwnProfile || targetUser.is_public !== false || follow);
    const limit = args.limit || 10;

    if (!canViewActivity) {
      return {
        user: {
          _id: targetUser._id,
          full_name: targetUser.full_name || targetUser.name || "Utilizador",
          avatar: targetUser.avatar,
          role: targetUser.role,
          is_public: targetUser.is_public ?? true,
        },
        canViewActivity,
        followStatus: follow ? "following" : request ? "pending" : "none",
        games: [],
        workouts: [],
      };
    }

    const [workouts, gameStats, player] = await Promise.all([
      ctx.db
        .query("workouts")
        .withIndex("by_user_id", (q) => q.eq("user_id", args.userId))
        .collect(),
      ctx.db
        .query("gameStats")
        .withIndex("by_playerId", (q) => q.eq("playerId", args.userId))
        .collect(),
      ctx.db
        .query("players")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first(),
    ]);

    const gamesByStats = await Promise.all(
      gameStats.map(async (stat) => {
        const game = await ctx.db.get(stat.gameId);
        if (!game) return null;
        const [team1, team2] = await Promise.all([
          ctx.db.get(game.team1Id),
          game.team2Id ? ctx.db.get(game.team2Id) : null,
        ]);
        return { ...game, team1, team2, playerStats: stat };
      }),
    );

    let games: any[] = gamesByStats.filter(Boolean);
    if (games.length === 0 && player?.teamId) {
      const teamGames = (await ctx.db.query("games").collect())
        .filter((game) => game.team1Id === player.teamId || game.team2Id === player.teamId)
        .filter((game) => game.status === "completed");
      games = await Promise.all(
        teamGames.map(async (game) => {
          const [team1, team2] = await Promise.all([
            ctx.db.get(game.team1Id),
            game.team2Id ? ctx.db.get(game.team2Id) : null,
          ]);
          return { ...game, team1, team2, playerStats: null };
        }),
      );
    }

    games.sort((a: any, b: any) => (b?.date || 0) - (a?.date || 0));
    workouts.sort((a, b) => b.created_at - a.created_at);

    return {
      user: {
        _id: targetUser._id,
        full_name: targetUser.full_name || targetUser.name || "Utilizador",
        avatar: targetUser.avatar,
        bio: targetUser.bio,
        location: targetUser.location,
        role: targetUser.role,
        is_public: targetUser.is_public ?? true,
      },
      canViewActivity,
      followStatus: follow ? "following" : request ? "pending" : "none",
      games: games.slice(0, limit),
      workouts: workouts.slice(0, limit),
    };
  },
});

export const getTeamAthletes = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, args) => {
    const coach = await resolveSessionUser(ctx, args.sessionUserId);
    if (coach?.role !== "COACH") {
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
        return defaultPlayerStats;
      }
      targetUserId = user._id;
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId!))
      .first();

    return (
      player?.stats || defaultPlayerStats
    );
  },
});

export const getCoachDashboard = query({
  args: {
    sessionUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const coach = await resolveSessionUser(ctx, args.sessionUserId);
    if (coach?.role !== "COACH") {
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

    await deleteUserRelatedData(ctx, userId);
    await deleteUserConversations(ctx, userId);

    await ctx.db.delete(userId);
    return { success: true };
  },
});
