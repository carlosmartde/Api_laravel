import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { jsPDF, XLSX } from "./reportLibraries";
import {
  createIncident,
  createTask,
  getAuditLog,
  getDashboard,
  getDirectories,
  getReport,
  listIncidents,
  listTasks,
  updateIncident,
  updateTask,
} from "./refineryApi";

const C = {
  navy: "#071C2B", blue: "#2788E8", cyan: "#23C8B2", orange: "#FFAA3D",
  green: "#16A673", red: "#E24C4B", purple: "#7959D9", ink: "#112B3A",
  muted: "#72828C", line: "#DCE7EC", bg: "#F2F6F8", white: "#FFFFFF",
};

const FILTERS = ["Alertas", "Tareas", "Incidencias", "Auditoría"];

const STATUS_COLORS = {
  Documentación: C.purple,
  "En tránsito": C.blue,
  "En altamar": C.cyan,
  "Proceso aduanal": C.orange,
  Recibida: C.green,
};

function Header({ eyebrow, title, subtitle, action }) {
  return (
    <View style={s.header}>
      <View style={s.flex}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </View>
      {action}
    </View>
  );
}

function Metric({ icon, value, label, color }) {
  return (
    <View style={s.metric}>
      <View style={[s.metricIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={18} color={color} /></View>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

function Empty({ icon, title, text }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={40} color="#A8B4BB" />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function priorityColor(value) {
  if (value === "Crítica") return C.red;
  if (value === "Alta") return C.orange;
  if (value === "Baja") return C.green;
  return C.blue;
}

function FormModal({ visible, kind, imports, busy, onClose, onSubmit }) {
  const [importId, setImportId] = useState(imports[0]?.id ? String(imports[0].id) : "");
  const [title, setTitle] = useState(kind === "task" ? "Revisar documentación del expediente" : "Incidencia operativa");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Alta");
  const [category, setCategory] = useState("Demora");
  const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 86400000).toISOString());

  useEffect(() => {
    if (!importId && imports[0]?.id) setImportId(String(imports[0].id));
  }, [imports, importId]);

  const submit = () => {
    if (!importId || !title.trim()) return Alert.alert("Datos incompletos", "Selecciona una importación y escribe un título.");
    onSubmit(kind === "task" ? {
      importacion_id: Number(importId), titulo: title.trim(), descripcion: description.trim() || null,
      prioridad: priority, vence_en: dueAt || null,
    } : {
      importacion_id: Number(importId), categoria: category, titulo: title.trim(),
      descripcion: description.trim() || "Incidencia registrada desde el centro de gestión.", severidad: priority,
    });
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.sheetTitle}>{kind === "task" ? "Nueva tarea" : "Reportar incidencia"}</Text>
            <Text style={s.sheetText}>Asocia la acción a un expediente de importación.</Text>
            <Text style={s.label}>IMPORTACIÓN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
              {imports.map((item) => (
                <TouchableOpacity key={item.id} style={[s.importChip, importId === String(item.id) && s.importChipActive]} onPress={() => setImportId(String(item.id))}>
                  <Text style={[s.importChipTitle, importId === String(item.id) && s.whiteText]}>{item.reference}</Text>
                  <Text style={[s.importChipText, importId === String(item.id) && s.whiteText]}>{item.bl}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {kind === "incident" ? (
              <>
                <Text style={s.label}>CATEGORÍA</Text>
                <View style={s.wrap}>{["Demora", "Documentación", "Aduana", "Daño", "Faltante", "Otro"].map((item) => (
                  <TouchableOpacity key={item} style={[s.choice, category === item && s.choiceActive]} onPress={() => setCategory(item)}><Text style={[s.choiceText, category === item && s.whiteText]}>{item}</Text></TouchableOpacity>
                ))}</View>
              </>
            ) : null}
            <Text style={s.label}>TÍTULO</Text>
            <TextInput value={title} onChangeText={setTitle} style={s.input} placeholder="Acción requerida" />
            <Text style={s.label}>DESCRIPCIÓN</Text>
            <TextInput value={description} onChangeText={setDescription} style={[s.input, s.multiline]} multiline placeholder="Contexto, responsable o evidencia" />
            <Text style={s.label}>{kind === "task" ? "PRIORIDAD" : "SEVERIDAD"}</Text>
            <View style={s.priorityRow}>{["Baja", "Media", "Alta", "Crítica"].map((item) => (
              <TouchableOpacity key={item} style={[s.priority, priority === item && { backgroundColor: priorityColor(item), borderColor: priorityColor(item) }]} onPress={() => setPriority(item)}><Text style={[s.choiceText, priority === item && s.whiteText]}>{item}</Text></TouchableOpacity>
            ))}</View>
            {kind === "task" ? <><Text style={s.label}>VENCE EN · ISO 8601</Text><TextInput value={dueAt} onChangeText={setDueAt} style={s.input} autoCapitalize="none" /></> : null}
            <TouchableOpacity style={[s.primaryButton, busy && s.disabled]} disabled={busy} onPress={submit}>
              {busy ? <ActivityIndicator color={C.white} /> : <Ionicons name={kind === "task" ? "checkbox-outline" : "warning-outline"} size={19} color={C.white} />}
              <Text style={s.primaryButtonText}>{busy ? "Guardando…" : kind === "task" ? "Crear tarea" : "Registrar incidencia"}</Text>
            </TouchableOpacity>
            <Pressable style={s.cancel} onPress={onClose}><Text style={s.cancelText}>Cancelar</Text></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function OperationsScreen({ session, imports, canWrite, onOpenImport }) {
  const [active, setActive] = useState("Alertas");
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [audit, setAudit] = useState([]);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);

  const load = async () => {
    setBusy(true);
    try {
      const [nextDashboard, nextTasks, nextIncidents] = await Promise.all([getDashboard(session), listTasks(session), listIncidents(session)]);
      setDashboard(nextDashboard); setTasks(nextTasks); setIncidents(nextIncidents);
      if (session.user?.permissions?.includes("admin")) setAudit(await getAuditLog(session));
    } catch (error) { Alert.alert("No se pudo cargar la gestión", error.message); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (data) => {
    setBusy(true);
    try {
      if (modal === "task") await createTask(session, data); else await createIncident(session, data);
      setModal(null); await load();
    } catch (error) { Alert.alert("No se pudo registrar", error.message); setBusy(false); }
  };

  const complete = async (item) => {
    try { setBusy(true); await updateTask(session, item.id, { estado: "Completada" }); await load(); }
    catch (error) { Alert.alert("No se pudo completar", error.message); setBusy(false); }
  };

  const resolve = async (item) => {
    try { setBusy(true); await updateIncident(session, item.id, { estado: "Cerrada" }); await load(); }
    catch (error) { Alert.alert("No se pudo cerrar", error.message); setBusy(false); }
  };

  const openRelated = (item) => {
    const importId = item.importacion?.id || item.importacion_id;
    const related = imports.find((entry) => Number(entry.id) === Number(importId));
    if (related) onOpenImport?.(related);
    else Alert.alert("Expediente no disponible", "Actualiza las importaciones e inténtalo nuevamente.");
  };

  const data = active === "Alertas" ? dashboard?.alertas || [] : active === "Tareas" ? tasks : active === "Incidencias" ? incidents : audit;

  return (
    <View style={s.screen}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => `${active}-${item.id || index}`}
        contentContainerStyle={s.content}
        refreshing={busy}
        onRefresh={load}
        ListHeaderComponent={<>
          <Header eyebrow="OPERACIÓN Y CUMPLIMIENTO" title="Centro de gestión" subtitle="Alertas, tareas, incidencias y trazabilidad" action={canWrite && ["Tareas", "Incidencias"].includes(active) ? <TouchableOpacity style={s.addButton} onPress={() => setModal(active === "Incidencias" ? "incident" : "task")}><Ionicons name={active === "Incidencias" ? "warning-outline" : "add"} size={22} color={C.white} /></TouchableOpacity> : null} />
          <View style={s.metrics}>
            <Metric icon="alarm-outline" value={dashboard?.tareas_vencidas || 0} label="Vencidas" color={C.orange} />
            <Metric icon="warning-outline" value={dashboard?.incidencias_abiertas || 0} label="Incidencias" color={C.red} />
            <Metric icon="document-text-outline" value={dashboard?.documentos_pendientes || 0} label="Documentos" color={C.purple} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>{FILTERS.filter((item) => item !== "Auditoría" || session.user?.permissions?.includes("admin")).map((item) => <TouchableOpacity key={item} style={[s.filter, active === item && s.filterActive]} onPress={() => setActive(item)}><Text style={[s.filterText, active === item && s.filterTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>
          <Text style={s.result}>{data.length} registros · actualización en línea</Text>
        </>}
        renderItem={({ item }) => active === "Alertas" ? (
          <TouchableOpacity style={s.alertCard} onPress={() => openRelated(item)} activeOpacity={0.78}><View style={[s.alertIcon, { backgroundColor: `${priorityColor(item.severidad)}18` }]}><Ionicons name="notifications" size={21} color={priorityColor(item.severidad)} /></View><View style={s.flex}><Text style={s.cardTitle}>{item.titulo}</Text><Text style={s.cardText}>{item.tipo} · {item.importacion?.referencia || "Operación general"}</Text></View><Ionicons name="chevron-forward" size={18} color="#A2AFB7" /></TouchableOpacity>
        ) : active === "Tareas" ? (
          <TouchableOpacity style={s.card} onPress={() => openRelated(item)} activeOpacity={0.8}><View style={s.cardTop}><TouchableOpacity disabled={!canWrite || item.estado === "Completada"} onPress={() => complete(item)}><Ionicons name={item.estado === "Completada" ? "checkmark-circle" : "ellipse-outline"} size={26} color={item.estado === "Completada" ? C.green : C.muted} /></TouchableOpacity><View style={s.flex}><Text style={s.cardTitle}>{item.titulo}</Text><Text style={s.cardText}>{item.importacion?.referencia || "Sin expediente"} · {formatDate(item.vence_en)}</Text></View><Text style={[s.badgeText, { color: priorityColor(item.prioridad) }]}>{item.prioridad}</Text></View><Text style={[s.link, { marginTop: 10 }]}>Abrir expediente →</Text></TouchableOpacity>
        ) : active === "Incidencias" ? (
          <TouchableOpacity style={s.card} onPress={() => openRelated(item)} activeOpacity={0.8}><View style={s.cardTop}><View style={[s.alertIcon, { backgroundColor: `${priorityColor(item.severidad)}18` }]}><Ionicons name="warning-outline" size={21} color={priorityColor(item.severidad)} /></View><View style={s.flex}><Text style={s.cardTitle}>{item.titulo}</Text><Text style={s.cardText}>{item.categoria} · {item.importacion?.referencia}</Text><Text style={s.cardDescription}>{item.descripcion}</Text></View></View><View style={s.cardFooter}><Text style={[s.status, { color: item.estado === "Cerrada" ? C.green : C.red }]}>{item.estado}</Text>{canWrite && item.estado !== "Cerrada" ? <TouchableOpacity onPress={() => resolve(item)}><Text style={s.link}>Cerrar incidencia</Text></TouchableOpacity> : <Text style={s.link}>Abrir expediente →</Text>}</View></TouchableOpacity>
        ) : (
          <View style={s.card}><Text style={s.cardTitle}>{item.descripcion}</Text><Text style={s.cardText}>{item.accion} · {item.entidad_tipo} #{item.entidad_id}</Text><Text style={s.cardDescription}>{formatDate(item.created_at)} · {item.ip || "IP no disponible"}</Text></View>
        )}
        ListEmptyComponent={!busy ? <Empty icon="checkmark-done-outline" title="Sin pendientes" text="No hay registros para este filtro." /> : null}
      />
      <FormModal visible={Boolean(modal)} kind={modal} imports={imports} busy={busy} onClose={() => setModal(null)} onSubmit={submit} />
    </View>
  );
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function compactMoney(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `US$ ${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `US$ ${(amount / 1000).toFixed(0)}K`;
  return money(amount);
}

function ReportKpi({ icon, value, label, hint, color, active, onPress }) {
  return (
    <TouchableOpacity style={[s.reportKpi, active && { borderColor: color, borderWidth: 2 }]} onPress={onPress} activeOpacity={0.82}>
      <View style={s.reportKpiTop}><View style={[s.reportKpiIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={19} color={color} /></View><Ionicons name="arrow-forward" size={15} color="#A4B0B7" /></View>
      <Text style={s.reportKpiValue}>{value}</Text><Text style={s.reportKpiLabel}>{label}</Text><Text style={s.reportKpiHint}>{hint}</Text>
    </TouchableOpacity>
  );
}

function TrendChart({ rows }) {
  const max = Math.max(1, ...rows.map((item) => item.value));
  return <View style={s.trendChart}>{rows.map((item) => <View key={item.key} style={s.trendColumn}><Text style={s.trendValue}>{compactMoney(item.value)}</Text><View style={s.trendTrack}><View style={[s.trendFill, { height: `${Math.max(8, item.value / max * 100)}%` }]} /></View><Text style={s.trendLabel}>{item.label}</Text></View>)}</View>;
}

export function ReportsScreen({ session, imports = [], onOpenImport }) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(true);
  const [range, setRange] = useState("Todo");
  const [status, setStatus] = useState("Todos");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Mayor valor");

  const load = async () => {
    setBusy(true);
    try { setReport(await getReport(session)); }
    catch (error) { Alert.alert("No se pudo cargar el reporte", error.message); }
    finally { setBusy(false); }
  };
  useEffect(() => { load(); }, []);

  const operations = useMemo(() => {
    const now = Date.now();
    const days = range === "30 días" ? 30 : range === "90 días" ? 90 : range === "Este año" ? 366 : null;
    return [...(report?.operaciones || [])].filter((item) => {
      const text = `${item.referencia} ${item.bl} ${item.proveedor} ${item.material} ${item.estado} ${item.prioridad}`.toLowerCase();
      const date = new Date(item.created_at || item.fecha_estimada_arribo).getTime();
      return (!days || (Number.isFinite(date) && now - date <= days * 86400000)) && (status === "Todos" || item.estado === status) && text.includes(query.toLowerCase());
    }).sort((a, b) => sort === "ETA próxima" ? String(a.fecha_estimada_arribo).localeCompare(String(b.fecha_estimada_arribo)) : Number(b.valor_usd || 0) - Number(a.valor_usd || 0));
  }, [report, range, status, query, sort]);

  const analytics = useMemo(() => {
    const totalValue = operations.reduce((sum, item) => sum + Number(item.valor_usd || 0), 0);
    const active = operations.filter((item) => item.estado !== "Recibida");
    const received = operations.filter((item) => item.estado === "Recibida");
    const overdue = active.filter((item) => item.fecha_estimada_arribo && new Date(`${item.fecha_estimada_arribo}T23:59:59`).getTime() < Date.now());
    const critical = active.filter((item) => item.prioridad === "Crítica");
    const statusRows = Object.entries(operations.reduce((acc, item) => { const key = item.estado || "Sin estado"; acc[key] = { total: (acc[key]?.total || 0) + 1, value: (acc[key]?.value || 0) + Number(item.valor_usd || 0) }; return acc; }, {})).map(([estado, value]) => ({ estado, ...value }));
    const providers = Object.entries(operations.reduce((acc, item) => { const key = item.proveedor || "Sin proveedor"; acc[key] = { total: (acc[key]?.total || 0) + 1, value: (acc[key]?.value || 0) + Number(item.valor_usd || 0) }; return acc; }, {})).map(([proveedor, value]) => ({ proveedor, ...value })).sort((a, b) => b.value - a.value);
    const months = Object.entries(operations.reduce((acc, item) => { const raw = item.fecha_estimada_arribo || item.created_at; if (!raw) return acc; const date = new Date(raw); if (Number.isNaN(date.getTime())) return acc; const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; acc[key] = (acc[key] || 0) + Number(item.valor_usd || 0); return acc; }, {})).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([key, value]) => ({ key, value, label: new Intl.DateTimeFormat("es-GT", { month: "short" }).format(new Date(`${key}-15`)).replace(".", "") }));
    return { totalValue, active, received, overdue, critical, statusRows, providers, months, average: operations.length ? totalValue / operations.length : 0 };
  }, [operations]);

  const exportCsv = () => {
    if (Platform.OS !== "web" || !operations.length) return Alert.alert("Sin datos", "No hay operaciones filtradas para exportar.");
    const rows = [["Referencia", "BL", "Proveedor", "Estado", "Prioridad", "ETA", "Valor USD"], ...operations.map((item) => [item.referencia, item.bl, item.proveedor, item.estado, item.prioridad, item.fecha_estimada_arribo, item.valor_usd])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `reporte-importaciones-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (Platform.OS !== "web" || !operations.length) return Alert.alert("Sin datos", "No hay operaciones filtradas para exportar.");
    const summary = [
      ["REPORTE EJECUTIVO DE IMPORTACIONES"],
      ["Generado", new Date().toLocaleString("es-GT")],
      ["Periodo", range],
      ["Estado", status],
      ["Operaciones", operations.length],
      ["Valor gestionado USD", analytics.totalValue],
      ["Operaciones activas", analytics.active.length],
      ["ETA vencida", analytics.overdue.length],
      ["Prioridad crítica", analytics.critical.length],
    ];
    const detail = operations.map((item) => ({ Referencia: item.referencia, BL: item.bl, Proveedor: item.proveedor, Material: item.material, Estado: item.estado, Prioridad: item.prioridad, ETA: item.fecha_estimada_arribo, "Valor USD": Number(item.valor_usd || 0), Progreso: Number(item.progreso || 0) }));
    const book = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    summarySheet["!cols"] = [{ wch: 28 }, { wch: 24 }];
    const detailSheet = XLSX.utils.json_to_sheet(detail);
    detailSheet["!cols"] = [{ wch: 16 }, { wch: 20 }, { wch: 28 }, { wch: 36 }, { wch: 19 }, { wch: 12 }, { wch: 13 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(book, summarySheet, "Resumen");
    XLSX.utils.book_append_sheet(book, detailSheet, "Operaciones");
    XLSX.writeFile(book, `reporte-importaciones-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportPdf = () => {
    if (Platform.OS !== "web" || !operations.length) return Alert.alert("Sin datos", "No hay operaciones filtradas para exportar.");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const addHeader = () => {
      pdf.setFillColor(7, 28, 43); pdf.rect(0, 0, pageWidth, 31, "F");
      pdf.setTextColor(35, 200, 178); pdf.setFontSize(8); pdf.text("PALM REFINERY · LOGISTICS OS", 14, 10);
      pdf.setTextColor(255, 255, 255); pdf.setFontSize(18); pdf.setFont("helvetica", "bold"); pdf.text("Reporte ejecutivo de importaciones", 14, 21);
      pdf.setFontSize(8); pdf.setFont("helvetica", "normal"); pdf.setTextColor(180, 203, 213); pdf.text(`Generado ${new Date().toLocaleString("es-GT")} · Periodo ${range} · Estado ${status}`, 14, 27);
    };
    addHeader();
    const metrics = [["VALOR GESTIONADO", compactMoney(analytics.totalValue)], ["OPERACIONES", String(operations.length)], ["ACTIVAS", String(analytics.active.length)], ["ETA VENCIDA", String(analytics.overdue.length)], ["CRÍTICAS", String(analytics.critical.length)]];
    metrics.forEach(([label, value], index) => { const x = 14 + index * 54; pdf.setFillColor(243, 247, 249); pdf.roundedRect(x, 38, 48, 22, 2, 2, "F"); pdf.setTextColor(105, 122, 133); pdf.setFontSize(7); pdf.text(label, x + 4, 45); pdf.setTextColor(17, 43, 58); pdf.setFontSize(13); pdf.setFont("helvetica", "bold"); pdf.text(value, x + 4, 54); pdf.setFont("helvetica", "normal"); });
    const columns = [14, 45, 82, 136, 180, 211, 237, 263];
    const headers = ["Referencia", "BL", "Proveedor", "Material", "Estado", "Prioridad", "ETA", "Valor USD"];
    let y = 70;
    const drawTableHeader = () => { pdf.setFillColor(39, 136, 232); pdf.rect(14, y - 5, pageWidth - 28, 8, "F"); pdf.setTextColor(255, 255, 255); pdf.setFontSize(7); pdf.setFont("helvetica", "bold"); headers.forEach((header, index) => pdf.text(header, columns[index], y)); pdf.setFont("helvetica", "normal"); y += 7; };
    drawTableHeader();
    operations.forEach((item, index) => { if (y > 190) { pdf.addPage(); addHeader(); y = 42; drawTableHeader(); } if (index % 2 === 0) { pdf.setFillColor(247, 249, 250); pdf.rect(14, y - 4, pageWidth - 28, 7, "F"); } pdf.setTextColor(42, 59, 70); pdf.setFontSize(6.5); const values = [item.referencia, item.bl, item.proveedor, item.material, item.estado, item.prioridad || "Media", item.fecha_estimada_arribo || "—", money(item.valor_usd)]; const widths = [27, 33, 50, 40, 27, 22, 22, 19]; values.forEach((value, col) => pdf.text(String(value || "—").slice(0, widths[col]), columns[col], y)); y += 7; });
    pdf.save(`reporte-importaciones-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const openOperation = (operation) => {
    const mapped = imports.find((item) => Number(item.id) === Number(operation.id));
    if (mapped) onOpenImport?.(mapped); else Alert.alert("Expediente no disponible", "Actualiza la lista de importaciones e inténtalo nuevamente.");
  };

  if (busy && !report) return <View style={s.center}><ActivityIndicator size="large" color={C.blue} /><Text style={s.loadingText}>Construyendo dashboard ejecutivo…</Text></View>;
  const maxStatus = Math.max(1, ...analytics.statusRows.map((item) => item.total));

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor={C.blue} />}>
      <Header eyebrow="INTELIGENCIA OPERATIVA" title="Dashboard de importaciones" subtitle={`Datos en línea · corte ${formatDate(report?.generado_en)}`} action={<View style={s.exportGroup}><TouchableOpacity style={[s.exportButton, { backgroundColor: C.red }]} onPress={exportPdf}><Ionicons name="document-text-outline" size={17} color={C.white} /><Text style={s.exportText}>PDF</Text></TouchableOpacity><TouchableOpacity style={[s.exportButton, { backgroundColor: C.green }]} onPress={exportExcel}><Ionicons name="grid-outline" size={17} color={C.white} /><Text style={s.exportText}>Excel</Text></TouchableOpacity><TouchableOpacity style={s.exportIconButton} onPress={exportCsv}><Ionicons name="download-outline" size={18} color={C.blue} /></TouchableOpacity></View>} />
      <View style={s.reportHero}>
        <View style={s.reportGlow} />
        <View style={s.reportHeroTop}><View style={s.flex}><Text style={s.reportKicker}>VALOR GESTIONADO · VISTA ACTUAL</Text><Text style={s.reportValue}>{compactMoney(analytics.totalValue)}</Text><Text style={s.reportText}>{operations.length} operaciones · ticket promedio {compactMoney(analytics.average)}</Text></View><View style={s.healthRing}><Text style={s.healthValue}>{operations.length ? Math.round(analytics.received.length / operations.length * 100) : 0}%</Text><Text style={s.healthLabel}>RECIBIDO</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rangeRow}>{["Todo", "30 días", "90 días", "Este año"].map((item) => <TouchableOpacity key={item} style={[s.rangePill, range === item && s.rangePillActive]} onPress={() => setRange(item)}><Text style={[s.rangeText, range === item && s.whiteText]}>{item}</Text></TouchableOpacity>)}</ScrollView>
      </View>
      <View style={s.reportKpiGrid}>
        <ReportKpi icon="layers-outline" value={operations.length} label="Operaciones" hint="En la vista actual" color={C.blue} active={status === "Todos"} onPress={() => setStatus("Todos")} />
        <ReportKpi icon="boat-outline" value={analytics.active.length} label="Activas" hint={compactMoney(analytics.active.reduce((sum, item) => sum + Number(item.valor_usd || 0), 0))} color={C.cyan} onPress={() => setStatus("Todos")} />
        <ReportKpi icon="time-outline" value={analytics.overdue.length} label="ETA vencida" hint="Requieren acción" color={C.orange} onPress={() => setSort("ETA próxima")} />
        <ReportKpi icon="alert-circle-outline" value={analytics.critical.length} label="Prioridad crítica" hint="Riesgo elevado" color={C.red} onPress={() => setQuery("Crítica")} />
      </View>
      <View style={[s.reportColumns, !wide && s.reportColumnsMobile]}>
        <View style={[s.reportPanel, wide && s.reportPanelHalf]}><View style={s.panelHeader}><View><Text style={s.panelEyebrow}>FLUJO FINANCIERO</Text><Text style={s.panelTitle}>Valor por mes de arribo</Text></View><Ionicons name="trending-up" size={22} color={C.green} /></View>{analytics.months.length ? <TrendChart rows={analytics.months} /> : <Empty icon="bar-chart-outline" title="Sin serie temporal" text="Registra fechas ETA para construir la tendencia." />}</View>
        <View style={[s.reportPanel, wide && s.reportPanelHalf]}><View style={s.panelHeader}><View><Text style={s.panelEyebrow}>PIPELINE</Text><Text style={s.panelTitle}>Distribución por estado</Text></View><Text style={s.panelTotal}>{operations.length}</Text></View><View style={s.segmentedBar}>{analytics.statusRows.map((item) => <TouchableOpacity key={item.estado} onPress={() => setStatus(item.estado)} style={{ flex: item.total, minWidth: 6, backgroundColor: STATUS_COLORS[item.estado] || C.blue }} />)}</View>{analytics.statusRows.map((item) => <TouchableOpacity key={item.estado} style={[s.statusRow, status === item.estado && s.statusRowActive]} onPress={() => setStatus(status === item.estado ? "Todos" : item.estado)}><View style={[s.statusDot, { backgroundColor: STATUS_COLORS[item.estado] || C.blue }]} /><Text style={s.statusName}>{item.estado}</Text><View style={s.statusTrack}><View style={[s.statusFill, { width: `${Math.max(5, item.total / maxStatus * 100)}%`, backgroundColor: STATUS_COLORS[item.estado] || C.blue }]} /></View><Text style={s.statusCount}>{item.total}</Text><Text style={s.statusMoney}>{compactMoney(item.value)}</Text></TouchableOpacity>)}</View>
      </View>
      <View style={[s.reportColumns, !wide && s.reportColumnsMobile]}>
        <View style={[s.reportPanel, wide && s.reportPanelHalf]}><View style={s.panelHeader}><View><Text style={s.panelEyebrow}>CONCENTRACIÓN</Text><Text style={s.panelTitle}>Principales proveedores</Text></View><Ionicons name="business-outline" size={21} color={C.blue} /></View>{analytics.providers.slice(0, 5).map((item, index) => <TouchableOpacity key={item.proveedor} style={s.providerRow} onPress={() => setQuery(item.proveedor)}><Text style={s.providerRank}>{String(index + 1).padStart(2, "0")}</Text><View style={s.flex}><Text style={s.cardTitle} numberOfLines={1}>{item.proveedor}</Text><Text style={s.cardText}>{item.total} operaciones</Text></View><Text style={s.providerValue}>{compactMoney(item.value)}</Text></TouchableOpacity>)}</View>
        <View style={[s.reportPanel, wide && s.reportPanelHalf]}><View style={s.panelHeader}><View><Text style={s.panelEyebrow}>GESTIÓN DE RIESGO</Text><Text style={s.panelTitle}>Atención prioritaria</Text></View><View style={s.riskBadge}><View style={s.riskDot} /><Text style={s.riskBadgeText}>VIGILANCIA</Text></View></View>{[...analytics.critical, ...analytics.overdue.filter((item) => !analytics.critical.some((row) => row.id === item.id))].slice(0, 5).map((item) => <TouchableOpacity key={item.id} style={s.riskRow} onPress={() => openOperation(item)}><View style={[s.riskIcon, { backgroundColor: item.prioridad === "Crítica" ? "#FFF0ED" : "#FFF6E7" }]}><Ionicons name={item.prioridad === "Crítica" ? "alert-circle" : "time"} size={19} color={item.prioridad === "Crítica" ? C.red : C.orange} /></View><View style={s.flex}><Text style={s.cardTitle}>{item.referencia}</Text><Text style={s.cardText}>{item.proveedor} · ETA {formatDate(item.fecha_estimada_arribo)}</Text></View><Ionicons name="chevron-forward" size={18} color="#9DAAB2" /></TouchableOpacity>)}{!analytics.critical.length && !analytics.overdue.length ? <Empty icon="shield-checkmark-outline" title="Riesgo controlado" text="No hay prioridades críticas ni ETA vencidas." /> : null}</View>
      </View>
      <View style={s.operationsHeader}><View><Text style={s.panelEyebrow}>DETALLE TRANSACCIONAL</Text><Text style={s.sectionTitle}>Operaciones del periodo</Text></View><TouchableOpacity style={s.sortButton} onPress={() => setSort((value) => value === "Mayor valor" ? "ETA próxima" : "Mayor valor")}><Ionicons name="swap-vertical" size={16} color={C.blue} /><Text style={s.sortText}>{sort}</Text></TouchableOpacity></View>
      <View style={s.reportSearch}><Ionicons name="search" size={18} color={C.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Buscar referencia, BL, proveedor o material" placeholderTextColor="#8E9BA4" style={s.searchInput} />{query ? <TouchableOpacity onPress={() => setQuery("")}><Ionicons name="close-circle" size={19} color="#9EABB3" /></TouchableOpacity> : null}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>{["Todos", ...Object.keys(STATUS_COLORS)].map((item) => <TouchableOpacity key={item} style={[s.filter, status === item && s.filterActive]} onPress={() => setStatus(item)}><Text style={[s.filterText, status === item && s.filterTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>
      {operations.slice(0, 30).map((item) => { const color = STATUS_COLORS[item.estado] || C.blue; return <TouchableOpacity key={item.id} style={s.operationRow} onPress={() => openOperation(item)}><View style={[s.operationAccent, { backgroundColor: color }]} /><View style={s.flex}><Text style={s.operationReference}>{item.referencia}</Text><Text style={s.operationMaterial} numberOfLines={1}>{item.material}</Text><Text style={s.cardText}>{item.proveedor} · {item.bl}</Text></View><View style={s.operationRight}><Text style={s.operationValue}>{money(item.valor_usd)}</Text><View style={[s.operationBadge, { backgroundColor: `${color}14` }]}><Text style={[s.operationBadgeText, { color }]}>{item.estado}</Text></View></View><Ionicons name="chevron-forward" size={18} color="#A5B1B8" /></TouchableOpacity>; })}
      {!operations.length ? <Empty icon="analytics-outline" title="Sin datos para esta vista" text="Cambia el periodo o elimina algún filtro." /> : null}
    </ScrollView>
  );
}

export function DirectoryScreen({ session }) {
  const [type, setType] = useState("proveedores");
  const [data, setData] = useState({ proveedores: [], ubicaciones: [] });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(true);
  const load = async () => { setBusy(true); try { setData(await getDirectories(session)); } catch (error) { Alert.alert("No se pudo cargar el directorio", error.message); } finally { setBusy(false); } };
  useEffect(() => { load(); }, []);
  const rows = useMemo(() => (data[type] || []).filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [data, type, query]);
  const contact = async (mode, value) => {
    if (!value) return Alert.alert("Dato no disponible", "Este registro no tiene esa información de contacto.");
    const url = mode === "email" ? `mailto:${value}` : `tel:${value}`;
    if (await Linking.canOpenURL(url)) Linking.openURL(url); else Alert.alert("Acción no disponible", "Este dispositivo no puede abrir el enlace.");
  };
  return (
    <View style={s.screen}>
      <FlatList data={rows} keyExtractor={(item) => String(item.id)} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={busy} onRefresh={load} tintColor={C.blue} />} ListHeaderComponent={<><Header eyebrow="DATOS MAESTROS" title="Directorio corporativo" subtitle="Proveedores homologados y destinos internos" /><View style={s.directoryHero}><View style={s.directoryHeroIcon}><Ionicons name="git-network-outline" size={28} color={C.cyan} /></View><View style={s.flex}><Text style={s.directoryHeroValue}>{data.proveedores.length + data.ubicaciones.length}</Text><Text style={s.directoryHeroTitle}>registros conectados a la operación</Text><Text style={s.directoryHeroText}>Selecciona una ficha para ver sus datos y acciones.</Text></View></View><View style={s.search}><Ionicons name="search" size={19} color={C.muted} /><TextInput value={query} onChangeText={setQuery} style={s.searchInput} placeholder="Buscar en el directorio" />{query ? <TouchableOpacity onPress={() => setQuery("")}><Ionicons name="close-circle" size={19} color="#A0ADB5" /></TouchableOpacity> : null}</View><View style={s.segment}>{["proveedores", "ubicaciones"].map((item) => <TouchableOpacity key={item} style={[s.segmentItem, type === item && s.segmentActive]} onPress={() => setType(item)}><Text style={[s.segmentText, type === item && s.whiteText]}>{item === "proveedores" ? "Proveedores" : "Ubicaciones"}</Text></TouchableOpacity>)}</View><Text style={s.result}>{rows.length} registros maestros · toca para abrir</Text></>} renderItem={({ item }) => type === "proveedores" ? <TouchableOpacity style={s.directoryCard} onPress={() => setSelected({ ...item, _type: "proveedor" })} activeOpacity={0.8}><View style={s.directoryLogo}><Text style={s.directoryInitial}>{item.nombre.slice(0, 2)}</Text></View><View style={s.flex}><Text style={s.cardTitle}>{item.nombre}</Text><Text style={s.cardText}>{item.categoria} · {item.pais}</Text><Text style={s.cardDescription}>{item.contacto || "Sin contacto"} · {item.email || "Sin correo"}</Text></View><View style={s.right}><Text style={s.rating}>★ {item.calificacion || "—"}</Text><Text style={s.count}>{item.importaciones_count} operaciones</Text></View><Ionicons name="chevron-forward" size={18} color="#A3AFB6" /></TouchableOpacity> : <TouchableOpacity style={s.directoryCard} onPress={() => setSelected({ ...item, _type: "ubicacion" })} activeOpacity={0.8}><View style={[s.directoryLogo, { backgroundColor: "#EAF7F3" }]}><Ionicons name="location" size={23} color={C.green} /></View><View style={s.flex}><Text style={s.cardTitle}>{item.area}</Text><Text style={s.cardText}>{item.codigo} · {item.detalle}</Text><Text style={s.cardDescription}>{item.capacidad ? `${item.capacidad} ${item.unidad}` : "Capacidad no registrada"}</Text></View><Text style={s.count}>{item.importaciones_count} asignadas</Text><Ionicons name="chevron-forward" size={18} color="#A3AFB6" /></TouchableOpacity>} ListEmptyComponent={!busy ? <Empty icon="search-outline" title="Sin coincidencias" text="Prueba con otro término." /> : null} />
      <Modal transparent visible={Boolean(selected)} animationType="fade" onRequestClose={() => setSelected(null)}><View style={[s.backdrop, { justifyContent: "center", padding: 18 }]}><View style={s.directoryModal}><TouchableOpacity style={s.directoryClose} onPress={() => setSelected(null)}><Ionicons name="close" size={20} color={C.ink} /></TouchableOpacity><View style={s.directoryModalLogo}>{selected?._type === "proveedor" ? <Text style={s.directoryModalInitial}>{selected?.nombre?.slice(0, 2)}</Text> : <Ionicons name="location" size={29} color={C.green} />}</View><Text style={s.directoryModalTitle}>{selected?._type === "proveedor" ? selected?.nombre : selected?.area}</Text><Text style={s.directoryModalText}>{selected?._type === "proveedor" ? `${selected?.categoria || "Sin categoría"} · ${selected?.pais || "Sin país"}` : `${selected?.codigo || "Sin código"} · ${selected?.detalle || "Sin detalle"}`}</Text><View style={s.directoryFacts}><View style={s.directoryFact}><Text style={s.directoryFactValue}>{selected?.importaciones_count || 0}</Text><Text style={s.directoryFactLabel}>OPERACIONES</Text></View><View style={s.directoryFact}><Text style={s.directoryFactValue}>{selected?._type === "proveedor" ? selected?.calificacion || "—" : selected?.capacidad || "—"}</Text><Text style={s.directoryFactLabel}>{selected?._type === "proveedor" ? "CALIFICACIÓN" : selected?.unidad || "CAPACIDAD"}</Text></View></View>{selected?._type === "proveedor" ? <View style={s.directoryActions}><TouchableOpacity style={s.directoryAction} onPress={() => contact("email", selected?.email)}><Ionicons name="mail-outline" size={19} color={C.blue} /><Text style={s.directoryActionText}>Correo</Text></TouchableOpacity><TouchableOpacity style={s.directoryAction} onPress={() => contact("phone", selected?.telefono)}><Ionicons name="call-outline" size={19} color={C.green} /><Text style={[s.directoryActionText, { color: C.green }]}>Llamar</Text></TouchableOpacity></View> : <View style={s.directoryNote}><Ionicons name="cube-outline" size={20} color={C.blue} /><Text style={s.directoryNoteText}>Destino disponible para asignación de materiales importados.</Text></View>}</View></View></Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg }, content: { padding: 20, paddingBottom: 38, width: "100%", maxWidth: 1180, alignSelf: "center" }, flex: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }, loadingText: { color: C.muted, fontSize: 11, marginTop: 10 },
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 18 }, eyebrow: { color: C.blue, fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, title: { color: C.ink, fontSize: 25, fontWeight: "900", marginTop: 4 }, subtitle: { color: C.muted, fontSize: 11, marginTop: 3 }, addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" },
  metrics: { flexDirection: "row", gap: 8 }, metric: { flex: 1, backgroundColor: C.white, borderRadius: 15, padding: 11, borderWidth: 1, borderColor: C.line }, metricIcon: { width: 31, height: 31, borderRadius: 9, alignItems: "center", justifyContent: "center" }, metricValue: { color: C.ink, fontSize: 20, fontWeight: "900", marginTop: 6 }, metricLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
  filterRow: { gap: 8, paddingVertical: 16 }, filter: { borderWidth: 1, borderColor: C.line, borderRadius: 18, backgroundColor: C.white, paddingHorizontal: 14, paddingVertical: 8 }, filterActive: { backgroundColor: C.navy, borderColor: C.navy }, filterText: { color: C.muted, fontSize: 10, fontWeight: "800" }, filterTextActive: { color: C.white }, result: { color: C.muted, fontSize: 10, marginBottom: 12 },
  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 17, padding: 15, marginBottom: 10 }, cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, cardTitle: { color: C.ink, fontSize: 13, fontWeight: "800" }, cardText: { color: C.muted, fontSize: 10, marginTop: 3 }, cardDescription: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 6 }, cardFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 10, marginTop: 12 }, status: { fontSize: 10, fontWeight: "900" }, link: { color: C.blue, fontSize: 10, fontWeight: "900" }, badgeText: { fontSize: 9, fontWeight: "900" },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 14, marginBottom: 9 }, alertIcon: { width: 41, height: 41, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", padding: 35 }, emptyTitle: { color: C.ink, fontSize: 14, fontWeight: "800", marginTop: 8 }, emptyText: { color: C.muted, fontSize: 10, textAlign: "center", marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(7,27,44,0.58)", justifyContent: "flex-end" }, sheet: { maxHeight: "92%", backgroundColor: C.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30 }, handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: C.line, alignSelf: "center", marginBottom: 16 }, sheetTitle: { color: C.ink, fontSize: 21, fontWeight: "900" }, sheetText: { color: C.muted, fontSize: 11, marginTop: 3 }, label: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginTop: 17, marginBottom: 7 }, input: { minHeight: 46, borderWidth: 1, borderColor: C.line, borderRadius: 13, paddingHorizontal: 13, color: C.ink, backgroundColor: "#FAFCFD", fontSize: 12 }, multiline: { minHeight: 78, paddingTop: 12, textAlignVertical: "top" }, chipRow: { gap: 8, paddingRight: 12 }, importChip: { minWidth: 120, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg }, importChipActive: { backgroundColor: C.navy, borderColor: C.navy }, importChipTitle: { color: C.ink, fontSize: 10, fontWeight: "900" }, importChipText: { color: C.muted, fontSize: 9, marginTop: 2 }, whiteText: { color: C.white }, wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, choice: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, borderWidth: 1, borderColor: C.line }, choiceActive: { backgroundColor: C.navy, borderColor: C.navy }, choiceText: { color: C.muted, fontSize: 9, fontWeight: "800" }, priorityRow: { flexDirection: "row", gap: 6 }, priority: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: C.line }, primaryButton: { minHeight: 48, borderRadius: 13, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }, primaryButtonText: { color: C.white, fontSize: 11, fontWeight: "900" }, disabled: { opacity: 0.6 }, cancel: { height: 42, alignItems: "center", justifyContent: "center" }, cancelText: { color: C.muted, fontSize: 11, fontWeight: "800" },
  reportHero: { backgroundColor: C.navy, borderRadius: 21, padding: 21, marginBottom: 22, overflow: "hidden" }, reportKicker: { color: C.cyan, fontSize: 9, fontWeight: "900", letterSpacing: 1 }, reportValue: { color: C.white, fontSize: 30, fontWeight: "900", marginTop: 8 }, reportText: { color: "#AFC8D3", fontSize: 11, marginTop: 4 }, sectionTitle: { color: C.ink, fontSize: 16, fontWeight: "900", marginBottom: 11, marginTop: 7 }, chartCard: { backgroundColor: C.white, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: C.line, marginBottom: 19 }, barRow: { marginBottom: 14 }, barLabels: { flexDirection: "row", justifyContent: "space-between" }, barTitle: { color: C.ink, fontSize: 10, fontWeight: "800" }, barValue: { color: C.blue, fontSize: 10, fontWeight: "900" }, barTrack: { height: 7, borderRadius: 4, backgroundColor: C.line, marginTop: 7, overflow: "hidden" }, barFill: { height: "100%", borderRadius: 4, backgroundColor: C.blue }, barMoney: { color: C.muted, fontSize: 9, marginTop: 4 }, ranking: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 15, padding: 13, marginBottom: 8 }, rank: { color: C.blue, fontSize: 13, fontWeight: "900" }, rankingValue: { color: C.ink, fontSize: 11, fontWeight: "900" },
  search: { height: 47, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }, searchInput: { flex: 1, height: "100%", color: C.ink, fontSize: 12, outlineStyle: "none" }, segment: { flexDirection: "row", backgroundColor: "#E4EAED", borderRadius: 13, padding: 3, marginTop: 13 }, segmentItem: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 10 }, segmentActive: { backgroundColor: C.navy }, segmentText: { color: C.muted, fontSize: 10, fontWeight: "800" }, directoryCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.line, marginBottom: 9 }, directoryLogo: { width: 43, height: 43, borderRadius: 13, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" }, directoryInitial: { color: C.blue, fontSize: 13, fontWeight: "900" }, right: { alignItems: "flex-end" }, rating: { color: C.orange, fontSize: 10, fontWeight: "900" }, count: { color: C.muted, fontSize: 8, marginTop: 4 },
  exportGroup: { flexDirection: "row", alignItems: "center", gap: 6 }, exportButton: { minHeight: 40, paddingHorizontal: 11, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, exportText: { color: C.white, fontSize: 8, fontWeight: "900" }, exportIconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }, reportGlow: { position: "absolute", right: -38, top: -52, width: 168, height: 168, borderRadius: 84, backgroundColor: "#0C5068", opacity: 0.58 }, reportHeroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 18 }, healthRing: { width: 74, height: 74, borderRadius: 37, borderWidth: 7, borderColor: C.cyan, backgroundColor: "#0B3042", alignItems: "center", justifyContent: "center", flexShrink: 0 }, healthValue: { color: C.white, fontSize: 17, fontWeight: "900" }, healthLabel: { color: "#9FB8C3", fontSize: 6, fontWeight: "900" }, rangeRow: { gap: 7, paddingTop: 17 }, rangePill: { borderRadius: 17, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#123A4C" }, rangePillActive: { backgroundColor: C.blue }, rangeText: { color: "#B5CAD3", fontSize: 8, fontWeight: "900" },
  reportKpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: -10, marginBottom: 12, paddingHorizontal: 8 }, reportKpi: { flex: 1, minWidth: 125, backgroundColor: C.white, borderRadius: 17, padding: 13, borderWidth: 1, borderColor: C.line }, reportKpiTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, reportKpiIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" }, reportKpiValue: { color: C.ink, fontSize: 22, fontWeight: "900", marginTop: 8 }, reportKpiLabel: { color: C.ink, fontSize: 9, fontWeight: "900", marginTop: 2 }, reportKpiHint: { color: C.muted, fontSize: 7, marginTop: 3 },
  reportColumns: { flexDirection: "row", gap: 12, marginTop: 12, alignItems: "stretch" }, reportColumnsMobile: { flexDirection: "column" }, reportPanel: { backgroundColor: C.white, borderRadius: 19, padding: 16, borderWidth: 1, borderColor: C.line }, reportPanelHalf: { flex: 1 }, panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }, panelEyebrow: { color: C.blue, fontSize: 7, fontWeight: "900", letterSpacing: 1.1 }, panelTitle: { color: C.ink, fontSize: 13, fontWeight: "900", marginTop: 3 }, panelTotal: { color: C.ink, fontSize: 22, fontWeight: "900" },
  trendChart: { minHeight: 180, flexDirection: "row", alignItems: "flex-end", gap: 7, paddingTop: 15 }, trendColumn: { flex: 1, alignItems: "center", height: 170 }, trendValue: { color: C.muted, fontSize: 6, fontWeight: "800", height: 15 }, trendTrack: { flex: 1, width: "70%", maxWidth: 36, borderRadius: 8, backgroundColor: "#EDF3F6", justifyContent: "flex-end", overflow: "hidden" }, trendFill: { width: "100%", backgroundColor: C.blue, borderRadius: 8, minHeight: 6 }, trendLabel: { color: C.muted, fontSize: 8, fontWeight: "800", textTransform: "uppercase", marginTop: 6 }, segmentedBar: { height: 10, borderRadius: 5, overflow: "hidden", flexDirection: "row", marginBottom: 12 }, statusRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 7, paddingHorizontal: 5, borderRadius: 9 }, statusRowActive: { backgroundColor: "#F0F6FA" }, statusDot: { width: 7, height: 7, borderRadius: 4 }, statusName: { width: 84, color: C.ink, fontSize: 8, fontWeight: "800" }, statusTrack: { flex: 1, height: 5, backgroundColor: "#EDF2F4", borderRadius: 3, overflow: "hidden" }, statusFill: { height: 5, borderRadius: 3 }, statusCount: { width: 18, textAlign: "right", color: C.ink, fontSize: 9, fontWeight: "900" }, statusMoney: { width: 58, textAlign: "right", color: C.muted, fontSize: 7, fontWeight: "800" },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EDF2F4" }, providerRank: { color: "#A1ADB5", fontSize: 11, fontWeight: "900" }, providerValue: { color: C.ink, fontSize: 10, fontWeight: "900" }, riskBadge: { borderRadius: 18, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#FFF0ED", flexDirection: "row", alignItems: "center", gap: 5 }, riskDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.red }, riskBadgeText: { color: C.red, fontSize: 6, fontWeight: "900" }, riskRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#EDF2F4" }, riskIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  operationsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 23, marginBottom: 11 }, sortButton: { borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.white, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 8 }, sortText: { color: C.blue, fontSize: 8, fontWeight: "900" }, reportSearch: { minHeight: 46, borderWidth: 1, borderColor: C.line, borderRadius: 14, backgroundColor: C.white, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }, operationRow: { minHeight: 72, backgroundColor: C.white, borderRadius: 15, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, marginBottom: 8, overflow: "hidden" }, operationAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 }, operationReference: { color: C.blue, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 }, operationMaterial: { color: C.ink, fontSize: 11, fontWeight: "900", marginTop: 3 }, operationRight: { alignItems: "flex-end", gap: 5 }, operationValue: { color: C.ink, fontSize: 10, fontWeight: "900" }, operationBadge: { borderRadius: 15, paddingHorizontal: 8, paddingVertical: 5 }, operationBadgeText: { fontSize: 7, fontWeight: "900" },
  directoryHero: { backgroundColor: C.navy, borderRadius: 20, padding: 17, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 12 }, directoryHeroIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: "#123C4E", alignItems: "center", justifyContent: "center" }, directoryHeroValue: { color: C.white, fontSize: 24, fontWeight: "900" }, directoryHeroTitle: { color: C.white, fontSize: 10, fontWeight: "800" }, directoryHeroText: { color: "#9FB8C3", fontSize: 8, marginTop: 2 }, directoryModal: { width: "100%", maxWidth: 480, alignSelf: "center", backgroundColor: C.white, borderRadius: 23, padding: 22, alignItems: "center" }, directoryClose: { position: "absolute", right: 13, top: 13, width: 34, height: 34, borderRadius: 11, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }, directoryModalLogo: { width: 65, height: 65, borderRadius: 20, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center", marginTop: 6 }, directoryModalInitial: { color: C.blue, fontSize: 20, fontWeight: "900" }, directoryModalTitle: { color: C.ink, fontSize: 19, fontWeight: "900", textAlign: "center", marginTop: 13 }, directoryModalText: { color: C.muted, fontSize: 10, textAlign: "center", marginTop: 5 }, directoryFacts: { width: "100%", flexDirection: "row", gap: 9, marginTop: 17 }, directoryFact: { flex: 1, backgroundColor: C.bg, borderRadius: 13, padding: 12, alignItems: "center" }, directoryFactValue: { color: C.ink, fontSize: 18, fontWeight: "900" }, directoryFactLabel: { color: C.muted, fontSize: 7, fontWeight: "900", letterSpacing: 0.7, marginTop: 3 }, directoryActions: { width: "100%", flexDirection: "row", gap: 9, marginTop: 13 }, directoryAction: { flex: 1, minHeight: 43, borderRadius: 13, backgroundColor: C.bg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, directoryActionText: { color: C.blue, fontSize: 9, fontWeight: "900" }, directoryNote: { width: "100%", borderRadius: 13, backgroundColor: "#EAF4FC", padding: 12, flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13 }, directoryNoteText: { flex: 1, color: C.muted, fontSize: 9, lineHeight: 14 },
});
