import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  navy: "#061827",
  navySoft: "#0D2D43",
  blue: "#087FCE",
  cyan: "#32D2DC",
  orange: "#F49B37",
  green: "#42C28D",
  purple: "#8777E8",
  red: "#EF6571",
  ink: "#142A3A",
  muted: "#6E7F8C",
  line: "#DCE6EB",
  bg: "#F3F7F9",
  white: "#FFFFFF",
};

const IMAGE_API = "https://images-api.nasa.gov/search";
const imageCache = new Map();

export const NASA_SATELLITES = [
  {
    id: "pace",
    name: "PACE",
    fullName: "Plankton, Aerosol, Cloud, ocean Ecosystem",
    category: "Océanos",
    status: "Activa",
    launch: "8 feb 2024",
    orbit: "Polar heliosíncrona · 676 km",
    period: "98.3 minutos",
    instruments: "OCI · SPEXone · HARP2",
    objective: "Estudia la salud de los océanos, el fitoplancton, los aerosoles y las nubes para comprender mejor el sistema climático terrestre.",
    imageQuery: "PACE spacecraft satellite",
    color: COLORS.cyan,
    sourceUrl: "https://science.nasa.gov/mission/pace/",
  },
  {
    id: "landsat-9",
    name: "Landsat 9",
    fullName: "Landsat Data Continuity Mission",
    category: "Tierra",
    status: "Activa",
    launch: "27 sep 2021",
    orbit: "Polar heliosíncrona · 705 km",
    period: "99 minutos",
    instruments: "OLI-2 · TIRS-2",
    objective: "Obtiene imágenes multiespectrales de la superficie terrestre para observar agricultura, bosques, agua, ciudades y cambios ambientales.",
    imageQuery: "Landsat 9 spacecraft",
    color: COLORS.green,
    sourceUrl: "https://science.nasa.gov/mission/landsat-9/",
  },
  {
    id: "sentinel-6",
    name: "Sentinel-6 MF",
    fullName: "Sentinel-6 Michael Freilich",
    category: "Océanos",
    status: "Activa",
    launch: "21 nov 2020",
    orbit: "Órbita terrestre · 1,336 km",
    period: "112 minutos",
    instruments: "Poseidon-4 · AMR-C · GNSS-RO",
    objective: "Mide con alta precisión la altura de la superficie oceánica y amplía el registro global del nivel del mar.",
    imageQuery: "Sentinel-6 Michael Freilich spacecraft",
    color: COLORS.blue,
    sourceUrl: "https://science.nasa.gov/mission/sentinel-6/",
  },
  {
    id: "icesat-2",
    name: "ICESat-2",
    fullName: "Ice, Cloud, and land Elevation Satellite 2",
    category: "Clima",
    status: "Activa",
    launch: "15 sep 2018",
    orbit: "Polar · 496 km",
    period: "94 minutos",
    instruments: "ATLAS (altímetro láser)",
    objective: "Mide la elevación del hielo, la tierra y la vegetación con pulsos láser para revelar cambios en las regiones polares.",
    imageQuery: "ICESat-2 spacecraft satellite",
    color: COLORS.purple,
    sourceUrl: "https://science.nasa.gov/mission/icesat-2/",
  },
  {
    id: "gpm",
    name: "GPM Core",
    fullName: "Global Precipitation Measurement Core Observatory",
    category: "Clima",
    status: "Activa",
    launch: "27 feb 2014",
    orbit: "Baja inclinación · 407 km",
    period: "93 minutos",
    instruments: "GMI · DPR",
    objective: "Genera observaciones globales de lluvia y nieve que ayudan a estudiar tormentas, inundaciones, sequías y el ciclo del agua.",
    imageQuery: "GPM Core Observatory spacecraft",
    color: COLORS.orange,
    sourceUrl: "https://science.nasa.gov/mission/gpm/",
  },
  {
    id: "terra",
    name: "Terra",
    fullName: "Earth Observing System AM-1",
    category: "Tierra",
    status: "Extendida",
    launch: "18 dic 1999",
    orbit: "Polar heliosíncrona · ~700 km",
    period: "99 minutos",
    instruments: "ASTER · CERES · MISR · MODIS · MOPITT",
    objective: "Observa de forma conjunta la atmósfera, el suelo, los océanos, la nieve, el hielo y el balance energético de la Tierra.",
    imageQuery: "Terra EOS AM-1 satellite spacecraft",
    color: COLORS.red,
    sourceUrl: "https://science.nasa.gov/mission/terra/",
  },
  {
    id: "tropics",
    name: "TROPICS",
    fullName: "Time-Resolved Observations of Precipitation structure and storm Intensity with a Constellation of Smallsats",
    category: "Clima",
    status: "Activa",
    launch: "Constelación 2023",
    orbit: "Baja inclinación · ~550 km",
    period: "~95 minutos",
    instruments: "Radiómetro de microondas de 12 canales",
    objective: "Una constelación de CubeSats que observa ciclones tropicales con mayor frecuencia para estudiar su estructura e intensidad.",
    imageQuery: "TROPICS CubeSat NASA",
    color: COLORS.orange,
    sourceUrl: "https://science.nasa.gov/mission/tropics/",
  },
  {
    id: "dscovr",
    name: "DSCOVR",
    fullName: "Deep Space Climate Observatory",
    category: "Clima",
    status: "Activa",
    launch: "11 feb 2015",
    orbit: "Punto L1 · ~1.5 millones km",
    period: "Órbita de halo",
    instruments: "EPIC · NISTAR · Plasma-Mag",
    objective: "Monitorea el viento solar y fotografía la cara iluminada de la Tierra desde el punto de equilibrio gravitacional L1.",
    imageQuery: "DSCOVR spacecraft EPIC",
    color: COLORS.cyan,
    sourceUrl: "https://science.nasa.gov/mission/dscovr/",
  },
];

function normalizeImageUrl(url) {
  return url?.replace(/^http:\/\//i, "https://");
}

async function requestMissionImages(query, signal, force = false) {
  if (!force && imageCache.has(query)) return imageCache.get(query);

  const url = `${IMAGE_API}?q=${encodeURIComponent(query)}&media_type=image&page_size=12`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`NASA respondió con estado ${response.status}`);

  const payload = await response.json();
  const images = (payload?.collection?.items || [])
    .map((item) => {
      const data = item.data?.[0] || {};
      const preview = item.links?.find((link) => link.render === "image")?.href;
      if (!preview) return null;
      return {
        id: data.nasa_id || preview,
        url: normalizeImageUrl(preview),
        title: data.title || "Imagen de NASA",
        description: data.description || "Contenido del archivo multimedia de NASA.",
        date: data.date_created?.slice(0, 10),
        center: data.center,
      };
    })
    .filter(Boolean);

  if (images.length) imageCache.set(query, images);
  return images;
}

function useMissionImages(query, forceToken = 0) {
  const [images, setImages] = useState(() => imageCache.get(query) || []);
  const [loading, setLoading] = useState(!imageCache.has(query));
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    requestMissionImages(query, controller.signal, forceToken > 0)
      .then((result) => setImages(result))
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError("No fue posible cargar las imágenes de NASA.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [query, forceToken]);

  return { images, loading, error };
}

function MissionImage({ uri, style, iconSize = 38 }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [uri]);

  if (!uri || failed) {
    return (
      <View style={[style, styles.imageFallback]}>
        <Ionicons name="planet-outline" size={iconSize} color="#5C7D90" />
        <Text style={styles.imageFallbackText}>NASA</Text>
      </View>
    );
  }

  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}

function ApiStatus({ loading, error }) {
  return (
    <View style={styles.apiStatus}>
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.cyan} />
      ) : (
        <View style={[styles.liveDot, error && styles.errorDot]} />
      )}
      <Text style={styles.apiStatusText}>
        {loading ? "Consultando NASA" : error ? "Catálogo local · imágenes sin conexión" : "NASA Images API · en línea"}
      </Text>
    </View>
  );
}

function SatelliteCard({ satellite, image, onPress }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.86} onPress={() => onPress(satellite)}>
      <View style={styles.cardImageWrap}>
        <MissionImage uri={image?.url} style={styles.cardImage} />
        <View style={styles.cardShade} />
        <View style={styles.nasaPill}>
          <Text style={styles.nasaPillText}>NASA</Text>
        </View>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: satellite.color }]} />
          <Text style={styles.statusText}>{satellite.status}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardCategory}>{satellite.category.toUpperCase()}</Text>
          <Text style={styles.cardName}>{satellite.name}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardFullName} numberOfLines={2}>{satellite.fullName}</Text>
        <Text style={styles.cardDescription} numberOfLines={3}>{satellite.objective}</Text>
        <View style={styles.cardFacts}>
          <View style={styles.cardFact}>
            <Ionicons name="rocket-outline" size={17} color={satellite.color} />
            <View style={styles.flex}>
              <Text style={styles.factLabel}>LANZAMIENTO</Text>
              <Text style={styles.factValue}>{satellite.launch}</Text>
            </View>
          </View>
          <View style={styles.cardFact}>
            <Ionicons name="earth-outline" size={17} color={satellite.color} />
            <View style={styles.flex}>
              <Text style={styles.factLabel}>ÓRBITA</Text>
              <Text style={styles.factValue} numberOfLines={1}>{satellite.orbit}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.instrumentText} numberOfLines={1}>{satellite.instruments}</Text>
          <View style={[styles.arrowButton, { backgroundColor: `${satellite.color}1C` }]}>
            <Ionicons name="arrow-forward" size={18} color={satellite.color} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function SatelliteListScreen({ onOpenSatellite }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [imagesById, setImagesById] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadCardImages = useCallback(async (force = false) => {
    setError("");

    try {
      const results = await Promise.allSettled(
        NASA_SATELLITES.map(async (satellite) => {
          const images = await requestMissionImages(satellite.imageQuery, undefined, force);
          return [satellite.id, images[0]];
        })
      );
      const nextImages = Object.fromEntries(
        results.filter((result) => result.status === "fulfilled" && result.value[1]).map((result) => result.value)
      );
      setImagesById((current) => ({ ...current, ...nextImages }));
      if (!Object.keys(nextImages).length) setError("No fue posible cargar las imágenes de NASA.");
    } catch {
      setError("No fue posible cargar las imágenes de NASA.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCardImages();
  }, [loadCardImages]);

  const filteredSatellites = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return NASA_SATELLITES.filter((satellite) => {
      const matchesCategory = category === "Todas" || satellite.category === category;
      const haystack = `${satellite.name} ${satellite.fullName} ${satellite.objective} ${satellite.instruments}`.toLocaleLowerCase("es");
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [category, query]);

  const refresh = () => {
    setRefreshing(true);
    loadCardImages(true);
  };

  return (
    <FlatList
      data={filteredSatellites}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.blue} />}
      ListHeaderComponent={
        <>
          <View style={styles.listHero}>
            <View style={styles.orbitOne} />
            <View style={styles.orbitTwo} />
            <View style={styles.earthGlow} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroLogo}>
                <Ionicons name="planet" size={22} color={COLORS.cyan} />
              </View>
              <ApiStatus loading={loading} error={error} />
            </View>
            <Text style={styles.heroEyebrow}>NASA · MISIONES DE OBSERVACIÓN</Text>
            <Text style={styles.heroTitle}>Explora la Tierra{`\n`}desde el espacio</Text>
            <Text style={styles.heroDescription}>
              Conoce satélites activos, sus instrumentos y el archivo visual de cada misión.
            </Text>
            <View style={styles.heroMetrics}>
              <View>
                <Text style={styles.metricValue}>{NASA_SATELLITES.length}</Text>
                <Text style={styles.metricLabel}>MISIONES</Text>
              </View>
              <View style={styles.metricDivider} />
              <View>
                <Text style={styles.metricValue}>3</Text>
                <Text style={styles.metricLabel}>ÁREAS CIENTÍFICAS</Text>
              </View>
              <View style={styles.metricDivider} />
              <View>
                <Text style={styles.metricValue}>LIVE</Text>
                <Text style={styles.metricLabel}>ARCHIVO NASA</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={21} color={COLORS.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar misión o instrumento"
              placeholderTextColor="#8B9AA5"
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                <Ionicons name="close-circle" size={20} color="#A5B2BA" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {["Todas", "Tierra", "Clima", "Océanos"].map((item) => {
              const active = category === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.filter, active && styles.filterActive]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.resultsHeader}>
            <View>
              <Text style={styles.sectionTitle}>Satélites disponibles</Text>
              <Text style={styles.sectionSubtitle}>
                {filteredSatellites.length} {filteredSatellites.length === 1 ? "misión encontrada" : "misiones encontradas"}
              </Text>
            </View>
            <Ionicons name="options-outline" size={22} color={COLORS.blue} />
          </View>
        </>
      }
      renderItem={({ item }) => (
        <SatelliteCard satellite={item} image={imagesById[item.id]} onPress={onOpenSatellite} />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="telescope-outline" size={43} color="#9AAAB4" />
          <Text style={styles.emptyTitle}>Sin coincidencias</Text>
          <Text style={styles.emptyText}>Prueba con otro nombre, instrumento o área científica.</Text>
        </View>
      }
    />
  );
}

function DetailFact({ icon, label, value, color }) {
  return (
    <View style={styles.detailFact}>
      <View style={[styles.detailFactIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={21} color={color} />
      </View>
      <Text style={styles.detailFactLabel}>{label}</Text>
      <Text style={styles.detailFactValue}>{value}</Text>
    </View>
  );
}

export function SatelliteDetailScreen({ satellite, onBack }) {
  const [refreshToken, setRefreshToken] = useState(0);
  const { images, loading, error } = useMissionImages(satellite.imageQuery, refreshToken);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const selectedImage = images.find((item) => item.id === selectedImageId) || images[0];

  useEffect(() => {
    setSelectedImageId(null);
  }, [satellite.id]);

  const openSource = () => Linking.openURL(satellite.sourceUrl);

  return (
    <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
      <View style={styles.detailTopBar}>
        <TouchableOpacity style={styles.topButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <View style={styles.detailTopTitle}>
          <Text style={styles.detailTopEyebrow}>MISIÓN NASA</Text>
          <Text style={styles.detailTopName}>{satellite.name}</Text>
        </View>
        <TouchableOpacity style={styles.topButton} onPress={openSource}>
          <Ionicons name="open-outline" size={21} color={COLORS.blue} />
        </TouchableOpacity>
      </View>

      <View style={styles.detailHero}>
        <MissionImage uri={selectedImage?.url} style={styles.detailHeroImage} iconSize={54} />
        <View style={styles.detailHeroShade} />
        <View style={styles.detailHeroCopy}>
          <View style={styles.detailMissionStatus}>
            <View style={[styles.statusDot, { backgroundColor: satellite.color }]} />
            <Text style={styles.detailMissionStatusText}>{satellite.status} · {satellite.category}</Text>
          </View>
          <Text style={styles.detailName}>{satellite.name}</Text>
          <Text style={styles.detailFullName}>{satellite.fullName}</Text>
        </View>
      </View>

      <View style={styles.detailFactsGrid}>
        <DetailFact icon="rocket-outline" label="LANZAMIENTO" value={satellite.launch} color={satellite.color} />
        <DetailFact icon="earth-outline" label="ÓRBITA" value={satellite.orbit} color={satellite.color} />
        <DetailFact icon="time-outline" label="PERIODO" value={satellite.period} color={satellite.color} />
        <DetailFact icon="hardware-chip-outline" label="INSTRUMENTOS" value={satellite.instruments} color={satellite.color} />
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionEyebrow}>ACERCA DE LA MISIÓN</Text>
        <Text style={styles.detailSectionTitle}>Una mirada especializada al planeta</Text>
        <Text style={styles.detailBody}>{satellite.objective}</Text>
      </View>

      <View style={styles.galleryHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>ARCHIVO MULTIMEDIA</Text>
          <Text style={styles.detailSectionTitle}>Imágenes de NASA</Text>
        </View>
        <ApiStatus loading={loading} error={error} />
      </View>

      {loading && !images.length ? (
        <View style={styles.galleryLoading}>
          <ActivityIndicator color={COLORS.blue} />
          <Text style={styles.galleryLoadingText}>Buscando imágenes de {satellite.name}…</Text>
        </View>
      ) : images.length ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryStrip}>
            {images.map((image) => {
              const active = selectedImage?.id === image.id;
              return (
                <TouchableOpacity
                  key={image.id}
                  style={[styles.galleryThumbWrap, active && { borderColor: satellite.color }]}
                  onPress={() => setSelectedImageId(image.id)}
                >
                  <MissionImage uri={image.url} style={styles.galleryThumb} iconSize={24} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.captionCard}>
            <View style={[styles.captionIcon, { backgroundColor: `${satellite.color}18` }]}>
              <Ionicons name="image-outline" size={21} color={satellite.color} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.captionTitle}>{selectedImage?.title}</Text>
              <Text style={styles.captionMeta}>
                {[selectedImage?.center && `NASA ${selectedImage.center}`, selectedImage?.date].filter(Boolean).join(" · ") || "Archivo NASA"}
              </Text>
              <Text style={styles.captionDescription} numberOfLines={4}>{selectedImage?.description}</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.galleryError}>
          <Ionicons name="cloud-offline-outline" size={32} color={COLORS.muted} />
          <Text style={styles.galleryErrorTitle}>Galería no disponible</Text>
          <Text style={styles.galleryErrorText}>Revisa tu conexión e inténtalo nuevamente.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => setRefreshToken((value) => value + 1)}>
            <Ionicons name="refresh" size={17} color={COLORS.white} />
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.sourceButton} onPress={openSource}>
        <View style={styles.sourceLogo}>
          <Text style={styles.sourceLogoText}>NASA</Text>
        </View>
        <View style={styles.flex}>
          <Text style={styles.sourceTitle}>Ver ficha oficial de la misión</Text>
          <Text style={styles.sourceText}>science.nasa.gov</Text>
        </View>
        <Ionicons name="open-outline" size={20} color={COLORS.blue} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 34 },
  listHero: { backgroundColor: COLORS.navy, borderRadius: 25, padding: 21, paddingTop: 18, overflow: "hidden" },
  orbitOne: { position: "absolute", width: 250, height: 250, borderRadius: 125, borderWidth: 1, borderColor: "rgba(80,211,221,0.2)", right: -90, top: -95 },
  orbitTwo: { position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", right: -48, top: -58 },
  earthGlow: { position: "absolute", width: 88, height: 88, borderRadius: 44, backgroundColor: "#126A8B", right: 8, top: -17, opacity: 0.66 },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 25 },
  heroLogo: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.navySoft, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1D4A61" },
  apiStatus: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(13,45,67,0.86)", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14 },
  apiStatusText: { color: "#C8D9E2", fontSize: 9, fontWeight: "700" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  errorDot: { backgroundColor: COLORS.orange },
  heroEyebrow: { color: COLORS.cyan, fontSize: 9, letterSpacing: 1.3, fontWeight: "900" },
  heroTitle: { color: COLORS.white, fontSize: 29, lineHeight: 34, fontWeight: "900", marginTop: 8 },
  heroDescription: { color: "#B8CBD5", fontSize: 12, lineHeight: 18, marginTop: 9, maxWidth: 290 },
  heroMetrics: { flexDirection: "row", alignItems: "center", marginTop: 22, gap: 15 },
  metricValue: { color: COLORS.white, fontSize: 16, fontWeight: "900" },
  metricLabel: { color: "#7896A6", fontSize: 7, fontWeight: "800", letterSpacing: 0.7, marginTop: 2 },
  metricDivider: { width: 1, height: 27, backgroundColor: "#25475A" },
  searchBox: { height: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginTop: 16 },
  searchInput: { flex: 1, height: "100%", color: COLORS.ink, fontSize: 13, paddingHorizontal: 10 },
  filters: { gap: 8, paddingVertical: 13 },
  filter: { borderRadius: 17, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.white },
  filterActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  filterTextActive: { color: COLORS.white },
  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5, marginBottom: 12 },
  sectionTitle: { color: COLORS.ink, fontSize: 18, fontWeight: "900" },
  sectionSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  card: { backgroundColor: COLORS.white, borderRadius: 21, borderWidth: 1, borderColor: COLORS.line, overflow: "hidden", marginBottom: 15 },
  cardImageWrap: { height: 185, backgroundColor: COLORS.navy, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%" },
  cardShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(5,21,34,0.2)" },
  nasaPill: { position: "absolute", top: 13, left: 13, borderRadius: 12, backgroundColor: "rgba(5,24,39,0.84)", paddingHorizontal: 10, paddingVertical: 6 },
  nasaPillText: { color: COLORS.white, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  statusPill: { position: "absolute", top: 13, right: 13, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.93)", paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: COLORS.ink, fontSize: 9, fontWeight: "800" },
  cardTitleBlock: { position: "absolute", left: 15, right: 15, bottom: 14 },
  cardCategory: { color: COLORS.cyan, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 },
  cardName: { color: COLORS.white, fontSize: 27, fontWeight: "900", marginTop: 2 },
  cardBody: { padding: 16 },
  cardFullName: { color: COLORS.ink, fontSize: 13, fontWeight: "800", lineHeight: 18 },
  cardDescription: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 6 },
  cardFacts: { flexDirection: "row", gap: 8, marginTop: 14 },
  cardFact: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.bg, borderRadius: 12, padding: 10 },
  factLabel: { color: COLORS.muted, fontSize: 7, fontWeight: "800", letterSpacing: 0.6 },
  factValue: { color: COLORS.ink, fontSize: 9, fontWeight: "800", marginTop: 2 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: COLORS.line, marginTop: 14, paddingTop: 12 },
  instrumentText: { flex: 1, color: COLORS.muted, fontSize: 9, fontWeight: "700" },
  arrowButton: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  imageFallback: { backgroundColor: "#DCE8EE", alignItems: "center", justifyContent: "center" },
  imageFallbackText: { color: "#5C7D90", fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginTop: 4 },
  emptyState: { alignItems: "center", paddingVertical: 38, paddingHorizontal: 25 },
  emptyTitle: { color: COLORS.ink, fontSize: 15, fontWeight: "900", marginTop: 10 },
  emptyText: { color: COLORS.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 4 },
  detailContent: { padding: 20, paddingBottom: 38 },
  detailTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  topButton: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  detailTopTitle: { alignItems: "center", flex: 1 },
  detailTopEyebrow: { color: COLORS.blue, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  detailTopName: { color: COLORS.ink, fontSize: 15, fontWeight: "900", marginTop: 2 },
  detailHero: { height: 340, backgroundColor: COLORS.navy, borderRadius: 24, overflow: "hidden" },
  detailHeroImage: { width: "100%", height: "100%" },
  detailHeroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(3,17,29,0.24)" },
  detailHeroCopy: { position: "absolute", left: 19, right: 19, bottom: 20 },
  detailMissionStatus: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.93)", borderRadius: 13, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  detailMissionStatusText: { color: COLORS.ink, fontSize: 9, fontWeight: "800" },
  detailName: { color: COLORS.white, fontSize: 34, fontWeight: "900" },
  detailFullName: { color: "#E1ECF1", fontSize: 11, lineHeight: 16, fontWeight: "700", marginTop: 4 },
  detailFactsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 },
  detailFact: { width: "48%", minHeight: 116, borderRadius: 17, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, padding: 13 },
  detailFactIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  detailFactLabel: { color: COLORS.muted, fontSize: 7, fontWeight: "900", letterSpacing: 0.8, marginTop: 9 },
  detailFactValue: { color: COLORS.ink, fontSize: 10, fontWeight: "800", lineHeight: 15, marginTop: 3 },
  sectionBlock: { marginTop: 25 },
  sectionEyebrow: { color: COLORS.blue, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  detailSectionTitle: { color: COLORS.ink, fontSize: 19, fontWeight: "900", marginTop: 4 },
  detailBody: { color: COLORS.muted, fontSize: 12, lineHeight: 20, marginTop: 9 },
  galleryHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 8, marginTop: 26 },
  galleryStrip: { gap: 9, paddingVertical: 13 },
  galleryThumbWrap: { width: 91, height: 74, borderRadius: 13, borderWidth: 2, borderColor: "transparent", overflow: "hidden", padding: 2 },
  galleryThumb: { width: "100%", height: "100%", borderRadius: 9 },
  galleryLoading: { height: 130, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginTop: 13 },
  galleryLoadingText: { color: COLORS.muted, fontSize: 10, marginTop: 9 },
  captionCard: { flexDirection: "row", gap: 11, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 17, padding: 14 },
  captionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  captionTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900", lineHeight: 17 },
  captionMeta: { color: COLORS.blue, fontSize: 9, fontWeight: "700", marginTop: 3 },
  captionDescription: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  galleryError: { alignItems: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 17, padding: 20, marginTop: 13 },
  galleryErrorTitle: { color: COLORS.ink, fontSize: 13, fontWeight: "900", marginTop: 7 },
  galleryErrorText: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  retryButton: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.blue, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginTop: 13 },
  retryText: { color: COLORS.white, fontSize: 10, fontWeight: "900" },
  sourceButton: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 17, padding: 14, marginTop: 17 },
  sourceLogo: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.navy },
  sourceLogoText: { color: COLORS.white, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  sourceTitle: { color: COLORS.ink, fontSize: 12, fontWeight: "900" },
  sourceText: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
});
