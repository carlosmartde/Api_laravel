import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  TASKS_API_URL,
  TasksApiError,
  createReminder,
  createTask,
  health,
  listAllAlarms,
  listAllReminders,
  listAllTasks,
  login,
  logout,
  refresh,
  updateReminder,
  updateTask,
} from "./tasksApi";

const COLORS = {
  navy: "#071B2C",
  blue: "#0B75D1",
  cyan: "#16B8C6",
  orange: "#F59E0B",
  green: "#1E9B68",
  red: "#D64545",
  ink: "#172B3A",
  muted: "#6D7C87",
  line: "#DDE5EA",
  bg: "#F3F6F8",
  white: "#FFFFFF",
};

const FILTERS = [
  { key: "tasks", label: "Tareas" },
  { key: "reminders", label: "Recordatorios" },
  { key: "alarms", label: "Alarmas" },
];

function getErrorMessage(error) {
  if (error instanceof TasksApiError) return error.message;
  if (error instanceof TypeError) return "No se pudo conectar con la API. Revisa tu conexión.";
  return error?.message || "Ocurrió un error inesperado.";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function newReminderDate() {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString();
}

function priorityColor(priority) {
  if (priority === "Alta") return COLORS.red;
  if (priority === "Baja") return COLORS.green;
  return COLORS.orange;
}

function Metric({ icon, value, label, color }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={19} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function LoginPanel({ busy, onLogin }) {
  const [email, setEmail] = useState(process.env.EXPO_PUBLIC_TASKS_API_EMAIL || "");
  const [password, setPassword] = useState("");
  const [serverStatus, setServerStatus] = useState("checking");

  useEffect(() => {
    const controller = new AbortController();
    health(controller.signal)
      .then((result) => setServerStatus(result?.estado === "ok" ? "online" : "error"))
      .catch(() => setServerStatus("error"));
    return () => controller.abort();
  }, []);

  const submit = () => {
    if (!email.trim() || !password) {
      Alert.alert("Datos incompletos", "Escribe tu correo y contraseña.");
      return;
    }
    onLogin(email, password);
  };

  return (
    <ScrollView contentContainerStyle={styles.loginScreen} keyboardShouldPersistTaps="handled">
      <View style={styles.loginMark}>
        <Ionicons name="checkbox" size={36} color={COLORS.white} />
      </View>
      <Text style={styles.loginTitle}>Tareas y recordatorios</Text>
      <Text style={styles.loginText}>
        Inicia sesión para consultar tu agenda y asociar recordatorios a importaciones.
      </Text>

      <View style={styles.serverRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: serverStatus === "online" ? COLORS.green : serverStatus === "error" ? COLORS.red : COLORS.orange },
          ]}
        />
        <Text style={styles.serverText} numberOfLines={1}>
          {serverStatus === "online" ? "API disponible" : serverStatus === "error" ? "API no disponible" : "Comprobando API"}
        </Text>
      </View>

      <View style={styles.loginCard}>
        <Text style={styles.label}>CORREO</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="usuario@correo.com"
          placeholderTextColor="#97A3AB"
          style={styles.input}
        />
        <Text style={styles.label}>CONTRASEÑA</Text>
        <TextInput
          autoCapitalize="none"
          autoComplete="password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="Tu contraseña"
          placeholderTextColor="#97A3AB"
          style={styles.input}
          onSubmitEditing={submit}
        />
        <TouchableOpacity style={[styles.mainButton, busy && styles.disabled]} disabled={busy} onPress={submit}>
          {busy ? <ActivityIndicator color={COLORS.white} /> : <Ionicons name="log-in-outline" size={19} color={COLORS.white} />}
          <Text style={styles.mainButtonText}>{busy ? "Conectando…" : "Iniciar sesión"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.securityNote}>
        La contraseña y los tokens permanecen únicamente en memoria durante esta sesión.
      </Text>
      <Text style={styles.endpoint} numberOfLines={1}>{TASKS_API_URL}</Text>
    </ScrollView>
  );
}

function TaskCard({ item, busy, onToggle }) {
  const color = priorityColor(item.priority);
  return (
    <View style={[styles.card, item.completed && styles.completedCard]}>
      <View style={styles.cardTop}>
        <TouchableOpacity
          accessibilityLabel={item.completed ? "Marcar tarea pendiente" : "Completar tarea"}
          disabled={busy}
          onPress={() => onToggle(item)}
        >
          <Ionicons
            name={item.completed ? "checkmark-circle" : "ellipse-outline"}
            size={26}
            color={item.completed ? COLORS.green : COLORS.muted}
          />
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, item.completed && styles.completedText]}>{item.title}</Text>
          {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
        </View>
        <View style={[styles.badge, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.badgeText, { color }]}>{item.priority || "Media"}</Text>
        </View>
      </View>
      <View style={styles.cardMetaRow}>
        <Ionicons name="calendar-outline" size={15} color={COLORS.muted} />
        <Text style={styles.cardMeta}>{formatDate(item.due_at)}</Text>
      </View>
      {item.importation_reference || item.importation_id ? (
        <View style={styles.importTag}>
          <Ionicons name="boat-outline" size={15} color={COLORS.blue} />
          <Text style={styles.importTagText}>
            {item.importation_reference || item.importation_id}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ReminderCard({ item, alarm, busy, onRead }) {
  const task = item.task || {};
  const title = task.title || item.task_title || `Tarea #${item.task_id}`;
  const importReference = task.importation_reference || item.importation_reference;
  return (
    <View style={[styles.card, alarm && styles.alarmCard]}>
      <View style={styles.cardTop}>
        <View style={[styles.reminderIcon, { backgroundColor: alarm ? "#FFF0D5" : "#EAF4FC" }]}>
          <Ionicons name={alarm ? "alarm" : "notifications-outline"} size={22} color={alarm ? COLORS.orange : COLORS.blue} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={[styles.reminderDate, alarm && { color: COLORS.red }]}>{formatDate(item.remind_at)}</Text>
        </View>
      </View>
      {importReference ? (
        <View style={styles.importTag}>
          <Ionicons name="boat-outline" size={15} color={COLORS.blue} />
          <Text style={styles.importTagText}>{importReference}</Text>
        </View>
      ) : null}
      {alarm ? (
        <TouchableOpacity style={styles.readButton} disabled={busy} onPress={() => onRead(item)}>
          <Ionicons name="checkmark-done-outline" size={18} color={COLORS.white} />
          <Text style={styles.readButtonText}>Marcar aviso como leído</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ReminderModal({ imports, visible, busy, onClose, onCreate }) {
  const [selectedReference, setSelectedReference] = useState(imports[0]?.reference || "");
  const [title, setTitle] = useState("Revisar documentos de importación");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Media");
  const [remindAt, setRemindAt] = useState(newReminderDate);

  const selectedImport = imports.find((item) => item.reference === selectedReference) || imports[0];

  const submit = () => {
    const date = new Date(remindAt);
    if (!selectedImport || !title.trim()) {
      Alert.alert("Datos incompletos", "Selecciona una importación y escribe el título.");
      return;
    }
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      Alert.alert("Fecha inválida", "Usa una fecha ISO 8601 futura, por ejemplo 2026-10-24T15:00:00-06:00.");
      return;
    }

    onCreate({
      importation: selectedImport,
      title: title.trim(),
      description: description.trim(),
      priority,
      remindAt: date.toISOString(),
    });
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Nuevo recordatorio</Text>
            <Text style={styles.modalSubtitle}>Se crearán una tarea asociada y su recordatorio.</Text>

            <Text style={styles.label}>IMPORTACIÓN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {imports.map((item) => (
                <TouchableOpacity
                  key={item.reference}
                  style={[styles.importChip, selectedReference === item.reference && styles.importChipActive]}
                  onPress={() => setSelectedReference(item.reference)}
                >
                  <Text style={[styles.importChipTitle, selectedReference === item.reference && styles.importChipTextActive]}>{item.reference}</Text>
                  <Text style={[styles.importChipSubtitle, selectedReference === item.reference && styles.importChipTextActive]}>{item.bl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>TÍTULO</Text>
            <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Acción pendiente" />
            <Text style={styles.label}>DESCRIPCIÓN OPCIONAL</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.multilineInput]}
              multiline
              placeholder="Detalles para completar la tarea"
            />

            <Text style={styles.label}>PRIORIDAD</Text>
            <View style={styles.priorityRow}>
              {["Alta", "Media", "Baja"].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.priorityChip, priority === value && styles.priorityChipActive]}
                  onPress={() => setPriority(value)}
                >
                  <Text style={[styles.priorityText, priority === value && styles.priorityTextActive]}>{value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>FECHA Y HORA ISO 8601</Text>
            <TextInput
              autoCapitalize="none"
              value={remindAt}
              onChangeText={setRemindAt}
              style={styles.input}
              placeholder="2026-10-24T15:00:00-06:00"
            />
            <Text style={styles.fieldHelp}>La API exige una fecha futura con zona horaria.</Text>

            <TouchableOpacity style={[styles.mainButton, busy && styles.disabled]} disabled={busy} onPress={submit}>
              {busy ? <ActivityIndicator color={COLORS.white} /> : <Ionicons name="alarm-outline" size={19} color={COLORS.white} />}
              <Text style={styles.mainButtonText}>{busy ? "Registrando…" : "Registrar recordatorio"}</Text>
            </TouchableOpacity>
            <Pressable style={styles.cancelButton} disabled={busy} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function TasksScreen({ imports, session, onSessionChange }) {
  const [activeFilter, setActiveFilter] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const callWithRefresh = async (operation) => {
    const currentSession = sessionRef.current;
    try {
      return await operation(currentSession.access_token);
    } catch (error) {
      if (error?.status !== 401 || !currentSession.refresh_token) throw error;
      const renewed = await refresh(currentSession.refresh_token);
      const nextSession = { ...currentSession, ...renewed };
      sessionRef.current = nextSession;
      onSessionChange(nextSession);
      return operation(nextSession.access_token);
    }
  };

  const loadData = async ({ quiet = false } = {}) => {
    if (!session?.access_token) return;
    if (quiet) setRefreshing(true);
    else setBusy(true);
    try {
      const nextTasks = await callWithRefresh(listAllTasks);
      const nextReminders = await callWithRefresh(listAllReminders);
      const nextAlarms = await callWithRefresh(listAllAlarms);
      setTasks(nextTasks);
      setReminders(nextReminders);
      setAlarms(nextAlarms);
    } catch (error) {
      if (error?.status === 401) onSessionChange(null);
      Alert.alert("No se pudo actualizar la agenda", getErrorMessage(error));
    } finally {
      setBusy(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) loadData();
    // La carga inicial cambia únicamente al iniciar o cerrar sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(session?.access_token)]);

  useEffect(() => {
    if (!session?.access_token) return undefined;
    let requestInProgress = false;
    const timer = setInterval(async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      try {
        const nextAlarms = await callWithRefresh(listAllAlarms);
        setAlarms(nextAlarms);
      } catch {
        // El refresco manual muestra el error; el sondeo silencioso se reintentará.
      } finally {
        requestInProgress = false;
      }
    }, 60000);

    return () => clearInterval(timer);
    // El sondeo se activa únicamente mientras hay una sesión abierta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(session?.access_token)]);

  const handleLogin = async (email, password) => {
    setBusy(true);
    try {
      const nextSession = await login(email, password);
      onSessionChange(nextSession);
    } catch (error) {
      Alert.alert("No se pudo iniciar sesión", getErrorMessage(error));
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logout(sessionRef.current.access_token);
    } catch {
      // La sesión local se elimina aunque el servidor ya no acepte el token.
    } finally {
      setTasks([]);
      setReminders([]);
      setAlarms([]);
      setBusy(false);
      onSessionChange(null);
    }
  };

  const handleCreate = async ({ importation, title, description, priority, remindAt }) => {
    setBusy(true);
    try {
      const taskResponse = await callWithRefresh((token) => createTask(token, {
        title,
        ...(description ? { description } : {}),
        priority,
        completed: false,
        due_at: remindAt,
        importation_id: importation.reference,
        importation_reference: importation.bl,
      }));
      const task = taskResponse?.data;
      if (!task?.id) throw new Error("La API creó la tarea sin devolver su identificador.");

      try {
        await callWithRefresh((token) => createReminder(token, {
          task_id: task.id,
          remind_at: remindAt,
        }));
      } catch (error) {
        Alert.alert(
          "Tarea creada sin recordatorio",
          `La tarea quedó registrada, pero el recordatorio falló: ${getErrorMessage(error)}`
        );
        setShowCreate(false);
        await loadData({ quiet: true });
        return;
      }

      setShowCreate(false);
      await loadData({ quiet: true });
      Alert.alert("Recordatorio registrado", `Quedó asociado a ${importation.reference} · ${importation.bl}.`);
    } catch (error) {
      Alert.alert("No se pudo registrar", getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleTask = async (task) => {
    setRowBusy(`task-${task.id}`);
    try {
      await callWithRefresh((token) => updateTask(token, task.id, { completed: !task.completed }));
      await loadData({ quiet: true });
    } catch (error) {
      Alert.alert("No se pudo actualizar la tarea", getErrorMessage(error));
    } finally {
      setRowBusy(null);
    }
  };

  const handleReadAlarm = async (alarm) => {
    setRowBusy(`alarm-${alarm.id}`);
    try {
      await callWithRefresh((token) => updateReminder(token, alarm.id, { read: true }));
      await loadData({ quiet: true });
    } catch (error) {
      Alert.alert("No se pudo reconocer la alarma", getErrorMessage(error));
    } finally {
      setRowBusy(null);
    }
  };

  const data = useMemo(() => {
    if (activeFilter === "reminders") return reminders;
    if (activeFilter === "alarms") return alarms;
    return tasks;
  }, [activeFilter, tasks, reminders, alarms]);

  if (!session?.access_token) return <LoginPanel busy={busy} onLogin={handleLogin} />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(item) => `${activeFilter}-${item.id}`}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => loadData({ quiet: true })}
        ListHeaderComponent={(
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.eyebrow}>API · AGENDA OPERATIVA</Text>
                <Text style={styles.title}>Tareas y alertas</Text>
                <Text style={styles.subtitle}>Sincronización en línea con tus importaciones</Text>
              </View>
              <TouchableOpacity style={styles.iconButton} disabled={busy} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color={COLORS.ink} />
              </TouchableOpacity>
            </View>

            <View style={styles.metrics}>
              <Metric icon="checkbox-outline" value={tasks.length} label="Tareas" color={COLORS.blue} />
              <Metric icon="notifications-outline" value={reminders.length} label="Avisos" color={COLORS.cyan} />
              <Metric icon="alarm-outline" value={alarms.length} label="Alarmas" color={COLORS.orange} />
            </View>

            {alarms.length ? (
              <TouchableOpacity style={styles.alarmBanner} onPress={() => setActiveFilter("alarms")}>
                <Ionicons name="warning-outline" size={23} color={COLORS.orange} />
                <View style={styles.cardContent}>
                  <Text style={styles.alarmBannerTitle}>{alarms.length} {alarms.length === 1 ? "alarma pendiente" : "alarmas pendientes"}</Text>
                  <Text style={styles.alarmBannerText}>Toca para revisar los avisos vencidos sin leer.</Text>
                </View>
                <Ionicons name="chevron-forward" size={19} color={COLORS.orange} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.createButton} onPress={() => setShowCreate(true)}>
              <Ionicons name="add-circle-outline" size={21} color={COLORS.white} />
              <Text style={styles.createButtonText}>Recordatorio para una importación</Text>
            </TouchableOpacity>

            <View style={styles.filters}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filter, activeFilter === filter.key && styles.filterActive]}
                  onPress={() => setActiveFilter(filter.key)}
                >
                  <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.resultText}>{data.length} registros cargados · todas las páginas</Text>
          </>
        )}
        renderItem={({ item }) => activeFilter === "tasks" ? (
          <TaskCard item={item} busy={rowBusy === `task-${item.id}`} onToggle={handleToggleTask} />
        ) : (
          <ReminderCard
            item={item}
            alarm={activeFilter === "alarms"}
            busy={rowBusy === `alarm-${item.id}`}
            onRead={handleReadAlarm}
          />
        )}
        ListEmptyComponent={busy ? (
          <ActivityIndicator style={styles.loader} size="large" color={COLORS.blue} />
        ) : (
          <View style={styles.empty}>
            <Ionicons name={activeFilter === "alarms" ? "alarm-outline" : "file-tray-outline"} size={42} color="#A7B3BA" />
            <Text style={styles.emptyTitle}>Sin {FILTERS.find((item) => item.key === activeFilter)?.label.toLowerCase()}</Text>
            <Text style={styles.emptyText}>Desliza hacia abajo para volver a consultar la API.</Text>
          </View>
        )}
      />

      <ReminderModal
        imports={imports}
        visible={showCreate}
        busy={busy}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 20, paddingBottom: 36 },
  loginScreen: { flexGrow: 1, justifyContent: "center", padding: 24, backgroundColor: COLORS.bg },
  loginMark: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", alignSelf: "center", backgroundColor: COLORS.navy },
  loginTitle: { color: COLORS.ink, fontSize: 25, fontWeight: "800", textAlign: "center", marginTop: 18 },
  loginText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 7, paddingHorizontal: 12 },
  serverRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  serverText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  loginCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line, marginTop: 20 },
  label: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginTop: 15, marginBottom: 7 },
  input: { minHeight: 46, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, backgroundColor: "#FAFCFD", paddingHorizontal: 13, color: COLORS.ink, fontSize: 12 },
  multilineInput: { minHeight: 76, paddingTop: 12, textAlignVertical: "top" },
  mainButton: { minHeight: 47, borderRadius: 13, backgroundColor: COLORS.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 19 },
  mainButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.65 },
  securityNote: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 16 },
  endpoint: { color: "#92A0A9", fontSize: 9, textAlign: "center", marginTop: 5 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 17 },
  headerText: { flex: 1 },
  eyebrow: { color: COLORS.blue, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: COLORS.ink, fontSize: 25, fontWeight: "800", marginTop: 4 },
  subtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.line },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, backgroundColor: COLORS.white, borderRadius: 15, padding: 11, borderWidth: 1, borderColor: COLORS.line },
  metricValue: { color: COLORS.ink, fontSize: 20, fontWeight: "800", marginTop: 6 },
  metricLabel: { color: COLORS.muted, fontSize: 9, marginTop: 1 },
  alarmBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF7E8", borderColor: "#F8D99E", borderWidth: 1, borderRadius: 15, padding: 13, marginTop: 12 },
  alarmBannerTitle: { color: "#704B06", fontSize: 12, fontWeight: "800" },
  alarmBannerText: { color: "#80652E", fontSize: 10, marginTop: 2 },
  createButton: { minHeight: 47, borderRadius: 14, backgroundColor: COLORS.navy, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 13 },
  createButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  filters: { flexDirection: "row", gap: 7, marginTop: 17 },
  filter: { flex: 1, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, alignItems: "center", paddingVertical: 8 },
  filterActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  filterText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: COLORS.white },
  resultText: { color: COLORS.muted, fontSize: 10, marginVertical: 13 },
  card: { backgroundColor: COLORS.white, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10 },
  completedCard: { opacity: 0.72 },
  alarmCard: { borderColor: "#F2C976", backgroundColor: "#FFFCF6" },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardContent: { flex: 1 },
  cardTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "800", lineHeight: 18 },
  completedText: { textDecorationLine: "line-through", color: COLORS.muted },
  cardDescription: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  badge: { borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { fontSize: 9, fontWeight: "800" },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 11 },
  cardMeta: { color: COLORS.muted, fontSize: 10 },
  importTag: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EAF4FC", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, marginTop: 10 },
  importTagText: { color: COLORS.blue, fontSize: 9, fontWeight: "800" },
  reminderIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  reminderDate: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  readButton: { minHeight: 39, borderRadius: 11, backgroundColor: COLORS.orange, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12 },
  readButtonText: { color: COLORS.white, fontSize: 10, fontWeight: "800" },
  loader: { marginTop: 32 },
  empty: { alignItems: "center", paddingVertical: 34, paddingHorizontal: 20 },
  emptyTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "800", marginTop: 9 },
  emptyText: { color: COLORS.muted, fontSize: 10, textAlign: "center", marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(7,27,44,0.55)", justifyContent: "flex-end" },
  modalSheet: { maxHeight: "91%", backgroundColor: COLORS.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: COLORS.line, alignSelf: "center", marginBottom: 15 },
  modalTitle: { color: COLORS.ink, fontSize: 21, fontWeight: "800" },
  modalSubtitle: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  chipRow: { gap: 8, paddingRight: 12 },
  importChip: { minWidth: 126, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.bg, paddingHorizontal: 11, paddingVertical: 9 },
  importChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  importChipTitle: { color: COLORS.ink, fontSize: 10, fontWeight: "800" },
  importChipSubtitle: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  importChipTextActive: { color: COLORS.white },
  priorityRow: { flexDirection: "row", gap: 8 },
  priorityChip: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line },
  priorityChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  priorityText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  priorityTextActive: { color: COLORS.white },
  fieldHelp: { color: COLORS.muted, fontSize: 9, marginTop: 5 },
  cancelButton: { height: 43, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 8, marginBottom: 4 },
  cancelButtonText: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },
});
