// ============================================================
// Convex Database Schema — DBML format for dbdiagram.io
// Generated from: convex/schema.ts
// ============================================================

// ======================== TABLES ============================

Table users {
  _id string [pk, note: 'Convex document ID']
  full_name string [not null]
  email string [not null]
  password_hash string
  role string [not null, note: 'PLAYER | COACH | SCOUT']
  avatar string
  bio string
  location string
  age number
  gender string [note: 'male | female | other']
  push_token string
  is_active boolean [not null]
  is_public boolean
  created_at number [not null]
  updated_at number [not null]

  indexes {
    email [name: 'by_email']
    role [name: 'by_role']
  }
}

Table players {
  _id string [pk, note: 'Convex document ID']
  userId string [not null, ref: > users._id]
  height number
  weight number
  position string
  dominantHand string [note: 'left | right']
  teamId string [ref: > teams._id]
  coachId string [ref: > users._id, note: 'FK to users (coach)']
  // --- Embedded stats object ---
  stats_gamesPlayed number
  stats_wins number
  stats_losses number
  stats_points number
  stats_assists number
  stats_rebounds number

  indexes {
    userId [name: 'by_userId']
    teamId [name: 'by_teamId']
    coachId [name: 'by_coachId']
  }
}

Table coaches {
  _id string [pk, note: 'Convex document ID']
  userId string [not null, ref: > users._id]
  certification string
  experience number
  specialization string [note: 'Array of strings (JSON)']
  teamId string [ref: > teams._id]

  indexes {
    userId [name: 'by_userId']
    teamId [name: 'by_teamId']
  }
}

Table teams {
  _id string [pk, note: 'Convex document ID']
  name string [not null]
  description string
  logo string
  coachId string [not null, ref: > users._id]
  createdAt number [not null]
  updatedAt number [not null]

  indexes {
    coachId [name: 'by_coachId']
  }
}

Table workouts {
  _id string [pk, note: 'Convex document ID']
  user_id string [not null, ref: > users._id]
  name string [not null]
  description string
  type string
  duration_minutes number
  objective string
  scheduledDate number
  difficulty string [note: 'beginner | intermediate | advanced']
  status string [not null, note: 'scheduled | in_progress | completed | skipped']
  created_at number [not null]

  indexes {
    user_id [name: 'by_user_id']
  }
}

Table workoutLogs {
  _id string [pk, note: 'Convex document ID']
  userId string [not null, ref: > users._id]
  workoutId string [not null, ref: > workouts._id]
  completedDate number [not null]
  duration number [not null]
  // --- Embedded exercises array ---
  // Each exercise: { name, sets, reps, weight?, duration? }
  exercises string [not null, note: 'Array of exercise objects (JSON)']
  notes string

  indexes {
    userId [name: 'by_userId']
    workoutId [name: 'by_workoutId']
    completedDate [name: 'by_completedDate']
  }
}

Table games {
  _id string [pk, note: 'Convex document ID']
  name string [not null]
  team1Id string [not null, ref: > teams._id]
  team2Id string [not null, ref: > teams._id]
  date number [not null]
  location string [not null]
  status string [not null, note: 'scheduled | in_progress | completed | cancelled']
  score1 number
  score2 number
  notes string
  createdBy string [not null, ref: > users._id]
  createdAt number [not null]
  updatedAt number [not null]

  indexes {
    team1Id [name: 'by_team1Id']
    team2Id [name: 'by_team2Id']
    date [name: 'by_date']
    status [name: 'by_status']
  }
}

Table events {
  _id string [pk, note: 'Convex document ID']
  title string [not null]
  description string
  date string [not null]
  start_time string [not null]
  end_time string [not null]
  location string
  type string [not null, note: 'game | training | meeting | other']
  user_id string [not null, ref: > users._id]
  notes string
  created_at number [not null]

  indexes {
    date [name: 'by_date']
    user_id [name: 'by_user_id']
  }
}

Table trainingPlans {
  _id string [pk, note: 'Convex document ID']
  name string [not null]
  description string
  coachId string [not null, ref: > users._id]
  // --- workouts is an array of workout IDs ---
  workouts string [not null, note: 'Array of workout IDs (JSON)']
  duration number [not null]
  difficulty string [not null, note: 'beginner | intermediate | advanced']
  goals string [note: 'Array of strings (JSON)']
  isActive boolean [not null]
  createdAt number [not null]
  updatedAt number [not null]

  indexes {
    coachId [name: 'by_coachId']
    isActive [name: 'by_active']
  }
}

// Junction-like relationship: trainingPlans -> workouts (many-to-many via array)
Table trainingPlan_workouts {
  _id string [pk, note: 'Virtual junction table']
  trainingPlanId string [not null, ref: > trainingPlans._id]
  workoutId string [not null, ref: > workouts._id]

  Note: 'Virtual table — in Convex this is stored as an array of IDs inside trainingPlans.workouts'
}

Table conversations {
  _id string [pk, note: 'Convex document ID']
  user_one_id string [not null, ref: > users._id]
  user_two_id string [not null, ref: > users._id]
  last_message string
  last_message_at number
  created_at number [not null]
  updated_at number
}

Table messages {
  _id string [pk, note: 'Convex document ID']
  conversation_id string [not null, ref: > conversations._id]
  sender_id string [not null, ref: > users._id]
  content string [not null]
  created_at number [not null]
  is_read boolean [not null]

  indexes {
    conversation_id [name: 'by_conversation_id']
  }
}

Table blockedUsers {
  _id string [pk, note: 'Convex document ID']
  blockerId string [not null, ref: > users._id]
  blockedId string [not null, ref: > users._id]
  reason string
  createdAt number [not null]

  indexes {
    blockerId [name: 'by_blockerId']
    blockedId [name: 'by_blockedId']
  }
}

Table follows {
  _id string [pk, note: 'Convex document ID']
  follower_id string [not null, ref: > users._id]
  following_id string [not null, ref: > users._id]
  created_at number [not null]

  indexes {
    follower_id [name: 'by_follower_id']
    following_id [name: 'by_following_id']
  }
}

Table posts {
  _id string [pk, note: 'Convex document ID']
  user_id string [not null, ref: > users._id]
  content string [not null]
  images string [note: 'Array of image URLs (JSON)']
  image_url string
  likes string [note: 'Array of user IDs (JSON)']
  // --- Embedded comments array ---
  // Each comment: { user_id (FK users), content, timestamp }
  comments string [note: 'Array of comment objects (JSON)']
  is_public boolean
  created_at number [not null]

  indexes {
    user_id [name: 'by_user_id']
  }
}

Table scoutReports {
  _id string [pk, note: 'Convex document ID']
  scoutId string [not null, ref: > users._id, note: 'FK to users (scout)']
  athleteId string [not null, ref: > users._id, note: 'FK to users (athlete)']
  content string [not null]
  rating number
  position string
  strengths string [note: 'Array of strings (JSON)']
  weaknesses string [note: 'Array of strings (JSON)']
  createdAt number [not null]

  indexes {
    scoutId [name: 'by_scoutId']
    athleteId [name: 'by_athleteId']
  }
}

Table invites {
  _id string [pk, note: 'Convex document ID']
  coachId string [not null, ref: > users._id, note: 'FK to users (coach)']
  athleteId string [not null, ref: > users._id, note: 'FK to users (athlete)']
  status string [not null, note: 'pending | accepted | rejected']
  message string
  createdAt number [not null]

  indexes {
    coachId [name: 'by_coachId']
    athleteId [name: 'by_athleteId']
    status [name: 'by_status']
  }
}
