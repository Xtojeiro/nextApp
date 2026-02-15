import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface DashboardStatsProps {
  workoutsCompleted: number;
  gamesPlayed: number;
  streak: number;
  bestStreak: number;
  onWorkoutPress: () => void;
  onGamePress: () => void;
}

export default function DashboardStats({
  workoutsCompleted,
  gamesPlayed,
  streak,
  bestStreak,
  onWorkoutPress,
  onGamePress,
}: DashboardStatsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("dashboard.yourStats")}</Text>
      </View>

      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.primary + "15" }]}
          onPress={onWorkoutPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + "30" }]}>
            <Ionicons name="barbell" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{workoutsCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("dashboard.workouts")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.success + "15" }]}
          onPress={onGamePress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.success + "30" }]}>
            <Ionicons name="football" size={24} color={colors.success} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{gamesPlayed}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("dashboard.games")}</Text>
        </TouchableOpacity>

        <View style={[styles.statCard, { backgroundColor: colors.warning + "15" }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.warning + "30" }]}>
            <Ionicons name="flame" size={24} color={colors.warning} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{streak}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("dashboard.streak")}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.danger + "15" }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.danger + "30" }]}>
            <Ionicons name="trophy" size={24} color={colors.danger} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{bestStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("dashboard.bestStreak")}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
