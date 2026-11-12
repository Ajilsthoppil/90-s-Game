import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { GameDefinition } from '../games/types/game.types';
import { THEME } from '../theme/theme';
import { HandDrawnButton } from './HandDrawnButton';

interface GamePreviewModalProps {
  visible: boolean;
  game: GameDefinition | null;
  onPlayWithSystem: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onClose: () => void;
}

export const GamePreviewModal: React.FC<GamePreviewModalProps> = ({
  visible,
  game,
  onPlayWithSystem,
  onCreateRoom,
  onJoinRoom,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!game) return null;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiBig}>{game.emoji}</Text>
          </View>
          <Text style={styles.title}>{game.title.toUpperCase()}</Text>
          {game.subtitle ? (
            <Text style={styles.subtitle}>⚡ {game.subtitle}</Text>
          ) : null}

          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>🎮 READY FOR MATCH</Text>
          </View>

          <Text style={styles.nostalgiaQuote}>
            {game.nostalgiaText || '"Classic paper rules, high-tech anime battle!"'}
          </Text>

          <Text style={styles.description}>{game.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>👥 {game.minPlayers}–{game.maxPlayers} PLAYERS</Text>
            </View>
            {game.estimatedDuration && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>⏱️ {game.estimatedDuration}</Text>
              </View>
            )}
          </View>

          <HandDrawnButton
            title="PLAY VS SYSTEM (BOTS)"
            icon="🤖"
            variant="primary"
            onPress={onPlayWithSystem}
            size="large"
            style={styles.systemBtn}
          />

          <View style={styles.actionRow}>
            <HandDrawnButton
              title="CREATE ROOM"
              icon="🏠"
              variant="accent"
              onPress={onCreateRoom}
              size="medium"
              style={{ flex: 1 }}
            />
            <HandDrawnButton
              title="JOIN ROOM"
              icon="⚔️"
              variant="secondary"
              onPress={onJoinRoom}
              size="medium"
              style={{ flex: 1 }}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.closeLinkBtn,
              pressed && styles.closeLinkBtnPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.closeLinkText}>CLOSE ARENA</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: THEME.colors.cyanBright,
    padding: 22,
    alignItems: 'center',
    ...THEME.shadows.neonGlowCyan,
  },
  emojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 2,
    borderColor: THEME.colors.cyanBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...THEME.shadows.neonGlowCyan,
  },
  emojiBig: {
    fontSize: 38,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 1.2,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.pinkBright,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 10,
  },
  availableBadge: {
    backgroundColor: THEME.colors.purpleGlow,
    borderColor: THEME.colors.purpleBright,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  availableText: {
    color: THEME.colors.purpleBright,
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  nostalgiaQuote: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: THEME.colors.goldBright,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  description: {
    fontSize: 13.5,
    color: THEME.colors.pencil,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  metaChip: {
    backgroundColor: THEME.colors.paperLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: THEME.colors.paperBorder,
  },
  metaChipText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: THEME.colors.pencilGrey,
    letterSpacing: 0.5,
  },
  systemBtn: {
    width: '100%',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 14,
  },
  closeLinkBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeLinkBtnPressed: {
    opacity: 0.7,
  },
  closeLinkText: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.pinkBright,
    letterSpacing: 1,
  },
});
