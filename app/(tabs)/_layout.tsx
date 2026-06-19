import { api } from "@/utils/apiClient";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@/hooks/useApi";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, View } from "react-native";

type Role = "PLAYER" | "COACH" | "SCOUT";
type IconName = ComponentProps<typeof Ionicons>["name"];
type TabIconProps = Readonly<{
  color: string;
  size: number;
  focused: boolean;
}>;

type TabIconSwitcherProps = TabIconProps &
  Readonly<{
    focusedIcon: IconName;
    unfocusedIcon: IconName;
  }>;

type ProfileTabIconProps = TabIconProps &
  Readonly<{
    avatarUrl?: string;
  }>;

function getRole(accountType: string | null | undefined, fallbackRole: Role | undefined): Role {
  if (accountType === "JOGADOR") return "PLAYER";
  if (accountType === "TREINADOR") return "COACH";
  if (accountType === "OLHEIRO") return "SCOUT";
  return fallbackRole || "PLAYER";
}

function TabIconSwitcher({
  color,
  size,
  focused,
  focusedIcon,
  unfocusedIcon,
}: TabIconSwitcherProps) {
  return (
    <Ionicons
      name={focused ? focusedIcon : unfocusedIcon}
      color={color}
      size={size}
    />
  );
}

function createTabIcon(focusedIcon: IconName, unfocusedIcon: IconName) {
  return function TabIcon(props: TabIconProps) {
    return (
      <TabIconSwitcher
        {...props}
        focusedIcon={focusedIcon}
        unfocusedIcon={unfocusedIcon}
      />
    );
  };
}

function ProfileTabIcon({ avatarUrl, color, size, focused }: ProfileTabIconProps) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: color,
        }}
      />
    );
  }

  return (
    <Ionicons
      name={focused ? "person" : "person-outline"}
      color={color}
      size={size}
    />
  );
}

function createProfileTabIcon(avatarUrl?: string) {
  return function ProfileIcon(props: TabIconProps) {
    return <ProfileTabIcon {...props} avatarUrl={avatarUrl} />;
  };
}

const dashboardIcon = createTabIcon("stats-chart", "stats-chart-outline");
const workoutsIcon = createTabIcon("barbell", "barbell-outline");
const gamesIcon = createTabIcon("football", "football-outline");
const teamIcon = createTabIcon("people", "people-outline");
const planningIcon = createTabIcon("calendar", "calendar-outline");
const analysisIcon = createTabIcon("bar-chart", "bar-chart-outline");
const rankingsIcon = createTabIcon("trophy", "trophy-outline");
const chatIcon = createTabIcon("chatbubbles", "chatbubbles-outline");

const TabsLayout = () => {
  const { user, isLoading, accountType } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { sessionUserId: user.id as any } : "skip",
  );

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

  const role = getRole(accountType, convexUser?.role);

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
          tabBarIcon: dashboardIcon,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: t("tabs.treinos"),
          href: role === "PLAYER" ? undefined : null,
          tabBarIcon: workoutsIcon,
        }}
      />
      <Tabs.Screen
        name="jogos"
        options={{
          title: t("tabs.jogos"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: gamesIcon,
        }}
      />
      <Tabs.Screen
        name="equipa"
        options={{
          title: t("tabs.equipa"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: teamIcon,
        }}
      />
      <Tabs.Screen
        name="planeamento"
        options={{
          title: t("tabs.planeamento"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: planningIcon,
        }}
      />
      <Tabs.Screen
        name="analise"
        options={{
          title: t("tabs.analise"),
          href: role === "COACH" ? undefined : null,
          tabBarIcon: analysisIcon,
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: "Rankings",
          tabBarIcon: rankingsIcon,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.messages"),
          tabBarIcon: chatIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: createProfileTabIcon(user?.avatar_url),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
