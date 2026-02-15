import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OlheiroPesquisar() {
  const { accountType } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (!accountType || accountType !== "OLHEIRO") {
      router.replace("/login");
    }
  }, [accountType, router]);

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 24 }}>
            Pesquisar Atletas
          </Text>
          <Text style={{ color: colors.textMuted }}>
            Pesquise atletas por posição, idade e localização.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
