import { describe, expect, it, vi } from "vitest";
import {
  eventDateTimeErrors,
  futureDateTime,
  nonNegativeInteger,
  parseEventDateTime,
  requiredText,
} from "../utils/formValidation";

describe("formValidation", () => {
  it("validates required text and maximum length", () => {
    expect(requiredText("  ", "Nome")).toBe("Nome é obrigatório.");
    expect(requiredText("abc", "Nome")).toBeUndefined();
    expect(requiredText("abcd", "Nome", 3)).toBe(
      "Nome não pode ter mais de 3 caracteres.",
    );
  });

  it("validates non-negative integer input", () => {
    expect(nonNegativeInteger("", "Pontos")).toBeUndefined();
    expect(nonNegativeInteger("12", "Pontos")).toBeUndefined();
    expect(nonNegativeInteger("-1", "Pontos")).toBe(
      "Pontos tem de ser um número inteiro.",
    );
    expect(nonNegativeInteger("1.5", "Pontos")).toBe(
      "Pontos tem de ser um número inteiro.",
    );
  });

  it("parses valid event date and time and rejects invalid values", () => {
    expect(parseEventDateTime("2026-07-10", "14:30")?.getFullYear()).toBe(2026);
    expect(parseEventDateTime("2026-02-30", "14:30")).toBeNull();
    expect(parseEventDateTime("2026-07-10", "25:30")).toBeNull();
  });

  it("validates future timestamps", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00.000Z"));
    expect(futureDateTime(null, "Data do jogo")).toBe("Data do jogo é obrigatório.");
    expect(futureDateTime(Date.parse("2026-06-22T11:59:00.000Z"), "Data do jogo")).toBe(
      "Data do jogo não pode ser anterior ao momento atual.",
    );
    expect(futureDateTime(Date.parse("2026-06-22T12:01:00.000Z"), "Data do jogo")).toBeUndefined();
    vi.useRealTimers();
  });

  it("validates event schedules", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-22T12:00:00.000Z"));
    expect(eventDateTimeErrors("2026-06-22", "14:30", "15:30")).toBeUndefined();
    expect(eventDateTimeErrors("2026-06-22", "11:30", "12:30")).toBe(
      "A data e hora de início não podem ser anteriores ao momento atual.",
    );
    expect(eventDateTimeErrors("2026-06-22", "13:30", "13:00")).toBe(
      "A hora de fim tem de ser posterior à hora de início.",
    );
    vi.useRealTimers();
  });
});
