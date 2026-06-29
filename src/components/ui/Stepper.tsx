import { ScrollView, Text, View } from "react-native";
import { T } from "../../constants/theme";
import { useBreakpoints } from "../../hooks/useBreakpoints";
import { ui } from "../../styles/ui";

const STEPS = ["Input Data", "Hasil"];

export function Stepper({ step }: { step: number }) {
  const { w, isMobile } = useBreakpoints();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEnabled={isMobile}
      contentContainerStyle={[ui.stepperScroll, { minWidth: w - 40 }]}
      style={ui.stepperWrap}
    >
      {STEPS.map((s, i) => {
        const done   = i < step;
        const active = i === step;
        const isLast = i === STEPS.length - 1;
        return (
          <View key={i} style={ui.stepItem}>
            <View style={ui.stepContent}>
              <View style={[ui.stepCircle, active && ui.stepCircleActive, done && ui.stepCircleDone]}>
                <Text style={[ui.stepNum, (active || done) && { color: T.onPrimary }]}>
                  {done ? "✓" : String(i + 1)}
                </Text>
              </View>
              <Text style={[
                ui.stepLabel,
                active && { color: T.primary, fontWeight: "700" },
                done   && { color: T.secondary },
              ]}>
                {s}
              </Text>
            </View>
            {!isLast && <View style={ui.stepLine} />}
          </View>
        );
      })}
    </ScrollView>
  );
}
