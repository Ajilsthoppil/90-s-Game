import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { BingoBoardGrid } from '../types/bingo.types';
import { validateBoardNumbers } from '../rules/bingoRules';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';

interface ManualNumberEntryProps {
  grid: BingoBoardGrid;
  maxNumber?: number;
  onGridChange: (newGrid: BingoBoardGrid) => void;
  onGenerateRandom: () => void;
  onConfirmBoard: () => void;
}

export const ManualNumberEntry: React.FC<ManualNumberEntryProps> = ({
  grid,
  maxNumber = 25,
  onGridChange,
  onGenerateRandom,
  onConfirmBoard,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(
    { r: 0, c: 0 }
  );

  const validation = validateBoardNumbers(grid, maxNumber);

  // Helper to place a number in the currently selected cell
  const handleSelectNumber = (num: number) => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;

    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = num;
    onGridChange(newGrid);

    // Auto move to next empty cell or next cell
    let nextR = r;
    let nextC = c + 1;
    if (nextC >= 5) {
      nextC = 0;
      nextR = (r + 1) % 5;
    }
    setSelectedCell({ r: nextR, c: nextC });
  };

  const handleClearCell = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = null;
    onGridChange(newGrid);
  };

  // Check if a number 1-25 is already placed on the board
  const placedNumbers = new Set<number>();
  grid.forEach((row) => {
    row.forEach((num) => {
      if (num !== null) placedNumbers.add(num);
    });
  });

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>✏️ Board Setup (Manual Entry)</Text>
      <Text style={styles.headerSubtitle}>
        Tap a box on your 5×5 notebook paper and enter numbers 1 to 25.
      </Text>

      {/* 5x5 Interactive Grid */}
      <View style={styles.boardGrid}>
        {grid.map((row, r) => (
          <View key={`row-${r}`} style={styles.gridRow}>
            {row.map((val, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              const isDuplicate =
                val !== null && validation.duplicateNumbers.includes(val);

              return (
                <Pressable
                  key={`cell-${r}-${c}`}
                  onPress={() => setSelectedCell({ r, c })}
                  style={[
                    styles.cell,
                    isSelected && styles.selectedCell,
                    isDuplicate && styles.duplicateCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      isSelected && styles.selectedCellText,
                      isDuplicate && styles.duplicateCellText,
                    ]}
                  >
                    {val !== null ? val : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Validation status badge */}
      <View style={[styles.statusBox, validation.isValid ? styles.statusBoxValid : styles.statusBoxError]}>
        {validation.isValid ? (
          <Text style={styles.validStatusText}>
            ✓ Board Complete! Ready to confirm.
          </Text>
        ) : (
          <Text style={styles.errorStatusText}>
            {validation.formattedAlertMessage || 'Fill all 25 numbers cleanly.'}
          </Text>
        )}
      </View>

      {/* Numpad Selector 1..maxNumber */}
      <Text style={styles.numpadLabel}>Select Number for Box (1–{maxNumber}):</Text>
      <ScrollView style={styles.numpadScroll} nestedScrollEnabled>
        <View style={styles.numpadGrid}>
          {Array.from({ length: maxNumber }, (_, i) => i + 1).map((n) => {
            const isUsed = placedNumbers.has(n);
            return (
              <Pressable
                key={`num-${n}`}
                onPress={() => handleSelectNumber(n)}
                style={[styles.numKey, isUsed && styles.numKeyUsed]}
              >
                <Text style={[styles.numKeyText, isUsed && styles.numKeyTextUsed]}>
                  {n}
                </Text>
              </Pressable>
            );
          })}
          <Pressable onPress={handleClearCell} style={styles.clearKey}>
            <Text style={styles.clearKeyText}>Clear</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <HandDrawnButton
          title="🎲 Random Board"
          variant="secondary"
          onPress={onGenerateRandom}
          size="small"
          style={{ flex: 1, marginRight: 6 }}
        />
        <HandDrawnButton
          title="✏️ CONFIRM BOARD"
          variant={validation.isValid ? 'primary' : 'disabled'}
          disabled={!validation.isValid}
          onPress={onConfirmBoard}
          size="small"
          style={{ flex: 1.2, marginLeft: 6 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 10,
    padding: 14,
    marginVertical: 10,
    ...THEME.shadows.handDrawn,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.pencilLight,
    marginBottom: 12,
  },
  boardGrid: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.pencil,
    backgroundColor: THEME.colors.paperLight,
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: THEME.colors.notebookBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.paperCard,
  },
  selectedCell: {
    backgroundColor: '#FFF2C6',
    borderColor: THEME.colors.maroon,
    borderWidth: 2,
  },
  duplicateCell: {
    backgroundColor: '#FFD1D1',
  },
  cellText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  selectedCellText: {
    color: THEME.colors.maroon,
  },
  duplicateCellText: {
    color: THEME.colors.maroon,
  },
  statusBox: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statusBoxValid: {
    backgroundColor: '#D1E7DD',
    borderColor: '#006633',
  },
  statusBoxError: {
    backgroundColor: '#FFD1D1',
    borderColor: THEME.colors.maroon,
  },
  validStatusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006633',
  },
  errorStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.maroon,
  },
  numpadLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pencil,
    marginBottom: 6,
  },
  numpadScroll: {
    maxHeight: 140,
    marginBottom: 14,
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 14,
  },
  numKey: {
    width: 38,
    height: 34,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 4,
    backgroundColor: THEME.colors.paperLight,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  numKeyUsed: {
    backgroundColor: '#E0E0E0',
    borderColor: '#AAA',
  },
  numKeyText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  numKeyTextUsed: {
    color: '#888',
  },
  clearKey: {
    paddingHorizontal: 10,
    height: 34,
    borderWidth: 1,
    borderColor: THEME.colors.maroon,
    borderRadius: 4,
    backgroundColor: '#FFE6E6',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  clearKeyText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.maroon,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
