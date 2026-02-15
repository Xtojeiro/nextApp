import { AuthProvider } from "@/hooks/useAuth";
import useAuth from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import "@/utils/i18n";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function Layout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
