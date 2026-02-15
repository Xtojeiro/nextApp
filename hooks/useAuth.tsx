import AsyncStorage from "@react-native-async-storage/async-storage";
import { useConvex } from "convex/react";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../convex/_generated/api";
import { AccountType, ROLE_TO_ACCOUNT_TYPE } from "@/types/user";

interface User {
  id: string;
  _id?: string;
  email: string;
  full_name: string;
  role: "PLAYER" | "COACH" | "SCOUT" | "ADMIN" | "MEDICAL" | "PUBLIC";
  avatar?: string;
  avatar_url?: string;
  profileImageBase64?: string;
  bio?: string;
  is_public?: boolean;
}

interface AuthContextType {
  user: User | null;
  accountType: AccountType | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: "PLAYER" | "COACH" | "SCOUT",
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<undefined | AuthContextType>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const convex = useConvex();

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountType = (role: User["role"]): AccountType => {
    return ROLE_TO_ACCOUNT_TYPE[role] || "JOGADOR";
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await convex.mutation(api.users.loginUser, {
        email: email.toLowerCase().trim(),
        password,
      });

      if (result) {
        const mappedUser: User = {
          id: result.userId.toString(),
          _id: result.userId.toString(),
          email: result.email,
          full_name: result.fullName,
          role: result.role,
        };
        setUser(mappedUser);
        await AsyncStorage.setItem("user", JSON.stringify(mappedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: "PLAYER" | "COACH" | "SCOUT" = "PLAYER",
  ): Promise<boolean> => {
    try {
      const roleMap = {
        PLAYER: "athlete",
        COACH: "coach",
        SCOUT: "scout",
      };

      const userId = await convex.mutation(api.users.registerUser, {
        name: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
        confirmPassword,
        role: roleMap[role] as "athlete" | "coach" | "scout",
      });

      if (userId) {
        const mockUser: User = {
          id: userId.toString(),
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          role,
        };
        setUser(mockUser);
        await AsyncStorage.setItem("user", JSON.stringify(mockUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Register error:", error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  const refreshUser = async () => {
    try {
      const userData = await convex.query(api.users.getCurrentUser, {});
      if (userData) {
        const mappedUser: User = {
          id: userData._id.toString(),
          _id: userData._id.toString(),
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          avatar: userData.avatar,
          bio: userData.bio,
          is_public: userData.is_public,
        };
        setUser(mappedUser);
        await AsyncStorage.setItem("user", JSON.stringify(mappedUser));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  const accountType = user ? getAccountType(user.role) : null;

  return (
    <AuthContext.Provider
      value={{ user, accountType, isLoading, login, register, logout, refreshUser }}
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
