import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
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

type Workout = {
  _id: string;
  name: string;
  type: "gym" | "football";
  duration_minutes?: number;
  objective?: string;
  status: "planned" | "in_progress" | "completed";
  exercises?: Array<{
    name: string;
    sets?: number;
    reps?: number;
    weight_kg?: number;
  }>;
};

export default function Treinos() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const workouts = useQuery(api.workouts.getWorkouts) || [];
  const startWorkoutMutation = useMutation(api.workouts.startWorkout);
  const completeWorkoutMutation = useMutation(api.workouts.completeWorkout);
  const createWorkoutMutation = useMutation(api.workouts.createWorkout);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "gym" | "football">(
    "all",
  );
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null);
  const [timer, setTimer] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [createData, setCreateData] = useState({
    name: "",
    type: "gym" as "gym" | "football",
    duration_minutes: "",
    objective: "",
  });

  useEffect(() => {
    let interval: any;
    if (isExecuting) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isExecuting]);

  const filteredWorkouts = workouts.filter((workout) => {
    const matchesSearch = workout.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filterType === "all" || workout.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleStartWorkout = async (workout: Workout) => {
    try {
      await startWorkoutMutation({ workoutId: workout._id as any });
      setCurrentWorkout(workout);
      setIsExecuting(true);
      setTimer(0);
    } catch (error) {
      Alert.alert("Error", "Failed to start workout");
    }
  };

  const handleFinishWorkout = () => {
    setIsExecuting(false);
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    if (!currentWorkout) return;
    try {
      await completeWorkoutMutation({
        workoutId: currentWorkout._id,
        type: currentWorkout.type,
        ...formData,
        total_time_minutes: Math.floor(timer / 60),
      });
      setCurrentWorkout(null);
      setShowForm(false);
      setFormData({});
      setTimer(0);
      Alert.alert("Success", "Workout completed!");
    } catch (error) {
      Alert.alert("Error", "Failed to complete workout");
    }
  };

  const handleCreateWorkout = async () => {
    try {
      await createWorkoutMutation({
        name: createData.name,
        type: createData.type,
        duration_minutes: createData.duration_minutes
          ? parseInt(createData.duration_minutes)
          : undefined,
        objective: createData.objective || undefined,
      });
      setShowCreate(false);
      setCreateData({
        name: "",
        type: "gym",
        duration_minutes: "",
        objective: "",
      });
      Alert.alert("Success", "Workout created!");
    } catch (error) {
      Alert.alert("Error", "Failed to create workout");
    }
  };

  const renderWorkoutCard = ({ item }: { item: Workout }) => (
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
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
          {item.name}
        </Text>
        <View
          style={{
            backgroundColor:
              item.type === "gym" ? colors.primary : colors.success,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 12 }}>
            {item.type === "gym" ? t("treinos.gym") : t("treinos.football")}
          </Text>
        </View>
      </View>
      <Text style={{ color: colors.textMuted, marginTop: 4 }}>
        {t("treinos.duration")}: {item.duration_minutes || 0} min
      </Text>
      {item.objective && (
        <Text style={{ color: colors.textMuted, marginTop: 4 }}>
          {t("treinos.objective")}: {item.objective}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 12,
        }}
      >
        <Text
          style={{
            color:
              item.status === "completed"
                ? colors.success
                : item.status === "in_progress"
                  ? colors.warning
                  : colors.textMuted,
            fontWeight: "bold",
          }}
        >
          {item.status === "planned"
            ? t("treinos.planned")
            : item.status === "in_progress"
              ? t("treinos.inProgress")
              : t("treinos.completed")}
        </Text>
        {item.status === "planned" && (
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
            }}
            onPress={() => handleStartWorkout(item)}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              {t("treinos.startWorkout")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isExecuting && currentWorkout) {
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
            {currentWorkout.name}
          </Text>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: colors.primary,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </Text>
          <Text
            style={{
              fontSize: 18,
              color: colors.text,
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            {t("treinos.timer")}
          </Text>
          {currentWorkout.exercises && (
            <FlatList
              data={currentWorkout.exercises}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 16,
                    marginVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: colors.text,
                      fontWeight: "bold",
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.textMuted }}>
                    {item.sets} {t("treinos.sets")} x {item.reps}{" "}
                    {t("treinos.reps")}
                    {item.weight_kg && ` @ ${item.weight_kg}kg`}
                  </Text>
                </View>
              )}
            />
          )}
          <TouchableOpacity
            style={{
              backgroundColor: colors.success,
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 40,
            }}
            onPress={handleFinishWorkout}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
              {t("treinos.finishWorkout")}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (showForm && currentWorkout) {
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
            {t("treinos.finishWorkout")}
          </Text>
          <Text style={{ color: colors.textMuted, marginBottom: 20 }}>
            {t("treinos.type")}:{" "}
            {currentWorkout.type === "gym"
              ? t("treinos.gym")
              : t("treinos.football")}
          </Text>
          {/* Form fields based on type */}
          {currentWorkout.type === "gym" ? (
            <View>
              {/* Gym form */}
              <Text style={{ color: colors.text, marginBottom: 8 }}>
                {t("treinos.exercisesDone")}
              </Text>
              {currentWorkout.exercises?.map((exercise, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "bold" }}>
                    {exercise.name}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 8 }}>
                    <TextInput
                      placeholder={t("treinos.sets")}
                      defaultValue={exercise.sets?.toString()}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 4,
                        padding: 8,
                        color: colors.text,
                        flex: 1,
                        marginRight: 4,
                      }}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const exercises = [
                          ...(formData.exercises_done ||
                            currentWorkout.exercises ||
                            []),
                        ];
                        exercises[index] = {
                          ...exercises[index],
                          sets: parseInt(text) || 0,
                        };
                        setFormData({ ...formData, exercises_done: exercises });
                      }}
                    />
                    <TextInput
                      placeholder={t("treinos.reps")}
                      defaultValue={exercise.reps?.toString()}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 4,
                        padding: 8,
                        color: colors.text,
                        flex: 1,
                        marginHorizontal: 4,
                      }}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const exercises = [
                          ...(formData.exercises_done ||
                            currentWorkout.exercises ||
                            []),
                        ];
                        exercises[index] = {
                          ...exercises[index],
                          reps: parseInt(text) || 0,
                        };
                        setFormData({ ...formData, exercises_done: exercises });
                      }}
                    />
                    <TextInput
                      placeholder={t("treinos.weight")}
                      defaultValue={exercise.weight_kg?.toString()}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 4,
                        padding: 8,
                        color: colors.text,
                        flex: 1,
                        marginLeft: 4,
                      }}
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const exercises = [
                          ...(formData.exercises_done ||
                            currentWorkout.exercises ||
                            []),
                        ];
                        exercises[index] = {
                          ...exercises[index],
                          weight_kg: parseFloat(text) || 0,
                        };
                        setFormData({ ...formData, exercises_done: exercises });
                      }}
                    />
                  </View>
                </View>
              ))}
              <TextInput
                placeholder={t("treinos.rpe")}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setFormData({ ...formData, rpe: parseInt(text) })
                }
              />
              <Text style={{ color: colors.text, marginBottom: 8 }}>
                {t("treinos.muscleSensation")}
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                {["leve", "normal", "fadiga"].map((sensation) => (
                  <TouchableOpacity
                    key={sensation}
                    style={{
                      backgroundColor:
                        formData.muscle_sensation === sensation
                          ? colors.primary
                          : colors.surface,
                      padding: 8,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() =>
                      setFormData({ ...formData, muscle_sensation: sensation })
                    }
                  >
                    <Text
                      style={{
                        color:
                          formData.muscle_sensation === sensation
                            ? "white"
                            : colors.text,
                      }}
                    >
                      {t(`treinos.${sensation}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                placeholder={t("treinos.notes")}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                  height: 80,
                }}
                multiline
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
              />
            </View>
          ) : (
            <View>
              {/* Football form */}
              <Text style={{ color: colors.text, marginBottom: 8 }}>
                {t("treinos.sessionType")}
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                {["tecnico", "tatico", "fisico", "jogo"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={{
                      backgroundColor:
                        formData.session_type === type
                          ? colors.primary
                          : colors.surface,
                      padding: 8,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() =>
                      setFormData({ ...formData, session_type: type })
                    }
                  >
                    <Text
                      style={{
                        color:
                          formData.session_type === type
                            ? "white"
                            : colors.text,
                      }}
                    >
                      {t(`treinos.${type}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                placeholder={t("treinos.totalTime")}
                defaultValue={Math.floor(timer / 60).toString()}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    total_duration_minutes: parseInt(text),
                  })
                }
              />
              <TextInput
                placeholder={t("treinos.distance")}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
                keyboardType="numeric"
                onChangeText={(text) =>
                  setFormData({ ...formData, distance_km: parseFloat(text) })
                }
              />
              <Text style={{ color: colors.text, marginBottom: 8 }}>
                {t("treinos.intensity")}
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                {["baixa", "media", "alta"].map((intensity) => (
                  <TouchableOpacity
                    key={intensity}
                    style={{
                      backgroundColor:
                        formData.intensity === intensity
                          ? colors.primary
                          : colors.surface,
                      padding: 8,
                      borderRadius: 8,
                      marginRight: 8,
                    }}
                    onPress={() => setFormData({ ...formData, intensity })}
                  >
                    <Text
                      style={{
                        color:
                          formData.intensity === intensity
                            ? "white"
                            : colors.text,
                      }}
                    >
                      {t(`treinos.${intensity}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ color: colors.text, marginBottom: 8 }}>
                {t("treinos.playedGame")}
              </Text>
              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: formData.played_game
                      ? colors.primary
                      : colors.surface,
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                  onPress={() =>
                    setFormData({ ...formData, played_game: true })
                  }
                >
                  <Text
                    style={{
                      color: formData.played_game ? "white" : colors.text,
                    }}
                  >
                    {t("treinos.yes")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: !formData.played_game
                      ? colors.primary
                      : colors.surface,
                    padding: 8,
                    borderRadius: 8,
                  }}
                  onPress={() =>
                    setFormData({ ...formData, played_game: false })
                  }
                >
                  <Text
                    style={{
                      color: !formData.played_game ? "white" : colors.text,
                    }}
                  >
                    {t("treinos.no")}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder={t("treinos.position")}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
                onChangeText={(text) =>
                  setFormData({ ...formData, position: text })
                }
              />
              <TextInput
                placeholder={t("treinos.physicalSensation")}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                }}
                onChangeText={(text) =>
                  setFormData({ ...formData, physical_sensation: text })
                }
              />
              <TextInput
                placeholder={t("treinos.notes")}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  marginBottom: 16,
                  height: 80,
                }}
                multiline
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
              />
            </View>
          )}
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 20,
            }}
            onPress={handleSubmitForm}
          >
            <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
              {t("treinos.submit")}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (showCreate) {
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
            {t("treinos.newWorkout")}
          </Text>
          <TextInput
            placeholder="Nome do treino"
            value={createData.name}
            onChangeText={(text) =>
              setCreateData({ ...createData, name: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 16,
            }}
          />
          <Text style={{ color: colors.text, marginBottom: 8 }}>Tipo</Text>
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <TouchableOpacity
              style={{
                backgroundColor:
                  createData.type === "gym" ? colors.primary : colors.surface,
                padding: 12,
                borderRadius: 8,
                marginRight: 8,
                flex: 1,
              }}
              onPress={() => setCreateData({ ...createData, type: "gym" })}
            >
              <Text
                style={{
                  color: createData.type === "gym" ? "white" : colors.text,
                  textAlign: "center",
                }}
              >
                {t("treinos.gym")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor:
                  createData.type === "football"
                    ? colors.primary
                    : colors.surface,
                padding: 12,
                borderRadius: 8,
                flex: 1,
              }}
              onPress={() => setCreateData({ ...createData, type: "football" })}
            >
              <Text
                style={{
                  color: createData.type === "football" ? "white" : colors.text,
                  textAlign: "center",
                }}
              >
                {t("treinos.football")}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder={t("treinos.duration")}
            value={createData.duration_minutes}
            onChangeText={(text) =>
              setCreateData({ ...createData, duration_minutes: text })
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
            placeholder={t("treinos.objective")}
            value={createData.objective}
            onChangeText={(text) =>
              setCreateData({ ...createData, objective: text })
            }
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 12,
              color: colors.text,
              marginBottom: 20,
            }}
          />
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: colors.danger,
                padding: 16,
                borderRadius: 12,
                flex: 1,
                marginRight: 8,
                alignItems: "center",
              }}
              onPress={() => setShowCreate(false)}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
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
              onPress={handleCreateWorkout}
            >
              <Text
                style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
              >
                Criar
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
              {t("treinos.title")}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              onPress={() => setShowCreate(true)}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                + {t("treinos.newWorkout")}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Filters */}
          <View style={{ marginTop: 16 }}>
            <TextInput
              placeholder={t("treinos.search")}
              value={search}
              onChangeText={setSearch}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                marginBottom: 8,
              }}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor:
                    filterType === "all" ? colors.primary : colors.surface,
                  padding: 8,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 4,
                }}
                onPress={() => setFilterType("all")}
              >
                <Text
                  style={{
                    color: filterType === "all" ? "white" : colors.text,
                    textAlign: "center",
                  }}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor:
                    filterType === "gym" ? colors.primary : colors.surface,
                  padding: 8,
                  borderRadius: 8,
                  flex: 1,
                  marginHorizontal: 4,
                }}
                onPress={() => setFilterType("gym")}
              >
                <Text
                  style={{
                    color: filterType === "gym" ? "white" : colors.text,
                    textAlign: "center",
                  }}
                >
                  {t("treinos.gym")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor:
                    filterType === "football" ? colors.primary : colors.surface,
                  padding: 8,
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 4,
                }}
                onPress={() => setFilterType("football")}
              >
                <Text
                  style={{
                    color: filterType === "football" ? "white" : colors.text,
                    textAlign: "center",
                  }}
                >
                  {t("treinos.football")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Workout List */}
        <FlatList
          data={filteredWorkouts}
          keyExtractor={(item) => item._id}
          renderItem={renderWorkoutCard}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
