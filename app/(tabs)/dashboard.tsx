import { api } from "@/utils/apiClient";
import { getSimpleErrorMessage } from "@/utils/errorMessages";
import type { Id } from "@/utils/apiTypes";
import ScoutDashboard from "@/components/ScoutDashboard";
import { DateField, FormErrorText, TimeField } from "@/components/FormFields";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  eventDateTimeErrors,
  optionalText,
  parseEventDateTime,
  requiredText,
  ValidationErrors,
} from "@/utils/formValidation";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type EventType = "game" | "training" | "meeting" | "other";

type EventFormState = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  type: EventType;
  location: string;
  notes: string;
};

type EventFormField = keyof EventFormState | "schedule";

type EventModalProps = Readonly<{
  visible: boolean;
  event?: any;
  onClose: () => void;
  onSave: (form: EventFormState) => void;
  onDelete?: () => void;
}>;

type ActivityHeatmapProps = Readonly<{
  workoutLogs: { completedDate: number }[];
  events: { date: string; type?: EventType }[];
}>;

type StatCardProps = Readonly<{
  label: string;
  value: number;
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
}>;

const emptyEventForm: EventFormState = {
  title: "",
  date: "",
  start_time: "",
  end_time: "",
  type: "training",
  location: "",
  notes: "",
};

function EventModal({
  visible,
  event,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const { colors } = useTheme();
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [errors, setErrors] = useState<ValidationErrors<EventFormField>>({});

  useEffect(() => {
    if (!visible) return;
    setForm({
      title: event?.title || "",
      date: event?.date || "",
      start_time: event?.start_time || "",
      end_time: event?.end_time || "",
      type: event?.type || "training",
      location: event?.location || "",
      notes: event?.notes || "",
    });
    setErrors({});
  }, [event, visible]);

  const setField = <Field extends keyof EventFormState>(
    field: Field,
    value: EventFormState[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, schedule: undefined }));
  };

  const validateAndSave = () => {
    const nextErrors: ValidationErrors<EventFormField> = {};
    const originalStart = event
      ? parseEventDateTime(event.date, event.start_time)
      : null;
    const allowHistoricalEdit = Boolean(
      event && originalStart && originalStart.getTime() < Date.now(),
    );

    nextErrors.title = requiredText(form.title, "Título");
    nextErrors.location = optionalText(form.location, "Local", 120);
    nextErrors.notes = optionalText(form.notes, "Notas");

    if (!form.date) nextErrors.date = "Data é obrigatória.";
    if (!form.start_time) nextErrors.start_time = "Hora de início é obrigatória.";
    if (!form.end_time) nextErrors.end_time = "Hora de fim é obrigatória.";

    if (form.date && form.start_time && form.end_time) {
      if (allowHistoricalEdit) {
        const start = parseEventDateTime(form.date, form.start_time);
        const end = parseEventDateTime(form.date, form.end_time);
        if (!start || !end) nextErrors.schedule = "A data e as horas têm de ser válidas.";
        else if (end.getTime() <= start.getTime()) {
          nextErrors.schedule = "A hora de fim tem de ser posterior à hora de início.";
        }
      } else {
        nextErrors.schedule = eventDateTimeErrors(
          form.date,
          form.start_time,
          form.end_time,
        );
      }
    }

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as EventFormField]) delete nextErrors[key as EventFormField];
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View style={{ backgroundColor: colors.bg, borderRadius: 18, padding: 20 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 20 }}>
            {event ? "Editar evento" : "Novo evento"}
          </Text>
          <TextInput
            value={form.title}
            onChangeText={(text) => setField("title", text)}
            placeholder="Título"
            placeholderTextColor={colors.textMuted}
            style={[
              eventInput(colors),
              errors.title && { borderColor: colors.danger, borderWidth: 1 },
            ]}
          />
          <FormErrorText error={errors.title} />
          <DateField
            label="Data"
            value={form.date}
            onChange={(value) => setField("date", value)}
            placeholder="Selecionar data"
            error={errors.date}
            minimumDate={event ? undefined : new Date()}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TimeField
                label="Início"
                value={form.start_time}
                onChange={(value) => setField("start_time", value)}
                placeholder="Selecionar"
                error={errors.start_time}
                referenceDate={form.date}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TimeField
                label="Fim"
                value={form.end_time}
                onChange={(value) => setField("end_time", value)}
                placeholder="Selecionar"
                error={errors.end_time}
                referenceDate={form.date}
              />
            </View>
          </View>
          <FormErrorText error={errors.schedule} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <Picker
              selectedValue={form.type}
              onValueChange={(value) => setField("type", value as EventType)}
              style={{ color: colors.text }}
            >
              <Picker.Item label="Treino" value="training" />
              <Picker.Item label="Jogo" value="game" />
              <Picker.Item label="Reunião" value="meeting" />
              <Picker.Item label="Outro" value="other" />
            </Picker>
          </View>
          <TextInput
            value={form.location}
            onChangeText={(text) => setField("location", text)}
            placeholder="Local"
            placeholderTextColor={colors.textMuted}
            style={[
              eventInput(colors),
              errors.location && { borderColor: colors.danger, borderWidth: 1 },
            ]}
          />
          <FormErrorText error={errors.location} />
          <TextInput
            value={form.notes}
            onChangeText={(text) => setField("notes", text)}
            placeholder="Notas"
            placeholderTextColor={colors.textMuted}
            multiline
            style={[
              eventInput(colors),
              { height: 100, textAlignVertical: "top" },
              errors.notes && { borderColor: colors.danger, borderWidth: 1 },
            ]}
          />
          <FormErrorText error={errors.notes} />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={onClose}
            >
              <Text style={{ color: colors.text, fontWeight: "700" }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={validateAndSave}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Guardar</Text>
            </TouchableOpacity>
          </View>

          {onDelete ? (
            <TouchableOpacity
              style={{
                marginTop: 12,
                backgroundColor: colors.danger,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
              onPress={onDelete}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>Eliminar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function ActivityHeatmap({
  workoutLogs,
  events,
}: ActivityHeatmapProps) {
  const { colors } = useTheme();
  const today = new Date();
  const activityMap = new Map<string, number>();

  workoutLogs.forEach((log) => {
    const day = new Date(log.completedDate).toISOString().split("T")[0];
    activityMap.set(day, (activityMap.get(day) || 0) + 1);
  });

  events.forEach((event) => {
    if (new Date(event.date) <= today) {
      activityMap.set(event.date, (activityMap.get(event.date) || 0) + 1);
    }
  });

  const days = Array.from({ length: 35 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (34 - index));
    const key = date.toISOString().split("T")[0];
    return { key, count: activityMap.get(key) || 0 };
  });

  const getColor = (count: number) => {
    if (count === 0) return colors.surface;
    if (count === 1) return `${colors.primary}55`;
    if (count === 2) return `${colors.primary}99`;
    return colors.primary;
  };

  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 12 }}>
        Atividade recente
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {days.map((day) => (
          <View
            key={day.key}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              backgroundColor: getColor(day.count),
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function Dashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { sessionUserId: user.id as Id<"users"> } : "skip",
  );
  const workoutLogsQuery = useQuery(
    api.workouts.getWorkoutLogs,
    convexUser?.role === "PLAYER" ? { sessionUserId: convexUser._id } : "skip",
  );
  const eventsQuery = useQuery(
    api.events.getEvents,
    convexUser?.role === "PLAYER" ? { sessionUserId: convexUser._id } : "skip",
  );
  const workoutLogs = (workoutLogsQuery ?? []) as any[];
  const events = (eventsQuery ?? []) as any[];
  const countableEvents = events.filter((event) => event.type !== "training");
  const playerStats =
    useQuery(
      api.users.getPlayerStats,
      convexUser?.role === "PLAYER" ? { sessionUserId: convexUser._id } : "skip",
    ) || {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      points: 0,
      assists: 0,
      rebounds: 0,
    };
  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const summary = {
    totalActivities: workoutLogs.length + countableEvents.length,
    monthActivities:
      workoutLogs.filter((log) => log.completedDate >= monthStart).length +
      countableEvents.filter((event) => new Date(event.date).getTime() >= monthStart).length,
    weekActivities:
      workoutLogs.filter((log) => log.completedDate >= weekStart.getTime()).length +
      countableEvents.filter((event) => new Date(event.date).getTime() >= weekStart.getTime()).length,
  };

  useEffect(() => {
    if (convexUser?.role === "COACH") {
      router.replace("/jogos");
    }
  }, [convexUser?.role, router]);

  if (!convexUser) {
    return null;
  }

  if (convexUser.role === "COACH") {
    return null;
  }

  if (convexUser.role === "SCOUT") {
    return <ScoutDashboard sessionUserId={convexUser._id} />;
  }

  const handleSaveEvent = async (form: EventFormState) => {
    if (!convexUser) return;
    if (!form.title.trim() || !form.date || !form.start_time || !form.end_time) {
      Alert.alert("Erro", "Preenche título, data e horário.");
      return;
    }

    const payload = {
      sessionUserId: convexUser._id,
      title: form.title.trim(),
      description: form.notes.trim() || undefined,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      location: form.location.trim() || undefined,
      type: form.type,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (editingEvent) {
        await updateEvent({ id: editingEvent._id, ...payload });
      } else {
        await createEvent(payload);
      }
      setShowModal(false);
      setEditingEvent(null);
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao guardar evento."));
    }
  };

  const handleDeleteEvent = async () => {
    if (!convexUser || !editingEvent) return;
    try {
      await deleteEvent({
        sessionUserId: convexUser._id,
        id: editingEvent._id,
      });
      setShowModal(false);
      setEditingEvent(null);
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao eliminar evento."));
    }
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
              Dashboard
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>
              Resumo da tua atividade e próximos eventos.
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
            <StatCard label="Atividades" value={summary.totalActivities} color={colors.primary} colors={colors} />
            <StatCard label="Esta semana" value={summary.weekActivities} color={colors.warning} colors={colors} />
            <StatCard label="Este mês" value={summary.monthActivities} color={colors.success} colors={colors} />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
            <StatCard label="Jogos" value={playerStats.gamesPlayed} color={colors.primary} colors={colors} />
            <StatCard label="Vitórias" value={playerStats.wins} color={colors.success} colors={colors} />
            <StatCard label="Pontos" value={playerStats.points} color={colors.warning} colors={colors} />
          </View>

          <ActivityHeatmap workoutLogs={workoutLogs} events={countableEvents} />

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
                Eventos
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 10,
                }}
                onPress={() => {
                  setEditingEvent(null);
                  setShowModal(true);
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>+ Evento</Text>
              </TouchableOpacity>
            </View>

            {events.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>
                Ainda não tens eventos registados.
              </Text>
            ) : (
              events.map((event) => (
                <TouchableOpacity
                  key={event._id}
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingVertical: 12,
                  }}
                  onPress={() => {
                    setEditingEvent(event);
                    setShowModal(true);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{event.title}</Text>
                  <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                    {event.date} • {event.start_time} - {event.end_time}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                    {event.location || "Sem localização"} • {event.type}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        <EventModal
          visible={showModal}
          event={editingEvent}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          onDelete={editingEvent ? handleDeleteEvent : undefined}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

function StatCard({
  label,
  value,
  color,
  colors,
}: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: "30%",
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
      }}
    >
      <Text style={{ color, fontSize: 24, fontWeight: "700" }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function eventInput(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 16,
  } as const;
}
