PS C:\Users\tomas\desktop\escola\pap\expo\nextapp> npx convex dev
A patch update is available for Convex (1.31.6 → 1.31.7)
Changelog: https://github.com/get-convex/convex-js/blob/main/CHANGELOG.md#changelog
✖ TypeScript typecheck via `tsc` failed.
To ignore failing typecheck, use `--typecheck=disable`.
convex/events.ts:79:7 - error TS2322: Type 'string' is not assignable to type 'Id<"users">'.
  Type 'string' is not assignable to type '{ __tableName: "users"; }'.

79       user_id: user._id.toString(),
         ~~~~~~~

  node_modules/convex/dist/esm-types/type_utils.d.ts:11:97
    11 export type Expand<ObjectType extends Record<any, any>> = ObjectType extends Record<any, any> ? {
                                                                                                       ~
    12     [Key in keyof ObjectType]: ObjectType[Key];
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    13 } : never;
       ~
    The expected type comes from property 'user_id' which is declared here on type '{ location?: string | undefined; description?: string | undefined; notes?: string | undefined; type: "other" | "game" | "training" | "meeting"; created_at: number; user_id: Id<"users">; date: string; title: string; start_time: string; end_time: string; }'
convex/follows.ts:165:7 - error TS2322: Type 'string' is not assignable to type 'Id<"users">'.
  Type 'string' is not assignable to type '{ __tableName: "users"; }'.

165       follower_id: follower._id.toString(),
          ~~~~~~~~~~~

  node_modules/convex/dist/esm-types/type_utils.d.ts:11:97
    11 export type Expand<ObjectType extends Record<any, any>> = ObjectType extends Record<any, any> ? {
                                                                                                       ~
    12     [Key in keyof ObjectType]: ObjectType[Key];
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    13 } : never;
       ~
    The expected type comes from property 'follower_id' which is declared here on type '{ created_at: number; follower_id: Id<"users">; following_id: Id<"users">; }'

convex/follows.ts:166:7 - error TS2322: Type 'string' is not assignable to type 'Id<"users">'.
  Type 'string' is not assignable to type '{ __tableName: "users"; }'.

166       following_id: args.userId.toString(),
          ~~~~~~~~~~~~

  node_modules/convex/dist/esm-types/type_utils.d.ts:11:97
    11 export type Expand<ObjectType extends Record<any, any>> = ObjectType extends Record<any, any> ? {
                                                                                                       ~
    12     [Key in keyof ObjectType]: ObjectType[Key];
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    13 } : never;
       ~
    The expected type comes from property 'following_id' which is declared here on type '{ created_at: number; follower_id: Id<"users">; following_id: Id<"users">; }'

convex/posts.ts:85:7 - error TS2322: Type 'string' is not assignable to type 'Id<"users">'.
  Type 'string' is not assignable to type '{ __tableName: "users"; }'.

85       user_id: user._id.toString(),
         ~~~~~~~

  node_modules/convex/dist/esm-types/type_utils.d.ts:11:97
    11 export type Expand<ObjectType extends Record<any, any>> = ObjectType extends Record<any, any> ? {
                                                                                                       ~
    12     [Key in keyof ObjectType]: ObjectType[Key];
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    13 } : never;
       ~
    The expected type comes from property 'user_id' which is declared here on type '{ is_public?: boolean | undefined; images?: string[] | undefined; image_url?: string | undefined; likes?: string[] | undefined; comments?: { user_id: Id<"users">; content: string; timestamp: number; }[] | undefined; created_at: number; user_id: Id<...>; content: string; }'

convex/posts.ts:199:7 - error TS2322: Type 'string' is not assignable to type 'Id<"users">'.
  Type 'string' is not assignable to type '{ __tableName: "users"; }'.

199       user_id: user._id.toString(),
          ~~~~~~~

  node_modules/convex/dist/esm-types/type_utils.d.ts:11:97
    11 export type Expand<ObjectType extends Record<any, any>> = ObjectType extends Record<any, any> ? {
                                                                                                       ~
    12     [Key in keyof ObjectType]: ObjectType[Key];
       ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    13 } : never;
       ~
    The expected type comes from property 'user_id' which is declared here on type '{ user_id: Id<"users">; content: string; timestamp: number; }'

Found 5 errors in 3 files.

Errors  Files
     1  convex/events.ts:79
     2  convex/follows.ts:165
     2  convex/posts.ts:85

