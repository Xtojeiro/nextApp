import { api } from "@/utils/apiClient";
import type { Id } from "@/utils/apiTypes";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
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

type TeamAthlete = any;

export default function Equipa() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { sessionUserId: user.id as Id<"users"> } : "skip",
  );
  const team = useQuery(
    api.teams.getTeam,
    convexUser ? { sessionUserId: convexUser._id } : "skip",
  );
  const athletesQuery = useQuery(
    api.teams.getTeamAthletes,
    convexUser ? { sessionUserId: convexUser._id } : "skip",
  );
  const athletes = (athletesQuery ?? []) as TeamAthlete[];
  const addAthleteNote = useMutation(api.users.addAthleteNote);

  const [search, setSearch] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<TeamAthlete | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState("");

  const filteredAthletes = athletes.filter((athlete) => {
    const name = athlete.user?.full_name || "";
    const position = athlete.position || "";
    const query = search.trim().toLowerCase();
    return name.toLowerCase().includes(query) || position.toLowerCase().includes(query);
  });

  if (!convexUser) {
    return null;
  }

  if (convexUser.role !== "COACH") {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 16 }}>
            Acesso restrito
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
            A gestão da equipa está disponível apenas para treinadores.
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const openNoteModal = (athlete: TeamAthlete) => {
    setSelectedAthlete(athlete);
    setNote("");
    setShowNoteModal(true);
  };

  const handleSaveNote = async () => {
    if (!convexUser || !selectedAthlete?.user?._id || !note.trim()) {
      Alert.alert("Erro", "Escreve uma nota antes de guardar.");
      return;
    }

    try {
      await addAthleteNote({
        sessionUserId: convexUser._id,
        athleteId: selectedAthlete.user._id,
        note: note.trim(),
      });
      setShowNoteModal(false);
      Alert.alert(
        "Nota guardada",
        "A nota foi validada pelo backend. O modelo atual ainda não persiste estas notas na ficha do atleta.",
      );
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao guardar nota.");
    }
  };

  const renderAthleteCard = ({ item }: { item: TeamAthlete }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 18 }}>
            {(item.user?.full_name || "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
            {item.user?.full_name || "Atleta"}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>
            {item.position || "Sem posição definida"}
          </Text>
        </View>
      </View>

      <View style={{ gap: 4, marginBottom: 12 }}>
        <Text style={{ color: colors.textMuted }}>
          Email: {item.user?.email || "Sem email"}
        </Text>
        <Text style={{ color: colors.textMuted }}>
          Perfil: {item.user?.bio || "Sem biografia"}
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: colors.primary,
          paddingVertical: 10,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={() => openNoteModal(item)}
      >
        <Text style={{ color: "white", fontWeight: "700" }}>Adicionar nota</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            Equipa
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            {team ? `${team.name} • ${athletes.length} atletas` : "Sem equipa associada."}
          </Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Pesquisar por nome ou posição"
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              marginTop: 16,
            }}
          />
        </View>

        <FlatList
          data={filteredAthletes}
          keyExtractor={(item) => item._id}
          renderItem={renderAthleteCard}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          ListEmptyComponent={
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <Ionicons name="people-outline" size={42} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 12 }}>
                Nenhum atleta encontrado
              </Text>
              <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                {team
                  ? "Esta equipa ainda não tem atletas associados."
                  : "Cria uma equipa ou associa atletas para os veres aqui."}
              </Text>
            </View>
          }
        />

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
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  Nota do treinador
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView>
                <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 8 }}>
                  {selectedAthlete?.user?.full_name || "Atleta"}
                </Text>
                <Text style={{ color: colors.textMuted, marginBottom: 16 }}>
                  {selectedAthlete?.position || "Sem posição definida"}
                </Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Escreve uma observação sobre este atleta"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    height: 140,
                    textAlignVertical: "top",
                    marginBottom: 20,
                  }}
                />
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                  onPress={handleSaveNote}
                >
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                    Guardar nota
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
