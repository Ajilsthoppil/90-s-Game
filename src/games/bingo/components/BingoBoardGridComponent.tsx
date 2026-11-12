import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Pressable,
  LayoutChangeEvent,
} from 'react-native';
import { BingoBoardGrid, BingoProgress } from '../types/bingo.types';
import { MarkingStyle } from '../../../types';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { getCompletedBingoLines } from '../rules/bingoRules';
import { BingoLineOverlay } from './BingoLineOverlay';

interface BingoBoardGridComponentProps {
  grid: BingoBoardGrid;
  markedNumbers: Set<number>;
  calledNumbers: number[];
  markingStyle: MarkingStyle;
  onCellPress: (num: number) => void;
  feedbackMessage?: string | null;
  progress?: BingoProgress;
  celebrationText?: string | null;
  onClaimBingo?: () => void;
  selectedNumToCall?: number | null;
}

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

interface AnimatedCellProps {
  num: number;
  isMarked: boolean;
  isCalled: boolean;
  isCallSelection: boolean;
  markingStyle: MarkingStyle;
  onPress: () => void;
  highlightAnim: Animated.Value;
}

const AnimatedCell: React.FC<AnimatedCellProps> = ({
  num,
  isMarked,
  isCalled,
  isCallSelection,
  markingStyle,
  onPress,
  highlightAnim,
}) => {
  const markAnim = useRef(new Animated.Value(isMarked ? 1 : 0)).current;

  useEffect(() => {
    if (isMarked) {
      markAnim.setValue(0);
      Animated.spring(markAnim, {
        toValue: 1,
        friction: 5,
        tension: 90,
        useNativeDriver: true,
      }).start();
    } else {
      markAnim.setValue(0);
    }
  }, [isMarked]);

  const animatedOverlayStyle = {
    transform: [
      {
        scale: markAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.15, 1],
        }),
      },
      {
        rotate: markAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['-30deg', '-8deg'],
        }),
      },
    ],
    opacity: markAnim,
  };

  const cellBgColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isCallSelection
        ? '#FFE5B4'
        : isMarked
        ? markingStyle === 'pencil'
          ? '#F3EFE6'
          : '#E8F0FE'
        : isCalled
        ? '#FFF8D6'
        : THEME.colors.paperCard,
      '#FFD700', // Flash Gold during line completion
    ],
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.cell,
          { backgroundColor: cellBgColor },
          isCallSelection && styles.cellCallSelection,
          isCalled && !isMarked && !isCallSelection && styles.cellCalledAvailable,
          isMarked && (markingStyle === 'pencil' ? styles.cellMarkedPencil : styles.cellMarkedPen),
        ]}
      >
        <Text
          style={[
            styles.numberText,
            isCallSelection && styles.textCallSelection,
            isCalled && !isMarked && !isCallSelection && styles.textCalledAvailable,
            isMarked && (markingStyle === 'pencil' ? styles.textPencil : styles.textPen),
          ]}
        >
          {num}
        </Text>

        {isCallSelection && (
          <View style={styles.callBadge}>
            <Text style={styles.callBadgeIcon}>📞</Text>
          </View>
        )}

        {isMarked && (
          <Animated.View style={[styles.markOverlay, animatedOverlayStyle]}>
            {markingStyle === 'pencil' ? (
              <View style={styles.pencilStrokeContainer}>
                <Text style={styles.pencilCircle}>✏️ ◯</Text>
              </View>
            ) : (
              <View style={styles.penCrossContainer}>
                <Text style={styles.penCross}>🖊️ ✖</Text>
              </View>
            )}
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
};

export const BingoBoardGridComponent: React.FC<BingoBoardGridComponentProps> = ({
  grid,
  markedNumbers,
  calledNumbers,
  markingStyle,
  onCellPress,
  feedbackMessage,
  progress,
  celebrationText,
  onClaimBingo,
  selectedNumToCall,
}) => {
  const calledSet = new Set(calledNumbers);
  const animatedLinesRef = useRef<Set<string>>(new Set());
  const [gridDimensions, setGridDimensions] = useState<{ width: number; height: number } | null>(null);

  const handleGridContainerLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setGridDimensions({ width, height });
    }
  };

  // Matrix of animated values for cell line completion highlight flashes
  const cellAnims = useRef<Animated.Value[][]>(
    Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => new Animated.Value(0))
    )
  ).current;

  // Compute completed lines
  const completedBingoLines = getCompletedBingoLines(grid, markedNumbers);

  // Detect newly completed lines for cell flash animation
  useEffect(() => {
    const newlyCompleted = completedBingoLines.filter((l) => !animatedLinesRef.current.has(l.key));

    newlyCompleted.forEach((lineInfo, lineIdx) => {
      animatedLinesRef.current.add(lineInfo.key);
      const lineBaseDelay = lineIdx * 600;
      lineInfo.cells.forEach((cell, cellIdx) => {
        const r = cell.row;
        const c = cell.col;
        const cellDelay = lineBaseDelay + cellIdx * 100;
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(cellAnims[r][c], {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(cellAnims[r][c], {
              toValue: 0,
              duration: 400,
              useNativeDriver: false,
            }),
          ]).start();
        }, cellDelay);
      });
    });
  }, [completedBingoLines]);

  return (
    <View style={styles.container}>
      {/* Feedback Alert Toast */}
      {feedbackMessage ? (
        <View style={styles.feedbackBanner}>
          <Text style={styles.feedbackText}>⚠ {feedbackMessage}</Text>
        </View>
      ) : null}

      {/* Main Grid Container with Line Overlay */}
      <View style={styles.boardCard} onLayout={handleGridContainerLayout}>
        {/* Top Header Row B-I-N-G-O */}
        <View style={styles.headerRow}>
          {BINGO_LETTERS.map((letter) => (
            <View key={`grid-header-${letter}`} style={styles.headerCell}>
              <Text style={styles.headerText}>{letter}</Text>
            </View>
          ))}
        </View>

        {/* 5x5 Cell Grid */}
        {grid.map((row, r) => (
          <View key={`row-${r}`} style={styles.gridRow}>
            {row.map((num, c) => {
              if (num === null) {
                return (
                  <View key={`empty-cell-${r}-${c}`} style={styles.cellEmpty}>
                    <Text style={styles.emptyText}>-</Text>
                  </View>
                );
              }

              const isMarked = markedNumbers.has(num);
              const isCalled = calledSet.has(num);
              const isCallSelection = selectedNumToCall === num;

              return (
                <AnimatedCell
                  key={`cell-${r}-${c}-${num}`}
                  num={num}
                  isMarked={isMarked}
                  isCalled={isCalled}
                  isCallSelection={isCallSelection}
                  markingStyle={markingStyle}
                  onPress={() => onCellPress(num)}
                  highlightAnim={cellAnims[r][c]}
                />
              );
            })}
          </View>
        ))}

        {/* Hand-Drawn Completed Line Overlay */}
        <BingoLineOverlay
          gridWidth={gridDimensions?.width || 0}
          gridHeight={gridDimensions?.height || 0}
          completedLines={completedBingoLines}
          animateNewLines={true}
          markingStyle={markingStyle}
        />
      </View>

      {/* Embedded Progress & BINGO Claim Control */}
      {progress && onClaimBingo && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>SEQUENCE: B → I → N → G → O</Text>
            <Text style={styles.linesCountText}>Lines: {progress.completedLinesCount} / 5</Text>
          </View>

          {/* Pattern Badges */}
          <View style={styles.badgeRow}>
            {BINGO_LETTERS.map((letter) => {
              const isDone = Boolean(progress[letter as keyof Omit<BingoProgress, 'completedLinesCount'>]);
              return (
                <View
                  key={`progress-badge-${letter}`}
                  style={[
                    styles.badgeItem,
                    isDone && styles.badgeItemDone,
                  ]}
                >
                  <Text style={[styles.badgeText, isDone && styles.badgeTextDone]}>
                    {letter}
                  </Text>
                  <Text style={[styles.badgeStatus, isDone && styles.badgeStatusDone]}>
                    {isDone ? '✓' : '○'}
                  </Text>
                </View>
              );
            })}
          </View>

          {celebrationText ? (
            <View style={styles.toastBanner}>
              <Text style={styles.toastText}>{celebrationText}</Text>
            </View>
          ) : null}

          <HandDrawnButton
            title="# BINGO!"
            variant={progress.O ? 'accent' : 'primary'}
            onPress={onClaimBingo}
            size="large"
            style={styles.claimButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  feedbackBanner: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1.5,
    borderColor: THEME.colors.maroon,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 8,
    width: '100%',
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.maroon,
  },
  boardCard: {
    backgroundColor: THEME.colors.paperLight,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: THEME.colors.borderDark,
    padding: 6,
    position: 'relative',
    ...THEME.shadows.handDrawn,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerCell: {
    width: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.maroon,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 1,
  },
  gridRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  cell: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellCallSelection: {
    borderColor: THEME.colors.mustard,
    borderWidth: 2.5,
  },
  cellCalledAvailable: {
    borderColor: THEME.colors.keralaGreen,
    borderWidth: 2,
  },
  cellMarkedPencil: {
    borderColor: THEME.colors.pencil,
  },
  cellMarkedPen: {
    borderColor: THEME.colors.notebookBlue,
  },
  cellEmpty: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.colors.disabled,
    backgroundColor: THEME.colors.paperDarker,
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: THEME.colors.disabled,
  },
  numberText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  textCallSelection: {
    color: THEME.colors.maroon,
    fontWeight: '900',
  },
  textCalledAvailable: {
    color: THEME.colors.keralaGreen,
    fontWeight: '900',
  },
  textPencil: {
    color: THEME.colors.pencilLight,
    textDecorationLine: 'line-through',
  },
  textPen: {
    color: THEME.colors.notebookBlue,
    textDecorationLine: 'line-through',
  },
  callBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: THEME.colors.mustard,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  callBadgeIcon: {
    fontSize: 10,
  },
  markOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilStrokeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pencilCircle: {
    fontSize: 28,
    color: THEME.colors.pencil,
    opacity: 0.75,
  },
  penCrossContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  penCross: {
    fontSize: 26,
    color: THEME.colors.notebookBlue,
    opacity: 0.85,
  },
  progressContainer: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    padding: 12,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.pencil,
    letterSpacing: 0.5,
  },
  linesCountText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  badgeItem: {
    flex: 1,
    marginHorizontal: 2,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.paperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeItemDone: {
    backgroundColor: THEME.colors.mustard,
    borderColor: THEME.colors.maroon,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.pencilLight,
  },
  badgeTextDone: {
    color: THEME.colors.pencil,
  },
  badgeStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.disabled,
  },
  badgeStatusDone: {
    color: THEME.colors.maroon,
    fontWeight: '900',
  },
  toastBanner: {
    backgroundColor: '#FFE5B4',
    borderWidth: 1.5,
    borderColor: THEME.colors.mustard,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.maroon,
  },
  claimButton: {
    width: '100%',
  },
});
