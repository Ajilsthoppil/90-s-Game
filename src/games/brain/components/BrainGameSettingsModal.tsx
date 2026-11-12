import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
} from 'react-native';
import { BrainGameButton } from './BrainGameButton';

export interface BrainGameSettingsModalProps {
  visible: boolean;
  gameTitle: string;
  instructions: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRestart: () => void;
  onClose: () => void;
}

export const BrainGameSettingsModal: React.FC<BrainGameSettingsModalProps> = ({
  visible,
  gameTitle,
  instructions,
  soundEnabled,
  onToggleSound,
  onRestart,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚙️</Text>
            </View>
            <Text style={styles.titleText}>{gameTitle.toUpperCase()}</Text>
            <Text style={styles.subtitleText}>Rules & Adventure Settings</Text>
          </View>

          {/* Rules Section */}
          <ScrollView style={styles.rulesScroll} contentContainerStyle={styles.rulesContent}>
            <Text style={styles.rulesHeading}>HOW TO PLAY:</Text>
            <Text style={styles.rulesBody}>{instructions}</Text>
          </ScrollView>

          {/* Settings Row */}
          <View style={styles.optionsSection}>
            <BrainGameButton
              title={soundEnabled ? 'AUDIO EFFECTS: ON 🔊' : 'AUDIO EFFECTS: OFF 🔇'}
              onPress={onToggleSound}
              variant="secondary"
              size="md"
            />

            <BrainGameButton
              title="RESTART PUZZLE 🔄"
              onPress={() => {
                onClose();
                onRestart();
              }}
              variant="ghost"
              size="md"
            />
          </View>

          {/* Close Action */}
          <View style={styles.closeRow}>
            <BrainGameButton
              title="RETURN TO GAME 🎮"
              onPress={onClose}
              variant="primary"
              size="md"
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
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: '#0E223D',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1C3F69',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 22,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  subtitleText: {
    fontSize: 11,
    color: '#8BACD1',
    marginTop: 2,
  },
  rulesScroll: {
    width: '100%',
    backgroundColor: '#0A1B30',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#193557',
    padding: 12,
    marginBottom: 14,
    maxHeight: 140,
  },
  rulesContent: {
    paddingBottom: 4,
  },
  rulesHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  rulesBody: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    fontWeight: '500',
  },
  optionsSection: {
    width: '100%',
    gap: 8,
    marginBottom: 12,
  },
  closeRow: {
    width: '100%',
  },
});
