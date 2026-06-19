import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "@/utils/apiClient";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { requiredText } from "@/utils/formValidation";

const reportChatError = (context: string, error: unknown) => {
  console.error(`${context}:`, error);
};

export default function ChatTab() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    otherUserId: string;
    otherUser: any;
  } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [view, setView] = useState<"list" | "chat">("list");

  // New chat modal
  const [newChatModalVisible, setNewChatModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const conversations = useQuery(
    api.chat.getConversations,
    user ? { sessionUserId: user.id as any } : "skip",
  );
  const messages = useQuery(
    api.chat.getMessages,
    user && selectedConversation
      ? {
          sessionUserId: user.id as any,
          conversationId: selectedConversation.id as any,
        }
      : "skip",
  );

  // Search for users to message
  const searchResults = useQuery(
    api.chat.searchUsersToMessage,
    user && searchQuery.length >= 2
      ? { sessionUserId: user.id as any, searchQuery }
      : "skip",
  );

  const sendMessage = useMutation(api.chat.sendMessage);
  const createConversation = useMutation(api.chat.createConversation);
  const markAsRead = useMutation(api.chat.markMessagesAsRead);
  const blockUser = useMutation(api.chat.blockUser);
  const unblockUser = useMutation(api.chat.unblockUser);
  const blockedUsers = useQuery(
    api.chat.getBlockedUsers,
    user ? { sessionUserId: user.id as any } : "skip",
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;
    const validationError = requiredText(messageText, "Message", 1000);
    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }

    try {
      await sendMessage({
        sessionUserId: user.id as any,
        conversationId: selectedConversation.id as any,
        content: messageText.trim(),
      } as any);
      setMessageText("");
    } catch (error) {
      reportChatError("Failed to send message", error);
      Alert.alert("Error", "Failed to send message");
    }
  };

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation({
      id: conversation.id,
      otherUserId: conversation.otherUser.id,
      otherUser: conversation.otherUser,
    });
    setView("chat");
    if (user) {
      markAsRead({
        sessionUserId: user.id as any,
      } as any);
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedConversation(null);
  };

  const handleNewChat = () => {
    setNewChatModalVisible(true);
  };

  const handleStartConversation = async (recipientId: string) => {
    try {
      const result = await createConversation({
        sessionUserId: user!.id as any,
        recipientId: recipientId as any,
      });
      setNewChatModalVisible(false);
      setSearchQuery("");

      // Navigate to the new conversation
      const userResult = searchResults?.find((u: any) => u.id === recipientId);
      if (userResult && result.conversationId) {
        setSelectedConversation({
          id: result.conversationId,
          otherUserId: recipientId,
          otherUser: userResult,
        });
        setView("chat");
      }
    } catch (error) {
      reportChatError("Failed to start conversation", error);
      Alert.alert("Error", "Failed to start conversation");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <Text style={{ color: colors.text }}>Please log in to use chat</Text>
      </LinearGradient>
    );
  }

  if (view === "chat" && selectedConversation) {
    return (
      <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <View
          style={[
            styles.chatHeader,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleBackToList}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Image
            source={{
              uri:
                selectedConversation.otherUser.avatar_url ||
                "https://placehold.co/40x40",
            }}
            style={styles.chatAvatar}
          />
          <Text style={[styles.chatUserName, { color: colors.text }]}>
            {selectedConversation.otherUser.full_name}
          </Text>
          <TouchableOpacity
            style={styles.blockButton}
            onPress={async () => {
              const isBlocked = blockedUsers?.some(
                (b: any) => b?._id === selectedConversation.otherUserId,
              );
              try {
                if (isBlocked) {
                  await unblockUser({
                    sessionUserId: user.id as any,
                    userId: selectedConversation.otherUserId as any,
                  } as any);
                } else {
                  await blockUser({
                    sessionUserId: user.id as any,
                    userId: selectedConversation.otherUserId as any,
                  } as any);
                }
              } catch (error) {
                reportChatError("Failed to update block status", error);
                Alert.alert("Error", "Failed to update block status");
              }
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageItem,
                item.sender_id === user.id
                  ? styles.myMessage
                  : styles.otherMessage,
              ]}
            >
              {item.sender_id !== user.id && (
                <Text style={[styles.senderName, { color: colors.text }]}>
                  {selectedConversation?.otherUser.full_name}
                </Text>
              )}
              <Text
                style={
                  item.sender_id === user.id
                    ? styles.myMessageText
                    : [styles.otherMessageText, { color: colors.text }]
                }
              >
                {item.content}
              </Text>
              <Text style={[styles.messageTime, { color: colors.textMuted }]}>
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={{ flex: 1, paddingBottom: 80 }}
        />
        <View
          style={[
            styles.inputArea,
            {
              borderTopColor: colors.border,
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={colors.gradients.background} style={{ flex: 1 }}>
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            Mensagens
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            Conversas recentes e mensagens da equipa.
          </Text>
        </View>

        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.conversationItem,
              { borderBottomColor: colors.border },
            ]}
            onPress={() => handleSelectConversation(item)}
          >
            <Image
              source={{
                uri:
                  item?.otherUser?.avatar_url ||
                  "https://placehold.co/50x50",
              }}
              style={styles.avatar}
            />
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text
                  style={[
                    styles.conversationName,
                    { color: colors.text },
                    (item?.unreadCount ?? 0) > 0 && styles.unreadText,
                  ]}
                >
                  {item?.otherUser?.full_name || "Unknown"}
                </Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                  {item?.lastMessage
                    ? formatTime(item.lastMessage.created_at)
                    : ""}
                </Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text
                  style={[
                    styles.lastMessage,
                    { color: colors.textMuted },
                    (item?.unreadCount ?? 0) > 0 && [
                      styles.unreadText,
                      { color: colors.text },
                    ],
                  ]}
                  numberOfLines={1}
                >
                  {item?.lastMessage?.content || "No messages"}
                </Text>
                {(item?.unreadCount ?? 0) > 0 && (
                  <View style={styles.unreadDot} />
                )}
              </View>
            </View>
          </TouchableOpacity>
          )}
          style={styles.list}
        />
        <TouchableOpacity style={styles.floatingButton} onPress={handleNewChat}>
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>

      {/* New Chat Modal */}
      <Modal
        visible={newChatModalVisible}
        animationType="slide"
        onRequestClose={() => setNewChatModalVisible(false)}
      >
        <LinearGradient
          colors={colors.gradients.background}
          style={{ flex: 1 }}
        >
          <View
            style={[styles.modalHeader, { backgroundColor: colors.surface }]}
          >
            <TouchableOpacity onPress={() => setNewChatModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              New Message
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ padding: 16 }}>
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
              placeholder="Search users..."
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <FlatList
            data={searchResults || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.conversationItem,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => handleStartConversation(item.id)}
              >
                <Image
                  source={{
                    uri: item.avatar_url || "https://placehold.co/50x50",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.conversationContent}>
                  <Text
                    style={[styles.conversationName, { color: colors.text }]}
                  >
                    {item.full_name}
                  </Text>
                  <Text
                    style={[styles.lastMessage, { color: colors.textMuted }]}
                  >
                    {item.email}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            style={{ flex: 1 }}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: colors.textMuted }}>
                  {searchQuery.length >= 2
                    ? "No users found"
                    : "Type at least 2 characters to search"}
                </Text>
              </View>
            }
          />
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    fontSize: 18,
    fontWeight: "600",
  },
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
    boxShadow: "0 2px 3.84px rgba(0,0,0,0.25)",
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "400",
  },
  unreadText: {
    fontWeight: "bold",
  },
  time: {
    fontSize: 14,
    color: "#666",
  },
  conversationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0095f6",
    marginLeft: 8,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  chatUserName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  blockButton: {
    padding: 8,
  },
  messagesContainer: {
    padding: 16,
  },
  messageItem: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 18,
    maxWidth: "70%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#0095f6",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
  },
  myMessageText: {
    color: "#fff",
    fontSize: 16,
  },
  otherMessageText: {
    color: "#000",
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: "#ccc",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0095f6",
    justifyContent: "center",
    alignItems: "center",
  },
  senderName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
});
