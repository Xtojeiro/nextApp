import { api } from "@/convex/_generated/api";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useAction } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PostData {
  _id: any;
  user_id: any;
  content: string;
  image_url?: string;
  likes?: string[];
  comments?: { user_id: any; content: string; timestamp: number }[];
  is_public?: boolean;
  created_at: number;
  user?: {
    _id: any;
    full_name: string;
    avatar?: string;
    role: string;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export default function Index() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [newComment, setNewComment] = useState("");

  const posts = useQuery(
    api.posts.getPostsWithUsers,
    user ? { sessionUserId: user.id as any, limit: 50 } : { limit: 50 },
  );
  const searchResults = useQuery(
    api.users.searchUsers,
    searchQuery.trim() ? { query: searchQuery } : "skip",
  );

  const createPost = useMutation(api.posts.createPost);
  const deletePost = useMutation(api.posts.deletePost);
  const likePost = useMutation(api.posts.likePost);
  const addComment = useMutation(api.posts.addComment);
  const followUser = useMutation(api.follows.followUser);
  const unfollowUser = useMutation(api.follows.unfollowUser);
  const isFollowing = useQuery(
    api.follows.isFollowing,
    user && selectedUser
      ? { sessionUserId: user.id as any, userId: selectedUser.id as any }
      : "skip",
  );
  const sendMessage = useMutation(api.chat.sendMessage);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      Alert.alert("Error", "Post content cannot be empty");
      return;
    }
    try {
      await createPost({ sessionUserId: user!.id as any, content: postContent.trim() });
      setPostContent("");
      setCreatePostModalVisible(false);
      Alert.alert("Success", "Post created successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await likePost({ sessionUserId: user!.id as any, postId: postId as any });
    } catch (error) {
      Alert.alert("Error", "Failed to like post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost({
                sessionUserId: user!.id as any,
                postId: postId as any,
              });
              Alert.alert("Success", "Post deleted");
            } catch (error) {
              Alert.alert("Error", "Failed to delete post");
            }
          },
        },
      ]
    );
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      await addComment({
        sessionUserId: user!.id as any,
        postId: selectedPost._id as any,
        content: newComment.trim(),
      });
      setNewComment("");
      setCommentsModalVisible(false);
      setSelectedPost(null);
    } catch (error) {
      Alert.alert("Error", "Failed to add comment");
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;
    try {
      await followUser({ sessionUserId: user.id as any, userId: userId as any });
      Alert.alert("Success", "Followed user");
    } catch (error) {
      Alert.alert("Error", "Failed to follow user");
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (!user) return;
    try {
      await unfollowUser({ sessionUserId: user.id as any, userId: userId as any });
      Alert.alert("Success", "Unfollowed user");
    } catch (error) {
      Alert.alert("Error", "Failed to unfollow user");
    }
  };

  const handleSendMessage = async (receiverId: string) => {
    if (!user) return;
    try {
      await sendMessage({
        sessionUserId: user.id as any,
        recipientId: receiverId as any,
        content: "Hi!",
      });
      Alert.alert("Success", "Message sent");
      router.push("/chat");
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = ({ item }: { item: PostData }) => {
    const isOwner = user?.id === item.user_id;
    return (
      <View style={[styles.postCard, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => {
            if (item.user) {
              setSelectedUser(item.user);
              setProfileModalVisible(true);
            }
          }}
        >
          <Image
            source={{ uri: item.user?.avatar || "https://placehold.co/50x50" }}
            style={styles.postAvatar}
          />
          <View style={styles.postUserInfo}>
            <Text style={[styles.postUserName, { color: colors.text }]}>
              {item.user?.full_name || "Unknown User"}
            </Text>
            <Text style={[styles.postDate, { color: colors.textMuted }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
          {isOwner && (
            <TouchableOpacity onPress={() => handleDeletePost(item._id)}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <Text style={[styles.postContent, { color: colors.text }]}>
          {item.content}
        </Text>

        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}

        <View style={[styles.postActions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => handleLikePost(item._id)}
          >
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={22}
              color={item.isLiked ? colors.danger : colors.textMuted}
            />
            <Text style={[styles.postActionText, { color: colors.textMuted }]}>
              {item.likesCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => {
              setSelectedPost(item);
              setCommentsModalVisible(true);
            }}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.textMuted} />
            <Text style={[styles.postActionText, { color: colors.textMuted }]}>
              {item.commentsCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyFeed = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={80} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No posts yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Be the first to share something with the community!
      </Text>
      <TouchableOpacity
        style={[styles.createPostButton, { backgroundColor: colors.primary }]}
        onPress={() => setCreatePostModalVisible(true)}
      >
        <Ionicons name="add" size={24} color={colors.surface} />
        <Text style={[styles.createPostButtonText, { color: colors.surface }]}>
          Create Post
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Feed</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setSearchModalVisible(true)}
            >
              <Ionicons name="search" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setCreatePostModalVisible(true)}
            >
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={(posts || []) as any}
          keyExtractor={(item) => item._id}
          renderItem={renderPost}
          ListEmptyComponent={renderEmptyFeed}
          contentContainerStyle={posts?.length === 0 ? styles.emptyList : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>

      {/* Create Post Modal */}
      <Modal
        visible={createPostModalVisible}
        animationType="slide"
        onRequestClose={() => setCreatePostModalVisible(false)}
      >
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setCreatePostModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create Post
            </Text>
            <TouchableOpacity
              onPress={handleCreatePost}
              disabled={!postContent.trim()}
            >
              <Text style={[
                styles.postButton,
                { color: postContent.trim() ? colors.primary : colors.textMuted }
              ]}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            <View style={styles.createPostUser}>
              <Image
                source={{ uri: user?.avatar || "https://placehold.co/50x50" }}
                style={styles.postAvatar}
              />
              <Text style={[styles.createPostUserName, { color: colors.text }]}>
                {user?.fullName || "You"}
              </Text>
            </View>
            <TextInput
              style={[styles.postInput, { color: colors.text, backgroundColor: colors.surface }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textMuted}
              multiline
              value={postContent}
              onChangeText={setPostContent}
              autoFocus
            />
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={commentsModalVisible}
        animationType="slide"
        onRequestClose={() => setCommentsModalVisible(false)}
      >
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Comments
            </Text>
            <View />
          </View>
          <FlatList
            data={selectedPost?.comments || []}
            keyExtractor={(item, index) => `${item.user_id}-${index}`}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              <Text style={[styles.noComments, { color: colors.textMuted }]}>
                No comments yet. Be the first to comment!
              </Text>
            }
            renderItem={({ item }) => (
              <View style={[styles.commentItem, { backgroundColor: colors.surface }]}>
                <Text style={[styles.commentContent, { color: colors.text }]}>
                  {item.content}
                </Text>
                <Text style={[styles.commentDate, { color: colors.textMuted }]}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>
            )}
          />
          <View style={[styles.commentInputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text, backgroundColor: colors.surface }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleAddComment}
              disabled={!newComment.trim()}
            >
              <Ionicons name="send" size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
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
              style={[styles.searchInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Search by name or email"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={searchResults || []}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultItem, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setSelectedUser(item);
                  setProfileModalVisible(true);
                }}
              >
                <Image
                  source={{ uri: item.avatar || "https://placehold.co/50x50" }}
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
              </TouchableOpacity>
            )}
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
        <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              User Profile
            </Text>
            <View />
          </View>
          {selectedUser && (
            <ScrollView style={styles.profileContainer}>
              <Image
                source={{
                  uri: selectedUser.avatar || "https://placehold.co/100x100",
                }}
                style={styles.profileAvatar}
              />
              <Text style={[styles.profileName, { color: colors.text }]}>
                {selectedUser.full_name}
              </Text>
              {selectedUser.bio && (
                <Text style={[styles.profileBio, { color: colors.text }]}>
                  {selectedUser.bio}
                </Text>
              )}
              <View style={styles.profileActions}>
                {user?.id !== selectedUser._id && (
                  <>
                    {isFollowing ? (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.danger }]}
                        onPress={() => handleUnfollow(selectedUser._id)}
                      >
                        <Text style={[styles.actionText, { color: colors.surface }]}>
                          Unfollow
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => handleFollow(selectedUser._id)}
                      >
                        <Text style={[styles.actionText, { color: colors.surface }]}>
                          Follow
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleSendMessage(selectedUser._id)}
                    >
                      <Text style={[styles.actionText, { color: colors.surface }]}>
                        Message
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    marginLeft: 16,
  },
  postCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    elevation: 3,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  postUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: "600",
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
  },
  postAction: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  postActionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  createPostButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createPostButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
    fontSize: 18,
    fontWeight: "bold",
  },
  postButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  createPostUser: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  createPostUserName: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  postInput: {
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: "top",
    padding: 16,
    borderRadius: 12,
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
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
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
  profileBio: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  profileActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentContent: {
    fontSize: 14,
  },
  commentDate: {
    fontSize: 12,
    marginTop: 4,
  },
  noComments: {
    textAlign: "center",
    marginTop: 40,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
