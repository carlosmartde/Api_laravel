import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { REFINERY_API_URL } from "./refineryApi";

const C = {
  navy: "#071C2B",
  navy2: "#0D2A3D",
  blue: "#2788E8",
  cyan: "#23C8B2",
  orange: "#FFAA3D",
  white: "#FFFFFF",
  ink: "#112B3A",
  muted: "#72828C",
  line: "#DCE7EC",
  bg: "#F2F6F8",
  red: "#E24C4B",
};

export default function LoginScreen({ busy, error, onLogin }) {
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const [email, setEmail] = useState("admin@refineryimport.test");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = () => {
    if (!email.trim() || !password) return;
    onLogin(email, password);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={[styles.shell, wide && styles.shellWide]}>
            <View style={[styles.brandPanel, wide && styles.brandPanelWide]}>
              <View style={styles.glowOne} />
              <View style={styles.glowTwo} />
              <View style={styles.brandTop}>
                <View style={styles.logoMark}>
                  <Ionicons name="layers" size={25} color={C.navy} />
                </View>
                <View>
                  <Text style={styles.logoName}>REFINERY</Text>
                  <Text style={styles.logoSub}>IMPORT CONTROL</Text>
                </View>
              </View>

              <View style={styles.brandCopy}>
                <View style={styles.livePill}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>OPERACIÓN LOGÍSTICA</Text>
                </View>
                <Text style={styles.brandTitle}>Cada embarque.{"\n"}Una sola vista.</Text>
                <Text style={styles.brandText}>
                  Controla importaciones, documentos, aduana, ETA y recepción en planta desde cualquier dispositivo.
                </Text>
              </View>

              <View style={styles.routeCard}>
                <View style={styles.routeIcon}>
                  <Ionicons name="boat" size={21} color={C.cyan} />
                </View>
                <View style={styles.routeCopy}>
                  <Text style={styles.routeEyebrow}>TRAZABILIDAD PUNTA A PUNTA</Text>
                  <Text style={styles.routeText}>Origen  •  Puerto  •  Aduana  •  Planta</Text>
                </View>
                <Ionicons name="shield-checkmark" size={23} color={C.orange} />
              </View>
            </View>

            <View style={[styles.formPanel, wide && styles.formPanelWide]}>
              <View style={styles.formInner}>
                <Text style={styles.kicker}>ACCESO SEGURO</Text>
                <Text style={styles.title}>Bienvenido de nuevo</Text>
                <Text style={styles.subtitle}>Ingresa con tu cuenta corporativa para continuar.</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={19} color={C.red} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={20} color={C.muted} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholder="nombre@empresa.com"
                    placeholderTextColor="#98A5AD"
                    style={styles.input}
                    editable={!busy}
                  />
                </View>

                <Text style={styles.label}>CONTRASEÑA</Text>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={C.muted} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    placeholder="Tu contraseña"
                    placeholderTextColor="#98A5AD"
                    style={styles.input}
                    editable={!busy}
                    onSubmitEditing={submit}
                  />
                  <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color={C.muted} />
                  </Pressable>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (!email.trim() || !password || busy) && styles.buttonDisabled]}
                  onPress={submit}
                  disabled={!email.trim() || !password || busy}
                >
                  {busy ? <ActivityIndicator color={C.white} /> : <Ionicons name="log-in-outline" size={21} color={C.white} />}
                  <Text style={styles.buttonText}>{busy ? "Verificando…" : "Ingresar al centro de control"}</Text>
                </Pressable>

                <View style={styles.securityNote}>
                  <Ionicons name="lock-closed" size={14} color={C.blue} />
                  <Text style={styles.securityText}>Sesión protegida con OAuth 2.0 y permisos por rol.</Text>
                </View>
                <Text style={styles.endpoint} numberOfLines={1}>API: {REFINERY_API_URL}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.navy },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", backgroundColor: C.bg },
  shell: { minHeight: "100%", backgroundColor: C.white },
  shellWide: { minHeight: 680, flexDirection: "row", margin: 28, borderRadius: 28, overflow: "hidden", shadowColor: C.navy, shadowOpacity: 0.16, shadowRadius: 28, shadowOffset: { width: 0, height: 12 } },
  brandPanel: { minHeight: 330, backgroundColor: C.navy, padding: 28, overflow: "hidden", justifyContent: "space-between" },
  brandPanelWide: { width: "52%", minHeight: 680, padding: 48 },
  glowOne: { position: "absolute", width: 330, height: 330, borderRadius: 165, backgroundColor: "#0E5570", right: -130, top: -130, opacity: 0.62 },
  glowTwo: { position: "absolute", width: 210, height: 210, borderRadius: 105, borderWidth: 42, borderColor: "#0A3B53", left: -110, bottom: -85, opacity: 0.75 },
  brandTop: { flexDirection: "row", alignItems: "center", gap: 12, zIndex: 1 },
  logoMark: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: C.cyan },
  logoName: { color: C.white, fontSize: 16, fontWeight: "900", letterSpacing: 2.1 },
  logoSub: { color: "#7FA6B7", fontSize: 9, fontWeight: "800", letterSpacing: 1.3, marginTop: 2 },
  brandCopy: { marginVertical: 34, zIndex: 1 },
  livePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.navy2, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.cyan },
  liveText: { color: "#A8CCD5", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  brandTitle: { color: C.white, fontSize: 42, lineHeight: 48, fontWeight: "900", marginTop: 20, letterSpacing: -1.2 },
  brandText: { color: "#AFC7D1", fontSize: 14, lineHeight: 22, maxWidth: 440, marginTop: 16 },
  routeCard: { zIndex: 1, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(14,52,73,0.88)", borderWidth: 1, borderColor: "#1B506A", borderRadius: 18, padding: 15 },
  routeIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: "#123D54", alignItems: "center", justifyContent: "center" },
  routeCopy: { flex: 1 },
  routeEyebrow: { color: C.cyan, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  routeText: { color: C.white, fontSize: 11, fontWeight: "700", marginTop: 4 },
  formPanel: { flex: 1, backgroundColor: C.white, padding: 26, justifyContent: "center" },
  formPanelWide: { paddingHorizontal: 60 },
  formInner: { width: "100%", maxWidth: 430, alignSelf: "center" },
  kicker: { color: C.blue, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 30, fontWeight: "900", letterSpacing: -0.7, marginTop: 8 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 18 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "#FFF0F0", borderWidth: 1, borderColor: "#F2C7C7", borderRadius: 13, padding: 12, marginBottom: 4 },
  errorText: { flex: 1, color: "#8A3030", fontSize: 11, lineHeight: 16 },
  label: { color: C.muted, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginTop: 16, marginBottom: 7 },
  inputWrap: { height: 52, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F8FAFB", borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: 14 },
  input: { flex: 1, height: "100%", color: C.ink, fontSize: 13, outlineStyle: "none" },
  button: { height: 53, borderRadius: 14, backgroundColor: C.blue, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 24, shadowColor: C.blue, shadowOpacity: 0.23, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  buttonPressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: C.white, fontSize: 13, fontWeight: "900" },
  securityNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 19 },
  securityText: { color: C.muted, fontSize: 10 },
  endpoint: { color: "#9AA7AF", fontSize: 9, textAlign: "center", marginTop: 9 },
});
