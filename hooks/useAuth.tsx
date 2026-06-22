import { api } from "@/utils/apiClient";
import { getSimpleErrorMessage } from "@/utils/errorMessages";
import { AccountType, ROLE_TO_ACCOUNT_TYPE } from "@/types/user";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useConvex, useQuery } from "convex/react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type UserRole = "PLAYER" | "COACH" | "SCOUT";

interface User {
  id: string;
  _id?: string;
  email: string;
  full_name: string;
  fullName?: string;
  role: UserRole;
  avatar?: string;
  avatar_url?: string;
  profileImageBase64?: string;
  bio?: string;
  is_public?: boolean;
}

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  accountType: AccountType | null;
  isLoading: boolean;
  isSignedIn: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: UserRole,
  ) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<undefined | AuthContextType>(undefined);

function mapConvexUser(convexUser: any): User | null {
  if (!convexUser) return null;
  const fullName = convexUser.full_name || convexUser.name || convexUser.email || "User";
  const role = convexUser.role || "PLAYER";

  return {
    id: convexUser._id,
    _id: convexUser._id,
    email: convexUser.email || "",
    full_name: fullName,
    fullName,
    role,
    avatar: convexUser.avatar || convexUser.image,
    avatar_url: convexUser.avatar || convexUser.image,
    bio: convexUser.bio,
    is_public: convexUser.is_public,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convex = useConvex();
  const convexUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const [authError, setAuthError] = useState<string | null>(null);

  const user = useMemo(() => mapConvexUser(convexUser), [convexUser]);
  const isLoading = isAuthLoading || (isAuthenticated && convexUser === undefined);
  const isSignedIn = Boolean(isAuthenticated && user);

  const accountType = user ? ROLE_TO_ACCOUNT_TYPE[user.role] || "JOGADOR" : null;

  const login = useCallback(async (email: string, password: string): Promise<AuthActionResult> => {
    setAuthError(null);
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: "signIn",
      });
      return { ok: true };
    } catch (error) {
      const message = getSimpleErrorMessage(error, "Nao foi possivel iniciar sessao.");
      setAuthError(message);
      return { ok: false, error: message };
    }
  }, [signIn]);

  const register = useCallback(async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: UserRole = "PLAYER",
  ): Promise<AuthActionResult> => {
    setAuthError(null);
    if (password !== confirmPassword) {
      const message = "As palavras-passe nao coincidem.";
      setAuthError(message);
      return { ok: false, error: message };
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const emailAvailable = await convex.query(api.users.isEmailAvailable, {
        email: normalizedEmail,
      });
      if (!emailAvailable) {
        const message = "Este email ja esta associado a uma conta.";
        setAuthError(message);
        return { ok: false, error: message };
      }

      await signIn("password", {
        email: normalizedEmail,
        password,
        name: fullName.trim(),
        role,
        flow: "signUp",
      });
      return { ok: true };
    } catch (error) {
      const message = getSimpleErrorMessage(error, "Nao foi possivel criar a conta.");
      setAuthError(message);
      return { ok: false, error: message };
    }
  }, [convex, signIn]);

  const logout = useCallback(async () => {
    await signOut();
    setAuthError(null);
  }, [signOut]);

  const refreshUser = useCallback(async () => {
    setAuthError(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      accountType,
      isLoading,
      isSignedIn,
      authError,
      login,
      register,
      logout,
      refreshUser,
      clearAuthError,
    }),
    [
      accountType,
      authError,
      clearAuthError,
      isLoading,
      isSignedIn,
      login,
      logout,
      refreshUser,
      register,
      user,
    ],
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
