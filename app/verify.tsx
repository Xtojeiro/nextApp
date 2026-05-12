import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Verify() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <LinearGradient colors={colors.gradients.background} style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Verificacao removida
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          O acesso agora e feito diretamente com email e palavra-passe pelo Convex Auth.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.buttonText}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  content: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
