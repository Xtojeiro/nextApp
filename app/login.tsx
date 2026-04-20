import useTheme from "@/hooks/useTheme";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function Login() {
  useWarmUpBrowser();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showSignUp, setShowSignUp] = useState(false);
  
  const { signIn, setActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();
  
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startGoogleOAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to sign in with Google");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await startAppleOAuth();
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to sign in with Apple");
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setErrors({ email: t("validation.invalidEmail") });
      return;
    }
    
    if (!password || password.length < 8) {
      setErrors({ password: t("validation.passwordMinLength") });
      return;
    }
    
    setIsLoading(true);
    try {
      if (!signIn) {
        Alert.alert(t("common.error"), "Sign in not available");
        return;
      }
      const result = await signIn.create({
        identifier: email,
        password,
      });
      
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      Alert.alert(t("common.error"), err.errors?.[0]?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setErrors({ email: t("validation.invalidEmail") });
      return;
    }
    
    if (!password || password.length < 8) {
      setErrors({ password: t("validation.passwordMinLength") });
      return;
    }
    
    setIsLoading(true);
    try {
      if (!signUp) {
        Alert.alert(t("common.error"), "Sign up not available");
        return;
      }
      const signUpResult = signUp;
      await signUpResult.create({
        emailAddress: email,
        password,
      });
      
      await signUpResult.prepareVerification({ strategy: "email_code" });
      
      Alert.alert("Verification", "A verification code was sent to your email", [
        {
          text: "OK",
          onPress: () => {
            router.push({
              pathname: "/verify",
              params: { email },
            });
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(t("common.error"), err.errors?.[0]?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {showSignUp ? t("auth.register.title") : t("auth.login.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {showSignUp ? t("auth.register.subtitle") : t("auth.login.subtitle")}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.socialButton, { borderColor: colors.border }]}
            onPress={handleGoogleSignIn}
          >
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, { borderColor: colors.border }]}
            onPress={handleAppleSignIn}
          >
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              Continue with Apple
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.form}>
            <View
              style={[
                styles.inputContainer,
                { borderColor: errors.email ? colors.danger : colors.border }
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.email")}
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.email}
              </Text>
            )}

            <View
              style={[
                styles.inputContainer,
                { borderColor: errors.password ? colors.danger : colors.border }
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t("auth.password")}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry
              />
            </View>
            {errors.password && (
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {errors.password}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                isLoading && styles.buttonDisabled
              ]}
              onPress={showSignUp ? handleSignUp : handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>
                  {showSignUp ? t("auth.register.button") : t("auth.login.button")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => {
                setShowSignUp(!showSignUp);
                setErrors({});
              }}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {showSignUp ? t("auth.register.hasAccount") : t("auth.register.title")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  link: {
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
  },
});
