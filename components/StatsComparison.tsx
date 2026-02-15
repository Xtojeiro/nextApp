import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface StatsComparisonProps {
  currentWeek: number;
  previousWeek: number;
  currentMonth: number;
  previousMonth: number;
  label: string;
  unit?: string;
  icon?: string;
}

export default function StatsComparison({
  currentWeek,
  previousWeek,
  currentMonth,
  previousMonth,
  label,
  unit = "",
  icon = "fitness",
}: StatsComparisonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const weekChange = previousWeek !== 0 ? ((currentWeek - previousWeek) / previousWeek) * 100 : 0;
  const monthChange = previousMonth !== 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

  const getChangeColor = (change: number) => {
    if (change > 0) return colors.success;
    if (change < 0) return colors.danger;
    return colors.textMuted;
  };

  const getChangeArrow = (change: number) => {
    if (change > 0) return "arrow-up";
    if (change < 0) return "arrow-down";
    return "remove";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={[styles.statTitle, { color: colors.textMuted }]}>{t("dashboard.thisWeek")}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currentWeek}
            <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>
          </Text>
          <View style={styles.changeContainer}>
            <Ionicons
              name={getChangeArrow(weekChange) as any}
              size={14}
              color={getChangeColor(weekChange)}
            />
            <Text style={[styles.change, { color: getChangeColor(weekChange) }]}>
              {Math.abs(weekChange).toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBlock}>
          <Text style={[styles.statTitle, { color: colors.textMuted }]}>{t("dashboard.thisMonth")}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currentMonth}
            <Text style={[styles.unit, { color: colors.textMuted }]}>{unit}</Text>
          </Text>
          <View style={styles.changeContainer}>
            <Ionicons
              name={getChangeArrow(monthChange) as any}
              size={14}
              color={getChangeColor(monthChange)}
            />
            <Text style={[styles.change, { color: getChangeColor(monthChange) }]}>
              {Math.abs(monthChange).toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.comparisonBar}>
        <View style={styles.comparisonLabels}>
          <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>
            {t("dashboard.weeklyTrend")}
          </Text>
          <Text style={[styles.comparisonLabel, { color: colors.textMuted }]}>
            {t("dashboard.monthlyTrend")}
          </Text>
        </View>
        <View style={styles.barsRow}>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.min(Math.abs(weekChange), 100)}%`,
                  backgroundColor: getChangeColor(weekChange),
                },
              ]}
            />
          </View>
          <View style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.min(Math.abs(monthChange), 100)}%`,
                  backgroundColor: getChangeColor(monthChange),
                },
              ]}
            />
          </View>
        </View>
      </View>
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
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  unit: {
    fontSize: 14,
    fontWeight: "normal",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
  },
  comparisonBar: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  comparisonLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 11,
  },
  barsRow: {
    flexDirection: "row",
    gap: 16,
  },
  barWrapper: {
    flex: 1,
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
});
