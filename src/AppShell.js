import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const C = {
  navy: "#071C2B", navy2: "#0D2A3D", cyan: "#23C8B2", blue: "#2788E8",
  orange: "#FFAA3D", white: "#FFFFFF", muted: "#72828C", ink: "#112B3A",
  line: "#DCE7EC", bg: "#F2F6F8", green: "#16A673",
};

export const APP_TABS = [
  { key: "home", label: "Inicio", icon: "grid-outline", active: "grid" },
  { key: "imports", label: "Embarques", icon: "boat-outline", active: "boat" },
  { key: "operations", label: "Operaciones", icon: "pulse-outline", active: "pulse" },
  { key: "tasks", label: "Agenda", icon: "checkbox-outline", active: "checkbox" },
  { key: "reports", label: "Analítica", icon: "stats-chart-outline", active: "stats-chart" },
  { key: "directory", label: "Directorio", icon: "business-outline", active: "business" },
];

const TITLES = {
  home: ["Vista general", "Resumen de la cadena de suministro"],
  imports: ["Control de embarques", "Expedientes, BL y seguimiento"],
  operations: ["Operación y cumplimiento", "Tareas, alertas e incidencias"],
  tasks: ["Agenda compartida", "Tareas y recordatorios del sistema externo"],
  reports: ["Inteligencia ejecutiva", "Indicadores y reportes exportables"],
  directory: ["Red logística", "Proveedores y ubicaciones de planta"],
  detail: ["Expediente de importación", "Trazabilidad integral por BL"],
};

function NavItem({ item, active, onPress, compact = false }) {
  return (
    <TouchableOpacity style={[compact ? s.mobileNavItem : s.navItem, active && (compact ? s.mobileNavActive : s.navItemActive)]} onPress={onPress} activeOpacity={0.78} accessibilityLabel={`Ir a ${item.label}`}>
      <View style={[compact ? s.mobileIconBox : s.navIconBox, active && !compact && s.navIconBoxActive]}>
        <Ionicons name={active ? item.active : item.icon} size={compact ? 21 : 20} color={active ? (compact ? C.blue : C.white) : compact ? C.muted : "#86A0AE"} />
      </View>
      <Text style={[compact ? s.mobileNavText : s.navText, active && (compact ? s.mobileNavTextActive : s.navTextActive)]}>{item.label}</Text>
      {!compact && active ? <View style={s.navActiveDot} /> : null}
    </TouchableOpacity>
  );
}

export default function AppShell({ screen, onNavigate, user, onLogout, onCreate, onRefresh, refreshing, canWrite, children }) {
  const { width } = useWindowDimensions();
  const desktop = width >= 980;
  const title = TITLES[screen] || TITLES.home;
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const confirmLogout = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm("¿Deseas cerrar sesión y salir del centro de control?")) onLogout?.();
      return;
    }
    Alert.alert("Cerrar sesión", "¿Deseas salir del centro de control?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: onLogout },
    ]);
  };

  const account = () => Alert.alert(
    user?.name || "Cuenta",
    `${user?.email || ""}\nRol: ${user?.role || "consulta"}`,
    [{ text: "Entendido" }],
  );

  return (
    <View style={s.root}>
      {desktop ? <View style={s.sidebar}>
        <View style={s.brand}><View style={s.brandMark}><Ionicons name="layers" size={23} color={C.navy} /></View><View><Text style={s.brandName}>REFINERY</Text><Text style={s.brandSub}>IMPORT CONTROL</Text></View></View>
        <Text style={s.navSection}>CENTRO OPERATIVO</Text>
        <View style={s.nav}>{APP_TABS.map((item) => <NavItem key={item.key} item={item} active={screen === item.key} onPress={() => onNavigate(item.key)} />)}</View>
        <View style={s.sidebarBottom}>
          <View style={s.systemCard}><View style={s.systemTop}><View style={s.liveDot} /><Text style={s.systemTitle}>SISTEMA EN LÍNEA</Text></View><Text style={s.systemText}>API Laravel + MySQL</Text><View style={s.systemProgress}><View style={s.systemFill} /></View><Text style={s.systemFoot}>Sincronización operativa activa</Text></View>
          <TouchableOpacity style={s.profile} onPress={account}><View style={s.avatar}><Text style={s.avatarText}>{initial}</Text><View style={s.onlineDot} /></View><View style={s.flex}><Text style={s.profileName} numberOfLines={1}>{user?.name || "Usuario"}</Text><Text style={s.profileRole}>{user?.role || "consulta"}</Text></View><Ionicons name="ellipsis-horizontal" size={18} color="#8199A7" /></TouchableOpacity>
          <TouchableOpacity style={s.logoutButton} onPress={confirmLogout} activeOpacity={0.78} accessibilityRole="button" accessibilityLabel="Cerrar sesión">
            <Ionicons name="log-out-outline" size={17} color="#FF8585" />
            <Text style={s.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View> : null}

      <View style={s.main}>
        <View style={[s.topbar, !desktop && s.topbarMobile]}>
          <View style={s.flex}><Text style={s.topEyebrow}>PALM REFINERY · LOGISTICS OS</Text><Text style={s.topTitle}>{title[0]}</Text><Text style={s.topSubtitle}>{title[1]}</Text></View>
          <View style={s.topActions}>
            <TouchableOpacity style={s.iconButton} onPress={() => onRefresh?.()} disabled={refreshing} accessibilityLabel="Actualizar información">{refreshing ? <ActivityIndicator size="small" color={C.blue} /> : <Ionicons name="refresh" size={20} color={C.blue} />}</TouchableOpacity>
            {canWrite && screen !== "detail" ? <TouchableOpacity style={s.createButton} onPress={onCreate}><Ionicons name="add" size={21} color={C.navy} /><Text style={s.createText}>Nueva importación</Text></TouchableOpacity> : null}
            {!desktop ? <TouchableOpacity style={s.mobileAvatar} onPress={account}><Text style={s.mobileAvatarText}>{initial}</Text></TouchableOpacity> : null}
            {!desktop ? <TouchableOpacity style={s.mobileLogoutButton} onPress={confirmLogout} accessibilityRole="button" accessibilityLabel="Cerrar sesión"><Ionicons name="log-out-outline" size={20} color="#D94B55" /></TouchableOpacity> : null}
          </View>
        </View>
        <View style={s.workspace}>{children}</View>
        {!desktop && screen !== "detail" ? <View style={s.mobileNav}>{APP_TABS.map((item) => <NavItem key={item.key} item={item} compact active={screen === item.key} onPress={() => onNavigate(item.key)} />)}</View> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, flexDirection: "row", backgroundColor: C.bg }, flex: { flex: 1 },
  sidebar: { width: 248, backgroundColor: C.navy, paddingHorizontal: 17, paddingTop: 24, paddingBottom: 18, borderRightWidth: 1, borderRightColor: "#163548" },
  brand: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 7, marginBottom: 35 }, brandMark: { width: 43, height: 43, borderRadius: 13, backgroundColor: C.cyan, alignItems: "center", justifyContent: "center", shadowColor: C.cyan, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 5 } }, brandName: { color: C.white, fontSize: 15, fontWeight: "900", letterSpacing: 1.5 }, brandSub: { color: "#7FA0B0", fontSize: 7, fontWeight: "900", letterSpacing: 1.8, marginTop: 2 }, navSection: { color: "#587786", fontSize: 7, fontWeight: "900", letterSpacing: 1.5, paddingHorizontal: 12, marginBottom: 10 }, nav: { gap: 5 }, navItem: { minHeight: 51, borderRadius: 14, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 10 }, navItemActive: { backgroundColor: C.navy2 }, navIconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" }, navIconBoxActive: { backgroundColor: C.blue }, navText: { color: "#86A0AE", fontSize: 10, fontWeight: "800" }, navTextActive: { color: C.white }, navActiveDot: { marginLeft: "auto", width: 5, height: 5, borderRadius: 3, backgroundColor: C.cyan }, sidebarBottom: { marginTop: "auto" }, systemCard: { backgroundColor: "#0B2A3D", borderWidth: 1, borderColor: "#173C50", borderRadius: 16, padding: 13, marginBottom: 13 }, systemTop: { flexDirection: "row", alignItems: "center", gap: 6 }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }, systemTitle: { color: C.white, fontSize: 7, fontWeight: "900", letterSpacing: 0.8 }, systemText: { color: "#7F9CAA", fontSize: 8, marginTop: 6 }, systemProgress: { height: 4, borderRadius: 2, backgroundColor: "#173C50", marginTop: 10, overflow: "hidden" }, systemFill: { width: "92%", height: 4, backgroundColor: C.cyan }, systemFoot: { color: "#678694", fontSize: 6, marginTop: 6 }, profile: { minHeight: 55, borderTopWidth: 1, borderTopColor: "#173747", paddingTop: 13, flexDirection: "row", alignItems: "center", gap: 9 }, avatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" }, avatarText: { color: C.white, fontSize: 13, fontWeight: "900" }, onlineDot: { position: "absolute", right: -2, bottom: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: C.green, borderWidth: 2, borderColor: C.navy }, profileName: { color: C.white, fontSize: 9, fontWeight: "900" }, profileRole: { color: "#7693A1", fontSize: 7, textTransform: "uppercase", marginTop: 3 },
  main: { flex: 1, backgroundColor: C.bg }, topbar: { minHeight: 78, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.line, paddingHorizontal: 26, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 15 }, topbarMobile: { minHeight: 74, paddingHorizontal: 16 }, topEyebrow: { color: C.blue, fontSize: 7, fontWeight: "900", letterSpacing: 1.2 }, topTitle: { color: C.ink, fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: -0.3 }, topSubtitle: { color: C.muted, fontSize: 8, marginTop: 2 }, topActions: { flexDirection: "row", alignItems: "center", gap: 8 }, iconButton: { width: 41, height: 41, borderRadius: 12, backgroundColor: "#F3F7F9", borderWidth: 1, borderColor: C.line, alignItems: "center", justifyContent: "center" }, createButton: { height: 41, borderRadius: 12, backgroundColor: C.cyan, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, createText: { color: C.navy, fontSize: 9, fontWeight: "900" }, mobileAvatar: { width: 41, height: 41, borderRadius: 12, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" }, mobileAvatarText: { color: C.white, fontSize: 13, fontWeight: "900" }, workspace: { flex: 1 },
  mobileNav: { height: Platform.OS === "ios" ? 76 : 68, paddingBottom: Platform.OS === "ios" ? 8 : 0, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line, flexDirection: "row", paddingHorizontal: 4 }, mobileNavItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }, mobileNavActive: {}, mobileIconBox: { width: 34, height: 28, alignItems: "center", justifyContent: "center" }, mobileNavText: { color: C.muted, fontSize: 7, fontWeight: "700" }, mobileNavTextActive: { color: C.blue, fontWeight: "900" },
  logoutButton: { minHeight: 39, borderRadius: 11, borderWidth: 1, borderColor: "#4B2A35", backgroundColor: "#211F2C", marginTop: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { color: "#FF9A9A", fontSize: 9, fontWeight: "900" },
  mobileLogoutButton: { width: 41, height: 41, borderRadius: 12, backgroundColor: "#FFF1F2", borderWidth: 1, borderColor: "#FFD6D9", alignItems: "center", justifyContent: "center" },
});
