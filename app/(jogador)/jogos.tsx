import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JogadorJogos() {
  const { accountType } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (!accountType || accountType !== "JOGADOR") {
      router.replace("/login");
    }
  }, [accountType, router]);

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 24 }}>
            Meus Jogos
          </Text>
          <Text style={{ color: colors.textMuted }}>
            Aqui pode ver o histórico e calendário de jogos.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
