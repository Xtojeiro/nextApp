import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native";

export default function Header() {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={colors.gradients.surface}
      style={{
        paddingVertical: 20,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: colors.text,
          textAlign: "center",
        }}
      >
        My Todos
      </Text>
    </LinearGradient>
  );
}
