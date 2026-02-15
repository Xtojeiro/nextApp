import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
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

type AccountType = "PLAYER" | "COACH" | "SCOUT";

export default function Register() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const registerUserMutation = useMutation(api.users.registerUser);

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNextStep1 = () => {
    if (!fullName.trim() || !age.trim()) {
      Alert.alert("Error", "Please fill name and age");
      return;
    }
    setStep(2);
  };

  const handleSelectAccountType = (type: AccountType) => {
    setAccountType(type);
    setStep(3);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !accountType) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const roleMap: Record<AccountType, "athlete" | "coach" | "scout"> = {
        PLAYER: "athlete",
        COACH: "coach",
        SCOUT: "scout",
      };
      const userId = await registerUserMutation({
        name: fullName,
        age: parseInt(age),
        email,
        password,
        role: roleMap[accountType!],
      });

      // Save user data to local storage
      const user = {
        id: userId,
        email,
        fullName,
        role: accountType,
      };

      await AsyncStorage.setItem("user", JSON.stringify(user));

      router.replace("/");
    } catch (error) {
      Alert.alert("Error", (error as Error).message || "Registration failed");
    }
  };

  const renderStep1 = () => (
    <View style={styles.form}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("auth.register.step1")}
      </Text>

      <View style={[styles.inputContainer, { borderColor: colors.border }]}>
        <Ionicons name="person" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={t("auth.fullName")}
          placeholderTextColor={colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      <View style={[styles.inputContainer, { borderColor: colors.border }]}>
        <Ionicons name="calendar" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={t("auth.age")}
          placeholderTextColor={colors.textMuted}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleNextStep1}
      >
        <Text style={styles.buttonText}>{t("auth.next")}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.form}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("auth.register.step2")}
      </Text>

      <TouchableOpacity
        style={[styles.accountTypeButton, { borderColor: colors.border }]}
        onPress={() => handleSelectAccountType("PLAYER")}
      >
        <Ionicons name="football" size={24} color={colors.primary} />
        <Text style={[styles.accountTypeText, { color: colors.text }]}>
          {t("auth.accountTypes.player")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.accountTypeButton, { borderColor: colors.border }]}
        onPress={() => handleSelectAccountType("COACH")}
      >
        <Ionicons name="people" size={24} color={colors.primary} />
        <Text style={[styles.accountTypeText, { color: colors.text }]}>
          {t("auth.accountTypes.coach")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.accountTypeButton, { borderColor: colors.border }]}
        onPress={() => handleSelectAccountType("SCOUT")}
      >
        <Ionicons name="eye" size={24} color={colors.primary} />
        <Text style={[styles.accountTypeText, { color: colors.text }]}>
          {t("auth.accountTypes.scout")}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.form}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        {t("auth.register.step3")}
      </Text>

      <View style={[styles.inputContainer, { borderColor: colors.border }]}>
        <Ionicons name="mail" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={t("auth.email")}
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.inputContainer, { borderColor: colors.border }]}>
        <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={t("auth.password")}
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <View style={[styles.inputContainer, { borderColor: colors.border }]}>
        <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={t("auth.confirmPassword")}
          placeholderTextColor={colors.textMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>{t("auth.register.button")}</Text>
      </TouchableOpacity>
    </View>
  );

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
              {t("auth.register.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {t("auth.register.subtitle")}
            </Text>
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor:
                        s <= step ? colors.primary : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {step > 1 && (
            <TouchableOpacity
              style={[styles.backButton, { borderColor: colors.border }]}
              onPress={() => setStep(step - 1)}
            >
              <Text style={[styles.backButtonText, { color: colors.text }]}>
                {t("auth.back")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.link}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {t("auth.register.hasAccount")}
            </Text>
          </TouchableOpacity>
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
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  form: {
    width: "100%",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  accountTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  accountTypeText: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
  },
  link: {
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    fontSize: 16,
  },
});
