import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { BrainGameButton } from './BrainGameButton';

export interface BrainGamePauseModalProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const BrainGamePauseModal: React.FC<BrainGamePauseModalProps> = ({
  visible,
  onResume,
  onRestart,
  onHome,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onResume}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⏸️</Text>
            </View>
            <Text style={styles.titleText}>EXPEDITION PAUSED</Text>
            <Text style={styles.subtitleText}>Take a breath, adventurer! Your progress is safe.</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsCol}>
            <BrainGameButton
              title="RESUME GAME"
              icon="▶️"
              onPress={onResume}
              variant="primary"
              size="lg"
            />

            <BrainGameButton
              title="RESTART PUZZLE"
              icon="🔄"
              onPress={onRestart}
              variant="secondary"
              size="md"
            />

            <BrainGameButton
              title={soundEnabled ? 'SOUND: ON 🔊' : 'SOUND: MUTED 🔇'}
              onPress={onToggleSound}
              variant="ghost"
              size="md"
            />

            <BrainGameButton
              title="RETURN TO HOME 🏠"
              onPress={onHome}
              variant="ghost"
              size="md"
              style={styles.exitBtn}
              textStyle={styles.exitBtnText}
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
    borderColor: '#1C3F69',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 26,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  subtitleText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  actionsCol: {
    width: '100%',
    gap: 10,
  },
  exitBtn: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  exitBtnText: {
    color: '#F87171',
  },
});
