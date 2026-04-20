import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, View } from "react-native";

export default function LoadingSpinner() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <LinearGradient
        colors={colors.gradients.surface}
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          justifyContent: "center",
          alignItems: "center",
          boxShadow: `0 2px 4px ${colors.shadow}`,
          elevation: 3,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </LinearGradient>
    </View>
  );
}
