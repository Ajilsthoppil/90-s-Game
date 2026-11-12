import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import { MatchResultSnapshot } from '../../../types';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { getCompletedBingoLines } from '../rules/bingoRules';
import { BingoLineOverlay } from './BingoLineOverlay';

interface WinnerBoardModalProps {
  visible: boolean;
  snapshot: MatchResultSnapshot | null;
  onClose: () => void;
}

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

export const WinnerBoardModal: React.FC<WinnerBoardModalProps> = ({
  visible,
  snapshot,
  onClose,
}) => {
  const [gridDimensions, setGridDimensions] = useState<{ width: number; height: number } | null>(null);

  if (!snapshot) return null;

  const markedSet = new Set(snapshot.winningMarks || []);
  const winningLines = getCompletedBingoLines(snapshot.winningBoard, markedSet);

  const handleGridContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setGridDimensions({ width, height });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🏆 WINNER'S OFFICIAL BOARD</Text>
          <Text style={styles.winnerName}>
            {snapshot.winnerAvatar || '🎒'} {snapshot.winnerName} (#{snapshot.winnerId})
          </Text>
          <Text style={styles.matchMeta}>
            Match #{snapshot.matchNumber} • Completed in {snapshot.calledNumbers.length} total calls
          </Text>

          {/* Winning B-I-N-G-O Sequence Badges */}
          <View style={styles.patternRow}>
            {BINGO_LETTERS.map((letter, idx) => {
              const isDone = winningLines.length > idx;
              return (
                <View
                  key={`winner-pattern-${letter}`}
                  style={[styles.patternBadge, isDone ? styles.patternBadgeDone : undefined]}
                >
                  <Text style={[styles.patternBadgeText, isDone ? styles.patternBadgeTextDone : undefined]}>
                    {letter} {isDone ? '✓' : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 5x5 Grid Display with Actual Winning Line Overlay */}
          <ScrollView contentContainerStyle={styles.gridScroll}>
            <View style={styles.gridContainer} onLayout={handleGridContainerLayout}>
              {/* Header Row */}
              <View style={styles.headerRow}>
                {BINGO_LETTERS.map((letter) => (
                  <View key={`grid-h-${letter}`} style={styles.headerCell}>
                    <Text style={styles.headerText}>{letter}</Text>
                  </View>
                ))}
              </View>

              {/* Grid Rows */}
              {snapshot.winningBoard.map((row, r) => (
                <View key={`winner-row-${r}`} style={styles.gridRow}>
                  {row.map((num, c) => {
                    const isMarked = num !== null && markedSet.has(num);
                    return (
                      <View
                        key={`winner-cell-${r}-${c}`}
                        style={[
                          styles.cell,
                          isMarked && styles.cellMarked,
                        ]}
                      >
                        <Text style={[styles.cellText, isMarked && styles.cellTextMarked]}>
                          {num !== null ? num : ''}
                        </Text>
                        {isMarked && <Text style={styles.markOverlay}>✏️ ◯</Text>}
                      </View>
                    );
                  })}
                </View>
              ))}

              {/* Hand-Drawn Winning Completed Line Overlay */}
              <BingoLineOverlay
                gridWidth={gridDimensions?.width || 0}
                gridHeight={gridDimensions?.height || 0}
                completedLines={winningLines}
                animateNewLines={false}
              />
            </View>
          </ScrollView>

          <HandDrawnButton
            title="CLOSE"
            variant="secondary"
            onPress={onClose}
            size="medium"
            style={{ width: '100%', marginTop: 12 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: THEME.colors.borderDark,
    padding: 18,
    width: '100%',
    maxHeight: '90%',
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.maroon,
    letterSpacing: 1,
    marginBottom: 4,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 2,
  },
  matchMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.pencilLight,
    marginBottom: 10,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  patternBadge: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    alignItems: 'center',
  },
  patternBadgeDone: {
    backgroundColor: '#006633',
    borderColor: '#004D26',
  },
  patternBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.pencilLight,
  },
  patternBadgeTextDone: {
    color: '#FFFFFF',
  },
  gridScroll: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridContainer: {
    borderWidth: 2.5,
    borderColor: THEME.colors.pencil,
    backgroundColor: THEME.colors.paperLight,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.maroon,
    borderBottomWidth: 2,
    borderBottomColor: THEME.colors.pencil,
  },
  headerCell: {
    width: 54,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#A02020',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFD700',
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderColor: THEME.colors.notebookBlue,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: THEME.colors.paperCard,
  },
  cellMarked: {
    backgroundColor: '#F3EFE6',
  },
  cellText: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  cellTextMarked: {
    color: THEME.colors.pencilLight,
    textDecorationLine: 'line-through',
  },
  markOverlay: {
    position: 'absolute',
    fontSize: 22,
    opacity: 0.65,
    color: THEME.colors.pencil,
  },
});
