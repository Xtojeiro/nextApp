import { api } from "@/utils/apiClient";
import { AccountType, ROLE_TO_ACCOUNT_TYPE } from "@/types/user";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

interface User {
  id: string;
  _id?: string;
  email: string;
  full_name: string;
  fullName?: string;
  role: "PLAYER" | "COACH" | "SCOUT";
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
    role: "PLAYER" | "COACH" | "SCOUT",
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    if (
      error.message.includes("InvalidSecret") ||
      error.message.includes("InvalidAccountId") ||
      error.message.includes("AccountNotFound")
    ) {
      return "Email ou palavra-passe incorretos.";
    }
    return error.message;
  }
  return fallback;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const convexUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const [authError, setAuthError] = useState<string | null>(null);

  const user = useMemo(() => mapConvexUser(convexUser), [convexUser]);
  const isLoading = isAuthLoading || (isAuthenticated && convexUser === undefined);
  const isSignedIn = Boolean(isAuthenticated && user);

  const accountType = user
    ? ROLE_TO_ACCOUNT_TYPE[user.role] || "JOGADOR"
    : null;

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    setAuthError(null);
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: "signIn",
      });
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel iniciar sessao.");
      setAuthError(message);
      return { ok: false, error: message };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: "PLAYER" | "COACH" | "SCOUT" = "PLAYER",
  ): Promise<AuthActionResult> => {
    setAuthError(null);
    if (password !== confirmPassword) {
      const message = "As palavras-passe nao coincidem.";
      setAuthError(message);
      return { ok: false, error: message };
    }

    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        name: fullName.trim(),
        role,
        flow: "signUp",
      });
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel criar a conta.");
      setAuthError(message);
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    await signOut();
    setAuthError(null);
  };

  const refreshUser = async () => {
    setAuthError(null);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
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
