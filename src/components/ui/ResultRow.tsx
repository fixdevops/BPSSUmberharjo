// ─── ResultRow — baris hasil: label + nilai + copy + info toggle ──────────────
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { T } from "../../constants/theme";
import { copyToClipboard } from "../../lib/helpers";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

export function ResultRow({
  label,
  value,
  isEven,
  explain,
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
      <View style={[ui.resultRow, isEven ? ui.rowEven : ui.rowOdd]}>
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
        <Text style={ui.rowLabel} numberOfLines={2}>{label}</Text>
        <Text style={ui.rowValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Pressable
          style={[ui.copyBtn, copied && ui.copyBtnDone]}
          onPress={handleCopy}
          accessibilityLabel={`Salin ${label}`}
        >
          <Icon name={copied ? "check" : "copy"} size={14} color={copied ? T.secondary : T.primary} />
        </Pressable>
      </View>

      {expanded && explain && (
        <View style={[ui.explainPanel, isEven ? ui.rowEven : ui.rowOdd]}>
          <View style={ui.explainInner}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <Icon name="cpu" size={12} color={T.primary} />
              <Text style={ui.explainTitle}>Cara Hitung</Text>
            </View>
            <Text style={[ui.explainText, { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }]}>
              {explain}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── ResultSection — header group dalam tabel hasil ──────────────────────────
export function ResultSection({ title }: { title: string }) {
  return (
    <View style={ui.resultSection}>
      <Text style={ui.resultSectionText}>{title}</Text>
    </View>
  );
}

// ─── DetailRow — baris rincian tenaga kerja ───────────────────────────────────
export function DetailRow({
  label,
  qty,
  amount,
}: {
  label: string;
  qty: string;
  amount: string;
}) {
  return (
    <View style={ui.detailRow}>
      <Text style={[ui.detailCell, { flex: 5 }]}>{label}</Text>
      <Text style={[ui.detailCell, { flex: 2, textAlign: "center", color: T.onSurfaceVariant }]}>{qty}</Text>
      <Text style={[ui.detailCell, { flex: 3, textAlign: "right", color: T.primary, fontWeight: "700" }]}>{amount}</Text>
    </View>
  );
}
