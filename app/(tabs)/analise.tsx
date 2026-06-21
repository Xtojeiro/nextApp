import { api } from "@/utils/apiClient";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useQuery } from "@/hooks/useApi";
import type { Id } from "@/utils/apiTypes";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PerformancePeriod = "week" | "month" | "quarter";

type PerformanceAthlete = {
  id: Id<"users">;
  name: string;
  position: string;
  weeklyFrequency: number;
  monthlyFrequency: number;
  quarterlyFrequency: number;
  totalWorkouts: number;
  currentStreak: number;
  bestStreak: number;
  progressScore: number;
};

function getPeriodLabel(period: PerformancePeriod) {
  switch (period) {
    case "week":
      return "Semana";
    case "month":
      return "Mês";
    case "quarter":
      return "Trimestre";
  }
}

export default function Analise() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { sessionUserId: user.id as Id<"users"> } : "skip",
  );
  const performanceQuery = useQuery(
    api.teams.getTeamPerformanceAnalysis,
    convexUser?.role === "COACH" ? { sessionUserId: convexUser._id } : "skip",
  );
  const performanceData = (performanceQuery ?? []) as PerformanceAthlete[];
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>("month");

  if (user && convexUser === undefined) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <ActivityIndicator color={colors.primary} />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (convexUser?.role !== "COACH") {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginTop: 16 }}>
            Acesso Restrito
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
            Apenas treinadores podem aceder à análise de desempenho
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.danger;
  };

  const getScoreText = (score: number) => {
    if (score >= 80) return "Excelente";
    if (score >= 60) return "Bom";
    return "Necessita Melhoria";
  };

  const getFrequencyForPeriod = (athlete: PerformanceAthlete) => {
    if (selectedPeriod === "week") return athlete.weeklyFrequency;
    if (selectedPeriod === "quarter") return athlete.quarterlyFrequency;
    return athlete.monthlyFrequency;
  };

  const getPeriodUnit = () => {
    if (selectedPeriod === "week") return "sem";
    if (selectedPeriod === "quarter") return "trim";
    return "mês";
  };

  const renderAthleteCard = (athlete: PerformanceAthlete) => (
    <View
      key={athlete.id}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
            {athlete.name}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            {athlete.position}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: getScoreColor(athlete.progressScore),
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>
            {athlete.progressScore}%
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={{ color: colors.text, marginLeft: 4, fontSize: 14 }}>
            {getFrequencyForPeriod(athlete)}x/{getPeriodUnit()}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="barbell" size={16} color={colors.success} />
          <Text style={{ color: colors.text, marginLeft: 4, fontSize: 14 }}>
            {athlete.totalWorkouts} treinos
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="flame" size={16} color={colors.warning} />
          <Text style={{ color: colors.text, marginLeft: 4, fontSize: 14 }}>
            {athlete.currentStreak}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 8 }}>
        <View
          style={{
            height: 6,
            backgroundColor: colors.border,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${athlete.progressScore}%`,
              backgroundColor: getScoreColor(athlete.progressScore),
              borderRadius: 3,
            }}
          />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
          {getScoreText(athlete.progressScore)}
        </Text>
      </View>
    </View>
  );

  const averageScore =
    performanceData.length > 0
      ? Math.round(
          performanceData.reduce((sum, athlete) => sum + athlete.progressScore, 0) /
            performanceData.length,
        )
      : 0;
  const averageFrequency =
    performanceData.length > 0
      ? Math.round(
          performanceData.reduce((sum, athlete) => sum + getFrequencyForPeriod(athlete), 0) /
            performanceData.length,
        )
      : 0;
  const sortedPerformanceData = [...performanceData].sort(
    (a, b) => b.progressScore - a.progressScore,
  );

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              Análise de Desempenho
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>
              Visão comparativa do progresso dos atletas
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 24 }}>
            {(["week", "month", "quarter"] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={{
                  flex: 1,
                  backgroundColor: selectedPeriod === period ? colors.primary : colors.surface,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  marginRight: 8,
                  alignItems: "center",
                }}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={{
                    color: selectedPeriod === period ? "white" : colors.text,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {getPeriodLabel(period)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              Visão Geral da Equipa
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>
                  {performanceData.length}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Atletas</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: colors.success, fontSize: 24, fontWeight: "bold" }}>
                  {averageFrequency}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Freq. Média</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: colors.primary, fontSize: 24, fontWeight: "bold" }}>
                  {averageScore}%
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Score Médio</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 24 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons name="trending-up" size={32} color={colors.success} />
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginTop: 8 }}>
                  {performanceData.filter((a) => a.progressScore >= 80).length}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Excelentes</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons name="trending-up" size={32} color={colors.warning} />
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginTop: 8 }}>
                  {performanceData.filter((a) => a.progressScore >= 60 && a.progressScore < 80).length}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Bons</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Ionicons name="trending-down" size={32} color={colors.danger} />
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold", marginTop: 8 }}>
                  {performanceData.filter((a) => a.progressScore < 60).length}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Melhorar</Text>
              </View>
            </View>
          </View>

          <View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              Desempenho Individual
            </Text>
            {performanceQuery === undefined ? (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 24,
                  alignItems: "center",
                }}
              >
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : sortedPerformanceData.length > 0 ? (
              sortedPerformanceData.map(renderAthleteCard)
            ) : (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 24,
                  alignItems: "center",
                }}
              >
                <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginTop: 12 }}>
                  Sem atletas para analisar
                </Text>
                <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                  Associa atletas à tua equipa para veres dados de desempenho.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
