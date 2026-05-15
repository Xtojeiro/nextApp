import { api } from "@/utils/apiClient";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import EmptyState from "@/components/EmptyState";
import ErrorView from "@/components/ErrorView";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { optionalText, requiredText } from "@/utils/formValidation";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Athlete {
  _id: any;
  userId: any;
  user?: {
    _id: any;
    full_name: any;
    avatar?: any;
    email: any;
    bio?: any;
  };
  position?: any;
  height?: any;
  weight?: any;
  stats?: any;
  [key: string]: any;
}

export default function TreinadorEquipa() {
  const { colors } = useTheme();
  const { user, accountType } = useAuth();
  const router = useRouter();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const team = useQuery(
    api.teams.getTeam as any,
    user ? { sessionUserId: user.id as any } : "skip",
  );
  const athletes = useQuery(
    api.teams.getTeamAthletes as any,
    user ? { sessionUserId: user.id as any } : "skip",
  );
  const teamStats = useQuery(
    api.teams.getTeamStats as any,
    user ? { sessionUserId: user.id as any } : "skip",
  );

  const createTeam = useMutation(api.teams.createTeam as any);
  const removeAthlete = useMutation(api.teams.removeAthleteFromTeam as any);

  const handleCreateTeam = async () => {
    const validationError =
      requiredText(teamName, "Team name") ||
      optionalText(teamDescription, "Description");
    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }
    try {
      await createTeam({
        sessionUserId: user!.id as any,
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      setTeamName("");
      setTeamDescription("");
      setCreateModalVisible(false);
      Alert.alert("Success", "Team created successfully");
    } catch (error) {
      Alert.alert("Error", (error as Error).message || "Failed to create team");
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!team) return;
    Alert.alert(
      "Remove Athlete",
      "Are you sure you want to remove this athlete from the team?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeAthlete({
                sessionUserId: user!.id as any,
                teamId: team._id,
                athleteId,
              });
              Alert.alert("Success", "Athlete removed from team");
            } catch (error) {
              Alert.alert("Error", (error as Error).message || "Failed to remove athlete");
            }
          },
        },
      ]
    );
  };

  const renderAthlete = ({ item }: { item: Athlete }) => (
    <TouchableOpacity
      style={[styles.athleteCard, { backgroundColor: colors.surface }]}
      onPress={() => {
        setSelectedAthlete(item);
      }}
    >
      <Image
        source={{ uri: item.user?.avatar || "https://placehold.co/60x60" }}
        style={styles.athleteAvatar}
      />
      <View style={styles.athleteInfo}>
        <Text style={[styles.athleteName, { color: colors.text }]}>
          {item.user?.full_name || "Unknown"}
        </Text>
        <Text style={[styles.athletePosition, { color: colors.textMuted }]}>
          {item.position || "No position set"}
        </Text>
        {item.stats && (
          <View style={styles.athleteStats}>
            <Text style={[styles.athleteStatText, { color: colors.primary }]}>
              {item.stats.gamesPlayed} games
            </Text>
            <Text style={[styles.athleteStatText, { color: colors.textMuted }]}> | </Text>
            <Text style={[styles.athleteStatText, { color: colors.primary }]}>
              {item.stats.points} pts
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  if (!team && athletes === undefined) {
    return <LoadingSpinner />;
  }

  if (!team) {
    return (
      <LinearGradient colors={colors.gradients.background as any} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Minha Equipa</Text>
          </View>
          <EmptyState
            icon="people-outline"
            title="No Team Yet"
            subtitle="Create your team to start managing athletes."
            actionLabel="Create Team"
            onAction={() => setCreateModalVisible(true)}
          />
        </SafeAreaView>

        <Modal
          visible={createModalVisible}
          animationType="slide"
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <LinearGradient colors={colors.gradients.background as any} style={{ flex: 1 }}>
            <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Create Team</Text>
              <View />
            </View>
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Team Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholder="Enter team name"
                placeholderTextColor={colors.textMuted}
                value={teamName}
                onChangeText={setTeamName}
              />
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholder="Enter team description"
                placeholderTextColor={colors.textMuted}
                multiline
                value={teamDescription}
                onChangeText={setTeamDescription}
              />
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateTeam}
              >
                <Text style={styles.createButtonText}>Create Team</Text>
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Modal>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.background as any} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Minha Equipa</Text>
          <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={[styles.teamInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.teamHeader}>
              <View style={[styles.teamAvatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.teamAvatarText}>
                  {team.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.teamDetails}>
                <Text style={[styles.teamName, { color: colors.text }]}>{team.name}</Text>
                {team.description && (
                  <Text style={[styles.teamDescription, { color: colors.textMuted }]}>
                    {team.description}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {athletes?.length || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Atletas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {teamStats?.totalGames || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Jogos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {teamStats?.wins || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Vitórias</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.danger }]}>
                  {teamStats?.losses || 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Derrotas</Text>
              </View>
            </View>
          </View>

          <View style={styles.athletesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Atletas ({athletes?.length || 0})
            </Text>
            {athletes?.length === 0 ? (
              <View style={styles.emptyAthletes}>
                <Ionicons name="people-outline" size={40} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No athletes yet
                </Text>
              </View>
            ) : (
              <FlatList
                data={athletes}
                keyExtractor={(item) => item._id}
                renderItem={renderAthlete}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={!!selectedAthlete}
        animationType="slide"
        onRequestClose={() => setSelectedAthlete(null)}
      >
        <LinearGradient colors={colors.gradients.background as any} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setSelectedAthlete(null)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Athlete Profile</Text>
            <View />
          </View>
          {selectedAthlete && (
            <ScrollView style={{ flex: 1, padding: 20 }}>
              <View style={styles.profileHeader}>
                <Image
                  source={{ uri: selectedAthlete.user?.avatar || "https://placehold.co/100x100" }}
                  style={styles.profileAvatar}
                />
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {selectedAthlete.user?.full_name || "Unknown"}
                </Text>
                <Text style={[styles.profilePosition, { color: colors.textMuted }]}>
                  {selectedAthlete.position || "No position set"}
                </Text>
              </View>

              {selectedAthlete.stats && (
                <View style={[styles.profileStats, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.profileStatsTitle, { color: colors.text }]}>Statistics</Text>
                  <View style={styles.profileStatsRow}>
                    <View style={styles.profileStatItem}>
                      <Text style={[styles.profileStatValue, { color: colors.primary }]}>
                        {selectedAthlete.stats.gamesPlayed}
                      </Text>
                      <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>Games</Text>
                    </View>
                    <View style={styles.profileStatItem}>
                      <Text style={[styles.profileStatValue, { color: colors.primary }]}>
                        {selectedAthlete.stats.points}
                      </Text>
                      <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>Points</Text>
                    </View>
                    <View style={styles.profileStatItem}>
                      <Text style={[styles.profileStatValue, { color: colors.primary }]}>
                        {selectedAthlete.stats.assists}
                      </Text>
                      <Text style={[styles.profileStatLabel, { color: colors.textMuted }]}>Assists</Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.danger }]}
                onPress={() => {
                  handleRemoveAthlete(selectedAthlete.user?._id || "");
                  setSelectedAthlete(null);
                }}
              >
                <Ionicons name="person-remove" size={20} color={colors.surface} />
                <Text style={[styles.removeButtonText, { color: colors.surface }]}>
                  Remove from Team
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  teamInfo: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    elevation: 3,
  },
  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  teamAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  teamAvatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  teamDetails: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  teamDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(128,128,128,0.2)",
  },
  athletesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  athleteCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  athleteAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  athleteInfo: {
    flex: 1,
    marginLeft: 12,
  },
  athleteName: {
    fontSize: 16,
    fontWeight: "600",
  },
  athletePosition: {
    fontSize: 13,
    marginTop: 2,
  },
  athleteStats: {
    flexDirection: "row",
    marginTop: 4,
  },
  athleteStatText: {
    fontSize: 12,
  },
  emptyAthletes: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  createButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profilePosition: {
    fontSize: 16,
    marginTop: 4,
  },
  profileStats: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  profileStatsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  profileStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  profileStatItem: {
    alignItems: "center",
  },
  profileStatValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
