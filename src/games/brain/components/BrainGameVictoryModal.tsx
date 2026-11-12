import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
} from 'react-native';
import { BrainGameButton } from './BrainGameButton';
import { VocabularyWord } from '../engine/BrainEngines';

export interface BrainGameVictoryModalProps {
  visible: boolean;
  score: number;
  timeSeconds: number;
  moves: number;
  mistakes: number;
  hintsUsed?: number;
  level?: number;
  nextLevel?: number;
  activeVocab?: VocabularyWord | null;
  onNextLevel?: () => void;
  onReplayLevel?: () => void;
  onPlayAgain?: () => void; // backwards compatible fallback
  onHome: () => void;
}

export const BrainGameVictoryModal: React.FC<BrainGameVictoryModalProps> = ({
  visible,
  score,
  timeSeconds,
  moves,
  mistakes,
  hintsUsed = 0,
  level = 1,
  nextLevel = level + 1,
  activeVocab,
  onNextLevel,
  onReplayLevel,
  onPlayAgain,
  onHome,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleNext = onNextLevel || onPlayAgain || (() => {});
  const handleReplay = onReplayLevel || onPlayAgain || (() => {});

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onHome}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Trophy Crest */}
          <View style={styles.trophyCrest}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>

          <Text style={styles.titleText}>LEVEL {level} COMPLETE!</Text>
          <Text style={styles.subtitleText}>
            Brilliant deduction, adventurer! Level {level} conquered.
          </Text>

          {/* Stats Quad Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LEVEL</Text>
              <Text style={[styles.statVal, styles.levelVal]}>{level}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>POINTS</Text>
              <Text style={[styles.statVal, styles.pointsVal]}>{score}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statVal}>{formatTime(timeSeconds)}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MOVES</Text>
              <Text style={styles.statVal}>{moves}</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ERRORS</Text>
              <Text style={[styles.statVal, mistakes > 0 ? styles.mistakeVal : null]}>
                {mistakes}
              </Text>
            </View>
          </View>

          {/* Hints Used Note */}
          {hintsUsed > 0 && (
            <View style={styles.hintNoticeRow}>
              <Text style={styles.hintNoticeText}>💡 {hintsUsed} hint{hintsUsed > 1 ? 's' : ''} utilized</Text>
            </View>
          )}

          {/* Vocabulary Discovery Card: Only for Word Games with activeVocab */}
          {activeVocab ? (
            <View style={styles.vocabCard}>
              <View style={styles.vocabTagRow}>
                <Text style={styles.vocabTag}>📖 WORD MASTERED</Text>
              </View>
              <Text style={styles.vocabWord}>{activeVocab.word}</Text>
              <Text style={styles.vocabMeaning}>"{activeVocab.meaning}"</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionsCol}>
            <BrainGameButton
              title={`NEXT LEVEL (${nextLevel}) 🚀`}
              onPress={handleNext}
              variant="primary"
              size="lg"
            />

            <BrainGameButton
              title={`REPLAY LEVEL ${level} 🔄`}
              onPress={handleReplay}
              variant="ghost"
              size="md"
            />

            <BrainGameButton
              title="RETURN TO GAMES ⬅️"
              onPress={onHome}
              variant="ghost"
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
    backgroundColor: 'rgba(5, 13, 26, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0E223D',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F59E0B',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  trophyCrest: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  trophyEmoji: {
    fontSize: 30,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#0A1B30',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    paddingVertical: 10,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#8BACD1',
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: 2,
  },
  levelVal: {
    color: '#38BDF8',
  },
  pointsVal: {
    color: '#FBBF24',
  },
  mistakeVal: {
    color: '#EF4444',
  },
  hintNoticeRow: {
    marginBottom: 10,
  },
  hintNoticeText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  vocabCard: {
    width: '100%',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  vocabTagRow: {
    marginBottom: 2,
  },
  vocabTag: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  vocabWord: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  vocabMeaning: {
    fontSize: 11,
    color: '#CBD5E1',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  actionsCol: {
    width: '100%',
    gap: 8,
  },
});
