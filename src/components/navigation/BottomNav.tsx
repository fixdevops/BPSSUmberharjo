// ─── BottomNav — Tab bar bawah (5 tab) ───────────────────────────────────────
import { Pressable, Text, View } from "react-native";
import { T } from "../../constants/theme";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

type BottomNavItem = { icon: string; label: string; key: string };

const ITEMS: BottomNavItem[] = [
  { icon: "home",        label: "Beranda",   key: "home"      },
  { icon: "bar-chart-2", label: "Estimasi",  key: "estimasi"  },
  { icon: "map-pin",     label: "Peta",      key: "map"       },
  { icon: "database",    label: "Lapangan",  key: "lapangan"  },
  { icon: "settings",    label: "Lainnya",   key: "settings"  },
];

export function BottomNav({
  active,
  onPress,
}: {
  active:   string;
  onPress:  (key: string) => void;
}) {
  return (
    <View style={ui.bottomNav}>
      {ITEMS.map((item) => {
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
