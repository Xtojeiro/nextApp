import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
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

type Exercise = {
  name: string;
  description?: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  weight_kg?: number;
};

type TrainingPlan = {
  _id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  duration_minutes: number;
  target_athlete_ids: string[];
  scheduled_date?: string;
  status: "draft" | "scheduled" | "completed";
  created_at: number;
};

export default function Planeamento() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const convexUser = useQuery(api.users.getCurrentUser);

  // Different queries based on role
  const trainingPlans = useQuery(api.trainingPlans.getTrainingPlans) || [];
  const teamAthletes = useQuery(api.users.getTeamAthletes) || [];
  const planStats = useQuery(api.trainingPlans.getTrainingPlanStats) || {
    totalPlans: 0,
    draftPlans: 0,
    scheduledPlans: 0,
    completedPlans: 0,
  };

  const createPlanMutation = useMutation(api.trainingPlans.createTrainingPlan);
  const updatePlanMutation = useMutation(api.trainingPlans.updateTrainingPlan);
  const deletePlanMutation = useMutation(api.trainingPlans.deleteTrainingPlan);
  const assignPlanMutation = useMutation(api.trainingPlans.assignPlanToAthletes);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: "",
    exercises: [] as Exercise[],
  });

  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");

  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    name: "",
    description: "",
    sets: 0,
    reps: 0,
    duration_seconds: 0,
    rest_seconds: 60,
    weight_kg: 0,
  });

  const handleCreatePlan = async () => {
    try {
      if (!formData.title || !formData.description || !formData.duration_minutes) {
        Alert.alert("Erro", "Preencha todos os campos obrigatórios");
        return;
      }

      await createPlanMutation({
        title: formData.title,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes),
        exercises: formData.exercises,
      });

      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        duration_minutes: "",
        exercises: [],
      });
      Alert.alert("Sucesso", "Plano de treino criado!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao criar plano");
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      await updatePlanMutation({
        planId: selectedPlan._id as any,
        title: formData.title,
        description: formData.description,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        exercises: formData.exercises,
      });

      setShowEditModal(false);
      setSelectedPlan(null);
      Alert.alert("Sucesso", "Plano atualizado!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao atualizar plano");
    }
  };

  const handleDeletePlan = (plan: TrainingPlan) => {
    Alert.alert(
      "Confirmar Eliminação",
      `Tem certeza que quer eliminar "${plan.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePlanMutation({ planId: plan._id as any });
              Alert.alert("Sucesso", "Plano eliminado!");
            } catch (error) {
              Alert.alert("Erro", "Falha ao eliminar plano");
            }
          },
        },
      ]
    );
  };

  const handleAssignPlan = async () => {
    if (!selectedPlan || selectedAthletes.length === 0 || !scheduledDate) {
      Alert.alert("Erro", "Selecione atletas e data");
      return;
    }

    try {
      await assignPlanMutation({
        planId: selectedPlan._id as any,
        athleteIds: selectedAthletes,
        scheduledDate,
      });

      setShowAssignModal(false);
      setSelectedPlan(null);
      setSelectedAthletes([]);
      setScheduledDate("");
      Alert.alert("Sucesso", "Plano atribuído aos atletas!");
    } catch (error) {
      Alert.alert("Erro", "Falha ao atribuir plano");
    }
  };

  const addExercise = () => {
    if (currentExercise.name.trim()) {
      setFormData({
        ...formData,
        exercises: [...formData.exercises, { ...currentExercise }],
      });
      setCurrentExercise({
        name: "",
        description: "",
        sets: 0,
        reps: 0,
        duration_seconds: 0,
        rest_seconds: 60,
        weight_kg: 0,
      });
    }
  };

  const removeExercise = (index: number) => {
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return colors.warning;
      case "scheduled": return colors.primary;
      case "completed": return colors.success;
      default: return colors.text;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft": return "Rascunho";
      case "scheduled": return "Agendado";
      case "completed": return "Concluído";
      default: return status;
    }
  };

  // Show loading if no user
  if (!convexUser) {
    return null;
  }

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
            Apenas treinadores podem aceder ao planeamento de treinos
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: colors.text,
                }}
              >
                Planeamento de Treinos
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>+ Novo Plano</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.textMuted }}>
              {planStats.totalPlans} planos • {planStats.scheduledPlans} agendados
            </Text>
          </View>

          {/* Stats Cards */}
          <View style={{ flexDirection: "row", marginBottom: 24 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}>
                  {planStats.totalPlans}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Total</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.warning, fontSize: 20, fontWeight: "bold" }}>
                  {planStats.draftPlans}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Rascunhos</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "bold" }}>
                  {planStats.scheduledPlans}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Agendados</Text>
              </View>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.success, fontSize: 20, fontWeight: "bold" }}>
                  {planStats.completedPlans}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>Concluídos</Text>
              </View>
            </View>
          </View>

          {/* Plans List */}
          <FlatList
            data={trainingPlans}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                      {item.title}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
                      {item.duration_minutes} min • {item.exercises.length} exercícios
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

                <Text style={{ color: colors.text, marginBottom: 8 }}>
                  {item.description}
                </Text>

                {item.scheduled_date && (
                  <Text style={{ color: colors.primary, fontSize: 12, marginBottom: 8 }}>
                    Agendado para: {item.scheduled_date}
                  </Text>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                    }}
                    onPress={() => {
                      setSelectedPlan(item);
                      setShowAssignModal(true);
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                      Atribuir
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.success,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      marginHorizontal: 4,
                    }}
                    onPress={() => {
                      setSelectedPlan(item);
                      setFormData({
                        title: item.title,
                        description: item.description,
                        duration_minutes: item.duration_minutes.toString(),
                        exercises: item.exercises,
                      });
                      setShowEditModal(true);
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                      Editar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.danger,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                    }}
                    onPress={() => handleDeletePlan(item)}
                  >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>
                      Eliminar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </ScrollView>

        {/* Create/Edit Modal */}
        <Modal visible={showCreateModal || showEditModal} animationType="slide">
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
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setFormData({
                      title: "",
                      description: "",
                      duration_minutes: "",
                      exercises: [],
                    });
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                  {showCreateModal ? "Novo Plano" : "Editar Plano"}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  placeholder="Título do Plano"
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.text,
                    marginBottom: 16,
                  }}
                />

                <TextInput
                  placeholder="Descrição"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
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
                  placeholder="Duração (minutos)"
                  value={formData.duration_minutes}
                  onChangeText={(text) => setFormData({ ...formData, duration_minutes: text })}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: colors.text,
                    marginBottom: 16,
                  }}
                />

                {/* Exercises */}
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>
                  Exercícios
                </Text>

                {formData.exercises.map((exercise, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Text style={{ color: colors.text, fontWeight: "bold" }}>
                        {exercise.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeExercise(index)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="trash" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      {exercise.sets} séries × {exercise.reps} reps
                      {exercise.weight_kg && ` • ${exercise.weight_kg}kg`}
                      {exercise.duration_seconds && ` • ${exercise.duration_seconds}s`}
                      {exercise.rest_seconds && ` • ${exercise.rest_seconds}s descanso`}
                    </Text>
                  </View>
                ))}

                {/* Add Exercise Form */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 8 }}>
                    Adicionar Exercício
                  </Text>

                  <TextInput
                    placeholder="Nome do exercício"
                    value={currentExercise.name}
                    onChangeText={(text) =>
                      setCurrentExercise({ ...currentExercise, name: text })
                    }
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 4,
                      padding: 8,
                      color: colors.text,
                      marginBottom: 8,
                    }}
                  />

                  <View style={{ flexDirection: "row", marginBottom: 8 }}>
                    <TextInput
                      placeholder="Séries"
                      value={currentExercise.sets?.toString() || ""}
                      onChangeText={(text) =>
                        setCurrentExercise({
                          ...currentExercise,
                          sets: parseInt(text) || 0,
                        })
                      }
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 4,
                        padding: 8,
                        color: colors.text,
                        flex: 1,
                        marginRight: 4,
                      }}
                    />
                    <TextInput
                      placeholder="Reps"
                      value={currentExercise.reps?.toString() || ""}
                      onChangeText={(text) =>
                        setCurrentExercise({
                          ...currentExercise,
                          reps: parseInt(text) || 0,
                        })
                      }
                      keyboardType="numeric"
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 4,
                        padding: 8,
                        color: colors.text,
                        flex: 1,
                        marginLeft: 4,
                      }}
                    />
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      padding: 8,
                      borderRadius: 4,
                      alignItems: "center",
                    }}
                    onPress={addExercise}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>Adicionar Exercício</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: "row", marginTop: 20 }}>
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
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setFormData({
                        title: "",
                        description: "",
                        duration_minutes: "",
                        exercises: [],
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
                    onPress={showCreateModal ? handleCreatePlan : handleUpdatePlan}
                  >
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                      {showCreateModal ? "Criar" : "Salvar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>

        {/* Assign Modal */}
        <Modal visible={showAssignModal} animationType="slide">
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
                <TouchableOpacity
                  onPress={() => {
                    setShowAssignModal(false);
                    setSelectedPlan(null);
                    setSelectedAthletes([]);
                    setScheduledDate("");
                  }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
                  Atribuir Plano
                </Text>
                <View style={{ width: 24 }} />
              </View>

              {selectedPlan && (
                <View>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
                    {selectedPlan.title}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginBottom: 20 }}>
                    {selectedPlan.description}
                  </Text>

                  <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 12 }}>
                    Data de Agendamento
                  </Text>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    value={scheduledDate}
                    onChangeText={setScheduledDate}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                      padding: 12,
                      color: colors.text,
                      marginBottom: 20,
                    }}
                  />

                  <Text style={{ color: colors.text, fontWeight: "bold", marginBottom: 12 }}>
                    Selecionar Atletas
                  </Text>

                  <ScrollView style={{ maxHeight: 200, marginBottom: 20 }}>
                    {teamAthletes.map((athlete) => (
                      <TouchableOpacity
                        key={athlete.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                        onPress={() => {
                          if (selectedAthletes.includes(athlete.id)) {
                            setSelectedAthletes(
                              selectedAthletes.filter((id) => id !== athlete.id)
                            );
                          } else {
                            setSelectedAthletes([...selectedAthletes, athlete.id]);
                          }
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 2,
                            borderColor: colors.primary,
                            backgroundColor: selectedAthletes.includes(athlete.id)
                              ? colors.primary
                              : "transparent",
                            marginRight: 12,
                          }}
                        />
                        <Text style={{ color: colors.text, flex: 1 }}>
                          {athlete.name} • {athlete.position}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={{ flexDirection: "row" }}>
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
                        setShowAssignModal(false);
                        setSelectedPlan(null);
                        setSelectedAthletes([]);
                        setScheduledDate("");
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
                      onPress={handleAssignPlan}
                    >
                      <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
                        Atribuir
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}