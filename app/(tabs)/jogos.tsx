import { api } from "@/utils/apiClient";
import type { Doc, Id } from "@/utils/apiTypes";
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
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Team = Doc<"teams">;
type GameWithTeams = Doc<"games"> & {
  team1: Team | null;
  team2: Team | null;
  creator: { _id: Id<"users">; full_name: string } | null;
};

const emptyCreateForm = {
  name: "",
  opponentTeamId: "" as string,
  location: "",
  date: "",
  notes: "",
};

const emptyEditForm = {
  location: "",
  date: "",
  notes: "",
  score1: "",
  score2: "",
  status: "scheduled" as "scheduled" | "in_progress" | "completed" | "cancelled",
};

export default function Jogos() {
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
  const opponentTeams =
    useQuery(
      api.teams.listTeams,
      team ? { excludeTeamId: team._id } : {},
    ) || [];
  const gamesQuery = useQuery(
    api.games.getGames,
    convexUser && team
      ? { sessionUserId: convexUser._id, teamId: team._id }
      : "skip",
  );
  const games: GameWithTeams[] = gamesQuery ?? [];

  const createGame = useMutation(api.games.createGame);
  const updateGame = useMutation(api.games.updateGame);
  const deleteGame = useMutation(api.games.deleteGame);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameWithTeams | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const sortedGames = [...games].sort((a, b) => b.date - a.date);

  if (!convexUser) {
    return null;
  }

  if (convexUser.role !== "COACH") {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: "700",
              marginTop: 16,
            }}
          >
            Acesso restrito
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
            Esta página está disponível apenas para treinadores.
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const resetCreateForm = () => {
    setCreateForm(emptyCreateForm);
    setShowCreateModal(false);
  };

  const resetEditForm = () => {
    setEditForm(emptyEditForm);
    setSelectedGame(null);
    setShowEditModal(false);
  };

  const openEditModal = (game: GameWithTeams) => {
    setSelectedGame(game);
    setEditForm({
      location: game.location || "",
      date: new Date(game.date).toISOString().slice(0, 16),
      notes: game.notes || "",
      score1: game.score1?.toString() || "",
      score2: game.score2?.toString() || "",
      status: game.status,
    });
    setShowEditModal(true);
  };

  const formatGameDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString("pt-PT", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getOpponentName = (game: GameWithTeams) => {
    if (!team) return "Equipa";
    return game.team1Id === team._id ? game.team2?.name : game.team1?.name;
  };

  const getStatusLabel = (status: GameWithTeams["status"]) => {
    switch (status) {
      case "scheduled":
        return "Agendado";
      case "in_progress":
        return "A decorrer";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
    }
  };

  const getStatusColor = (status: GameWithTeams["status"]) => {
    switch (status) {
      case "scheduled":
        return colors.primary;
      case "in_progress":
        return colors.warning;
      case "completed":
        return colors.success;
      case "cancelled":
        return colors.danger;
    }
  };

  const handleCreateGame = async () => {
    if (!team || !convexUser) return;
    if (!createForm.name.trim() || !createForm.location.trim() || !createForm.date || !createForm.opponentTeamId) {
      Alert.alert("Erro", "Preenche nome, adversário, local e data.");
      return;
    }

    const parsedDate = new Date(createForm.date);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert("Erro", "A data do jogo não é válida.");
      return;
    }

    try {
      await createGame({
        sessionUserId: convexUser._id,
        name: createForm.name.trim(),
        team1Id: team._id,
        team2Id: createForm.opponentTeamId as Id<"teams">,
        date: parsedDate.getTime(),
        location: createForm.location.trim(),
        notes: createForm.notes.trim() || undefined,
      });
      resetCreateForm();
      Alert.alert("Sucesso", "Jogo criado com sucesso.");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao criar jogo.");
    }
  };

  const handleUpdateGame = async () => {
    if (!selectedGame || !convexUser) return;

    const parsedDate = new Date(editForm.date);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert("Erro", "A data do jogo não é válida.");
      return;
    }

    try {
      await updateGame({
        sessionUserId: convexUser._id,
        gameId: selectedGame._id,
        location: editForm.location.trim() || undefined,
        date: parsedDate.getTime(),
        notes: editForm.notes.trim() || undefined,
        status: editForm.status,
        score1: editForm.score1 ? Number(editForm.score1) : undefined,
        score2: editForm.score2 ? Number(editForm.score2) : undefined,
      });
      resetEditForm();
      Alert.alert("Sucesso", "Jogo atualizado.");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao atualizar jogo.");
    }
  };

  const handleDeleteGame = (game: GameWithTeams) => {
    if (!convexUser) return;
    Alert.alert("Eliminar jogo", `Queres remover o jogo "${game.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGame({
              sessionUserId: convexUser._id,
              gameId: game._id,
            });
            if (selectedGame?._id === game._id) {
              resetEditForm();
            }
            Alert.alert("Sucesso", "Jogo eliminado.");
          } catch (error) {
            Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao eliminar jogo.");
          }
        },
      },
    ]);
  };

  const renderGameCard = ({ item }: { item: GameWithTeams }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
            {item.name}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            {team?.name} vs {getOpponentName(item)}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>
            {formatGameDate(item.date)}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>{item.location}</Text>
        </View>
        <View
          style={{
            backgroundColor: getStatusColor(item.status),
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {item.status === "completed" && (
        <Text style={{ color: colors.text, marginBottom: 10, fontWeight: "600" }}>
          Resultado: {item.score1 ?? 0} - {item.score2 ?? 0}
        </Text>
      )}

      {item.notes ? (
        <Text style={{ color: colors.textMuted, marginBottom: 12 }}>{item.notes}</Text>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={() => openEditModal(item)}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: colors.danger,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={() => handleDeleteGame(item)}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
                Jogos
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                {team ? `Gestão de jogos da equipa ${team.name}` : "Cria a tua equipa para começar."}
              </Text>
            </View>
            <TouchableOpacity
              disabled={!team}
              style={{
                backgroundColor: team ? colors.primary : colors.surface,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
              }}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={{ color: team ? "white" : colors.textMuted, fontWeight: "700" }}>
                + Jogo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList<GameWithTeams>
          data={sortedGames}
          keyExtractor={(item) => item._id}
          renderItem={renderGameCard}
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
              <Ionicons name="football-outline" size={42} color={colors.textMuted} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "700",
                  marginTop: 12,
                }}
              >
                Nenhum jogo registado
              </Text>
              <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                {team
                  ? "Cria o primeiro jogo da equipa para o veres aqui."
                  : "Cria ou associa uma equipa primeiro."}
              </Text>
            </View>
          }
        />

        <Modal visible={showCreateModal} animationType="slide" onRequestClose={resetCreateForm}>
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
                <TouchableOpacity onPress={resetCreateForm}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  Novo jogo
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <TextInput
                value={createForm.name}
                onChangeText={(text) => setCreateForm((current) => ({ ...current, name: text }))}
                placeholder="Nome do jogo"
                placeholderTextColor={colors.textMuted}
                style={inputStyle(colors)}
              />
              <TextInput
                value={createForm.location}
                onChangeText={(text) => setCreateForm((current) => ({ ...current, location: text }))}
                placeholder="Local"
                placeholderTextColor={colors.textMuted}
                style={inputStyle(colors)}
              />
              <TextInput
                value={createForm.date}
                onChangeText={(text) => setCreateForm((current) => ({ ...current, date: text }))}
                placeholder="Data e hora (ex: 2026-04-22T19:30)"
                placeholderTextColor={colors.textMuted}
                style={inputStyle(colors)}
              />
              <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "600" }}>
                Adversário
              </Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {opponentTeams.map((opponent: Team) => (
                  <TouchableOpacity
                    key={opponent._id}
                    style={{
                      backgroundColor:
                        createForm.opponentTeamId === opponent._id ? colors.primary : colors.surface,
                      borderRadius: 12,
                      padding: 12,
                    }}
                    onPress={() =>
                      setCreateForm((current) => ({
                        ...current,
                        opponentTeamId: opponent._id,
                      }))
                    }
                  >
                    <Text
                      style={{
                        color:
                          createForm.opponentTeamId === opponent._id ? "white" : colors.text,
                        fontWeight: "600",
                      }}
                    >
                      {opponent.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={createForm.notes}
                onChangeText={(text) => setCreateForm((current) => ({ ...current, notes: text }))}
                placeholder="Notas opcionais"
                placeholderTextColor={colors.textMuted}
                multiline
                style={[inputStyle(colors), { height: 100, textAlignVertical: "top" }]}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={handleCreateGame}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                  Guardar jogo
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>
        </Modal>

        <Modal visible={showEditModal} animationType="slide" onRequestClose={resetEditForm}>
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
                <TouchableOpacity onPress={resetEditForm}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  Editar jogo
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <TextInput
                value={editForm.location}
                onChangeText={(text) => setEditForm((current) => ({ ...current, location: text }))}
                placeholder="Local"
                placeholderTextColor={colors.textMuted}
                style={inputStyle(colors)}
              />
              <TextInput
                value={editForm.date}
                onChangeText={(text) => setEditForm((current) => ({ ...current, date: text }))}
                placeholder="Data e hora (ex: 2026-04-22T19:30)"
                placeholderTextColor={colors.textMuted}
                style={inputStyle(colors)}
              />

              <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "600" }}>
                Estado
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {(["scheduled", "in_progress", "completed", "cancelled"] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={{
                      backgroundColor: editForm.status === status ? colors.primary : colors.surface,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 999,
                    }}
                    onPress={() => setEditForm((current) => ({ ...current, status }))}
                  >
                    <Text
                      style={{
                        color: editForm.status === status ? "white" : colors.text,
                        fontWeight: "600",
                      }}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  value={editForm.score1}
                  onChangeText={(text) => setEditForm((current) => ({ ...current, score1: text }))}
                  placeholder={team?.name || "Equipa 1"}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[inputStyle(colors), { flex: 1 }]}
                />
                <TextInput
                  value={editForm.score2}
                  onChangeText={(text) => setEditForm((current) => ({ ...current, score2: text }))}
                  placeholder="Adversário"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[inputStyle(colors), { flex: 1 }]}
                />
              </View>

              <TextInput
                value={editForm.notes}
                onChangeText={(text) => setEditForm((current) => ({ ...current, notes: text }))}
                placeholder="Notas"
                placeholderTextColor={colors.textMuted}
                multiline
                style={[inputStyle(colors), { height: 100, textAlignVertical: "top" }]}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={handleUpdateGame}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                  Guardar alterações
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function inputStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
  } as const;
}
