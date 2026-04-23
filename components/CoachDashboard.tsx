import React from "react";
import { ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

interface CoachDashboardProps {
  coachDashboard: {
    totalAthletes: number;
    recentWorkouts: number;
    upcomingEvents: number;
    athletes: {
      _id: string;
      position?: string;
    }[];
  };
  teamAthletes: {
    _id: string;
    full_name?: string;
    user?: {
      _id: string;
      full_name?: string;
    } | null;
    position?: string;
  }[];
  colors: any;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({
  coachDashboard,
  teamAthletes,
  colors,
}) => {
  const athletes = teamAthletes.filter(Boolean);

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 4,
              }}
            >
              Dashboard do treinador
            </Text>
            <Text style={{ color: colors.textMuted }}>
              Resumo rápido da equipa e da atividade recente.
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 24, gap: 12 }}>
            <StatCard label="Atletas" value={coachDashboard.totalAthletes} color={colors.primary} colors={colors} />
            <StatCard label="Treinos recentes" value={coachDashboard.recentWorkouts} color={colors.success} colors={colors} />
            <StatCard label="Próximos eventos" value={coachDashboard.upcomingEvents} color={colors.warning} colors={colors} />
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "bold",
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Plantel
            </Text>

            {athletes.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>
                Ainda não existem atletas associados à equipa.
              </Text>
            ) : (
              athletes.map((athlete) => (
                <View
                  key={athlete._id?.toString?.() || athlete.user?._id?.toString?.()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 18 }}>
                      {(athlete.full_name || athlete.user?.full_name || "?").charAt(0)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16 }}>
                      {athlete.full_name || athlete.user?.full_name || "Atleta"}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                      {athlete.position || "Sem posição definida"}
                    </Text>
                  </View>

                  <Ionicons name="people-outline" size={18} color={colors.textMuted} />
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

function StatCard({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: number;
  color: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
      }}
    >
      <Text style={{ color, fontSize: 24, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

export default CoachDashboard;
