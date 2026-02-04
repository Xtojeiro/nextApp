import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Analise() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const convexUser = useQuery(api.users.getCurrentUser);

  // Dummy data for analysis - in real implementation, this would come from queries
  const performanceData = [
    {
      id: "athlete1",
      name: "João Silva",
      position: "Avançado",
      weeklyFrequency: 4,
      monthlyFrequency: 16,
      totalWorkouts: 45,
      currentStreak: 7,
      bestStreak: 21,
      progressScore: 85,
    },
    {
      id: "athlete2",
      name: "Pedro Santos", 
      position: "Médio",
      weeklyFrequency: 2,
      monthlyFrequency: 8,
      totalWorkouts: 28,
      currentStreak: 0,
      bestStreak: 12,
      progressScore: 65,
    },
    {
      id: "athlete3",
      name: "Carlos Costa",
      position: "Defesa", 
      weeklyFrequency: 5,
      monthlyFrequency: 20,
      totalWorkouts: 52,
      currentStreak: 14,
      bestStreak: 28,
      progressScore: 92,
    },
    {
      id: "athlete4",
      name: "Miguel Fernandes",
      position: "Guarda-Redes",
      weeklyFrequency: 3,
      monthlyFrequency: 12,
      totalWorkouts: 38,
      currentStreak: 3,
      bestStreak: 15,
      progressScore: 78,
    },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month");

  // Only show for COACH role
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

  const renderAthleteCard = (athlete: any) => (
    <View
      key={athlete.id}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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

      {/* Performance Metrics */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={{ color: colors.text, marginLeft: 4, fontSize: 14 }}>
            {selectedPeriod === "week" ? athlete.weeklyFrequency : athlete.monthlyFrequency}x/{selectedPeriod === "week" ? "sem" : "mês"}
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
            🔥 {athlete.currentStreak}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
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

  const averageScore = Math.round(
    performanceData.reduce((sum, athlete) => sum + athlete.progressScore, 0) / performanceData.length
  );

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Análise de Desempenho
            </Text>
            <Text style={{ color: colors.textMuted }}>
              Visão comparativa do progresso dos atletas
            </Text>
          </View>

          {/* Period Selector */}
          <View style={{ flexDirection: "row", marginBottom: 24 }}>
            {["week" as const, "month" as const, "quarter" as const].map((period) => (
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
                  {period === "week" ? "Semana" : period === "month" ? "Mês" : "Trimestre"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Team Overview */}
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
                  {Math.round(performanceData.reduce((sum, a) => sum + a.weeklyFrequency, 0) / performanceData.length)}
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

          {/* Performance Categories */}
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
                  {performanceData.filter(a => a.progressScore >= 80).length}
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
                  {performanceData.filter(a => a.progressScore >= 60 && a.progressScore < 80).length}
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
                  {performanceData.filter(a => a.progressScore < 60).length}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Melhorar</Text>
              </View>
            </View>
          </View>

          {/* Athletes Performance List */}
          <View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
              Desempenho Individual
            </Text>
            {performanceData
              .sort((a, b) => b.progressScore - a.progressScore)
              .map(renderAthleteCard)}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}