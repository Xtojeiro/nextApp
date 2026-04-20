import { AuthProvider } from "@/hooks/useAuth";
import useAuth from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import "@/utils/i18n";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

const tokenCache = {
  getToken: async (key: string) => {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  saveToken: async (key: string, token: string) => {
    try {
      return SecureStore.setItemAsync(key, token);
    } catch {
      return;
    }
  },
};

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
      <Stack.Screen name="verify" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function Layout() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProvider client={convex}>
        <AuthProvider>
          <ThemeProvider>
            <RootLayoutNav />
          </ThemeProvider>
        </AuthProvider>
      </ConvexProvider>
    </ClerkProvider>
  );
}
