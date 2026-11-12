import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BingoProgress } from '../types/bingo.types';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';

interface BingoProgressBarProps {
  progress: BingoProgress;
  onClaimBingo: () => void;
  celebrationText?: string | null;
  phase: string;
}

export const BingoProgressBar: React.FC<BingoProgressBarProps> = ({
  progress,
  onClaimBingo,
  celebrationText,
  phase,
}) => {
  const letters: { letter: keyof Omit<BingoProgress, 'completedLinesCount'>; label: string }[] = [
    { letter: 'B', label: '1st Line' },
    { letter: 'I', label: '2nd Line' },
    { letter: 'N', label: '3rd Line' },
    { letter: 'G', label: '4th Line' },
    { letter: 'O', label: '5th Line' },
  ];

  const allCompleted = progress.B && progress.I && progress.N && progress.G && progress.O;

  return (
    <View style={styles.container}>
      {/* Toast celebration banner when a letter or BINGO ready completes */}
      {celebrationText ? (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{celebrationText}</Text>
        </View>
      ) : allCompleted ? (
        <View style={styles.readyBanner}>
          <Text style={styles.readyText}>🏆 BINGO READY!</Text>
        </View>
      ) : null}

      <Text style={styles.title}>SEQUENCE: B → I → N → G → O (5 LINES)</Text>

      <View style={styles.letterRow}>
        {letters.map(({ letter }) => {
          const isDone = progress[letter];
          return (
            <View
              key={letter}
              style={[
                styles.letterBox,
                isDone && styles.letterBoxDone,
              ]}
            >
              <Text style={[styles.letterChar, isDone && styles.letterCharDone]}>
                {letter}
              </Text>
              <Text style={[styles.statusIcon, isDone && styles.statusIconDone]}>
                {isDone ? '✓' : '○'}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.linesInfoRow}>
        <Text style={styles.linesInfoText}>
          Completed Lines: {progress.completedLinesCount} / 5
        </Text>
      </View>

      {/* Prominent BINGO Claim Button */}
      <HandDrawnButton
        title="# BINGO!"
        variant={allCompleted ? 'accent' : 'primary'}
        onPress={onClaimBingo}
        size="large"
        style={styles.claimBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    padding: 14,
    marginVertical: 10,
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  toastBanner: {
    backgroundColor: '#FFE5B4',
    borderWidth: 2,
    borderColor: THEME.colors.mustard,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.maroon,
  },
  readyBanner: {
    backgroundColor: THEME.colors.keralaGreen,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  readyText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 10,
    letterSpacing: 1,
  },
  letterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  letterBox: {
    width: 52,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.paperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBoxDone: {
    backgroundColor: THEME.colors.mustard,
    borderColor: THEME.colors.maroon,
  },
  letterChar: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.colors.pencilLight,
  },
  letterCharDone: {
    color: THEME.colors.pencil,
  },
  statusIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.disabled,
  },
  statusIconDone: {
    color: THEME.colors.maroon,
    fontWeight: '900',
  },
  linesInfoRow: {
    marginBottom: 12,
  },
  linesInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pencilLight,
  },
  claimBtn: {
    width: '100%',
  },
});
