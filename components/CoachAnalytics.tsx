import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

interface AthleteData {
  id: string;
  name: string;
  avatar?: string;
  workouts: number;
  games: number;
  points: number;
  assists: number;
  efficiency: number;
}

interface CoachAnalyticsProps {
  athletes: AthleteData[];
  onAthletePress?: (athlete: AthleteData) => void;
  onExportPress?: () => void;
}

export default function CoachAnalytics({ athletes, onAthletePress, onExportPress }: CoachAnalyticsProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const sortedByWorkouts = [...athletes].sort((a, b) => b.workouts - a.workouts);
  const sortedByGames = [...athletes].sort((a, b) => b.games - a.games);
  const sortedByPoints = [...athletes].sort((a, b) => b.points - a.points);
  const sortedByEfficiency = [...athletes].sort((a, b) => b.efficiency - a.efficiency);

  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: "trophy", color: "#FFD700" };
    if (index === 1) return { icon: "medal", color: "#C0C0C0" };
    if (index === 2) return { icon: "ribbon", color: "#CD7F32" };
    return null;
  };

  const AthleteCard = ({ athlete, rank, metric }: { athlete: AthleteData; rank: number; metric: string }) => {
    const badge = getRankBadge(rank);
    
    return (
      <TouchableOpacity
        style={[styles.athleteCard, { backgroundColor: colors.surface }]}
        onPress={() => onAthletePress?.(athlete)}
        activeOpacity={0.7}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rank, { color: colors.text }]}>#{rank + 1}</Text>
          {badge && (
            <Ionicons name={badge.icon as any} size={16} color={badge.color} />
          )}
        </View>
        
        <View style={styles.athleteInfo}>
          <Text style={[styles.athleteName, { color: colors.text }]}>{athlete.name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="barbell" size={12} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{athlete.workouts}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="football" size={12} color={colors.success} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{athlete.games}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>{athlete.efficiency}%</Text>
            </View>
          </View>
        </View>
        
        <View style={[styles.metricHighlight, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.metricValue, { color: colors.primary }]}>{athlete[metric as keyof AthleteData]}</Text>
          <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{metric}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("dashboard.performance")}</Text>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.primary }]}
          onPress={onExportPress}
        >
          <Ionicons name="download" size={16} color="white" />
          <Text style={styles.exportText}>Exportar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsRow}>
        {["workouts", "games", "points", "efficiency"].map((metric) => (
          <TouchableOpacity
            key={metric}
            style={[styles.metricChip, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <Text style={[styles.metricChipText, { color: colors.text }]}>
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Treinos</Text>
        {sortedByWorkouts.slice(0, 5).map((athlete, index) => (
          <AthleteCard key={athlete.id} athlete={athlete} rank={index} metric="workouts" />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Jogos</Text>
        {sortedByGames.slice(0, 5).map((athlete, index) => (
          <AthleteCard key={athlete.id} athlete={athlete} rank={index} metric="games" />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Pontos</Text>
        {sortedByPoints.slice(0, 5).map((athlete, index) => (
          <AthleteCard key={athlete.id} athlete={athlete} rank={index} metric="points" />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Eficiência</Text>
        {sortedByEfficiency.slice(0, 5).map((athlete, index) => (
          <AthleteCard key={athlete.id} athlete={athlete} rank={index} metric="efficiency" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  metricsRow: {
    marginBottom: 16,
  },
  metricChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  metricChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  athleteCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
    marginRight: 12,
  },
  rank: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  metricHighlight: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 60,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  metricLabel: {
    fontSize: 10,
  },
});
