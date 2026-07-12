// ─── Icon SVG inline (Feather design, via react-native-svg) ──────────────────
// Semua path diambil dari Feather Icons (MIT License)
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { T } from "../constants/theme";

const STROKE = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none" as const,
};

export function Icon({ name, size = 20, color = T.onSurfaceVariant }: {
  name: string;
  size?: number;
  color?: string;
}) {
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
    // Alias Material → Feather
    case "expand_more":    return <Svg width={size} height={size} viewBox={v}><Polyline {...s} points="6 9 12 15 18 9"/></Svg>;
    case "expand_less":    return <Svg width={size} height={size} viewBox={v}><Polyline {...s} points="18 15 12 9 6 15"/></Svg>;
    case "analytics":      return <Svg width={size} height={size} viewBox={v}><Line {...s} x1="18" y1="20" x2="18" y2="10"/><Line {...s} x1="12" y1="20" x2="12" y2="4"/><Line {...s} x1="6" y1="20" x2="6" y2="14"/></Svg>;
    case "inventory_2":    return <Svg width={size} height={size} viewBox={v}><Line {...s} x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><Path {...s} d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><Polyline {...s} points="3.27 6.96 12 12.01 20.73 6.96"/><Line {...s} x1="12" y1="22.08" x2="12" y2="12"/></Svg>;
    case "location_on":    return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><Circle {...s} cx="12" cy="10" r="3"/></Svg>;
    case "notifications":  return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path {...s} d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>;
    case "account_circle": return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle {...s} cx="12" cy="7" r="4"/></Svg>;
    case "help":           return <Svg width={size} height={size} viewBox={v}><Circle {...s} cx="12" cy="12" r="10"/><Path {...s} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Line {...s} x1="12" y1="17" x2="12.01" y2="17"/></Svg>;
    case "logout":         return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline {...s} points="16 17 21 12 16 7"/><Line {...s} x1="21" y1="12" x2="9" y2="12"/></Svg>;
    case "verified":       return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><Polyline {...s} points="22 4 12 14.01 9 11.01"/></Svg>;
    case "shield":         return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>;
    case "key":            return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></Svg>;
    case "eye":            return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle {...s} cx="12" cy="12" r="3"/></Svg>;
    case "eye-off":        return <Svg width={size} height={size} viewBox={v}><Path {...s} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><Line {...s} x1="1" y1="1" x2="23" y2="23"/></Svg>;
    case "unlock":         return <Svg width={size} height={size} viewBox={v}><Rect {...s} x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path {...s} d="M7 11V7a5 5 0 0 1 9.9-1"/></Svg>;
    case "alert-circle":   return <Svg width={size} height={size} viewBox={v}><Circle {...s} cx="12" cy="12" r="10"/><Line {...s} x1="12" y1="8" x2="12" y2="12"/><Line {...s} x1="12" y1="16" x2="12.01" y2="16"/></Svg>;
    default:               return <Svg width={size} height={size} viewBox={v}><Circle {...s} cx="12" cy="12" r="10"/></Svg>;
  }
}
