import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
} from 'react-native';
import { BrainGameButton } from './BrainGameButton';

export interface BrainGameHintModalProps {
  visible: boolean;
  hintText: string;
  hintsRemaining: number;
  onClose: () => void;
}

export const BrainGameHintModal: React.FC<BrainGameHintModalProps> = ({
  visible,
  hintText,
  hintsRemaining,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>💡</Text>
          </View>
          <Text style={styles.titleText}>ADVENTURER'S HINT</Text>

          {/* Hint content bubble */}
          <View style={styles.hintBubble}>
            <Text style={styles.hintBodyText}>{hintText}</Text>
          </View>

          {/* Hint counter badge */}
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>
              🧭 {hintsRemaining} {hintsRemaining === 1 ? 'hint' : 'hints'} remaining this round
            </Text>
          </View>

          {/* Dismiss button */}
          <View style={styles.actionRow}>
            <BrainGameButton
              title="GOT IT! CONTINUE 🚀"
              onPress={onClose}
              variant="primary"
              size="md"
              style={styles.btn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 13, 26, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0E223D',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconText: {
    fontSize: 26,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  hintBubble: {
    width: '100%',
    backgroundColor: '#0A1B30',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    padding: 16,
    marginBottom: 14,
  },
  hintBodyText: {
    fontSize: 14,
    color: '#E0F2FE',
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  badgeRow: {
    marginBottom: 18,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8BACD1',
  },
  actionRow: {
    width: '100%',
  },
  btn: {
    width: '100%',
  },
});
