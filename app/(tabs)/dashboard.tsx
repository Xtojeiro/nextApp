import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
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
import CoachDashboard from "@/components/CoachDashboard";

// Heat map component
const ActivityHeatmap = ({
  workoutLogs,
  events,
}: {
  workoutLogs: any[];
  events: any[];
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Generate last month of data
  const generateHeatmapData = () => {
    const today = new Date();
    const data = [];
    const activityMap = new Map<string, number>();

    // Count activities per day from workout logs
    workoutLogs.forEach((log) => {
      const date = new Date(log.completed_at).toISOString().split("T")[0];
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    // Count events per day
    events.forEach((event) => {
      if (new Date(event.date) <= today) {
        activityMap.set(event.date, (activityMap.get(event.date) || 0) + 1);
      }
    });

    // Generate last month of days
    for (let i = 122; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = activityMap.get(dateStr) || 0;
      data.push({
        date: dateStr,
        count,
        day: date.getDay(),
        month: date.getMonth(),
        year: date.getFullYear(),
      });
    }

    return data;
  };

  const heatmapData = generateHeatmapData();

  const getIntensityColor = (count: number) => {
    if (count === 0) return colors.surface;
    if (count === 1) return colors.primary + "40"; // Light
    if (count === 2) return colors.primary + "80"; // Medium
    return colors.primary; // High
  };

  const weeks: any[][] = [];
  let currentWeek: any[] = [];
  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    if (day.day === 6 || index === heatmapData.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: colors.text,
          marginBottom: 16,
        }}
      >
        {t("dashboard.activityHeatmap")}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={{ marginRight: 2 }}>
            {week.map((day) => (
              <TouchableOpacity
                key={day.date}
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: getIntensityColor(day.count),
                  margin: 1,
                  borderRadius: 2,
                }}
                onPress={() => {
                  if (day.count > 0) {
                    Alert.alert(
                      new Date(day.date).toLocaleDateString(),
                      `${day.count} ${t("dashboard.totalActivities").toLowerCase()}`,
                    );
                  }
                }}
              />
            ))}
          </View>
        ))}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {t("dashboard.noActivity")}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          {t("dashboard.highActivity")}
        </Text>
      </View>
    </View>
  );
};

// Event Modal Component
const EventModal = ({
  visible,
  onClose,
  onSave,
  onDelete,
  event,
  initialDate,
  initialTime,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  onDelete?: (eventId: string) => void;
  event?: any;
  initialDate?: string;
  initialTime?: string;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: event?.title || "",
    date: event?.date || initialDate || new Date().toISOString().split("T")[0],
    start_time: event?.start_time || initialTime || "",
    end_time: event?.end_time || "",
    is_all_day: event?.is_all_day || false,
    color: event?.color || "",
    type: event?.type || "training",
    notes: event?.notes || "",
    location: event?.location || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setFormData({
        title: event?.title || "",
        date:
          event?.date || initialDate || new Date().toISOString().split("T")[0],
        start_time: event?.start_time || initialTime || "",
        end_time: event?.end_time || "",
        is_all_day: event?.is_all_day || false,
        color: event?.color || "",
        type: event?.type || "training",
        notes: event?.notes || "",
        location: event?.location || "",
      });
      setErrors({});
    }
  }, [visible, event, initialDate, initialTime]);

  const colorOptions = [
    { label: "Default", value: "" },
    { label: "Blue", value: "#3B82F6" },
    { label: "Green", value: "#10B981" },
    { label: "Red", value: "#EF4444" },
    { label: "Yellow", value: "#F59E0B" },
    { label: "Purple", value: "#8B5CF6" },
    { label: "Pink", value: "#EC4899" },
  ];

  const eventTypes = [
    { label: "Training", value: "training" },
    { label: "Game", value: "game" },
    { label: "Medical", value: "medical" },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.is_all_day) {
      if (!formData.start_time) {
        newErrors.start_time = "Start time is required for timed events";
      }
      if (!formData.end_time) {
        newErrors.end_time = "End time is required for timed events";
      }
      if (
        formData.start_time &&
        formData.end_time &&
        formData.start_time >= formData.end_time
      ) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleDelete = () => {
    if (event && onDelete) {
      Alert.alert(
        "Delete Event",
        "Are you sure you want to delete this event?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(event._id),
          },
        ],
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            backgroundColor: colors.bg,
            margin: 20,
            borderRadius: 12,
            maxHeight: "80%",
          }}
        >
          <ScrollView style={{ padding: 20 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 20,
              }}
            >
              {event ? "Edit Event" : "Create Event"}
            </Text>

            {/* Title */}
            <Text style={{ color: colors.text, marginBottom: 8 }}>Title *</Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 4,
              }}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Event title"
              placeholderTextColor={colors.textMuted}
            />
            {errors.title && (
              <Text
                style={{ color: "#EF4444", fontSize: 12, marginBottom: 16 }}
              >
                {errors.title}
              </Text>
            )}

            {/* Date */}
            <Text style={{ color: colors.text, marginBottom: 8 }}>Date *</Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 4,
              }}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
            {errors.date && (
              <Text
                style={{ color: "#EF4444", fontSize: 12, marginBottom: 16 }}
              >
                {errors.date}
              </Text>
            )}

            {/* All Day Toggle */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                style={{
                  width: 50,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: formData.is_all_day
                    ? colors.primary
                    : colors.surface,
                  justifyContent: "center",
                  paddingHorizontal: 2,
                }}
                onPress={() =>
                  setFormData({ ...formData, is_all_day: !formData.is_all_day })
                }
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: "white",
                    transform: [{ translateX: formData.is_all_day ? 26 : 0 }],
                  }}
                />
              </TouchableOpacity>
              <Text style={{ color: colors.text, marginLeft: 12 }}>
                All Day Event
              </Text>
            </View>

            {/* Time Fields */}
            {!formData.is_all_day && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: colors.text, marginBottom: 8 }}>
                      Start Time *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.surface,
                        color: colors.text,
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 4,
                      }}
                      value={formData.start_time}
                      onChangeText={(text) =>
                        setFormData({ ...formData, start_time: text })
                      }
                      placeholder="HH:MM"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.start_time && (
                      <Text style={{ color: "#EF4444", fontSize: 12 }}>
                        {errors.start_time}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ color: colors.text, marginBottom: 8 }}>
                      End Time *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.surface,
                        color: colors.text,
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 4,
                      }}
                      value={formData.end_time}
                      onChangeText={(text) =>
                        setFormData({ ...formData, end_time: text })
                      }
                      placeholder="HH:MM"
                      placeholderTextColor={colors.textMuted}
                    />
                    {errors.end_time && (
                      <Text style={{ color: "#EF4444", fontSize: 12 }}>
                        {errors.end_time}
                      </Text>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Event Type */}
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              Event Type
            </Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Picker
                selectedValue={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                style={{ color: colors.text }}
              >
                {eventTypes.map((type) => (
                  <Picker.Item
                    key={type.value}
                    label={type.label}
                    value={type.value}
                  />
                ))}
              </Picker>
            </View>

            {/* Color */}
            <Text style={{ color: colors.text, marginBottom: 8 }}>Color</Text>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <Picker
                selectedValue={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
                style={{ color: colors.text }}
              >
                {colorOptions.map((color) => (
                  <Picker.Item
                    key={color.value}
                    label={color.label}
                    value={color.value}
                  />
                ))}
              </Picker>
            </View>

            {/* Location */}
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              Location
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              placeholder="Event location"
              placeholderTextColor={colors.textMuted}
            />

            {/* Notes */}
            <Text style={{ color: colors.text, marginBottom: 8 }}>Notes</Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                color: colors.text,
                padding: 12,
                borderRadius: 8,
                marginBottom: 20,
                height: 80,
                textAlignVertical: "top",
              }}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Additional notes"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            {/* Buttons */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  padding: 12,
                  borderRadius: 8,
                  marginRight: 8,
                  alignItems: "center",
                }}
                onPress={onClose}
              >
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  padding: 12,
                  borderRadius: 8,
                  marginLeft: 8,
                  alignItems: "center",
                }}
                onPress={handleSave}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>
            </View>

            {event && onDelete && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#EF4444",
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 12,
                  alignItems: "center",
                }}
                onPress={handleDelete}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  Delete Event
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Comprehensive calendar component
const Calendar = ({
  events,
  onAddEvent,
  onEditEvent,
  onTimeSlotPress,
}: {
  events: any[];
  onAddEvent: () => void;
  onEditEvent: (event: any) => void;
  onTimeSlotPress: (date: string, time: string) => void;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getEventColor = (event: any) => {
    if (event.color) return event.color;
    switch (event.type) {
      case "training":
        return "#3B82F6"; // blue
      case "game":
        return "#10B981"; // green
      case "medical":
        return "#EF4444"; // red
      default:
        return colors.primary;
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === dateStr);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + direction,
        1,
      ),
    );
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const switchToDayView = (date: Date) => {
    setCurrentDate(date);
    setViewMode("day");
  };

  const renderMonthView = () => {
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days = [];

      // Add nulls for days before the first day of the month
      for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
      }

      // Add all days of the month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }

      // Pad the end with nulls to complete the last week
      const totalDays = days.length;
      const remainder = totalDays % 7;
      if (remainder !== 0) {
        const padding = 7 - remainder;
        for (let i = 0; i < padding; i++) {
          days.push(null);
        }
      }

      return days;
    };

    const monthDays = getDaysInMonth(currentDate);

    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }

    return (
      <View>
        {/* Day headers */}
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {dayNames.map((day) => (
            <View key={day} style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={{ flexDirection: "row" }}>
            {week.map((date, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  padding: 4,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => date && switchToDayView(date)}
              >
                {date && (
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: "bold",
                        marginBottom: 4,
                      }}
                    >
                      {date.getDate()}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {getEventsForDate(date)
                        .slice(0, 3)
                        .map((event, i) => (
                          <View
                            key={i}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: getEventColor(event),
                              margin: 1,
                            }}
                          />
                        ))}
                      {getEventsForDate(date).length > 3 && (
                        <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                          ...
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    return (
      <View>
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={{ flex: 1, alignItems: "center", padding: 8 }}
              onPress={() => switchToDayView(day)}
            >
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {dayNames[day.getDay()]}
              </Text>
              <Text
                style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}
              >
                {day.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView style={{ height: 300 }}>
          {weekDays.map((day, index) => (
            <View key={index} style={{ flexDirection: "row", marginBottom: 8 }}>
              <View style={{ width: 60, alignItems: "center" }}>
                <Text style={{ color: colors.text, fontSize: 12 }}>
                  {day.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                {getEventsForDate(day).map((event, i) => (
                  <TouchableOpacity
                    key={i}
                    style={{
                      backgroundColor: getEventColor(event),
                      padding: 8,
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                    onPress={() => onEditEvent(event)}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {event.title}
                    </Text>
                    <Text style={{ color: "white", fontSize: 10 }}>
                      {event.start_time && event.end_time
                        ? `${event.start_time} - ${event.end_time}`
                        : "All day"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <ScrollView style={{ height: 400 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          {currentDate.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
        {hours.map((hour) => (
          <View
            key={hour}
            style={{
              flexDirection: "row",
              height: 60,
              borderBottomWidth: 1,
              borderBottomColor: colors.surface,
            }}
          >
            <View
              style={{ width: 60, justifyContent: "flex-start", paddingTop: 4 }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {hour.toString().padStart(2, "0")}:00
              </Text>
            </View>
            <TouchableOpacity
              style={{ flex: 1, position: "relative" }}
              onPress={() =>
                onTimeSlotPress(
                  currentDate.toISOString().split("T")[0],
                  `${hour.toString().padStart(2, "0")}:00`,
                )
              }
            >
              {dayEvents
                .filter((event) => !event.is_all_day && event.start_time)
                .filter((event) => {
                  const startHour = parseInt(event.start_time.split(":")[0]);
                  return startHour === hour;
                })
                .map((event, i) => {
                  const startMinutes =
                    parseInt(event.start_time.split(":")[1]) || 0;
                  const endMinutes =
                    parseInt(event.end_time.split(":")[1]) || 0;
                  const startHour = parseInt(event.start_time.split(":")[0]);
                  const endHour = parseInt(event.end_time.split(":")[0]);
                  const duration =
                    endHour - startHour + (endMinutes - startMinutes) / 60;
                  const top = (startMinutes / 60) * 60;
                  const height = Math.max(duration * 60, 30);

                  return (
                    <TouchableOpacity
                      key={i}
                      style={{
                        position: "absolute",
                        top,
                        left: 4,
                        right: 4,
                        height,
                        backgroundColor: getEventColor(event),
                        borderRadius: 4,
                        padding: 4,
                        justifyContent: "center",
                      }}
                      onPress={() => onEditEvent(event)}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {event.title}
                      </Text>
                      <Text style={{ color: "white", fontSize: 10 }}>
                        {event.start_time} - {event.end_time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </TouchableOpacity>
          </View>
        ))}
        {/* All-day events */}
        {dayEvents.filter((event) => event.is_all_day).length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 14,
                fontWeight: "bold",
                marginBottom: 8,
              }}
            >
              All Day
            </Text>
            {dayEvents
              .filter((event) => event.is_all_day)
              .map((event, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    backgroundColor: getEventColor(event),
                    padding: 8,
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                  onPress={() => onEditEvent(event)}
                >
                  <Text
                    style={{ color: "white", fontSize: 12, fontWeight: "bold" }}
                  >
                    {event.title}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const getNavigationTitle = () => {
    switch (viewMode) {
      case "month":
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case "week": {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
      }
      case "day":
        return currentDate.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }
  };

  const navigate = (direction: number) => {
    switch (viewMode) {
      case "month":
        navigateMonth(direction);
        break;
      case "week":
        navigateWeek(direction);
        break;
      case "day":
        navigateDay(direction);
        break;
    }
  };

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
          {t("dashboard.calendar")}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
          }}
          onPress={onAddEvent}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            + {t("dashboard.addEvent")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* View mode buttons */}
      <View style={{ flexDirection: "row", marginBottom: 16 }}>
        {(["month", "week", "day"] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={{
              flex: 1,
              padding: 8,
              alignItems: "center",
              backgroundColor:
                viewMode === mode ? colors.primary : colors.surface,
              borderRadius: 4,
              marginHorizontal: 2,
            }}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={{
                color: viewMode === mode ? "white" : colors.text,
                fontSize: 12,
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {mode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Navigation */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <TouchableOpacity onPress={() => navigate(-1)}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>
          {getNavigationTitle()}
        </Text>
        <TouchableOpacity onPress={() => navigate(1)}>
          <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Render view */}
      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}
    </View>
  );
};

export default function Dashboard() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const convexUser = useQuery(api.users.getCurrentUser);

  const workoutLogs = useQuery(api.workouts.getWorkoutLogs) || [];
  const events = useQuery(api.events.getEvents, {}) || [];
  const playerStats = useQuery(api.users.getPlayerStats) || {
    totalWorkouts: 0,
    totalGames: 0,
    weeklyFrequency: 0,
    monthlyFrequency: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
  const coachDashboard = useQuery(api.users.getCoachDashboard) || {
    totalAthletes: 0,
    activeAthletes: 0,
    inactiveAthletes: 0,
    averageWeeklyFrequency: 0,
    upcomingTrainings: 0,
    upcomingGames: 0,
    lowActivityAlerts: 0,
  };
  const teamAthletes = useQuery(api.users.getTeamAthletes) || [];
  const createEventMutation = useMutation(api.events.createEvent);
  const updateEventMutation = useMutation(api.events.updateEvent);
  const deleteEventMutation = useMutation(api.events.deleteEvent);

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string>("");
  const [modalInitialTime, setModalInitialTime] = useState<string>("");

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now);
    thisWeek.setDate(now.getDate() - now.getDay());

    const totalActivities =
      workoutLogs.length + events.filter((e) => new Date(e.date) <= now).length;

    const monthActivities =
      workoutLogs.filter((log) => new Date(log.completed_at) >= thisMonth)
        .length +
      events.filter(
        (event) =>
          new Date(event.date) >= thisMonth && new Date(event.date) <= now,
      ).length;

    const weekActivities =
      workoutLogs.filter((log) => new Date(log.completed_at) >= thisWeek)
        .length +
      events.filter(
        (event) =>
          new Date(event.date) >= thisWeek && new Date(event.date) <= now,
      ).length;

    // Calculate streak (simplified)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const hasActivity =
        workoutLogs.some(
          (log) =>
            new Date(log.completed_at).toISOString().split("T")[0] === dateStr,
        ) || events.some((event) => event.date === dateStr);

      if (hasActivity) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return { totalActivities, monthActivities, weekActivities, streak };
  }, [workoutLogs, events]);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setModalInitialDate("");
    setModalInitialTime("");
    setShowEventModal(true);
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setModalInitialDate("");
    setModalInitialTime("");
    setShowEventModal(true);
  };

  const handleTimeSlotPress = (date: string, time: string) => {
    setEditingEvent(null);
    setModalInitialDate(date);
    setModalInitialTime(time);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (editingEvent) {
        await updateEventMutation({ id: editingEvent._id, ...eventData });
        Alert.alert("Success", "Event updated!");
      } else {
        await createEventMutation(eventData);
        Alert.alert("Success", "Event created!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save event");
    }
  };

  const handleDeleteEvent = async (eventId: any) => {
    try {
      await deleteEventMutation({ id: eventId });
      setShowEventModal(false);
      Alert.alert("Success", "Event deleted!");
    } catch (error) {
      Alert.alert("Error", "Failed to delete event");
    }
  };

  // Show loading or redirect if no user
  if (!convexUser) {
    return null;
  }

  // Coach Dashboard
  if (convexUser?.role === "COACH") {
    return (
      <CoachDashboard
        coachDashboard={coachDashboard}
        teamAthletes={teamAthletes}
        colors={colors}
        t={t}
      />
    );
  }

  // Player Dashboard (existing code)
  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: colors.text,
                marginBottom: 4,
              }}
            >
              {t("dashboard.title")}
            </Text>
            <Text style={{ color: colors.textMuted }}>
              {t("dashboard.subtitle")}
            </Text>
          </View>

          {/* Stats Cards - First Row */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginRight: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.primary, fontSize: 24, fontWeight: "bold" }}
              >
                {playerStats.totalWorkouts}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Treinos
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 4,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.success, fontSize: 24, fontWeight: "bold" }}
              >
                {playerStats.totalGames}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Jogos
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 4,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.warning, fontSize: 24, fontWeight: "bold" }}
              >
                {playerStats.weeklyFrequency}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                / Semana
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginLeft: 8,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: colors.text, fontSize: 24, fontWeight: "bold" }}
              >
                {playerStats.monthlyFrequency}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                / Mês
              </Text>
            </View>
          </View>

          {/* Stats Cards - Second Row */}
          <View style={{ flexDirection: "row", marginBottom: 24 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginRight: 8,
                alignItems: "center",
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <Text
                style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}
              >
                🔥 {playerStats.currentStreak}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Streak Atual
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginLeft: 8,
                alignItems: "center",
                borderLeftWidth: 4,
                borderLeftColor: colors.success,
              }}
            >
              <Text
                style={{ color: colors.text, fontSize: 20, fontWeight: "bold" }}
              >
                ⭐ {playerStats.bestStreak}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                Melhor Streak
              </Text>
            </View>
          </View>

          {/* Heat Map */}
          <ActivityHeatmap workoutLogs={workoutLogs} events={events} />

          {/* Calendar */}
          <Calendar
            events={events}
            onAddEvent={handleAddEvent}
            onEditEvent={handleEditEvent}
            onTimeSlotPress={handleTimeSlotPress}
          />
        </ScrollView>

        {/* Event Modal */}
        <EventModal
          visible={showEventModal}
          onClose={() => setShowEventModal(false)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
          event={editingEvent}
          initialDate={modalInitialDate}
          initialTime={modalInitialTime}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
