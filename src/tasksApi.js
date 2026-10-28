const DEFAULT_API_URL = "https://carlos-tareas-api.onrender.com/api/v1";

export const TASKS_API_URL = (
  process.env.EXPO_PUBLIC_TASKS_API_URL || DEFAULT_API_URL
).replace(/\/+$/, "");

export class TasksApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "TasksApiError";
    this.status = status;
    this.details = details;
  }
}

function errorMessage(payload, status) {
  if (payload?.message) return payload.message;

  const validationMessage = payload?.errors
    ? Object.values(payload.errors).flat().filter(Boolean).join(" ")
    : "";

  return validationMessage || `La API respondió con HTTP ${status}.`;
}

async function request(path, { token, method = "GET", body, signal } = {}) {
  const response = await fetch(`${TASKS_API_URL}${path}`, {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const raw = await response.text();
  let payload = null;

  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new TasksApiError("La API devolvió una respuesta no válida.", response.status, raw);
    }
  }

  if (!response.ok) {
    throw new TasksApiError(errorMessage(payload, response.status), response.status, payload);
  }

  return payload;
}

export function health(signal) {
  return request("/salud", { signal });
}

export function login(email, password, signal) {
  return request("/login", {
    method: "POST",
    signal,
    body: {
      email: email.trim(),
      password,
      scopes: ["tareas.read", "tareas.write"],
    },
  });
}

export function refresh(refreshToken) {
  return request("/refresh", {
    method: "POST",
    body: { refresh_token: refreshToken },
  });
}

export function logout(accessToken) {
  return request("/logout", { method: "POST", token: accessToken });
}

export function createTask(accessToken, task) {
  return request("/tareas", { method: "POST", token: accessToken, body: task });
}

export function updateTask(accessToken, taskId, changes) {
  return request(`/tareas/${taskId}`, {
    method: "PATCH",
    token: accessToken,
    body: changes,
  });
}

export function createReminder(accessToken, reminder) {
  return request("/recordatorios", {
    method: "POST",
    token: accessToken,
    body: reminder,
  });
}

export function updateReminder(accessToken, reminderId, changes) {
  return request(`/recordatorios/${reminderId}`, {
    method: "PATCH",
    token: accessToken,
    body: changes,
  });
}

async function listEveryPage(path, accessToken) {
  const all = [];
  let page = 1;

  while (page <= 1000) {
    const separator = path.includes("?") ? "&" : "?";
    const payload = await request(`${path}${separator}per_page=100&page=${page}`, {
      token: accessToken,
    });
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    all.push(...rows);

    const currentPage = Number(payload?.current_page ?? page);
    const lastPage = Number(payload?.last_page ?? currentPage);
    const nextLink = payload?.links?.next ?? payload?.next_page_url ?? null;
    const hasKnownNextPage = Number.isFinite(lastPage) && currentPage < lastPage;

    if (!nextLink && !hasKnownNextPage && rows.length < 100) break;
    if (rows.length === 0) break;
    page = currentPage + 1;
  }

  return all;
}

export function listAllTasks(accessToken) {
  return listEveryPage("/tareas", accessToken);
}

export function listAllReminders(accessToken) {
  return listEveryPage("/recordatorios", accessToken);
}

export function listAllAlarms(accessToken) {
  return listEveryPage("/recordatorios?alarmas=1", accessToken);
}
