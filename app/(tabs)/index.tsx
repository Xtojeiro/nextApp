import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function IndexRedirect() {
  const { colors } = useTheme();
  const { accountType } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const nextRoute = accountType === "TREINADOR" ? "/jogos" : "/dashboard";
    router.replace(nextRoute);
  }, [accountType, router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
