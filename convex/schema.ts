import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users base table
  users: defineTable({
    full_name: v.string(), // Changed from name to match existing data
    email: v.string(),
    password_hash: v.optional(v.string()), // Changed to match existing data
    role: v.union(v.literal("PLAYER"), v.literal("COACH"), v.literal("SCOUT")), // Changed to match existing data
    avatar: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    ),
    push_token: v.optional(v.string()), // Added to match existing data
    is_active: v.boolean(), // Changed to snake_case
    is_public: v.optional(v.boolean()), // Added for profile visibility
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Players (extended user data for athletes)
  players: defineTable({
    userId: v.id("users"),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    position: v.optional(v.string()),
    dominantHand: v.optional(v.union(v.literal("left"), v.literal("right"))),
    teamId: v.optional(v.id("teams")),
    coachId: v.optional(v.id("users")),
    stats: v.optional(
      v.object({
        gamesPlayed: v.number(),
        wins: v.number(),
        losses: v.number(),
        points: v.number(),
        assists: v.number(),
        rebounds: v.number(),
      }),
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_teamId", ["teamId"])
    .index("by_coachId", ["coachId"]),

  // Coaches (extended user data for coaches)
  coaches: defineTable({
    userId: v.id("users"),
    certification: v.optional(v.string()),
    experience: v.optional(v.number()),
    specialization: v.optional(v.array(v.string())),
    teamId: v.optional(v.id("teams")),
  })
    .index("by_userId", ["userId"])
    .index("by_teamId", ["teamId"]),

  // Teams
  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    coachId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_coachId", ["coachId"]),

  // Workouts
  workouts: defineTable({
    user_id: v.string(), // Changed to string to match existing data
    name: v.string(),
    description: v.optional(v.string()), // Added to match existing data
    type: v.optional(v.string()), // Added to match existing data
    duration_minutes: v.optional(v.number()), // Changed to match existing data
    objective: v.optional(v.string()), // Added to match existing data
    scheduledDate: v.optional(v.number()), // Added
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    )), // Added
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("skipped"),
    ),
    created_at: v.number(),
  }),

  // Workout logs
  workoutLogs: defineTable({
    userId: v.id("users"),
    workoutId: v.id("workouts"),
    completedDate: v.number(),
    duration: v.number(),
    exercises: v.array(
      v.object({
        name: v.string(),
        sets: v.number(),
        reps: v.number(),
        weight: v.optional(v.number()),
        duration: v.optional(v.number()),
      }),
    ),
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_workoutId", ["workoutId"])
    .index("by_completedDate", ["completedDate"]),

  // Games
  games: defineTable({
    name: v.string(),
    team1Id: v.id("teams"),
    team2Id: v.id("teams"),
    date: v.number(),
    location: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    score1: v.optional(v.number()),
    score2: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team1Id", ["team1Id"])
    .index("by_team2Id", ["team2Id"])
    .index("by_date", ["date"])
    .index("by_status", ["status"]),

  // Events (calendar events)
  events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(), // Changed to string to match existing data
    start_time: v.string(), // Changed to string to match existing data
    end_time: v.string(), // Changed to string to match existing data
    location: v.optional(v.string()),
    type: v.union(
      v.literal("game"),
      v.literal("training"),
      v.literal("meeting"),
      v.literal("other"),
    ),
    user_id: v.string(), // Changed to string to match existing data
    notes: v.optional(v.string()), // Added to match existing data
    created_at: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_user_id", ["user_id"]),

  // Training plans
  trainingPlans: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    coachId: v.id("users"),
    workouts: v.array(v.id("workouts")),
    duration: v.number(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
    ),
    goals: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coachId", ["coachId"])
    .index("by_active", ["isActive"]),

  // Conversations
  conversations: defineTable({
    user_one_id: v.id("users"),
    user_two_id: v.id("users"),
    last_message: v.optional(v.string()),
    last_message_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.optional(v.number()),
  }),

  // Messages
  messages: defineTable({
    conversation_id: v.id("conversations"),
    sender_id: v.id("users"),
    content: v.string(),
    created_at: v.number(),
    is_read: v.boolean(),
  }).index("by_conversation_id", ["conversation_id"]),

  // Blocked users
  blockedUsers: defineTable({
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    reason: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_blockerId", ["blockerId"])
    .index("by_blockedId", ["blockedId"]),

  // Follows
  follows: defineTable({
    follower_id: v.string(), // Changed to string to match existing data
    following_id: v.string(), // Changed to string to match existing data
    created_at: v.number(),
  }),

  // Posts
  posts: defineTable({
    user_id: v.string(), // Changed to string to match existing data
    content: v.string(),
    images: v.optional(v.array(v.string())),
    image_url: v.optional(v.string()), // Added to match existing data
    likes: v.optional(v.array(v.string())), // Changed to string to match existing data and optional
    comments: v.optional(
      v.array(
        v.object({
          // Made optional to match existing data
          user_id: v.string(), // Changed to string
          content: v.string(),
          timestamp: v.number(),
        }),
      ),
    ),
    is_public: v.optional(v.boolean()), // Changed to snake_case and optional
    created_at: v.number(),
  }),
});
