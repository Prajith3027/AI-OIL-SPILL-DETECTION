// ─────────────────────────────────────────────
// Shared HTTP client — attaches the JWT and handles session expiry.
// Authorization is ALWAYS enforced by the backend; this only transports credentials.
// ─────────────────────────────────────────────

export const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "mg_token";

export const tokenStore = {
  get: (): string | null => sessionStorage.getItem(TOKEN_KEY),
  set: (t: string) => sessionStorage.setItem(TOKEN_KEY, t),
  clear: () => sessionStorage.removeItem(TOKEN_KEY),
};

/** Fired when the API rejects the current token (expired / invalid / deactivated). */
export const SESSION_EXPIRED_EVENT = "mg:session-expired";

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(`API ${status}: ${detail}`);
    this.status = status;
    this.detail = detail;
  }
}

function extractDetail(body: string): string {
  try {
    const j = JSON.parse(body);
    if (typeof j.detail === "string") return j.detail;
    if (Array.isArray(j.detail)) return j.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("; ");
  } catch {
    /* not JSON */
  }
  return body;
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = isFormData ? {} : { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    // 401 on any authenticated call = invalid / expired token -> force re-login.
    if (res.status === 401 && token && !path.startsWith("/api/auth/login")) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    if (path.startsWith("/api/auth") || path.startsWith("/api/citizen") || path.startsWith("/api/admin") || path.startsWith("/api/public")) {
      throw new ApiError(res.status, extractDetail(body));
    }
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}
