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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import LoginScreen from "./LoginScreen";
import AppShell from "./AppShell";
import TasksScreen from "./TasksScreen";
import { DirectoryScreen, OperationsScreen, ReportsScreen } from "./CommercialScreens";
import {
  createReception,
  createImport,
  createTrackingEvent,
  downloadDocument,
  getCurrentUser,
  listDocuments,
  listImports,
  listReceptions,
  listTrackingEvents,
  loadStoredSession,
  login as loginApi,
  logout as logoutApi,
  RefineryApiError,
  storeSession,
  uploadDocument,
  updateDocument,
  updateImport,
} from "./refineryApi";

const C = {
  navy: "#071C2B",
  navy2: "#0D2A3D",
  blue: "#2788E8",
  cyan: "#23C8B2",
  orange: "#FFAA3D",
  green: "#16A673",
  red: "#E24C4B",
  purple: "#7959D9",
  ink: "#112B3A",
  muted: "#72828C",
  line: "#DCE7EC",
  bg: "#F2F6F8",
  white: "#FFFFFF",
};

const STATUS_COLORS = {
  Documentación: C.purple,
  "En tránsito": C.blue,
  "En altamar": C.cyan,
  "Proceso aduanal": C.orange,
  Recibida: C.green,
};

const TRACKING_STAGES = [
  { status: "Documentación", label: "Documentación", icon: "documents-outline", progress: 18 },
  { status: "En tránsito", label: "Despacho de origen", icon: "navigate-outline", progress: 40 },
  { status: "En altamar", label: "Tránsito marítimo", icon: "boat-outline", progress: 62 },
  { status: "Proceso aduanal", label: "Aduana y liberación", icon: "shield-checkmark-outline", progress: 86 },
  { status: "Recibida", label: "Recepción en planta", icon: "checkmark-done-outline", progress: 100 },
];

function formatEta(value) {
  if (!value) return "Sin fecha";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-GT", { day: "2-digit", month: "short", year: "numeric" })
    .format(date)
    .replace(" de ", " ");
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function compactCurrency(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `US$ ${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `US$ ${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
}

function mapApiImport(item) {
  return {
    id: item.id,
    bl: item.bl,
    reference: item.referencia,
    supplier: item.proveedor,
    material: item.material,
    carrier: item.transportista,
    origin: item.origen,
    destinationPort: item.puerto_destino,
    incoterm: item.incoterm,
    eta: formatEta(item.fecha_estimada_arribo),
    etaRaw: item.fecha_estimada_arribo,
    status: item.estado,
    priority: item.prioridad || "Media",
    progress: Number(item.progreso || 0),
    color: STATUS_COLORS[item.estado] || C.blue,
    container: item.contenedor || "Sin asignar",
    packages: item.bultos || "Sin registrar",
    destination: item.destino_planta || "Por definir",
    duca: item.duca || "Pendiente",
    customsStatus: item.estado_aduanal || "Sin gestión",
    invoice: item.factura || "Pendiente",
    value: formatCurrency(item.valor_usd),
    valueNumber: Number(item.valor_usd || 0),
    updatedAt: item.actualizada_en,
    documentCount: Number(item.documentos_count || 0),
    pendingTaskCount: Number(item.tareas_pendientes_count || 0),
    openIncidentCount: Number(item.incidencias_abiertas_count || 0),
  };
}

const IMPORTS = [
  {
    bl: "MAEU-254781963",
    reference: "IMP-2026-018",
    supplier: "ALFA LAVAL",
    material: "Separador centrífugo y repuestos",
    carrier: "Maersk Line",
    origin: "Gotemburgo, Suecia",
    destinationPort: "Puerto Santo Tomás",
    incoterm: "CIF Puerto Santo Tomás",
    eta: "28 Jul 2026",
    status: "En tránsito",
    progress: 72,
    color: C.blue,
    container: "MSKU 784210-5",
    packages: "8 cajas / 4,260 kg",
    destination: "Edificio de Refinería · Almacén técnico",
    duca: "DUCA-GT 158421 · Rect. 01",
    invoice: "INV-SE-10482",
    value: "US$ 286,450",
  },
  {
    bl: "ONEY-468201756",
    reference: "IMP-2026-021",
    supplier: "KBK CHEM-ENGINEERING",
    material: "Sistema de blanqueo y tubería",
    carrier: "Ocean Network Express",
    origin: "Mumbai, India",
    destinationPort: "Puerto Quetzal",
    incoterm: "FOB Nhava Sheva",
    eta: "05 Ago 2026",
    status: "En altamar",
    progress: 44,
    color: C.cyan,
    container: "ONEU 321954-2",
    packages: "12 bultos / 18,740 kg",
    destination: "Edificio de Refinería · Patio de montaje",
    duca: "Pendiente de transmisión",
    invoice: "KBK-EXP-7781",
    value: "US$ 412,800",
  },
  {
    bl: "HLCU-903184725",
    reference: "IMP-2026-009",
    supplier: "SIEMENS",
    material: "Variadores y tableros eléctricos",
    carrier: "Hapag-Lloyd",
    origin: "Hamburgo, Alemania",
    destinationPort: "Puerto Santo Tomás",
    incoterm: "DAP Refinería",
    eta: "En aduana",
    status: "Proceso aduanal",
    progress: 88,
    color: C.orange,
    container: "HLXU 551020-8",
    packages: "6 pallets / 2,930 kg",
    destination: "Edificio de Utilidades · Bodega eléctrica",
    duca: "DUCA-GT 157902 · Rect. 02",
    invoice: "DE-INV-88310",
    value: "US$ 134,920",
  },
  {
    bl: "CMDU-715908342",
    reference: "IMP-2026-004",
    supplier: "VEOLIA WATER TECHNOLOGIES",
    material: "Bombas y membranas para WTP",
    carrier: "CMA CGM",
    origin: "Rotterdam, Países Bajos",
    destinationPort: "Puerto Santo Tomás",
    incoterm: "CIP Refinería",
    eta: "18 Jul 2026",
    status: "Recibida",
    progress: 100,
    color: C.green,
    container: "CMAU 440875-1",
    packages: "10 cajas / 6,120 kg",
    destination: "WTP · Bodega de repuestos",
    duca: "DUCA-GT 156734 · Definitiva",
    invoice: "VWT-2026-3190",
    value: "US$ 98,600",
  },
  {
    bl: "MEDU-662140389",
    reference: "IMP-2026-023",
    supplier: "PALM TRADING PTE.",
    material: "Aceite crudo de palma (CPO)",
    carrier: "MSC",
    origin: "Cartagena, Colombia",
    destinationPort: "Terminal marítima",
    incoterm: "CFR Terminal marítima",
    eta: "12 Ago 2026",
    status: "Documentación",
    progress: 18,
    color: C.purple,
    container: "Carga a granel · Lote CPO-2608",
    packages: "4,850 toneladas métricas",
    destination: "Tank Farm · Tanque CPO-01",
    duca: "En preparación",
    invoice: "CPO-260812",
    value: "US$ 4.52M",
  },
];

const INITIAL_DOCUMENTS = {
  "MAEU-254781963": [
    { id: "d1", type: "BL / BOL", name: "BL_MAEU-254781963.pdf", version: "Original", status: "Validado", date: "10 Jul 2026" },
    { id: "d2", type: "Factura comercial", name: "INV-SE-10482.pdf", version: "Versión 2", status: "Validado", date: "12 Jul 2026" },
    { id: "d3", type: "Packing list", name: "Packing_INV-SE-10482.pdf", version: "Versión 1", status: "Validado", date: "12 Jul 2026" },
    { id: "d4", type: "DUCA", name: "DUCA_158421_R01.pdf", version: "Rectificación 01", status: "En revisión", date: "22 Jul 2026" },
  ],
  "ONEY-468201756": [
    { id: "d5", type: "BL / BOL", name: "BL_ONEY-468201756.pdf", version: "Original", status: "Validado", date: "19 Jul 2026" },
    { id: "d6", type: "Factura comercial", name: "KBK-EXP-7781.pdf", version: "Versión 1", status: "Pendiente", date: "20 Jul 2026" },
    { id: "d7", type: "Packing list", name: "PL_KBK-EXP-7781.pdf", version: "Versión 1", status: "Validado", date: "20 Jul 2026" },
  ],
  "HLCU-903184725": [
    { id: "d8", type: "BL / BOL", name: "BL_HLCU-903184725.pdf", version: "Original", status: "Validado", date: "01 Jul 2026" },
    { id: "d9", type: "Factura comercial", name: "DE-INV-88310.pdf", version: "Versión 1", status: "Validado", date: "02 Jul 2026" },
    { id: "d10", type: "Packing list", name: "PL_DE-INV-88310.pdf", version: "Versión 1", status: "Validado", date: "02 Jul 2026" },
    { id: "d11", type: "DUCA", name: "DUCA_157902_R02.pdf", version: "Rectificación 02", status: "Observación", date: "23 Jul 2026" },
  ],
  "CMDU-715908342": [
    { id: "d12", type: "BL / BOL", name: "BL_CMDU-715908342.pdf", version: "Original", status: "Validado", date: "20 Jun 2026" },
    { id: "d13", type: "DUCA", name: "DUCA_156734_FINAL.pdf", version: "Definitiva", status: "Validado", date: "17 Jul 2026" },
  ],
  "MEDU-662140389": [],
};

const SUPPLIERS = [
  {
    id: "p1",
    name: "ALFA LAVAL",
    category: "Equipos de proceso y separación",
    country: "Suecia",
    contact: "Contacto comercial",
    email: "compras@alfalaval.example",
    phone: "+502 0000-0001",
    activeImports: 2,
    color: C.blue,
  },
  {
    id: "p2",
    name: "KBK CHEM-ENGINEERING",
    category: "Ingeniería para refinería de aceite",
    country: "India",
    contact: "Coordinación de proyectos",
    email: "projects@kbk.example",
    phone: "+502 0000-0002",
    activeImports: 1,
    color: C.orange,
  },
  {
    id: "p3",
    name: "SIEMENS",
    category: "Automatización y potencia",
    country: "Alemania",
    contact: "Ventas industriales",
    email: "industria@siemens.example",
    phone: "+502 0000-0003",
    activeImports: 1,
    color: C.cyan,
  },
  {
    id: "p4",
    name: "VEOLIA WATER TECHNOLOGIES",
    category: "Tratamiento de agua",
    country: "Países Bajos",
    contact: "Servicio posventa",
    email: "service@veolia.example",
    phone: "+502 0000-0004",
    activeImports: 0,
    color: C.green,
  },
];

const LOCATIONS = [
  { id: "l1", area: "Edificio de Refinería", detail: "Almacén técnico · Rack R-04", units: "184", icon: "business-outline", color: C.blue },
  { id: "l2", area: "Edificio de Utilidades", detail: "Bodega eléctrica y laboratorio", units: "76", icon: "flask-outline", color: C.cyan },
  { id: "l3", area: "WTP", detail: "Bodega de repuestos de agua", units: "42", icon: "water-outline", color: C.green },
  { id: "l4", area: "ETP", detail: "Almacén de químicos y bombas", units: "31", icon: "leaf-outline", color: C.purple },
  { id: "l5", area: "Tank Farm", detail: "CPO-01 / CPO-02 · 5,000 TM c/u", units: "2 tanques", icon: "server-outline", color: C.orange },
  { id: "l6", area: "Tank Farm", detail: "RPO-01 / RPO-02 / RPO-03 · 3,000 TM c/u", units: "3 tanques", icon: "server-outline", color: C.orange },
];

function Header({ title, subtitle }) {
  return (
    <View style={s.header}>
      <View style={s.flex}>
        <Text style={s.eyebrow}>PALM REFINERY · LOGISTICS</Text>
        <Text style={s.headerTitle}>{title}</Text>
        {subtitle ? <Text style={s.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function ProgressBar({ value, color }) {
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

function Metric({ label, value, icon, color, onPress }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={s.metric} onPress={onPress} activeOpacity={0.82}>
      <View style={[s.metricIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
      {onPress ? <Ionicons name="arrow-forward" size={13} color="#9CA9B1" style={s.metricArrow} /> : null}
    </Wrapper>
  );
}

function StatusBadge({ label, color }) {
  return (
    <View style={[s.badge, { backgroundColor: `${color}18` }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={42} color="#A7B3BA" />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

function Dashboard({ imports, openImport, refreshing, onRefresh, onNavigate }) {
  const upcoming = imports.filter((item) => item.status !== "Recibida").slice(0, 3);
  const active = imports.filter((item) => item.status !== "Recibida");
  const activeValue = active.reduce((sum, item) => sum + (item.valueNumber || 0), 0);
  const received = imports.filter((item) => item.status === "Recibida").length;
  const inTransit = imports.filter((item) => ["En tránsito", "En altamar"].includes(item.status)).length;
  const customs = imports.filter((item) => item.status === "Proceso aduanal").length;
  const documentation = imports.filter((item) => item.status === "Documentación").length;
  const today = new Intl.DateTimeFormat("es-GT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
  return (
    <ScrollView
      contentContainerStyle={s.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}
    >
      <View style={s.welcomeRow}><View style={s.flex}><Text style={s.welcomeEyebrow}>RESUMEN EJECUTIVO · {today.toUpperCase()}</Text><Text style={s.welcomeTitle}>Todo lo importante, en una sola vista.</Text><Text style={s.welcomeText}>Monitorea valor, riesgos y avance de las importaciones de la refinería.</Text></View><View style={s.livePill}><View style={s.livePulse} /><Text style={s.livePillText}>DATOS EN LÍNEA</Text></View></View>

      <View style={s.hero}>
        <View style={s.heroCircle} />
        <View style={s.heroTop}><View style={s.flex}><Text style={s.heroKicker}>VALOR ACTIVO EN IMPORTACIONES</Text><Text style={s.heroValue}>{compactCurrency(activeValue)}</Text><Text style={s.heroText}>{active.length} expedientes activos · {new Set(active.map((item) => item.supplier)).size} proveedores</Text></View><TouchableOpacity style={s.heroAction} onPress={() => onNavigate("reports")}><Ionicons name="stats-chart" size={19} color={C.navy} /><Text style={s.heroActionText}>Abrir analítica</Text></TouchableOpacity></View>
        <View style={s.heroFooter}>
          <View style={s.heroPill}>
            <Ionicons name="boat-outline" size={17} color={C.cyan} />
            <Text style={s.heroPillText}>{inTransit} en tránsito</Text>
          </View>
          <View style={s.heroPill}>
            <Ionicons name="alert-circle-outline" size={17} color={C.orange} />
            <Text style={s.heroPillText}>{customs + documentation} requieren acción</Text>
          </View>
        </View>
      </View>

      <View style={s.metrics}>
        <Metric label="Recibidas" value={received} icon="checkmark-circle-outline" color={C.green} onPress={() => onNavigate("imports")} />
        <Metric label="En camino" value={inTransit} icon="boat-outline" color={C.blue} onPress={() => onNavigate("imports")} />
        <Metric label="En aduana" value={customs} icon="document-text-outline" color={C.orange} onPress={() => onNavigate("operations")} />
        <Metric label="Documentos" value={documentation} icon="folder-open-outline" color={C.purple} onPress={() => onNavigate("operations")} />
      </View>

      <View style={s.pipelineCard}><View style={s.pipelineHeader}><View><Text style={s.pipelineEyebrow}>PIPELINE OPERATIVO</Text><Text style={s.pipelineTitle}>Distribución de expedientes</Text></View><TouchableOpacity onPress={() => onNavigate("imports")}><Text style={s.sectionAction}>Explorar →</Text></TouchableOpacity></View><View style={s.pipelineBar}>{TRACKING_STAGES.map((stage) => { const count = imports.filter((item) => item.status === stage.status).length; return <TouchableOpacity key={stage.status} style={{ flex: Math.max(1, count), backgroundColor: STATUS_COLORS[stage.status] }} onPress={() => onNavigate("imports")} />; })}</View><View style={s.pipelineLegend}>{TRACKING_STAGES.map((stage) => <View key={stage.status} style={s.pipelineLegendItem}><View style={[s.pipelineDot, { backgroundColor: STATUS_COLORS[stage.status] }]} /><Text style={s.pipelineLegendText}>{stage.label}</Text><Text style={s.pipelineLegendValue}>{imports.filter((item) => item.status === stage.status).length}</Text></View>)}</View></View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Importaciones prioritarias</Text>
        <TouchableOpacity onPress={() => onNavigate("imports")}><Text style={s.sectionAction}>Ver todos →</Text></TouchableOpacity>
      </View>
      {upcoming.map((item) => (
        <TouchableOpacity key={item.bl} style={s.importCard} onPress={() => openImport(item)}>
          <View style={s.rowBetween}>
            <View style={s.row}>
              <View style={[s.shipIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name="boat" size={21} color={item.color} />
              </View>
              <View style={s.flex}>
                <Text style={s.bl}>{item.bl}</Text>
                <Text style={s.cardTitle} numberOfLines={1}>{item.material}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.muted} />
          </View>
          <View style={s.metaRow}>
            <Text style={s.meta}>{item.supplier}</Text>
            <Text style={s.eta}>ETA {item.eta}</Text>
          </View>
          <ProgressBar value={item.progress} color={item.color} />
        </TouchableOpacity>
      ))}
      {!upcoming.length ? <EmptyState icon="checkmark-circle-outline" title="Operación al día" text="No hay importaciones activas pendientes." /> : null}

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Alertas del día</Text>
      </View>
      <TouchableOpacity style={s.alert} onPress={() => onNavigate("operations")} activeOpacity={0.82}>
        <Ionicons name="warning-outline" size={23} color={C.orange} />
        <View style={s.flex}>
          <Text style={s.alertTitle}>{customs ? "Expedientes en proceso aduanal" : "Sin bloqueos aduanales"}</Text>
          <Text style={s.alertText}>{customs ? `${customs} expediente(s) requieren seguimiento de liberación y DUCA.` : "No hay expedientes detenidos en aduana en este momento."}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.orange} />
      </TouchableOpacity>
      <TouchableOpacity style={[s.alert, { backgroundColor: "#EEF7FD", borderColor: "#C9E2F4" }]} onPress={onRefresh} activeOpacity={0.82}>
        <Ionicons name="time-outline" size={23} color={C.blue} />
        <View style={s.flex}>
          <Text style={[s.alertTitle, { color: C.ink }]}>Datos sincronizados con MySQL</Text>
          <Text style={[s.alertText, { color: C.muted }]}>Desliza hacia abajo para consultar la información más reciente del servidor.</Text>
        </View>
        <Ionicons name="refresh" size={18} color={C.blue} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function ImportsScreen({ imports, openImport, refreshing, onRefresh, onNewImport, canWrite }) {
  const { width } = useWindowDimensions();
  const columns = width >= 980 ? 2 : 1;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");
  const filtered = useMemo(() => {
    return imports.filter((item) => {
      const matchesQuery = `${item.bl} ${item.reference} ${item.supplier} ${item.material}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesFilter =
        filter === "Todas" ||
        (filter === "Recibidas" && item.status === "Recibida") ||
        (filter === "En curso" && item.status !== "Recibida");
      return matchesQuery && matchesFilter;
    });
  }, [imports, query, filter]);

  return (
    <FlatList
      key={`imports-${columns}`}
      data={filtered}
      numColumns={columns}
      columnWrapperStyle={columns > 1 ? s.importColumns : undefined}
      keyExtractor={(item) => item.bl}
      contentContainerStyle={s.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}
      ListHeaderComponent={
        <>
          <View style={s.importsHero}><View style={s.importsHeroGlow} /><View style={s.flex}><Text style={s.importsHeroEyebrow}>TORRE DE CONTROL</Text><Text style={s.importsHeroTitle}>{imports.length} expedientes conectados</Text><Text style={s.importsHeroText}>Seguimiento integral desde documentación hasta recepción en planta.</Text></View><View style={s.importsHeroStat}><Text style={s.importsHeroStatValue}>{imports.filter((item) => item.status !== "Recibida").length}</Text><Text style={s.importsHeroStatLabel}>ACTIVOS</Text></View></View>
          <View style={s.search}>
            <Ionicons name="search" size={20} color={C.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar BL, proveedor o material"
              placeholderTextColor="#8B98A1"
              style={s.searchInput}
            />
            <Ionicons name="scan-outline" size={21} color={C.blue} />
          </View>
          <View style={s.filters}>
            {["Todas", "En curso", "Recibidas"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[s.filter, filter === item && s.filterActive]}
                onPress={() => setFilter(item)}
              >
                <Text style={[s.filterText, filter === item && s.filterTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.resultCount}>{filtered.length} expedientes encontrados</Text>
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={[s.importCard, columns > 1 && s.importGridCard]} onPress={() => openImport(item)} activeOpacity={0.82}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.blLabel}>BILL OF LADING</Text>
              <Text style={s.blLarge}>{item.bl}</Text>
            </View>
            <StatusBadge label={item.status} color={item.color} />
          </View>
          <Text style={[s.cardTitle, s.top10]}>{item.material}</Text>
          <Text style={s.meta}>{item.supplier} · {item.reference}</Text>
          <View style={s.route}>
            <View style={s.routeDot} />
            <View style={s.routeLine} />
            <Ionicons name="location" size={18} color={item.color} />
          </View>
          <View style={s.rowBetween}>
            <Text style={s.meta}>{item.origin}</Text>
            <Text style={s.eta}>ETA {item.eta}</Text>
          </View>
          <ProgressBar value={item.progress} color={item.color} />
          <View style={s.cardFooter}>
            <View style={s.inlineMeta}>
              <Ionicons name="cube-outline" size={15} color={C.muted} />
              <Text style={s.meta}>{item.container}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={C.muted} />
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<EmptyState icon="search-outline" title="Sin resultados" text="Prueba con otro BL, proveedor o estado." />}
    />
  );
}

function InventoryScreen() {
  const [query, setQuery] = useState("");
  const filtered = LOCATIONS.filter((item) =>
    `${item.area} ${item.detail}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={s.screen}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <Header title="Ubicaciones de planta" subtitle="Destino interno de materiales importados" />
          <View style={s.search}>
            <Ionicons name="search" size={20} color={C.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Área, edificio, tanque o bodega"
              placeholderTextColor="#8B98A1"
              style={s.searchInput}
            />
            <Ionicons name="barcode-outline" size={21} color={C.blue} />
          </View>
          <View style={s.locationHero}>
            <View>
              <Text style={s.locationKicker}>CAPACIDAD TANK FARM</Text>
              <Text style={s.locationValue}>19,000 TM</Text>
              <Text style={s.locationText}>2 tanques CPO · 3 tanques RPO / oleína</Text>
            </View>
            <Ionicons name="server-outline" size={46} color={C.cyan} />
          </View>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Áreas registradas</Text>
            <Text style={s.sectionAction}>{filtered.length} ubicaciones</Text>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={s.locationCard}>
          <View style={[s.locationIcon, { backgroundColor: `${item.color}18` }]}>
            <Ionicons name={item.icon} size={25} color={item.color} />
          </View>
          <View style={s.flex}>
            <Text style={s.cardTitle}>{item.area}</Text>
            <Text style={s.meta}>{item.detail}</Text>
          </View>
          <View style={s.locationQty}>
            <Text style={s.locationQtyValue}>{item.units}</Text>
            <Text style={s.locationQtyLabel}>registrados</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

function SuppliersScreen() {
  const [query, setQuery] = useState("");
  const filtered = SUPPLIERS.filter((item) =>
    `${item.name} ${item.category} ${item.country}`.toLowerCase().includes(query.toLowerCase())
  );

  const contact = (kind, value) => {
    if (value.includes(".example") || value.includes("0000-")) {
      Alert.alert("Dato de demostración", "Sustituye este contacto por la información autorizada del proveedor antes de utilizarlo.");
      return;
    }
    Linking.openURL(kind === "email" ? `mailto:${value}` : `tel:${value}`);
  };

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={s.screen}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <Header title="Proveedores" subtitle="Directorio de contactos logísticos y comerciales" />
          <View style={s.search}>
            <Ionicons name="search" size={20} color={C.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Proveedor, país o especialidad"
              placeholderTextColor="#8B98A1"
              style={s.searchInput}
            />
            <TouchableOpacity>
              <Ionicons name="person-add-outline" size={21} color={C.blue} />
            </TouchableOpacity>
          </View>
          <View style={s.infoNote}>
            <Ionicons name="information-circle-outline" size={20} color={C.blue} />
            <Text style={s.infoNoteText}>Los contactos actuales son demostrativos. Reemplázalos únicamente con datos empresariales autorizados.</Text>
          </View>
        </>
      }
      renderItem={({ item }) => (
        <View style={s.supplierCard}>
          <View style={s.rowBetween}>
            <View style={[s.supplierLogo, { backgroundColor: `${item.color}18` }]}>
              <Text style={[s.supplierInitial, { color: item.color }]}>{item.name.slice(0, 2)}</Text>
            </View>
            <View style={s.flex}>
              <Text style={s.supplierName}>{item.name}</Text>
              <Text style={s.meta}>{item.category}</Text>
              <View style={s.inlineMeta}>
                <Ionicons name="location-outline" size={14} color={C.muted} />
                <Text style={s.meta}>{item.country}</Text>
              </View>
            </View>
            <StatusBadge label={`${item.activeImports} activas`} color={item.activeImports ? C.blue : C.muted} />
          </View>
          <View style={s.contactName}>
            <Ionicons name="person-outline" size={17} color={C.muted} />
            <Text style={s.contactNameText}>{item.contact}</Text>
          </View>
          <View style={s.contactActions}>
            <TouchableOpacity style={s.contactButton} onPress={() => contact("email", item.email)}>
              <Ionicons name="mail-outline" size={18} color={C.blue} />
              <Text style={s.contactButtonText}>Correo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.contactButton} onPress={() => contact("phone", item.phone)}>
              <Ionicons name="call-outline" size={18} color={C.green} />
              <Text style={[s.contactButtonText, { color: C.green }]}>Llamar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="people-outline" title="Sin proveedores" text="No se encontraron coincidencias." />}
    />
  );
}

function DetailHeader({ onBack, onMore }) {
  return (
    <View style={s.detailHeader}>
      <TouchableOpacity style={s.iconButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={23} color={C.ink} />
      </TouchableOpacity>
      <Text style={s.detailHeaderTitle}>Expediente de importación</Text>
      <TouchableOpacity style={s.iconButton} onPress={onMore} accessibilityLabel="Abrir acciones del expediente">
        <Ionicons name="ellipsis-horizontal" size={23} color={C.ink} />
      </TouchableOpacity>
    </View>
  );
}

function InfoPair({ label, value }) {
  return (
    <View style={s.infoPair}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function DocumentRow({ doc, onPress }) {
  const color = doc.status === "Validado" ? C.green : doc.status === "Observación" ? C.red : C.orange;
  return (
    <TouchableOpacity style={s.documentRow} onPress={onPress}>
      <View style={[s.documentIcon, { backgroundColor: `${color}14` }]}>
        <Ionicons name="document-text-outline" size={23} color={color} />
      </View>
      <View style={s.flex}>
        <Text style={s.documentType}>{doc.type}</Text>
        <Text style={s.documentName} numberOfLines={1}>{doc.name}</Text>
        <Text style={s.meta}>{doc.version} · {doc.date}</Text>
      </View>
      <View style={s.documentRight}>
        <StatusBadge label={doc.status} color={color} />
        <Ionicons name="chevron-forward" size={17} color={C.muted} />
      </View>
    </TouchableOpacity>
  );
}

function ImportDetail({ item, onBack, onAdvance, onRefreshImport, onOpenOperations, canWrite, updating, session }) {
  const [tab, setTab] = useState("Seguimiento");
  const [showUpload, setShowUpload] = useState(false);
  const [showReception, setShowReception] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentType, setDocumentType] = useState("DUCA");
  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [receptions, setReceptions] = useState([]);
  const [detailBusy, setDetailBusy] = useState(false);
  const [receptionCondition, setReceptionCondition] = useState("Conforme");
  const [receivedPackages, setReceivedPackages] = useState("");
  const [receptionNotes, setReceptionNotes] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventNote, setEventNote] = useState("");
  const types = ["DUCA", "Factura comercial", "Packing list", "BL / BOL", "Otro"];

  const loadDetails = async () => {
    if (!item?.id) return;
    setDetailBusy(true);
    try {
      const [nextEvents, nextDocuments, nextReceptions] = await Promise.all([
        listTrackingEvents(session, item.id),
        listDocuments(session, item.id),
        listReceptions(session, item.id),
      ]);
      setEvents(nextEvents);
      setDocuments(nextDocuments);
      setReceptions(nextReceptions);
    } catch (error) {
      Alert.alert("No se pudo cargar el expediente", error.message);
    } finally {
      setDetailBusy(false);
    }
  };

  useEffect(() => { loadDetails(); }, [item?.id]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      setDetailBusy(true);
      await uploadDocument(session, item.id, { file, type: documentType });
      setShowUpload(false);
      await loadDetails();
      Alert.alert("Documento cargado", `${file.name} quedó almacenado en el expediente ${item.bl}.`);
    } catch (error) {
      setDetailBusy(false);
      Alert.alert("No se pudo cargar el documento", error.message || "Verifica el archivo e intenta nuevamente.");
    }
  };

  const saveReception = async () => {
    setDetailBusy(true);
    try {
      await createReception(session, item.id, {
        recibida_en: new Date().toISOString(),
        bultos_recibidos: receivedPackages ? Number(receivedPackages) : null,
        condicion: receptionCondition,
        observaciones: receptionNotes || null,
      });
      setShowReception(false);
      setReceivedPackages(""); setReceptionNotes("");
      await loadDetails();
      await onRefreshImport();
      Alert.alert("Recepción registrada", `La recepción de ${item.reference} quedó en la bitácora.`);
    } catch (error) {
      Alert.alert("No se pudo registrar", error.message);
    } finally { setDetailBusy(false); }
  };

  const saveEvent = async () => {
    if (!eventTitle.trim()) return Alert.alert("Título requerido", "Describe brevemente el evento que deseas registrar.");
    setDetailBusy(true);
    try {
      await createTrackingEvent(session, item.id, {
        tipo: "Actualización manual",
        estado: item.status,
        titulo: eventTitle.trim(),
        descripcion: eventNote.trim() || null,
        ocurrido_en: new Date().toISOString(),
      });
      setEventTitle(""); setEventNote(""); setShowActions(false);
      await loadDetails();
      Alert.alert("Evento registrado", "La bitácora del expediente fue actualizada.");
    } catch (error) {
      Alert.alert("No se pudo registrar", error.message);
    } finally { setDetailBusy(false); }
  };

  const changeDocumentStatus = async (estado) => {
    if (!selectedDocument) return;
    setDetailBusy(true);
    try {
      await updateDocument(session, selectedDocument.id, estado);
      setSelectedDocument(null);
      await loadDetails();
      Alert.alert("Documento actualizado", `El archivo quedó marcado como “${estado}”.`);
    } catch (error) {
      Alert.alert("No se pudo actualizar", error.message);
    } finally { setDetailBusy(false); }
  };

  return (
    <View style={s.flex}>
      <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
        <DetailHeader onBack={onBack} onMore={() => setShowActions(true)} />
        <View style={s.detailHero}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.detailKicker}>BILL OF LADING · IDENTIFICADOR FIJO</Text>
              <Text style={s.detailBl}>{item.bl}</Text>
            </View>
            <StatusBadge label={item.status} color={item.color} />
          </View>
          <Text style={s.detailMaterial}>{item.material}</Text>
          <Text style={s.detailSupplier}>{item.supplier} · {item.reference}</Text>
          <View style={s.detailRoute}>
            <Ionicons name="boat" size={24} color={C.white} />
            <View style={s.detailRouteLine} />
            <Ionicons name="location" size={25} color={C.orange} />
          </View>
          <View style={s.rowBetween}>
            <Text style={s.detailMeta}>{item.origin}</Text>
            <Text style={s.detailEta}>ETA {item.eta}</Text>
          </View>
        </View>

        <View style={s.tabs}>
          {["Seguimiento", "Documentos", "Recepción", "Información"].map((name) => (
            <TouchableOpacity key={name} style={[s.innerTab, tab === name && s.innerTabActive]} onPress={() => setTab(name)}>
              <Text style={[s.innerTabText, tab === name && s.innerTabTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "Seguimiento" ? (
          <>
            <View style={s.rowBetween}>
              <View style={s.flex}>
                <Text style={s.sectionTitle}>Ruta operativa</Text>
                <Text style={s.meta}>Avance registrado: {item.progress}%</Text>
              </View>
              {canWrite && item.status !== "Recibida" ? (
                <TouchableOpacity style={s.primaryButton} onPress={() => onAdvance(item)} disabled={updating}>
                  {updating ? <ActivityIndicator size="small" color={C.white} /> : <Ionicons name="arrow-forward" size={18} color={C.white} />}
                  <Text style={s.primaryButtonText}>{updating ? "Guardando" : "Avanzar"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={s.timelineCard}>
              {TRACKING_STAGES.map((stage, index) => {
                const currentIndex = TRACKING_STAGES.findIndex((entry) => entry.status === item.status);
                const done = index < currentIndex || item.status === "Recibida";
                const current = index === currentIndex && item.status !== "Recibida";
                const color = done ? C.green : current ? item.color : "#B8C3C9";
                return (
                  <View key={stage.status} style={s.timelineRow}>
                    <View style={s.timelineRail}>
                      <View style={[s.timelineDot, { backgroundColor: color }]}>
                        <Ionicons name={done ? "checkmark" : stage.icon} size={15} color={C.white} />
                      </View>
                      {index < TRACKING_STAGES.length - 1 ? <View style={[s.timelineLine, done && { backgroundColor: C.green }]} /> : null}
                    </View>
                    <View style={[s.timelineContent, current && s.timelineContentCurrent]}>
                      <View style={s.rowBetween}>
                        <Text style={[s.timelineTitle, (done || current) && { color: C.ink }]}>{stage.label}</Text>
                        <Text style={[s.timelineState, { color }]}>{done ? "COMPLETADO" : current ? "EN CURSO" : "PENDIENTE"}</Text>
                      </View>
                      <Text style={s.timelineText}>
                        {current ? `Estado actual del expediente ${item.bl}.` : done ? "Hito operativo completado." : "Se habilitará al completar el hito anterior."}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={s.rowBetween}>
              <View><Text style={[s.sectionTitle, s.top22]}>Bitácora del expediente</Text><Text style={s.meta}>{events.length} eventos registrados</Text></View>
              {detailBusy ? <ActivityIndicator size="small" color={C.blue} /> : null}
            </View>
            <View style={s.documentList}>
              {events.length ? events.map((event) => (
                <View key={event.id} style={s.documentRow}>
                  <View style={[s.documentIcon, { backgroundColor: "#EAF4FC" }]}><Ionicons name="pulse-outline" size={22} color={C.blue} /></View>
                  <View style={s.flex}><Text style={s.documentType}>{event.titulo}</Text><Text style={s.documentName}>{event.descripcion || event.tipo}</Text><Text style={s.meta}>{formatEta(String(event.ocurrido_en || "").slice(0, 10))} · {event.usuario?.name || "Sistema"}</Text></View>
                </View>
              )) : <EmptyState icon="pulse-outline" title="Sin eventos" text="Los cambios del expediente aparecerán aquí." />}
            </View>
            {!canWrite ? (
              <View style={s.infoNote}>
                <Ionicons name="eye-outline" size={20} color={C.blue} />
                <Text style={s.infoNoteText}>Tu rol tiene acceso de consulta. Un operador o administrador puede actualizar el estado.</Text>
              </View>
            ) : null}
          </>
        ) : tab === "Documentos" ? (
          <>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.sectionTitle}>Carpeta del BL</Text>
                <Text style={s.meta}>{documents.length} archivos y versiones</Text>
              </View>
              {canWrite ? (
                <TouchableOpacity style={s.primaryButton} onPress={() => setShowUpload(true)}>
                  <Ionicons name="cloud-upload-outline" size={19} color={C.white} />
                  <Text style={s.primaryButtonText}>Subir</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={s.documentList}>
              {documents.length ? (
                documents.map((doc) => <DocumentRow key={doc.id} onPress={() => setSelectedDocument(doc)} doc={{ ...doc, type: doc.tipo, name: doc.nombre_original, version: doc.version, status: doc.estado, date: formatEta(String(doc.created_at || "").slice(0, 10)) }} />)
              ) : (
                <EmptyState icon="folder-open-outline" title="Carpeta vacía" text="Carga el BL, la factura, el packing list o la DUCA." />
              )}
            </View>
            <View style={s.versionNote}>
              <Ionicons name="git-compare-outline" size={21} color={C.purple} />
              <Text style={s.versionNoteText}>El BL conserva el expediente. Las rectificaciones de DUCA y nuevas facturas se agregan como versiones sin reemplazar el historial.</Text>
            </View>
          </>
        ) : tab === "Recepción" ? (
          <>
            <View style={s.rowBetween}>
              <View><Text style={s.sectionTitle}>Recepciones en planta</Text><Text style={s.meta}>{receptions.length} registros de entrega</Text></View>
              {canWrite ? <TouchableOpacity style={s.primaryButton} onPress={() => setShowReception(true)}><Ionicons name="cube-outline" size={18} color={C.white} /><Text style={s.primaryButtonText}>Recibir</Text></TouchableOpacity> : null}
            </View>
            <View style={s.documentList}>{receptions.length ? receptions.map((entry) => (
              <View key={entry.id} style={s.documentRow}><View style={[s.documentIcon, { backgroundColor: entry.condicion === "Conforme" ? "#EAF7F3" : "#FFF4E1" }]}><Ionicons name={entry.condicion === "Conforme" ? "checkmark-done" : "alert-outline"} size={22} color={entry.condicion === "Conforme" ? C.green : C.orange} /></View><View style={s.flex}><Text style={s.documentType}>{entry.condicion}</Text><Text style={s.documentName}>{entry.observaciones || "Sin observaciones"}</Text><Text style={s.meta}>{formatEta(String(entry.recibida_en).slice(0, 10))} · {entry.bultos_recibidos ?? "—"} bultos</Text></View></View>
            )) : <EmptyState icon="cube-outline" title="Pendiente de recepción" text="Registra la entrega, diferencias y condición de la carga." />}</View>
          </>
        ) : (
          <>
            <Text style={s.sectionTitle}>Datos de la operación</Text>
            <View style={s.infoGrid}>
              <InfoPair label="CONTENEDOR / LOTE" value={item.container} />
              <InfoPair label="CANTIDAD" value={item.packages} />
              <InfoPair label="INCOTERM" value={item.incoterm} />
              <InfoPair label="VALOR FACTURA" value={item.value} />
              <InfoPair label="DUCA VIGENTE" value={item.duca} />
              <InfoPair label="ESTADO ADUANAL" value={item.customsStatus} />
              <InfoPair label="FACTURA" value={item.invoice} />
              <InfoPair label="PRIORIDAD" value={item.priority} />
            </View>
            <Text style={[s.sectionTitle, s.top22]}>Destino en planta</Text>
            <View style={s.destinationCard}>
              <View style={s.destinationIcon}>
                <Ionicons name="location" size={25} color={C.blue} />
              </View>
              <View style={s.flex}>
                <Text style={s.cardTitle}>{item.destination}</Text>
                <Text style={s.meta}>Ubicación prevista para la recepción</Text>
              </View>
              <Ionicons name="checkmark-circle-outline" size={20} color={C.green} />
            </View>
          </>
        )}
      </ScrollView>

      <Modal transparent visible={showUpload} animationType="slide" onRequestClose={() => setShowUpload(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Agregar documento</Text>
            <Text style={s.modalText}>Expediente BL {item.bl}</Text>
            <Text style={s.fieldLabel}>TIPO DE DOCUMENTO</Text>
            <View style={s.typeWrap}>
              {types.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[s.typeChip, documentType === type && s.typeChipActive]}
                  onPress={() => setDocumentType(type)}
                >
                  <Text style={[s.typeChipText, documentType === type && s.typeChipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.pickerBox} onPress={pickDocument}>
              <Ionicons name="document-attach-outline" size={40} color={C.blue} />
              <Text style={s.pickerTitle}>Seleccionar archivo</Text>
              <Text style={s.pickerText}>PDF o imagen desde el dispositivo</Text>
            </TouchableOpacity>
            <Pressable style={s.cancelButton} onPress={() => setShowUpload(false)}>
              <Text style={s.cancelButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={Boolean(selectedDocument)} animationType="fade" onRequestClose={() => setSelectedDocument(null)}>
        <View style={[s.modalBackdrop, { justifyContent: "center", padding: 18 }]}><View style={s.documentModal}><TouchableOpacity style={s.documentModalClose} onPress={() => setSelectedDocument(null)}><Ionicons name="close" size={20} color={C.ink} /></TouchableOpacity><View style={s.documentModalIcon}><Ionicons name="document-text-outline" size={31} color={C.blue} /></View><Text style={s.documentModalTitle}>{selectedDocument?.tipo}</Text><Text style={s.documentModalName}>{selectedDocument?.nombre_original}</Text><View style={s.documentFacts}><InfoPair label="VERSIÓN" value={selectedDocument?.version || "1.0"} /><InfoPair label="ESTADO" value={selectedDocument?.estado || "Pendiente"} /></View><TouchableOpacity style={s.documentDownload} onPress={() => downloadDocument(session, selectedDocument).catch((error) => Alert.alert("No se pudo descargar", error.message))}><Ionicons name="download-outline" size={19} color={C.white} /><Text style={s.documentDownloadText}>Descargar archivo</Text></TouchableOpacity>{canWrite ? <View style={s.documentReviewActions}><TouchableOpacity style={s.documentReviewButton} onPress={() => changeDocumentStatus("Rechazado")} disabled={detailBusy}><Ionicons name="close-circle-outline" size={19} color={C.red} /><Text style={[s.documentReviewText, { color: C.red }]}>Rechazar</Text></TouchableOpacity><TouchableOpacity style={s.documentReviewButton} onPress={() => changeDocumentStatus("Validado")} disabled={detailBusy}><Ionicons name="checkmark-circle-outline" size={19} color={C.green} /><Text style={[s.documentReviewText, { color: C.green }]}>Validar</Text></TouchableOpacity></View> : null}</View></View>
      </Modal>

      <Modal transparent visible={showReception} animationType="slide" onRequestClose={() => setShowReception(false)}>
        <View style={s.modalBackdrop}><View style={s.modalSheet}><View style={s.modalHandle} /><Text style={s.modalTitle}>Registrar recepción</Text><Text style={s.modalText}>{item.reference} · {item.bl}</Text><Text style={s.fieldLabel}>CONDICIÓN</Text><View style={s.typeWrap}>{["Conforme", "Con diferencias", "Dañada", "Parcial"].map((value) => <TouchableOpacity key={value} style={[s.typeChip, receptionCondition === value && s.typeChipActive]} onPress={() => setReceptionCondition(value)}><Text style={[s.typeChipText, receptionCondition === value && s.typeChipTextActive]}>{value}</Text></TouchableOpacity>)}</View><Text style={s.fieldLabel}>BULTOS RECIBIDOS</Text><TextInput value={receivedPackages} onChangeText={setReceivedPackages} keyboardType="numeric" style={s.modalInput} placeholder="Cantidad" /><Text style={s.fieldLabel}>OBSERVACIONES</Text><TextInput value={receptionNotes} onChangeText={setReceptionNotes} multiline style={[s.modalInput, s.modalMultiline]} placeholder="Diferencias, daños o ubicación final" /><TouchableOpacity style={s.cancelButton} onPress={saveReception} disabled={detailBusy}>{detailBusy ? <ActivityIndicator color={C.white} /> : <Text style={s.cancelButtonText}>Confirmar recepción</Text>}</TouchableOpacity><Pressable style={s.modalCancelLink} onPress={() => setShowReception(false)}><Text style={s.modalCancelText}>Cancelar</Text></Pressable></View></View>
      </Modal>

      <Modal transparent visible={showActions} animationType="slide" onRequestClose={() => setShowActions(false)}>
        <View style={s.modalBackdrop}><View style={s.modalSheet}><View style={s.modalHandle} /><View style={s.rowBetween}><View><Text style={s.modalTitle}>Acciones del expediente</Text><Text style={s.modalText}>{item.reference} · {item.bl}</Text></View><View style={s.actionModalIcon}><Ionicons name="flash-outline" size={23} color={C.blue} /></View></View>
          {canWrite ? <><Text style={s.fieldLabel}>NUEVO EVENTO EN BITÁCORA</Text><TextInput value={eventTitle} onChangeText={setEventTitle} style={s.modalInput} placeholder="Ej. Naviera confirmó fecha de zarpe" /><TextInput value={eventNote} onChangeText={setEventNote} multiline style={[s.modalInput, s.modalMultiline, { marginTop: 9 }]} placeholder="Detalle, ubicación o evidencia" /><TouchableOpacity style={s.cancelButton} onPress={saveEvent} disabled={detailBusy}>{detailBusy ? <ActivityIndicator color={C.white} /> : <View style={s.row}><Ionicons name="pulse-outline" size={18} color={C.white} /><Text style={s.cancelButtonText}>Guardar en bitácora</Text></View>}</TouchableOpacity></> : null}
          <TouchableOpacity style={s.actionMenuRow} onPress={() => { setShowActions(false); onOpenOperations?.(); }}><View style={[s.actionMenuIcon, { backgroundColor: "#FFF4E4" }]}><Ionicons name="warning-outline" size={21} color={C.orange} /></View><View style={s.flex}><Text style={s.actionMenuTitle}>Tareas e incidencias</Text><Text style={s.actionMenuText}>Abrir el centro de gestión operativa</Text></View><Ionicons name="chevron-forward" size={19} color={C.muted} /></TouchableOpacity>
          <TouchableOpacity style={s.actionMenuRow} onPress={() => { setShowActions(false); setTab("Documentos"); }}><View style={[s.actionMenuIcon, { backgroundColor: "#F0ECFB" }]}><Ionicons name="documents-outline" size={21} color={C.purple} /></View><View style={s.flex}><Text style={s.actionMenuTitle}>Carpeta documental</Text><Text style={s.actionMenuText}>Consultar, descargar o cargar archivos</Text></View><Ionicons name="chevron-forward" size={19} color={C.muted} /></TouchableOpacity>
          <Pressable style={s.modalCancelLink} onPress={() => setShowActions(false)}><Text style={s.modalCancelText}>Cerrar</Text></Pressable>
        </View></View>
      </Modal>
    </View>
  );
}

function NewImportModal({ visible, busy, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    referencia: "", bl: "", proveedor: "", material: "", transportista: "",
    origen: "", puerto_destino: "Puerto Santo Tomás", incoterm: "CIF",
    fecha_estimada_arribo: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    contenedor: "", bultos: "", destino_planta: "", valor_usd: "", prioridad: "Media",
  });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const close = () => { setStep(1); onClose(); };
  const next = () => {
    if (step === 1 && (!form.referencia.trim() || !form.bl.trim() || !form.proveedor.trim() || !form.material.trim())) return Alert.alert("Datos incompletos", "Completa referencia, BL, proveedor y material.");
    if (step === 2 && (!form.transportista.trim() || !form.origen.trim() || !form.puerto_destino.trim() || !form.incoterm.trim())) return Alert.alert("Datos incompletos", "Completa la ruta y el transporte.");
    setStep((value) => Math.min(3, value + 1));
  };
  const save = () => onSave({
    ...form,
    estado: "Documentación",
    progreso: 10,
    valor_usd: form.valor_usd ? Number(form.valor_usd) : null,
  });

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={close}>
      <View style={s.modalBackdrop}>
        <View style={[s.modalSheet, { maxHeight: "94%" }]}>
          <View style={s.modalHandle} />
          <View style={s.rowBetween}><View><Text style={s.modalTitle}>Nueva importación</Text><Text style={s.modalText}>Paso {step} de 3 · Alta de expediente</Text></View><View style={s.wizardSteps}>{[1, 2, 3].map((value) => <View key={value} style={[s.wizardDot, value <= step && s.wizardDotActive]} />)}</View></View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {step === 1 ? <>
              <Text style={s.fieldLabel}>REFERENCIA INTERNA</Text><TextInput value={form.referencia} onChangeText={(value) => set("referencia", value)} style={s.modalInput} placeholder="IMP-2026-024" autoCapitalize="characters" />
              <Text style={s.fieldLabel}>BILL OF LADING</Text><TextInput value={form.bl} onChangeText={(value) => set("bl", value)} style={s.modalInput} placeholder="MAEU-000000000" autoCapitalize="characters" />
              <Text style={s.fieldLabel}>PROVEEDOR</Text><TextInput value={form.proveedor} onChangeText={(value) => set("proveedor", value)} style={s.modalInput} placeholder="Razón social" />
              <Text style={s.fieldLabel}>MATERIAL / EQUIPO</Text><TextInput value={form.material} onChangeText={(value) => set("material", value)} style={[s.modalInput, s.modalMultiline]} multiline placeholder="Descripción de la carga" />
            </> : step === 2 ? <>
              <Text style={s.fieldLabel}>TRANSPORTISTA / NAVIERA</Text><TextInput value={form.transportista} onChangeText={(value) => set("transportista", value)} style={s.modalInput} placeholder="Naviera" />
              <Text style={s.fieldLabel}>ORIGEN</Text><TextInput value={form.origen} onChangeText={(value) => set("origen", value)} style={s.modalInput} placeholder="Ciudad, país" />
              <Text style={s.fieldLabel}>PUERTO DESTINO</Text><TextInput value={form.puerto_destino} onChangeText={(value) => set("puerto_destino", value)} style={s.modalInput} />
              <Text style={s.fieldLabel}>INCOTERM</Text><View style={s.typeWrap}>{["CIF", "FOB", "CIP", "DAP", "CFR"].map((value) => <TouchableOpacity key={value} style={[s.typeChip, form.incoterm === value && s.typeChipActive]} onPress={() => set("incoterm", value)}><Text style={[s.typeChipText, form.incoterm === value && s.typeChipTextActive]}>{value}</Text></TouchableOpacity>)}</View>
            </> : <>
              <Text style={s.fieldLabel}>FECHA ESTIMADA DE ARRIBO</Text><TextInput value={form.fecha_estimada_arribo} onChangeText={(value) => set("fecha_estimada_arribo", value)} style={s.modalInput} placeholder="AAAA-MM-DD" />
              <Text style={s.fieldLabel}>CONTENEDOR / LOTE</Text><TextInput value={form.contenedor} onChangeText={(value) => set("contenedor", value)} style={s.modalInput} placeholder="Número de contenedor" />
              <Text style={s.fieldLabel}>BULTOS / PESO</Text><TextInput value={form.bultos} onChangeText={(value) => set("bultos", value)} style={s.modalInput} placeholder="8 cajas / 4,260 kg" />
              <Text style={s.fieldLabel}>DESTINO EN PLANTA</Text><TextInput value={form.destino_planta} onChangeText={(value) => set("destino_planta", value)} style={s.modalInput} placeholder="Área o bodega" />
              <Text style={s.fieldLabel}>VALOR USD</Text><TextInput value={form.valor_usd} onChangeText={(value) => set("valor_usd", value)} style={s.modalInput} keyboardType="decimal-pad" placeholder="0.00" />
              <Text style={s.fieldLabel}>PRIORIDAD</Text><View style={s.typeWrap}>{["Baja", "Media", "Alta", "Crítica"].map((value) => <TouchableOpacity key={value} style={[s.typeChip, form.prioridad === value && s.typeChipActive]} onPress={() => set("prioridad", value)}><Text style={[s.typeChipText, form.prioridad === value && s.typeChipTextActive]}>{value}</Text></TouchableOpacity>)}</View>
            </>}
            <View style={s.wizardActions}>{step > 1 ? <TouchableOpacity style={s.secondaryButton} onPress={() => setStep((value) => value - 1)}><Text style={s.secondaryButtonText}>Atrás</Text></TouchableOpacity> : null}<TouchableOpacity style={[s.cancelButton, s.flex, busy && { opacity: 0.6 }]} disabled={busy} onPress={step === 3 ? save : next}>{busy ? <ActivityIndicator color={C.white} /> : <Text style={s.cancelButtonText}>{step === 3 ? "Crear expediente" : "Continuar"}</Text>}</TouchableOpacity></View>
            <Pressable style={s.modalCancelLink} onPress={close}><Text style={s.modalCancelText}>Cancelar</Text></Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function RefineryLogisticsApp() {
  const [session, setSession] = useState(() => loadStoredSession());
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [imports, setImports] = useState([]);
  const [dataBusy, setDataBusy] = useState(false);
  const [dataError, setDataError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [showNewImport, setShowNewImport] = useState(false);
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);

  const clearSession = () => {
    storeSession(null);
    setSession(null);
    setImports([]);
    setSelected(null);
    setScreen("home");
  };

  const loadData = async (activeSession = session) => {
    if (!activeSession?.accessToken) return;
    setDataBusy(true);
    setDataError("");
    try {
      const rows = await listImports(activeSession);
      const mapped = rows.map(mapApiImport);
      setImports(mapped);
      setSelected((current) => current ? mapped.find((item) => item.id === current.id) || current : current);
    } catch (error) {
      if (error instanceof RefineryApiError && error.status === 401) {
        clearSession();
        setAuthError("Tu sesión venció. Ingresa nuevamente.");
      } else {
        setDataError(error.message || "No se pudieron cargar las importaciones.");
      }
    } finally {
      setDataBusy(false);
    }
  };

  useEffect(() => {
    if (!session?.accessToken) return;
    let cancelled = false;
    const restore = async () => {
      try {
        const user = await getCurrentUser(session);
        if (cancelled) return;
        const restored = { ...session, user };
        setSession(restored);
        storeSession(restored);
        await loadData(restored);
      } catch (error) {
        if (cancelled) return;
        clearSession();
        setAuthError(error.status === 401 ? "Tu sesión venció. Ingresa nuevamente." : "No se pudo restaurar la sesión guardada.");
      }
    };
    restore();
    return () => { cancelled = true; };
    // Solo se ejecuta al cambiar el token; evita recargar por la actualización del usuario.
  }, [session?.accessToken]);

  const handleLogin = async (email, password) => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const nextSession = await loginApi(email, password);
      storeSession(nextSession);
      setSession(nextSession);
    } catch (error) {
      setAuthError(error.message || "No fue posible iniciar sesión.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    const activeSession = session;
    clearSession();
    try {
      await logoutApi(activeSession);
    } catch {
      // La sesión local se cierra incluso cuando el servidor no está disponible.
    }
  };

  const openImport = (item) => {
    setSelected(item);
    setScreen("detail");
  };

  const advanceImport = async (item) => {
    const index = TRACKING_STAGES.findIndex((stage) => stage.status === item.status);
    const next = TRACKING_STAGES[Math.min(index + 1, TRACKING_STAGES.length - 1)];
    if (!next || next.status === item.status) return;
    setUpdatingId(item.id);
    try {
      const updated = mapApiImport(await updateImport(session, item.id, {
        estado: next.status,
        progreso: next.progress,
      }));
      setImports((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setSelected(updated);
      Alert.alert("Seguimiento actualizado", `${item.bl} avanzó a “${next.label}”.`);
    } catch (error) {
      Alert.alert("No se pudo actualizar", error.message || "Intenta nuevamente.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateImport = async (data) => {
    setDataBusy(true);
    try {
      const created = mapApiImport(await createImport(session, data));
      setShowNewImport(false);
      await loadData(session);
      setSelected(created);
      setScreen("detail");
      Alert.alert("Expediente creado", `${created.reference} quedó registrado con el BL ${created.bl}.`);
    } catch (error) {
      Alert.alert("No se pudo crear", error.message);
    } finally { setDataBusy(false); }
  };

  const content = () => {
    if (screen === "home") return <Dashboard imports={imports} openImport={openImport} refreshing={dataBusy} onRefresh={loadData} onNavigate={setScreen} />;
    if (screen === "imports") return <ImportsScreen imports={imports} openImport={openImport} refreshing={dataBusy} onRefresh={loadData} onNewImport={() => setShowNewImport(true)} canWrite={session?.user?.permissions?.some((scope) => ["admin", "importaciones.write"].includes(scope))} />;
    if (screen === "operations") return <OperationsScreen session={session} imports={imports} onOpenImport={openImport} canWrite={session?.user?.permissions?.some((scope) => ["admin", "importaciones.write"].includes(scope))} />;
    if (screen === "tasks") return <TasksScreen session={session} imports={imports} />;
    if (screen === "reports") return <ReportsScreen session={session} imports={imports} onOpenImport={openImport} />;
    if (screen === "directory") return <DirectoryScreen session={session} />;
    return (
      <ImportDetail
        item={selected || imports[0]}
        onBack={() => setScreen("imports")}
        onAdvance={advanceImport}
        onRefreshImport={() => loadData(session)}
        onOpenOperations={() => setScreen("operations")}
        canWrite={session?.user?.permissions?.some((scope) => ["admin", "importaciones.write"].includes(scope))}
        updating={updatingId === (selected || imports[0]).id}
        session={session}
      />
    );
  };

  if (!session) {
    return <LoginScreen busy={authBusy} error={authError} onLogin={handleLogin} />;
  }

  if (dataBusy && !imports.length) {
    return (
      <SafeAreaView style={s.loadingScreen}>
        <StatusBar style="light" />
        <View style={s.loadingLogo}><Ionicons name="layers" size={29} color={C.navy} /></View>
        <ActivityIndicator color={C.cyan} size="large" />
        <Text style={s.loadingTitle}>Preparando centro de control</Text>
        <Text style={s.loadingText}>Consultando importaciones y permisos…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.app}>
      <StatusBar style="dark" />
      {dataError ? (
        <TouchableOpacity style={s.syncError} onPress={() => loadData()}>
          <Ionicons name="cloud-offline-outline" size={17} color={C.white} />
          <Text style={s.syncErrorText} numberOfLines={1}>{dataError} · Toca para reintentar</Text>
        </TouchableOpacity>
      ) : null}
      <AppShell screen={screen} onNavigate={setScreen} user={session.user} onLogout={handleLogout} onCreate={() => setShowNewImport(true)} onRefresh={() => loadData()} refreshing={dataBusy} canWrite={session?.user?.permissions?.some((scope) => ["admin", "importaciones.write"].includes(scope))}>
        {content()}
      </AppShell>
      <NewImportModal visible={showNewImport} busy={dataBusy} onClose={() => setShowNewImport(false)} onSave={handleCreateImport} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === "android" ? 28 : 0 },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.navy, padding: 28 },
  loadingLogo: { width: 58, height: 58, borderRadius: 18, backgroundColor: C.cyan, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  loadingTitle: { color: C.white, fontSize: 18, fontWeight: "800", marginTop: 18 },
  loadingText: { color: "#9DB7C3", fontSize: 11, marginTop: 6 },
  syncError: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.red, paddingHorizontal: 14, paddingVertical: 9 },
  syncErrorText: { flex: 1, color: C.white, fontSize: 10, fontWeight: "700" },
  flex: { flex: 1 },
  screen: { padding: 20, paddingBottom: 32, width: "100%", maxWidth: 960, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 },
  eyebrow: { color: C.blue, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  headerTitle: { color: C.ink, fontSize: 25, fontWeight: "800", marginTop: 4 },
  headerSubtitle: { color: C.muted, fontSize: 12, marginTop: 4 },
  welcomeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 },
  welcomeEyebrow: { color: C.blue, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  welcomeTitle: { color: C.ink, fontSize: 24, fontWeight: "900", letterSpacing: -0.6, marginTop: 5 },
  welcomeText: { color: C.muted, fontSize: 10, marginTop: 4 },
  livePill: { borderRadius: 18, backgroundColor: "#E6F7F1", paddingHorizontal: 10, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.green },
  livePillText: { color: C.green, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  avatarButton: { width: 43, height: 43, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1F4055" },
  avatarText: { color: C.white, fontSize: 15, fontWeight: "900" },
  onlineDot: { position: "absolute", right: -2, bottom: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: C.green, borderWidth: 2, borderColor: C.bg },
  notificationDot: { position: "absolute", right: 9, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: C.orange, borderWidth: 1, borderColor: C.white },
  hero: { backgroundColor: C.navy, borderRadius: 22, padding: 22, overflow: "hidden" },
  heroCircle: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "#0C4560", right: -55, top: -90, opacity: 0.75 },
  heroKicker: { color: "#8EAFBF", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  heroAction: { minHeight: 42, borderRadius: 13, backgroundColor: C.cyan, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  heroActionText: { color: C.navy, fontSize: 9, fontWeight: "900" },
  heroValue: { color: C.white, fontSize: 31, fontWeight: "800", marginTop: 8 },
  heroText: { color: "#BDD0D9", fontSize: 12, marginTop: 4 },
  heroFooter: { flexDirection: "row", gap: 8, marginTop: 20 },
  heroPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.navy2, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  heroPillText: { color: "#D9E6EC", fontSize: 11, fontWeight: "700" },
  metrics: { flexDirection: "row", gap: 8, marginTop: 13 },
  metric: { flex: 1, backgroundColor: C.white, borderRadius: 15, padding: 10, borderWidth: 1, borderColor: C.line },
  metricIcon: { width: 31, height: 31, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  metricValue: { color: C.ink, fontSize: 20, fontWeight: "800", marginTop: 7 },
  metricLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
  metricArrow: { position: "absolute", right: 9, top: 9 },
  pipelineCard: { backgroundColor: C.white, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 15, marginTop: 12 },
  pipelineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pipelineEyebrow: { color: C.blue, fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  pipelineTitle: { color: C.ink, fontSize: 13, fontWeight: "900", marginTop: 3 },
  pipelineBar: { height: 10, borderRadius: 5, overflow: "hidden", flexDirection: "row", marginTop: 14 },
  pipelineLegend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  pipelineLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  pipelineDot: { width: 7, height: 7, borderRadius: 4 },
  pipelineLegendText: { color: C.muted, fontSize: 7, fontWeight: "700" },
  pipelineLegendValue: { color: C.ink, fontSize: 8, fontWeight: "900" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 11 },
  sectionTitle: { color: C.ink, fontSize: 17, fontWeight: "800" },
  sectionAction: { color: C.blue, fontSize: 12, fontWeight: "700" },
  importCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.line },
  row: { flexDirection: "row", alignItems: "center", gap: 11, flexShrink: 1 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  shipIcon: { width: 43, height: 43, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  bl: { color: C.blue, fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  blLabel: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  blLarge: { color: C.blue, fontSize: 15, fontWeight: "800", marginTop: 3 },
  cardTitle: { color: C.ink, fontSize: 13, fontWeight: "700", marginTop: 3 },
  meta: { color: C.muted, fontSize: 11, marginTop: 3 },
  eta: { color: C.ink, fontSize: 11, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 13 },
  progressTrack: { height: 5, borderRadius: 4, backgroundColor: "#E8EDF0", marginTop: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  alert: { flexDirection: "row", gap: 11, borderRadius: 16, padding: 14, backgroundColor: "#FFF7E8", borderWidth: 1, borderColor: "#F8D99E", marginBottom: 9 },
  alertTitle: { color: "#704B06", fontSize: 12, fontWeight: "800" },
  alertText: { color: "#80652E", fontSize: 11, lineHeight: 16, marginTop: 3 },
  search: { height: 48, borderRadius: 15, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  searchInput: { flex: 1, height: "100%", paddingHorizontal: 10, color: C.ink, fontSize: 13 },
  importsHero: { backgroundColor: C.navy, borderRadius: 21, padding: 18, flexDirection: "row", alignItems: "center", gap: 13, overflow: "hidden", marginBottom: 12 },
  importsHeroGlow: { position: "absolute", width: 170, height: 170, borderRadius: 85, right: -45, top: -80, backgroundColor: "#0C4C62", opacity: 0.7 },
  importsHeroEyebrow: { color: C.cyan, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  importsHeroTitle: { color: C.white, fontSize: 19, fontWeight: "900", marginTop: 4 },
  importsHeroText: { color: "#A8C0CB", fontSize: 9, marginTop: 4 },
  importsHeroStat: { width: 66, height: 66, borderRadius: 20, backgroundColor: "#123A4C", alignItems: "center", justifyContent: "center" },
  importsHeroStatValue: { color: C.white, fontSize: 23, fontWeight: "900" },
  importsHeroStatLabel: { color: C.cyan, fontSize: 6, fontWeight: "900", marginTop: 2 },
  importColumns: { gap: 12 },
  importGridCard: { flex: 1, maxWidth: "50%" },
  filters: { flexDirection: "row", gap: 8, marginTop: 14 },
  newImportButton: { height: 45, borderRadius: 13, backgroundColor: C.navy, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  newImportButtonText: { color: C.white, fontSize: 11, fontWeight: "800" },
  filter: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  filterActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterText: { color: C.muted, fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: C.white },
  resultCount: { color: C.muted, fontSize: 11, marginVertical: 14 },
  badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 9, fontWeight: "800" },
  top10: { marginTop: 10 },
  top22: { marginTop: 22 },
  route: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 7 },
  routeDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: C.muted },
  routeLine: { height: 1, flex: 1, backgroundColor: C.line, marginHorizontal: 7 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: C.line, marginTop: 13, paddingTop: 10 },
  inlineMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  empty: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 20 },
  emptyTitle: { color: C.ink, fontSize: 14, fontWeight: "800", marginTop: 9 },
  emptyText: { color: C.muted, fontSize: 11, textAlign: "center", lineHeight: 16, marginTop: 4 },
  locationHero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.navy, borderRadius: 20, padding: 19, marginTop: 14 },
  locationKicker: { color: "#8EAFBF", fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  locationValue: { color: C.white, fontSize: 27, fontWeight: "800", marginTop: 6 },
  locationText: { color: "#BDD0D9", fontSize: 11, marginTop: 3 },
  locationCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.white, borderRadius: 17, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: C.line },
  locationIcon: { width: 45, height: 45, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  locationQty: { alignItems: "flex-end" },
  locationQtyValue: { color: C.ink, fontSize: 13, fontWeight: "800" },
  locationQtyLabel: { color: C.muted, fontSize: 9, marginTop: 2 },
  infoNote: { flexDirection: "row", gap: 8, backgroundColor: "#EEF7FD", borderWidth: 1, borderColor: "#C9E2F4", padding: 12, borderRadius: 14, marginVertical: 14 },
  infoNoteText: { color: "#416579", fontSize: 10, lineHeight: 15, flex: 1 },
  supplierCard: { backgroundColor: C.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line, marginBottom: 11 },
  supplierLogo: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 11 },
  supplierInitial: { fontSize: 15, fontWeight: "900" },
  supplierName: { color: C.ink, fontSize: 13, fontWeight: "800" },
  contactName: { flexDirection: "row", alignItems: "center", gap: 7, borderTopWidth: 1, borderTopColor: C.line, marginTop: 13, paddingTop: 11 },
  contactNameText: { color: C.muted, fontSize: 11 },
  contactActions: { flexDirection: "row", gap: 8, marginTop: 11 },
  contactButton: { flex: 1, height: 38, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.bg },
  contactButtonText: { color: C.blue, fontSize: 11, fontWeight: "800" },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 17 },
  detailHeaderTitle: { color: C.ink, fontSize: 15, fontWeight: "800" },
  detailHero: { backgroundColor: C.navy, borderRadius: 22, padding: 19 },
  detailKicker: { color: C.cyan, fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  detailBl: { color: C.white, fontSize: 19, fontWeight: "800", marginTop: 5 },
  detailMaterial: { color: C.white, fontSize: 19, fontWeight: "800", marginTop: 19 },
  detailSupplier: { color: "#BCD0DA", fontSize: 11, marginTop: 5 },
  detailRoute: { flexDirection: "row", alignItems: "center", marginTop: 26, marginBottom: 13 },
  detailRouteLine: { flex: 1, height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#668291", marginHorizontal: 9 },
  detailMeta: { color: "#BCD0DA", fontSize: 10 },
  detailEta: { color: C.white, fontSize: 11, fontWeight: "800" },
  tabs: { flexDirection: "row", backgroundColor: "#E4EAED", borderRadius: 13, padding: 3, marginVertical: 17 },
  innerTab: { flex: 1, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  innerTabActive: { backgroundColor: C.white },
  innerTabText: { color: C.muted, fontSize: 11, fontWeight: "700" },
  innerTabTextActive: { color: C.ink, fontWeight: "800" },
  primaryButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.blue, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 10 },
  primaryButtonText: { color: C.white, fontSize: 11, fontWeight: "800" },
  documentList: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 18, marginTop: 12, overflow: "hidden" },
  documentRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderBottomWidth: 1, borderBottomColor: C.line },
  documentIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  documentType: { color: C.ink, fontSize: 12, fontWeight: "800" },
  documentName: { color: C.muted, fontSize: 10, marginTop: 2, maxWidth: 190 },
  documentRight: { alignItems: "flex-end", gap: 7 },
  versionNote: { flexDirection: "row", gap: 10, backgroundColor: "#F3F0FC", borderWidth: 1, borderColor: "#DDD4F4", borderRadius: 15, padding: 13, marginTop: 12 },
  versionNoteText: { color: "#5D4C8A", fontSize: 10, lineHeight: 15, flex: 1 },
  timelineCard: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 16, marginTop: 14 },
  timelineRow: { flexDirection: "row", minHeight: 78 },
  timelineRail: { width: 34, alignItems: "center" },
  timelineDot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", zIndex: 1 },
  timelineLine: { position: "absolute", top: 30, bottom: 0, width: 2, backgroundColor: C.line },
  timelineContent: { flex: 1, marginLeft: 8, marginBottom: 12, padding: 11, borderRadius: 12, backgroundColor: "#F7F9FA" },
  timelineContentCurrent: { backgroundColor: "#EDF6FD", borderWidth: 1, borderColor: "#C6E0F3" },
  timelineTitle: { color: C.muted, fontSize: 12, fontWeight: "800" },
  timelineState: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  timelineText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 11 },
  infoPair: { width: "48%", backgroundColor: C.white, borderRadius: 15, padding: 13, borderWidth: 1, borderColor: C.line },
  infoLabel: { color: C.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.7 },
  infoValue: { color: C.ink, fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 5 },
  destinationCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.line, padding: 14, marginTop: 10 },
  destinationIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(7,27,44,0.55)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: C.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 21, paddingBottom: 31 },
  modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: C.line, alignSelf: "center", marginBottom: 18 },
  modalTitle: { color: C.ink, fontSize: 21, fontWeight: "800" },
  modalText: { color: C.muted, fontSize: 11, marginTop: 4 },
  fieldLabel: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginTop: 19, marginBottom: 9 },
  typeWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  typeChip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: C.line },
  typeChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  typeChipText: { color: C.muted, fontSize: 10, fontWeight: "700" },
  typeChipTextActive: { color: C.white },
  pickerBox: { height: 130, borderRadius: 17, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.blue, backgroundColor: "#F2F8FD", alignItems: "center", justifyContent: "center", marginTop: 17 },
  pickerTitle: { color: C.blue, fontSize: 12, fontWeight: "800", marginTop: 6 },
  pickerText: { color: C.muted, fontSize: 10, marginTop: 3 },
  modalInput: { minHeight: 45, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, color: C.ink, backgroundColor: "#FAFCFD", fontSize: 12 },
  modalMultiline: { minHeight: 78, paddingTop: 11, textAlignVertical: "top" },
  modalCancelLink: { height: 40, alignItems: "center", justifyContent: "center" },
  modalCancelText: { color: C.muted, fontSize: 11, fontWeight: "800" },
  documentModal: { width: "100%", maxWidth: 480, alignSelf: "center", backgroundColor: C.white, borderRadius: 23, padding: 22, alignItems: "center" },
  documentModalClose: { position: "absolute", right: 13, top: 13, width: 34, height: 34, borderRadius: 11, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  documentModalIcon: { width: 66, height: 66, borderRadius: 20, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center", marginTop: 5 },
  documentModalTitle: { color: C.ink, fontSize: 18, fontWeight: "900", marginTop: 12 },
  documentModalName: { color: C.muted, fontSize: 10, marginTop: 5, textAlign: "center" },
  documentFacts: { width: "100%", flexDirection: "row", gap: 8, marginTop: 15 },
  documentDownload: { width: "100%", height: 44, borderRadius: 12, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 13 },
  documentDownloadText: { color: C.white, fontSize: 10, fontWeight: "900" },
  documentReviewActions: { width: "100%", flexDirection: "row", gap: 8, marginTop: 9 },
  documentReviewButton: { flex: 1, height: 42, borderRadius: 12, backgroundColor: C.bg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  documentReviewText: { fontSize: 9, fontWeight: "900" },
  actionModalIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  actionMenuRow: { minHeight: 64, borderRadius: 15, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 10, padding: 11, marginTop: 10 },
  actionMenuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionMenuTitle: { color: C.ink, fontSize: 11, fontWeight: "900" },
  actionMenuText: { color: C.muted, fontSize: 9, marginTop: 3 },
  wizardSteps: { flexDirection: "row", gap: 5 },
  wizardDot: { width: 18, height: 5, borderRadius: 3, backgroundColor: C.line },
  wizardDotActive: { backgroundColor: C.blue },
  wizardActions: { flexDirection: "row", gap: 9, marginTop: 18 },
  secondaryButton: { minWidth: 90, height: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: C.muted, fontSize: 11, fontWeight: "800" },
  cancelButton: { height: 44, borderRadius: 12, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginTop: 13 },
  cancelButtonText: { color: C.white, fontSize: 12, fontWeight: "800" },
  tabBar: { height: 68, flexDirection: "row", backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, paddingBottom: Platform.OS === "ios" ? 8 : 0 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabLabel: { color: C.muted, fontSize: 9, fontWeight: "600" },
  tabLabelActive: { color: C.blue, fontWeight: "800" },
});
