import React from "react";
import { Text, View } from "react-native";
import { T } from "../../constants/theme";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

export function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
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
