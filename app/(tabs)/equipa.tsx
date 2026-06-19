import { api } from "@/utils/apiClient";
import type { Id } from "@/utils/apiTypes";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { requiredText } from "@/utils/formValidation";
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

type TeamAthleteView = {
  _id: string;
  position?: string;
  user?: {
    _id: Id<"users">;
    full_name?: string;
    email?: string;
    bio?: string;
  } | null;
};

type AthleteSearchResult = {
  athleteId: Id<"users">;
  full_name?: string;
  email?: string;
  bio?: string;
  position?: string;
  inviteStatus?: "pending" | "accepted" | "rejected";
};

type CoachInviteView = {
  _id: Id<"invites">;
  status: "pending" | "accepted" | "rejected";
  athlete?: {
    _id: Id<"users">;
    full_name?: string;
    avatar?: string;
  } | null;
};

type TeamView = {
  _id: Id<"teams">;
  name: string;
  description?: string;
  coachId: Id<"users">;
};

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
  const athletes = (athletesQuery ?? []) as TeamAthleteView[];
  const addAthleteNote = useMutation(api.users.addAthleteNote);
  const createInvite = useMutation(api.invites.createInvite);
  const createTeam = useMutation(api.teams.createTeam);
  const associateCoachToTeam = useMutation(api.teams.associateCoachToTeam);
  const allTeams = (useQuery(api.teams.listTeams, {}) ?? []) as TeamView[];
  const coachInvites = (useQuery(
    api.invites.getPendingInvites,
    convexUser ? { sessionUserId: convexUser._id } : "skip",
  ) ?? []) as CoachInviteView[];

  const [search, setSearch] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<TeamAthleteView | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [note, setNote] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [sendingInviteId, setSendingInviteId] = useState<string | null>(null);
  const [associatingTeamId, setAssociatingTeamId] = useState<string | null>(null);

  const athleteSearchResults = (useQuery(
    api.teams.searchAvailableAthletes,
    convexUser && team && inviteSearch.trim().length >= 2
      ? {
          sessionUserId: convexUser._id,
          teamId: team._id,
          query: inviteSearch.trim(),
          limit: 20,
        }
      : "skip",
  ) ?? []) as AthleteSearchResult[];
  const mainSearchAvailableResults = (useQuery(
    api.teams.searchAvailableAthletes,
    convexUser && team && search.trim().length >= 2
      ? {
          sessionUserId: convexUser._id,
          teamId: team._id,
          query: search.trim(),
          limit: 20,
        }
      : "skip",
  ) ?? []) as AthleteSearchResult[];

  const filteredAthletes = athletes.filter((athlete) => {
    const query = normalizeSearch(search);
    if (!query) return true;
    const searchable = normalizeSearch(
      [
        athlete.user?.full_name,
        athlete.user?.email,
        athlete.user?.bio,
        athlete.position,
      ]
        .filter(Boolean)
        .join(" "),
    );
    return searchable.includes(query);
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

  const openNoteModal = (athlete: TeamAthleteView) => {
    setSelectedAthlete(athlete);
    setNote("");
    setShowNoteModal(true);
  };

  const openInviteModal = () => {
    setInviteSearch("");
    setShowInviteModal(true);
  };

  const handleAssociateTeam = (nextTeam: TeamView) => {
    if (!convexUser) return;

    const runAssociation = async () => {
      setAssociatingTeamId(nextTeam._id);
      try {
        await associateCoachToTeam({
          sessionUserId: convexUser._id,
          teamId: nextTeam._id,
        });
        setShowAssociateModal(false);
        Alert.alert("Equipa associada", `Ficaste associado à equipa ${nextTeam.name}.`);
      } catch (error) {
        Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao associar equipa.");
      } finally {
        setAssociatingTeamId(null);
      }
    };

    if (nextTeam.coachId && nextTeam.coachId !== convexUser._id) {
      Alert.alert(
        "Associar equipa",
        "Esta equipa já tem outro treinador. Ao continuares, a equipa passa a ficar associada à tua conta.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Associar", onPress: runAssociation },
        ],
      );
      return;
    }

    void runAssociation();
  };

  const handleCreateAndAssociateTeam = async () => {
    if (!convexUser) return;
    const nameError = requiredText(newTeamName, "Nome da equipa", 80);
    if (nameError) {
      Alert.alert("Erro", nameError);
      return;
    }

    setCreatingTeam(true);
    try {
      await createTeam({
        sessionUserId: convexUser._id,
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
      });
      setNewTeamName("");
      setNewTeamDescription("");
      setShowAssociateModal(false);
      Alert.alert("Equipa criada", "A nova equipa foi criada e associada à tua conta.");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao criar equipa.");
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleSendInvite = async (athlete: AthleteSearchResult) => {
    if (!convexUser) return;
    setSendingInviteId(athlete.athleteId);
    try {
      await createInvite({
        sessionUserId: convexUser._id,
        athleteId: athlete.athleteId,
        message: `Convite para entrares na equipa ${team?.name || ""}`.trim(),
      });
      Alert.alert("Convite enviado", "O jogador recebeu o convite para se juntar à equipa.");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao enviar convite.");
    } finally {
      setSendingInviteId(null);
    }
  };

  const handleSaveNote = async () => {
    const validationError = requiredText(note, "Nota", 500);
    if (!convexUser || !selectedAthlete?.user?._id || validationError) {
      Alert.alert("Erro", validationError || "Seleciona um atleta antes de guardar.");
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

  const renderAthleteCard = ({ item }: { item: TeamAthleteView }) => (
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

  const renderAvailableAthleteCard = (item: AthleteSearchResult) => {
    const isPending = item.inviteStatus === "pending";
    const isSending = sendingInviteId === item.athleteId;

    return (
      <View
        key={item.athleteId}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
          {item.full_name || "Atleta"}
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          {item.position || "Sem posição definida"}
        </Text>
        <Text style={{ color: colors.textMuted, marginTop: 2 }}>
          {item.email || "Sem email"}
        </Text>
        <TouchableOpacity
          disabled={isPending || isSending}
          style={{
            backgroundColor: isPending ? colors.surface : colors.primary,
            borderColor: isPending ? colors.border : colors.primary,
            borderWidth: 1,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 12,
          }}
          onPress={() => handleSendInvite(item)}
        >
          <Text style={{ color: isPending ? colors.textMuted : "white", fontWeight: "700" }}>
            {isPending ? "Convite pendente" : isSending ? "A enviar..." : "Enviar convite"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            Equipa
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            {team ? `${team.name} • ${athletes.length} atletas` : "Sem equipa associada."}
          </Text>
            </View>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.success,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={() => setShowAssociateModal(true)}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Associar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!team}
                style={{
                  backgroundColor: team ? colors.primary : colors.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                onPress={openInviteModal}
              >
                <Text style={{ color: team ? "white" : colors.textMuted, fontWeight: "700" }}>
                  Convidar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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

          {coachInvites.length > 0 ? (
            <View style={{ marginTop: 12, gap: 6 }}>
              <Text style={{ color: colors.text, fontWeight: "700" }}>Convites enviados</Text>
              {coachInvites.slice(0, 4).map((invite) => (
                <View
                  key={invite._id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 10,
                    padding: 10,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
                    {invite.athlete?.full_name || "Atleta"}
                  </Text>
                  <Text style={{ color: getInviteStatusColor(invite.status, colors), fontWeight: "700" }}>
                    {getInviteStatusLabel(invite.status)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <FlatList
          data={filteredAthletes}
          keyExtractor={(item) => item._id}
          renderItem={renderAthleteCard}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          ListFooterComponent={
            search.trim().length >= 2 && mainSearchAvailableResults.length > 0 ? (
              <View style={{ marginTop: filteredAthletes.length > 0 ? 12 : 0 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
                  Jogadores disponíveis
                </Text>
                {mainSearchAvailableResults.map(renderAvailableAthleteCard)}
              </View>
            ) : null
          }
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
                {search.trim().length >= 2 ? "Nenhum atleta na equipa" : "Nenhum atleta encontrado"}
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
          visible={showAssociateModal}
          animationType="slide"
          onRequestClose={() => setShowAssociateModal(false)}
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
                <TouchableOpacity onPress={() => setShowAssociateModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  Associar equipa
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700", marginBottom: 10 }}>
                  Criar nova equipa
                </Text>
                <TextInput
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  placeholder="Nome da equipa"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    backgroundColor: colors.backgrounds.editInput,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    marginBottom: 10,
                  }}
                />
                <TextInput
                  value={newTeamDescription}
                  onChangeText={setNewTeamDescription}
                  placeholder="Descrição opcional"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={{
                    backgroundColor: colors.backgrounds.editInput,
                    borderRadius: 12,
                    padding: 14,
                    color: colors.text,
                    minHeight: 80,
                    textAlignVertical: "top",
                    marginBottom: 12,
                  }}
                />
                <TouchableOpacity
                  disabled={creatingTeam}
                  style={{
                    backgroundColor: colors.success,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={handleCreateAndAssociateTeam}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    {creatingTeam ? "A criar..." : "Criar e associar"}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={allTeams}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      padding: 24,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="people-outline" size={42} color={colors.textMuted} />
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 12 }}>
                      Sem equipas
                    </Text>
                    <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                      Ainda não existem equipas para associar.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isCurrent = team?._id === item._id;
                  const isAssociating = associatingTeamId === item._id;

                  return (
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                        {item.description || "Sem descrição"}
                      </Text>
                      <TouchableOpacity
                        disabled={isCurrent || isAssociating}
                        style={{
                          backgroundColor: isCurrent ? colors.surface : colors.primary,
                          borderColor: isCurrent ? colors.border : colors.primary,
                          borderWidth: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: "center",
                          marginTop: 12,
                        }}
                        onPress={() => handleAssociateTeam(item)}
                      >
                        <Text style={{ color: isCurrent ? colors.textMuted : "white", fontWeight: "700" }}>
                          {isCurrent ? "Equipa atual" : isAssociating ? "A associar..." : "Associar-me"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </SafeAreaView>
          </LinearGradient>
        </Modal>

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

        <Modal
          visible={showInviteModal}
          animationType="slide"
          onRequestClose={() => setShowInviteModal(false)}
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
                <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  Convidar jogador
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <TextInput
                value={inviteSearch}
                onChangeText={setInviteSearch}
                placeholder="Pesquisar jogador por nome, email ou posição"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  color: colors.text,
                  marginBottom: 16,
                }}
              />

              <FlatList
                data={athleteSearchResults}
                keyExtractor={(item) => item.athleteId}
                contentContainerStyle={{ paddingBottom: 24 }}
                ListEmptyComponent={
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      padding: 24,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="search-outline" size={42} color={colors.textMuted} />
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 12 }}>
                      Sem jogadores
                    </Text>
                    <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                      Escreve pelo menos 2 caracteres para procurar jogadores públicos.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isPending = item.inviteStatus === "pending";
                  const isSending = sendingInviteId === item.athleteId;
                  return (
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>
                        {item.full_name || "Atleta"}
                      </Text>
                      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                        {item.position || "Sem posição definida"}
                      </Text>
                      <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                        {item.email || "Sem email"}
                      </Text>
                      <TouchableOpacity
                        disabled={isPending || isSending}
                        style={{
                          backgroundColor: isPending ? colors.surface : colors.primary,
                          borderColor: isPending ? colors.border : colors.primary,
                          borderWidth: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: "center",
                          marginTop: 12,
                        }}
                        onPress={() => handleSendInvite(item)}
                      >
                        <Text style={{ color: isPending ? colors.textMuted : "white", fontWeight: "700" }}>
                          {isPending ? "Convite pendente" : isSending ? "A enviar..." : "Enviar convite"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function getInviteStatusLabel(status: CoachInviteView["status"]) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "accepted":
      return "Aceite";
    case "rejected":
      return "Rejeitado";
  }
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getInviteStatusColor(
  status: CoachInviteView["status"],
  colors: ReturnType<typeof useTheme>["colors"],
) {
  switch (status) {
    case "pending":
      return colors.warning;
    case "accepted":
      return colors.success;
    case "rejected":
      return colors.danger;
  }
}
