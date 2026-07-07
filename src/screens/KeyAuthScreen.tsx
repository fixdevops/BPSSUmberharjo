// ─── KeyAuthScreen — Halaman Verifikasi Kunci Akses ──────────────────────────
// Ditampilkan saat pengguna belum memiliki akses yang valid.
// Kunci diperoleh dari Admin / Bot Discord via /mintakunciweb.

import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Icon } from "../components/Icon";
import { T } from "../constants/theme";
import { verifyKey } from "../lib/keyAuth";

interface Props {
  onAccessGranted: () => void;
}

export function KeyAuthScreen({ onAccessGranted }: Props) {
  const [inputKey, setInputKey]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [showKey, setShowKey]     = useState(false);

  async function handleVerify() {
    if (!inputKey.trim()) {
      setError("Masukkan kunci akses terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyKey(inputKey);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      // Beri jeda singkat agar animasi sukses terlihat, lalu lanjut
      setTimeout(() => onAccessGranted(), 1200);
    } else {
      setError(result.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: T.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo & Header ─────────────────────────────────────────────── */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Image
            source={require("../../assets/images/logoiconenew.jpeg")}
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              marginBottom: 16,
              borderWidth: 2,
              borderColor: T.primaryFixed,
            }}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 22, fontWeight: "800", color: T.onSurface, letterSpacing: -0.3 }}>
            BPS SE2026 Sumberharjo
          </Text>
          <Text style={{ fontSize: 13, color: T.onSurfaceVariant, marginTop: 4, textAlign: "center" }}>
            Aplikasi Kalkulator Sensus Ekonomi 2026
          </Text>
        </View>

        {/* ── Card Verifikasi ───────────────────────────────────────────── */}
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: T.white,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: T.outlineVariant,
            padding: 24,
            // Shadow
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 4,
          }}
        >
          {/* Judul card */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <View
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: T.primaryFixed,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon name="key" size={18} color={T.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "700", color: T.onSurface }}>
                Verifikasi Kunci Akses
              </Text>
              <Text style={{ fontSize: 12, color: T.onSurfaceVariant }}>
                Masukkan kunci yang diberikan Admin
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: T.outlineVariant, marginVertical: 16 }} />

          {/* Input kunci */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontSize: 12, fontWeight: "700", color: T.onSurfaceVariant,
              textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
            }}>
              Kunci Akses
            </Text>

            <View style={{
              flexDirection: "row", alignItems: "center",
              borderWidth: 1.5,
              borderColor: error ? T.error : success ? T.secondary : T.outlineVariant,
              borderRadius: 12,
              backgroundColor: T.surfaceContainerLow,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "web" ? 12 : 4,
            }}>
              <Icon name="key" size={15} color={T.onSurfaceVariant} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 10,
                  fontSize: 14,
                  color: T.onSurface,
                  fontFamily: Platform.OS === "web" ? "monospace" : undefined,
                  letterSpacing: 0.5,
                  outlineStyle: "none",
                } as any}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                placeholderTextColor={T.outline}
                value={inputKey}
                onChangeText={(v) => {
                  setInputKey(v);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                secureTextEntry={!showKey}
                onSubmitEditing={handleVerify}
                editable={!loading && !success}
              />
              <Pressable onPress={() => setShowKey((p) => !p)} style={{ padding: 4 }}>
                <Icon
                  name={showKey ? "eye-off" : "eye"}
                  size={16}
                  color={T.onSurfaceVariant}
                />
              </Pressable>
            </View>

            {/* Pesan error */}
            {error && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                <Icon name="alert-circle" size={13} color={T.error} />
                <Text style={{ fontSize: 12, color: T.error, flex: 1 }}>{error}</Text>
              </View>
            )}

            {/* Pesan sukses */}
            {success && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                <Icon name="check-circle" size={13} color={T.secondary} />
                <Text style={{ fontSize: 12, color: T.secondary, fontWeight: "600" }}>
                  Akses diberikan! Membuka aplikasi…
                </Text>
              </View>
            )}
          </View>

          {/* Tombol verifikasi */}
          <Pressable
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: success ? T.secondary : T.primary,
              paddingVertical: 14,
              borderRadius: 12,
              opacity: pressed || loading || success ? 0.85 : 1,
              marginTop: 4,
            })}
            onPress={handleVerify}
            disabled={loading || success}
          >
            {loading ? (
              <ActivityIndicator size="small" color={T.onPrimary} />
            ) : success ? (
              <Icon name="check" size={18} color={T.onPrimary} />
            ) : (
              <Icon name="unlock" size={18} color={T.onPrimary} />
            )}
            <Text style={{ fontSize: 15, fontWeight: "700", color: T.onPrimary }}>
              {loading ? "Memverifikasi…" : success ? "Berhasil!" : "Verifikasi Kunci"}
            </Text>
          </Pressable>
        </View>

        {/* ── Info cara mendapatkan kunci ───────────────────────────────── */}
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            marginTop: 16,
            backgroundColor: "#f0f4ff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#c7d7f9",
            padding: 16,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="info" size={15} color={T.primary} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: T.primary }}>
              Cara Mendapatkan Kunci Akses
            </Text>
          </View>
          {[
            "1. Hubungi Developer untuk mendapatkan kunci akses.",
            "2. Kunci akan dikirimkan langsung oleh Admin.",
            "3. Salin kunci yang diberikan dan tempelkan ke kolom di atas.",
            "⚠ Setiap kunci hanya bisa digunakan satu kali.",
          ].map((item, i) => (
            <Text key={i} style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 18 }}>
              {item}
            </Text>
          ))}
        </View>

        {/* Footer */}
        <Text style={{ fontSize: 11, color: T.outline, marginTop: 24, textAlign: "center" }}>
          BPS Kabupaten Bojonegoro · SE2026 · v1.1.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
