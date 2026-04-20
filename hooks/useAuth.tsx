import { AccountType, ROLE_TO_ACCOUNT_TYPE } from "@/types/user";
import { useUser, useAuth as useClerkAuth, SignedIn, SignedOut } from "@clerk/clerk-expo";
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
  _id?: string;
  email: string;
  full_name: string;
  fullName?: string;
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
  isSignedIn: boolean;
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
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const convex = useConvex();

  useEffect(() => {
    if (isClerkLoaded) {
      if (clerkUser) {
        setIsSignedIn(true);
        fetchOrCreateUser();
      } else {
        setIsSignedIn(false);
        setUser(null);
        setIsLoading(false);
      }
    }
  }, [isClerkLoaded, clerkUser]);

  const fetchOrCreateUser = async () => {
    try {
      const convexUser = await convex.query(api.users.getCurrentUser, {});
      if (convexUser) {
        const mappedUser: User = {
          id: convexUser._id.toString(),
          _id: convexUser._id.toString(),
          email: convexUser.email,
          full_name: convexUser.full_name,
          fullName: convexUser.full_name,
          role: convexUser.role,
          avatar: convexUser.avatar,
          bio: convexUser.bio,
          is_public: convexUser.is_public,
        };
        setUser(mappedUser);
      } else if (clerkUser) {
        const newUser = await convex.mutation(api.users.createFromClerk, {
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          fullName: clerkUser.fullName || clerkUser.firstName + " " + (clerkUser.lastName || ""),
        });
        if (newUser) {
          const mappedUser: User = {
            id: newUser.userId.toString(),
            _id: newUser.userId.toString(),
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            full_name: clerkUser.fullName || "",
            fullName: clerkUser.fullName || "",
            role: newUser.role,
          };
          setUser(mappedUser);
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountType = (role: User["role"]): AccountType => {
    return ROLE_TO_ACCOUNT_TYPE[role] || "JOGADOR";
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    return false;
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    confirmPassword: string,
    role: "PLAYER" | "COACH" | "SCOUT" = "PLAYER",
  ): Promise<boolean> => {
    return false;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setIsSignedIn(false);
  };

  const refreshUser = async () => {
    await fetchOrCreateUser();
  };

  const accountType = user ? getAccountType(user.role) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        accountType,
        isLoading,
        isSignedIn,
        login,
        register,
        logout,
        refreshUser,
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
