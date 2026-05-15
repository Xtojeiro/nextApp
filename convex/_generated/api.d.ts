/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as chat from "../chat.js";
import type * as demo from "../demo.js";
import type * as events from "../events.js";
import type * as follows from "../follows.js";
import type * as gameStats from "../gameStats.js";
import type * as games from "../games.js";
import type * as groupConversations from "../groupConversations.js";
import type * as http from "../http.js";
import type * as injuries from "../injuries.js";
import type * as invites from "../invites.js";
import type * as notifications from "../notifications.js";
import type * as rankings from "../rankings.js";
import type * as scout from "../scout.js";
import type * as seasons from "../seasons.js";
import type * as teams from "../teams.js";
import type * as trainingPlans from "../trainingPlans.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  attendance: typeof attendance;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  chat: typeof chat;
  demo: typeof demo;
  events: typeof events;
  follows: typeof follows;
  gameStats: typeof gameStats;
  games: typeof games;
  groupConversations: typeof groupConversations;
  http: typeof http;
  injuries: typeof injuries;
  invites: typeof invites;
  notifications: typeof notifications;
  rankings: typeof rankings;
  scout: typeof scout;
  seasons: typeof seasons;
  teams: typeof teams;
  trainingPlans: typeof trainingPlans;
  users: typeof users;
  validation: typeof validation;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
