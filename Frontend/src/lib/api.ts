import type {
  ChatMessage,
  JoinRecord,
  Member,
  MessagesPage,
  Pagination,
  Plan,
  PlanDetail,
  PlanInput,
  Subscription,
  User,
} from "@/types";

const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000").replace(/\/+$/, "");
export const API_ORIGIN = BASE;

const TOKEN_KEY = "chal.token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiException extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiException";
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;
interface Options {
  method?: string;
  body?: unknown;
  query?: Query;
  retry?: boolean;
}

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch(`${BASE}/api/users/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const json = await res.json();
        const token = json?.data?.accessToken as string | undefined;
        if (!token) return false;
        tokenStore.set(token);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

const AUTH_PATHS = ["/users/login", "/users/register", "/users/refresh-token"];

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, query, retry = true } = opts;
  const url = new URL(`${BASE}/api${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: payload, credentials: "include" });
  } catch {
    throw new ApiException(0, "Can't reach the server. Check your connection and try again.");
  }

  if (res.status === 401 && retry && !AUTH_PATHS.some((p) => path.startsWith(p))) {
    if (await refreshSession()) return request<T>(path, { ...opts, retry: false });
    if (tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event("chal:logout"));
    }
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiException(res.status, (json?.message as string | undefined) ?? "Something went wrong. Please try again.");
  }
  return json?.data as T;
}

export interface PlanFilters {
  city?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: User; accessToken: string }>("/users/login", { method: "POST", body: { email, password } }),
    register: (form: FormData) => request<User>("/users/register", { method: "POST", body: form }),
    logout: () => request<unknown>("/users/logout", { method: "POST" }),
    me: () => request<User>("/users/me"),
  },
  users: {
    updateProfile: (body: { name?: string; city?: string }) =>
      request<User>("/users/me", { method: "PATCH", body }),
    updateAvatar: (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      return request<User>("/users/me/avatar", { method: "PATCH", body: form });
    },
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      request<unknown>("/users/me/password", { method: "PATCH", body }),
    hosted: () => request<Plan[]>("/users/me/hosted"),
    joined: () => request<Plan[]>("/users/me/joined"),
  },
  plans: {
    list: (filters: PlanFilters = {}) =>
      request<{ plans: Plan[]; pagination: Pagination }>("/plans", { query: { ...filters } }),
    get: (id: string) => request<PlanDetail>(`/plans/${id}`),
    create: (body: PlanInput) => request<Plan>("/plans", { method: "POST", body }),
    update: (id: string, body: Partial<PlanInput>) => request<Plan>(`/plans/${id}`, { method: "PATCH", body }),
    remove: (id: string) => request<void>(`/plans/${id}`, { method: "DELETE" }),
    join: (id: string) => request<JoinRecord>(`/plans/${id}/join`, { method: "POST" }),
    leave: (id: string) => request<unknown>(`/plans/${id}/leave`, { method: "DELETE" }),
    members: (id: string) => request<Member[]>(`/plans/${id}/members`),
    /** Optional endpoint, see docs/BACKEND_ADDITIONS.md. Resolves to [] when the API doesn't have it yet. */
    requests: async (id: string) => {
      try {
        return await request<Member[]>(`/plans/${id}/requests`);
      } catch (err) {
        if (err instanceof ApiException && (err.status === 404 || err.status === 403)) return [];
        throw err;
      }
    },
    decide: (id: string, joinId: string, action: "approve" | "reject") =>
      request<JoinRecord>(`/plans/${id}/join/${joinId}`, { method: "PATCH", body: { action } }),
  },
  messages: {
    list: (planId: string, page = 1, limit = 50) =>
      request<MessagesPage>(`/plans/${planId}/messages`, { query: { page, limit } }),
    send: (planId: string, text: string) =>
      request<ChatMessage>(`/plans/${planId}/messages`, { method: "POST", body: { text } }),
  },
  subscriptions: {
    list: () => request<Subscription[]>("/subscribe/me"),
    create: (city: string, category: string) =>
      request<Subscription>("/subscribe", { method: "POST", body: { city, category } }),
    remove: (id: string) => request<unknown>(`/subscribe/${id}`, { method: "DELETE" }),
  },
};

export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Something went wrong. Please try again.";
