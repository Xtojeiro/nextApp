import { describe, expect, it } from "vitest";
import { getSimpleErrorMessage } from "../utils/errorMessages";

describe("getSimpleErrorMessage", () => {
  it("maps duplicate email errors to a user-facing message", () => {
    expect(getSimpleErrorMessage(new Error("Email already in use"))).toBe(
      "Este email ja esta associado a uma conta.",
    );
  });

  it("maps authentication errors to a user-facing message", () => {
    expect(getSimpleErrorMessage(new Error("Invalid email or password"))).toBe(
      "Email ou palavra-passe incorretos.",
    );
  });

  it("hides technical Convex messages behind the fallback", () => {
    expect(getSimpleErrorMessage("[CONVEX Q(users:get)] Server Error", "Falhou.")).toBe(
      "Falhou.",
    );
  });

  it("returns unknown non-technical messages unchanged", () => {
    expect(getSimpleErrorMessage("Mensagem simples")).toBe("Mensagem simples");
  });
});
