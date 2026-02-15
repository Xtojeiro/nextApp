import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import CoachAnalytics from "@/components/CoachAnalytics";
import TeamComparison from "@/components/TeamComparison";
import PDFReportGenerator from "@/components/PDFReportGenerator";
import UnifiedCalendar from "@/components/UnifiedCalendar";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  type: "game" | "training" | "meeting" | "other";
  description?: string;
}

interface AthleteData {
  id: string;
  name: string;
  avatar?: string;
  workouts: number;
  games: number;
  points: number;
  assists: number;
  efficiency: number;
  attendance: number;
}

export default function TreinadorDashboard() {
  const { accountType, user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);

  const mockAthletes: AthleteData[] = [
    { id: "1", name: "João Santos", workouts: 24, games: 8, points: 156, assists: 42, efficiency: 92, attendance: 95 },
    { id: "2", name: "Maria Ferreira", workouts: 22, games: 7, points: 134, assists: 38, efficiency: 88, attendance: 92 },
    { id: "3", name: "Pedro Costa", workouts: 20, games: 8, points: 189, assists: 35, efficiency: 85, attendance: 88 },
    { id: "4", name: "Ana Silva", workouts: 26, games: 6, points: 98, assists: 45, efficiency: 94, attendance: 98 },
    { id: "5", name: "Carlos Mendes", workouts: 18, games: 7, points: 167, assists: 28, efficiency: 78, attendance: 85 },
  ];

  const mockEvents: CalendarEvent[] = [
    { id: "1", title: "Treino Técnico", date: new Date().toISOString().split("T")[0], start_time: "10:00", type: "training" },
    { id: "2", title: "Jogo vs Benfica", date: new Date(Date.now() + 86400000).toISOString().split("T")[0], start_time: "15:00", type: "game" },
    { id: "3", title: "Reunião Equipa", date: new Date(Date.now() + 172800000).toISOString().split("T")[0], start_time: "11:00", type: "meeting" },
  ];

  const mockGames: CalendarEvent[] = [
    { id: "4", title: "Jogo vs Sporting", date: new Date(Date.now() + 259200000).toISOString().split("T")[0], start_time: "17:00", type: "game" },
  ];

  useEffect(() => {
    if (!accountType || (accountType !== "TREINADOR" && accountType !== "OLHEIRO")) {
      router.replace("/login");
    }
  }, [accountType, router]);

  if (!accountType || (accountType !== "TREINADOR" && accountType !== "OLHEIRO")) {
    return null;
  }

  const handleAthleteSelect = (id: string) => {
    setSelectedAthleteIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const reportData = {
    title: "Relatório de Desempenho - Equipa",
    period: "Fevereiro 2026",
    athletes: mockAthletes,
    summary: {
      totalWorkouts: 110,
      totalGames: 36,
      averageEfficiency: 87,
      topPerformer: "Ana Silva",
    },
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
            Dashboard Treinador
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 24 }}>
            Bem-vindo, Treinador!
          </Text>

          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
            Calendário
          </Text>
          <UnifiedCalendar events={mockEvents} games={mockGames} />

          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginTop: 8, marginBottom: 16 }}>
            Análise de Desempenho
          </Text>
          <CoachAnalytics
            athletes={mockAthletes}
            onAthletePress={(athlete) => console.log("Athlete:", athlete.name)}
            onExportPress={() => console.log("Export analytics")}
          />

          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginTop: 8, marginBottom: 16 }}>
            Comparação de Atletas
          </Text>
          <TeamComparison
            athletes={mockAthletes}
            onAthleteSelect={handleAthleteSelect}
            selectedIds={selectedAthleteIds}
          />

          <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text, marginTop: 8, marginBottom: 16 }}>
            Relatórios
          </Text>
          <PDFReportGenerator
            data={reportData}
            onExport={(format) => console.log("Export:", format)}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
