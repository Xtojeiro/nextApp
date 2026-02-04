import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Equipa() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const convexUser = useQuery(api.users.getCurrentUser);

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
            Apenas treinadores podem aceder à gestão de equipa
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const teamAthletes = useQuery(api.users.getTeamAthletes) || [];
  const addNoteMutation = useMutation(api.users.addAthleteNote);
  
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterPosition, setFilterPosition] = useState<string>("");

  // Filter athletes
  const filteredAthletes = teamAthletes.filter((athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === "all" || athlete.status === filterStatus;
    const matchesPosition = !filterPosition || athlete.position === filterPosition;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const positions = [...new Set(teamAthletes.map(a => a.position))];

  const handleAddNote = async () => {
    if (!selectedAthlete || !noteText.trim()) return;

    try {
      await addNoteMutation({
        athleteId: selectedAthlete.id,
        note: noteText,
      });
      Alert.alert("Sucesso", "Nota adicionada com sucesso!");
      setShowNoteModal(false);
      setNoteText("");
    } catch (error) {
      Alert.alert("Erro", "Falha ao adicionar nota");
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? colors.success : colors.warning;
  };

  const getStatusText = (status: string) => {
    return status === "active" ? "Ativo" : "Inativo";
  };

  const renderAthleteCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={() => {
        setSelectedAthlete(item);
        setShowAthleteModal(true);
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
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
            {item.name.charAt(0)}
          </Text>
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: "bold", fontSize: 16 }}>
            {item.name}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            {item.position} • {item.age} anos
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            {item.height_cm}cm • {item.weight_kg}kg
          </Text>
        </View>
        
        <View
          style={{
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="barbell" size={16} color={colors.primary} />
          <Text style={{ color: colors.text, marginLeft: 4, fontSize: 14 }}>
            {item.totalWorkouts} treinos
          </Text>
        </View>
        
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="football" size={16} color={colors.success} />
          <Text style={{ color: colors.text, marginLeft: 4, fontSize: 14 }}>
            {item.totalGames} jogos
          </Text>
        </View>
        
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="calendar" size={16} color={colors.warning} />
          <Text style={{ color: colors.text, marginLeft: 4, fontSize: 14 }}>
            {item.weeklyFrequency}x/sem
          </Text>
        </View>
      </View>

      {item.notes && (
        <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: "italic" }}>
            Nota: {item.notes}
          </Text>
        </View>
      )}
    </TouchableOpacity>
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
                marginBottom: 4,
              }}
            >
              Gestão de Atletas
            </Text>
            <Text style={{ color: colors.textMuted }}>
              {teamAthletes.filter(a => a.status === "active").length} atletas ativos •{" "}
              {teamAthletes.filter(a => a.status === "inactive").length} inativos
            </Text>
          </View>

          {/* Search and Filters */}
          <View style={{ marginBottom: 16 }}>
            <TextInput
              placeholder="Pesquisar atleta..."
              value={searchText}
              onChangeText={setSearchText}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                marginBottom: 12,
              }}
            />

            {/* Status Filter */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              {["all", "active", "inactive"].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={{
                    backgroundColor:
                      filterStatus === status ? colors.primary : colors.surface,
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 8,
                    flex: 1,
                  }}
                  onPress={() => setFilterStatus(status as any)}
                >
                  <Text
                    style={{
                      color: filterStatus === status ? "white" : colors.text,
                      textAlign: "center",
                      fontSize: 12,
                    }}
                  >
                    {status === "all" ? "Todos" : status === "active" ? "Ativos" : "Inativos"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Position Filter */}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: !filterPosition ? colors.primary : colors.surface,
                  padding: 8,
                  borderRadius: 8,
                  marginRight: 8,
                  marginBottom: 4,
                }}
                onPress={() => setFilterPosition("")}
              >
                <Text
                  style={{
                    color: !filterPosition ? "white" : colors.text,
                    fontSize: 12,
                  }}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              {positions.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={{
                    backgroundColor: filterPosition === position ? colors.primary : colors.surface,
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 8,
                    marginBottom: 4,
                  }}
                  onPress={() => setFilterPosition(position)}
                >
                  <Text
                    style={{
                      color: filterPosition === position ? "white" : colors.text,
                      fontSize: 12,
                    }}
                  >
                    {position}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Athletes List */}
          <FlatList
            data={filteredAthletes}
            keyExtractor={(item) => item.id}
            renderItem={renderAthleteCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </ScrollView>
      </SafeAreaView>

      {/* Athlete Detail Modal */}
      <Modal
        visible={showAthleteModal}
        animationType="slide"
        onRequestClose={() => setShowAthleteModal(false)}
      >
        {selectedAthlete && (
          <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <TouchableOpacity onPress={() => setShowAthleteModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                  {selectedAthlete.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowNoteModal(true);
                    setShowAthleteModal(false);
                  }}
                >
                  <Ionicons name="create" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1, padding: 20 }}>
                {/* Profile Info */}
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 24 }}>
                      {selectedAthlete.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                    {selectedAthlete.name}
                  </Text>
                  <Text style={{ color: colors.textMuted }}>
                    {selectedAthlete.position} • {selectedAthlete.age} anos
                  </Text>
                </View>

                {/* Stats Grid */}
                <View style={{ flexDirection: "row", marginBottom: 24 }}>
                  <View style={{ flex: 1, alignItems: "center", marginRight: 8 }}>
                    <Text style={{ color: colors.primary, fontSize: 24, fontWeight: "bold" }}>
                      {selectedAthlete.totalWorkouts}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>Treinos</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center", marginRight: 8 }}>
                    <Text style={{ color: colors.success, fontSize: 24, fontWeight: "bold" }}>
                      {selectedAthlete.totalGames}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>Jogos</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center", marginRight: 8 }}>
                    <Text style={{ color: colors.warning, fontSize: 24, fontWeight: "bold" }}>
                      {selectedAthlete.weeklyFrequency}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>x/sem</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}>
                      {getStatusText(selectedAthlete.status)}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>Estado</Text>
                  </View>
                </View>

                {/* Physical Info */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 8 }}>
                    Informações Físicas
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ color: colors.textMuted }}>Altura</Text>
                      <Text style={{ color: colors.text }}>{selectedAthlete.height_cm} cm</Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.textMuted }}>Peso</Text>
                      <Text style={{ color: colors.text }}>{selectedAthlete.weight_kg} kg</Text>
                    </View>
                    <View>
                      <Text style={{ color: colors.textMuted }}>Pé Preferido</Text>
                      <Text style={{ color: colors.text }}>
                        {selectedAthlete.preferred_foot === "RIGHT" ? "Direito" : "Esquerdo"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Notes */}
                {selectedAthlete.notes && (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 8 }}>
                      Notas do Treinador
                    </Text>
                    <Text style={{ color: colors.text }}>{selectedAthlete.notes}</Text>
                  </View>
                )}

                {/* Activity */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 8 }}>
                    Atividade Recente
                  </Text>
                  <Text style={{ color: colors.text }}>
                    Última atividade: {selectedAthlete.lastActivity}
                  </Text>
                </View>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        )}
      </Modal>

      {/* Add Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        onRequestClose={() => setShowNoteModal(false)}
      >
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, padding: 20 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                Adicionar Nota
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {selectedAthlete && (
              <View>
                <Text style={{ color: colors.text, fontSize: 16, marginBottom: 8 }}>
                  Atleta: {selectedAthlete.name}
                </Text>
                <TextInput
                  placeholder="Escreva sua nota aqui..."
                  value={noteText}
                  onChangeText={setNoteText}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.text,
                    height: 120,
                    textAlignVertical: "top",
                    marginBottom: 20,
                  }}
                  multiline
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.danger,
                      padding: 16,
                      borderRadius: 12,
                      flex: 1,
                      marginRight: 8,
                      alignItems: "center",
                    }}
                    onPress={() => setShowNoteModal(false)}
                  >
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      padding: 16,
                      borderRadius: 12,
                      flex: 1,
                      marginLeft: 8,
                      alignItems: "center",
                    }}
                    onPress={handleAddNote}
                  >
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                      Adicionar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}