import { api } from "@/utils/apiClient";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@/hooks/useApi";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RankingType = "goals" | "assists" | "games" | "points" | "rebounds";

interface RankingEntry {
  rank: number;
  userId: string;
  fullName: string;
  avatar?: string;
  gamesPlayed: number;
  points: number;
  assists: number;
  rebounds: number;
  goals: number;
}

const TABS: { key: RankingType; label: string; icon: string }[] = [
  { key: "goals", label: "Goals", icon: "football" },
  { key: "assists", label: "Assists", icon: "arrow-redo" },
  { key: "games", label: "Games", icon: "game-controller" },
  { key: "points", label: "Points", icon: "star" },
  { key: "rebounds", label: "Rebounds", icon: "basketball" },
];

export default function Rankings() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<RankingType>("goals");

  const goalsRankings = useQuery(api.rankings.getRankingsByGoals, { limit: 20 });
  const assistsRankings = useQuery(api.rankings.getRankingsByAssists, { limit: 20 });
  const gamesRankings = useQuery(api.rankings.getRankingsByGamesPlayed, { limit: 20 });
  const pointsRankings = useQuery(api.rankings.getRankingsByPoints, { limit: 20 });
  const reboundsRankings = useQuery(api.rankings.getRankingsByRebounds, { limit: 20 });

  const getCurrentRankings = (): RankingEntry[] => {
    switch (activeTab) {
      case "goals":
        return goalsRankings || [];
      case "assists":
        return assistsRankings || [];
      case "games":
        return gamesRankings || [];
      case "points":
        return pointsRankings || [];
      case "rebounds":
        return reboundsRankings || [];
      default:
        return [];
    }
  };

  const getValue = (entry: RankingEntry): number => {
    switch (activeTab) {
      case "goals":
        return entry.goals;
      case "assists":
        return entry.assists;
      case "games":
        return entry.gamesPlayed;
      case "points":
        return entry.points;
      case "rebounds":
        return entry.rebounds;
      default:
        return 0;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return { name: "trophy" as const, color: "#FFD700" };
    if (rank === 2) return { name: "trophy" as const, color: "#C0C0C0" };
    if (rank === 3) return { name: "trophy" as const, color: "#CD7F32" };
    return { name: "ribbon" as const, color: colors.textMuted };
  };

  const renderRankingItem = ({ item }: { item: RankingEntry }) => {
    const rankIcon = getRankIcon(item.rank);
    const isTopThree = item.rank <= 3;
    
    return (
      <View style={[
        styles.rankingItem,
        { backgroundColor: colors.surface },
        isTopThree && styles.topThreeItem,
      ]}>
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankNumber,
            { color: rankIcon.color },
            isTopThree && styles.topThreeRank
          ]}>
            #{item.rank}
          </Text>
          {isTopThree && (
            <Ionicons name={rankIcon.name} size={16} color={rankIcon.color} />
          )}
        </View>
        
        <Image
          source={{ uri: item.avatar || "https://placehold.co/50x50" }}
          style={styles.playerAvatar}
        />
        
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, { color: colors.text }]}>
            {item.fullName}
          </Text>
          <Text style={[styles.playerStats, { color: colors.textMuted }]}>
            {item.gamesPlayed} games
          </Text>
        </View>
        
        <View style={styles.valueContainer}>
          <Text style={[styles.valueNumber, { color: colors.primary }]}>
            {getValue(item)}
          </Text>
          <Text style={[styles.valueLabel, { color: colors.textMuted }]}>
            {activeTab === "goals" && "goals"}
            {activeTab === "assists" && "assists"}
            {activeTab === "games" && "games"}
            {activeTab === "points" && "pts"}
            {activeTab === "rebounds" && "reb"}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyRankings = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={80} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Rankings Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Rankings will appear here once players have recorded game statistics.
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={colors.gradients.background as [string, string]} style={{ flex: 1 }}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Rankings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Top performers this season
          </Text>
        </View>

        <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeTab === tab.key ? colors.surface : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab.key ? colors.surface : colors.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={getCurrentRankings()}
          keyExtractor={(item) => item.userId}
          renderItem={renderRankingItem}
          ListEmptyComponent={renderEmptyRankings}
          contentContainerStyle={getCurrentRankings().length === 0 ? styles.emptyList : styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabsContainer: {
    paddingVertical: 12,
  },
  tabsContent: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    elevation: 2,
  },
  topThreeItem: {
    borderWidth: 2,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 50,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 4,
  },
  topThreeRank: {
    fontSize: 18,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: "600",
  },
  playerStats: {
    fontSize: 12,
    marginTop: 2,
  },
  valueContainer: {
    alignItems: "center",
  },
  valueNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  valueLabel: {
    fontSize: 11,
    textTransform: "uppercase",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
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
  },
});
