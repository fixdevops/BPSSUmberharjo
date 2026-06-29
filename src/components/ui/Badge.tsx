import { Text, View } from "react-native";
import { T } from "../../constants/theme";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

export function Badge({ text }: { text: string }) {
  return (
    <View style={ui.badge}>
      <Icon name="verified" size={13} color={T.primary} />
      <Text style={ui.badgeText}>{text}</Text>
    </View>
  );
}
