import { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  DimensionValue,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  useWindowDimensions,
  View
} from "react-native";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

// Helper breakpoint — dipanggil di dalam komponen
// Menggunakan mounted guard agar SSR dan client hydration konsisten
function useBreakpoints() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sebelum mounted (SSR / hydration pass pertama), kembalikan nilai default
  // yang sama agar tidak terjadi mismatch antara server dan client.
  const w = mounted ? width : 375;
  return {
    w,
    isMobile:    w < 480,
    isTablet:    w >= 600,
    showSidebar: w >= 768,
  };
}

// ─── Design Tokens (Material You – BPS) ──────────────────────────────────────
const T = {
  primary:          "#004ec7",
  primaryContainer: "#1565f5",
  onPrimary:        "#ffffff",
  onPrimaryFixed:   "#001849",
  primaryFixed:     "#dbe1ff",
  primaryFixedDim:  "#b3c5ff",

  secondary:        "#006a63",
  secondaryContainer:"#99efe5",
  onSecondary:      "#ffffff",
  onSecondaryContainer:"#006f67",

  surface:          "#f7f9fb",
  surfaceContainer: "#eceef0",
  surfaceContainerLow:"#f2f4f6",
  surfaceContainerHigh:"#e6e8ea",
  surfaceContainerHighest:"#e0e3e5",
  surfaceBright:    "#f7f9fb",
  onSurface:        "#191c1e",
  onSurfaceVariant: "#424655",

  outline:          "#737687",
  outlineVariant:   "#c2c6d8",

  error:            "#ba1a1a",
  errorContainer:   "#ffdad6",

  white:            "#ffffff",
  bg:               "#f7f9fb",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const rp = (x: number) => "Rp " + Math.round(x).toLocaleString("id-ID");

function copyToClipboard(val: string) {
  Clipboard.setString(val);
  if (Platform.OS === "android") {
    ToastAndroid.show("✓ Disalin ke clipboard", ToastAndroid.SHORT);
  } else {
    Alert.alert("Disalin", `"${val}" berhasil disalin.`);
  }
}

// ─── Icon SVG inline (Feather design, via react-native-svg) ──────────────────
// Semua path diambil dari Feather Icons (MIT License)
const STROKE = { stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" as const };

function Icon({ name, size = 20, color = T.onSurfaceVariant }: { name: string; size?: number; color?: string }) {
  const s = { ...STROKE, stroke: color };
  const v = "0 0 24 24";
  switch (name) {
    case "home":         return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline {...s} points="9 22 9 12 15 12 15 22"/></Svg>;
    case "bar-chart-2":  return <Svg width={size} height={size} viewBox={v}><Line {...s} x1="18" y1="20" x2="18" y2="10"/><Line {...s} x1="12" y1="20" x2="12" y2="4"/><Line {...s} x1="6" y1="20" x2="6" y2="14"/></Svg>;
    case "database":     return <Svg width={size} height={size} viewBox={v}><ellipse {...s} cx="12" cy="5" rx="9" ry="3"/><Path {...s} d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><Path {...s} d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></Svg>;
    case "settings":     return <Svg width={size} height={size} viewBox={v}><Circle {...s} cx="12" cy="12" r="3"/><Path {...s} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>;
    case "help-circle":  return <Svg width={size} height={size} viewBox={v}><Circle {...s} cx="12" cy="12" r="10"/><Path {...s} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Line {...s} x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
    case "log-out":      return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline {...s} points="16 17 21 12 16 7"/><Line {...s} x1="21" y1="12" x2="9" y2="12"/></Svg>;
    case "bell":         return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...s} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
    case "user":         return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...s} cx="12" cy="7" r="4"/></Svg>;
    case "check-circle": return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><Polyline {...s} points="22 4 12 14.01 9 11.01"/></Svg>;
    case "zap":          return <Svg width={size} height={size} viewBox={v}><Polyline {...s} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>;
    case "arrow-right":  return <Svg width={size} height={size} viewBox={v}><Line {...s} x1="5" y1="12" x2="19" y2="12"/><Polyline {...s} points="12 5 19 12 12 19"/></Svg>;
    case "package":      return <Svg width={size} height={size} viewBox={v}><Line {...s} x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><Path {...s} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><Polyline {...s} points="3.27 6.96 12 12.01 20.73 6.96"/><Line {...s} x1="12" y1="22.08" x2="12" y2="12"/></Svg>;
    case "map-pin":      return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...s} cx="12" cy="10" r="3"/></Svg>;
    case "info":         return <Svg width={size} height={size} viewBox={v}><Circle {...s} cx="12" cy="12" r="10"/><Line {...s} x1="12" y1="16" x2="12" y2="12"/><Line {...s} x1="12" y1="8" x2="12.01" y2="8"/></Svg>;
    case "copy":         return <Svg width={size} height={size} viewBox={v}><Rect {...s} x="9" y="9" width="13" height="13" rx="2" ry="2"/><Path {...s} d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Svg>;
    case "check":        return <Svg width={size} height={size} viewBox={v}><Polyline {...s} points="20 6 9 17 4 12"/></Svg>;
    case "chevron-down": return <Svg width={size} height={size} viewBox={v}><Polyline {...s} points="6 9 12 15 18 9"/></Svg>;
    case "chevron-up":   return <Svg width={size} height={size} viewBox={v}><Polyline {...s} points="18 15 12 9 6 15"/></Svg>;
    case "x":            return <Svg width={size} height={size} viewBox={v}><Line {...s} x1="18" y1="6" x2="6" y2="18"/><Line {...s} x1="6" y1="6" x2="18" y2="18"/></Svg>;
    case "cpu":          return <Svg width={size} height={size} viewBox={v}><Rect {...s} x="4" y="4" width="16" height="16" rx="2"/><Rect {...s} x="9" y="9" width="6" height="6"/><Line {...s} x1="9" y1="1" x2="9" y2="4"/><Line {...s} x1="15" y1="1" x2="15" y2="4"/><Line {...s} x1="9" y1="20" x2="9" y2="23"/><Line {...s} x1="15" y1="20" x2="15" y2="23"/><Line {...s} x1="20" y1="9" x2="23" y2="9"/><Line {...s} x1="20" y1="14" x2="23" y2="14"/><Line {...s} x1="1" y1="9" x2="4" y2="9"/><Line {...s} x1="1" y1="14" x2="4" y2="14"/></Svg>;
    default:             return <Svg width={size} height={size} viewBox={v}><Circle {...s} cx="12" cy="12" r="10"/></Svg>;
  }
}

// ─── Chip / Badge ─────────────────────────────────────────────────────────────
function Badge({ text }: { text: string }) {
  return (
    <View style={ui.badge}>
      <Icon name="verified" size={13} color={T.primary} />
      <Text style={ui.badgeText}>{text}</Text>
    </View>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  const { w, isMobile } = useBreakpoints();
  const steps = ["Input Data", "Hasil"];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={isMobile}
      contentContainerStyle={[ui.stepperScroll, { minWidth: w - 40 }]}
      style={ui.stepperWrap}
    >
      {steps.map((s, i) => {
        const done   = i < step;
        const active = i === step;
        const isLast = i === steps.length - 1;
        return (
          <View key={i} style={ui.stepItem}>
            {/* Lingkaran + Label */}
            <View style={ui.stepContent}>
              <View style={[ui.stepCircle, active && ui.stepCircleActive, done && ui.stepCircleDone]}>
                <Text style={[ui.stepNum, (active || done) && { color: T.onPrimary }]}>
                  {done ? "✓" : String(i + 1)}
                </Text>
              </View>
              <Text
                style={[
                  ui.stepLabel,
                  active && { color: T.primary, fontWeight: "700" },
                  done  && { color: T.secondary },
                ]}
              >
                {s}
              </Text>
            </View>
            {/* Garis antar step */}
            {!isLast && <View style={ui.stepLine} />}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View style={ui.sectionCard}>
      <View style={ui.sectionCardHeader}>
        <Icon name={icon} size={18} color={T.secondary} />
        <Text style={ui.sectionCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// ─── Select Field ─────────────────────────────────────────────────────────────
function SelectField({
  label, value, onPress, width = "100%",
}: { label: string; value: string; onPress: () => void; width?: DimensionValue }) {
  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>{label}</Text>
      <Pressable
        style={({ pressed }) => [ui.select, pressed && { borderColor: T.primary }]}
        onPress={onPress}
        accessibilityLabel={`Pilih ${label}`}
      >
        <Text style={ui.selectText} numberOfLines={1}>{value}</Text>
        <Icon name="expand_more" size={16} color={T.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function InputField({
  label, value, onChangeText, placeholder = "", keyboardType = "default", width = "100%",
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; width?: DimensionValue;
}) {
  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>{label}</Text>
      <TextInput
        style={ui.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.outline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ─── Luas + Satuan combo ──────────────────────────────────────────────────────
function LuasField({
  luas, setLuas, satLuas, onSatPress, width = "100%",
}: { luas: string; setLuas: (v: string) => void; satLuas: string; onSatPress: () => void; width?: DimensionValue }) {
  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>Luas</Text>
      <View style={ui.luasRow}>
        <TextInput
          style={[ui.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
          value={luas}
          onChangeText={setLuas}
          placeholder="0.00"
          placeholderTextColor={T.outline}
          keyboardType="numeric"
        />
        <Pressable
          style={ui.luasSat}
          onPress={onSatPress}
        >
          <Text style={ui.luasSatText}>{satLuas}</Text>
          <Icon name="expand_more" size={14} color={T.onSurfaceVariant} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Result Row (1 baris = label + nilai + copy + info toggle) ───────────────
function ResultRow({
  label, value, isEven, explain,
}: {
  label: string;
  value: string;
  isEven: boolean;
  explain?: string;
}) {
  const [copied,   setCopied]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  function handleCopy() {
    copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <View>
      {/* ── Baris utama ── */}
      <View style={[ui.resultRow, isEven ? ui.rowEven : ui.rowOdd]}>
        {/* Tombol info – expand penjelasan */}
        <Pressable
          style={ui.infoToggleBtn}
          onPress={() => setExpanded((v) => !v)}
          accessibilityLabel={`Penjelasan ${label}`}
        >
          <Icon
            name={expanded ? "chevron-up" : "info"}
            size={14}
            color={expanded ? T.primary : T.outline}
          />
        </Pressable>

        {/* Label */}
        <Text style={ui.rowLabel} numberOfLines={2}>{label}</Text>

        {/* Nilai */}
        <Text style={ui.rowValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>

        {/* Copy */}
        <Pressable
          style={[ui.copyBtn, copied && ui.copyBtnDone]}
          onPress={handleCopy}
          accessibilityLabel={`Salin ${label}`}
        >
          <Icon
            name={copied ? "check" : "copy"}
            size={14}
            color={copied ? T.secondary : T.primary}
          />
        </Pressable>
      </View>

      {/* ── Panel penjelasan (collapsible) ── */}
      {expanded && explain && (
        <View style={[ui.explainPanel, isEven ? ui.rowEven : ui.rowOdd]}>
          <View style={ui.explainInner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Icon name="cpu" size={12} color={T.primary} />
              <Text style={ui.explainTitle}>Cara Hitung</Text>
            </View>
            <Text style={ui.explainText}>{explain}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Result Section Header ────────────────────────────────────────────────────
function ResultSection({ title }: { title: string }) {
  return (
    <View style={ui.resultSection}>
      <Text style={ui.resultSectionText}>{title}</Text>
    </View>
  );
}

// ─── Detail Worker Row ────────────────────────────────────────────────────────
function DetailRow({ label, qty, amount }: { label: string; qty: string; amount: string }) {
  return (
    <View style={ui.detailRow}>
      <Text style={[ui.detailCell, { flex: 5 }]}>{label}</Text>
      <Text style={[ui.detailCell, { flex: 2, textAlign: "center", color: T.onSurfaceVariant }]}>{qty}</Text>
      <Text style={[ui.detailCell, { flex: 3, textAlign: "right", color: T.primary, fontWeight: "700" }]}>{amount}</Text>
    </View>
  );
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
function SideNav() {
  const items = [
    { icon: "home",      label: "Beranda",           active: false },
    { icon: "analytics", label: "Parameter Estimasi", active: true  },
    { icon: "database",  label: "Basis Data",         active: false },
    { icon: "settings",  label: "Pengaturan",         active: false },
  ];
  return (
    <View style={ui.sideNav}>
      {/* Brand */}
      <View style={ui.sideNavBrand}>
        <View style={ui.sideNavLogoBox}>
          <Svg width={22} height={22} viewBox="0 0 32 32">
            <Rect x={2} y={2} width={13} height={13} rx={3} fill="#1565F5" />
            <Rect x={17} y={2} width={13} height={13} rx={3} fill="#00B4D8" />
            <Rect x={2} y={17} width={13} height={13} rx={3} fill="#F59E0B" />
            <Rect x={17} y={17} width={13} height={13} rx={3} fill="#22C55E" />
          </Svg>
        </View>
        <View>
          <Text style={ui.sideNavBrandTitle}>BPS Sumberharjo</Text>
          <Text style={ui.sideNavBrandSub}>SE2026 SMART ESTIMATOR</Text>
        </View>
      </View>

      {/* Menu */}
      {items.map((item) => (
        <View
          key={item.label}
          style={[ui.sideNavItem, item.active && ui.sideNavItemActive]}
        >
          <Icon name={item.icon} size={18} color={item.active ? T.onPrimaryFixed : T.onSurfaceVariant} />
          <Text style={[ui.sideNavLabel, item.active && { color: T.onPrimaryFixed, fontWeight: "700" }]}>
            {item.label}
          </Text>
        </View>
      ))}

      {/* Bottom */}
      <View style={ui.sideNavBottom}>
        <View style={ui.sideNavItem}>
          <Icon name="help" size={18} color={T.onSurfaceVariant} />
          <Text style={ui.sideNavLabel}>Bantuan</Text>
        </View>
        <View style={[ui.sideNavItem, { marginTop: 2 }]}>
          <Icon name="logout" size={18} color={T.error} />
          <Text style={[ui.sideNavLabel, { color: T.error }]}>Keluar</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Halaman Belum Tersedia ───────────────────────────────────────────────────
function PageComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={ui.comingSoonWrap}>
      <View style={ui.comingSoonCard}>
        <View style={ui.comingSoonIconBox}>
          <Icon name={icon} size={40} color={T.primary} />
        </View>
        <Text style={ui.comingSoonTitle}>{title}</Text>
        <Text style={ui.comingSoonSub}>Halaman ini belum tersedia</Text>
        <Text style={ui.comingSoonDesc}>
          Fitur sedang dalam pengembangan dan akan segera hadir di versi berikutnya.
        </Text>
        <View style={ui.comingSoonBadge}>
          <Icon name="zap" size={13} color={T.secondary} />
          <Text style={ui.comingSoonBadgeText}>Segera Hadir · SE2026 v1</Text>
        </View>

        {/* Tombol Lihat Pengembang */}
        <Pressable
          style={({ pressed }) => [ui.devBtn, pressed && ui.devBtnPressed]}
          onPress={() => Linking.openURL("https://fikriasyam.vercel.app/")}
          accessibilityLabel="Lihat halaman pengembang"
        >
          <Icon name="user" size={14} color={T.onPrimary} />
          <Text style={ui.devBtnText}>Profile Pengembang</Text>
          <Icon name="arrow-right" size={14} color={T.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
type BottomNavItem = { icon: string; label: string; key: string };

function BottomNav({ active, onPress }: { active: string; onPress: (key: string) => void }) {
  const items: BottomNavItem[] = [
    { icon: "home",        label: "Beranda",    key: "home" },
    { icon: "bar-chart-2", label: "Estimasi",   key: "estimasi" },
    { icon: "database",    label: "Basis Data", key: "data" },
    { icon: "settings",    label: "Pengaturan", key: "settings" },
  ];
  return (
    <View style={ui.bottomNav}>
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [ui.bottomNavItem, pressed && { opacity: 0.7 }]}
            onPress={() => onPress(item.key)}
            accessibilityLabel={item.label}
          >
            <View style={[ui.bottomNavIconWrap, isActive && ui.bottomNavIconActive]}>
              <Icon name={item.icon} size={20} color={isActive ? T.primary : T.onSurfaceVariant} />
            </View>
            <Text style={[ui.bottomNavLabel, isActive && ui.bottomNavLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function TopNav() {
  return (
    <View style={ui.topNav}>
      <Text style={ui.topNavBrand}>Estimasi Pintar</Text>
      <View style={ui.topNavActions}>
        <View style={ui.topNavBtn}><Icon name="notifications" size={20} color={T.onSurfaceVariant} /></View>
        <View style={ui.topNavBtn}><Icon name="account_circle" size={20} color={T.onSurfaceVariant} /></View>
      </View>
    </View>
  );
}

// ─── INFO CARD ────────────────────────────────────────────────────────────────
function InfoCard() {
  return (
    <View style={ui.infoCard}>
      <View style={ui.infoIconBox}>
        <Icon name="info" size={20} color={T.onSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ui.infoTitle}>Catatan Akurasi</Text>
        <Text style={ui.infoBody}>
          Data yang diinputkan akan disinkronisasikan dengan basis data regional BPS Bojonegoro. Pastikan parameter Luas menggunakan satuan yang sesuai untuk meminimalisir deviasi statistik pada laporan SE2026.
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const { w, isMobile, isTablet, showSidebar } = useBreakpoints();

  // ── State Input ──
  const [kategori, setKategori]   = useState("Tanaman Pangan"); // kategori besar
  const [kom, setKom]           = useState("Padi");
  const [mode, setMode]         = useState("panen");       // default: berdasarkan hasil panen
  const [luas, setLuas]         = useState("1");
  const [satLuas, setSatLuas]   = useState("BAHU");
  const [panen, setPanen]       = useState("100");          // default 100 kuintal
  const [satPanen, setSatPanen] = useState("KUINTAL");      // default kuintal
  const [jumlahTandur, setJumlahTandur] = useState("");   // input manual penandur
  const [musimTanam, setMusimTanam]     = useState("Rendengan"); // hanya untuk Padi
  // ── State khusus Tembakau ──
  const [jenisTembakau, setJenisTembakau] = useState("Tembakau Basah");
  const [jumlahPohon, setJumlahPohon]     = useState("1000"); // input pohon tembakau
  const [luasTembakau, setLuasTembakau]   = useState("15");   // luas m² untuk PBB
  const [status, setStatus]     = useState("Milik Sendiri");
  const [kec, setKec]           = useState("Sumberrejo");
  const [tahun, setTahun]       = useState("2002");

  // ── State UI ──
  const [hasil, setHasil]           = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [step, setStep]             = useState(0); // 0=input, 1=hasil
  const [activePage, setActivePage] = useState("estimasi"); // tab aktif

  // ── Picker state ──
  const [pickerVisible, setPickerVisible]   = useState(false);
  const [pickerType, setPickerType]         = useState("");
  const [pickerOptions, setPickerOptions]   = useState<string[]>([]);
  const [pickerCallback, setPickerCallback] = useState<(v: string) => void>(() => {});

  const db: Record<string, { prod: number; harga: number; t: number; b: number }> = {
    Padi:           { prod: 6000,  harga: 6500,  t: 24, b: 0.30 },
    Jagung:         { prod: 7000,  harga: 5000,  t: 8,  b: 0.25 },
    Kedelai:        { prod: 2000,  harga: 10000, t: 10, b: 0.30 },
    "Kacang Hijau": { prod: 1200,  harga: 12000, t: 10, b: 0.28 },
    Palawija:       { prod: 3000,  harga: 4000,  t: 8,  b: 0.25 },
    "Bawang Merah": { prod: 10000, harga: 25000, t: 25, b: 0.65 },
    Cabai:          { prod: 8000,  harga: 30000, t: 20, b: 0.70 },
    Tebu:           { prod: 80000, harga: 700,   t: 12, b: 0.45 },
  };

  // ── Konstanta Tembakau (per 1.000 pohon) ─────────────────────────────────
  const TEMBAKAU = {
    prodBasah:        700,   // kg basah default per 1.000 pohon
    susut:            0.1,   // 1 kg basah → 0,1 kg kering
    // Tembakau Basah
    basahNilaiProd:   3_000_000,
    basahBiayaProd:   400_000,
    basahOps:         180_000,
    basahGajiKowak:   2 * 2 * 70_000,   // 2org × 2hari × Rp70rb = 280.000
    basahGajiMacul:   3 * 3 * 70_000,   // 3org × 3hari × Rp70rb = 630.000
    basahGajiPanen:   5 * 1 * 70_000,   // 5org × 1hari × Rp70rb = 350.000
    // Tembakau Kering (biaya per kg basah)
    keringNilaiProd:  4_800_000,
    keringBiayaProd:  800_000,
    keringOps:        100_000,
    keringUpahRajang: 200_000 / 100,    // Rp200rb per kuintal = Rp2.000/kg basah
    keringUpahMepe:   50_000  / 100,    // Rp50rb per kuintal  = Rp500/kg basah
    // Aset (tetap)
    asetTanah:        15 * 100_000,     // 15m² × Rp100rb = 1.500.000
    asetMesin:        2_000_000,
    asetWidek:        800_000,
    luasProduksi:     15,               // m²
    pbbPerM2:         500,              // estimasi PBB per m² sawah per tahun
  };

  // ── Peta kategori → daftar komoditas ──────────────────────────────────────
  const kategoriMap: Record<string, string[]> = {
    "Tanaman Pangan": ["Padi", "Jagung", "Kedelai", "Kacang Hijau", "Palawija"],
    "Perkebunan":     ["Tembakau", "Tebu", "Bawang Merah", "Cabai"],
    "Ternak":         [], // belum tersedia
  };
  const daftarKategori = Object.keys(kategoriMap);

  function openPicker(label: string, options: string[], _cur: string, cb: (v: string) => void) {
    setPickerType(label);
    setPickerOptions(options);
    setPickerCallback(() => cb);
    setPickerVisible(true);
  }

  function hitung() {
    setLoading(true);
    try {
      // ══════════════════════════════════════════════════════════════════════
      // JALUR TEMBAKAU — perhitungan berbeda dari komoditas lain
      // ══════════════════════════════════════════════════════════════════════
      if (kom === "Tembakau") {
        const pohon    = parseFloat(jumlahPohon) || 1000;
        const luasM2_t = parseFloat(luasTembakau) || 15;
        const ribuan   = pohon / 1000; // kelipatan 1.000 pohon
        const T        = TEMBAKAU;
        const isKering = jenisTembakau === "Tembakau Kering";

        // Produksi
        const kgBasah  = T.prodBasah * ribuan;        // kg daun basah
        const kgKering = kgBasah * T.susut;            // kg kering (susut 90%)

        // Nilai produksi & biaya per ribuan pohon
        const nilaiProd  = (isKering ? T.keringNilaiProd : T.basahNilaiProd) * ribuan;
        const biayaProd  = (isKering ? T.keringBiayaProd : T.basahBiayaProd) * ribuan;
        const ops        = (isKering ? T.keringOps       : T.basahOps)       * ribuan;

        // Gaji TK
        let gajiTK = 0;
        let tkKowak = 0, tkMacul = 0, tkPanen = 0, tkRajang = 0, tkMepe = 0;
        if (!isKering) {
          // Tembakau Basah
          gajiTK   = (T.basahGajiKowak + T.basahGajiMacul + T.basahGajiPanen) * ribuan;
          tkKowak  = Math.max(1, Math.round(2 * ribuan));
          tkMacul  = Math.max(1, Math.round(3 * ribuan));
          tkPanen  = Math.max(1, Math.round(5 * ribuan));
        } else {
          // Tembakau Kering — upah per kg basah
          gajiTK   = (T.keringUpahRajang + T.keringUpahMepe) * kgBasah;
          tkRajang = Math.max(1, Math.round(kgBasah / 50));  // ~50 kg/orang/hari
          tkMepe   = Math.max(1, Math.round(kgBasah / 100)); // ~100 kg/orang/hari
        }

        // Non-tunai (PBB lahan)
        const pbb    = luasM2_t * T.pbbPerM2;
        const nonT   = isKering ? 0 : pbb;

        const totalPeng = gajiTK + biayaProd + ops + nonT;
        const pendBersih = nilaiProd - totalPeng;

        // Aset
        const asetTanah_t = T.asetTanah;
        const asetLain_t  = T.asetMesin + T.asetWidek;
        const totalAset   = asetTanah_t + asetLain_t;

        // Pekerja SE2026 (24)
        const dibayar_t = tkKowak + tkMacul + tkPanen + tkRajang + tkMepe;
        const tidak_t   = 2;
        const total_t   = Math.max(dibayar_t, 1) + tidak_t;

        setHasil({
          isTembakau: true,
          jenis: jenisTembakau,
          pohon, ribuan, kgBasah, kgKering,
          nilaiProd, biayaProd, ops, gajiTK, nonT, totalPeng, pendBersih,
          asetTanah_t, asetLain_t, totalAset, luasM2_t,
          tkKowak, tkMacul, tkPanen, tkRajang, tkMepe,
          dibayar: Math.max(dibayar_t, 1), tidak: tidak_t, total: total_t,
          musim: musimTanam,
        });
        setStep(1);
        return;
      }

      // ══════════════════════════════════════════════════════════════════════
      // JALUR KOMODITAS BIASA
      // ══════════════════════════════════════════════════════════════════════
      const d = db[kom];
      if (!d) {
        Alert.alert("Error", `Komoditas "${kom}" tidak ditemukan. Pilih komoditas yang tersedia.`);
        setLoading(false);
        return;
      }
      let ha = 0, prod = 0, bahu = 0;

      if (mode === "luas") {
        const n = parseFloat(luas) || 0;
        if (satLuas === "BAHU")        { bahu = n; ha = n * 0.666; }
        else if (satLuas === "HEKTAR") { ha = n; bahu = n / 0.666; }
        else                           { ha = n / 10000; bahu = ha / 0.666; }
        // Padi Walikan produktivitas lebih rendah ~15% dibanding Rendengan
        const prodPerM2 = (kom === "Padi" && musimTanam === "Walikan") ? 0.595 : 0.7;
        prod = kom === "Padi" ? ha * 10000 * prodPerM2 : ha * d.prod;
      } else {
        const n = parseFloat(panen) || 0;
        if      (satPanen === "TON")     prod = n * 1000;
        else if (satPanen === "KUINTAL") prod = n * 100;
        else                             prod = n;
        // Hitung luas mundur dari produksi
        const prodPerM2 = (kom === "Padi" && musimTanam === "Walikan") ? 0.595 : 0.7;
        const m2 = kom === "Padi" ? prod / prodPerM2 : (prod / d.prod) * 10000;
        ha = m2 / 10000; bahu = ha / 0.666;
      }

      const kuintal   = prod / 100;
      const hargaJual = (kom === "Padi" && musimTanam === "Walikan") ? 6800 : d.harga;
      const pend      = prod * hargaJual;
      const upah      = pend * 0.10;
      // Walikan: rasio biaya saprotan lebih tinggi 5% karena biaya pompanisasi
      const rasioB    = (kom === "Padi" && musimTanam === "Walikan") ? d.b + 0.05 : d.b;
      let   biaya     = pend * rasioB;
      const oper      = pend * 0.05;
      const non       = pend * 0.02;
      if (status !== "Milik Sendiri") biaya += ha * 12000000;
      const totalPeng = upah + biaya + oper + non;

      let dibayar = Math.round((2 + d.t + 5 + 8 + 3) * ha);
      if (dibayar < 1) dibayar = 1;
      const tidak    = 2;
      const total    = dibayar + tidak;
      const luasM2_f = ha * 10000;
      const asetTanah = luasM2_f * 100000;
      // ── Database alat pertanian ──
      const alatDb = [
        { id: "A001", nama: "Pompa Air (Alkon)",      kategori: "Mesin",        harga: 1_500_000 },
        { id: "A002", nama: "Sprayer Elektrik (16L)", kategori: "Alat Semprot", harga: 250_000  },
        { id: "S001", nama: "Sabit / Arit",           kategori: "Alat Tangan",  harga: 50_000   },
        { id: "P001", nama: "Cangkul (Pacul)",        kategori: "Alat Tangan",  harga: 75_000   },
      ];

      // Estimasi jumlah unit per alat berdasarkan luas m²
      // Setiap 3.000 m² butuh 1 unit alat tangan, setiap 10.000 m² butuh 1 mesin/sprayer
      const unitAlkon   = Math.max(1, Math.round(luasM2_f / 10000));
      const unitSprayer = Math.max(1, Math.round(luasM2_f / 10000));
      const unitSabit   = Math.max(1, Math.round(luasM2_f / 3000));
      const unitCangkul = Math.max(1, Math.round(luasM2_f / 3000));

      const alatUnits = [unitAlkon, unitSprayer, unitSabit, unitCangkul];
      const asetLain  = alatDb.reduce((sum, alat, i) => sum + alat.harga * alatUnits[i], 0);
      const tamping   = Math.max(1, Math.round(ha * 10));
      // Jika pengguna input jumlah penandur, pakai itu; jika kosong pakai estimasi otomatis
      const inputTandur = parseInt(jumlahTandur) || 0;
      const tandur    = inputTandur > 0 ? inputTandur : Math.max(1, Math.round(ha * 20));
      const matun     = Math.max(1, Math.round(ha * 15));
      const daut      = Math.max(1, Math.round(ha * 10));
      const traktorCost = (kuintal / 8) * 150000;

      setHasil({ total, dibayar, tidak, upah, biaya, oper, non, totalPeng, pend, prod,
        bahu, luasM2_f, asetTanah, asetLain, tamping, tandur, matun, daut, traktorCost,
        alatUnits, musim: musimTanam });
      setStep(1);
    } catch (e) {
      Alert.alert("Error", "Terjadi kesalahan saat menghitung. Periksa input Anda.");
    } finally {
      setLoading(false);
    }
  }

  // ── Build result rows ──
  function buildRows() {
    if (!hasil) return [];
    const h  = hasil;

    // ══════════════════════════════════════════════════════════════════════
    // TEMBAKAU — baris hasil khusus
    // ══════════════════════════════════════════════════════════════════════
    if (h.isTembakau) {
      const isKering = h.jenis === "Tembakau Kering";
      return [
        // ── PEKERJA ────────────────────────────────────────────────────────
        { section: "24 — Pekerja Tetap & Tidak Tetap" },
        {
          label: "24.a1  Laki-laki Tetap",
          value: String(Math.ceil(h.total * 0.6)),
          explain: `Total pekerja (${h.total} orang) × 60% = ${Math.ceil(h.total * 0.6)} orang laki-laki.`,
        },
        {
          label: "24.b1  Perempuan Tetap",
          value: String(Math.floor(h.total * 0.4)),
          explain: `Total pekerja (${h.total} orang) × 40% = ${Math.floor(h.total * 0.4)} orang perempuan.`,
        },
        {
          label: "24.c1  Total Pekerja",
          value: String(h.total),
          explain: `Dibayar (${h.dibayar}) + Tidak Dibayar (${h.tidak}) = ${h.total} orang.`,
        },
        {
          label: "24.a2  Dibayar",
          value: String(h.dibayar),
          explain: isKering
            ? `Ngrajang: ~${h.tkRajang} org  |  Mepe: ~${h.tkMepe} org\n` +
              `Dihitung dari ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg basah ÷ kapasitas per orang.`
            : `Kowak: ${h.tkKowak} org  |  Macul: ${h.tkMacul} org  |  Panen: ${h.tkPanen} org\n` +
              `Per ${(h.ribuan).toFixed(2)}× lipat 1.000 pohon.`,
        },
        {
          label: "24.b2  Tidak Dibayar",
          value: String(h.tidak),
          explain: `2 orang anggota keluarga (standar BPS SE2026).`,
        },

        // ── PENGELUARAN ─────────────────────────────────────────────────────
        { section: "26 — Pengeluaran Usaha" },
        {
          label: "26.a   Gaji Tenaga Kerja",
          value: rp(h.gajiTK),
          explain: isKering
            ? `Ngrajang: ${Math.round(h.kgBasah).toLocaleString()} kg × Rp ${(TEMBAKAU.keringUpahRajang).toLocaleString()}/kg = ${rp(TEMBAKAU.keringUpahRajang * h.kgBasah)}\n` +
              `Mepe:     ${Math.round(h.kgBasah).toLocaleString()} kg × Rp ${(TEMBAKAU.keringUpahMepe).toLocaleString()}/kg   = ${rp(TEMBAKAU.keringUpahMepe * h.kgBasah)}\n` +
              `Total = ${rp(h.gajiTK)}`
            : `Kowak : ${h.tkKowak} org × 2 hari × Rp 70.000 = ${rp(TEMBAKAU.basahGajiKowak * h.ribuan)}\n` +
              `Macul : ${h.tkMacul} org × 3 hari × Rp 70.000 = ${rp(TEMBAKAU.basahGajiMacul * h.ribuan)}\n` +
              `Panen : ${h.tkPanen} org × 1 hari × Rp 70.000 = ${rp(TEMBAKAU.basahGajiPanen * h.ribuan)}\n` +
              `Total = ${rp(h.gajiTK)}`,
        },
        {
          label: "26.b   Biaya Produksi (Saprotan)",
          value: rp(h.biayaProd),
          explain:
            `Rp ${(isKering ? TEMBAKAU.keringBiayaProd : TEMBAKAU.basahBiayaProd).toLocaleString()} per 1.000 pohon\n` +
            `× ${h.ribuan.toFixed(2)} (${Math.round(h.pohon).toLocaleString()} pohon ÷ 1.000)\n` +
            `= ${rp(h.biayaProd)}`,
        },
        {
          label: "26.d   Biaya Operasional",
          value: rp(h.ops),
          explain:
            `Rp ${(isKering ? TEMBAKAU.keringOps : TEMBAKAU.basahOps).toLocaleString()} per 1.000 pohon\n` +
            `× ${h.ribuan.toFixed(2)} = ${rp(h.ops)}`,
        },
        {
          label: "26.e   Non-Tunai (PBB)",
          value: isKering ? "Rp 0" : rp(h.nonT),
          explain: isKering
            ? `Tembakau Kering: tidak ada biaya non-tunai.`
            : `PBB lahan: ${h.luasM2_t} m² × Rp ${TEMBAKAU.pbbPerM2.toLocaleString()}/m² = ${rp(h.nonT)}.`,
        },
        {
          label: "26.f   Total Pengeluaran",
          value: rp(h.totalPeng),
          explain:
            `Gaji TK    : ${rp(h.gajiTK)}\n` +
            `Saprotan   : ${rp(h.biayaProd)}\n` +
            `Operasional: ${rp(h.ops)}\n` +
            `Non-Tunai  : ${rp(h.nonT)}\n` +
            `Total = ${rp(h.totalPeng)}`,
        },

        // ── PENDAPATAN ──────────────────────────────────────────────────────
        { section: "27 — Pendapatan Usaha" },
        {
          label: "27.a   Nilai Produksi",
          value: rp(h.nilaiProd),
          explain:
            `Rp ${(isKering ? TEMBAKAU.keringNilaiProd : TEMBAKAU.basahNilaiProd).toLocaleString()} per 1.000 pohon\n` +
            `× ${h.ribuan.toFixed(2)} = ${rp(h.nilaiProd)}\n` +
            (isKering
              ? `(Hasil kering: ${Math.round(h.kgBasah).toLocaleString()} kg basah × 0,1 = ${Math.round(h.kgKering).toLocaleString()} kg kering)`
              : `(Hasil basah: ${Math.round(h.kgBasah).toLocaleString()} kg)`),
        },
        {
          label: "27.c   Pendapatan Bersih",
          value: rp(h.pendBersih),
          explain: `Nilai Produksi − Total Pengeluaran\n${rp(h.nilaiProd)} − ${rp(h.totalPeng)} = ${rp(h.pendBersih)}`,
        },
        {
          label: "Hasil Produksi",
          value: isKering
            ? `${Math.round(h.kgKering).toLocaleString("id-ID")} kg kering`
            : `${Math.round(h.kgBasah).toLocaleString("id-ID")} kg basah`,
          explain: isKering
            ? `${Math.round(h.kgBasah).toLocaleString()} kg basah × susut 0,1 = ${Math.round(h.kgKering).toLocaleString()} kg kering`
            : `${h.ribuan.toFixed(2)} × ${TEMBAKAU.prodBasah} kg/1.000 pohon = ${Math.round(h.kgBasah).toLocaleString()} kg basah`,
        },

        // ── ASET ────────────────────────────────────────────────────────────
        { section: "28 — Aset Usaha" },
        {
          label: "28.a   Nilai Tanah & Bangunan",
          value: rp(h.asetTanah_t),
          explain: `Luas produksi 15 m² × Rp 100.000/m² = ${rp(h.asetTanah_t)}`,
        },
        {
          label: "28.b   Aset Lainnya",
          value: rp(h.asetLain_t),
          explain:
            `Mesin sedang : Rp 2.000.000\n` +
            `Widek        : Rp   800.000\n` +
            `Total = ${rp(h.asetLain_t)}`,
        },
        {
          label: "28.c   Total Aset",
          value: rp(h.totalAset),
          explain: `${rp(h.asetTanah_t)} + ${rp(h.asetLain_t)} = ${rp(h.totalAset)}`,
        },
        {
          label: "28.d   Luas Produksi",
          value: `${h.luasM2_t} m²`,
          explain: `Luas tempat produksi tembakau: ${h.luasM2_t} m² (3 × 5 m standar).`,
        },
      ];
    }

    // ══════════════════════════════════════════════════════════════════════
    // KOMODITAS BIASA
    // ══════════════════════════════════════════════════════════════════════
    const d  = db[kom];
    const ha = h.luasM2_f / 10000;

    return [
      // ── PEKERJA ──────────────────────────────────────────────────────────────
      { section: "24 — Pekerja Tetap & Tidak Tetap" },
      {
        label: "24.a1  Laki-laki Tetap",
        value: String(Math.ceil(h.total * 0.6)),
        explain:
          `Total pekerja (${h.total} orang) diasumsikan 60% laki-laki.\n` +
          `Rumus: ceil(${h.total} × 60%) = ${Math.ceil(h.total * 0.6)} orang.`,
      },
      {
        label: "24.b1  Perempuan Tetap",
        value: String(Math.floor(h.total * 0.4)),
        explain:
          `Total pekerja (${h.total} orang) diasumsikan 40% perempuan.\n` +
          `Rumus: floor(${h.total} × 40%) = ${Math.floor(h.total * 0.4)} orang.`,
      },
      {
        label: "24.c1  Total Pekerja",
        value: String(h.total),
        explain:
          `Penjumlahan laki-laki + perempuan = ${Math.ceil(h.total * 0.6)} + ${Math.floor(h.total * 0.4)} = ${h.total} orang.`,
      },
      {
        label: "24.a2  Dibayar",
        value: String(h.dibayar),
        explain:
          `Estimasi pekerja dibayar dihitung dari koefisien kebutuhan TK komoditas ${kom}.\n` +
          `Rumus: round((2 + ${d.t} + 5 + 8 + 3) × ${ha.toFixed(3)} ha) = ${h.dibayar} orang.\n` +
          `(2=pengurus, ${d.t}=pekerja lapang komoditas, 5=panen, 8=pasca panen, 3=angkut)`,
      },
      {
        label: "24.b2  Tidak Dibayar",
        value: String(h.tidak),
        explain:
          `Diasumsikan 2 orang anggota keluarga yang membantu tanpa upah (standar BPS SE2026).`,
      },
      {
        label: "24.c2  Total",
        value: String(h.total),
        explain: `Total = Dibayar (${h.dibayar}) + Tidak Dibayar (${h.tidak}) = ${h.total} orang.`,
      },

      // ── PENGELUARAN ───────────────────────────────────────────────────────────
      { section: "26 — Pengeluaran Usaha" },
      {
        label: "26.a   Upah Tenaga Kerja",
        value: rp(h.upah),
        explain:
          `10% dari penerimaan kotor diasumsikan untuk upah tenaga kerja.\n` +
          `Rumus: ${rp(h.pend)} × 10% = ${rp(h.upah)}.`,
      },
      {
        label: "26.b   Biaya Saprotan",
        value: rp(h.biaya),
        explain: status === "Milik Sendiri"
          ? `Komoditas ${kom} menggunakan rasio biaya input ${(d.b * 100).toFixed(0)}% dari penerimaan.\n` +
            `Rumus: ${rp(h.pend)} × ${(d.b * 100).toFixed(0)}% = ${rp(h.biaya)}.\n` +
            `(Termasuk benih, pupuk, pestisida sesuai standar produksi ${kom})`
          : `Komoditas ${kom}: ${rp(h.pend)} × ${(d.b * 100).toFixed(0)}% = ${rp(h.pend * d.b)}\n` +
            `+ Biaya sewa lahan: ${ha.toFixed(3)} ha × Rp 12.000.000 = ${rp(ha * 12000000)}\n` +
            `Total: ${rp(h.biaya)} (status lahan: ${status})`,
      },
      {
        label: "26.d   Biaya Operasional",
        value: rp(h.oper),
        explain:
          `5% dari penerimaan kotor untuk biaya operasional (transport, bahan bakar, dll).\n` +
          `Rumus: ${rp(h.pend)} × 5% = ${rp(h.oper)}.`,
      },
      {
        label: "26.e   Biaya Non-Tunai",
        value: rp(h.non),
        explain:
          `2% dari penerimaan kotor untuk biaya non-tunai (penyusutan alat, dll).\n` +
          `Rumus: ${rp(h.pend)} × 2% = ${rp(h.non)}.`,
      },
      {
        label: "26.f   Total Pengeluaran",
        value: rp(h.totalPeng),
        explain:
          `Penjumlahan semua komponen pengeluaran:\n` +
          `  Upah TK    : ${rp(h.upah)}\n` +
          `  Saprotan   : ${rp(h.biaya)}\n` +
          `  Operasional: ${rp(h.oper)}\n` +
          `  Non-Tunai  : ${rp(h.non)}\n` +
          `Total = ${rp(h.totalPeng)}`,
      },

      // ── PENDAPATAN ────────────────────────────────────────────────────────────
      { section: "27 — Pendapatan Usaha" },
      {
        label: "27.a   Penerimaan Kotor",
        value: rp(h.pend),
        explain:
          `Produksi × Harga jual komoditas ${kom}.\n` +
          `Rumus: ${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${d.harga.toLocaleString("id-ID")}/kg\n` +
          `= ${rp(h.pend)}.`,
      },
      {
        label: "27.c   Pendapatan Bersih",
        value: rp(h.pend - h.totalPeng),
        explain:
          `Penerimaan Kotor dikurangi Total Pengeluaran.\n` +
          `Rumus: ${rp(h.pend)} − ${rp(h.totalPeng)} = ${rp(h.pend - h.totalPeng)}.`,
      },
      {
        label: "Hasil Panen",
        value: h.prod.toLocaleString("id-ID") + " kg",
        explain: mode === "luas"
          ? kom === "Padi"
            ? `Luas ${h.bahu.toFixed(2)} Bahu = ${ha.toFixed(4)} ha = ${Math.round(ha * 10000).toLocaleString()} m².\n` +
              `Produktivitas Padi: 0,7 kg/m².\n` +
              `Rumus: ${Math.round(ha * 10000).toLocaleString()} m² × 0,7 = ${Math.round(h.prod).toLocaleString()} kg.`
            : `Luas ${h.bahu.toFixed(2)} Bahu = ${ha.toFixed(4)} ha.\n` +
              `Produktivitas ${kom}: ${d.prod.toLocaleString()} kg/ha.\n` +
              `Rumus: ${ha.toFixed(4)} ha × ${d.prod.toLocaleString()} = ${Math.round(h.prod).toLocaleString()} kg.`
          : satPanen === "KUINTAL"
            ? `Input: ${panen} kuintal × 100 = ${Math.round(h.prod).toLocaleString()} kg.`
            : satPanen === "TON"
            ? `Input: ${panen} ton × 1.000 = ${Math.round(h.prod).toLocaleString()} kg.`
            : `Input langsung: ${Math.round(h.prod).toLocaleString()} kg.`,
      },
      {
        label: "Estimasi Luas",
        value: Math.round(h.luasM2_f).toLocaleString("id-ID") + " m²",
        explain:
          `${h.bahu.toFixed(4)} Bahu × 0,666 ha/Bahu = ${ha.toFixed(6)} ha\n` +
          `× 10.000 m²/ha = ${Math.round(h.luasM2_f).toLocaleString()} m².`,
      },

      // ── ASET ─────────────────────────────────────────────────────────────────
      { section: "28 — Aset Usaha" },
      {
        label: "28.a   Nilai Tanah",
        value: rp(h.asetTanah),
        explain: `Lahan dinilai Rp 100.000/m² (standar estimasi BPS pedesaan Bojonegoro).\n` +
            `Rumus: ${Math.round(h.luasM2_f).toLocaleString()} m² × Rp 100.000 = ${rp(h.asetTanah)}.`,
      },
      // 28.b hanya tampil kalau bukan Walikan
      ...(h.musim !== "Walikan" ? [{
        label: "28.b   Aset Lainnya",
        value: rp(h.asetLain),
        explain:
          `Estimasi nilai peralatan usaha berdasarkan luas lahan ${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²:\n\n` +
          `  ID    Nama Alat               Jml   Harga Satuan    Subtotal\n` +
          `  A001  Pompa Air (Alkon)       ${String(h.alatUnits[0]).padStart(3)}×  Rp 1.500.000  =  ${rp(h.alatUnits[0] * 1_500_000)}\n` +
          `  A002  Sprayer Elektrik (16L)  ${String(h.alatUnits[1]).padStart(3)}×  Rp   250.000  =  ${rp(h.alatUnits[1] * 250_000)}\n` +
          `  S001  Sabit / Arit            ${String(h.alatUnits[2]).padStart(3)}×  Rp    50.000  =  ${rp(h.alatUnits[2] * 50_000)}\n` +
          `  P001  Cangkul (Pacul)         ${String(h.alatUnits[3]).padStart(3)}×  Rp    75.000  =  ${rp(h.alatUnits[3] * 75_000)}\n\n` +
          `  Acuan: Mesin/Sprayer = 1 unit per 10.000 m²\n` +
          `         Alat Tangan   = 1 unit per  3.000 m²\n\n` +
          `  Total Aset Lainnya = ${rp(h.asetLain)}`,
      }] : []),
      // 28.c hanya tampil kalau bukan Walikan
      ...(h.musim !== "Walikan" ? [{
        label: "28.c   Total Aset",
        value: rp(h.asetTanah + h.asetLain),
        explain:
          `Nilai Tanah + Aset Lainnya:\n` +
          `${rp(h.asetTanah)} + ${rp(h.asetLain)} = ${rp(h.asetTanah + h.asetLain)}.`,
      }] : []),
      {
        label: "28.d   Luas Lahan",
        value: Math.round(h.luasM2_f).toLocaleString("id-ID") + " m²",
        explain:
          `${h.bahu.toFixed(4)} Bahu × 0,666 ha/Bahu = ${ha.toFixed(6)} ha\n` +
          `× 10.000 m²/ha = ${Math.round(h.luasM2_f).toLocaleString()} m².`,
      },
    ];
  }
  const rows = buildRows();

  return (
    <View style={ui.screen}>
      <TopNav />

      <View style={ui.body}>
        {/* ── Sidebar (tablet+: visible) ── */}
        {showSidebar && <SideNav />}

        {/* ── Main ── */}
        <ScrollView
          style={ui.main}
          contentContainerStyle={[
            ui.mainContent,
            {
              padding:       isMobile ? 12 : 20,
              paddingBottom: isMobile ? 90 : 48,
            },
          ]}
        >
          {/* Dot pattern overlay */}
          <View style={ui.dotPattern} pointerEvents="none" />

          {/* ── Halaman non-estimasi: tampilkan "Belum Tersedia" ── */}
          {activePage === "home" && (
            <PageComingSoon title="Beranda" icon="home" />
          )}
          {activePage === "data" && (
            <PageComingSoon title="Basis Data" icon="database" />
          )}
          {activePage === "settings" && (
            <PageComingSoon title="Pengaturan" icon="settings" />
          )}

          {/* ── Halaman Estimasi (konten utama) ── */}
          {activePage === "estimasi" && (<>

          {/* Branding header */}
          <View style={[
            ui.pageHeader,
            isMobile && { flexDirection: "column", alignItems: "flex-start" },
          ]}>
            <View style={{ flex: 1 }}>
              <Text style={[ui.pageTitle, isMobile && { fontSize: 20 }]}>Parameter Estimasi</Text>
              <Text style={ui.pageSubtitle}>
                Konfigurasikan data dasar untuk kalkulasi statistik Sensus Ekonomi 2026.
              </Text>
            </View>
            <Badge text="SE2026 Smart Estimator v1" />
          </View>

          {/* Stepper */}
          <Stepper step={step} />

          {/* ── SECTION 1: KOMODITAS ── */}
          <SectionCard icon="inventory_2" title="Section 1: Data Komoditas">
            <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>

              {/* Pilih Kategori dulu */}
              <SelectField
                label="Kategori Usaha"
                value={kategori}
                width={isTablet ? "48%" : "100%"}
                onPress={() => openPicker("Kategori Usaha", daftarKategori, kategori, (v) => {
                  setKategori(v);
                  // Reset komoditas ke pilihan pertama kategori baru
                  const first = kategoriMap[v]?.[0];
                  if (first) setKom(first);
                })}
              />

              {/* Komoditas — hanya muncul kalau bukan Ternak */}
              {kategori !== "Ternak" && (
                <SelectField
                  label="Komoditas"
                  value={kom}
                  width={isTablet ? "48%" : "100%"}
                  onPress={() => openPicker(
                    "Komoditas",
                    kategoriMap[kategori] ?? [],
                    kom,
                    setKom
                  )}
                />
              )}

              {/* Placeholder Ternak — belum tersedia */}
              {kategori === "Ternak" && (
                <View style={ui.warningBox}>
                  <Icon name="info" size={15} color={T.secondary} />
                  <Text style={ui.warningText}>
                    Data estimasi komoditas Ternak belum tersedia. Akan hadir di versi berikutnya.
                  </Text>
                </View>
              )}
              {/* Mode Input, Luas, Panen — disembunyikan untuk Tembakau */}
              {kom !== "Tembakau" && (<>
              <SelectField label="Mode Input" width={isTablet ? "48%" : "100%"}
                value={mode === "luas" ? "Berdasarkan Luas Lahan" : "Berdasarkan Hasil Panen"}
                onPress={() => openPicker("Mode Input",
                  ["Berdasarkan Luas Lahan", "Berdasarkan Hasil Panen"],
                  mode === "luas" ? "Berdasarkan Luas Lahan" : "Berdasarkan Hasil Panen",
                  (v) => setMode(v === "Berdasarkan Luas Lahan" ? "luas" : "panen")
                )}
              />
              {mode === "luas" ? (
                <LuasField luas={luas} setLuas={setLuas} satLuas={satLuas} width={isTablet ? "48%" : "100%"}
                  onSatPress={() => openPicker("Satuan Luas", ["BAHU", "HEKTAR", "M2"], satLuas, setSatLuas)} />
              ) : (
                <>
                  <InputField label="Hasil Panen" value={panen} onChangeText={setPanen}
                    placeholder="contoh: 100" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                  <SelectField label="Satuan Panen" value={satPanen} width={isTablet ? "48%" : "100%"}
                    onPress={() => openPicker("Satuan Panen", ["KUINTAL", "KG", "TON"], satPanen, setSatPanen)} />
                </>
              )}
              </>)}
              {/* Jumlah Penandur & Musim Tanam — hanya untuk Padi */}
              {kom === "Padi" && (
                <InputField
                  label="Jumlah Penandur (opsional)"
                  value={jumlahTandur}
                  onChangeText={setJumlahTandur}
                  placeholder="Kosongkan untuk estimasi otomatis"
                  keyboardType="numeric"
                  width="100%"
                />
              )}
              {kom === "Padi" && (
                <SelectField
                  label="Musim Tanam"
                  value={musimTanam}
                  width="100%"
                  onPress={() => openPicker(
                    "Musim Tanam",
                    ["Rendengan", "Walikan"],
                    musimTanam,
                    setMusimTanam
                  )}
                />
              )}

              {/* ── Field khusus Tembakau ── */}
              {kom === "Tembakau" && (<>
                <SelectField
                  label="Jenis Tembakau"
                  value={jenisTembakau}
                  width="100%"
                  onPress={() => openPicker(
                    "Jenis Tembakau",
                    ["Tembakau Basah", "Tembakau Kering"],
                    jenisTembakau,
                    setJenisTembakau
                  )}
                />
                <InputField
                  label="Jumlah Pohon"
                  value={jumlahPohon}
                  onChangeText={setJumlahPohon}
                  placeholder="contoh: 1000"
                  keyboardType="numeric"
                  width={isTablet ? "48%" : "100%"}
                />
                <InputField
                  label="Luas Lahan (m²) — untuk PBB"
                  value={luasTembakau}
                  onChangeText={setLuasTembakau}
                  placeholder="contoh: 15"
                  keyboardType="numeric"
                  width={isTablet ? "48%" : "100%"}
                />
              </>)}
            </View>
          </SectionCard>

          {/* ── SECTION 2: LAHAN & LOKASI ── */}
          <SectionCard icon="location_on" title="Section 2: Detail Lahan & Lokasi">
            <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
              <SelectField label="Status Lahan" value={status} width={isTablet ? "48%" : "100%"}
                onPress={() => openPicker("Status Lahan", ["Milik Sendiri", "Sewa", "Bagi Hasil"], status, setStatus)} />
              <SelectField label="Kecamatan" value={kec} width={isTablet ? "48%" : "100%"}
                onPress={() => openPicker("Kecamatan", ["Balen","Kanor","Sumberrejo","Baureno","Kapas","Dander"], kec, setKec)} />
              <InputField label="Tahun Mulai Usaha" value={tahun} onChangeText={setTahun}
                placeholder="YYYY" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
            </View>
          </SectionCard>

          {/* ── TOMBOL HITUNG ── */}
          <Pressable
            style={({ pressed }) => [ui.submitBtn, pressed && { opacity: 0.85 }]}
            onPress={hitung}
            disabled={loading}
          >
            <Icon name="zap" size={18} color={T.onPrimary} />
            <Text style={ui.submitBtnText}>
              {loading ? "Menghitung…" : "Hitung Estimasi SE2026"}
            </Text>
            {!loading && <Icon name="arrow-right" size={16} color={T.onPrimary} />}
          </Pressable>

          {/* ── INFO CARD ── */}
          <InfoCard />

          {/* ── HASIL ── */}
          {hasil && (
            <View style={ui.resultCard}>
              {/* Header */}
              <View style={ui.resultCardHeader}>
                <View>
                  <Text style={ui.resultCardTitle}>Hasil Estimasi</Text>
                  <Text style={ui.resultCardSub}>Komoditas: {kom} · {kec}</Text>
                </View>
                <Pressable style={ui.detailToggleBtn} onPress={() => setShowDetail(!showDetail)}>
                  <Icon
                    name={showDetail ? "x" : "bar-chart-2"}
                    size={13}
                    color={T.secondary}
                  />
                  <Text style={ui.detailToggleTxt}>{showDetail ? "Tutup" : "Detail TK"}</Text>
                </Pressable>
              </View>

              {/* Detail TK collapsible */}
              {showDetail && (
                <View style={ui.detailBox}>
                  <Text style={ui.detailBoxTitle}>Rincian Tenaga Kerja & Biaya</Text>
                  <View style={ui.detailHeaderRow}>
                    <Text style={[ui.detailCell, { flex: 5, fontWeight: "700", color: T.onSurface }]}>Pekerjaan</Text>
                    <Text style={[ui.detailCell, { flex: 2, textAlign: "center", fontWeight: "700", color: T.onSurface }]}>Jumlah</Text>
                    <Text style={[ui.detailCell, { flex: 3, textAlign: "right", fontWeight: "700", color: T.onSurface }]}>Estimasi</Text>
                  </View>

                  {/* Tembakau Basah */}
                  {hasil.isTembakau && hasil.jenis === "Tembakau Basah" && (<>
                    <DetailRow label="Kowak / Bajak (Rp 70rb)"   qty={`${hasil.tkKowak} org × 2 hr`}  amount={rp(hasil.tkKowak * 2 * 70000)} />
                    <DetailRow label="Macul / Bedengan (Rp 70rb)" qty={`${hasil.tkMacul} org × 3 hr`}  amount={rp(hasil.tkMacul * 3 * 70000)} />
                    <DetailRow label="Panen / Petik (Rp 70rb)"    qty={`${hasil.tkPanen} org × 1 hr`}  amount={rp(hasil.tkPanen * 1 * 70000)} />
                  </>)}

                  {/* Tembakau Kering */}
                  {hasil.isTembakau && hasil.jenis === "Tembakau Kering" && (<>
                    <DetailRow label="Ngrajang (Rp 200rb/kw)" qty={`${Math.round(hasil.kgBasah).toLocaleString()} kg`} amount={rp(TEMBAKAU.keringUpahRajang * hasil.kgBasah)} />
                    <DetailRow label="Mepe / Jemur (Rp 50rb/kw)" qty={`${Math.round(hasil.kgBasah).toLocaleString()} kg`} amount={rp(TEMBAKAU.keringUpahMepe * hasil.kgBasah)} />
                  </>)}

                  {/* Komoditas biasa (Padi dll) */}
                  {!hasil.isTembakau && (<>
                    <DetailRow label="Tamping Galeng (Rp 65rb)" qty={`${hasil.tamping} org`} amount={rp(hasil.tamping * 65000)} />
                    <DetailRow label="Tandur (Rp 50rb)"         qty={`${hasil.tandur} org`}  amount={rp(hasil.tandur * 50000)} />
                    <DetailRow label="Matun (Rp 50rb)"          qty={`${hasil.matun} org`}   amount={rp(hasil.matun * 50000)} />
                    <DetailRow label="Pekerja Daut (Rp 60rb)"   qty={`${hasil.daut} org`}    amount={rp(hasil.daut * 60000)} />
                    <DetailRow label="Traktor (Rp 150rb/8 kw)"  qty="—"                      amount={rp(hasil.traktorCost)} />
                  </>)}
                </View>
              )}

              {/* Table column header */}
              <View style={ui.tableColHeader}>
                <Text style={[ui.tableColText, { width: 30 }]}>Info</Text>
                <Text style={[ui.tableColText, { flex: 4 }]}>Kode / Keterangan</Text>
                <Text style={[ui.tableColText, { flex: 4, textAlign: "right" }]}>Nilai</Text>
                <Text style={[ui.tableColText, { width: 44, textAlign: "center" }]}>Salin</Text>
              </View>

              {/* Rows */}
              {(() => {
                let localIdx = 0;
                return rows.map((item, idx) => {
                  if ("section" in item) {
                    return <ResultSection key={idx} title={item.section as string} />;
                  }
                  const even = localIdx % 2 === 0;
                  localIdx++;
                  return (
                    <ResultRow
                      key={idx}
                      label={item.label}
                      value={item.value}
                      isEven={even}
                      explain={(item as any).explain}
                    />
                  );
                });
              })()}
            </View>
          )}

          {/* Footer */}
          <View style={ui.footer}>
            <Text style={ui.footerText}>© 2026 BPS Sumberharjo – SE2026</Text>
            <Text style={ui.footerText}>Versi v1.0.1 · Panduan Pengguna</Text>
          </View>
          </>)}
        </ScrollView>
      </View>

      {/* ── BOTTOM NAV (mobile only) ── */}
      {isMobile && <BottomNav active={activePage} onPress={setActivePage} />}

      {/* ── PICKER MODAL ── */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable style={ui.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={ui.modalSheet}>
            <View style={ui.modalHandle} />
            <Text style={ui.modalTitle}>Pilih {pickerType}</Text>
            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [ui.modalItem, pressed && { backgroundColor: T.primaryFixed }]}
                  onPress={() => { pickerCallback(item); setPickerVisible(false); }}
                >
                  <Text style={ui.modalItemText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  // ── Top Nav ──
  topNav: {
    backgroundColor: T.surfaceContainerLow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: T.outlineVariant,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  topNavBrand:   { fontSize: 16, fontWeight: "700", color: T.primary, letterSpacing: 0.2 },
  topNavActions: { flexDirection: "row", gap: 4 },
  topNavBtn:     { padding: 8, borderRadius: 20 },

  // ── Body layout ──
  body: { flex: 1, flexDirection: "row" },

  // ── Side Nav ──
  sideNav: {
    width: 220,
    overflow: "hidden",
    backgroundColor: T.surface,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderColor: T.outlineVariant,
  },
  sideNavBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sideNavLogoBox: {
    width: 38, height: 38,
    backgroundColor: T.primaryFixed,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sideNavBrandTitle: { fontSize: 13, fontWeight: "700", color: T.onSurface },
  sideNavBrandSub:   { fontSize: 9, color: T.onSurfaceVariant, letterSpacing: 0.8, marginTop: 1 },
  sideNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  sideNavItemActive: { backgroundColor: T.primaryFixed },
  sideNavLabel:  { fontSize: 13, color: T.onSurfaceVariant },
  sideNavBottom: { marginTop: 40, paddingTop: 12, borderTopWidth: 1, borderColor: T.outlineVariant },

  // ── Main content ──
  main:        { flex: 1 },
  mainContent: {
    padding: 16,
    paddingBottom: 80,
    maxWidth: 720,
    alignSelf: "center" as const,
    width: "100%",
  },
  dotPattern:  { ...StyleSheet.absoluteFill, opacity: 0.04, backgroundColor: "transparent" },

  // ── Page header ──
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
    flexWrap: "wrap",
  },
  pageTitle:    { fontSize: 22, fontWeight: "700", color: T.primary, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 12, color: T.onSurfaceVariant, marginTop: 3 },

  // ── Badge ──
  badge: {
    backgroundColor: T.surfaceContainerHighest,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: T.onSurface },

  // ── Stepper ──
  stepperWrap: {
    marginBottom: 20,
    marginHorizontal: 4,
  },
  stepperScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: T.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    // minWidth ditangani inline di Stepper via useBreakpoints
    minWidth: "100%",
  },
  // Tiap step: flex:1 agar sama lebar kiri & kanan
  stepItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  // Konten dalam step (lingkaran + label)
  stepContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepper: { flexDirection: "row", alignItems: "center" }, // legacy — tidak terpakai
  stepCircle: {
    width: 32, height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: T.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: T.primary,   borderColor: T.primary },
  stepCircleDone:   { backgroundColor: T.secondary, borderColor: T.secondary },
  stepNum:   { fontSize: 13, fontWeight: "700", color: T.onSurfaceVariant },
  stepLabel: { fontSize: 13, color: T.onSurfaceVariant, flexShrink: 1 },
  stepLine:  { flex: 1, height: 2, backgroundColor: T.outlineVariant, marginHorizontal: 8, borderRadius: 1 },

  // ── Section card ──
  sectionCard: {
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: T.surfaceContainer,
  },
  sectionCardTitle: { fontSize: 16, fontWeight: "600", color: T.onSurface },

  // ── Form ── (responsif ditangani inline di JSX)
  formGrid: {
    gap: 14,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: T.onSurface, letterSpacing: 0.1 },
  input: {
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: T.onSurface,
  },
  select: {
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 15, color: T.onSurface, flex: 1 },
  luasRow:    { flexDirection: "row" },
  luasSat: {
    backgroundColor: T.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: T.outlineVariant,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 80,
  },
  luasSatText: { fontSize: 13, fontWeight: "700", color: T.onSurfaceVariant },

  // ── Submit button ──
  submitBtn: {
    backgroundColor: T.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 4,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: { color: T.onPrimary, fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  // ── Info card ──
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(0, 106, 99, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(0, 106, 99, 0.2)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  infoIconBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: T.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: 13, fontWeight: "700", color: T.secondary, marginBottom: 4 },
  infoBody:  { fontSize: 12, color: T.onSurfaceVariant, lineHeight: 18 },

  // ── Result card ──
  resultCard: {
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: T.outlineVariant,
  },
  resultCardTitle: { fontSize: 15, fontWeight: "700", color: T.onSurface },
  resultCardSub:   { fontSize: 11, color: T.onSurfaceVariant, marginTop: 2 },
  detailToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailToggleTxt: { fontSize: 12, fontWeight: "600", color: T.secondary },

  // ── Detail box ──
  detailBox: {
    backgroundColor: T.surfaceContainerLow,
    padding: 14,
    margin: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.outlineVariant,
  },
  detailBoxTitle: { fontSize: 12, fontWeight: "700", color: T.primary, marginBottom: 8 },
  detailHeaderRow: { flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderColor: T.outlineVariant, marginBottom: 4 },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "rgba(194,198,216,0.4)",
  },
  detailCell: { fontSize: 12, color: T.onSurface },

  // ── Table column header ──
  tableColHeader: {
    flexDirection: "row",
    backgroundColor: "#002f7a",
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  tableColText: { fontSize: 11, fontWeight: "700", color: T.white, letterSpacing: 0.4 },

  // ── Result section header ──
  resultSection: {
    backgroundColor: T.primaryContainer,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  resultSectionText: { fontSize: 12, fontWeight: "700", color: T.onPrimary, letterSpacing: 0.3 },

  // ── Result row ──
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(194,198,216,0.35)",
  },
  rowEven: { backgroundColor: "#f0f4ff" },
  rowOdd:  { backgroundColor: T.white },
  rowLabel: { flex: 3, fontSize: 12, color: T.onSurface, paddingRight: 4, lineHeight: 16 },
  rowValue: { flex: 3, fontSize: 12, color: T.primary, fontWeight: "700", textAlign: "right", paddingRight: 6 },
  copyBtn: {
    width: 44, height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.primaryFixed,
    borderRadius: 8,
  },
  copyBtnDone: { backgroundColor: T.secondaryContainer },

  // ── Tombol info (ℹ) per baris ──
  infoToggleBtn: {
    width: 28, height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  // ── Panel penjelasan per baris ──
  explainPanel: {
    borderBottomWidth: 1,
    borderColor: "rgba(194,198,216,0.35)",
  },
  explainInner: {
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: T.primaryFixed,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: T.primary,
  },
  explainTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: T.primary,
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  explainText: {
    fontSize: 12,
    color: T.onSurface,
    lineHeight: 19,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // ── Footer ──
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: T.outlineVariant,
    alignItems: "center",
    gap: 4,
    backgroundColor: T.surfaceContainerHighest,
    borderRadius: 10,
    padding: 12,
  },
  footerText: { fontSize: 11, color: T.onSurfaceVariant },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: T.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    maxHeight: "65%",
    elevation: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: T.outlineVariant,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalTitle:    { fontSize: 15, fontWeight: "700", color: T.primary, marginBottom: 12, textAlign: "center" },
  modalItem:     { paddingVertical: 14, borderBottomWidth: 1, borderColor: T.surfaceContainer, borderRadius: 4 },
  modalItemText: { fontSize: 15, color: T.onSurface, textAlign: "center" },

  // ── Halaman Coming Soon ──────────────────────────────────────────────────────
  comingSoonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  comingSoonCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  comingSoonIconBox: {
    width: 80, height: 80,
    borderRadius: 20,
    backgroundColor: T.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: T.onSurface,
    marginBottom: 6,
    textAlign: "center",
  },
  comingSoonSub: {
    fontSize: 14,
    fontWeight: "600",
    color: T.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  comingSoonDesc: {
    fontSize: 13,
    color: T.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: T.secondaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: T.secondary,
  },

  // Tombol lihat pengembang
  devBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: T.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  devBtnPressed: {
    opacity: 0.82,
  },
  devBtnText: {
    color: T.onPrimary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // ── Warning / info box ────────────────────────────────────────────────────
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: T.secondaryContainer,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    borderRadius: 10,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: T.onSecondaryContainer,
    lineHeight: 19,
  },

  // ── Bottom Navigation Bar ─────────────────────────────────────────────────
  bottomNav: {
    flexDirection: "row",
    backgroundColor: T.white,
    borderTopWidth: 1,
    borderColor: T.outlineVariant,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 4,
    // shadow ke atas
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  bottomNavIconWrap: {
    width: 44, height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  bottomNavIconActive: {
    backgroundColor: T.primaryFixed,
  },
  bottomNavLabel: {
    fontSize: 10,
    color: T.onSurfaceVariant,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  bottomNavLabelActive: {
    color: T.primary,
    fontWeight: "700",
  },
});
