// ─── SideNav — Sidebar navigasi fungsional (tablet/desktop) ──────────────────
import { Pressable, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { T } from "../../constants/theme";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

const NAV_ITEMS = [
  { icon: "home",      label: "Beranda",            page: "home"      },
  { icon: "analytics", label: "Parameter Estimasi", page: "estimasi"  },
  { icon: "map-pin",   label: "Peta GPS",           page: "map"       },
  { icon: "database",  label: "Data Lapangan",      page: "lapangan"  },
  { icon: "settings",  label: "Pengaturan",         page: "settings"  },
  { icon: "shield",    label: "Admin",              page: "admin"     },
];

export function SideNav({
  active   = "estimasi",
  onPress  = (_: string) => {},
}: {
  active?:  string;
  onPress?: (page: string) => void;
}) {
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
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.page;
        return (
          <Pressable
            key={item.page}
            style={({ pressed }) => [
              ui.sideNavItem,
              isActive && ui.sideNavItemActive,
              pressed && { opacity: 0.75 },
            ]}
            onPress={() => onPress(item.page)}
            accessibilityLabel={item.label}
            accessibilityRole="button"
          >
            <Icon
              name={item.icon}
              size={18}
              color={isActive ? T.onPrimaryFixed : T.onSurfaceVariant}
            />
            <Text style={[
              ui.sideNavLabel,
              isActive && { color: T.onPrimaryFixed, fontWeight: "700" },
            ]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}

      {/* Bottom */}
      <View style={ui.sideNavBottom}>
        <Pressable
          style={({ pressed }) => [ui.sideNavItem, pressed && { opacity: 0.75 }]}
          onPress={() => onPress("settings")}
          accessibilityLabel="Pengaturan"
        >
          <Icon name="help" size={18} color={T.onSurfaceVariant} />
          <Text style={ui.sideNavLabel}>Bantuan</Text>
        </Pressable>
      </View>
    </View>
  );
}
