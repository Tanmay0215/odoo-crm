import { LoginInput, RegisterInput } from "@repo/schemas";
import { apiFetch } from "./client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authClient = {
  login: (data: LoginInput) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: RegisterInput) =>
    apiFetch<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () =>
    apiFetch<{ user: User }>("/auth/me", {
      method: "GET",
    }),
};
