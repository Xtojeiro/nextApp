import { api } from "@/utils/apiClient";
import type { Id } from "@/utils/apiTypes";
import { getSimpleErrorMessage } from "@/utils/errorMessages";
import { DateField, FormErrorText, TimeField } from "@/components/FormFields";
import useTheme from "@/hooks/useTheme";
import { useMutation, useQuery } from "@/hooks/useApi";
import {
  eventDateTimeErrors,
  optionalText,
  parseEventDateTime,
  requiredText,
  ValidationErrors,
} from "@/utils/formValidation";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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

type EventType = "meeting" | "other";

type ScoutDashboardProps = Readonly<{
  sessionUserId: Id<"users">;
}>;

type Athlete = {
  _id: Id<"players">;
  userId: Id<"users">;
  position?: string;
  user?: {
    _id: Id<"users">;
    full_name?: string;
    avatar?: string;
    location?: string;
    age?: number;
  } | null;
  team?: {
    name?: string;
  } | null;
};

type ScoutReport = {
  _id: Id<"scoutReports">;
  athleteId: Id<"users">;
  content: string;
  rating?: number;
  position?: string;
  strengths?: string[];
  weaknesses?: string[];
  createdAt: number;
  athlete?: {
    _id: Id<"users">;
    full_name?: string;
    location?: string;
  } | null;
};

type ScoutEvent = {
  _id: Id<"events">;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  type: EventType;
  notes?: string;
  description?: string;
};

type MeetingFormState = {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  type: EventType;
  location: string;
  notes: string;
};

type ReportFormState = {
  athleteId: string;
  position: string;
  rating: string;
  strengths: string;
  weaknesses: string;
  content: string;
};

type MeetingFormField = keyof MeetingFormState | "schedule";
type ReportFormField = keyof ReportFormState;

const emptyMeetingForm: MeetingFormState = {
  title: "",
  date: "",
  start_time: "",
  end_time: "",
  type: "meeting",
  location: "",
  notes: "",
};

const emptyReportForm: ReportFormState = {
  athleteId: "",
  position: "",
  rating: "",
  strengths: "",
  weaknesses: "",
  content: "",
};

export default function ScoutDashboard({ sessionUserId }: ScoutDashboardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const observedAthletesQuery = useQuery(api.scout.getObservedAthletes, {
    sessionUserId,
    limit: 50,
  }) as Athlete[] | undefined;
  const reportsQuery = useQuery(api.scout.getScoutReports, { sessionUserId, limit: 8 }) as
    | ScoutReport[]
    | undefined;
  const eventsQuery = useQuery(api.events.getEvents, { sessionUserId }) as ScoutEvent[] | undefined;
  const observedAthletes = useMemo(() => observedAthletesQuery ?? [], [observedAthletesQuery]);
  const reports = useMemo(() => reportsQuery ?? [], [reportsQuery]);
  const events = useMemo(() => eventsQuery ?? [], [eventsQuery]);
  const createReport = useMutation(api.scout.createScoutReport);
  const addObservedAthlete = useMutation(api.scout.addObservedAthlete);
  const createEvent = useMutation(api.events.createEvent);
  const updateEvent = useMutation(api.events.updateEvent);
  const deleteEvent = useMutation(api.events.deleteEvent);

  const [athleteSearch, setAthleteSearch] = useState("");
  const [addAthleteModalVisible, setAddAthleteModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportAthleteId, setSelectedReportAthleteId] = useState<Id<"users"> | null>(null);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScoutEvent | null>(null);

  const scoutEvents = useMemo(
    () => events.filter((event) => event.type === "meeting" || event.type === "other"),
    [events],
  );
  const upcomingMeetings = useMemo(() => {
    const todayKey = new Date().toISOString().split("T")[0];
    return scoutEvents
      .filter((event) => event.date >= todayKey)
      .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));
  }, [scoutEvents]);
  const filteredAthletes = useMemo(() => {
    const query = athleteSearch.trim().toLowerCase();
    if (!query) return observedAthletes;
    return observedAthletes.filter((athlete) => {
      const searchable = [
        athlete.user?.full_name,
        athlete.position,
        athlete.team?.name,
        athlete.user?.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });
  }, [athleteSearch, observedAthletes]);

  const handleOpenAthlete = (athleteId?: Id<"users">) => {
    if (!athleteId) return;
    router.push(`/user/${athleteId}` as any);
  };

  const openReportModal = (athleteId?: Id<"users"> | null) => {
    setSelectedReportAthleteId(athleteId || null);
    setReportModalVisible(true);
  };

  const handleAddObservedAthlete = async (athleteId: Id<"users">) => {
    try {
      await addObservedAthlete({ sessionUserId, athleteId });
      setAddAthleteModalVisible(false);
      Alert.alert(t("common.success"), t("scoutDashboard.messages.playerAdded"));
    } catch (error) {
      Alert.alert(
        t("common.error"),
        getSimpleErrorMessage(error, t("scoutDashboard.messages.playerAddError")),
      );
    }
  };

  const handleSaveReport = async (form: ReportFormState) => {
    const rating = form.rating.trim() ? Number(form.rating) : undefined;
    try {
      await createReport({
        sessionUserId,
        athleteId: form.athleteId as Id<"users">,
        content: form.content.trim(),
        rating,
        position: form.position.trim() || undefined,
        strengths: splitList(form.strengths),
        weaknesses: splitList(form.weaknesses),
      });
      setReportModalVisible(false);
      Alert.alert(t("common.success"), t("scoutDashboard.messages.reportCreated"));
    } catch (error) {
      Alert.alert(
        t("common.error"),
        getSimpleErrorMessage(error, t("scoutDashboard.messages.reportCreateError")),
      );
    }
  };

  const handleSaveMeeting = async (form: MeetingFormState) => {
    const payload = {
      sessionUserId,
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
      if (editingMeeting) {
        await updateEvent({ id: editingMeeting._id, ...payload });
      } else {
        await createEvent(payload);
      }
      setEditingMeeting(null);
      setMeetingModalVisible(false);
      Alert.alert(t("common.success"), t("scoutDashboard.messages.meetingSaved"));
    } catch (error) {
      Alert.alert(
        t("common.error"),
        getSimpleErrorMessage(error, t("scoutDashboard.messages.meetingSaveError")),
      );
    }
  };

  const handleDeleteMeeting = async () => {
    if (!editingMeeting) return;
    try {
      await deleteEvent({ sessionUserId, id: editingMeeting._id });
      setEditingMeeting(null);
      setMeetingModalVisible(false);
      Alert.alert(t("common.success"), t("scoutDashboard.messages.meetingDeleted"));
    } catch (error) {
      Alert.alert(
        t("common.error"),
        getSimpleErrorMessage(error, t("scoutDashboard.messages.meetingDeleteError")),
      );
    }
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
              {t("scoutDashboard.title")}
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 4, lineHeight: 20 }}>
              {t("scoutDashboard.subtitle")}
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
            <StatCard
              icon="eye-outline"
              label={t("scoutDashboard.kpis.observed")}
              value={observedAthletes.length}
              color={colors.primary}
              colors={colors}
            />
            <StatCard
              icon="document-text-outline"
              label={t("scoutDashboard.kpis.reports")}
              value={reports.length}
              color={colors.success}
              colors={colors}
            />
            <StatCard
              icon="calendar-outline"
              label={t("scoutDashboard.kpis.meetings")}
              value={upcomingMeetings.length}
              color={colors.warning}
              colors={colors}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
            <ActionButton
              icon="document-text-outline"
              label={t("scoutDashboard.actions.newReport")}
              onPress={() => openReportModal()}
              colors={colors}
            />
            <ActionButton
              icon="calendar-outline"
              label={t("scoutDashboard.actions.newMeeting")}
              onPress={() => {
                setEditingMeeting(null);
                setMeetingModalVisible(true);
              }}
              colors={colors}
            />
          </View>

          <Section
            title={t("scoutDashboard.sections.athletes")}
            actionLabel={t("scoutDashboard.actions.addPlayer")}
            onAction={() => setAddAthleteModalVisible(true)}
            colors={colors}
          >
            <TextInput
              value={athleteSearch}
              onChangeText={setAthleteSearch}
              placeholder={t("scoutDashboard.searchPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                color: colors.text,
                padding: 12,
                marginBottom: 12,
              }}
            />
            {filteredAthletes.length === 0 ? (
              <EmptyText text={t("scoutDashboard.empty.athletes")} colors={colors} />
            ) : (
              filteredAthletes.slice(0, 6).map((athlete) => (
                <AthleteRow
                  key={athlete._id}
                  athlete={athlete}
                  colors={colors}
                  onOpen={() => handleOpenAthlete(athlete.userId)}
                  onReport={() => openReportModal(athlete.userId)}
                />
              ))
            )}
          </Section>

          <Section
            title={t("scoutDashboard.sections.reports")}
            actionLabel={t("scoutDashboard.actions.addReport")}
            onAction={() => openReportModal()}
            colors={colors}
          >
            {reports.length === 0 ? (
              <EmptyText text={t("scoutDashboard.empty.reports")} colors={colors} />
            ) : (
              reports.slice(0, 5).map((report) => (
                <View key={report._id} style={rowStyle(colors)}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                      {report.athlete?.full_name || t("scoutDashboard.labels.athlete")}
                    </Text>
                    <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                      {formatReportMeta(report, t)}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={{ color: colors.textMuted, marginTop: 6, lineHeight: 19 }}
                    >
                      {report.content}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Section>

          <Section title={t("scoutDashboard.sections.meetings")} colors={colors}>
            {upcomingMeetings.length === 0 ? (
              <EmptyText text={t("scoutDashboard.empty.meetings")} colors={colors} />
            ) : (
              upcomingMeetings.slice(0, 5).map((event) => (
                <TouchableOpacity
                  key={event._id}
                  style={rowStyle(colors)}
                  onPress={() => {
                    setEditingMeeting(event);
                    setMeetingModalVisible(true);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }}>
                      {event.title}
                    </Text>
                    <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                      {event.date} · {event.start_time} - {event.end_time}
                    </Text>
                    <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                      {event.location || t("scoutDashboard.labels.noLocation")} ·{" "}
                      {t(`scoutDashboard.eventTypes.${event.type}`)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </Section>
        </ScrollView>
      </SafeAreaView>

      <ReportModal
        visible={reportModalVisible}
        sessionUserId={sessionUserId}
        initialAthleteId={selectedReportAthleteId}
        onClose={() => {
          setSelectedReportAthleteId(null);
          setReportModalVisible(false);
        }}
        onSave={handleSaveReport}
      />
      <AddAthleteModal
        visible={addAthleteModalVisible}
        sessionUserId={sessionUserId}
        observedAthleteIds={new Set(observedAthletes.map((athlete) => athlete.userId))}
        onClose={() => setAddAthleteModalVisible(false)}
        onAdd={handleAddObservedAthlete}
      />
      <MeetingModal
        visible={meetingModalVisible}
        event={editingMeeting}
        onClose={() => {
          setEditingMeeting(null);
          setMeetingModalVisible(false);
        }}
        onDelete={editingMeeting ? handleDeleteMeeting : undefined}
        onSave={handleSaveMeeting}
      />
    </LinearGradient>
  );
}

function AddAthleteModal({
  observedAthleteIds,
  onAdd,
  onClose,
  sessionUserId,
  visible,
}: Readonly<{
  observedAthleteIds: Set<Id<"users">>;
  onAdd: (athleteId: Id<"users">) => void;
  onClose: () => void;
  sessionUserId: Id<"users">;
  visible: boolean;
}>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [athleteQuery, setAthleteQuery] = useState("");
  const shouldSearchAthletes = athleteQuery.trim().length >= 2;
  const searchedAthletes = (useQuery(
    api.scout.searchAthletesAdvanced,
    shouldSearchAthletes
      ? {
          sessionUserId,
          query: athleteQuery.trim(),
          limit: 20,
        }
      : "skip",
  ) ?? []) as Athlete[];

  useEffect(() => {
    if (!visible) return;
    setAthleteQuery("");
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ModalShell>
        <ScrollView style={{ maxHeight: "90%" }} contentContainerStyle={modalContentStyle(colors)}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
            {t("scoutDashboard.addPlayerForm.title")}
          </Text>
          <TextInput
            value={athleteQuery}
            onChangeText={setAthleteQuery}
            placeholder={t("scoutDashboard.reportForm.searchPlayer")}
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              color: colors.text,
              padding: 12,
              marginBottom: 12,
            }}
          />

          <View style={{ gap: 8, marginBottom: 16 }}>
            {!shouldSearchAthletes ? (
              <EmptyText text={t("scoutDashboard.empty.playerSearchHint")} colors={colors} />
            ) : searchedAthletes.length === 0 ? (
              <EmptyText text={t("scoutDashboard.empty.playerSearch")} colors={colors} />
            ) : (
              searchedAthletes.map((athlete) => {
                const alreadyAdded = observedAthleteIds.has(athlete.userId);
                return (
                  <View
                    key={athlete._id}
                    style={{
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 10,
                      backgroundColor: colors.bg,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: "700" }}>
                        {athlete.user?.full_name || t("scoutDashboard.labels.athlete")}
                      </Text>
                      <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                        {athlete.position || t("scoutDashboard.labels.noPosition")}
                        {athlete.team?.name ? ` · ${athlete.team.name}` : ""}
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={alreadyAdded}
                      onPress={() => onAdd(athlete.userId)}
                      style={{
                        backgroundColor: alreadyAdded ? colors.border : colors.primary,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        minHeight: 36,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: alreadyAdded ? colors.textMuted : "#fff", fontWeight: "700" }}>
                        {alreadyAdded
                          ? t("scoutDashboard.addPlayerForm.added")
                          : t("scoutDashboard.addPlayerForm.add")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: colors.bg,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
            }}
            onPress={onClose}
          >
            <Text style={{ color: colors.text, fontWeight: "700" }}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </ModalShell>
    </Modal>
  );
}

function ReportModal({
  initialAthleteId,
  onClose,
  onSave,
  sessionUserId,
  visible,
}: Readonly<{
  initialAthleteId?: Id<"users"> | null;
  onClose: () => void;
  onSave: (form: ReportFormState) => void;
  sessionUserId: Id<"users">;
  visible: boolean;
}>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [form, setForm] = useState<ReportFormState>(emptyReportForm);
  const [errors, setErrors] = useState<ValidationErrors<ReportFormField>>({});
  const [athleteQuery, setAthleteQuery] = useState("");
  const shouldSearchAthletes = athleteQuery.trim().length >= 2;
  const searchedAthletes = (useQuery(
    api.scout.searchAthletesAdvanced,
    shouldSearchAthletes
      ? {
          sessionUserId,
          query: athleteQuery.trim(),
          limit: 20,
        }
      : "skip",
  ) ?? []) as Athlete[];

  useEffect(() => {
    if (!visible) return;
    setForm({
      ...emptyReportForm,
      athleteId: initialAthleteId || "",
    });
    setAthleteQuery("");
    setErrors({});
  }, [initialAthleteId, visible]);

  const setField = <Field extends keyof ReportFormState>(
    field: Field,
    value: ReportFormState[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateAndSave = () => {
    const nextErrors: ValidationErrors<ReportFormField> = {};
    if (!form.athleteId) nextErrors.athleteId = t("scoutDashboard.validation.athleteRequired");
    nextErrors.position = optionalText(form.position, t("scoutDashboard.labels.position"), 80);
    nextErrors.strengths = optionalText(form.strengths, t("scoutDashboard.labels.strengths"));
    nextErrors.weaknesses = optionalText(form.weaknesses, t("scoutDashboard.labels.weaknesses"));
    nextErrors.content = requiredText(form.content, t("scoutDashboard.labels.notes"));

    if (form.rating.trim()) {
      const rating = Number(form.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        nextErrors.rating = t("scoutDashboard.validation.ratingRange");
      }
    }

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as ReportFormField]) delete nextErrors[key as ReportFormField];
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ModalShell>
        <ScrollView style={{ maxHeight: "90%" }} contentContainerStyle={modalContentStyle(colors)}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
            {t("scoutDashboard.reportForm.title")}
          </Text>

          <Text style={labelStyle(colors)}>{t("scoutDashboard.labels.athlete")}</Text>
          <TextInput
            value={athleteQuery}
            onChangeText={(text) => {
              setAthleteQuery(text);
              setField("athleteId", "");
            }}
            placeholder={t("scoutDashboard.reportForm.searchPlayer")}
            placeholderTextColor={colors.textMuted}
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 12,
              color: colors.text,
              padding: 12,
              marginBottom: 10,
            }}
          />
          <View style={{ gap: 8, marginBottom: 12 }}>
            {!shouldSearchAthletes ? (
              <EmptyText text={t("scoutDashboard.empty.playerSearchHint")} colors={colors} />
            ) : searchedAthletes.length === 0 ? (
              <EmptyText text={t("scoutDashboard.empty.playerSearch")} colors={colors} />
            ) : (
              searchedAthletes.map((athlete) => {
                const selected = form.athleteId === athlete.userId;
                return (
                  <TouchableOpacity
                    key={athlete._id}
                    style={{
                      borderColor: selected ? colors.primary : colors.border,
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 10,
                      backgroundColor: selected ? `${colors.primary}22` : colors.bg,
                    }}
                    onPress={() => setField("athleteId", athlete.userId)}
                  >
                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                      {athlete.user?.full_name || t("scoutDashboard.labels.athlete")}
                    </Text>
                    <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                      {athlete.position || t("scoutDashboard.labels.noPosition")}
                      {athlete.team?.name ? ` · ${athlete.team.name}` : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          <FormErrorText error={errors.athleteId} />

          <ScoutTextInput
            label={t("scoutDashboard.labels.position")}
            value={form.position}
            onChangeText={(text) => setField("position", text)}
            placeholder={t("scoutDashboard.placeholders.position")}
            error={errors.position}
          />
          <ScoutTextInput
            label={t("scoutDashboard.labels.rating")}
            value={form.rating}
            onChangeText={(text) => setField("rating", text)}
            placeholder={t("scoutDashboard.placeholders.rating")}
            keyboardType="numeric"
            error={errors.rating}
          />
          <ScoutTextInput
            label={t("scoutDashboard.labels.strengths")}
            value={form.strengths}
            onChangeText={(text) => setField("strengths", text)}
            placeholder={t("scoutDashboard.placeholders.strengths")}
            error={errors.strengths}
          />
          <ScoutTextInput
            label={t("scoutDashboard.labels.weaknesses")}
            value={form.weaknesses}
            onChangeText={(text) => setField("weaknesses", text)}
            placeholder={t("scoutDashboard.placeholders.weaknesses")}
            error={errors.weaknesses}
          />
          <ScoutTextInput
            label={t("scoutDashboard.labels.notes")}
            value={form.content}
            onChangeText={(text) => setField("content", text)}
            placeholder={t("scoutDashboard.placeholders.notes")}
            multiline
            error={errors.content}
          />

          <ModalActions
            onCancel={onClose}
            onSave={validateAndSave}
            saveLabel={t("scoutDashboard.reportForm.save")}
          />
        </ScrollView>
      </ModalShell>
    </Modal>
  );
}

function MeetingModal({
  event,
  onClose,
  onDelete,
  onSave,
  visible,
}: Readonly<{
  event?: ScoutEvent | null;
  onClose: () => void;
  onDelete?: () => void;
  onSave: (form: MeetingFormState) => void;
  visible: boolean;
}>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [form, setForm] = useState<MeetingFormState>(emptyMeetingForm);
  const [errors, setErrors] = useState<ValidationErrors<MeetingFormField>>({});

  useEffect(() => {
    if (!visible) return;
    setForm({
      title: event?.title || "",
      date: event?.date || "",
      start_time: event?.start_time || "",
      end_time: event?.end_time || "",
      type: event?.type || "meeting",
      location: event?.location || "",
      notes: event?.notes || event?.description || "",
    });
    setErrors({});
  }, [event, visible]);

  const setField = <Field extends keyof MeetingFormState>(
    field: Field,
    value: MeetingFormState[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, schedule: undefined }));
  };

  const validateAndSave = () => {
    const nextErrors: ValidationErrors<MeetingFormField> = {};
    const originalStart = event ? parseEventDateTime(event.date, event.start_time) : null;
    const allowHistoricalEdit = Boolean(event && originalStart && originalStart.getTime() < Date.now());

    nextErrors.title = requiredText(form.title, t("scoutDashboard.labels.title"));
    nextErrors.location = optionalText(form.location, t("scoutDashboard.labels.location"), 120);
    nextErrors.notes = optionalText(form.notes, t("scoutDashboard.labels.notes"));

    if (!form.date) nextErrors.date = t("scoutDashboard.validation.dateRequired");
    if (!form.start_time) nextErrors.start_time = t("scoutDashboard.validation.startRequired");
    if (!form.end_time) nextErrors.end_time = t("scoutDashboard.validation.endRequired");

    if (form.date && form.start_time && form.end_time) {
      if (allowHistoricalEdit) {
        const start = parseEventDateTime(form.date, form.start_time);
        const end = parseEventDateTime(form.date, form.end_time);
        if (!start || !end) nextErrors.schedule = t("scoutDashboard.validation.invalidSchedule");
        else if (end.getTime() <= start.getTime()) {
          nextErrors.schedule = t("scoutDashboard.validation.endAfterStart");
        }
      } else {
        nextErrors.schedule = eventDateTimeErrors(form.date, form.start_time, form.end_time);
      }
    }

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key as MeetingFormField]) delete nextErrors[key as MeetingFormField];
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(form);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ModalShell>
        <ScrollView style={{ maxHeight: "90%" }} contentContainerStyle={modalContentStyle(colors)}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
            {event ? t("scoutDashboard.meetingForm.editTitle") : t("scoutDashboard.meetingForm.title")}
          </Text>
          <ScoutTextInput
            label={t("scoutDashboard.labels.title")}
            value={form.title}
            onChangeText={(text) => setField("title", text)}
            placeholder={t("scoutDashboard.placeholders.meetingTitle")}
            error={errors.title}
          />
          <DateField
            label={t("scoutDashboard.labels.date")}
            value={form.date}
            onChange={(value) => setField("date", value)}
            placeholder={t("scoutDashboard.placeholders.date")}
            error={errors.date}
            minimumDate={event ? undefined : new Date()}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TimeField
                label={t("scoutDashboard.labels.start")}
                value={form.start_time}
                onChange={(value) => setField("start_time", value)}
                placeholder={t("scoutDashboard.placeholders.time")}
                error={errors.start_time}
                referenceDate={form.date}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TimeField
                label={t("scoutDashboard.labels.end")}
                value={form.end_time}
                onChange={(value) => setField("end_time", value)}
                placeholder={t("scoutDashboard.placeholders.time")}
                error={errors.end_time}
                referenceDate={form.date}
              />
            </View>
          </View>
          <FormErrorText error={errors.schedule} />
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {(["meeting", "other"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setField("type", type)}
                style={{
                  flex: 1,
                  backgroundColor: form.type === type ? colors.primary : colors.bg,
                  borderColor: form.type === type ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderRadius: 10,
                  minHeight: 42,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: form.type === type ? "#fff" : colors.text, fontWeight: "700" }}>
                  {t(`scoutDashboard.eventTypes.${type}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScoutTextInput
            label={t("scoutDashboard.labels.location")}
            value={form.location}
            onChangeText={(text) => setField("location", text)}
            placeholder={t("scoutDashboard.placeholders.location")}
            error={errors.location}
          />
          <ScoutTextInput
            label={t("scoutDashboard.labels.notes")}
            value={form.notes}
            onChangeText={(text) => setField("notes", text)}
            placeholder={t("scoutDashboard.placeholders.meetingNotes")}
            multiline
            error={errors.notes}
          />
          <ModalActions
            onCancel={onClose}
            onSave={validateAndSave}
            saveLabel={t("scoutDashboard.meetingForm.save")}
          />
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
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                {t("scoutDashboard.meetingForm.delete")}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </ModalShell>
    </Modal>
  );
}

function StatCard({
  color,
  colors,
  icon,
  label,
  value,
}: Readonly<{
  color: string;
  colors: ReturnType<typeof useTheme>["colors"];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}>) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "45%",
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        minHeight: 104,
      }}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ color, fontSize: 24, fontWeight: "700", marginTop: 8 }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

function ActionButton({
  colors,
  icon,
  label,
  onPress,
}: Readonly<{
  colors: ReturnType<typeof useTheme>["colors"];
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}>) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 12,
        minHeight: 48,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
      }}
    >
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={{ color: "#fff", fontWeight: "700", flexShrink: 1 }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({
  actionLabel,
  children,
  colors,
  onAction,
  title,
}: Readonly<{
  actionLabel?: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>["colors"];
  onAction?: () => void;
  title: string;
}>) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700", flex: 1 }}>{title}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity onPress={onAction}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function AthleteRow({
  athlete,
  colors,
  onOpen,
  onReport,
}: Readonly<{
  athlete: Athlete;
  colors: ReturnType<typeof useTheme>["colors"];
  onOpen: () => void;
  onReport: () => void;
}>) {
  const { t } = useTranslation();
  const name = athlete.user?.full_name || t("scoutDashboard.labels.athlete");

  return (
    <View style={rowStyle(colors)}>
      <TouchableOpacity onPress={onOpen} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
            {athlete.position || t("scoutDashboard.labels.noPosition")}
            {athlete.team?.name ? ` · ${athlete.team.name}` : ""}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onReport}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function ScoutTextInput({
  error,
  label,
  multiline,
  ...props
}: Readonly<
  {
    error?: string;
    label: string;
    multiline?: boolean;
  } & React.ComponentProps<typeof TextInput>
>) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={labelStyle(colors)}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        style={[
          {
            backgroundColor: colors.bg,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: 1,
            borderRadius: 12,
            color: colors.text,
            padding: 12,
            minHeight: multiline ? 96 : 46,
            textAlignVertical: multiline ? "top" : "center",
          },
          props.style,
        ]}
      />
      <FormErrorText error={error} />
    </View>
  );
}

function ModalShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {children}
    </View>
  );
}

function ModalActions({
  onCancel,
  onSave,
  saveLabel,
}: Readonly<{
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
        onPress={onCancel}
      >
        <Text style={{ color: colors.text, fontWeight: "700" }}>{t("common.cancel")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: colors.primary,
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
        onPress={onSave}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>{saveLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyText({
  colors,
  text,
}: Readonly<{
  colors: ReturnType<typeof useTheme>["colors"];
  text: string;
}>) {
  return <Text style={{ color: colors.textMuted, lineHeight: 20 }}>{text}</Text>;
}

function rowStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingVertical: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
  };
}

function modalContentStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
  };
}

function labelStyle(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700" as const,
    marginBottom: 6,
  };
}

function splitList(value: string) {
  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function formatReportMeta(report: ScoutReport, t: ReturnType<typeof useTranslation>["t"]) {
  const parts = [
    report.position || t("scoutDashboard.labels.noPosition"),
    report.rating ? `${report.rating}/5` : undefined,
    new Date(report.createdAt).toLocaleDateString(),
  ].filter(Boolean);
  return parts.join(" · ");
}
