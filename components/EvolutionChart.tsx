import useTheme from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { View, Text, StyleSheet } from "react-native";

interface EvolutionChartProps {
  data: { date: string; value: number }[];
  title: string;
  color?: string;
}

export default function EvolutionChart({ data, title, color }: EvolutionChartProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const chartColor = color || colors.primary;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", paddingVertical: 20 }}>
          {t("dashboard.noData")}
        </Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const range = maxValue - minValue || 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <View style={styles.chartWrapper}>
          <View style={styles.gridLines}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.gridLine,
                  { bottom: `${20 + i * 20}%` },
                ]}
              />
            ))}
          </View>
          
          <View style={styles.barsContainer}>
            {data.map((d, i) => {
              const height = ((d.value - minValue) / range) * 80;
              return (
                <View key={i} style={styles.barWrapper}>
                  <View style={[styles.bar, { height: Math.max(height, 2), backgroundColor: chartColor }]} />
                </View>
              );
            })}
          </View>
          
          <View style={styles.xAxis}>
            {data.filter((_, i) => i % Math.ceil(data.length / 7) === 0 || i === data.length - 1).map((d, i) => (
              <Text key={i} style={[styles.axisLabel, { color: colors.textMuted }]}>
                {d.date.split("-")[2]}
              </Text>
            ))}
          </View>
        </View>
        
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: chartColor }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>{t("dashboard.currentPeriod")}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>{t("dashboard.previousPeriod")}</Text>
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: "center",
  },
  chartWrapper: {
    width: 300,
    height: 140,
    position: "relative",
  },
  gridLines: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 0,
    bottom: 20,
    justifyContent: "space-between",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 0,
    height: 100,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  bar: {
    width: "70%",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 0,
  },
  axisLabel: {
    fontSize: 10,
    textAlign: "center",
    flex: 1,
  },
  legend: {
    flexDirection: "row",
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});
