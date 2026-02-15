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

  if (isLoading || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Use accountType from useAuth, fallback to convexUser.role
  const role = accountType === "JOGADOR" ? "PLAYER" : 
               accountType === "TREINADOR" ? "COACH" : 
               accountType === "OLHEIRO" ? "SCOUT" : 
               convexUser?.role || "PLAYER";

  // Define tabs based on user role
  const getPlayerTabs = () => (
    <>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: t("tabs.treinos"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="jogos"
        options={{
          title: t("tabs.jogos"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football" color={color} size={size} />
          ),
        }}
      />
    </>
  );

  const getCoachTabs = () => (
    <>
      <Tabs.Screen
        name="equipa"
        options={{
          title: t("tabs.equipa"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planeamento"
        options={{
          title: t("tabs.planeamento"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="analise"
        options={{
          title: t("tabs.analise"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" color={color} size={size} />
          ),
        }}
      />
    </>
  );

  const getScoutTabs = () => (
    <>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" color={color} size={size} />
          ),
        }}
      />
    </>
  );

  const getCommonTabs = () => (
    <>
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.feed"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="newspaper" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.messages"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) =>
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
              <Ionicons name="person" color={color} size={size} />
            ),
        }}
      />
    </>
  );

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
      {/* Role-specific tabs */}
      {role === "PLAYER" && getPlayerTabs()}
      {role === "COACH" && getCoachTabs()}
      {role === "SCOUT" && getScoutTabs()}
      
      {/* Common tabs for all users */}
      {getCommonTabs()}
    </Tabs>
  );
};

export default TabsLayout;
