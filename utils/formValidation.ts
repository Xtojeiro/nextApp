export type ValidationErrors<T extends string> = Partial<Record<T, string>>;

export const LIMITS = {
  shortText: 80,
  mediumText: 160,
  longText: 500,
  message: 1000,
};

export function trimmed(value: string) {
  return value.trim();
}

export function requiredText(value: string, label: string, max = LIMITS.shortText) {
  const next = trimmed(value);
  if (!next) return `${label} é obrigatório.`;
  if (next.length > max) return `${label} não pode ter mais de ${max} caracteres.`;
  return undefined;
}

export function optionalText(value: string, label: string, max = LIMITS.longText) {
  const next = trimmed(value);
  if (next.length > max) return `${label} não pode ter mais de ${max} caracteres.`;
  return undefined;
}

export function positiveInteger(value: string, label: string, required = false) {
  const next = trimmed(value);
  if (!next) return required ? `${label} é obrigatório.` : undefined;
  if (!/^\d+$/.test(next)) return `${label} tem de ser um número inteiro.`;
  const parsed = Number(next);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return `${label} tem de ser maior que zero.`;
  }
  return undefined;
}

export function nonNegativeInteger(value: string, label: string) {
  const next = trimmed(value);
  if (!next) return undefined;
  if (!/^\d+$/.test(next)) return `${label} tem de ser um número inteiro.`;
  const parsed = Number(next);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return `${label} não pode ser negativo.`;
  }
  return undefined;
}

export function isBeforeNow(timestamp: number, now = Date.now()) {
  return timestamp < now;
}

export function parseEventDateTime(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
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
    return null;
  }

  return parsed;
}

export function futureDateTime(timestamp: number | null, label: string) {
  if (!timestamp) return `${label} é obrigatório.`;
  if (isBeforeNow(timestamp)) return `${label} não pode ser anterior ao momento atual.`;
  return undefined;
}

export function eventDateTimeErrors(date: string, startTime: string, endTime: string) {
  const start = parseEventDateTime(date, startTime);
  const end = parseEventDateTime(date, endTime);

  if (!start || !end) {
    return "A data e as horas têm de ser válidas.";
  }

  if (start.getTime() < Date.now()) {
    return "A data e hora de início não podem ser anteriores ao momento atual.";
  }

  if (end.getTime() <= start.getTime()) {
    return "A hora de fim tem de ser posterior à hora de início.";
  }

  return undefined;
}
