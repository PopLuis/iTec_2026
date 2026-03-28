// client/src/services/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("itec_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Eroare server");
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (username, password) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  me: () => request("/api/auth/me"),

  deleteAccount: () =>
    request("/api/auth/me", { method: "DELETE" }),
};

// ── Projects ──────────────────────────────────────────────────
export const projectsApi = {
  getAll: () => request("/api/projects"),

  create: (name, roomId) =>
    request("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, roomId }),
    }),

  join: (roomId) =>
    request("/api/projects/join", {
      method: "POST",
      body: JSON.stringify({ roomId }),
    }),

  open: (roomId) =>
    request(`/api/projects/${roomId}/open`, { method: "PATCH" }),

  delete: (roomId) =>
    request(`/api/projects/${roomId}`, { method: "DELETE" }),

  leave: (roomId) =>
    request(`/api/projects/${roomId}/leave`, { method: "DELETE" }),

  saveFiles: (roomId, files) =>
    request(`/api/projects/${roomId}/files`, {
      method: "PATCH",
      body: JSON.stringify({ files }),
    }),
};