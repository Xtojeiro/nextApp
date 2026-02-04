import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../convex/_generated/api";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";

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

  const conversations = useQuery(
    api.chat.getConversations,
    user ? { userId: user.id as any } : "skip",
  );
  const messages = useQuery(
    api.chat.getMessages,
    selectedConversation && user
      ? {
          conversationId: selectedConversation.id as any,
          userId: user.id as any,
        }
      : "skip",
  );
  const sendMessage = useMutation(api.chat.sendMessage);
  const markAsRead = useMutation(api.chat.markMessagesAsRead);
  const blockUser = useMutation(api.chat.blockUser);
  const unblockUser = useMutation(api.chat.unblockUser);
  const blockedUsers = useQuery(
    api.chat.getBlockedUsers,
    user ? { userId: user.id as any } : "skip",
  );

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    try {
      await sendMessage({
        senderId: user.id as any,
        receiverId: selectedConversation.otherUserId as any,
        content: messageText.trim(),
      });
      setMessageText("");
    } catch (error) {
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
        conversationId: conversation.id as any,
        userId: user.id as any,
      });
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedConversation(null);
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
                "https://via.placeholder.com/40",
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
                (b) => b.id === selectedConversation.otherUserId,
              );
              try {
                if (isBlocked) {
                  await unblockUser({
                    blockerId: user.id as any,
                    blockedId: selectedConversation.otherUserId as any,
                  });
                } else {
                  await blockUser({
                    blockerId: user.id as any,
                    blockedId: selectedConversation.otherUserId as any,
                  });
                }
              } catch (error) {
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
    <LinearGradient
      colors={colors.gradients.background}
      style={{ flex: 1, paddingTop: 50 }}
    >
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
                  item.otherUser.avatar_url || "https://via.placeholder.com/50",
              }}
              style={styles.avatar}
            />
            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text
                  style={[
                    styles.conversationName,
                    { color: colors.text },
                    item.unreadCount > 0 && styles.unreadText,
                  ]}
                >
                  {item.otherUser.full_name}
                </Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                  {item.lastMessage
                    ? formatTime(item.lastMessage.created_at)
                    : ""}
                </Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text
                  style={[
                    styles.lastMessage,
                    { color: colors.textMuted },
                    item.unreadCount > 0 && [
                      styles.unreadText,
                      { color: colors.text },
                    ],
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage?.content || "No messages"}
                </Text>
                {item.unreadCount > 0 && <View style={styles.unreadDot} />}
              </View>
            </View>
          </TouchableOpacity>
        )}
        style={styles.list}
      />
      <TouchableOpacity style={styles.floatingButton}>
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
