const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("neuralix_token");
}

export function setToken(token: string) {
  localStorage.setItem("neuralix_token", token);
}

export function clearToken() {
  localStorage.removeItem("neuralix_token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (email: string, password: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),

  login: async (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Login failed");
    }
    return res.json();
  },

  me: () => request("/auth/me"),

  listDocuments: () => request("/documents"),
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/documents/upload", { method: "POST", body: formData });
  },
  deleteDocument: (id: number) => request(`/documents/${id}`, { method: "DELETE" }),

  listConversations: () => request("/conversations"),
  getMessages: (id: number) => request(`/conversations/${id}/messages`),
  deleteConversation: (id: number) => request(`/conversations/${id}`, { method: "DELETE" }),

  chat: (message: string, conversationId?: number, topK = 5) =>
    request("/chat", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId ?? null, top_k: topK }),
    }),
};
