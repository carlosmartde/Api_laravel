import { REFINERY_API_URL } from "./refineryApi";

const INTEGRATION_PATH = "/integraciones/sistema-b";

export const TASKS_API_URL = `${REFINERY_API_URL}${INTEGRATION_PATH}`;

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
  let response;
  try {
    response = await fetch(`${TASKS_API_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    throw new TasksApiError("No se pudo conectar con la integración de tareas.", 0, error);
  }

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new TasksApiError("La integración devolvió una respuesta no válida.", response.status, raw);
    }
  }

  if (!response.ok) {
    throw new TasksApiError(errorMessage(payload, response.status), response.status, payload);
  }
  return payload;
}

export function health(accessToken, signal) {
  return request("/salud", { token: accessToken, signal });
}

export function createTask(accessToken, task) {
  return request("/tareas", { method: "POST", token: accessToken, body: task });
}

export function getTask(accessToken, taskId) {
  return request(`/tareas/${taskId}`, { token: accessToken });
}

export function updateTask(accessToken, taskId, changes) {
  return request(`/tareas/${taskId}`, { method: "PATCH", token: accessToken, body: changes });
}

export function createReminder(accessToken, reminder) {
  return request("/recordatorios", { method: "POST", token: accessToken, body: reminder });
}

export function updateReminder(accessToken, reminderId, changes) {
  return request(`/recordatorios/${reminderId}`, { method: "PATCH", token: accessToken, body: changes });
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

    const currentPage = Number(payload?.current_page ?? payload?.meta?.current_page ?? page);
    const lastPage = Number(payload?.last_page ?? payload?.meta?.last_page ?? currentPage);
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
