// ─── SideNav — Sidebar navigasi (tablet/desktop) ─────────────────────────────
import { Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { T } from "../../constants/theme";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

export function SideNav() {
  const items = [
    { icon: "home",      label: "Beranda",            active: false },
    { icon: "analytics", label: "Parameter Estimasi", active: true  },
    { icon: "map-pin",   label: "Peta GPS",           active: false },
    { icon: "database",  label: "Data Lapangan",       active: false },
    { icon: "settings",  label: "Pengaturan",          active: false },
  ];

  return (
    <View style={ui.sideNav}>
      {/* Brand */}
      <View style={ui.sideNavBrand}>
        <View style={ui.sideNavLogoBox}>
          <Svg width={22} height={22} viewBox="0 0 32 32">
            <Rect x={2}  y={2}  width={13} height={13} rx={3} fill="#1565F5" />
            <Rect x={17} y={2}  width={13} height={13} rx={3} fill="#00B4D8" />
            <Rect x={2}  y={17} width={13} height={13} rx={3} fill="#F59E0B" />
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
        <View key={item.label} style={[ui.sideNavItem, item.active && ui.sideNavItemActive]}>
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
