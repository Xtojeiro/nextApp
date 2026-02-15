import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, View } from "react-native";

const TabsLayout = () => {
  const { user, isLoading, accountType } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const convexUser = useQuery(api.users.getCurrentUser);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  const role = accountType === "JOGADOR" ? "PLAYER" : 
               accountType === "TREINADOR" ? "COACH" : 
               accountType === "OLHEIRO" ? "SCOUT" : 
               convexUser?.role || "PLAYER";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 2,
          borderTopColor: colors.border,
          height: 80,
          paddingTop: 10,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },

        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          href: (role === "PLAYER" || role === "SCOUT") ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: t("tabs.treinos"),
          href: role === "PLAYER" ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "barbell" : "barbell-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="jogos"
        options={{
          title: t("tabs.jogos"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "football" : "football-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="equipa"
        options={{
          title: t("tabs.equipa"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planeamento"
        options={{
          title: t("tabs.planeamento"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analise"
        options={{
          title: t("tabs.analise"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.feed"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "newspaper" : "newspaper-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.messages"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size, focused }) =>
            user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: 1,
                  borderColor: color,
                }}
              />
            ) : (
              <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size} />
            ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
