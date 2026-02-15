import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

interface TeamComparisonProps {
  athletes: {
    id: string;
    name: string;
    avatar?: string;
    workouts: number;
    games: number;
    points: number;
    assists: number;
    efficiency: number;
    attendance: number;
  }[];
  onAthleteSelect?: (id: string) => void;
  selectedIds?: string[];
}

export default function TeamComparison({
  athletes,
  onAthleteSelect,
  selectedIds = [],
}: TeamComparisonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const metrics = [
    { key: "workouts", label: "Treinos", icon: "barbell", color: "#3B82F6" },
    { key: "games", label: "Jogos", icon: "football", color: "#10B981" },
    { key: "points", label: "Pontos", icon: "star", color: "#F59E0B" },
    { key: "assists", label: "Assistências", icon: "people", color: "#8B5CF6" },
    { key: "efficiency", label: "Eficiência", icon: "trending-up", color: "#EF4444" },
    { key: "attendance", label: "Presença", icon: "calendar", color: "#06B6D4" },
  ];

  const getMaxValue = (key: string) => {
    return Math.max(...athletes.map((a) => a[key as keyof typeof a] as number || 0), 1);
  };

  const getBarColor = (key: string) => {
    return metrics.find((m) => m.key === key)?.color || colors.primary;
  };

  const toggleAthlete = (id: string) => {
    onAthleteSelect?.(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Comparação de Atletas</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Seleciona até 3 atletas para comparar
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.athleteSelector}>
        {athletes.map((athlete) => {
          const isSelected = selectedIds.includes(athlete.id);
          return (
            <TouchableOpacity
              key={athlete.id}
              style={[
                styles.athleteChip,
                isSelected && { backgroundColor: colors.primary },
              ]}
              onPress={() => toggleAthlete(athlete.id)}
            >
              <Text
                style={[
                  styles.athleteChipText,
                  isSelected ? { color: "white" } : { color: colors.text },
                ]}
              >
                {athlete.name}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={16} color="white" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.comparisonContainer}>
        {selectedIds.length > 0 ? (
          metrics.map((metric) => {
            const selectedAthletes = athletes.filter((a) => selectedIds.includes(a.id));
            return (
              <View key={metric.key} style={styles.metricRow}>
                <View style={styles.metricHeader}>
                  <Ionicons name={metric.icon as any} size={18} color={metric.color} />
                  <Text style={[styles.metricLabel, { color: colors.text }]}>
                    {metric.label}
                  </Text>
                </View>

                <View style={styles.barsContainer}>
                  {selectedAthletes.map((athlete) => {
                    const value = athlete[metric.key as keyof typeof athlete] as number || 0;
                    const maxValue = getMaxValue(metric.key);
                    const width = (value / maxValue) * 200;

                    return (
                      <View key={athlete.id} style={styles.barRow}>
                        <Text
                          style={[styles.barLabel, { color: colors.textMuted }]}
                          numberOfLines={1}
                        >
                          {athlete.name}
                        </Text>
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.bar,
                              {
                                width,
                                backgroundColor: metric.color,
                              },
                            ]}
                          />
                          <Text style={[styles.barValue, { color: colors.text }]}>
                            {value}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Seleciona atletas acima para comparar
            </Text>
          </View>
        )}
      </View>

      {selectedIds.length > 0 && (
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {}}
          >
            <Ionicons name="download" size={18} color="white" />
            <Text style={styles.actionButtonText}>Exportar Comparação</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => {}}
          >
            <Ionicons name="share-social" size={18} color="white" />
            <Text style={styles.actionButtonText}>Partilhar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },
  athleteSelector: {
    marginBottom: 16,
  },
  athleteChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  athleteChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  comparisonContainer: {
    marginTop: 8,
  },
  metricRow: {
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  barsContainer: {
    paddingLeft: 26,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    marginRight: 8,
  },
  barWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bar: {
    height: 20,
    borderRadius: 4,
    minWidth: 4,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "600",
    width: 30,
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});
