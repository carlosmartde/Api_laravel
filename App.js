import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Pressable,
  Switch,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  navy: "#071B2C",
  blue: "#0B75D1",
  cyan: "#16B8C6",
  orange: "#F59E0B",
  green: "#22A06B",
  red: "#D64545",
  ink: "#172B3A",
  muted: "#6D7C87",
  line: "#DDE5EA",
  bg: "#F4F7F9",
  white: "#FFFFFF",
};

const shipments = [
  {
    id: "IMP-24018",
    material: "Tubería API 5L",
    origin: "Busan, Corea del Sur",
    vessel: "Pacific Meridian",
    incoterm: "CIF Santo Tomás",
    eta: "28 Jul",
    progress: 74,
    status: "En tránsito",
    color: COLORS.blue,
  },
  {
    id: "IMP-24021",
    material: "Válvulas de control",
    origin: "Hamburgo, Alemania",
    vessel: "Atlantic Star",
    incoterm: "FOB Hamburgo",
    eta: "05 Ago",
    progress: 42,
    status: "En altamar",
    color: COLORS.cyan,
  },
  {
    id: "IMP-24009",
    material: "Catalizador industrial",
    origin: "Houston, EE. UU.",
    vessel: "Gulf Express",
    incoterm: "DAP Refinería",
    eta: "En patio",
    progress: 100,
    status: "Recibido",
    color: COLORS.green,
  },
];

const inventory = [
  { id: "MAT-1082", name: 'Tubería 8" API 5L', qty: 128, unit: "tramos", location: "Patio A · Rack 04", level: 82 },
  { id: "EQP-0314", name: "Válvula mariposa", qty: 24, unit: "unidades", location: "Bodega 2 · Estante C", level: 55 },
  { id: "REP-0901", name: "Sello mecánico P-210", qty: 6, unit: "unidades", location: "Bodega 1 · Bin 18", level: 18 },
  { id: "QUI-0120", name: "Catalizador HDS", qty: 18, unit: "tambores", location: "Almacén químico", level: 64 },
];

function Header({ title, subtitle }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.eyebrow}>REFINERY IMPORT</Text>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="notifications-outline" size={23} color={COLORS.ink} />
        <View style={styles.notificationDot} />
      </TouchableOpacity>
    </View>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <View style={[styles.statCard, { borderTopColor: accent }]}>
      <View style={[styles.smallIcon, { backgroundColor: `${accent}18` }]}>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProgressBar({ value, color = COLORS.blue }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

function Dashboard({ onOpenShipment }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header title="Panel de operaciones" subtitle="Viernes, 24 de julio" />
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroKicker}>VALOR EN TRÁNSITO</Text>
        <Text style={styles.heroValue}>US$ 1.28M</Text>
        <Text style={styles.heroText}>8 embarques activos · 124 toneladas</Text>
        <View style={styles.heroRoute}>
          <Ionicons name="boat-outline" size={20} color={COLORS.white} />
          <View style={styles.heroLine} />
          <Ionicons name="location" size={20} color={COLORS.orange} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="boat-outline" label="En tránsito" value="8" accent={COLORS.blue} />
        <StatCard icon="document-text-outline" label="En aduana" value="3" accent={COLORS.orange} />
        <StatCard icon="cube-outline" label="Por ubicar" value="12" accent={COLORS.green} />
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Próximas llegadas</Text>
        <Text style={styles.sectionLink}>Ver todas</Text>
      </View>
      {shipments.slice(0, 2).map((item) => (
        <TouchableOpacity key={item.id} style={styles.shipmentCard} onPress={() => onOpenShipment(item)}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <View style={[styles.shipIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name="boat" size={22} color={item.color} />
              </View>
              <View>
                <Text style={styles.cardTitle}>{item.material}</Text>
                <Text style={styles.cardMeta}>{item.id} · {item.vessel}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </View>
          <View style={styles.spaceTop}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardMeta}>{item.origin}</Text>
              <Text style={styles.eta}>ETA {item.eta}</Text>
            </View>
            <ProgressBar value={item.progress} color={item.color} />
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.alertCard}>
        <Ionicons name="warning-outline" size={24} color={COLORS.orange} />
        <View style={styles.flex}>
          <Text style={styles.alertTitle}>Acción aduanal requerida</Text>
          <Text style={styles.alertText}>2 expedientes necesitan documentos antes de 48 horas.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Shipments({ onOpenShipment }) {
  const [query, setQuery] = useState("");
  const filtered = shipments.filter((s) =>
    `${s.id} ${s.material} ${s.vessel}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <View style={styles.flex}>
      <FlatList
        contentContainerStyle={styles.screenContent}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Header title="Embarques" subtitle="Seguimiento marítimo y terrestre" />
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={COLORS.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar BL, material o buque"
                placeholderTextColor="#8B98A1"
                style={styles.searchInput}
              />
              <Ionicons name="options-outline" size={20} color={COLORS.blue} />
            </View>
            <View style={styles.filterRow}>
              {["Todos  8", "Marítimo  5", "Terrestre  3"].map((label, index) => (
                <TouchableOpacity key={label} style={[styles.filterChip, index === 0 && styles.filterChipActive]}>
                  <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.shipmentCard} onPress={() => onOpenShipment(item)}>
            <View style={styles.rowBetween}>
              <Text style={styles.code}>{item.id}</Text>
              <View style={[styles.badge, { backgroundColor: `${item.color}18` }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, styles.spaceTopSmall]}>{item.material}</Text>
            <Text style={styles.cardMeta}>{item.vessel} · {item.incoterm}</Text>
            <View style={styles.routeRow}>
              <View style={styles.routePoint} />
              <View style={styles.routeLine} />
              <Ionicons name="location" size={18} color={item.color} />
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.cardMeta}>{item.origin}</Text>
              <Text style={styles.eta}>ETA {item.eta}</Text>
            </View>
            <ProgressBar value={item.progress} color={item.color} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No se encontraron embarques.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Customs() {
  const [alertsOnly, setAlertsOnly] = useState(true);
  const documents = [
    ["Factura comercial", "Validado", COLORS.green, "checkmark-circle"],
    ["Lista de empaque", "Validado", COLORS.green, "checkmark-circle"],
    ["Conocimiento de embarque (BL)", "Pendiente", COLORS.orange, "time"],
    ["Declaración de mercancías", "En revisión", COLORS.blue, "document-text"],
    ["Certificado de origen", "Observación", COLORS.red, "alert-circle"],
  ];
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header title="Control aduanal" subtitle="Expediente IMP-24018" />
      <View style={styles.customsSummary}>
        <View>
          <Text style={styles.heroKicker}>AVANCE DEL EXPEDIENTE</Text>
          <Text style={styles.customsPercent}>72%</Text>
        </View>
        <View style={styles.customsIcon}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.cyan} />
        </View>
        <ProgressBar value={72} color={COLORS.cyan} />
        <Text style={styles.customsHint}>Fecha estimada de levante: 30 de julio</Text>
      </View>

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.cardTitle}>Mostrar alertas primero</Text>
          <Text style={styles.cardMeta}>Prioriza documentos con observaciones</Text>
        </View>
        <Switch
          value={alertsOnly}
          onValueChange={setAlertsOnly}
          trackColor={{ false: COLORS.line, true: "#9CDDE3" }}
          thumbColor={alertsOnly ? COLORS.cyan : "#F4F4F4"}
        />
      </View>

      <Text style={[styles.sectionTitle, styles.sectionStandalone]}>Documentos</Text>
      <View style={styles.listCard}>
        {documents.map(([name, status, color, icon], index) => (
          <TouchableOpacity key={name} style={[styles.documentRow, index < documents.length - 1 && styles.rowDivider]}>
            <Ionicons name={icon} size={23} color={color} />
            <View style={styles.flex}>
              <Text style={styles.documentName}>{name}</Text>
              <Text style={[styles.cardMeta, { color }]}>{status}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.costCard}>
        <Text style={styles.sectionTitle}>Resumen de costos</Text>
        {[["Arancel estimado", "US$ 18,420"], ["IVA importación", "US$ 31,870"], ["Gastos portuarios", "US$ 4,250"]].map(([label, value]) => (
          <View key={label} style={styles.costRow}>
            <Text style={styles.cardMeta}>{label}</Text>
            <Text style={styles.costValue}>{value}</Text>
          </View>
        ))}
        <View style={[styles.costRow, styles.totalRow]}>
          <Text style={styles.cardTitle}>Total estimado</Text>
          <Text style={styles.totalValue}>US$ 54,540</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function Inventory() {
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const filtered = inventory.filter((item) =>
    `${item.id} ${item.name} ${item.location}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <View style={styles.flex}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenContent}
        ListHeaderComponent={
          <>
            <Header title="Inventario" subtitle="Existencias dentro de la refinería" />
            <View style={styles.searchBox}>
              <Ionicons name="search" size={20} color={COLORS.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Material, código o ubicación"
                placeholderTextColor="#8B98A1"
                style={styles.searchInput}
              />
              <Ionicons name="barcode-outline" size={22} color={COLORS.blue} />
            </View>
            <View style={styles.inventorySummary}>
              <View>
                <Text style={styles.summaryNumber}>1,284</Text>
                <Text style={styles.cardMeta}>Unidades registradas</Text>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setShowModal(true)}>
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Nueva entrada</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.inventoryCard}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <View style={styles.inventoryIcon}>
                  <Ionicons name="cube-outline" size={23} color={COLORS.blue} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardMeta}>{item.id}</Text>
                </View>
              </View>
              <Text style={styles.qty}>{item.qty}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.muted} />
              <Text style={styles.cardMeta}>{item.location}</Text>
              <Text style={styles.unit}>{item.unit}</Text>
            </View>
            <ProgressBar value={item.level} color={item.level < 25 ? COLORS.red : COLORS.green} />
            {item.level < 25 ? <Text style={styles.lowStock}>Stock bajo · generar reposición</Text> : null}
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
      <Modal transparent visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Registrar entrada</Text>
            <Text style={styles.modalText}>Escanea la etiqueta del material para asignarle una ubicación dentro de la refinería.</Text>
            <TouchableOpacity style={styles.scannerBox}>
              <Ionicons name="scan-outline" size={48} color={COLORS.blue} />
              <Text style={styles.scannerText}>Abrir lector de código</Text>
            </TouchableOpacity>
            <Pressable style={styles.secondaryButton} onPress={() => setShowModal(false)}>
              <Text style={styles.secondaryButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ShipmentDetail({ shipment, onBack }) {
  const item = shipment || shipments[0];
  const milestones = [
    ["Orden confirmada", "02 Jul · 09:30", true],
    ["Carga a bordo", "10 Jul · 18:45", true],
    ["Arribo a puerto", `Estimado ${item.eta}`, false],
    ["Liberación aduanal", "Pendiente", false],
    ["Ingreso a refinería", "Pendiente", false],
  ];
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={23} color={COLORS.ink} />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Detalle de embarque</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="ellipsis-horizontal" size={23} color={COLORS.ink} />
        </TouchableOpacity>
      </View>
      <View style={styles.detailHero}>
        <View style={styles.rowBetween}>
          <Text style={styles.codeLight}>{item.id}</Text>
          <View style={styles.darkBadge}><Text style={styles.darkBadgeText}>{item.status}</Text></View>
        </View>
        <Text style={styles.detailTitle}>{item.material}</Text>
        <Text style={styles.detailMeta}>{item.vessel} · {item.incoterm}</Text>
        <View style={styles.mapMock}>
          <Ionicons name="boat" size={26} color={COLORS.white} />
          <View style={styles.mapDashed} />
          <Ionicons name="location" size={28} color={COLORS.orange} />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.detailMeta}>{item.origin}</Text>
          <Text style={styles.etaLight}>ETA {item.eta}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, styles.sectionStandalone]}>Línea de tiempo</Text>
      <View style={styles.timelineCard}>
        {milestones.map(([label, date, complete], index) => (
          <View key={label} style={styles.timelineRow}>
            <View style={styles.timelineVisual}>
              <View style={[styles.timelineDot, complete && styles.timelineDotComplete]}>
                {complete ? <Ionicons name="checkmark" size={12} color={COLORS.white} /> : null}
              </View>
              {index < milestones.length - 1 ? <View style={[styles.timelineLine, complete && styles.timelineLineComplete]} /> : null}
            </View>
            <View style={styles.timelineText}>
              <Text style={[styles.documentName, !complete && { color: COLORS.muted }]}>{label}</Text>
              <Text style={styles.cardMeta}>{date}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoTile}><Text style={styles.infoLabel}>CONTENEDOR</Text><Text style={styles.infoValue}>MSCU 784210</Text></View>
        <View style={styles.infoTile}><Text style={styles.infoLabel}>PESO</Text><Text style={styles.infoValue}>22.4 t</Text></View>
        <View style={styles.infoTile}><Text style={styles.infoLabel}>INCOTERM</Text><Text style={styles.infoValue}>{item.incoterm.split(" ")[0]}</Text></View>
        <View style={styles.infoTile}><Text style={styles.infoLabel}>BODEGA DESTINO</Text><Text style={styles.infoValue}>Patio A</Text></View>
      </View>
    </ScrollView>
  );
}

const tabs = [
  { key: "home", label: "Inicio", icon: "home-outline", activeIcon: "home" },
  { key: "shipments", label: "Embarques", icon: "boat-outline", activeIcon: "boat" },
  { key: "customs", label: "Aduanas", icon: "document-text-outline", activeIcon: "document-text" },
  { key: "inventory", label: "Inventario", icon: "cube-outline", activeIcon: "cube" },
];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [selectedShipment, setSelectedShipment] = useState(null);

  const openShipment = (item) => {
    setSelectedShipment(item);
    setScreen("detail");
  };

  const renderScreen = () => {
    if (screen === "home") return <Dashboard onOpenShipment={openShipment} />;
    if (screen === "shipments") return <Shipments onOpenShipment={openShipment} />;
    if (screen === "customs") return <Customs />;
    if (screen === "inventory") return <Inventory />;
    return <ShipmentDetail shipment={selectedShipment} onBack={() => setScreen("shipments")} />;
  };

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="dark" />
      <View style={styles.flex}>{renderScreen()}</View>
      {screen !== "detail" ? (
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const active = screen === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => setScreen(tab.key)}>
                <Ionicons name={active ? tab.activeIcon : tab.icon} size={22} color={active ? COLORS.blue : COLORS.muted} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: COLORS.bg, paddingTop: Platform.OS === "android" ? 28 : 0 },
  flex: { flex: 1 },
  screenContent: { padding: 20, paddingBottom: 30 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: "800", color: COLORS.blue },
  headerTitle: { fontSize: 25, fontWeight: "800", color: COLORS.ink, marginTop: 3 },
  headerSubtitle: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.line },
  notificationDot: { position: "absolute", right: 9, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.orange, borderWidth: 1, borderColor: COLORS.white },
  hero: { backgroundColor: COLORS.navy, borderRadius: 22, padding: 22, overflow: "hidden" },
  heroGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "#0C4560", right: -55, top: -75, opacity: 0.75 },
  heroKicker: { color: "#87A7B9", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  heroValue: { color: COLORS.white, fontSize: 32, fontWeight: "800", marginTop: 8 },
  heroText: { color: "#BFD0D9", fontSize: 13, marginTop: 4 },
  heroRoute: { flexDirection: "row", alignItems: "center", marginTop: 22 },
  heroLine: { height: 1, flex: 1, backgroundColor: "#517081", marginHorizontal: 10 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 12, borderTopWidth: 3, borderWidth: 1, borderColor: COLORS.line },
  smallIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 22, color: COLORS.ink, fontWeight: "800", marginTop: 8 },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: COLORS.ink },
  sectionLink: { fontSize: 13, fontWeight: "700", color: COLORS.blue },
  shipmentCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  row: { flexDirection: "row", alignItems: "center", gap: 11 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shipIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: COLORS.ink, fontSize: 14, fontWeight: "750" },
  cardMeta: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  eta: { color: COLORS.ink, fontSize: 12, fontWeight: "700" },
  spaceTop: { marginTop: 14 },
  spaceTopSmall: { marginTop: 10 },
  progressTrack: { height: 5, borderRadius: 4, backgroundColor: "#E8EDF0", marginTop: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  alertCard: { flexDirection: "row", gap: 12, borderRadius: 16, padding: 15, backgroundColor: "#FFF7E8", borderWidth: 1, borderColor: "#F8D99E", marginTop: 5 },
  alertTitle: { fontSize: 13, fontWeight: "800", color: "#6E4A05" },
  alertText: { fontSize: 12, color: "#80652E", marginTop: 3, lineHeight: 17 },
  searchBox: { height: 48, borderRadius: 15, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  searchInput: { flex: 1, height: "100%", paddingHorizontal: 10, fontSize: 14, color: COLORS.ink },
  filterRow: { flexDirection: "row", gap: 8, marginVertical: 16 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  filterChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterText: { fontSize: 12, color: COLORS.muted, fontWeight: "600" },
  filterTextActive: { color: COLORS.white },
  code: { fontSize: 12, fontWeight: "800", color: COLORS.blue, letterSpacing: 0.5 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  routeRow: { flexDirection: "row", alignItems: "center", marginTop: 17, marginBottom: 7 },
  routePoint: { width: 9, height: 9, borderRadius: 5, borderWidth: 2, borderColor: COLORS.muted },
  routeLine: { flex: 1, height: 1, backgroundColor: COLORS.line, marginHorizontal: 7 },
  empty: { textAlign: "center", color: COLORS.muted, marginTop: 40 },
  customsSummary: { backgroundColor: COLORS.navy, borderRadius: 20, padding: 20 },
  customsPercent: { color: COLORS.white, fontSize: 34, fontWeight: "800", marginTop: 6 },
  customsIcon: { position: "absolute", right: 20, top: 18, width: 54, height: 54, borderRadius: 18, backgroundColor: "#12344A", alignItems: "center", justifyContent: "center" },
  customsHint: { color: "#BFD0D9", fontSize: 12, marginTop: 9 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.line, marginTop: 14 },
  sectionStandalone: { marginTop: 24, marginBottom: 12 },
  listCard: { backgroundColor: COLORS.white, borderRadius: 18, paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.line },
  documentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.line },
  documentName: { color: COLORS.ink, fontSize: 13, fontWeight: "700" },
  costCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 17, marginTop: 14, borderWidth: 1, borderColor: COLORS.line },
  costRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 13 },
  costValue: { fontSize: 13, color: COLORS.ink, fontWeight: "700" },
  totalRow: { borderTopWidth: 1, borderTopColor: COLORS.line, marginTop: 13 },
  totalValue: { fontSize: 16, color: COLORS.blue, fontWeight: "800" },
  inventorySummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 18 },
  summaryNumber: { fontSize: 26, fontWeight: "800", color: COLORS.ink },
  primaryButton: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: COLORS.blue, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 11 },
  primaryButtonText: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  inventoryCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  inventoryIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: "#EAF4FC", alignItems: "center", justifyContent: "center" },
  qty: { fontSize: 22, fontWeight: "800", color: COLORS.ink },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 14 },
  unit: { marginLeft: "auto", fontSize: 11, color: COLORS.muted },
  lowStock: { color: COLORS.red, fontSize: 11, fontWeight: "700", marginTop: 7 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(7,27,44,0.5)" },
  modalSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22, paddingBottom: 32 },
  modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: COLORS.line, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, color: COLORS.ink, fontWeight: "800" },
  modalText: { fontSize: 13, lineHeight: 19, color: COLORS.muted, marginTop: 7 },
  scannerBox: { height: 140, borderRadius: 18, borderWidth: 1.5, borderStyle: "dashed", borderColor: COLORS.blue, backgroundColor: "#F2F8FD", alignItems: "center", justifyContent: "center", marginVertical: 20 },
  scannerText: { color: COLORS.blue, fontWeight: "700", marginTop: 8 },
  secondaryButton: { height: 46, borderRadius: 13, backgroundColor: COLORS.navy, alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: COLORS.white, fontWeight: "800" },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  detailHeaderTitle: { fontSize: 16, color: COLORS.ink, fontWeight: "800" },
  detailHero: { backgroundColor: COLORS.navy, borderRadius: 22, padding: 20 },
  codeLight: { color: COLORS.cyan, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  darkBadge: { backgroundColor: "#10364D", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  darkBadgeText: { color: "#9CE2E8", fontSize: 11, fontWeight: "800" },
  detailTitle: { color: COLORS.white, fontSize: 23, fontWeight: "800", marginTop: 17 },
  detailMeta: { color: "#BFD0D9", fontSize: 12, marginTop: 5 },
  mapMock: { flexDirection: "row", alignItems: "center", marginTop: 28, marginBottom: 14 },
  mapDashed: { flex: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#688393", marginHorizontal: 10 },
  etaLight: { color: COLORS.white, fontSize: 12, fontWeight: "800" },
  timelineCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 17, borderWidth: 1, borderColor: COLORS.line },
  timelineRow: { flexDirection: "row", minHeight: 57 },
  timelineVisual: { width: 30, alignItems: "center" },
  timelineDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.line, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center" },
  timelineDotComplete: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  timelineLine: { flex: 1, width: 2, backgroundColor: COLORS.line },
  timelineLineComplete: { backgroundColor: COLORS.green },
  timelineText: { paddingLeft: 6, paddingBottom: 16 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  infoTile: { width: "48%", backgroundColor: COLORS.white, borderRadius: 15, padding: 14, borderWidth: 1, borderColor: COLORS.line },
  infoLabel: { fontSize: 9, color: COLORS.muted, fontWeight: "800", letterSpacing: 0.8 },
  infoValue: { fontSize: 13, color: COLORS.ink, fontWeight: "800", marginTop: 6 },
  tabBar: { height: 68, backgroundColor: COLORS.white, flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.line, paddingBottom: Platform.OS === "ios" ? 8 : 0 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabLabel: { fontSize: 10, color: COLORS.muted, fontWeight: "600" },
  tabLabelActive: { color: COLORS.blue, fontWeight: "800" },
});
