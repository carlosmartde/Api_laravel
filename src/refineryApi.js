import { Platform } from "react-native";

const DEFAULT_API_URL = Platform.select({
  android: "https://refinery-import-api.onrender.com/api",
  default: "https://refinery-import-api.onrender.com/api",
});

export const REFINERY_API_URL = (
  process.env.EXPO_PUBLIC_REFINERY_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");

const SESSION_KEY = "refinery-import.session.v1";

export class RefineryApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "RefineryApiError";
    this.status = status;
    this.payload = payload;
  }
}

function errorMessage(payload, status) {
  const validation = payload?.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : null;
  return validation || payload?.message || payload?.mensaje || `La API respondió con HTTP ${status}.`;
}

async function request(path, { token, method = "GET", body } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  let response;
  try {
    response = await fetch(`${REFINERY_API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    });
  } catch (error) {
    throw new RefineryApiError(
      "No fue posible conectar con el servidor. Verifica la URL de la API y tu conexión.",
      0,
      error,
    );
  }

  const raw = await response.text();
  let payload = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { message: "El servidor devolvió una respuesta no válida." };
    }
  }

  if (!response.ok) {
    throw new RefineryApiError(errorMessage(payload, response.status), response.status, payload);
  }

  return payload;
}

export async function login(email, password) {
  const payload = await request("/login", {
    method: "POST",
    body: { email: email.trim().toLowerCase(), password },
  });

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
    expiresAt: Date.now() + Number(payload.expires_in || 0) * 1000,
    user: payload.user,
  };
}

export async function logout(session) {
  if (!session?.accessToken) return;
  await request("/logout", { method: "POST", token: session.accessToken });
}

export async function getCurrentUser(session) {
  const payload = await request("/me", { token: session.accessToken });
  return payload.user;
}

export async function listImports(session) {
  const payload = await request("/importaciones", { token: session.accessToken });
  return payload.data || [];
}

export async function createImport(session, data) {
  const payload = await request("/importaciones", { method: "POST", token: session.accessToken, body: data });
  return payload.data;
}

export async function updateImport(session, id, changes) {
  const payload = await request(`/importaciones/${id}`, {
    method: "PATCH",
    token: session.accessToken,
    body: changes,
  });
  return payload.data;
}

export async function getDashboard(session) {
  const payload = await request("/dashboard", { token: session.accessToken });
  return payload.data;
}

export async function listTrackingEvents(session, importId) {
  const payload = await request(`/importaciones/${importId}/eventos`, { token: session.accessToken });
  return payload.data || [];
}

export async function createTrackingEvent(session, importId, data) {
  const payload = await request(`/importaciones/${importId}/eventos`, { method: "POST", token: session.accessToken, body: data });
  return payload.data;
}

export async function listDocuments(session, importId) {
  const payload = await request(`/importaciones/${importId}/documentos`, { token: session.accessToken });
  return payload.data || [];
}

export async function uploadDocument(session, importId, { file, type, version = "1.0" }) {
  const body = new FormData();
  body.append("tipo", type);
  body.append("version", version);
  if (Platform.OS === "web") {
    const blob = await fetch(file.uri).then((response) => response.blob());
    body.append("archivo", blob, file.name);
  } else {
    body.append("archivo", { uri: file.uri, name: file.name, type: file.mimeType || "application/octet-stream" });
  }
  const payload = await request(`/importaciones/${importId}/documentos`, { method: "POST", token: session.accessToken, body });
  return payload.data;
}

export async function downloadDocument(session, document) {
  if (Platform.OS !== "web") {
    throw new RefineryApiError("La descarga segura está disponible en la versión web.");
  }
  const response = await fetch(`${REFINERY_API_URL}/documentos/${document.id}/descargar`, {
    headers: { Authorization: `Bearer ${session.accessToken}`, Accept: document.mime || "application/octet-stream" },
  });
  if (!response.ok) throw new RefineryApiError("No se pudo descargar el documento.", response.status);
  const url = URL.createObjectURL(await response.blob());
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.nombre_original || "documento";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function updateDocument(session, documentId, estado) {
  const payload = await request(`/documentos/${documentId}`, {
    method: "PATCH",
    token: session.accessToken,
    body: { estado },
  });
  return payload.data;
}

export async function listTasks(session) {
  const payload = await request("/tareas", { token: session.accessToken });
  return payload.data || [];
}

export async function createTask(session, data) {
  const payload = await request("/tareas", { method: "POST", token: session.accessToken, body: data });
  return payload.data;
}

export async function updateTask(session, id, data) {
  const payload = await request(`/tareas/${id}`, { method: "PATCH", token: session.accessToken, body: data });
  return payload.data;
}

export async function listIncidents(session) {
  const payload = await request("/incidencias", { token: session.accessToken });
  return payload.data || [];
}

export async function createIncident(session, data) {
  const payload = await request("/incidencias", { method: "POST", token: session.accessToken, body: data });
  return payload.data;
}

export async function updateIncident(session, id, data) {
  const payload = await request(`/incidencias/${id}`, { method: "PATCH", token: session.accessToken, body: data });
  return payload.data;
}

export async function listReceptions(session, importId) {
  const payload = await request(`/importaciones/${importId}/recepciones`, { token: session.accessToken });
  return payload.data || [];
}

export async function createReception(session, importId, data) {
  const payload = await request(`/importaciones/${importId}/recepciones`, { method: "POST", token: session.accessToken, body: data });
  return payload.data;
}

export async function getDirectories(session) {
  const payload = await request("/directorios", { token: session.accessToken });
  return payload.data;
}

export async function getReport(session) {
  const payload = await request("/reportes/resumen", { token: session.accessToken });
  return payload.data;
}

export async function getAuditLog(session) {
  const payload = await request("/auditoria", { token: session.accessToken });
  return payload.data || [];
}

export function loadStoredSession() {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value);
    if (!session?.accessToken || (session.expiresAt && session.expiresAt <= Date.now())) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // El almacenamiento puede estar bloqueado por el navegador; la sesión sigue viva en memoria.
  }
}
