import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

type LoginFieldProps = {
  value: string;
  error?: string;
  placeholder: string;
  colors: ReturnType<typeof useTheme>["colors"];
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
};

type LoginErrorKey = "fullName" | "email" | "password" | "confirmPassword";
type AccountRole = "PLAYER" | "COACH" | "SCOUT";

const isValidEmail = (email: string): boolean => {
  const trimmedEmail = email.trim();
  if (trimmedEmail.length > 254 || trimmedEmail.includes(" ")) return false;

  const atIndex = trimmedEmail.indexOf("@");
  const lastAtIndex = trimmedEmail.lastIndexOf("@");
  if (atIndex <= 0 || atIndex !== lastAtIndex) return false;

  const domain = trimmedEmail.slice(atIndex + 1);
  const localPart = trimmedEmail.slice(0, atIndex);
  const dotIndex = domain.lastIndexOf(".");

  return (
    localPart.length > 0 &&
    domain.length > 3 &&
    dotIndex > 0 &&
    dotIndex < domain.length - 1 &&
    !domain.includes(" ")
  );
};

function LoginField({
  value,
  error,
  placeholder,
  colors,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
}: Readonly<LoginFieldProps>) {
  return (
    <>
      <View
        style={[
          styles.inputContainer,
          { borderColor: error ? colors.danger : colors.border },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
        />
      </View>
      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </>
  );
}

export default function Login() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { user, login, register, logout, authError, clearAuthError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AccountRole>("PLAYER");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    setShowSignUp(mode === "register");
    setErrors({});
    clearAuthError();
  }, [clearAuthError, mode]);

  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const updateLoginField = (field: LoginErrorKey, value: string) => {
    const setters = {
      fullName: setFullName,
      email: setEmail,
      password: setPassword,
      confirmPassword: setConfirmPassword,
    };
    setters[field](value);
    clearFieldError(field);
  };

  const validate = () => {
    const nextErrors: typeof errors = {};

    if (showSignUp && fullName.trim().length < 2) {
      nextErrors.fullName = t("validation.nameMinLength");
    }

    if (!email.trim() || !isValidEmail(email)) {
      nextErrors.email = t("validation.invalidEmail");
    }

    if (!password || password.length < 8) {
      nextErrors.password = t("validation.passwordMinLength");
    }

    if (showSignUp && password !== confirmPassword) {
      nextErrors.confirmPassword = t("validation.passwordsNotMatch");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      clearAuthError();
      if (user) {
        await logout();
      }
      const result = showSignUp
        ? await register(fullName.trim(), email.trim(), password, confirmPassword, selectedRole)
        : await login(email.trim(), password);

      if (!result.ok) {
        Alert.alert(t("common.error"), result.error || "Ocorreu um erro inesperado.");
        return;
      }

      router.replace("/");
    } catch {
      Alert.alert(t("common.error"), "Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginFields: (Omit<LoginFieldProps, "colors" | "onChangeText"> & {
    field: LoginErrorKey;
    visible: boolean;
  })[] = [
    {
      field: "fullName",
      visible: showSignUp,
      error: errors.fullName,
      placeholder: t("auth.fullName"),
      value: fullName,
    },
    {
      field: "email",
      visible: true,
      error: errors.email,
      keyboardType: "email-address",
      placeholder: t("auth.email"),
      value: email,
    },
    {
      field: "password",
      visible: true,
      error: errors.password,
      placeholder: t("auth.password"),
      secureTextEntry: true,
      value: password,
    },
    {
      field: "confirmPassword",
      visible: showSignUp,
      error: errors.confirmPassword,
      placeholder: t("auth.confirmPassword"),
      secureTextEntry: true,
      value: confirmPassword,
    },
  ];

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

          <View style={styles.form}>
            {user && (
              <View
                style={[
                  styles.sessionContainer,
                  { borderColor: colors.border, backgroundColor: `${colors.surface}CC` },
                ]}
              >
                <Text style={[styles.sessionTitle, { color: colors.text }]}>
                  Sessao ativa
                </Text>
                <Text style={[styles.sessionText, { color: colors.textMuted }]}>
                  {user.email}
                </Text>
                <View style={styles.sessionActions}>
                  <TouchableOpacity
                    style={[styles.sessionButton, { borderColor: colors.border }]}
                    onPress={() => router.replace("/")}
                  >
                    <Text style={[styles.sessionButtonText, { color: colors.text }]}>
                      Continuar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sessionButton, { borderColor: colors.danger }]}
                    onPress={async () => {
                      await logout();
                      clearAuthError();
                    }}
                  >
                    <Text style={[styles.sessionButtonText, { color: colors.danger }]}>
                      Terminar sessao
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {authError && (
              <View
                style={[
                  styles.authErrorContainer,
                  { borderColor: colors.danger, backgroundColor: `${colors.danger}14` },
                ]}
              >
                <Text style={[styles.authErrorText, { color: colors.danger }]}>
                  {authError}
                </Text>
              </View>
            )}
            {showSignUp && (
              <>
                {loginFields
                  .filter((field) => field.visible && field.field === "fullName")
                  .map(({ field, visible, ...props }) => (
                    <LoginField
                      key={field}
                      {...props}
                      colors={colors}
                      onChangeText={(text) => updateLoginField(field, text)}
                    />
                  ))}

                <View style={styles.roleRow}>
                  {[
                    { label: t("auth.accountTypes.player"), value: "PLAYER" as const },
                    { label: t("auth.accountTypes.coach"), value: "COACH" as const },
                    { label: t("auth.accountTypes.scout"), value: "SCOUT" as const },
                  ].map((role) => (
                    <TouchableOpacity
                      key={role.value}
                      style={[
                        styles.roleButton,
                        {
                          borderColor:
                            selectedRole === role.value ? colors.primary : colors.border,
                          backgroundColor:
                            selectedRole === role.value
                              ? colors.primary
                              : "rgba(255,255,255,0.05)",
                        },
                      ]}
                      onPress={() => setSelectedRole(role.value)}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          {
                            color:
                              selectedRole === role.value
                                ? colors.surface
                                : colors.text,
                          },
                        ]}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {loginFields
              .filter((field) => field.visible && field.field !== "fullName")
              .map(({ field, visible, ...props }) => (
                <LoginField
                  key={field}
                  {...props}
                  colors={colors}
                  onChangeText={(text) => updateLoginField(field, text)}
                />
              ))}

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
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
                clearAuthError();
              }}
            >
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {showSignUp ? t("auth.register.hasAccount") : t("auth.login.noAccount")}
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
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  authErrorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  authErrorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sessionContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  sessionText: {
    fontSize: 14,
    marginBottom: 12,
  },
  sessionActions: {
    flexDirection: "row",
    gap: 10,
  },
  sessionButton: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  sessionButtonText: {
    fontSize: 14,
    fontWeight: "700",
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
