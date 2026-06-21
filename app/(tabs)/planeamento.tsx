import { api } from "@/utils/apiClient";
import { getSimpleErrorMessage } from "@/utils/errorMessages";
import type { Doc, Id } from "@/utils/apiTypes";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { optionalText, positiveInteger, requiredText } from "@/utils/formValidation";
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

type TrainingPlan = Doc<"trainingPlans">;

const emptyPlanForm = {
  name: "",
  description: "",
  duration: "",
  difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
  goals: "",
};

export default function Planeamento() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { sessionUserId: user.id as Id<"users"> } : "skip",
  );
  const trainingPlans =
    useQuery(
      api.trainingPlans.getMyTrainingPlans,
      convexUser ? { sessionUserId: convexUser._id } : "skip",
    ) || [];

  const createPlan = useMutation(api.trainingPlans.createTrainingPlan);
  const updatePlan = useMutation(api.trainingPlans.updateTrainingPlan);
  const deletePlan = useMutation(api.trainingPlans.deleteTrainingPlan);

  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [form, setForm] = useState(emptyPlanForm);

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
            O planeamento de treinos está disponível apenas para treinadores.
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const resetModal = () => {
    setShowModal(false);
    setSelectedPlan(null);
    setForm(emptyPlanForm);
  };

  const openCreateModal = () => {
    setSelectedPlan(null);
    setForm(emptyPlanForm);
    setShowModal(true);
  };

  const openEditModal = (plan: TrainingPlan) => {
    setSelectedPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || "",
      duration: plan.duration.toString(),
      difficulty: plan.difficulty,
      goals: (plan.goals || []).join(", "),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.duration) {
      Alert.alert("Erro", "O nome e a duração são obrigatórios.");
      return;
    }

    const duration = Number(form.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      Alert.alert("Erro", "A duração tem de ser um número válido.");
      return;
    }

    const validationError =
      requiredText(form.name, "Nome") ||
      positiveInteger(form.duration, "Duração", true) ||
      optionalText(form.description, "Descrição") ||
      optionalText(form.goals, "Objetivos");
    if (validationError) {
      Alert.alert("Erro", validationError);
      return;
    }

    const goals = form.goals
      .split(",")
      .map((goal) => goal.trim())
      .filter(Boolean);

    try {
      if (selectedPlan) {
        await updatePlan({
          sessionUserId: convexUser._id,
          id: selectedPlan._id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          duration,
          difficulty: form.difficulty,
          goals,
        });
      } else {
        await createPlan({
          sessionUserId: convexUser._id,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          duration,
          difficulty: form.difficulty,
          goals,
        });
      }
      resetModal();
      Alert.alert("Sucesso", selectedPlan ? "Plano atualizado." : "Plano criado.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao guardar plano."));
    }
  };

  const handleDelete = (plan: TrainingPlan) => {
    Alert.alert("Eliminar plano", `Queres remover "${plan.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePlan({
              sessionUserId: convexUser._id,
              id: plan._id,
            });
            if (selectedPlan?._id === plan._id) {
              resetModal();
            }
            Alert.alert("Sucesso", "Plano eliminado.");
          } catch (error) {
            Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao eliminar plano."));
          }
        },
      },
    ]);
  };

  const getDifficultyLabel = (difficulty: TrainingPlan["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return "Iniciante";
      case "intermediate":
        return "Intermédio";
      case "advanced":
        return "Avançado";
    }
  };


  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
                Planeamento
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                Planos de treino ativos criados para a equipa.
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
              }}
              onPress={openCreateModal}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>+ Plano</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={trainingPlans}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                    {item.duration} min • {getDifficultyLabel(item.difficulty)}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: item.isActive ? colors.success : colors.textMuted,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                    {item.isActive ? "Ativo" : "Inativo"}
                  </Text>
                </View>
              </View>

              {item.description ? (
                <Text style={{ color: colors.text, marginBottom: 10 }}>{item.description}</Text>
              ) : null}

              {item.goals?.length ? (
                <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
                  Objetivos: {item.goals.join(", ")}
                </Text>
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
                  onPress={() => handleDelete(item)}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
              <Ionicons name="calendar-outline" size={42} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 12 }}>
                Ainda não existem planos
              </Text>
              <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                Cria o primeiro plano com nome, dificuldade e objetivos.
              </Text>
            </View>
          }
        />

        <Modal visible={showModal} animationType="slide" onRequestClose={resetModal}>
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
                <TouchableOpacity onPress={resetModal}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  {selectedPlan ? "Editar plano" : "Novo plano"}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView>
                <TextInput
                  value={form.name}
                  onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
                  placeholder="Nome"
                  placeholderTextColor={colors.textMuted}
                  style={modalInputStyle(colors)}
                />
                <TextInput
                  value={form.description}
                  onChangeText={(text) => setForm((current) => ({ ...current, description: text }))}
                  placeholder="Descrição"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={[modalInputStyle(colors), { height: 100, textAlignVertical: "top" }]}
                />
                <TextInput
                  value={form.duration}
                  onChangeText={(text) => setForm((current) => ({ ...current, duration: text }))}
                  placeholder="Duração em minutos"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={modalInputStyle(colors)}
                />
                <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "600" }}>
                  Dificuldade
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                  {(["beginner", "intermediate", "advanced"] as const).map((difficulty) => (
                    <TouchableOpacity
                      key={difficulty}
                      style={{
                        flex: 1,
                        backgroundColor:
                          form.difficulty === difficulty ? colors.primary : colors.surface,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                      onPress={() => setForm((current) => ({ ...current, difficulty }))}
                    >
                      <Text
                        style={{
                          color: form.difficulty === difficulty ? "white" : colors.text,
                          fontWeight: "600",
                        }}
                      >
                        {getDifficultyLabel(difficulty)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={form.goals}
                  onChangeText={(text) => setForm((current) => ({ ...current, goals: text }))}
                  placeholder="Objetivos separados por vírgulas"
                  placeholderTextColor={colors.textMuted}
                  style={modalInputStyle(colors)}
                />

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                  }}
                  onPress={handleSave}
                >
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                    Guardar
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

function modalInputStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
  } as const;
}
