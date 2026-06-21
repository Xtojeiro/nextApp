import { api } from "@/utils/apiClient";
import { getSimpleErrorMessage } from "@/utils/errorMessages";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { Image } from "expo-image";
import { launchImageLibraryAsync } from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { optionalText, requiredText } from "@/utils/formValidation";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ConfirmAction = "logout" | "deleteAccount";
type ThemeColors = ReturnType<typeof useTheme>["colors"];
type Translate = (key: string) => string;

type Achievement = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
};

type ReceivedInvite = {
  _id: string;
  status: "pending" | "accepted" | "rejected";
  coach?: {
    _id: string;
    full_name?: string;
    avatar?: string;
  } | null;
};

type PendingFollowRequest = {
  _id: string;
  created_at: number;
  requester?: {
    _id: string;
    full_name?: string;
    avatar?: string;
    role?: string;
  } | null;
};

type AchievementsSectionProps = Readonly<{
  achievements?: Achievement[];
  colors: ThemeColors;
}>;

type ConfirmModalProps = Readonly<{
  action: ConfirmAction | null;
  colors: ThemeColors;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: Translate;
}>;

type PasswordModalProps = Readonly<{
  visible: boolean;
  colors: ThemeColors;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  loading: boolean;
  onChangeCurrentPassword: (value: string) => void;
  onChangeNewPassword: (value: string) => void;
  onChangeConfirmNewPassword: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  t: Translate;
}>;

function getAccountTypeLabel(
  accountType: string | null | undefined,
  translate: Translate,
) {
  if (accountType === "TREINADOR") return translate("auth.accountTypes.coach");
  if (accountType === "OLHEIRO") return translate("auth.accountTypes.scout");
  return translate("auth.accountTypes.player");
}

function getConfirmActionLabels(action: ConfirmAction | null, translate: Translate) {
  if (action === "deleteAccount") {
    return {
      title: translate("settings.privacy.deleteAccount"),
      message: translate("settings.privacy.deleteConfirm"),
      confirm: translate("settings.privacy.deleteAccount"),
    };
  }

  return {
    title: translate("settings.security.logout"),
    message: translate("settings.security.logout"),
    confirm: translate("settings.security.logout"),
  };
}

function getAchievementKey(achievement: Achievement) {
  return achievement._id || achievement.id || achievement.name || "achievement";
}

function AchievementsSection({ achievements, colors }: AchievementsSectionProps) {
  if (!achievements?.length) return null;

  return (
    <View style={styles.achievementsSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {achievements.map((achievement) => (
          <View
            key={getAchievementKey(achievement)}
            style={[
              styles.achievementCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.achievementIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="trophy" size={24} color="#fff" />
            </View>
            <Text style={[styles.achievementName, { color: colors.text }]}>
              {achievement.name}
            </Text>
            <Text style={[styles.achievementDescription, { color: colors.textMuted }]}>
              {achievement.description}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function PasswordModal({
  visible,
  colors,
  currentPassword,
  newPassword,
  confirmNewPassword,
  loading,
  onChangeCurrentPassword,
  onChangeNewPassword,
  onChangeConfirmNewPassword,
  onClose,
  onSave,
  t,
}: PasswordModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t("settings.security.changePassword")}
          </Text>
          <TouchableOpacity onPress={onSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.saveText, { color: colors.primary }]}>
                {t("common.save")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.label, { color: colors.text }]}>
            {t("auth.password")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={currentPassword}
            onChangeText={onChangeCurrentPassword}
            placeholder={t("auth.password")}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
          <Text style={[styles.label, { color: colors.text }]}>
            {t("settings.security.changePassword")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={newPassword}
            onChangeText={onChangeNewPassword}
            placeholder={t("settings.security.changePassword")}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
          <Text style={[styles.label, { color: colors.text }]}>
            {t("auth.confirmPassword")}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={confirmNewPassword}
            onChangeText={onChangeConfirmNewPassword}
            placeholder={t("auth.confirmPassword")}
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

function ConfirmActionModal({
  action,
  colors,
  loading,
  onCancel,
  onConfirm,
  t,
}: ConfirmModalProps) {
  const labels = getConfirmActionLabels(action, t);

  return (
    <Modal
      visible={action !== null}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.confirmOverlay}>
        <View
          style={[
            styles.confirmCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.confirmTitle, { color: colors.text }]}>
            {labels.title}
          </Text>
          <Text style={[styles.confirmMessage, { color: colors.textMuted }]}>
            {labels.message}
          </Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={[styles.confirmButton, { borderColor: colors.border }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.confirmButtonText, { color: colors.text }]}>
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.danger }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.confirmButtonText, { color: "#fff" }]}>
                  {labels.confirm}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function Profile() {
  const { colors, isDarkMode, setDarkMode } = useTheme();
  const { user, accountType, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const updateUser = useMutation(api.users.updateUser as any);
  const toggleProfileVisibility = useMutation(api.users.toggleProfileVisibility as any);
  const deleteAccount = useMutation(api.users.deleteAccount as any);
  const changePasswordMutation = useMutation((api.users as any).changePassword);
  const followUser = useMutation(api.follows.followUser as any);
  const unfollowUser = useMutation(api.follows.unfollowUser as any);
  const sendMessage = useMutation(api.chat.sendMessage as any);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl as any);
  const updateAvatar = useMutation(api.users.updateAvatar as any);
  const respondToInvite = useMutation(api.invites.respondToInvite as any);
  const respondToFollowRequest = useMutation(api.follows.respondToFollowRequest as any);

  const profileVisibility = useQuery(
    api.users.getProfileVisibility as any,
    user ? { sessionUserId: user.id as any } : "skip",
  );
  const achievements = useQuery(
    api.achievements.getByUserId as any,
    user ? { userId: user.id as any } : "skip",
  );
  const followersCount = useQuery(
    api.follows.getFollowersCount as any,
    user ? { userId: user.id as any } : "skip",
  );
  const followingCount = useQuery(
    api.follows.getFollowingCount as any,
    user ? { sessionUserId: user.id as any, userId: user.id as any } : "skip",
  );
  const following = useQuery(
    api.follows.getFollowing as any,
    user ? { userId: user.id as any, limit: 200 } : "skip",
  );
  const receivedInvites = (useQuery(
    api.invites.getPendingInvites as any,
    user && accountType === "JOGADOR" ? { sessionUserId: user.id as any } : "skip",
  ) ?? []) as ReceivedInvite[];
  const pendingReceivedInvites = receivedInvites.filter((invite) => invite.status === "pending");
  const pendingFollowRequests = (useQuery(
    api.follows.getPendingFollowRequests as any,
    user ? { sessionUserId: user.id as any, limit: 20 } : "skip",
  ) ?? []) as PendingFollowRequest[];

  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [discoverModalVisible, setDiscoverModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const searchResults = useQuery(
    api.users.searchUsers,
    user && searchQuery.trim()
      ? { sessionUserId: user.id as any, query: searchQuery.trim(), limit: 30 }
      : "skip",
  );
  const followingIds = new Set(
    (following || []).map((item: any) => item?.following_id || item?._id || item?.id),
  );
  const visibleSearchResults = (searchResults || []).filter(
    (result: any) => (result._id || result.id) !== user?.id,
  );
  const accountTypeLabel = getAccountTypeLabel(accountType, t);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleLogout = () => {
    setConfirmAction("logout");
  };

  
  const handleDeleteAccount = () => {
    setConfirmAction("deleteAccount");
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !user) return;

    setConfirmLoading(true);
    try {
      if (confirmAction === "deleteAccount") {
        await deleteAccount({ sessionUserId: user.id as any });
      }
      await logout();
      setConfirmAction(null);
      setSettingsModalVisible(false);
      router.replace("/login");
    } catch {
      Alert.alert("Error", confirmAction === "deleteAccount" ? "Failed to delete account" : "Failed to logout");
    } finally {
      setConfirmLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    resetPasswordForm();
  };

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword.length < 8) {
      Alert.alert("Error", t("validation.passwordMinLength"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Error", t("validation.passwordsNotMatch"));
      return;
    }

    setPasswordLoading(true);
    try {
      await changePasswordMutation({
        sessionUserId: user.id as any,
        currentPassword,
        newPassword,
      });
      setPasswordModalVisible(false);
      resetPasswordForm();
      Alert.alert(t("common.success"), t("settings.security.changePassword"));
    } catch (error) {
      Alert.alert(
        "Erro",
        getSimpleErrorMessage(error, "Falha ao alterar palavra-passe."),
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditProfile = async () => {
    const validationError =
      requiredText(editName, "Name") || optionalText(editBio, "Bio");
    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }

    try {
      await updateUser({
        sessionUserId: user?.id as any,
        name: editName.trim(),
        bio: editBio.trim(),
      });
      setEditModalVisible(false);
      Alert.alert("Success", "Profile updated");
    } catch {
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

    try {
      const asset = pickerResult.assets[0];
      const uploadUrl = await generateUploadUrl({ sessionUserId: user?.id as any });
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type || "image/jpeg" },
        body: blob,
      });
      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }
      const { storageId } = await uploadResponse.json();
      await updateAvatar({ sessionUserId: user?.id as any, storageId });
      Alert.alert("Success", "Profile picture updated!");
    } catch {
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  const handleFollowToggle = async (targetUserId: string, isFollowing: boolean) => {
    if (!user) return;

    try {
      if (isFollowing) {
        await unfollowUser({ sessionUserId: user.id as any, userId: targetUserId as any });
        Alert.alert("Success", t("profile.unfollowSuccess"));
      } else {
        const result = await followUser({ sessionUserId: user.id as any, userId: targetUserId as any });
        Alert.alert(
          "Success",
          result?.status === "pending" ? "Pedido enviado. O utilizador tem de aceitar." : t("profile.followSuccess"),
        );
      }
    } catch {
      Alert.alert(
        "Error",
        isFollowing ? t("profile.unfollowError") : t("profile.followError"),
      );
    }
  };

  const handleFollowRequestResponse = async (requestId: string, accept: boolean) => {
    if (!user) return;

    try {
      await respondToFollowRequest({
        sessionUserId: user.id as any,
        requestId: requestId as any,
        accept,
      });
      Alert.alert("Sucesso", accept ? "Pedido aceite." : "Pedido rejeitado.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao responder ao pedido."));
    }
  };

  const handleOpenUserProfile = (targetUserId: string) => {
    setDiscoverModalVisible(false);
    router.push(`/user/${targetUserId}` as any);
  };

  const handleSendMessage = async (recipientId: string) => {
    if (!user) return;

    try {
      await sendMessage({
        sessionUserId: user.id as any,
        recipientId: recipientId as any,
        content: "Hi!",
      });
      setDiscoverModalVisible(false);
      Alert.alert("Success", t("profile.sendMessageSuccess"));
      router.push("/chat");
    } catch {
      Alert.alert("Error", t("profile.sendMessageError"));
    }
  };

  const handleInviteResponse = async (inviteId: string, accept: boolean) => {
    if (!user) return;

    try {
      await respondToInvite({
        sessionUserId: user.id as any,
        inviteId: inviteId as any,
        accept,
      });
      Alert.alert("Sucesso", accept ? "Convite aceite." : "Convite rejeitado.");
    } catch (error) {
      Alert.alert("Erro", getSimpleErrorMessage(error, "Falha ao responder ao convite."));
    }
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1, paddingTop: 50 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.userInfoRow}>
              <Image
                source={{
                  uri:
                    user?.profileImageBase64 ||
                    user?.avatar_url ||
                    "https://placehold.co/150x150",
                }}
                style={styles.avatar}
              />
              <View style={styles.userTitleColumn}>
                <Text style={[styles.usernameText, { color: colors.text }]}>
                  {user?.fullName || "User"}
                </Text>
                <Text style={[styles.accountTypeSubtitle, { color: colors.textMuted }]}>
                  Tipo de conta: {accountTypeLabel}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.settingsButton, { backgroundColor: colors.primary }]}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Ionicons name="settings" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {user?.bio ? (
            <Text style={[styles.bio, { color: colors.text }]}>{user.bio}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setEditName(user?.fullName || "");
              setEditBio(user?.bio || "");
              setEditModalVisible(true);
            }}
          >
            <Text style={[styles.editButtonText, { color: colors.surface }]}>
              {t("profile.editProfile")}
            </Text>
          </TouchableOpacity>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{followersCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t("profile.followers")}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{followingCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {t("profile.following")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.socialSection}>
          <View
            style={[
              styles.socialCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.socialHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("profile.discoverUsers")}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                  {t("profile.discoverSubtitle")}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: colors.primary }]}
                onPress={() => setDiscoverModalVisible(true)}
              >
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {accountType === "JOGADOR" && pendingReceivedInvites.length > 0 ? (
          <View style={styles.socialSection}>
            <View
              style={[
                styles.socialCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Convites de equipa
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Aceita um convite para entrares na equipa do treinador.
              </Text>
              {pendingReceivedInvites.map((invite) => (
                  <View
                    key={invite._id}
                    style={{
                      borderTopColor: colors.border,
                      borderTopWidth: 1,
                      paddingTop: 12,
                      marginTop: 12,
                    }}
                  >
                    <Text style={[styles.resultName, { color: colors.text }]}>
                      {invite.coach?.full_name || "Treinador"}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                      <TouchableOpacity
                        style={[styles.resultActionButton, { backgroundColor: colors.success }]}
                        onPress={() => handleInviteResponse(invite._id, true)}
                      >
                        <Text style={styles.resultActionText}>Aceitar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.resultActionButton, { backgroundColor: colors.danger }]}
                        onPress={() => handleInviteResponse(invite._id, false)}
                      >
                        <Text style={styles.resultActionText}>Rejeitar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        ) : null}

        {pendingFollowRequests.length > 0 ? (
          <View style={styles.socialSection}>
            <View
              style={[
                styles.socialCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Pedidos para seguir
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Estes utilizadores querem ver o teu perfil privado.
              </Text>
              {pendingFollowRequests.map((request) => (
                <View
                  key={request._id}
                  style={{
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingTop: 12,
                    marginTop: 12,
                  }}
                >
                  <Text style={[styles.resultName, { color: colors.text }]}>
                    {request.requester?.full_name || "Utilizador"}
                  </Text>
                  <Text style={[styles.resultRole, { color: colors.textMuted }]}>
                    {request.requester?.role || "Conta"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.resultActionButton, { backgroundColor: colors.success }]}
                      onPress={() => handleFollowRequestResponse(request._id, true)}
                    >
                      <Text style={styles.resultActionText}>Aceitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.resultActionButton, { backgroundColor: colors.danger }]}
                      onPress={() => handleFollowRequestResponse(request._id, false)}
                    >
                      <Text style={styles.resultActionText}>Rejeitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <AchievementsSection achievements={achievements} colors={colors} />
      </ScrollView>

      <Modal
        visible={discoverModalVisible}
        animationType="slide"
        onRequestClose={() => setDiscoverModalVisible(false)}
      >
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setDiscoverModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("profile.discoverUsers")}
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("profile.searchPlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
            {searchQuery.trim().length === 0 ? (
              <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                {t("profile.discoverSubtitle")}
              </Text>
            ) : null}
            {searchQuery.trim().length > 0 && visibleSearchResults.length === 0 ? (
              <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                {t("profile.emptySearch")}
              </Text>
            ) : null}

            {visibleSearchResults.map((result: any) => {
              const targetUserId = String(result._id || result.id);
              const isFollowing = result.followStatus === "following" || followingIds.has(targetUserId);
              const isPending = result.followStatus === "pending";

              return (
                <View
                  key={targetUserId}
                  style={[
                    styles.searchResultCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.searchResultMain}>
                    <Image
                      source={{ uri: result.avatar || "https://placehold.co/50x50" }}
                      style={styles.resultAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: colors.text }]}>
                        {result.full_name}
                      </Text>
                      <Text style={[styles.resultRole, { color: colors.textMuted }]}>
                        {result.role}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={[
                        styles.resultActionButton,
                        { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
                      ]}
                      onPress={() => handleOpenUserProfile(targetUserId)}
                    >
                      <Text style={[styles.resultActionText, { color: colors.text }]}>
                        Ver conta
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      disabled={isPending}
                      style={[
                        styles.resultActionButton,
                        {
                          backgroundColor: isPending
                            ? colors.warning
                            : isFollowing
                              ? colors.warning
                              : colors.primary,
                        },
                      ]}
                      onPress={() => handleFollowToggle(targetUserId, isFollowing)}
                    >
                      <Text style={styles.resultActionText}>
                        {isPending ? "Pendente" : isFollowing ? t("profile.unfollow") : result.is_public ? t("profile.follow") : "Pedir"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.resultActionButton,
                        { backgroundColor: colors.success },
                      ]}
                      onPress={() => handleSendMessage(targetUserId)}
                    >
                      <Text style={styles.resultActionText}>{t("profile.message")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </LinearGradient>
      </Modal>

      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t("settings.title")}</Text>
            <View />
          </View>
          <ScrollView style={{ flex: 1, padding: 16, paddingTop: 32 }}>
            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.appearance.title")}
              </Text>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t("settings.appearance.theme")}
                </Text>
                <View style={styles.segmentedControl}>
                  {[
                    { label: t("settings.appearance.light"), icon: "sunny" as const, value: false },
                    { label: t("settings.appearance.dark"), icon: "moon" as const, value: true },
                  ].map((option) => {
                    const selected = isDarkMode === option.value;
                    return (
                      <TouchableOpacity
                        key={option.label}
                        onPress={() => setDarkMode(option.value)}
                        style={[
                          styles.segmentButton,
                          {
                            backgroundColor: selected ? colors.primary : "transparent",
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={16}
                          color={selected ? "#fff" : colors.text}
                        />
                        <Text
                          style={[
                            styles.segmentText,
                            { color: selected ? "#fff" : colors.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.language.title")}
              </Text>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  {t("settings.language.select")}
                </Text>
                <View style={styles.segmentedControl}>
                  {[
                    { label: t("settings.language.pt"), value: "pt" },
                    { label: t("settings.language.en"), value: "en" },
                    { label: t("settings.language.es"), value: "es" },
                  ].map((option) => {
                    const selected = i18n.language.startsWith(option.value);
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => changeLanguage(option.value)}
                        style={[
                          styles.segmentButton,
                          {
                            backgroundColor: selected ? colors.primary : "transparent",
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: selected ? "#fff" : colors.text },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

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
                  <Text style={[styles.accountText, { color: colors.textMuted }]}>
                    {t("settings.account.email")}: {user?.email || "N/A"}
                  </Text>
                </View>
                <View style={styles.accountActions}>
                  <Image
                    source={{ uri: user?.avatar_url || "https://placehold.co/150x150" }}
                    style={styles.avatarSmall}
                  />
                  <TouchableOpacity style={styles.changeButton} onPress={handleChangeImage}>
                    <Text style={{ color: colors.primary }}>
                      {t("settings.account.changeImage")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacidade</Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const newVisibility = await toggleProfileVisibility({
                      sessionUserId: user?.id as any,
                    });
                    Alert.alert(
                      "Sucesso",
                      `Perfil agora está ${newVisibility.is_public ? "público" : "privado"}`,
                    );
                  } catch {
                    Alert.alert("Erro", "Falha ao alterar visibilidade");
                  }
                }}
                style={styles.settingRow}
              >
                <Text style={[styles.settingLabel, { color: colors.text }]}>Perfil Público</Text>
                <View style={styles.selectorChip}>
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

            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.security.title")}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setPasswordModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  {t("settings.security.changePassword")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleLogout} activeOpacity={0.7}>
                <Text style={[styles.buttonText, { color: colors.danger }]}>
                  {t("settings.security.logout")}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.section,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t("settings.privacy.title")}
              </Text>
              <TouchableOpacity style={styles.button} onPress={handleDeleteAccount} activeOpacity={0.7}>
                <Text style={[styles.buttonText, { color: colors.danger }]}>
                  {t("settings.privacy.deleteAccount")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      <PasswordModal
        visible={passwordModalVisible}
        colors={colors}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmNewPassword={confirmNewPassword}
        loading={passwordLoading}
        onChangeCurrentPassword={setCurrentPassword}
        onChangeNewPassword={setNewPassword}
        onChangeConfirmNewPassword={setConfirmNewPassword}
        onClose={closePasswordModal}
        onSave={handleChangePassword}
        t={t}
      />

      <ConfirmActionModal
        action={confirmAction}
        colors={colors}
        loading={confirmLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        t={t}
      />

      <Modal
        visible={editModalVisible}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t("profile.editProfile")}
            </Text>
            <TouchableOpacity onPress={handleEditProfile}>
              <Text style={[styles.saveText, { color: colors.primary }]}>
                {t("common.save")}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t("auth.fullName")}
            </Text>
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
              placeholder={t("profile.namePlaceholder")}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.label, { color: colors.text }]}>
              {t("profile.bio")}
            </Text>
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
              placeholder={t("profile.bioPlaceholder")}
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <Text style={[styles.label, { color: colors.text }]}>
              {t("settings.account.profileImage")}
            </Text>
            <TouchableOpacity
              onPress={handleChangeImage}
              style={[styles.editButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.editButtonText, { color: colors.surface }]}>
                {t("profile.changePicture")}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    boxShadow: "0 2px 3.84px rgba(0,0,0,0.25)",
  },
  profileSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  profileHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  userInfoRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userTitleColumn: {
    flex: 1,
    marginLeft: 16,
    minWidth: 0,
  },
  usernameText: {
    fontSize: 28,
    fontWeight: "700",
    flexShrink: 1,
  },
  accountTypeSubtitle: {
    fontSize: 14,
    marginTop: 4,
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
  socialSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  socialCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  socialHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  achievementsSection: {
    padding: 16,
    paddingTop: 0,
  },
  achievementCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
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
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
    minWidth: 120,
  },
  selectorChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    gap: 8,
  },
  segmentedControl: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
    flex: 2,
    minWidth: 180,
  },
  segmentButton: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
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
    gap: 16,
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
  emptyStateText: {
    fontSize: 14,
    marginBottom: 12,
  },
  searchResultCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  profilePreviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  profilePreviewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  profilePreviewName: {
    fontSize: 20,
    fontWeight: "700",
  },
  privateProfileBox: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  activityRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  searchResultMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultRole: {
    fontSize: 14,
    marginTop: 2,
  },
  resultActions: {
    flexDirection: "row",
    gap: 10,
  },
  resultActionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  resultActionText: {
    color: "#fff",
    fontWeight: "600",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmButton: {
    minHeight: 44,
    minWidth: 112,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
