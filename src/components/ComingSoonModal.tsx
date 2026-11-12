import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable } from 'react-native';
import { GameDefinition } from '../games/types/game.types';
import { THEME } from '../theme/theme';
import { HandDrawnButton } from './HandDrawnButton';

interface ComingSoonModalProps {
  visible: boolean;
  game: GameDefinition | null;
  onClose: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  visible,
  game,
  onClose,
}) => {
  if (!game) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiBig}>{game.emoji}</Text>
          </View>
          <Text style={styles.title}>{game.title.toUpperCase()}</Text>
          {game.subtitle ? (
            <Text style={styles.subtitle}>⚡ {game.subtitle}</Text>
          ) : null}

          <View style={styles.badge}>
            <Text style={styles.badgeText}>🔒 COMING SOON IN V2.0</Text>
          </View>

          <Text style={styles.nostalgiaQuote}>
            {game.nostalgiaText || '"Classic paper childhood game currently in anime forge!"'}
          </Text>

          <Text style={styles.description}>{game.description}</Text>

          <HandDrawnButton
            title="BACK TO HUB"
            icon="←"
            variant="secondary"
            onPress={onClose}
            size="medium"
            style={styles.backBtn}
          />
        </View>
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
    borderColor: THEME.colors.purpleBright,
    padding: 24,
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  emojiCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.purpleBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emojiBig: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.ink,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.colors.pinkBright,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1,
    borderColor: THEME.colors.gold,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: THEME.colors.gold,
    letterSpacing: 0.8,
  },
  nostalgiaQuote: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: THEME.colors.cyanBright,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 13.5,
    color: THEME.colors.pencil,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backBtn: {
    width: '100%',
  },
});
