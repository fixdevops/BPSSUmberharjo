// ─── MapScreen — Peta Bangunan via WebView + OpenStreetMap/Leaflet ────────────
// Native (Android/iOS): WebView + Leaflet
// Web browser: fallback pesan (WebView tidak tersedia di react-native-web)
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";
import { Icon } from "../components/Icon";
import { T } from "../constants/theme";
import { Bangunan, getBangunanList } from "../lib/database";
import { ui } from "../styles/ui";

// Lazy-import WebView hanya di native
let WebView: any = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    WebView = require("react-native-webview").WebView;
  } catch (_) {}
}

// ─── Warna marker per jenis bangunan ─────────────────────────────────────────
const JENIS_COLOR: Record<string, string> = {
  "Rumah":    "#004ec7",
  "Kos":      "#f59e0b",
  "Mushola":  "#22c55e",
  "Gudang":   "#8b5cf6",
  "Toko":     "#ef4444",
  "Kosong":   "#9ca3af",
};
function colorOf(jenis: string) {
  return JENIS_COLOR[jenis] ?? "#737687";
}

// ─── Build HTML Leaflet map ───────────────────────────────────────────────────
function buildMapHTML(buildings: Bangunan[], centerLat: number, centerLng: number): string {
  const markers = buildings
    .filter((b) => b.lat != null && b.lng != null)
    .map((b) => {
      const color   = colorOf(b.jenis);
      const popupId = `popup_${b.id}`;
      return `
        var icon_${b.id} = L.divIcon({
          className: '',
          html: '<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:10px;color:white;font-weight:700;">${b.nomor_urut}</div>',
          iconSize: [28,28], iconAnchor: [14,14]
        });
        var marker_${b.id} = L.marker([${b.lat}, ${b.lng}], {icon: icon_${b.id}})
          .addTo(map)
          .bindPopup('<b>[${b.nomor_urut}] ${b.jenis}</b><br>${b.alamat ?? ""}<br><small>${b.jumlah_kk ?? 0} KK</small><br><button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\"detail\\",id:${b.id}}))" style="margin-top:6px;padding:4px 10px;background:#004ec7;color:white;border:none;border-radius:6px;cursor:pointer;">Detail</button><br><button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\"rute\\",lat:${b.lat},lng:${b.lng}}))" style="margin-top:4px;padding:4px 10px;background:#22c55e;color:white;border:none;border-radius:6px;cursor:pointer;">Rute</button>');
      `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#f0f4ff; }
  #map { width:100vw; height:100vh; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {zoomControl: true}).setView([${centerLat}, ${centerLng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map);
  ${markers}

  // Locate me button
  L.control.locate = function() {
    var btn = L.control({position:'bottomright'});
    btn.onAdd = function() {
      var div = L.DomUtil.create('button','locate-btn');
      div.innerHTML = '📍';
      div.style.cssText = 'padding:8px 12px;font-size:20px;border:none;background:white;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer;';
      div.onclick = function(){
        map.locate({setView: true, maxZoom: 17});
      };
      return div;
    };
    return btn;
  }
  L.control.locate().addTo(map);

  map.on('locationfound', function(e) {
    L.circleMarker(e.latlng, {radius:8, color:'#ef4444', fillColor:'#ef4444', fillOpacity:0.8}).addTo(map)
      .bindPopup('Lokasi Anda').openPopup();
  });
</script>
</body>
</html>`;
}

// ─── Legenda warna ────────────────────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginRight: 10 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>{label}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MapScreen({ onDetailBangunan }: {
  onDetailBangunan: (id: number) => void;
}) {
  const [buildings, setBuildings] = useState<Bangunan[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const webRef = useRef<WebView>(null);

  // Center default: Sumberharjo, Bojonegoro
  const CENTER_LAT = -7.1167;
  const CENTER_LNG = 111.8833;

  async function load() {
    try {
      const data = await getBangunanList();
      setBuildings(data);
    } catch (e) {
      Alert.alert("Error", "Gagal memuat data bangunan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  function handleWebMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "detail") {
        onDetailBangunan(msg.id);
      } else if (msg.type === "rute") {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${msg.lat},${msg.lng}&travelmode=walking`
        );
      }
    } catch (_) {}
  }

  const withGPS  = buildings.filter((b) => b.lat != null).length;
  const noGPS    = buildings.length - withGPS;
  const mapHTML  = buildMapHTML(buildings, CENTER_LAT, CENTER_LNG);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={{ marginTop: 12, color: T.onSurfaceVariant, fontSize: 13 }}>Memuat peta…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header */}
      <View style={[ui.topNav, { paddingVertical: 8 }]}>
        <View>
          <Text style={[ui.topNavBrand, { fontSize: 15 }]}>🗺️ Peta Bangunan</Text>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>
            {buildings.length} bangunan · {withGPS} ber-GPS · {noGPS} tanpa GPS
          </Text>
        </View>
        <Pressable
          style={{ padding: 8, backgroundColor: T.primaryFixed, borderRadius: 10 }}
          onPress={onRefresh}
          accessibilityLabel="Refresh peta"
        >
          <Icon name="bar-chart-2" size={18} color={T.primary} />
        </Pressable>
      </View>

      {/* Legenda */}
      <View style={{
        flexDirection: "row", flexWrap: "wrap",
        paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: T.white, borderBottomWidth: 1, borderColor: T.outlineVariant,
      }}>
        {Object.entries(JENIS_COLOR).map(([label, color]) => (
          <LegendDot key={label} color={color} label={label} />
        ))}
      </View>

      {/* Map — platform guard */}
      {Platform.OS === "web" ? (
        // Web browser: WebView tidak tersedia, tampilkan info
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 }}>
          <Icon name="map-pin" size={48} color={T.primaryFixed} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: T.onSurface, textAlign: "center" }}>
            Peta hanya tersedia di aplikasi mobile
          </Text>
          <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 20 }}>
            Buka di Expo Go (Android/iOS) untuk melihat peta GPS bangunan.
          </Text>
        </View>
      ) : buildings.filter(b => b.lat != null).length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={{
            backgroundColor: T.white, borderRadius: 16, padding: 28, alignItems: "center",
            borderWidth: 1, borderColor: T.outlineVariant, maxWidth: 320, width: "100%",
          }}>
            <Icon name="map-pin" size={48} color={T.primaryFixed} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: T.onSurface, marginTop: 16 }}>
              Belum Ada Marker GPS
            </Text>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              Tambahkan bangunan dengan lokasi GPS dari tab Data Lapangan. Marker akan muncul di sini.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <WebView
          ref={webRef}
          source={{ html: mapHTML }}
          style={{ flex: 1 }}
          onMessage={handleWebMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
              <ActivityIndicator color={T.primary} />
            </View>
          )}
        />
      )}
    </View>
  );
}
