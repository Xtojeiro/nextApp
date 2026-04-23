import { api } from "@/convex/_generated/api";
import { AccountType, ROLE_TO_ACCOUNT_TYPE } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConvex } from "convex/react";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const AUTH_STORAGE_KEY = "nextapp.auth.userId";

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

function mapConvexUser(convexUser: any): User {
  return {
    id: convexUser._id.toString(),
    _id: convexUser._id.toString(),
    email: convexUser.email,
    full_name: convexUser.full_name,
    fullName: convexUser.full_name,
    role: convexUser.role,
    avatar: convexUser.avatar,
    avatar_url: convexUser.avatar,
    bio: convexUser.bio,
    is_public: convexUser.is_public,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const convex = useConvex();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadStoredSession = async () => {
    setIsLoading(true);
    try {
      const storedUserId = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!storedUserId) {
        setUser(null);
        setIsSignedIn(false);
        return;
      }

      const convexUser = await convex.query(api.users.getCurrentUser, {
        sessionUserId: storedUserId as any,
      });

      if (!convexUser) {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
        setIsSignedIn(false);
        setAuthError("Sessao invalida. Faz login novamente.");
        return;
      }

      setUser(mapConvexUser(convexUser));
      setIsSignedIn(true);
      setAuthError(null);
    } catch (error) {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      setIsSignedIn(false);
      setAuthError(getErrorMessage(error, "Nao foi possivel restaurar a sessao."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStoredSession();
  }, []);

  const getAccountType = (role: User["role"]): AccountType => {
    return ROLE_TO_ACCOUNT_TYPE[role] || "JOGADOR";
  };

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    setAuthError(null);
    try {
      const result = await convex.mutation(api.users.loginUser, {
        email,
        password,
      });

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, result.userId.toString());
      await loadStoredSession();
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
    try {
      const result = await convex.mutation(api.users.registerUser, {
        name: fullName,
        email,
        password,
        confirmPassword,
        role,
      });

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, result.userId.toString());
      await loadStoredSession();
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel criar a conta.");
      setAuthError(message);
      return { ok: false, error: message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setIsSignedIn(false);
    setAuthError(null);
  };

  const refreshUser = async () => {
    await loadStoredSession();
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const accountType = user ? getAccountType(user.role) : null;

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
