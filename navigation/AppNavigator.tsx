import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

function LoadingScreen() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function AuthLoadingScreen() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      <Ionicons name="fitness" size={64} color={colors.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { user, accountType, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const convexUser = useQuery(api.users.getCurrentUser);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (hasNavigated.current) return;

    if (!user) {
      router.replace("/login");
      hasNavigated.current = true;
      return;
    }

    if (convexUser === null) {
      router.replace("/login");
      hasNavigated.current = true;
      return;
    }

    hasNavigated.current = true;
  }, [isLoading, user, convexUser]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthLoadingScreen />;
  }

  if (convexUser === undefined && !hasNavigated.current) {
    return <LoadingScreen />;
  }

  if (!accountType) {
    return <LoadingScreen />;
  }

  return null;
}
