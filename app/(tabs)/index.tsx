import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.trim() ? { query: searchQuery } : "skip",
  );
  const followUser = useMutation(api.follows.followUser);
  const unfollowUser = useMutation(api.follows.unfollowUser);
  const isFollowing = useQuery(
    api.follows.isFollowing,
    user && selectedUser
      ? { followerId: user.id as any, followingId: selectedUser.id as any }
      : "skip",
  );
  const sendMessage = useMutation(api.chat.sendMessage);

  const handleFollow = async (userId: string) => {
    if (!user) return;
    try {
      await followUser({
        followerId: user.id as any,
        followingId: userId as any,
      });
      Alert.alert("Success", "Followed user");
    } catch (error) {
      Alert.alert("Error", "Failed to follow user");
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!user) return;
    try {
      await unfollowUser({
        followerId: user.id as any,
        followingId: userId as any,
      });
      Alert.alert("Success", "Unfollowed user");
    } catch (error) {
      Alert.alert("Error", "Failed to unfollow user");
    }
  };

  const handleSendMessage = async (receiverId: string) => {
    if (!user) return;
    try {
      await sendMessage({
        senderId: user.id as any,
        receiverId: receiverId as any,
        content: "Hi!",
      });
      Alert.alert("Success", "Message sent");
      router.push("/chat");
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const renderSearchResult = ({ item }: { item: any }) => (
    <View style={[styles.resultItem, { backgroundColor: colors.surface }]}>
      <Image
        source={{ uri: item.avatar_url || "https://via.placeholder.com/50" }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.full_name}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textMuted }]}>
          {item.email}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setSelectedUser(item);
            setProfileModalVisible(true);
          }}
        >
          <Text style={[styles.actionText, { color: colors.surface }]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => handleSendMessage(item.id)}
        >
          <Text style={[styles.actionText, { color: colors.surface }]}>
            Message
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1, paddingTop: 50 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Feed
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            Latest updates from the club.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setSearchModalVisible(true)}
        >
          <Ionicons name="search" size={24} color={colors.surface} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <LinearGradient
          colors={colors.gradients.background}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Search Users
            </Text>
            <View />
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Search by name or email"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={searchResults || []}
            keyExtractor={(item) => item.id}
            renderItem={renderSearchResult}
            style={{ flex: 1 }}
          />
        </LinearGradient>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <LinearGradient
          colors={colors.gradients.background}
          style={{ flex: 1 }}
        >
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              User Profile
            </Text>
            <View />
          </View>
          {selectedUser && (
            <View style={styles.profileContainer}>
              <Image
                source={{
                  uri:
                    selectedUser.avatar_url ||
                    "https://via.placeholder.com/100",
                }}
                style={styles.profileAvatar}
              />
              <Text style={[styles.profileName, { color: colors.text }]}>
                {selectedUser.full_name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
                {selectedUser.email}
              </Text>
              {selectedUser.bio && (
                <Text style={[styles.profileBio, { color: colors.text }]}>
                  {selectedUser.bio}
                </Text>
              )}
              <View style={styles.profileActions}>
                {isFollowing ? (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.danger },
                    ]}
                    onPress={() => handleUnfollow(selectedUser.id)}
                  >
                    <Text
                      style={[styles.actionText, { color: colors.surface }]}
                    >
                      Unfollow
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleFollow(selectedUser.id)}
                  >
                    <Text
                      style={[styles.actionText, { color: colors.surface }]}
                    >
                      Follow
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => handleSendMessage(selectedUser.id)}
                >
                  <Text style={[styles.actionText, { color: colors.surface }]}>
                    Send Message
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  profileContainer: {
    flex: 1,
    alignItems: "center",
    padding: 20,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    marginBottom: 16,
  },
  profileBio: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  profileActions: {
    flexDirection: "row",
  },
});
