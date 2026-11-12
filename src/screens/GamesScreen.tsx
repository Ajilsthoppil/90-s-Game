import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { GameDefinition } from '../games/types/game.types';
import { getAvailableGames } from '../games/GameRegistry';
import { THEME } from '../theme/theme';
import { GameCard } from '../components/GameCard';
import { GameDetailModal } from '../components/GameDetailModal';

export type MainCategoryFilter = 'ALL' | 'CARD GAMES' | 'BOARD GAMES' | 'CLASSIC GAMES' | 'BRAIN GAMES';

export interface GamesScreenProps {
  onSelectGame: (gameId: string, playMode: 'SYSTEM' | 'CREATE' | 'JOIN') => void;
  initialCategory?: MainCategoryFilter;
}

export const GamesScreen: React.FC<GamesScreenProps> = ({ onSelectGame, initialCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<MainCategoryFilter>(initialCategory || 'ALL');
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const availableGames = getAvailableGames();

  const categoryMeta: { id: MainCategoryFilter; label: string; icon: string; countBadge?: number }[] = [
    {
      id: 'ALL',
      label: 'ALL',
      icon: '✨',
      countBadge: availableGames.length,
    },
    {
      id: 'BRAIN GAMES',
      label: 'BRAIN',
      icon: '🧠',
      countBadge: availableGames.filter((g) => g.gameType === 'brain' || g.category === 'BRAIN').length,
    },
    {
      id: 'BOARD GAMES',
      label: 'BOARD',
      icon: '🎲',
      countBadge: availableGames.filter((g) => g.category === 'BOARD').length,
    },
    {
      id: 'CARD GAMES',
      label: 'CARD',
      icon: '🃏',
      countBadge: availableGames.filter((g) => g.category === 'CARD').length,
    },
    {
      id: 'CLASSIC GAMES',
      label: 'CLASSIC',
      icon: '🎟️',
      countBadge: availableGames.filter((g) => g.category === 'CLASSIC' || g.id === 'bingo').length,
    },
  ];

  const filteredGames = availableGames.filter((g) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'CARD GAMES') return g.category === 'CARD';
    if (selectedCategory === 'BOARD GAMES') return g.category === 'BOARD';
    if (selectedCategory === 'CLASSIC GAMES') return g.category === 'CLASSIC' || g.id === 'bingo';
    if (selectedCategory === 'BRAIN GAMES') return g.gameType === 'brain' || g.category === 'BRAIN';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Anime Top Mission Header */}
        <View style={styles.headerBar}>
          <View>
            <View style={styles.animeTagRow}>
              <View style={styles.animePulseDot} />
              <Text style={styles.animeTagText}>CLASSIC ARCADE • 17 GAMES</Text>
            </View>
            <Text style={styles.headerTitle}>GAMES CATALOG</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{filteredGames.length}</Text>
            <Text style={styles.countLabel}>GAMES</Text>
          </View>
        </View>

        {/* Anime Filter Pills Bar */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {categoryMeta.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                >
                  <Text style={styles.pillIcon}>{cat.icon}</Text>
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {cat.label}
                  </Text>
                  {cat.countBadge !== undefined && (
                    <View style={[styles.pillBadge, isActive && styles.pillBadgeActive]}>
                      <Text style={[styles.pillBadgeText, isActive && styles.pillBadgeTextActive]}>
                        {cat.countBadge}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Description Banner */}
        <View style={styles.categorySubBanner}>
          <Text style={styles.subBannerText}>
            {selectedCategory === 'ALL' && '⚡ Displaying all classic & brain arcade games.'}
            {selectedCategory === 'BRAIN GAMES' && '🧠 12 Single-player logic, memory, and cognitive puzzles.'}
            {selectedCategory === 'BOARD GAMES' && '🎲 Multiplayer tactical board races: Ludo & Snakes.'}
            {selectedCategory === 'CARD GAMES' && '🃏 Strategic multiplayer card duels: UNO & Phase 10.'}
            {selectedCategory === 'CLASSIC GAMES' && '🎟️ Nostalgic classroom 5×5 pencil & paper Bingo.'}
          </Text>
        </View>

        {/* Games Catalog List */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredGames.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👾</Text>
              <Text style={styles.emptyTitle}>NO GAMES FOUND</Text>
              <Text style={styles.emptySub}>Try selecting a different category filter.</Text>
            </View>
          ) : (
            filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={(g) => setSelectedGame(g)}
              />
            ))
          )}
        </ScrollView>

        {/* Game Detail Modal */}
        <GameDetailModal
          visible={!!selectedGame}
          game={selectedGame}
          onPlayWithSystem={() => {
            const id = selectedGame?.id || 'bingo';
            setSelectedGame(null);
            onSelectGame(id, 'SYSTEM');
          }}
          onCreateRoom={() => {
            const id = selectedGame?.id || 'bingo';
            setSelectedGame(null);
            onSelectGame(id, 'CREATE');
          }}
          onJoinRoom={() => {
            const id = selectedGame?.id || 'bingo';
            setSelectedGame(null);
            onSelectGame(id, 'JOIN');
          }}
          onClose={() => setSelectedGame(null)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#060E1D',
  },
  container: {
    flex: 1,
    backgroundColor: '#060E1D',
  },
  headerBar: {
    backgroundColor: '#0A1C36',
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: '#16365C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  animeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  animePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  animeTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 0.8,
  },
  countBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.2,
    borderColor: '#38BDF8',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#38BDF8',
    lineHeight: 17,
  },
  countLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#BAE6FD',
    letterSpacing: 0.5,
  },
  filterSection: {
    paddingVertical: 10,
    backgroundColor: '#08172E',
    borderBottomWidth: 1,
    borderBottomColor: '#153052',
  },
  filterScroll: {
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0C203B',
    borderWidth: 1.2,
    borderColor: '#183863',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#38BDF8',
    elevation: 4,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  pillIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7EA1C4',
    letterSpacing: 0.5,
  },
  filterPillTextActive: {
    color: '#061325',
    fontWeight: '900',
  },
  pillBadge: {
    backgroundColor: '#122D52',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  pillBadgeActive: {
    backgroundColor: '#061325',
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7EA1C4',
  },
  pillBadgeTextActive: {
    color: '#38BDF8',
  },
  categorySubBanner: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.18)',
  },
  subBannerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 36,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
