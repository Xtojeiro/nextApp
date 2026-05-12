import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params: Record<string, unknown>) {
        const email = String(params.email || "").toLowerCase();
        const fullName = String(params.name || email || "User").trim();
        const rawRole = String(params.role || "PLAYER").toUpperCase();
        const role =
          rawRole === "COACH" || rawRole === "SCOUT" ? rawRole : "PLAYER";
        const now = Date.now();

        return {
          email,
          name: fullName,
          full_name: fullName,
          role,
          is_active: true,
          is_public: true,
          created_at: now,
          updated_at: now,
        };
      },
      validatePasswordRequirements(password: string) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
      },
    }),
  ],
});
