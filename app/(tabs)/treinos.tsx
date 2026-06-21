import { api } from "@/utils/apiClient";
import { getSimpleErrorMessage } from "@/utils/errorMessages";
import type { Doc, Id } from "@/utils/apiTypes";
import { DateTimeField, FormErrorText } from "@/components/FormFields";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  futureDateTime,
  optionalText,
  positiveInteger,
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

type Workout = Doc<"workouts">;
type ThemeColors = ReturnType<typeof useTheme>["colors"];

const emptyWorkoutForm = {
  name: "",
  description: "",
  duration: "",
  difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
  scheduledDate: null as number | null,
};

type WorkoutField = keyof typeof emptyWorkoutForm;

type WorkoutTextInputProps = Readonly<{
  colors: ThemeColors;
  error?: string;
  keyboardType?: "default" | "numeric";
  multiline?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}>;

function WorkoutTextInput({
  colors,
  error,
  keyboardType = "default",
  multiline = false,
  placeholder,
  value,
  onChangeText,
}: WorkoutTextInputProps) {
  return (
    <>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          workoutInputStyle(colors),
          multiline && { height: 100, textAlignVertical: "top" },
          error && { borderColor: colors.danger, borderWidth: 1 },
        ]}
      />
      <FormErrorText error={error} />
    </>
  );
}

export default function Treinos() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { sessionUserId: user.id as Id<"users"> } : "skip",
  );
  const workoutsQuery = useQuery(
    api.workouts.getWorkouts,
    convexUser?.role === "PLAYER" ? { sessionUserId: convexUser._id } : "skip",
  );
  const visibleWorkouts = useMemo(() => {
    const workouts: Workout[] = workoutsQuery ?? [];
    const todayStart = getStartOfTodayTimestamp();

    return workouts
      .filter((workout) => getWorkoutDateTimestamp(workout) >= todayStart)
      .sort((a, b) => getWorkoutDateTimestamp(a) - getWorkoutDateTimestamp(b));
  }, [workoutsQuery]);
  const createWorkout = useMutation(api.workouts.createWorkout);
  const startWorkout = useMutation(api.workouts.startWorkout);
  const completeWorkout = useMutation(api.workouts.completeWorkout);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [timer, setTimer] = useState(0);
  const [completionNotes, setCompletionNotes] = useState("");
  const [form, setForm] = useState(emptyWorkoutForm);
  const [errors, setErrors] = useState<ValidationErrors<WorkoutField>>({});

  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => setTimer((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  useEffect(() => {
    if (!convexUser || convexUser.role === "PLAYER") return;
    router.replace(convexUser.role === "COACH" ? "/jogos" : "/dashboard");
  }, [convexUser, router]);

  const groupedWorkouts = {
    scheduled: visibleWorkouts.filter((workout) => workout.status === "scheduled"),
    inProgress: visibleWorkouts.filter((workout) => workout.status === "in_progress"),
    completed: visibleWorkouts.filter((workout) => workout.status === "completed"),
    skipped: visibleWorkouts.filter((workout) => workout.status === "skipped"),
  };

  const resetCreateModal = () => {
    setShowCreateModal(false);
    setForm(emptyWorkoutForm);
    setErrors({});
  };

  const updateWorkoutField = (field: WorkoutField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
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
    if (!convexUser || convexUser.role !== "PLAYER") return;
    const nextErrors: ValidationErrors<WorkoutField> = {
      name: requiredText(form.name, "Nome"),
      description: optionalText(form.description, "Descrição"),
      duration: positiveInteger(form.duration, "Duração"),
      scheduledDate: form.scheduledDate
        ? futureDateTime(form.scheduledDate, "Data agendada")
        : undefined,
    };
    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as WorkoutField]) delete nextErrors[key as WorkoutField];
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const durationValue = form.duration ? Number(form.duration) : undefined;

    try {
      await createWorkout({
        sessionUserId: convexUser._id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        exercises: [],
        scheduledDate: form.scheduledDate || undefined,
        duration: durationValue,
        difficulty: form.difficulty,
      });
      resetCreateModal();
      Alert.alert("Sucesso", "Treino criado.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao criar treino."));
    }
  };

  const handleStartWorkout = async (workout: Workout) => {
    if (!convexUser || convexUser.role !== "PLAYER") return;
    try {
      await startWorkout({
        sessionUserId: convexUser._id,
        workoutId: workout._id,
      });
      setActiveWorkout(workout);
      setTimer(0);
      setCompletionNotes("");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao iniciar treino."));
    }
  };

  const handleCompleteWorkout = async () => {
    if (!convexUser || convexUser.role !== "PLAYER" || !activeWorkout) return;
    try {
      await completeWorkout({
        sessionUserId: convexUser._id,
        workoutId: activeWorkout._id,
        actualDuration: Math.max(1, Math.round(timer / 60)),
        notes: completionNotes.trim() || undefined,
      });
      setActiveWorkout(null);
      setTimer(0);
      setCompletionNotes("");
      Alert.alert("Sucesso", "Treino concluído.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao concluir treino."));
    }
  };

  const workoutTextFields: (Omit<WorkoutTextInputProps, "colors" | "onChangeText"> & {
    field: "name" | "description" | "duration";
  })[] = [
    {
      field: "name",
      error: errors.name,
      placeholder: "Nome",
      value: form.name,
    },
    {
      field: "description",
      error: errors.description,
      multiline: true,
      placeholder: "Descrição",
      value: form.description,
    },
    {
      field: "duration",
      error: errors.duration,
      keyboardType: "numeric",
      placeholder: "Duração em minutos",
      value: form.duration,
    },
  ];

  const renderWorkoutCard = ({ item }: { item: Workout }) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text
            numberOfLines={2}
            style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}
          >
            {item.name}
          </Text>
          {item.objective ? (
            <Text
              numberOfLines={2}
              style={{ color: colors.textMuted, marginTop: 6, lineHeight: 19 }}
            >
              {item.objective}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
            <Ionicons name="time-outline" size={15} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted }}>{item.duration_minutes || 0} min</Text>
          </View>
          {item.scheduledDate ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
              <Text
                numberOfLines={1}
                style={{ color: colors.textMuted, flex: 1 }}
              >
                {new Date(item.scheduledDate).toLocaleString("pt-PT")}
              </Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: `${getStatusColor(item.status)}22`,
            borderColor: `${getStatusColor(item.status)}88`,
            borderWidth: 1,
            paddingHorizontal: 9,
            paddingVertical: 5,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: getStatusColor(item.status),
            }}
          />
          <Text style={{ color: getStatusColor(item.status), fontSize: 12, fontWeight: "700" }}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      {item.status === "scheduled" || item.status === "in_progress" ? (
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 11,
            borderRadius: 10,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
          onPress={() => handleStartWorkout(item)}
        >
          <Ionicons
            name={item.status === "in_progress" ? "play-forward" : "play"}
            size={16}
            color="white"
          />
          <Text style={{ color: "white", fontWeight: "700" }}>
            {item.status === "in_progress" ? "Retomar" : "Iniciar"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (!convexUser || convexUser.role !== "PLAYER") {
    return null;
  }

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
          data={visibleWorkouts}
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

              {workoutTextFields.map(({ field, ...props }) => (
                <WorkoutTextInput
                  key={field}
                  {...props}
                  colors={colors}
                  onChangeText={(text) => updateWorkoutField(field, text)}
                />
              ))}
              <DateTimeField
                label="Agendar para"
                value={form.scheduledDate}
                onChange={(value) => {
                  setForm((current) => ({ ...current, scheduledDate: value }));
                  setErrors((current) => ({ ...current, scheduledDate: undefined }));
                }}
                placeholder="Selecionar data e hora opcional"
                error={errors.scheduledDate}
                minimumDate={new Date()}
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
                      {getDifficultyLabel(difficulty)}
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

function workoutInputStyle(colors: ThemeColors) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
  } as const;
}

function getDifficultyLabel(difficulty: Workout["difficulty"]) {
  switch (difficulty) {
    case "beginner":
      return "Iniciante";
    case "intermediate":
      return "Intermédio";
    case "advanced":
      return "Avançado";
  }
}

function getStartOfTodayTimestamp() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

function getWorkoutDateTimestamp(workout: Workout) {
  return workout.scheduledDate ?? workout.created_at;
}
