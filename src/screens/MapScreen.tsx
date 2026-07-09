// ─── MapScreen — Peta Bangunan via WebView + OpenStreetMap/Leaflet ────────────
// Native (Android/iOS): WebView + Leaflet
// Web browser: iframe + Leaflet langsung (tanpa WebView)
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

// ─── Web-only: komponen IframeMap menggunakan dangerouslySetInnerHTML ────────
function IframeMap({ html, onMessage }: { html: string; onMessage: (data: any) => void }) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    // Dengarkan pesan dari iframe (pengganti ReactNativeWebView.postMessage)
    function handleMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        onMessage(data);
      } catch (_) {}
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onMessage]);

  if (Platform.OS !== "web") return null;

  // Render via srcdoc pada iframe — aman karena konten kita sendiri
  return (
    <div ref={containerRef} style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      <iframe
        title="Peta Bangunan"
        srcDoc={html}
        style={{ flex: 1, border: "none", width: "100%", height: "100%", minHeight: 400 }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
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
// postMsg: di native pakai ReactNativeWebView.postMessage, di web pakai window.parent.postMessage
function buildMapHTML(buildings: Bangunan[], centerLat: number, centerLng: number, isWeb = false): string {
  const postFn = isWeb
    ? `function postMsg(d){ window.parent.postMessage(JSON.stringify(d),'*'); }`
    : `function postMsg(d){ window.ReactNativeWebView.postMessage(JSON.stringify(d)); }`;

  const markers = buildings
    .filter((b) => b.lat != null && b.lng != null)
    .map((b) => {
      const color  = colorOf(b.jenis);
      const nama   = b.catatan ? b.catatan.replace(/'/g, "\\'") : "—";
      const alamat = (b.alamat ?? "").replace(/'/g, "\\'");
      const kkInfo = b.jumlah_kk != null ? `${b.jumlah_kk} KK` : "—";
      // Custom marker: lingkaran dengan nomor + pin tail + shadow
      return `
        var icon_${b.id} = L.divIcon({
          className: '',
          html: \`<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <div style="min-width:32px;height:32px;border-radius:16px;background:${color};border:3px solid white;
              box-shadow:0 3px 10px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;
              font-size:11px;color:white;font-weight:800;padding:0 6px;letter-spacing:-0.5px;">${b.nomor_urut}</div>
            <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
              border-top:8px solid ${color};margin-top:-1px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));"></div>
          </div>\`,
          iconSize: [32, 44], iconAnchor: [16, 44]
        });
        var popup_${b.id} = L.popup({
          maxWidth: 260,
          className: 'custom-popup',
          closeButton: true,
          offset: [0, -44]
        }).setContent(
          '<div class="callout">'
          + '<div class="callout-header" style="background:${color};">'
          + '<span class="callout-badge">${b.jenis}</span>'
          + '<span class="callout-no">No. ${b.nomor_urut}</span>'
          + '</div>'
          + '<div class="callout-body">'
          + '<div class="callout-row"><span class="callout-icon">👤</span><span class="callout-val"><b>${nama}</b></span></div>'
          + '<div class="callout-row"><span class="callout-icon">📋</span><span class="callout-val">${kkInfo}</span></div>'
          + '<div class="callout-row"><span class="callout-icon">📍</span><span class="callout-val">${alamat}</span></div>'
          + '<div class="callout-row"><span class="callout-icon">🌐</span><span class="callout-val" style="font-size:10px;color:#9ca3af;">${b.lat?.toFixed(6)}, ${b.lng?.toFixed(6)}</span></div>'
          + '</div>'
          + '<div class="callout-actions">'
          + '<button class="btn-detail" onclick="postMsg({type:\\'detail\\',id:${b.id}})">🔍 Detail</button>'
          + '<button class="btn-rute" onclick="postMsg({type:\\'rute\\',lat:${b.lat},lng:${b.lng}})">🧭 Rute</button>'
          + '</div>'
          + '</div>'
        );
        var marker_${b.id} = L.marker([${b.lat}, ${b.lng}], {icon: icon_${b.id}})
          .addTo(map)
          .bindPopup(popup_${b.id});
      `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { background:#0a0a0a; width:100%; height:100%; overflow:hidden; }
  #map { width:100vw; height:100vh; }

  /* ── Loading overlay ── */
  #loading-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(10,10,10,0.92);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
  }
  #loading-overlay.hidden { display: none; }
  .loader-ring {
    width: 44px; height: 44px;
    border: 4px solid rgba(255,255,255,0.12);
    border-top-color: #004ec7;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loader-text { color: rgba(255,255,255,0.7); font-family: sans-serif; font-size: 13px; }

  /* ── Toggle layer button ── */
  #toggle-btn {
    position: absolute; top: 14px; right: 14px; z-index: 1000;
    padding: 8px 16px;
    background: rgba(10,10,20,0.82);
    color: white;
    border: 1.5px solid rgba(255,255,255,0.22);
    border-radius: 22px;
    cursor: pointer; font-size: 12px; font-weight: 600;
    font-family: sans-serif;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.5);
    transition: all 0.2s;
    letter-spacing: 0.3px;
  }
  #toggle-btn:hover { background: rgba(10,10,40,0.95); border-color: rgba(255,255,255,0.4); }
  #toggle-btn:active { transform: scale(0.97); }

  /* ── FAB Lokasi Saya ── */
  #fab-locate {
    position: absolute; bottom: 90px; right: 14px; z-index: 1000;
    width: 50px; height: 50px;
    background: #004ec7;
    border: none; border-radius: 50%;
    cursor: pointer;
    font-size: 22px;
    box-shadow: 0 4px 16px rgba(0,78,199,0.55);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  #fab-locate:hover { background: #0040a8; transform: scale(1.08); }
  #fab-locate:active { transform: scale(0.95); }
  #fab-locate.locating { animation: pulse 1s ease-in-out infinite; }
  @keyframes pulse {
    0%,100% { box-shadow: 0 4px 16px rgba(0,78,199,0.55); }
    50%      { box-shadow: 0 4px 28px rgba(0,78,199,0.9); }
  }

  /* ── Jumlah marker info chip ── */
  #info-chip {
    position: absolute; bottom: 90px; left: 14px; z-index: 1000;
    padding: 7px 13px;
    background: rgba(10,10,20,0.82);
    color: rgba(255,255,255,0.85);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 20px;
    font-size: 11px; font-family: sans-serif;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    pointer-events: none;
  }

  /* ── Custom Callout / Popup ── */
  .custom-popup .leaflet-popup-content-wrapper {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    border: none !important;
  }
  .custom-popup .leaflet-popup-tip-container { display: none; }
  .custom-popup .leaflet-popup-content { margin: 0 !important; width: auto !important; }
  .callout {
    min-width: 220px; max-width: 260px;
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.38), 0 2px 8px rgba(0,0,0,0.2);
    font-family: sans-serif;
  }
  .callout-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px 8px;
  }
  .callout-badge {
    font-size: 11px; font-weight: 700; color: white;
    background: rgba(255,255,255,0.22);
    padding: 2px 8px; border-radius: 10px;
    letter-spacing: 0.4px;
  }
  .callout-no {
    font-size: 13px; font-weight: 800; color: white;
    letter-spacing: -0.3px;
  }
  .callout-body { padding: 10px 14px 8px; display: flex; flex-direction: column; gap: 5px; }
  .callout-row { display: flex; align-items: flex-start; gap: 7px; }
  .callout-icon { font-size: 12px; flex-shrink: 0; margin-top: 1px; }
  .callout-val { font-size: 12px; color: #374151; line-height: 1.45; }
  .callout-actions { display: flex; gap: 8px; padding: 8px 14px 12px; }
  .btn-detail, .btn-rute {
    flex: 1; padding: 7px 10px;
    border: none; border-radius: 8px;
    cursor: pointer; font-size: 12px; font-weight: 600;
    transition: opacity 0.15s, transform 0.1s;
    letter-spacing: 0.2px;
  }
  .btn-detail:active, .btn-rute:active { transform: scale(0.96); opacity: 0.85; }
  .btn-detail { background: #004ec7; color: white; }
  .btn-rute   { background: #16a34a; color: white; }

  /* ── Lokasi user ── */
  .user-location-dot {
    width: 16px; height: 16px; border-radius: 50%;
    background: #ef4444;
    border: 3px solid white;
    box-shadow: 0 0 0 4px rgba(239,68,68,0.3);
  }

  /* ── Leaflet override ── */
  .leaflet-control-zoom a {
    background: rgba(10,10,20,0.82) !important;
    color: white !important;
    border-color: rgba(255,255,255,0.15) !important;
    backdrop-filter: blur(8px);
  }
  .leaflet-control-zoom a:hover { background: rgba(0,78,199,0.7) !important; }
  .leaflet-control-attribution { display: none; }
</style>
</head>
<body>
<!-- Loading overlay -->
<div id="loading-overlay">
  <div class="loader-ring"></div>
  <span class="loader-text">Memuat peta satelit…</span>
</div>

<div id="map"></div>
<button id="toggle-btn" onclick="toggleLayer()">🗺️ Peta Normal</button>
<button id="fab-locate" title="Lokasi Saya" onclick="jumpToLocation()">📍</button>
<div id="info-chip">📌 ${buildings.filter(b => b.lat != null && b.lng != null).length} bangunan berpin</div>

<script>
  ${postFn}

  // ── Inisialisasi peta ──────────────────────────────────────────────────────
  var map = L.map('map', {
    zoomControl: true,
    zoomSnap: 0.5,
    zoomDelta: 0.5
  }).setView([${centerLat}, ${centerLng}], 16);

  // ── Layer Satelit HD (Esri World Imagery) ──────────────────────────────────
  var satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: '© Esri', maxZoom: 20, maxNativeZoom: 19 }
  );

  // ── Label jalan di atas satelit (hybrid mode) ─────────────────────────────
  var labelLayer = L.tileLayer(
    'https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.png',
    { attribution: '© Stamen', maxZoom: 20, maxNativeZoom: 18, opacity: 0.6 }
  );
  // Fallback label OSM jika Stamen tidak tersedia
  var labelLayerOSM = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '© OpenStreetMap', maxZoom: 19, opacity: 0.38 }
  );

  // ── Layer peta normal (CartoDB Dark — premium look) ────────────────────────
  var streetLayer = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { attribution: '© CARTO', maxZoom: 20, maxNativeZoom: 19 }
  );

  // Mulai dengan mode hybrid (satelit + label)
  satelliteLayer.addTo(map);
  labelLayerOSM.addTo(map);
  var isSatellite = true;

  // Sembunyikan loading overlay setelah tile pertama selesai
  satelliteLayer.on('load', function() {
    var overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  });
  // Fallback: sembunyikan loading setelah 4 detik
  setTimeout(function() {
    var overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }, 4000);

  // ── Toggle layer ───────────────────────────────────────────────────────────
  function toggleLayer() {
    var btn = document.getElementById('toggle-btn');
    if (isSatellite) {
      map.removeLayer(satelliteLayer);
      map.removeLayer(labelLayerOSM);
      streetLayer.addTo(map);
      btn.textContent = '🛰️ Hybrid Satelit';
      isSatellite = false;
    } else {
      map.removeLayer(streetLayer);
      satelliteLayer.addTo(map);
      labelLayerOSM.addTo(map);
      btn.textContent = '🗺️ Peta Normal';
      isSatellite = true;
    }
  }

  // ── Pasang marker ──────────────────────────────────────────────────────────
  ${markers}

  // ── FAB: Jump to current location ─────────────────────────────────────────
  var userMarker = null;
  function jumpToLocation() {
    var fab = document.getElementById('fab-locate');
    fab.classList.add('locating');
    map.locate({ enableHighAccuracy: true, timeout: 8000 });
  }

  map.on('locationfound', function(e) {
    var fab = document.getElementById('fab-locate');
    fab.classList.remove('locating');

    if (userMarker) { map.removeLayer(userMarker); }
    userMarker = L.marker(e.latlng, {
      icon: L.divIcon({
        className: '',
        html: '<div class="user-location-dot"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8]
      })
    }).addTo(map).bindPopup('<b style="font-family:sans-serif;font-size:12px;">📍 Lokasi Anda</b>').openPopup();

    // animateToRegion — smooth flyTo (setara animateToRegion di react-native-maps)
    map.flyTo(e.latlng, 17, { animate: true, duration: 1.0 });
  });

  map.on('locationerror', function(e) {
    var fab = document.getElementById('fab-locate');
    fab.classList.remove('locating');
    alert('Tidak dapat mengakses lokasi: ' + e.message);
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
  const webRef = useRef<any>(null);

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
      handleMapMessage(msg);
    } catch (_) {}
  }

  const withGPS  = buildings.filter((b) => b.lat != null).length;
  const noGPS    = buildings.length - withGPS;
  const mapHTML  = buildMapHTML(buildings, CENTER_LAT, CENTER_LNG, Platform.OS === "web");

  // Handler pesan dari iframe (web) atau WebView (native)
  function handleMapMessage(data: any) {
    if (data.type === "detail") {
      onDetailBangunan(data.id);
    } else if (data.type === "rute") {
      if (Platform.OS === "web") {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}&travelmode=walking`,
          "_blank"
        );
      } else {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}&travelmode=walking`
        );
      }
    }
  }

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
        // Web browser: render Leaflet via iframe
        buildings.filter(b => b.lat != null).length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 }}>
            <Icon name="map-pin" size={48} color={T.primaryFixed} />
            <Text style={{ fontSize: 16, fontWeight: "700", color: T.onSurface, textAlign: "center" }}>
              Belum Ada Marker GPS
            </Text>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 20 }}>
              Tambahkan bangunan dengan lokasi GPS dari tab Data Lapangan.
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <IframeMap html={mapHTML} onMessage={handleMapMessage} />
          </View>
        )
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
