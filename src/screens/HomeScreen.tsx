import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { GameSettings, PlayerProfile } from '../types';
import { GameDefinition } from '../games/types/game.types';
import { getAvailableGames, getGameById } from '../games/GameRegistry';
import { localGameRepository, DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../storage/LocalGameRepository';
import { MainCategoryFilter } from './GamesScreen';

interface HomeScreenProps {
  onSelectGame: (gameId: string, playMode: 'SYSTEM' | 'CREATE' | 'JOIN') => void;
  onNavigateTab: (tab: 'GAMES' | 'PROFILE', category?: MainCategoryFilter) => void;
}

interface CategoryCardItem {
  id: MainCategoryFilter;
  title: string;
  subtitle: string;
  icon: string;
  count: string;
  color: string;
  glowColor: string;
  tag: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectGame, onNavigateTab }) => {
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  // Animations
  const heroGlowAnim = useRef(new Animated.Value(0.7)).current;

  const availableGames = getAvailableGames();
  const featuredGame = getGameById('ludo') || availableGames[0];

  useEffect(() => {
    loadData();

    // Continuous Marine Hero pulsing aura
    Animated.loop(
      Animated.sequence([
        Animated.timing(heroGlowAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(heroGlowAnim, {
          toValue: 0.7,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    const loadedProfile = await localGameRepository.getProfile();
    const loadedSettings = await localGameRepository.getSettings();
    setProfile(loadedProfile);
    setSettings(loadedSettings);
  };

  const categories: CategoryCardItem[] = [
    {
      id: 'CARD GAMES',
      title: 'Card Arena',
      subtitle: 'UNO • Phase 10',
      icon: '🃏',
      count: '2 GAMES',
      color: '#38BDF8', // Sky Blue
      glowColor: 'rgba(56, 189, 248, 0.16)',
      tag: 'CARDS',
    },
    {
      id: 'BOARD GAMES',
      title: 'Board Guild',
      subtitle: 'Ludo • Snakes',
      icon: '🎲',
      count: '2 BOARDS',
      color: '#0EA5E9', // Ocean Azure
      glowColor: 'rgba(14, 165, 233, 0.16)',
      tag: 'BOARDS',
    },
    {
      id: 'CLASSIC GAMES',
      title: 'Classic Retro',
      subtitle: 'Bingo 5×5',
      icon: '🎟️',
      count: '1 RETRO',
      color: '#14B8A6', // Oceanic Teal
      glowColor: 'rgba(20, 184, 166, 0.16)',
      tag: 'CLASSIC',
    },
    {
      id: 'BRAIN GAMES',
      title: 'Brain Academy',
      subtitle: '12 IQ Puzzles',
      icon: '🧠',
      count: '12 PUZZLES',
      color: '#60A5FA', // Marine Cobalt
      glowColor: 'rgba(96, 165, 250, 0.16)',
      tag: 'BRAIN',
    },
  ];

  const recentGames = [
    getGameById('ludo'),
    getGameById('uno'),
    getGameById('sudoku'),
    getGameById('snakes_ladders'),
  ].filter(Boolean) as GameDefinition[];

  // Animated Category Card Component
  const CategoryCardButton: React.FC<{ item: CategoryCardItem }> = ({ item }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scale, {
        toValue: 0.94,
        useNativeDriver: true,
        friction: 6,
        tension: 300,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 220,
      }).start();
    };

    return (
      <Animated.View style={[{ transform: [{ scale }] }, styles.categoryCardWrapper]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onNavigateTab('GAMES', item.id)}
          style={[
            styles.categoryCard,
            { borderColor: item.color, backgroundColor: '#0C203B' },
          ]}
        >
          {/* Top Row: Tag + Count */}
          <View style={styles.catTopRow}>
            <View style={[styles.tagBadge, { backgroundColor: item.color }]}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
            <Text style={[styles.catCountText, { color: item.color }]}>{item.count}</Text>
          </View>

          {/* Centered Emoji */}
          <View style={[styles.catIconCircle, { borderColor: item.color, backgroundColor: item.glowColor }]}>
            <Text style={styles.catIconText}>{item.icon}</Text>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.catTitleText}>{item.title}</Text>
          <Text style={styles.catSubtitleText} numberOfLines={1}>
            {item.subtitle}
          </Text>

          {/* Enter Pill */}
          <View style={[styles.enterPill, { borderColor: item.color }]}>
            <Text style={[styles.enterPillText, { color: item.color }]}>PLAY NOW ➔</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#060E1D" />
      <View style={styles.container}>
        {/* Top Marine Header Bar */}
        <View style={styles.topHudBar}>
          <View>
            <View style={styles.appBadgeRow}>
              <View style={styles.marineDot} />
              <Text style={styles.appBadgeText}>RETRO ARCADE</Text>
            </View>
            <Text style={styles.appName}>CHILDHOOD GAMES</Text>
          </View>

          {/* Profile Header Button */}
          <Pressable
            onPress={() => onNavigateTab('PROFILE')}
            style={styles.avatarButton}
          >
            <View style={styles.avatarRing}>
              <Text style={styles.avatarEmoji}>{profile.avatar || '🎒'}</Text>
            </View>
            <View style={styles.profileBadgePill}>
              <Text style={styles.profileBadgeText}>PROFILE</Text>
            </View>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Clean Marine Welcome Card (No levels, no points clutter) */}
          <View style={styles.welcomeCard}>
            <View style={styles.welcomeRow}>
              <View style={styles.welcomeAvatarCircle}>
                <Text style={styles.welcomeAvatarEmoji}>{profile.avatar || '🎒'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.welcomeGreeting}>WELCOME BACK</Text>
                <Text style={styles.welcomeName}>{profile.name || 'Player'}</Text>
                <Text style={styles.welcomeSubtitle}>Pick any classic game to play with friends or bots</Text>
              </View>
            </View>

            <View style={styles.welcomePillsRow}>
              <View style={styles.featurePill}>
                <Text style={styles.featurePillIcon}>🎮</Text>
                <Text style={styles.featurePillText}>17 Games</Text>
              </View>
              <View style={styles.featurePill}>
                <Text style={styles.featurePillIcon}>📶</Text>
                <Text style={styles.featurePillText}>Hotspot Ready</Text>
              </View>
              <View style={styles.featurePill}>
                <Text style={styles.featurePillIcon}>🤖</Text>
                <Text style={styles.featurePillText}>Smart Bots</Text>
              </View>
            </View>
          </View>

          {/* Featured Hero Banner with Marine Glow */}
          {featuredGame && (
            <Animated.View
              style={[
                styles.featuredHeroWrapper,
                {
                  opacity: heroGlowAnim,
                },
              ]}
            >
              <View style={styles.featuredHeroCard}>
                <View style={styles.featuredBadgeRow}>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>★ FEATURED GAME</Text>
                  </View>
                  <View style={styles.liveIndicator}>
                    <View style={styles.livePulse} />
                    <Text style={styles.liveText}>MULTIPLAYER</Text>
                  </View>
                </View>

                <View style={styles.featuredContentRow}>
                  <View style={styles.heroEmojiCircle}>
                    <Text style={styles.heroEmojiText}>{featuredGame.icon}</Text>
                  </View>

                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroGameTitle}>{featuredGame.name}</Text>
                    <Text style={styles.heroGameSub}>
                      {featuredGame.subtitle || 'Classic 4-Player Token Race'}
                    </Text>
                  </View>
                </View>

                <View style={styles.featuredActionRow}>
                  <View style={styles.heroMetaPills}>
                    <View style={styles.heroPill}>
                      <Text style={styles.heroPillText}>👥 2–4 PLAYERS</Text>
                    </View>
                    <View style={styles.heroPill}>
                      <Text style={styles.heroPillText}>⚡ PASS & PLAY</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => onSelectGame(featuredGame.id, 'SYSTEM')}
                    style={styles.battleStartBtn}
                  >
                    <Text style={styles.battleStartText}>PLAY NOW ➔</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Game Categories 4 Marine Pillars */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLine} />
            <Text style={styles.sectionHeaderTitle}>GAME CATEGORIES</Text>
            <View style={styles.sectionHeaderLine} />
          </View>
          <Text style={styles.sectionSubtitle}>Tap a category to explore games</Text>

          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <CategoryCardButton key={cat.id} item={cat} />
            ))}
          </View>

          {/* Recent Missions Deck */}
          <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
            <View style={styles.sectionHeaderLine} />
            <Text style={styles.sectionHeaderTitle}>RECENT GAMES</Text>
            <View style={styles.sectionHeaderLine} />
          </View>
          <View style={styles.recentSubRow}>
            <Text style={styles.sectionSubtitle}>Quick launch your favorites</Text>
            <Pressable onPress={() => onNavigateTab('GAMES', 'ALL')}>
              <Text style={styles.seeAllText}>VIEW ALL ➔</Text>
            </Pressable>
          </View>

          <View style={styles.recentGrid}>
            {recentGames.map((game) => {
              const isBrain = game.gameType === 'brain' || game.category === 'BRAIN';
              const cardColor = isBrain ? '#60A5FA' : '#38BDF8';
              return (
                <Pressable
                  key={game.id}
                  onPress={() => onSelectGame(game.id, 'SYSTEM')}
                  style={[styles.recentTile, { borderColor: cardColor }]}
                >
                  <View style={[styles.recentIconBox, { backgroundColor: `${cardColor}22` }]}>
                    <Text style={styles.recentEmoji}>{game.icon}</Text>
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {game.shortTitle || game.name}
                    </Text>
                    <Text style={[styles.recentTag, { color: cardColor }]}>
                      {isBrain ? 'BRAIN PUZZLE' : 'MULTIPLAYER'}
                    </Text>
                  </View>
                  <View style={[styles.recentPlayPill, { backgroundColor: cardColor }]}>
                    <Text style={styles.recentPlayText}>▶</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
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
  topHudBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0A1C36',
    borderBottomWidth: 1.2,
    borderBottomColor: '#16365C',
  },
  appBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  marineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1.5,
  },
  appName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 0.8,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E274A',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#1D4A7D',
  },
  avatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#163863',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  profileBadgePill: {
    paddingRight: 4,
  },
  profileBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
  },
  welcomeCard: {
    backgroundColor: '#0C203B',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#1E4472',
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#13335A',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeAvatarEmoji: {
    fontSize: 22,
  },
  welcomeGreeting: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  welcomeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F0F9FF',
    marginTop: 1,
  },
  welcomeSubtitle: {
    fontSize: 10.5,
    color: '#94B4D6',
    marginTop: 2,
  },
  welcomePillsRow: {
    flexDirection: 'row',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#17365C',
    paddingTop: 10,
  },
  featurePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091A30',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#163962',
  },
  featurePillIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  featurePillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#BAE6FD',
  },
  featuredHeroWrapper: {
    marginBottom: 16,
  },
  featuredHeroCard: {
    backgroundColor: '#0A1C36',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    elevation: 6,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  featuredBadge: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#061325',
    letterSpacing: 0.8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#14B8A6',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#14B8A6',
    marginRight: 4,
  },
  liveText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#2DD4BF',
  },
  featuredContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroEmojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroEmojiText: {
    fontSize: 28,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroGameTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroGameSub: {
    fontSize: 11,
    color: '#94B4D6',
    fontWeight: '600',
    marginTop: 2,
  },
  featuredActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#17365C',
    paddingTop: 10,
  },
  heroMetaPills: {
    flexDirection: 'row',
  },
  heroPill: {
    backgroundColor: '#0D2442',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#1C4573',
  },
  heroPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94B4D6',
  },
  battleStartBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    elevation: 3,
  },
  battleStartText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#061325',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#16365C',
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E0F2FE',
    letterSpacing: 1.2,
    marginHorizontal: 10,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: '#7EA1C4',
    textAlign: 'center',
    marginBottom: 10,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCardWrapper: {
    width: '48.5%',
    marginBottom: 10,
  },
  categoryCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 12,
    alignItems: 'center',
  },
  catTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagBadge: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#061325',
  },
  catCountText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  catIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  catIconText: {
    fontSize: 22,
  },
  catTitleText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
  catSubtitleText: {
    fontSize: 9.5,
    color: '#8BACD1',
    marginTop: 2,
    textAlign: 'center',
  },
  enterPill: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  enterPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  recentSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  recentGrid: {
    gap: 8,
  },
  recentTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C203B',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 10,
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recentEmoji: {
    fontSize: 20,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F0F9FF',
  },
  recentTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  recentPlayPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentPlayText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#061325',
    marginLeft: 2,
  },
});
