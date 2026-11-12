import React, { useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { GameDefinition } from '../games/types/game.types';

interface GameCardProps {
  game: GameDefinition;
  onPress: (game: GameDefinition) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const isAvailable = game.status === 'AVAILABLE';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 5,
      tension: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 200,
    }).start();
  };

  const isBrain = game.gameType === 'brain' || game.category === 'BRAIN';
  const isCard = game.category === 'CARD';
  const isBoard = game.category === 'BOARD';
  const isClassic = game.category === 'CLASSIC' || game.id === 'bingo';

  const themeColor = isBrain
    ? '#38BDF8'
    : isCard
    ? '#0EA5E9'
    : isBoard
    ? '#06B6D4'
    : '#3B82F6';

  const rarityBadge = isBrain
    ? { tag: 'SOLO', label: 'BRAIN PUZZLE' }
    : { tag: 'MULTI', label: 'MULTIPLAYER' };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.cardWrapper]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(game)}
        style={[
          styles.card,
          { borderColor: isAvailable ? themeColor : '#162E52' },
          isAvailable && styles.cardAvailable,
        ]}
      >
        {/* Top Tag & Header */}
        <View style={styles.topRarityRow}>
          <View style={[styles.rarityPill, { backgroundColor: themeColor }]}>
            <Text style={styles.rarityText}>{rarityBadge.tag}</Text>
          </View>
          <Text style={[styles.genreText, { color: themeColor }]}>
            {rarityBadge.label}
          </Text>
          <View style={{ flex: 1 }} />
          <View
            style={[
              styles.actionPill,
              { backgroundColor: isAvailable ? 'rgba(56, 189, 248, 0.12)' : '#0F213D' },
            ]}
          >
            <Text
              style={[
                styles.actionPillText,
                { color: isAvailable ? '#38BDF8' : '#64748B' },
              ]}
            >
              {isAvailable ? (isBrain ? 'SOLVE 🧠' : 'PLAY 🎮') : 'LOCKED 🔒'}
            </Text>
          </View>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.titleGroup}>
            <View
              style={[
                styles.emojiContainer,
                { borderColor: themeColor, backgroundColor: `${themeColor}18` },
              ]}
            >
              <Text style={styles.emoji}>{game.emoji}</Text>
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{game.title}</Text>
              {game.subtitle ? (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {game.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {game.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>
              👥 {game.minPlayers === game.maxPlayers ? `${game.minPlayers}P` : `${game.minPlayers}–${game.maxPlayers}P`}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>⚡ {game.difficulty || 'Normal'}</Text>
          </View>
          {game.estimatedDuration && (
            <View style={styles.metaChip}>
              <Text style={styles.metaText}>⏱️ {game.estimatedDuration}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    backgroundColor: '#0A1C36',
  },
  cardAvailable: {
    elevation: 4,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  topRarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rarityPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  rarityText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#050D1A',
    letterSpacing: 0.5,
  },
  genreText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  actionPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  actionPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emoji: {
    fontSize: 22,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#7DD3FC',
    fontWeight: '700',
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: '#BAE6FD',
    lineHeight: 17,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#16365C',
    paddingTop: 8,
  },
  metaChip: {
    backgroundColor: '#0D2548',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E487C',
    marginRight: 6,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#BAE6FD',
  },
});
