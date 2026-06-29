// ─── shadow() helper — cross-platform shadow ──────────────────────────────────
// React Native web deprecated shadow* props, gunakan boxShadow.
// Native masih pakai shadow* + elevation.
import { Platform } from "react-native";

export function shadow(
  elevation = 2,
  color = "#000",
  opacity = 0.08,
  radius = 6,
  offsetY = 2
): object {
  if (Platform.OS === "web") {
    return {
      boxShadow: `0px ${offsetY}px ${radius}px rgba(0,0,0,${opacity})`,
    };
  }
  return {
    elevation,
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
  };
}
