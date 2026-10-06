import { request } from "./http";
import type { AuthResponse, User } from "../types/auth";

export const authApi = {
  login(payload: { email: string; password: string; role: "citizen" | "admin" }): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  register(payload: { name: string; email: string; password: string }): Promise<User> {
    return request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  me(): Promise<User> {
    return request<User>("/api/auth/me");
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};
