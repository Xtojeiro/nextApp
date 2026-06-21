import { api } from "@/utils/apiClient";
import { getSimpleErrorMessage } from "@/utils/errorMessages";
import type { Doc, Id } from "@/utils/apiTypes";
import { DateTimeField, FormErrorText } from "@/components/FormFields";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  futureDateTime,
  nonNegativeInteger,
  optionalText,
  requiredText,
  ValidationErrors,
} from "@/utils/formValidation";
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
  date: null as number | null,
  notes: "",
};

const emptyEditForm = {
  location: "",
  date: null as number | null,
  notes: "",
  score1: "",
  score2: "",
  status: "scheduled" as "scheduled" | "in_progress" | "completed" | "cancelled",
};

type CreateField = keyof typeof emptyCreateForm;
type EditField = keyof typeof emptyEditForm;
type ThemeColors = ReturnType<typeof useTheme>["colors"];

const gameStatuses = ["scheduled", "in_progress", "completed", "cancelled"] as const;

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
  const approveGameResult = useMutation(api.games.approveGameResult);
  const rejectGameResult = useMutation(api.games.rejectGameResult);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameWithTeams | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [createErrors, setCreateErrors] = useState<ValidationErrors<CreateField>>({});
  const [editErrors, setEditErrors] = useState<ValidationErrors<EditField>>({});

  const sortedGames = [...games].sort((a, b) => b.date - a.date);
  const createButtonTextColor = getCreateButtonTextColor(team, colors);
  const createButtonBackgroundColor = getCreateButtonBackgroundColor(team, colors);
  const editMinimumDate = getEditMinimumDate(editForm.status);
  const emptyGamesMessage = getEmptyGamesMessage(team);
  const gamesHeaderSubtitle = getGamesHeaderSubtitle(team);

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
    setCreateErrors({});
    setShowCreateModal(false);
  };

  const resetEditForm = () => {
    setEditForm(emptyEditForm);
    setEditErrors({});
    setSelectedGame(null);
    setShowEditModal(false);
  };

  const openEditModal = (game: GameWithTeams) => {
    setSelectedGame(game);
    setEditForm({
      location: game.location || "",
      date: game.date,
      notes: game.notes || "",
      score1: game.score1?.toString() || "",
      score2: game.score2?.toString() || "",
      status: game.status,
    });
    setShowEditModal(true);
  };


  const handleCreateGame = async () => {
    if (!team || !convexUser) return;
    const nextErrors: ValidationErrors<CreateField> = {
      name: requiredText(createForm.name, "Nome do jogo"),
      location: requiredText(createForm.location, "Local", 120),
      opponentTeamId: createForm.opponentTeamId ? undefined : "Adversário é obrigatório.",
      date: futureDateTime(createForm.date, "Data do jogo"),
      notes: optionalText(createForm.notes, "Notas"),
    };
    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as CreateField]) delete nextErrors[key as CreateField];
    });
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await createGame({
        sessionUserId: convexUser._id,
        name: createForm.name.trim(),
        team1Id: team._id,
        team2Id: createForm.opponentTeamId as Id<"teams">,
        date: createForm.date!,
        location: createForm.location.trim(),
        notes: createForm.notes.trim() || undefined,
      });
      resetCreateForm();
      Alert.alert("Sucesso", "Jogo criado com sucesso.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao criar jogo."));
    }
  };

  const handleUpdateGame = async () => {
    if (!selectedGame || !convexUser) return;
    const shouldRequireFuture =
      editForm.status === "scheduled" || editForm.status === "in_progress";
    const dateError = shouldRequireFuture
      ? futureDateTime(editForm.date, "Data do jogo")
      : getRequiredGameDateError(editForm.date);
    const nextErrors: ValidationErrors<EditField> = {
      location: requiredText(editForm.location, "Local", 120),
      date: dateError,
      notes: optionalText(editForm.notes, "Notas"),
      score1: nonNegativeInteger(editForm.score1, team?.name || "Pontuação da equipa"),
      score2: nonNegativeInteger(editForm.score2, "Pontuação do adversário"),
    };
    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as EditField]) delete nextErrors[key as EditField];
    });
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const parsedDate = new Date(editForm.date!);
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert("Erro", "A data do jogo não é válida.");
      return;
    }

    try {
      await updateGame({
        sessionUserId: convexUser._id,
        gameId: selectedGame._id,
        location: editForm.location.trim() || undefined,
        date: editForm.date!,
        notes: editForm.notes.trim() || undefined,
        status: editForm.status,
        score1: editForm.score1 ? Number(editForm.score1) : undefined,
        score2: editForm.score2 ? Number(editForm.score2) : undefined,
      });
      const submittedForApproval = editForm.status === "completed";
      resetEditForm();
      Alert.alert(
        "Sucesso",
        submittedForApproval ? "Resultado enviado para validação." : "Jogo atualizado.",
      );
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao atualizar jogo."));
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
            Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao eliminar jogo."));
          }
        },
      },
    ]);
  };

  const handleApproveGameResult = async (game: GameWithTeams) => {
    if (!convexUser) return;
    try {
      await approveGameResult({
        sessionUserId: convexUser._id,
        gameId: game._id,
      });
      Alert.alert("Sucesso", "Resultado aprovado e publicado.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao aprovar resultado."));
    }
  };

  const handleRejectGameResult = async (game: GameWithTeams) => {
    if (!convexUser) return;
    try {
      await rejectGameResult({
        sessionUserId: convexUser._id,
        gameId: game._id,
      });
      Alert.alert("Sucesso", "Resultado rejeitado.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao rejeitar resultado."));
    }
  };

  const renderGameCard = ({ item }: { item: GameWithTeams }) => (
    <GameCard
      colors={colors}
      game={item}
      team={team}
      currentUserId={convexUser._id}
      onApprove={handleApproveGameResult}
      onDelete={handleDeleteGame}
      onEdit={openEditModal}
      onReject={handleRejectGameResult}
    />
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
                {gamesHeaderSubtitle}
              </Text>
            </View>
            <TouchableOpacity
              disabled={!team}
              style={{
                backgroundColor: createButtonBackgroundColor,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
              }}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={{ color: createButtonTextColor, fontWeight: "700" }}>
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
                {emptyGamesMessage}
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
                onChangeText={(text) => {
                  setCreateForm((current) => ({ ...current, name: text }));
                  setCreateErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="Nome do jogo"
                placeholderTextColor={colors.textMuted}
                style={[
                  inputStyle(colors),
                  errorBorderStyle(colors, createErrors.name),
                ]}
              />
              <FormErrorText error={createErrors.name} />
              <TextInput
                value={createForm.location}
                onChangeText={(text) => {
                  setCreateForm((current) => ({ ...current, location: text }));
                  setCreateErrors((current) => ({ ...current, location: undefined }));
                }}
                placeholder="Local"
                placeholderTextColor={colors.textMuted}
                style={[
                  inputStyle(colors),
                  errorBorderStyle(colors, createErrors.location),
                ]}
              />
              <FormErrorText error={createErrors.location} />
              <DateTimeField
                label="Data e hora"
                value={createForm.date}
                onChange={(value) => {
                  setCreateForm((current) => ({ ...current, date: value }));
                  setCreateErrors((current) => ({ ...current, date: undefined }));
                }}
                placeholder="Selecionar data e hora"
                error={createErrors.date}
                minimumDate={new Date()}
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
              <FormErrorText error={createErrors.opponentTeamId} />
              <TextInput
                value={createForm.notes}
                onChangeText={(text) => {
                  setCreateForm((current) => ({ ...current, notes: text }));
                  setCreateErrors((current) => ({ ...current, notes: undefined }));
                }}
                placeholder="Notas opcionais"
                placeholderTextColor={colors.textMuted}
                multiline
                style={[
                  inputStyle(colors),
                  { height: 100, textAlignVertical: "top" },
                  errorBorderStyle(colors, createErrors.notes),
                ]}
              />
              <FormErrorText error={createErrors.notes} />

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
                onChangeText={(text) => {
                  setEditForm((current) => ({ ...current, location: text }));
                  setEditErrors((current) => ({ ...current, location: undefined }));
                }}
                placeholder="Local"
                placeholderTextColor={colors.textMuted}
                style={[
                  inputStyle(colors),
                  errorBorderStyle(colors, editErrors.location),
                ]}
              />
              <FormErrorText error={editErrors.location} />
              <DateTimeField
                label="Data e hora"
                value={editForm.date}
                onChange={(value) => {
                  setEditForm((current) => ({ ...current, date: value }));
                  setEditErrors((current) => ({ ...current, date: undefined }));
                }}
                placeholder="Selecionar data e hora"
                error={editErrors.date}
                minimumDate={editMinimumDate}
              />

              <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "600" }}>
                Estado
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {gameStatuses.map((status) => (
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
                  onChangeText={(text) => {
                    setEditForm((current) => ({ ...current, score1: text }));
                    setEditErrors((current) => ({ ...current, score1: undefined }));
                  }}
                  placeholder={team?.name || "Equipa 1"}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[
                    inputStyle(colors),
                    { flex: 1 },
                    errorBorderStyle(colors, editErrors.score1),
                  ]}
                />
                <TextInput
                  value={editForm.score2}
                  onChangeText={(text) => {
                    setEditForm((current) => ({ ...current, score2: text }));
                    setEditErrors((current) => ({ ...current, score2: undefined }));
                  }}
                  placeholder="Adversário"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[
                    inputStyle(colors),
                    { flex: 1 },
                    errorBorderStyle(colors, editErrors.score2),
                  ]}
                />
              </View>
              <FormErrorText error={editErrors.score1 || editErrors.score2} />

              <TextInput
                value={editForm.notes}
                onChangeText={(text) => {
                  setEditForm((current) => ({ ...current, notes: text }));
                  setEditErrors((current) => ({ ...current, notes: undefined }));
                }}
                placeholder="Notas"
                placeholderTextColor={colors.textMuted}
                multiline
                style={[
                  inputStyle(colors),
                  { height: 100, textAlignVertical: "top" },
                  errorBorderStyle(colors, editErrors.notes),
                ]}
              />
              <FormErrorText error={editErrors.notes} />

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

function GameCard({
  colors,
  game,
  team,
  currentUserId,
  onApprove,
  onDelete,
  onEdit,
  onReject,
}: Readonly<{
  colors: ThemeColors;
  game: GameWithTeams;
  team: Team | null | undefined;
  currentUserId: Id<"users">;
  onApprove: (game: GameWithTeams) => void;
  onDelete: (game: GameWithTeams) => void;
  onEdit: (game: GameWithTeams) => void;
  onReject: (game: GameWithTeams) => void;
}>) {
  const submitterIsCurrentUser = game.submittedBy === currentUserId;
  const currentUserCanValidate =
    game.resultStatus === "pending_approval" &&
    game.submittedBy !== currentUserId &&
    isCoachOfGame(currentUserId, game);

  return (
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
            {game.name}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            {team?.name} vs {getOpponentName(game, team)}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>
            {formatGameDate(game.date)}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 2 }}>{game.location}</Text>
        </View>
        <View
          style={{
            backgroundColor: getStatusColor(game.status, colors),
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
            {getStatusLabel(game.status)}
          </Text>
        </View>
      </View>

      {game.status === "completed" && (
        <Text style={{ color: colors.text, marginBottom: 10, fontWeight: "600" }}>
          Resultado: {game.score1 ?? 0} - {game.score2 ?? 0}
        </Text>
      )}

      {game.resultStatus === "pending_approval" ? (
        <View
          style={{
            backgroundColor: colors.warning,
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {submitterIsCurrentUser ? "A aguardar validação" : "Resultado por validar"}
          </Text>
          <Text style={{ color: "white", marginTop: 4 }}>
            Proposto: {game.pendingScore1 ?? 0} - {game.pendingScore2 ?? 0}
          </Text>
        </View>
      ) : null}

      {game.resultStatus === "rejected" && game.submittedBy === currentUserId ? (
        <Text style={{ color: colors.danger, marginBottom: 10, fontWeight: "700" }}>
          Resultado rejeitado. Corrige e submete novamente.
        </Text>
      ) : null}

      {game.notes ? (
        <Text style={{ color: colors.textMuted, marginBottom: 12 }}>{game.notes}</Text>
      ) : null}

      {currentUserCanValidate ? (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.success,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
            }}
            onPress={() => onApprove(game)}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Aprovar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.danger,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
            }}
            onPress={() => onReject(game)}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Rejeitar</Text>
          </TouchableOpacity>
        </View>
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
          onPress={() => onEdit(game)}
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
          onPress={() => onDelete(game)}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatGameDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getOpponentName(game: GameWithTeams, team: Team | null | undefined) {
  if (!team) return "Equipa";
  return game.team1Id === team._id ? game.team2?.name : game.team1?.name;
}

function isCoachOfGame(userId: Id<"users">, game: GameWithTeams) {
  return game.team1?.coachId === userId || game.team2?.coachId === userId;
}

function getStatusLabel(status: GameWithTeams["status"]) {
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
}

function getStatusColor(status: GameWithTeams["status"], colors: ThemeColors) {
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
}

function getCreateButtonBackgroundColor(team: Team | null | undefined, colors: ThemeColors) {
  if (team) return colors.primary;
  return colors.surface;
}

function getCreateButtonTextColor(team: Team | null | undefined, colors: ThemeColors) {
  if (team) return "white";
  return colors.textMuted;
}

function getEditMinimumDate(status: GameWithTeams["status"]) {
  if (status === "scheduled" || status === "in_progress") return new Date();
  return undefined;
}

function getRequiredGameDateError(date: number | null) {
  if (date) return undefined;
  return "Data do jogo é obrigatória.";
}

function getEmptyGamesMessage(team: Team | null | undefined) {
  if (team) return "Cria o primeiro jogo da equipa para o veres aqui.";
  return "Cria ou associa uma equipa primeiro.";
}

function getGamesHeaderSubtitle(team: Team | null | undefined) {
  if (team) return `Gestão de jogos da equipa ${team.name}`;
  return "Cria a tua equipa para começar.";
}

function errorBorderStyle(colors: ThemeColors, error?: string) {
  if (!error) return undefined;
  return { borderColor: colors.danger, borderWidth: 1 } as const;
}

function inputStyle(colors: ThemeColors) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
  } as const;
}
