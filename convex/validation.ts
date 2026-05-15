const LIMITS = {
  shortText: 80,
  mediumText: 160,
  longText: 500,
  message: 1000,
};

export function cleanText(value: string, label: string, max = LIMITS.shortText) {
  const next = value.replace(/[<>]/g, "").trim();
  if (!next) throw new Error(`${label} is required`);
  if (next.length > max) throw new Error(`${label} is too long`);
  return next;
}

export function cleanOptionalText(
  value: string | undefined,
  label: string,
  max = LIMITS.longText,
) {
  if (value === undefined) return undefined;
  const next = value.replace(/[<>]/g, "").trim();
  if (!next) return undefined;
  if (next.length > max) throw new Error(`${label} is too long`);
  return next;
}

export function assertPositiveInteger(value: number | undefined, label: string) {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

export function assertNonNegativeInteger(value: number | undefined, label: string) {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

export function assertFutureTimestamp(value: number | undefined, label: string) {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value)) throw new Error(`${label} is invalid`);
  if (value < Date.now()) throw new Error(`${label} cannot be in the past`);
  return value;
}

export function parseEventDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("Date and time must be valid");
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) {
    throw new Error("Date and time must be valid");
  }
  return parsed;
}

export function assertEventSchedule(
  date: string,
  startTime: string,
  endTime: string,
  options?: { allowPast?: boolean },
) {
  const start = parseEventDateTime(date, startTime);
  const end = parseEventDateTime(date, endTime);
  if (!options?.allowPast && start.getTime() < Date.now()) {
    throw new Error("Start date and time cannot be in the past");
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error("End time must be after start time");
  }
}
