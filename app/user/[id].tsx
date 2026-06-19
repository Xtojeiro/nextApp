import { api } from "@/utils/apiClient";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useMutation, useQuery } from "@/hooks/useApi";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type FollowStatus = "none" | "pending" | "following";

export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const followUser = useMutation(api.follows.followUser as any);
  const unfollowUser = useMutation(api.follows.unfollowUser as any);

  const profile = useQuery(
    api.users.getUserProfileView as any,
    user && id ? { sessionUserId: user.id as any, userId: id as any, limit: 25 } : "skip",
  );

  const handleFollowToggle = async (targetUserId: string, status: FollowStatus) => {
    if (!user || status === "pending") return;

    try {
      if (status === "following") {
        await unfollowUser({ sessionUserId: user.id as any, userId: targetUserId as any });
        Alert.alert("Sucesso", "Deixaste de seguir este utilizador.");
        return;
      }

      const result = await followUser({
        sessionUserId: user.id as any,
        userId: targetUserId as any,
      });
      Alert.alert(
        "Sucesso",
        result?.status === "pending"
          ? "Pedido enviado. O utilizador tem de aceitar."
          : "Agora segues este utilizador.",
      );
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao atualizar seguimento.");
    }
  };

  if (!user || !id) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <CenteredState colors={colors} icon="person-circle-outline" text="Perfil indisponível." />
      </LinearGradient>
    );
  }

  if (profile === undefined) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <CenteredState colors={colors} loading text="A carregar perfil..." />
      </LinearGradient>
    );
  }

  const targetUser = profile.user;
  const followStatus = profile.followStatus as FollowStatus;

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 32, gap: 16 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <Image
              source={{ uri: targetUser?.avatar || "https://placehold.co/120x120" }}
              style={{ width: 76, height: 76, borderRadius: 38 }}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text selectable style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
                {targetUser?.full_name || "Utilizador"}
              </Text>
              <Text selectable style={{ color: colors.textMuted, marginTop: 4 }}>
                {targetUser?.role || "Conta"} · {targetUser?.is_public ? "Público" : "Privado"}
              </Text>
              {targetUser?.location ? (
                <Text selectable style={{ color: colors.textMuted, marginTop: 4 }}>
                  {targetUser.location}
                </Text>
              ) : null}
            </View>
          </View>

          {targetUser?.bio ? (
            <Text selectable style={{ color: colors.text, fontSize: 15, lineHeight: 21 }}>
              {targetUser.bio}
            </Text>
          ) : null}

          <TouchableOpacity
            disabled={followStatus === "pending"}
            onPress={() => handleFollowToggle(targetUser._id, followStatus)}
            style={{
              backgroundColor:
                followStatus === "following" || followStatus === "pending"
                  ? colors.warning
                  : colors.primary,
              borderRadius: 10,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {getFollowButtonLabel(followStatus, targetUser?.is_public)}
            </Text>
          </TouchableOpacity>
        </View>

        {!profile.canViewActivity ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
              gap: 10,
            }}
          >
            <Ionicons name="lock-closed" size={36} color={colors.warning} />
            <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
              Perfil privado
            </Text>
            <Text selectable style={{ color: colors.textMuted, textAlign: "center", lineHeight: 20 }}>
              Os jogos e treinos ficam visíveis apenas depois deste utilizador aceitar o teu pedido.
            </Text>
          </View>
        ) : (
          <>
            <ActivitySection
              title="Jogos"
              emptyText="Ainda não há jogos registados."
              colors={colors}
            >
              {profile.games.map((game: any) => (
                <View key={game._id} style={activityCardStyle(colors)}>
                  <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                    {game.name || `${game.team1?.name || "Equipa"} vs ${game.team2?.name || "Equipa"}`}
                  </Text>
                  <Text selectable style={{ color: colors.textMuted, marginTop: 4 }}>
                    {new Date(game.date).toLocaleDateString()} · {game.status}
                  </Text>
                  {game.score1 !== undefined && game.score2 !== undefined ? (
                    <Text selectable style={{ color: colors.text, marginTop: 4 }}>
                      {game.team1?.name || "Equipa 1"} {game.score1} - {game.score2}{" "}
                      {game.team2?.name || "Equipa 2"}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ActivitySection>

            <ActivitySection
              title="Treinos"
              emptyText="Ainda não há treinos registados."
              colors={colors}
            >
              {profile.workouts.map((workout: any) => (
                <View key={workout._id} style={activityCardStyle(colors)}>
                  <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                    {workout.name}
                  </Text>
                  <Text selectable style={{ color: colors.textMuted, marginTop: 4 }}>
                    {workout.status} · {workout.duration_minutes || 0} min
                  </Text>
                  {workout.objective || workout.description ? (
                    <Text selectable style={{ color: colors.textMuted, marginTop: 4 }}>
                      {workout.objective || workout.description}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ActivitySection>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function getFollowButtonLabel(status: FollowStatus, isPublic?: boolean) {
  if (status === "following") return "A seguir";
  if (status === "pending") return "Pedido pendente";
  return isPublic ? "Seguir" : "Pedir para seguir";
}

function CenteredState({
  colors,
  icon,
  loading,
  text,
}: Readonly<{
  colors: ReturnType<typeof useTheme>["colors"];
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  text: string;
}>) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : icon ? (
        <Ionicons name={icon} size={42} color={colors.textMuted} />
      ) : null}
      <Text selectable style={{ color: colors.textMuted, marginTop: 12, textAlign: "center" }}>
        {text}
      </Text>
    </View>
  );
}

function ActivitySection({
  children,
  colors,
  emptyText,
  title,
}: Readonly<{
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
  emptyText: string;
  title: string;
}>) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
        {title}
      </Text>
      {hasItems ? (
        <View style={{ gap: 10 }}>{children}</View>
      ) : (
        <Text selectable style={{ color: colors.textMuted }}>
          {emptyText}
        </Text>
      )}
    </View>
  );
}

function activityCardStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  };
}
