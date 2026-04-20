import useTheme from "@/hooks/useTheme";
import { useSignUp } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Verify() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const { signUp, setActive } = useSignUp();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert(t("common.error"), "Please enter the verification code");
      return;
    }
    
    setIsLoading(true);
    try {
      if (!signUp) {
        Alert.alert(t("common.error"), "Sign up not available");
        return;
      }
      const signUpInstance = signUp;
      const result = await signUpInstance.attemptEmailAddressVerification({
        code,
      });
      
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      }
    } catch (err: any) {
      Alert.alert(t("common.error"), err.errors?.[0]?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (!signUp) {
        Alert.alert("Error", "Sign up not available");
        return;
      }
      await signUp.prepareVerification({ strategy: "email_code" });
      Alert.alert("Success", "A new verification code was sent to your email");
    } catch (err) {
      Alert.alert("Error", "Failed to resend code");
    }
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Verify Email
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Enter the verification code sent to {email}
            </Text>
          </View>

          <View style={styles.form}>
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border }
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter code"
                placeholderTextColor={colors.textMuted}
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                isLoading && styles.buttonDisabled
              ]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={handleResend}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                Resend Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  form: {
    width: "100%",
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  input: {
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 8,
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
