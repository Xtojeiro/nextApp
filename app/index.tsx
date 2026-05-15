import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";

export default function Welcome() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <LinearGradient colors={colors.gradients.background} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.hero}>
          <View
            style={[
              styles.logo,
              {
                backgroundColor: colors.primary,
                boxShadow: `0 16px 32px ${colors.shadow}24`,
              },
            ]}
          >
            <Ionicons name="football-outline" size={42} color={colors.surface} />
          </View>

          <Text style={[styles.kicker, { color: colors.primary }]}>
            {t("welcome.kicker")}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("welcome.title")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t("welcome.subtitle")}
          </Text>
        </View>

        <View style={styles.highlights}>
          {[
            { icon: "barbell-outline", label: t("welcome.training") },
            { icon: "stats-chart-outline", label: t("welcome.analytics") },
            { icon: "people-outline", label: t("welcome.teams") },
          ].map((item) => (
            <View
              key={item.icon}
              style={[
                styles.highlight,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  boxShadow: `0 10px 24px ${colors.shadow}10`,
                },
              ]}
            >
              <Ionicons name={item.icon as any} size={22} color={colors.primary} />
              <Text style={[styles.highlightText, { color: colors.text }]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/login?mode=login")}
            accessibilityRole="button"
            accessibilityLabel={t("welcome.login")}
            testID="welcome-login-button"
          >
            <Ionicons name="log-in-outline" size={20} color={colors.surface} />
            <Text style={[styles.primaryButtonText, { color: colors.surface }]}>
              {t("welcome.login")}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              {
                borderColor: colors.border,
                backgroundColor: `${colors.surface}CC`,
              },
            ]}
            onPress={() => router.push("/login?mode=register")}
            accessibilityRole="button"
            accessibilityLabel={t("welcome.register")}
            testID="welcome-register-button"
          >
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {t("welcome.register")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    gap: 32,
    padding: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    gap: 12,
  },
  logo: {
    alignItems: "center",
    justifyContent: "center",
    width: 88,
    height: 88,
    borderRadius: 28,
    marginBottom: 8,
  },
  kicker: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    maxWidth: 360,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 360,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  highlights: {
    gap: 12,
  },
  highlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  highlightText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
});
