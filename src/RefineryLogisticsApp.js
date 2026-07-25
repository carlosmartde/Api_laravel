import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

const C = {
  navy: "#071B2C",
  navy2: "#103349",
  blue: "#0B75D1",
  cyan: "#16B8C6",
  orange: "#F59E0B",
  green: "#1E9B68",
  red: "#D64545",
  purple: "#7357C7",
  ink: "#172B3A",
  muted: "#6D7C87",
  line: "#DDE5EA",
  bg: "#F3F6F8",
  white: "#FFFFFF",
};

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
      <TouchableOpacity style={s.iconButton}>
        <Ionicons name="notifications-outline" size={23} color={C.ink} />
        <View style={s.notificationDot} />
      </TouchableOpacity>
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

function Metric({ label, value, icon, color }) {
  return (
    <View style={s.metric}>
      <View style={[s.metricIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
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

function Dashboard({ openImport }) {
  const upcoming = IMPORTS.filter((item) => item.status !== "Recibida").slice(0, 3);
  return (
    <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
      <Header title="Control logístico" subtitle="Resumen de importaciones · 24 Jul 2026" />

      <View style={s.hero}>
        <View style={s.heroCircle} />
        <Text style={s.heroKicker}>VALOR ACTIVO EN IMPORTACIONES</Text>
        <Text style={s.heroValue}>US$ 5.49M</Text>
        <Text style={s.heroText}>12 expedientes BL · 5 proveedores activos</Text>
        <View style={s.heroFooter}>
          <View style={s.heroPill}>
            <Ionicons name="boat-outline" size={17} color={C.cyan} />
            <Text style={s.heroPillText}>4 en tránsito</Text>
          </View>
          <View style={s.heroPill}>
            <Ionicons name="alert-circle-outline" size={17} color={C.orange} />
            <Text style={s.heroPillText}>3 requieren acción</Text>
          </View>
        </View>
      </View>

      <View style={s.metrics}>
        <Metric label="Recibidas" value="5" icon="checkmark-circle-outline" color={C.green} />
        <Metric label="En camino" value="4" icon="boat-outline" color={C.blue} />
        <Metric label="En aduana" value="2" icon="document-text-outline" color={C.orange} />
        <Metric label="Documentos" value="1" icon="folder-open-outline" color={C.purple} />
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Importaciones prioritarias</Text>
        <Text style={s.sectionAction}>Por ETA</Text>
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

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Alertas del día</Text>
      </View>
      <View style={s.alert}>
        <Ionicons name="warning-outline" size={23} color={C.orange} />
        <View style={s.flex}>
          <Text style={s.alertTitle}>DUCA con observación</Text>
          <Text style={s.alertText}>El BL HLCU-903184725 tiene una segunda rectificación pendiente de revisión.</Text>
        </View>
      </View>
      <View style={[s.alert, { backgroundColor: "#EEF7FD", borderColor: "#C9E2F4" }]}>
        <Ionicons name="time-outline" size={23} color={C.blue} />
        <View style={s.flex}>
          <Text style={[s.alertTitle, { color: C.ink }]}>Arribo en cuatro días</Text>
          <Text style={[s.alertText, { color: C.muted }]}>Preparar recepción del equipo ALFA LAVAL y espacio en el almacén técnico.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ImportsScreen({ openImport }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");
  const filtered = useMemo(() => {
    return IMPORTS.filter((item) => {
      const matchesQuery = `${item.bl} ${item.reference} ${item.supplier} ${item.material}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesFilter =
        filter === "Todas" ||
        (filter === "Recibidas" && item.status === "Recibida") ||
        (filter === "En curso" && item.status !== "Recibida");
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.bl}
      contentContainerStyle={s.screen}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <Header title="Importaciones por BL" subtitle="El BL es el identificador principal del expediente" />
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
        <TouchableOpacity style={s.importCard} onPress={() => openImport(item)}>
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

function DetailHeader({ onBack }) {
  return (
    <View style={s.detailHeader}>
      <TouchableOpacity style={s.iconButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={23} color={C.ink} />
      </TouchableOpacity>
      <Text style={s.detailHeaderTitle}>Expediente de importación</Text>
      <TouchableOpacity style={s.iconButton}>
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

function DocumentRow({ doc }) {
  const color = doc.status === "Validado" ? C.green : doc.status === "Observación" ? C.red : C.orange;
  return (
    <TouchableOpacity style={s.documentRow}>
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

function ImportDetail({ item, documents, onBack, onAddDocument }) {
  const [tab, setTab] = useState("Documentos");
  const [showUpload, setShowUpload] = useState(false);
  const [documentType, setDocumentType] = useState("DUCA");
  const types = ["DUCA", "Factura comercial", "Packing list", "BL / BOL", "Otro"];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      onAddDocument(item.bl, {
        id: `local-${Date.now()}`,
        type: documentType,
        name: file.name,
        version: documentType === "DUCA" ? "Nueva versión" : "Versión cargada",
        status: "Pendiente",
        date: "24 Jul 2026",
        uri: file.uri,
      });
      setShowUpload(false);
      Alert.alert("Documento agregado", `${file.name} fue agregado al expediente ${item.bl}.`);
    } catch {
      Alert.alert("No se pudo seleccionar el documento", "Verifica los permisos del dispositivo e intenta nuevamente.");
    }
  };

  return (
    <View style={s.flex}>
      <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
        <DetailHeader onBack={onBack} />
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
          {["Documentos", "Información"].map((name) => (
            <TouchableOpacity key={name} style={[s.innerTab, tab === name && s.innerTabActive]} onPress={() => setTab(name)}>
              <Text style={[s.innerTabText, tab === name && s.innerTabTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "Documentos" ? (
          <>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.sectionTitle}>Carpeta del BL</Text>
                <Text style={s.meta}>{documents.length} archivos y versiones</Text>
              </View>
              <TouchableOpacity style={s.primaryButton} onPress={() => setShowUpload(true)}>
                <Ionicons name="cloud-upload-outline" size={19} color={C.white} />
                <Text style={s.primaryButtonText}>Subir</Text>
              </TouchableOpacity>
            </View>
            <View style={s.documentList}>
              {documents.length ? (
                documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
              ) : (
                <EmptyState icon="folder-open-outline" title="Carpeta vacía" text="Carga el BL, la factura, el packing list o la DUCA." />
              )}
            </View>
            <View style={s.versionNote}>
              <Ionicons name="git-compare-outline" size={21} color={C.purple} />
              <Text style={s.versionNoteText}>El BL conserva el expediente. Las rectificaciones de DUCA y nuevas facturas se agregan como versiones sin reemplazar el historial.</Text>
            </View>
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
              <InfoPair label="FACTURA" value={item.invoice} />
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
              <Ionicons name="chevron-forward" size={19} color={C.muted} />
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
    </View>
  );
}

const TABS = [
  { key: "home", label: "Inicio", icon: "home-outline", active: "home" },
  { key: "imports", label: "BL", icon: "boat-outline", active: "boat" },
  { key: "locations", label: "Planta", icon: "location-outline", active: "location" },
  { key: "suppliers", label: "Proveedores", icon: "people-outline", active: "people" },
];

export default function RefineryLogisticsApp() {
  const [screen, setScreen] = useState("home");
  const [selected, setSelected] = useState(null);
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);

  const openImport = (item) => {
    setSelected(item);
    setScreen("detail");
  };

  const addDocument = (bl, doc) => {
    setDocuments((current) => ({
      ...current,
      [bl]: [doc, ...(current[bl] || [])],
    }));
  };

  const content = () => {
    if (screen === "home") return <Dashboard openImport={openImport} />;
    if (screen === "imports") return <ImportsScreen openImport={openImport} />;
    if (screen === "locations") return <InventoryScreen />;
    if (screen === "suppliers") return <SuppliersScreen />;
    return (
      <ImportDetail
        item={selected || IMPORTS[0]}
        documents={documents[(selected || IMPORTS[0]).bl] || []}
        onBack={() => setScreen("imports")}
        onAddDocument={addDocument}
      />
    );
  };

  return (
    <SafeAreaView style={s.app}>
      <StatusBar style="dark" />
      <View style={s.flex}>{content()}</View>
      {screen !== "detail" ? (
        <View style={s.tabBar}>
          {TABS.map((tab) => {
            const isActive = screen === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={s.tabItem} onPress={() => setScreen(tab.key)}>
                <Ionicons name={isActive ? tab.active : tab.icon} size={22} color={isActive ? C.blue : C.muted} />
                <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === "android" ? 28 : 0 },
  flex: { flex: 1 },
  screen: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 },
  eyebrow: { color: C.blue, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  headerTitle: { color: C.ink, fontSize: 25, fontWeight: "800", marginTop: 4 },
  headerSubtitle: { color: C.muted, fontSize: 12, marginTop: 4 },
  iconButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line },
  notificationDot: { position: "absolute", right: 9, top: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: C.orange, borderWidth: 1, borderColor: C.white },
  hero: { backgroundColor: C.navy, borderRadius: 22, padding: 22, overflow: "hidden" },
  heroCircle: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "#0C4560", right: -55, top: -90, opacity: 0.75 },
  heroKicker: { color: "#8EAFBF", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
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
  filters: { flexDirection: "row", gap: 8, marginTop: 14 },
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
  cancelButton: { height: 44, borderRadius: 12, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginTop: 13 },
  cancelButtonText: { color: C.white, fontSize: 12, fontWeight: "800" },
  tabBar: { height: 68, flexDirection: "row", backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, paddingBottom: Platform.OS === "ios" ? 8 : 0 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabLabel: { color: C.muted, fontSize: 9, fontWeight: "600" },
  tabLabelActive: { color: C.blue, fontWeight: "800" },
});
