import useTheme from "@/hooks/useTheme";
import type {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { createElement, type ComponentType, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

type NativeDateTimePickerComponent = ComponentType<any>;

function getNativeDateTimePicker(): NativeDateTimePickerComponent {
  // Loaded lazily so the unsupported native picker module is never evaluated on web.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@react-native-community/datetimepicker").default;
}

const TIME_STEP_MINUTES = 15;

function roundToStep(date: Date) {
  const next = new Date(date);
  const minutes = next.getMinutes();
  const rounded = Math.round(minutes / TIME_STEP_MINUTES) * TIME_STEP_MINUTES;
  next.setMinutes(rounded, 0, 0);
  return next;
}

function withTime(baseDate: Date, time: Date) {
  const next = new Date(baseDate);
  next.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return next;
}

export function formatDateTimePt(value?: number | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-PT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDatePt(value?: string | null) {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-PT", {
    dateStyle: "medium",
  });
}

export function formatTimePt(value?: string | null) {
  return value || "";
}

export function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeString(value: Date) {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseDateString(value?: string | null) {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function parseTimeString(value?: string | null, referenceDate = new Date()) {
  const date = new Date(referenceDate);
  if (!value) return roundToStep(date);
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return roundToStep(date);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function toDateTimeInputValue(value: Date) {
  return `${toDateString(value)}T${toTimeString(value)}`;
}

function parseDateTimeInputValue(value: string) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  if (![year, month, day, hours, minutes].every(Number.isFinite)) return null;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function getMinimumInputValue(
  type: "date" | "time" | "datetime-local",
  minimumDate?: Date,
) {
  if (!minimumDate) return undefined;
  if (type === "date") return toDateString(minimumDate);
  if (type === "datetime-local") return toDateTimeInputValue(minimumDate);
  return undefined;
}

function WebInput({
  label,
  type,
  value,
  placeholder,
  error,
  minimumDate,
  onChange,
}: Readonly<FieldBaseProps & {
  type: "date" | "time" | "datetime-local";
  value: string;
  onChange: (value: string) => void;
}>) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "600" }}>
        {label}
      </Text>
      {createElement("input", {
        type,
        value,
        placeholder,
        min: getMinimumInputValue(type, minimumDate),
        step: type === "time" || type === "datetime-local" ? TIME_STEP_MINUTES * 60 : undefined,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
        style: {
          backgroundColor: colors.surface,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 12,
          borderStyle: "solid",
          borderWidth: 1,
          boxSizing: "border-box",
          color: colors.text,
          font: "inherit",
          marginBottom: 16,
          outline: "none",
          padding: 14,
          width: "100%",
        },
      })}
      <FormErrorText error={error} />
    </View>
  );
}

type FieldBaseProps = {
  label: string;
  placeholder: string;
  error?: string;
  minimumDate?: Date;
};

export function FormErrorText({ error }: { error?: string }) {
  const { colors } = useTheme();
  if (!error) return null;
  return (
    <Text style={{ color: colors.danger, fontSize: 12, marginTop: -10, marginBottom: 12 }}>
      {error}
    </Text>
  );
}

function FieldButton({
  label,
  value,
  placeholder,
  error,
  onPress,
}: Readonly<Omit<FieldBaseProps, "minimumDate"> & {
  value: string;
  onPress: () => void;
}>) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={{ color: colors.text, marginBottom: 8, fontWeight: "600" }}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: colors.surface,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 14,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: value ? colors.text : colors.textMuted, flex: 1 }}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
      <FormErrorText error={error} />
    </View>
  );
}

export function DateTimeField({
  label,
  value,
  onChange,
  placeholder,
  error,
  minimumDate,
}: Readonly<FieldBaseProps & {
  value: number | null;
  onChange: (value: number) => void;
}>) {
  const [pickerMode, setPickerMode] = useState<"date" | "time" | "datetime" | null>(null);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const selected = value ? new Date(value) : roundToStep(minimumDate || new Date());

  if (Platform.OS === "web") {
    return (
      <WebInput
        label={label}
        type="datetime-local"
        value={value ? toDateTimeInputValue(new Date(value)) : ""}
        onChange={(inputValue) => {
          const parsed = parseDateTimeInputValue(inputValue);
          if (parsed) onChange(roundToStep(parsed).getTime());
        }}
        placeholder={placeholder}
        error={error}
        minimumDate={minimumDate}
      />
    );
  }

  const openPicker = () => setPickerMode(Platform.OS === "android" ? "date" : "datetime");
  const NativeDateTimePicker = getNativeDateTimePicker();

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (!selectedDate) {
      setPickerMode(null);
      setPendingDate(null);
      return;
    }

    if (Platform.OS === "android" && pickerMode === "date") {
      const merged = withTime(selectedDate, value ? new Date(value) : roundToStep(new Date()));
      setPendingDate(merged);
      setPickerMode("time");
      return;
    }

    const next = roundToStep(
      Platform.OS === "android" && pendingDate
        ? withTime(pendingDate, selectedDate)
        : selectedDate,
    );
    setPickerMode(null);
    setPendingDate(null);
    onChange(next.getTime());
  };

  return (
    <View>
      <FieldButton
        label={label}
        value={formatDateTimePt(value)}
        placeholder={placeholder}
        error={error}
        onPress={openPicker}
      />
      {pickerMode ? (
        <NativeDateTimePicker
          value={pickerMode === "time" && pendingDate ? pendingDate : selected}
          mode={pickerMode}
          display="default"
          minimumDate={pickerMode === "time" ? undefined : minimumDate}
          minuteInterval={TIME_STEP_MINUTES}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  error,
  minimumDate,
}: Readonly<FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
}>) {
  const [showPicker, setShowPicker] = useState(false);

  if (Platform.OS === "web") {
    return (
      <WebInput
        label={label}
        type="date"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={error}
        minimumDate={minimumDate}
      />
    );
  }
  const NativeDateTimePicker = getNativeDateTimePicker();

  return (
    <View>
      <FieldButton
        label={label}
        value={formatDatePt(value)}
        placeholder={placeholder}
        error={error}
        onPress={() => setShowPicker(true)}
      />
      {showPicker ? (
        <NativeDateTimePicker
          value={parseDateString(value)}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowPicker(false);
            if (selectedDate) onChange(toDateString(selectedDate));
          }}
        />
      ) : null}
    </View>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  placeholder,
  error,
  referenceDate,
}: Readonly<FieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  referenceDate?: string;
}>) {
  const [showPicker, setShowPicker] = useState(false);
  const parsedReference = parseDateString(referenceDate);

  if (Platform.OS === "web") {
    return (
      <WebInput
        label={label}
        type="time"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={error}
      />
    );
  }
  const NativeDateTimePicker = getNativeDateTimePicker();

  return (
    <View>
      <FieldButton
        label={label}
        value={formatTimePt(value)}
        placeholder={placeholder}
        error={error}
        onPress={() => setShowPicker(true)}
      />
      {showPicker ? (
        <NativeDateTimePicker
          value={parseTimeString(value, parsedReference)}
          mode="time"
          display="default"
          minuteInterval={TIME_STEP_MINUTES}
          onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowPicker(false);
            if (selectedDate) onChange(toTimeString(roundToStep(selectedDate)));
          }}
        />
      ) : null}
    </View>
  );
}
