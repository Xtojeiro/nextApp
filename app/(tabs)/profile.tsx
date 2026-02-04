import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { launchImageLibraryAsync } from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || "");
  const [editBio, setEditBio] = useState("");

  const followersCount = user
    ? useQuery(api.follows.getFollowersCount, { userId: user.id as any })
    : null;
  const followingCount = user
    ? useQuery(api.follows.getFollowingCount, { userId: user.id as any })
    : null;

  const updateUser = useMutation(api.users.updateUser);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateAvatar = useMutation(api.users.updateAvatar);
  const toggleProfileVisibility = useMutation(api.users.toggleProfileVisibility);
  const profileVisibility = useQuery(api.users.getProfileVisibility);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const showLanguagePicker = () => {
    Alert.alert(t("settings.language.select"), "", [
      {
        text: t("settings.language.pt"),
        onPress: () => changeLanguage("pt"),
      },
      {
        text: t("settings.language.en"),
        onPress: () => changeLanguage("en"),
      },
      {
        text: t("settings.language.es"),
        onPress: () => changeLanguage("es"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleLogout = () => {
    Alert.alert(t("settings.security.logout"), "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.privacy.deleteAccount"),
      t("settings.privacy.deleteConfirm"),
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => console.log("Delete account"),
        },
      ],
    );
  };

  const handleEditProfile = async () => {
    try {
      await updateUser({
        userId: user!.id as any,
        full_name: editName,
        bio: editBio,
      });
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleChangeImage = async () => {
    const pickerResult = await launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (pickerResult.canceled) return;
    const uri = pickerResult.assets[0].uri;
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uri);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });
      const { storageId } = await uploadResponse.json();
      await updateAvatar({ storageId });
      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={{ flex: 1, paddingTop: 50 }}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.profileSection}>
          {/* Profile Pic and Username Row */}
          <View style={styles.userInfoRow}>
            <Image
              source={{
                uri:
                  user?.profileImageBase64 ||
                  user?.avatar_url ||
                  "https://via.placeholder.com/150",
              }}
              style={styles.avatar}
            />
            <Text style={[styles.usernameText, { color: colors.text }]}>
              {user?.fullName || "User"}
            </Text>
          </View>

          {/* Bio */}
          {user?.bio && (
            <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>
          )}

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditName(user?.fullName || "");
              setEditBio(user?.bio || "");
              setEditModalVisible(true);
            }}
          >
            <Text style={[styles.editButtonText, { color: colors.surface }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {followersCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Followers
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {followingCount || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                Following
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setSettingsModalVisible(true)}
      >
        <Ionicons name="settings" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <LinearGradient
          colors={colors.gradients.background}
          style={{ flex: 1 }}
        >
          <View
            style={[styles.modalHeader, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Settings
            </Text>
            <View />
          </View>
          <ScrollView style={{ flex: 1, padding: 16, paddingTop: 32 }}>
            {/* Appearance Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.appearance.title")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(t("settings.appearance.theme"), "", [
                    {
                      text: t("settings.appearance.light"),
                      onPress: () => {
                        if (isDarkMode) toggleDarkMode();
                      },
                    },
                    {
                      text: t("settings.appearance.dark"),
                      onPress: () => {
                        if (!isDarkMode) toggleDarkMode();
                      },
                    },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
                style={styles.settingRow}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t("settings.appearance.theme")}
                </Text>
                <View style={styles.themeSelector}>
                  <Text style={{ color: colors.text }}>
                    {isDarkMode
                      ? t("settings.appearance.dark")
                      : t("settings.appearance.light")}
                  </Text>
                  <Ionicons
                    name={isDarkMode ? "moon" : "sunny"}
                    size={20}
                    color={colors.primary}
                  />
                  <Ionicons name="chevron-down" size={16} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Language Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.language.title")}
              </Text>
              <TouchableOpacity
                onPress={showLanguagePicker}
                style={styles.settingRow}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t("settings.language.select")}
                </Text>
                <View style={styles.languageSelector}>
                  <Text style={{ color: colors.text }}>
                    {i18n.language === "pt"
                      ? t("settings.language.pt")
                      : i18n.language === "en"
                        ? t("settings.language.en")
                        : t("settings.language.es")}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Account Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.account.title")}
              </Text>
              <View style={styles.accountContainer}>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountText, { color: colors.text }]}>
                    {t("settings.account.username")}: {user?.fullName || "N/A"}
                  </Text>
                  <Text
                    style={[styles.accountText, { color: colors.textMuted }]}
                  >
                    {t("settings.account.email")}: {user?.email || "N/A"}
                  </Text>
                </View>
                <View style={styles.accountActions}>
                  <Image
                    source={{
                      uri:
                        user?.avatar_url || "https://via.placeholder.com/150",
                    }}
                    style={styles.avatarSmall}
                  />
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={handleChangeImage}
                  >
                    <Text style={{ color: colors.primary }}>
                      {t("settings.account.changeImage")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Privacy Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Privacidade
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const newVisibility = await toggleProfileVisibility();
                    Alert.alert(
                      "Sucesso",
                      `Perfil agora está ${newVisibility ? "público" : "privado"}`
                    );
                  } catch (error) {
                    Alert.alert("Erro", "Falha ao alterar visibilidade");
                  }
                }}
                style={styles.settingRow}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Perfil Público
                </Text>
                <View style={styles.toggleSelector}>
                  <Text style={{ color: colors.text }}>
                    {profileVisibility === true ? "Público" : "Privado"}
                  </Text>
                  <Ionicons
                    name={profileVisibility === true ? "globe" : "lock-closed"}
                    size={20}
                    color={profileVisibility === true ? colors.success : colors.warning}
                  />
                  <Ionicons name="chevron-down" size={16} color={colors.text} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.settingDescription, { color: colors.textMuted }]}>
                {profileVisibility === true 
                  ? "Seu perfil é visível para outros utilizadores na pesquisa" 
                  : "Seu perfil só é visível para você"}
              </Text>
            </View>

            {/* Security Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.security.title")}
              </Text>
              <TouchableOpacity style={styles.button}>
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  {t("settings.security.changePassword")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={[styles.buttonText, { color: colors.danger }]}>
                  {t("settings.security.logout")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Section */}
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.privacy.title")}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleDeleteAccount}
              >
                <Text style={[styles.buttonText, { color: colors.danger }]}>
                  {t("settings.privacy.deleteAccount")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <LinearGradient
          colors={colors.gradients.background}
          style={{ flex: 1 }}
        >
          <View
            style={[styles.modalHeader, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={[styles.saveText, { color: colors.primary }]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Enter your bio"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Text style={[styles.label, { color: colors.text }]}>
              Profile Picture
            </Text>
            <TouchableOpacity
              onPress={handleChangeImage}
              style={[styles.editButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.editButtonText, { color: colors.surface }]}>
                Change Picture
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    top: 50,
    right: 16,
    backgroundColor: "#007bff",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileSection: {
    padding: 16,
    alignItems: "center",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 16,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bio: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
  },
  themeSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  toggleSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  accountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accountInfo: {
    flex: 1,
  },
  accountActions: {
    alignItems: "center",
  },
  avatarSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  accountText: {
    fontSize: 16,
    marginBottom: 4,
  },
  changeButton: {
    padding: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
  },
});
