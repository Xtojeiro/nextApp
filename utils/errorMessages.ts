const TECHNICAL_ERROR_PATTERNS = [
  /^\[CONVEX/i,
  /Uncaught Error/i,
  /Server Error/i,
  /Error:/i,
  /request id/i,
  /stack/i,
];

const ERROR_MESSAGE_MAP: Array<[RegExp, string]> = [
  [/User already exists|already exists|conta .*ja existe|account .*already exists/i, "Esta conta ja existe."],
  [/InvalidSecret|InvalidAccountId|AccountNotFound|Invalid email or password/i, "Email ou palavra-passe incorretos."],
  [/Invalid email format/i, "O email nao e valido."],
  [/Password must be at least|password.*8/i, "A palavra-passe deve ter pelo menos 8 caracteres."],
  [/Passwords do not match/i, "As palavras-passe nao coincidem."],
  [/Name must be at least/i, "O nome deve ter pelo menos 2 caracteres."],
  [/Not authenticated/i, "Tens de iniciar sessao."],
  [/Not authorized|not linked/i, "Nao tens permissao para esta acao."],
  [/not found/i, "Nao foi possivel encontrar este registo."],
  [/already sent/i, "Este convite ja foi enviado."],
  [/already following/i, "Ja segues este utilizador."],
  [/cannot follow yourself|cannot block yourself|yourself/i, "Nao podes fazer esta acao contigo proprio."],
  [/past/i, "A data nao pode estar no passado."],
  [/required|obrigatorio/i, "Preenche os campos obrigatorios."],
  [/too long/i, "O texto e demasiado longo."],
  [/invalid/i, "Os dados introduzidos nao sao validos."],
];

function getRawErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function getSimpleErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado.") {
  const rawMessage = getRawErrorMessage(error).trim();

  if (!rawMessage) return fallback;

  const searchableMessage = rawMessage.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const [pattern, message] of ERROR_MESSAGE_MAP) {
    if (pattern.test(searchableMessage)) return message;
  }

  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(searchableMessage))) {
    return fallback;
  }

  return rawMessage;
}
