import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Game = {
  _id: string;
  opponent: string;
  location: string;
  date: string;
  time: string;
  home_or_away: "home" | "away";
  result_scored?: number;
  result_conceded?: number;
  minutes_played?: number;
  position?: string;
  goals?: number;
  assists?: number;
  analysis?: string;
  notes?: string;
  status: "upcoming" | "completed";
};

export default function Jogos() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const convexUser = useQuery(api.users.getCurrentUser);

  // Only show for PLAYER role
  if (convexUser?.role !== "PLAYER") {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginTop: 16 }}>
            Acesso Restrito
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
            Apenas jogadores podem aceder à gestão de jogos
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }
  
  const games = useQuery(api.games.getGames) || [];
  const createGameMutation = useMutation(api.games.createGame);
  const updateGameMutation = useMutation(api.games.updateGame);
  const deleteGameMutation = useMutation(api.games.deleteGame);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  const [createFormData, setCreateFormData] = useState({
    opponent: "",
    location: "",
    date: "",
    time: "",
    home_or_away: "home" as "home" | "away",
  });

  const [updateFormData, setUpdateFormData] = useState({
    result_scored: "",
    result_conceded: "",
    minutes_played: "",
    position: "",
    goals: "",
    assists: "",
    analysis: "",
    notes: "",
  });

  const upcomingGames = games.filter(game => game.status === "upcoming");
  const completedGames = games.filter(game => game.status === "completed");

  const handleCreateGame = async () => {
    try {
      if (!createFormData.opponent || !createFormData.location || !createFormData.date || !createFormData.time) {
        Alert.alert("Erro", "Preencha todos os campos obrigatórios");
        return;
      }

      await createGameMutation({
        opponent: createFormData.opponent,
        location: createFormData.location,
        date: createFormData.date,
        time: createFormData.time,
        home_or_away: createFormData.home_or_away,
      });

      setShowCreateForm(false);
      setCreateFormData({
        opponent: "",
        location: "",
        date: "",
        time: "",
        home_or_away: "home",
      });
      Alert.alert("Sucesso", "Jogo criado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar jogo");
    }
  };

  const handleUpdateGame = async () => {
    if (!selectedGame) return;
    
    try {
      const updateData: any = {};
      if (updateFormData.result_scored) updateData.result_scored = parseInt(updateFormData.result_scored);
      if (updateFormData.result_conceded) updateData.result_conceded = parseInt(updateFormData.result_conceded);
      if (updateFormData.minutes_played) updateData.minutes_played = parseInt(updateFormData.minutes_played);
      if (updateFormData.position) updateData.position = updateFormData.position;
      if (updateFormData.goals) updateData.goals = parseInt(updateFormData.goals);
      if (updateFormData.assists) updateData.assists = parseInt(updateFormData.assists);
      if (updateFormData.analysis) updateData.analysis = updateFormData.analysis;
      if (updateFormData.notes) updateData.notes = updateFormData.notes;

      await updateGameMutation({
        gameId: selectedGame._id as any,
        ...updateData,
      });

      setShowUpdateForm(false);
      setSelectedGame(null);
      setUpdateFormData({
        result_scored: "",
        result_conceded: "",
        minutes_played: "",
        position: "",
        goals: "",
        assists: "",
        analysis: "",
        notes: "",
      });
      Alert.alert("Sucesso", "Jogo atualizado com sucesso!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar jogo");
    }
  };

  const handleDeleteGame = async (game: Game) => {
    Alert.alert(
      "Confirmar Eliminação",
      `Tem a certeza que quer eliminar o jogo vs ${game.opponent}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGameMutation({ gameId: game._id as any });
              Alert.alert("Sucesso", "Jogo eliminado com sucesso!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao eliminar jogo");
            }
          },
        },
      ]
    );
  };

  const renderGameCard = ({ item }: { item: Game }) => (
    <View
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
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
            {item.home_or_away === "home" ? "🏠" : "✈️"} vs {item.opponent}
          </Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>
            📍 {item.location}
          </Text>
          <Text style={{ color: colors.text, marginTop: 2 }}>
            📅 {item.date} ⏰ {item.time}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: item.status === "completed" ? colors.success : colors.warning,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 12 }}>
            {item.status === "completed" ? "Concluído" : "Por jogar"}
          </Text>
        </View>
      </View>

      {item.status === "completed" && (
        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ color: colors.text, fontWeight: "bold" }}>
            Resultado: {item.result_scored} - {item.result_conceded}
          </Text>
          {item.minutes_played && (
            <Text style={{ color: colors.text }}>Minutos jogados: {item.minutes_played}</Text>
          )}
          {item.position && (
            <Text style={{ color: colors.text }}>Posição: {item.position}</Text>
          )}
          {(item.goals !== undefined || item.assists !== undefined) && (
            <Text style={{ color: colors.text }}>
              Golos: {item.goals || 0} | Assistências: {item.assists || 0}
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: item.status === "upcoming" ? colors.primary : colors.success,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => {
            setSelectedGame(item);
            setShowUpdateForm(true);
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            {item.status === "upcoming" ? "Registrar Resultado" : "Editar"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: colors.danger,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={() => handleDeleteGame(item)}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showCreateForm) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 20,
            }}
          >
            Novo Jogo
          </Text>

          <TextInput
            placeholder="Adversário"
            value={createFormData.opponent}
            onChangeText={(text) =>
              setCreateFormData({ ...createFormData, opponent: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 16,
            }}
          />

          <TextInput
            placeholder="Localização"
            value={createFormData.location}
            onChangeText={(text) =>
              setCreateFormData({ ...createFormData, location: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 16,
            }}
          />

          <TextInput
            placeholder="Data (AAAA-MM-DD)"
            value={createFormData.date}
            onChangeText={(text) =>
              setCreateFormData({ ...createFormData, date: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 16,
            }}
          />

          <TextInput
            placeholder="Hora (HH:MM)"
            value={createFormData.time}
            onChangeText={(text) =>
              setCreateFormData({ ...createFormData, time: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 16,
            }}
          />

          <Text style={{ color: colors.text, marginBottom: 8 }}>Tipo de jogo</Text>
          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor:
                  createFormData.home_or_away === "home"
                    ? colors.primary
                    : colors.surface,
                padding: 12,
                borderRadius: 8,
                marginRight: 8,
                flex: 1,
              }}
              onPress={() => setCreateFormData({ ...createFormData, home_or_away: "home" })}
            >
              <Text
                style={{
                  color: createFormData.home_or_away === "home" ? "white" : colors.text,
                  textAlign: "center",
                }}
              >
                🏠 Casa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor:
                  createFormData.home_or_away === "away"
                    ? colors.primary
                    : colors.surface,
                padding: 12,
                borderRadius: 8,
                flex: 1,
              }}
              onPress={() => setCreateFormData({ ...createFormData, home_or_away: "away" })}
            >
              <Text
                style={{
                  color: createFormData.home_or_away === "away" ? "white" : colors.text,
                  textAlign: "center",
                }}
              >
                ✈️ Fora
              </Text>
            </TouchableOpacity>
          </View>

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
              onPress={() => setShowCreateForm(false)}
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
              onPress={handleCreateGame}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                Criar
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (showUpdateForm && selectedGame) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 20,
            }}
          >
            {selectedGame.status === "upcoming" ? "Registrar Resultado" : "Editar Jogo"}
          </Text>

          <Text style={{ fontSize: 18, color: colors.text, marginBottom: 4 }}>
            vs {selectedGame.opponent}
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 20 }}>
            {selectedGame.date} • {selectedGame.time} • {selectedGame.location}
          </Text>

          {selectedGame.status === "upcoming" ? (
            <>
              <Text style={{ color: colors.text, marginBottom: 8 }}>Resultado</Text>
              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                <TextInput
                  placeholder="Golos Marcados"
                  value={updateFormData.result_scored}
                  onChangeText={(text) =>
                    setUpdateFormData({ ...updateFormData, result_scored: text })
                  }
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.text,
                    flex: 1,
                    marginRight: 8,
                    textAlign: "center",
                  }}
                  keyboardType="numeric"
                />
                <Text style={{ alignSelf: "center", fontSize: 24, color: colors.text }}>-</Text>
                <TextInput
                  placeholder="Golos Sofridos"
                  value={updateFormData.result_conceded}
                  onChangeText={(text) =>
                    setUpdateFormData({ ...updateFormData, result_conceded: text })
                  }
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.text,
                    flex: 1,
                    marginLeft: 8,
                    textAlign: "center",
                  }}
                  keyboardType="numeric"
                />
              </View>

              <TextInput
                placeholder="Minutos jogados"
                value={updateFormData.minutes_played}
                onChangeText={(text) =>
                  setUpdateFormData({ ...updateFormData, minutes_played: text })
                }
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
                keyboardType="numeric"
              />

              <TextInput
                placeholder="Posição em que jogou"
                value={updateFormData.position}
                onChangeText={(text) =>
                  setUpdateFormData({ ...updateFormData, position: text })
                }
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
              />

              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                <TextInput
                  placeholder="Golos"
                  value={updateFormData.goals}
                  onChangeText={(text) =>
                    setUpdateFormData({ ...updateFormData, goals: text })
                  }
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.text,
                    flex: 1,
                    marginRight: 8,
                  }}
                  keyboardType="numeric"
                />
                <TextInput
                  placeholder="Assistências"
                  value={updateFormData.assists}
                  onChangeText={(text) =>
                    setUpdateFormData({ ...updateFormData, assists: text })
                  }
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.text,
                    flex: 1,
                    marginLeft: 8,
                  }}
                  keyboardType="numeric"
                />
              </View>
            </>
          ) : (
            <>
              <TextInput
                placeholder="Minutos jogados"
                value={selectedGame.minutes_played?.toString() || ""}
                editable={false}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
              />
              <TextInput
                placeholder="Posição"
                value={selectedGame.position || ""}
                editable={false}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
              />
            </>
          )}

          <TextInput
            placeholder="Análise do desempenho"
            value={updateFormData.analysis}
            onChangeText={(text) =>
              setUpdateFormData({ ...updateFormData, analysis: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 16,
              height: 80,
            }}
            multiline
          />

          <TextInput
            placeholder="Notas adicionais"
            value={updateFormData.notes}
            onChangeText={(text) =>
              setUpdateFormData({ ...updateFormData, notes: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 20,
              height: 80,
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
              onPress={() => {
                setShowUpdateForm(false);
                setSelectedGame(null);
                setUpdateFormData({
                  result_scored: "",
                  result_conceded: "",
                  minutes_played: "",
                  position: "",
                  goals: "",
                  assists: "",
                  analysis: "",
                  notes: "",
                });
              }}
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
              onPress={handleUpdateGame}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                {selectedGame.status === "upcoming" ? "Registrar" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 10 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}
            >
              Jogos
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={() => setShowCreateForm(true)}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>+ Novo Jogo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Games List */}
        <FlatList
          data={[...upcomingGames, ...completedGames]}
          keyExtractor={(item) => item._id}
          renderItem={renderGameCard}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>
                Nenhum jogo encontrado
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                  marginTop: 16,
                }}
                onPress={() => setShowCreateForm(true)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Criar Primeiro Jogo
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}