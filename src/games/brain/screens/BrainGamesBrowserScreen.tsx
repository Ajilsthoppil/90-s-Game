import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { GameDefinition } from '../../types/game.types';
import { getAvailableGames } from '../../GameRegistry';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { GameDetailModal } from '../../../components/GameDetailModal';

interface BrainGamesBrowserScreenProps {
  onSelectBrainGame: (gameId: string) => void;
  onBackToHome: () => void;
}

type BrainCategory = 'ALL' | 'LOGIC' | 'WORDS' | 'NUMBERS' | 'MEMORY' | 'VISUAL';

export const BrainGamesBrowserScreen: React.FC<BrainGamesBrowserScreenProps> = ({
  onSelectBrainGame,
  onBackToHome,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BrainCategory>('ALL');
  const [selectedGame, setSelectedGame] = useState<GameDefinition | null>(null);

  const brainGames = getAvailableGames().filter(
    (g) => g.gameType === 'brain' || g.mode === 'SINGLE_PLAYER'
  );

  const categories: BrainCategory[] = ['ALL', 'LOGIC', 'WORDS', 'NUMBERS', 'MEMORY', 'VISUAL'];

  const filteredGames = brainGames.filter((g) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'LOGIC') return ['circuit_connect', 'sudoku', 'pattern_complete', 'maze'].includes(g.id);
    if (selectedCategory === 'WORDS') return ['word_fill', 'word_puzzle', 'word_connect'].includes(g.id);
    if (selectedCategory === 'NUMBERS') return ['sudoku', 'number_puzzles', 'sliding_puzzle'].includes(g.id);
    if (selectedCategory === 'MEMORY') return ['memory_match', 'tile_connect'].includes(g.id);
    if (selectedCategory === 'VISUAL') return ['visual_diff', 'tile_connect', 'circuit_connect'].includes(g.id);
    return true;
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topHeaderBar}>
          <Pressable onPress={onBackToHome} style={styles.backBtn}>
            <Text style={styles.backBtnText}>⬅️ Home</Text>
          </Pressable>
          <Text style={styles.headerTitle}>BRAIN GAMES 🧠</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Subtitle Banner */}
        <View style={styles.subtitleBanner}>
          <Text style={styles.bannerText}>"Train your memory, logic & vocabulary!"</Text>
          <Text style={styles.bannerSubText}>100% Single Player • Play against the puzzle</Text>
        </View>

        {/* Category Horizontal Filter Pills */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Puzzle Cards List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {filteredGames.map((game) => (
            <View key={game.id} style={styles.gameCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.gameIcon}>{game.icon}</Text>
                <View style={styles.gameTextCol}>
                  <Text style={styles.gameTitle}>{game.name}</Text>
                  <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.diffBadge}>⚡ {game.difficulty || 'Medium'}</Text>
                    <Text style={styles.timeBadge}>⏱️ {game.estimatedTime || '5 min'}</Text>
                    <Text style={styles.spBadge}>👤 Single Player</Text>
                  </View>
                </View>
              </View>

              <HandDrawnButton
                title="PLAY PUZZLE 🧠"
                variant="primary"
                onPress={() => onSelectBrainGame(game.id)}
                style={styles.playBtn}
              />
            </View>
          ))}
        </ScrollView>

        {/* Detail Modal */}
        <GameDetailModal
          visible={!!selectedGame}
          game={selectedGame}
          onPlayWithSystem={() => {
            const id = selectedGame?.id || 'circuit_connect';
            setSelectedGame(null);
            onSelectBrainGame(id);
          }}
          onCreateRoom={() => {}}
          onJoinRoom={() => {}}
          onClose={() => setSelectedGame(null)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: THEME.colors.paperDarker,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.paper,
  },
  topHeaderBar: {
    backgroundColor: THEME.colors.paperLight,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: THEME.colors.cyanBright,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 1,
  },
  subtitleBanner: {
    backgroundColor: THEME.colors.paperLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.maroon,
  },
  bannerSubText: {
    fontSize: 10,
    color: THEME.colors.pencilGrey,
    marginTop: 2,
    fontWeight: '600',
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: THEME.colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.borderDark,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1,
    borderColor: THEME.colors.pencilLight,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: THEME.colors.cyanBright,
    borderColor: THEME.colors.cyanGlow,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  gameCard: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    ...THEME.shadows.handDrawn,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gameIcon: {
    fontSize: 36,
  },
  gameTextCol: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.ink,
  },
  gameSubtitle: {
    fontSize: 11,
    color: THEME.colors.pencilGrey,
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  diffBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.maroon,
    backgroundColor: '#FFE6E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.pencil,
    backgroundColor: THEME.colors.paperLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  spBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.keralaGreen,
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playBtn: {
    width: '100%',
  },
});
