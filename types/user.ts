export type AccountType = "JOGADOR" | "TREINADOR" | "OLHEIRO";

export const ROLE_TO_ACCOUNT_TYPE: Record<string, AccountType> = {
  PLAYER: "JOGADOR",
  COACH: "TREINADOR",
  SCOUT: "OLHEIRO",
};

export const ACCOUNT_TYPE_TO_ROLE: Record<AccountType, string> = {
  JOGADOR: "PLAYER",
  TREINADOR: "COACH",
  OLHEIRO: "SCOUT",
};

export interface User {
  id: string;
  _id?: string;
  email: string;
  full_name: string;
  role: "PLAYER" | "COACH" | "SCOUT";
  avatar?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  push_token?: string;
  is_active: boolean;
  is_public?: boolean;
  created_at: number;
  updated_at: number;
}

export interface UserWithAccountType extends User {
  accountType: AccountType;
}
