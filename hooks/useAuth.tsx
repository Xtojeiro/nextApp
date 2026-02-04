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

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "PLAYER" | "COACH" | "SCOUT" | "ADMIN" | "MEDICAL" | "PUBLIC";
  avatar_url?: string;
  profileImageBase64?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => Promise<void>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userData = await convex.query(api.users.loginUser, {
        email,
        password,
      });
      setUser(userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      return true;
    } catch (error) {
      return false;
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: "PLAYER" | "COACH" | "SCOUT" = "PLAYER",
  ): Promise<boolean> => {
    // TODO: Replace with actual API call
    if (fullName && email && password) {
      const mockUser: User = {
        id: "1",
        email,
        fullName,
        role,
      };
      setUser(mockUser);
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      return true;
    }
    return false;
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
