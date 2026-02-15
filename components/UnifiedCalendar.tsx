import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  type: "game" | "training" | "meeting" | "other";
  description?: string;
}

interface UnifiedCalendarProps {
  events: CalendarEvent[];
  games: CalendarEvent[];
  onEventPress?: (event: CalendarEvent) => void;
  onAddEvent?: (event: Partial<CalendarEvent>) => void;
}

export default function UnifiedCalendar({
  events,
  games,
  onEventPress,
  onAddEvent,
}: UnifiedCalendarProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

  const allItems = [...events, ...games].sort(
    (a, b) => new Date(a.date + "T" + a.start_time).getTime() - new Date(b.date + "T" + b.start_time).getTime()
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDate = (day: number | null) => {
    if (!day) return null;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toISOString().split("T")[0];
  };

  const getItemsForDate = (dateStr: string | null) => {
    if (!dateStr) return [];
    return allItems.filter((item) => item.date === dateStr);
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const getTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "game":
        return colors.success;
      case "training":
        return colors.primary;
      case "meeting":
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const getTypeIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "game":
        return "football";
      case "training":
        return "barbell";
      case "meeting":
        return "people";
      default:
        return "calendar";
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("dashboard.calendar")}
        </Text>
        <View style={styles.monthNavigation}>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            style={styles.navButton}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekDays}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
          <Text key={i} style={[styles.weekDay, { color: colors.textMuted }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {getDaysInMonth(currentMonth).map((day, index) => {
          const dateStr = formatDate(day);
          const dayItems = getItemsForDate(dateStr);
          const hasItems = dayItems.length > 0;
          const isSelected = selectedDate === dateStr;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day === null && styles.emptyDay,
                isSelected && { backgroundColor: colors.primary + "20" },
              ]}
              onPress={() => day && setSelectedDate(dateStr)}
              disabled={!day}
            >
              {day && (
                <>
                  <Text
                    style={[
                      styles.dayText,
                      { color: colors.text },
                      hasItems && { fontWeight: "bold" },
                    ]}
                  >
                    {day}
                  </Text>
                  {hasItems && (
                    <View style={styles.itemIndicators}>
                      {dayItems.slice(0, 3).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.indicator,
                            { backgroundColor: getTypeColor(dayItems[i].type) },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedDate && (
        <View style={styles.selectedDayDetails}>
          <Text style={[styles.selectedDateTitle, { color: colors.text }]}>
            {new Date(selectedDate).toLocaleDateString("pt-PT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
          {getItemsForDate(selectedDate).map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.eventCard, { borderLeftColor: getTypeColor(item.type) }]}
              onPress={() => onEventPress?.(item)}
            >
              <Ionicons
                name={getTypeIcon(item.type) as any}
                size={20}
                color={getTypeColor(item.type)}
              />
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.eventTime, { color: colors.textMuted }]}>
                  {item.start_time} {item.end_time && `- ${item.end_time}`}
                </Text>
                {item.location && (
                  <Text style={[styles.eventLocation, { color: colors.textMuted }]}>
                    {item.location}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {getItemsForDate(selectedDate).length === 0 && (
            <Text style={[styles.noEvents, { color: colors.textMuted }]}>
              {t("dashboard.noActivity")}
            </Text>
          )}
        </View>
      )}

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("dashboard.addEvent")}
            </Text>
            <TextInput
              placeholder={t("dashboard.eventDetails")}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                style={[styles.modalButton, { backgroundColor: colors.danger }]}
              >
                <Text style={styles.modalButtonText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                }}
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.modalButtonText}>{t("dashboard.create")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import { useState } from "react";

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekDay: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    width: 40,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginBottom: 4,
  },
  emptyDay: {
    opacity: 0,
  },
  dayText: {
    fontSize: 14,
  },
  itemIndicators: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  selectedDayDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  eventInfo: {
    marginLeft: 12,
    flex: 1,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  eventTime: {
    fontSize: 12,
    marginTop: 2,
  },
  eventLocation: {
    fontSize: 11,
    marginTop: 2,
  },
  noEvents: {
    textAlign: "center",
    paddingVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
