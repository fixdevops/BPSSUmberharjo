// ─── PickerModal — web-safe menggunakan createPortal ─────────────────────────
import React from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { T } from "../constants/theme";

let createPortal: ((children: React.ReactNode, container: Element) => React.ReactNode) | null = null;
if (Platform.OS === "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    createPortal = require("react-dom").createPortal;
  } catch (_) {}
}

export function PickerModal({
  visible,
  onClose,
  title,
  options,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  if (!visible) return null;

  const content = (
    <Pressable
      style={{
        position: "fixed" as any,
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
        zIndex: 9999,
      }}
      onPress={onClose}
    >
      <View
        style={{
          backgroundColor: T.white,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          maxHeight: "70%",
        }}
      >
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.outlineVariant, alignSelf: "center", marginBottom: 14 }} />
        <Text style={{ fontSize: 15, fontWeight: "700", color: T.primary, marginBottom: 12, textAlign: "center" }}>{title}</Text>
        <FlatList
          data={options}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [{
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderColor: T.surfaceContainer,
                borderRadius: 4,
                backgroundColor: pressed ? T.primaryFixed : "transparent",
              }]}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={{ fontSize: 15, color: T.onSurface, textAlign: "center" }}>{item}</Text>
            </Pressable>
          )}
        />
      </View>
    </Pressable>
  );

  if (Platform.OS === "web" && createPortal && typeof document !== "undefined") {
    return createPortal(content, document.body) as React.ReactElement;
  }
  return content as React.ReactElement;
}
