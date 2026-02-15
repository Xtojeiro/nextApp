import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import DashboardStats from "@/components/DashboardStats";
import EvolutionChart from "@/components/EvolutionChart";
import StatsComparison from "@/components/StatsComparison";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JogadorDashboard() {
  const { accountType, user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  const [currentWeekWorkouts, setCurrentWeekWorkouts] = useState(5);
  const [previousWeekWorkouts, setPreviousWeekWorkouts] = useState(4);
  const [currentMonthWorkouts, setCurrentMonthWorkouts] = useState(18);
  const [previousMonthWorkouts, setPreviousMonthWorkouts] = useState(15);

  const workoutEvolutionData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        value: Math.floor(Math.random() * 3),
      });
    }
    return data;
  }, []);

  const gameEvolutionData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        value: Math.floor(Math.random() * 2),
      });
    }
    return data;
  }, []);

  useEffect(() => {
    if (!accountType || accountType !== "JOGADOR") {
      router.replace("/login");
    }
  }, [accountType, router]);

  if (!accountType || accountType !== "JOGADOR") {
    return null;
  }

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
            Dashboard Jogador
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 24 }}>
            Bem-vindo, {user?.full_name || "Atleta"}!
          </Text>

          <DashboardStats
            workoutsCompleted={currentMonthWorkouts}
            gamesPlayed={8}
            streak={12}
            bestStreak={21}
            onWorkoutPress={() => router.push("/treinos")}
            onGamePress={() => router.push("/jogos")}
          />

          <EvolutionChart
            data={workoutEvolutionData}
            title="Evolução de Treinos (30 dias)"
            color={colors.primary}
          />

          <EvolutionChart
            data={gameEvolutionData}
            title="Evolução de Jogos (30 dias)"
            color={colors.success}
          />

          <StatsComparison
            currentWeek={currentWeekWorkouts}
            previousWeek={previousWeekWorkouts}
            currentMonth={currentMonthWorkouts}
            previousMonth={previousMonthWorkouts}
            label="Treinos Realizados"
            icon="barbell"
          />

          <StatsComparison
            currentWeek={2}
            previousWeek={2}
            currentMonth={8}
            previousMonth={6}
            label="Jogos Participados"
            icon="football"
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
