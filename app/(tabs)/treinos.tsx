import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
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

type Workout = Doc<"workouts">;

const emptyWorkoutForm = {
  name: "",
  description: "",
  duration: "",
  difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
  scheduledDate: "",
};

export default function Treinos() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const workoutsQuery = useQuery(
    api.workouts.getWorkouts,
    user ? { sessionUserId: user.id as Id<"users"> } : "skip",
  );
  const workouts = workoutsQuery ?? [];
  const createWorkout = useMutation(api.workouts.createWorkout);
  const startWorkout = useMutation(api.workouts.startWorkout);
  const completeWorkout = useMutation(api.workouts.completeWorkout);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [timer, setTimer] = useState(0);
  const [completionNotes, setCompletionNotes] = useState("");
  const [form, setForm] = useState(emptyWorkoutForm);

  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => setTimer((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  const groupedWorkouts = {
    scheduled: workouts.filter((workout) => workout.status === "scheduled"),
    inProgress: workouts.filter((workout) => workout.status === "in_progress"),
    completed: workouts.filter((workout) => workout.status === "completed"),
    skipped: workouts.filter((workout) => workout.status === "skipped"),
  };

  const resetCreateModal = () => {
    setShowCreateModal(false);
    setForm(emptyWorkoutForm);
  };

  const getStatusLabel = (status: Workout["status"]) => {
    switch (status) {
      case "scheduled":
        return "Agendado";
      case "in_progress":
        return "Em curso";
      case "completed":
        return "Concluído";
      case "skipped":
        return "Falhado";
    }
  };

  const getStatusColor = (status: Workout["status"]) => {
    switch (status) {
      case "scheduled":
        return colors.primary;
      case "in_progress":
        return colors.warning;
      case "completed":
        return colors.success;
      case "skipped":
        return colors.danger;
    }
  };

  const handleCreateWorkout = async () => {
    if (!user) return;
    if (!form.name.trim()) {
      Alert.alert("Erro", "O nome do treino é obrigatório.");
      return;
    }

    const durationValue = form.duration ? Number(form.duration) : undefined;
    if (
      form.duration &&
      (durationValue === undefined || !Number.isFinite(durationValue) || durationValue <= 0)
    ) {
      Alert.alert("Erro", "A duração tem de ser um número válido.");
      return;
    }

    const scheduledDate = form.scheduledDate
      ? new Date(form.scheduledDate).getTime()
      : undefined;

    if (form.scheduledDate && Number.isNaN(scheduledDate)) {
      Alert.alert("Erro", "A data agendada não é válida.");
      return;
    }

    try {
      await createWorkout({
        sessionUserId: user.id as Id<"users">,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        exercises: [],
        scheduledDate,
        duration: durationValue,
        difficulty: form.difficulty,
      });
      resetCreateModal();
      Alert.alert("Sucesso", "Treino criado.");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao criar treino.");
    }
  };

  const handleStartWorkout = async (workout: Workout) => {
    if (!user) return;
    try {
      await startWorkout({
        sessionUserId: user.id as Id<"users">,
        workoutId: workout._id,
      });
      setActiveWorkout(workout);
      setTimer(0);
      setCompletionNotes("");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao iniciar treino.");
    }
  };

  const handleCompleteWorkout = async () => {
    if (!user || !activeWorkout) return;
    try {
      await completeWorkout({
        sessionUserId: user.id as Id<"users">,
        workoutId: activeWorkout._id,
        actualDuration: Math.max(1, Math.round(timer / 60)),
        notes: completionNotes.trim() || undefined,
      });
      setActiveWorkout(null);
      setTimer(0);
      setCompletionNotes("");
      Alert.alert("Sucesso", "Treino concluído.");
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Falha ao concluir treino.");
    }
  };

  const renderWorkoutCard = ({ item }: { item: Workout }) => (
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
          {item.objective ? (
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>{item.objective}</Text>
          ) : null}
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            {item.duration_minutes || 0} min
          </Text>
          {item.scheduledDate ? (
            <Text style={{ color: colors.textMuted, marginTop: 2 }}>
              Agendado para {new Date(item.scheduledDate).toLocaleString("pt-PT")}
            </Text>
          ) : null}
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

      {item.status === "scheduled" || item.status === "in_progress" ? (
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 10,
            borderRadius: 10,
            alignItems: "center",
          }}
          onPress={() => handleStartWorkout(item)}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {item.status === "in_progress" ? "Retomar" : "Iniciar"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (activeWorkout) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <StatusBar barStyle={colors.statusBarStyle} />
        <SafeAreaView style={{ flex: 1, padding: 20 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            {activeWorkout.name}
          </Text>
          <Text style={{ color: colors.primary, fontSize: 56, fontWeight: "700", marginTop: 24 }}>
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 8 }}>
            Cronómetro do treino em curso.
          </Text>

          <TextInput
            value={completionNotes}
            onChangeText={setCompletionNotes}
            placeholder="Notas finais do treino"
            placeholderTextColor={colors.textMuted}
            multiline
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              color: colors.text,
              marginTop: 24,
              height: 120,
              textAlignVertical: "top",
            }}
          />

          <TouchableOpacity
            style={{
              backgroundColor: colors.success,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 20,
            }}
            onPress={handleCompleteWorkout}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
              Concluir treino
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 12,
            }}
            onPress={() => {
              setActiveWorkout(null);
              setTimer(0);
              setCompletionNotes("");
            }}
          >
            <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
              Fechar
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
                Treinos
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                {groupedWorkouts.scheduled.length} agendados • {groupedWorkouts.completed.length} concluídos
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
              }}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>+ Treino</Text>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={workouts}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkoutCard}
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
              <Ionicons name="barbell-outline" size={42} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 12 }}>
                Ainda não tens treinos
              </Text>
              <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 6 }}>
                Cria um treino novo ou agenda um para mais tarde.
              </Text>
            </View>
          }
        />

        <Modal visible={showCreateModal} animationType="slide" onRequestClose={resetCreateModal}>
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
                <TouchableOpacity onPress={resetCreateModal}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>
                  Novo treino
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <TextInput
                value={form.name}
                onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
                placeholder="Nome"
                placeholderTextColor={colors.textMuted}
                style={workoutInputStyle(colors)}
              />
              <TextInput
                value={form.description}
                onChangeText={(text) => setForm((current) => ({ ...current, description: text }))}
                placeholder="Descrição"
                placeholderTextColor={colors.textMuted}
                multiline
                style={[workoutInputStyle(colors), { height: 100, textAlignVertical: "top" }]}
              />
              <TextInput
                value={form.duration}
                onChangeText={(text) => setForm((current) => ({ ...current, duration: text }))}
                placeholder="Duração em minutos"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={workoutInputStyle(colors)}
              />
              <TextInput
                value={form.scheduledDate}
                onChangeText={(text) => setForm((current) => ({ ...current, scheduledDate: text }))}
                placeholder="Agendar para (opcional, ex: 2026-04-22T18:00)"
                placeholderTextColor={colors.textMuted}
                style={workoutInputStyle(colors)}
              />

              <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "600" }}>
                Dificuldade
              </Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
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
                      {difficulty === "beginner"
                        ? "Iniciante"
                        : difficulty === "intermediate"
                          ? "Intermédio"
                          : "Avançado"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
                onPress={handleCreateWorkout}
              >
                <Text style={{ color: "white", fontWeight: "700", fontSize: 16 }}>
                  Guardar treino
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

function workoutInputStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
  } as const;
}
