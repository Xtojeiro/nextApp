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
        boxShadow: `0 2px 4px ${colors.shadow}`,
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
