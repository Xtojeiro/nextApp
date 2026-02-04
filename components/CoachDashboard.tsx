import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";

interface CoachDashboardProps {
  coachDashboard: any;
  teamAthletes: any[];
  colors: any;
  t: any;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({
  coachDashboard,
  teamAthletes,
  colors,
  t,
}) => {
  const renderAthleteCard = (athlete: any) => (
    <View
      key={athlete.id}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
          {athlete.name.charAt(0)}
        </Text>
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>
          {athlete.name}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 14 }}>
          {athlete.position} • {athlete.weeklyFrequency}x/sem
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          Última atividade: {athlete.lastActivity}
        </Text>
      </View>
      
      <View
        style={{
          backgroundColor:
            athlete.status === "active" ? colors.success : colors.warning,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
          {athlete.status === "active" ? "Ativo" : "Inativo"}
        </Text>
      </View>
    </View>
  );

  const filteredAthletes = teamAthletes.filter(
    (athlete) => athlete.status === "active"
  );

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 4,
              }}
            >
              Dashboard do Treinador
            </Text>
            <Text style={{ color: colors.textMuted }}>
              Visão geral da sua equipa
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginRight: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.primary, fontSize: 24, fontWeight: "bold" }}
              >
                {coachDashboard.totalAthletes}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Total Atletas
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 4,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.success, fontSize: 24, fontWeight: "bold" }}
              >
                {coachDashboard.activeAthletes}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Ativos
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 4,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.warning, fontSize: 24, fontWeight: "bold" }}
              >
                {coachDashboard.inactiveAthletes}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Inativos
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginLeft: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}
              >
                {coachDashboard.averageWeeklyFrequency.toFixed(1)}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Média Semanal
              </Text>
            </View>
          </View>

          {/* Alerts Section */}
          {coachDashboard.lowActivityAlerts > 0 && (
            <View
              style={{
                backgroundColor: colors.warning + "20",
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                borderLeftWidth: 4,
                borderLeftColor: colors.warning,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="warning" size={20} color={colors.warning} />
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "bold",
                    marginLeft: 8,
                    flex: 1,
                  }}
                >
                  {coachDashboard.lowActivityAlerts} atletas com baixa atividade
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                Considere contactar estes atletas para aumentar o engajamento
              </Text>
            </View>
          )}

          {/* Upcoming Events */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
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
              Próximos Eventos
            </Text>
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Ionicons name="barbell" size={24} color={colors.primary} />
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                  {coachDashboard.upcomingTrainings}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Treinos
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Ionicons name="football" size={24} color={colors.success} />
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                  {coachDashboard.upcomingGames}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                  Jogos
                </Text>
              </View>
            </View>
          </View>

          {/* Active Athletes */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontWeight: "bold",
                  fontSize: 18,
                }}
              >
                Atletas Ativos
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert("Info", "Ver todos os atletas")}
              >
                <Text style={{ color: colors.primary }}>Ver Todos</Text>
              </TouchableOpacity>
            </View>
            
            {filteredAthletes.map(renderAthleteCard)}
            
            {filteredAthletes.length === 0 && (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Text style={{ color: colors.textMuted }}>
                  Nenhum atleta ativo no momento
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default CoachDashboard;