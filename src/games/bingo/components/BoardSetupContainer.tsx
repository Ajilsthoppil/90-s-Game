import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { BingoBoardGrid } from '../types/bingo.types';
import { SavedBingoBoard } from '../../../types';
import { localGameRepository } from '../../../storage/LocalGameRepository';
import { generateRandomBoardGrid, validateBoardNumbers } from '../rules/bingoRules';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { ManualNumberEntry } from './ManualNumberEntry';

interface BoardSetupContainerProps {
  grid: BingoBoardGrid;
  maxNumber?: number;
  onGridChange: (newGrid: BingoBoardGrid) => void;
  onConfirmBoard: () => void;
}

type TabType = 'choice' | 'random' | 'manual' | 'saved' | 'recent';

export const BoardSetupContainer: React.FC<BoardSetupContainerProps> = ({
  grid,
  maxNumber = 25,
  onGridChange,
  onConfirmBoard,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('choice');
  const [savedBoards, setSavedBoards] = useState<SavedBingoBoard[]>([]);
  const [recentBoards, setRecentBoards] = useState<SavedBingoBoard[]>([]);
  const [boardNameInput, setBoardNameInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    const saved = await localGameRepository.getSavedBoards();
    const recent = await localGameRepository.getRecentlyUsedBoards();
    setSavedBoards(saved);
    setRecentBoards(recent);
  };

  const cloneGrid = (g: BingoBoardGrid): BingoBoardGrid => {
    return g.map((row) => [...row]);
  };

  const handleSelectTemplate = async (template: SavedBingoBoard) => {
    const cloned = cloneGrid(template.numbers);
    onGridChange(cloned);
    await localGameRepository.addRecentlyUsedBoard(template);
    await loadBoards();
    setSaveSuccessMsg(`Loaded "${template.name}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  const handleSaveCurrentBoard = async () => {
    const name = boardNameInput.trim() || `Board #${savedBoards.length + 1}`;
    const validation = validateBoardNumbers(grid, maxNumber);

    if (!validation.isValid) {
      setSaveSuccessMsg(`Fill 25 valid numbers (1-${maxNumber}) cleanly before saving.`);
      setTimeout(() => setSaveSuccessMsg(null), 2500);
      return;
    }

    const newTemplate: SavedBingoBoard = {
      id: `saved_${Date.now()}`,
      name,
      numbers: cloneGrid(grid),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await localGameRepository.saveBoardTemplate(newTemplate);
    setBoardNameInput('');
    setSaveSuccessMsg(`Saved "${name}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    await loadBoards();
  };

  const handleDeleteSavedBoard = async (boardId: string) => {
    await localGameRepository.deleteSavedBoard(boardId);
    await loadBoards();
  };

  const handleGenerateRandom = () => {
    const rand = generateRandomBoardGrid(maxNumber);
    onGridChange(rand);
  };

  const handleChooseRandom = () => {
    handleGenerateRandom();
    setActiveTab('random');
  };

  const isGridValid = validateBoardNumbers(grid, maxNumber).isValid;

  return (
    <View style={styles.container}>
      {/* Toast Notification Box */}
      {saveSuccessMsg ? (
        <View style={styles.toastBox}>
          <Text style={styles.toastText}>{saveSuccessMsg}</Text>
        </View>
      ) : null}

      {/* Main Mode 1: Choice Landing Screen */}
      {activeTab === 'choice' && (
        <View style={styles.choiceLandingContainer}>
          <Text style={styles.choiceHeaderTitle}>SET UP YOUR BOARD</Text>
          <Text style={styles.choiceHeaderSubtitle}>How do you want to play?</Text>

          {/* Option 1: Random Board (RECOMMENDED / EASIEST) */}
          <Pressable
            onPress={handleChooseRandom}
            style={({ pressed }) => [
              styles.choiceCard,
              styles.choiceCardRecommended,
              pressed && styles.choiceCardPressed,
            ]}
          >
            <View style={styles.choiceCardHeader}>
              <Text style={styles.choiceCardTitle}>🎲 RANDOM BOARD</Text>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
              </View>
            </View>
            <Text style={styles.choiceCardDesc}>
              Fill my board automatically with 25 unique numbers (1–{maxNumber}). Easiest and fastest option!
            </Text>
          </Pressable>

          {/* Option 2: Manual Board */}
          <Pressable
            onPress={() => setActiveTab('manual')}
            style={({ pressed }) => [
              styles.choiceCard,
              pressed && styles.choiceCardPressed,
            ]}
          >
            <Text style={styles.choiceCardTitle}>✏️ MANUAL BOARD</Text>
            <Text style={styles.choiceCardDesc}>
              Enter numbers yourself one-by-one on 90s classroom notebook paper.
            </Text>
          </Pressable>

          {/* Option 3: Saved Boards */}
          <Pressable
            onPress={() => setActiveTab('saved')}
            style={({ pressed }) => [
              styles.choiceCard,
              pressed && styles.choiceCardPressed,
            ]}
          >
            <View style={styles.choiceCardHeader}>
              <Text style={styles.choiceCardTitle}>📚 SAVED BOARDS</Text>
              {savedBoards.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{savedBoards.length} Saved</Text>
                </View>
              )}
            </View>
            <Text style={styles.choiceCardDesc}>
              Use a board grid template you saved earlier.
            </Text>
          </Pressable>

          {/* Option 4: Recent Boards */}
          <Pressable
            onPress={() => setActiveTab('recent')}
            style={({ pressed }) => [
              styles.choiceCard,
              pressed && styles.choiceCardPressed,
            ]}
          >
            <View style={styles.choiceCardHeader}>
              <Text style={styles.choiceCardTitle}>🕘 RECENT BOARDS</Text>
              {recentBoards.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{recentBoards.length} Recent</Text>
                </View>
              )}
            </View>
            <Text style={styles.choiceCardDesc}>
              Reuse a board grid layout from a previous match.
            </Text>
          </Pressable>
        </View>
      )}

      {/* Top Tab Selector Header when inside any sub-view */}
      {activeTab !== 'choice' && (
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('choice')}
            style={styles.backToChoiceBtn}
          >
            <Text style={styles.backToChoiceText}>← CHOICE</Text>
          </Pressable>

          <Pressable
            onPress={handleChooseRandom}
            style={[styles.tabBtn, activeTab === 'random' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'random' && styles.tabTextActive]}>
              🎲 Random
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('manual')}
            style={[styles.tabBtn, activeTab === 'manual' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'manual' && styles.tabTextActive]}>
              ✏️ Manual
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('saved')}
            style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              💾 Saved
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('recent')}
            style={[styles.tabBtn, activeTab === 'recent' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
              🕘 Recent
            </Text>
          </Pressable>
        </View>
      )}

      {/* Mode 2: Random Board Generated Preview */}
      {activeTab === 'random' && (
        <View style={styles.randomPreviewContainer}>
          <Text style={styles.sectionHeader}>🎲 Generated Random Board Preview:</Text>
          <Text style={styles.subText}>25 unique numbers (1–{maxNumber}) generated cleanly.</Text>

          {/* 5x5 Grid Display */}
          <View style={styles.previewGrid}>
            {grid.map((row, r) => (
              <View key={`rand-row-${r}`} style={styles.gridRow}>
                {row.map((val, c) => (
                  <View key={`rand-cell-${r}-${c}`} style={styles.previewCell}>
                    <Text style={styles.previewCellText}>{val !== null ? val : ''}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <HandDrawnButton
              title="🎲 RANDOMIZE AGAIN"
              variant="secondary"
              onPress={handleGenerateRandom}
              size="small"
              style={{ flex: 1, marginRight: 6 }}
            />
            <HandDrawnButton
              title="✏️ CONFIRM BOARD"
              variant={isGridValid ? 'primary' : 'disabled'}
              disabled={!isGridValid}
              onPress={onConfirmBoard}
              size="small"
              style={{ flex: 1.2, marginLeft: 6 }}
            />
          </View>
        </View>
      )}

      {/* Mode 3: Manual Board Entry */}
      {activeTab === 'manual' && (
        <ManualNumberEntry
          grid={grid}
          maxNumber={maxNumber}
          onGridChange={onGridChange}
          onGenerateRandom={handleGenerateRandom}
          onConfirmBoard={onConfirmBoard}
        />
      )}

      {/* Mode 4: Saved Boards */}
      {activeTab === 'saved' && (
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>Saved Board Templates:</Text>
          {savedBoards.length === 0 ? (
            <Text style={styles.emptyText}>No saved boards yet. Fill a board and save it below!</Text>
          ) : (
            <ScrollView style={styles.scrollList}>
              {savedBoards.map((item) => (
                <View key={item.id} style={styles.boardListItem}>
                  <View style={styles.boardInfo}>
                    <Text style={styles.boardName}>{item.name}</Text>
                    <Text style={styles.boardDate}>
                      5×5 • 1–{maxNumber} • Saved: {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.boardActions}>
                    <HandDrawnButton
                      title="USE THIS BOARD"
                      variant="primary"
                      onPress={() => handleSelectTemplate(item)}
                      size="small"
                    />
                    <Pressable
                      onPress={() => handleDeleteSavedBoard(item.id)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Board Grid Preview & Confirmation */}
          <View style={{ marginTop: 12 }}>
            <ManualNumberEntry
              grid={grid}
              maxNumber={maxNumber}
              onGridChange={onGridChange}
              onGenerateRandom={handleGenerateRandom}
              onConfirmBoard={onConfirmBoard}
            />
          </View>
        </View>
      )}

      {/* Mode 5: Recently Used Boards */}
      {activeTab === 'recent' && (
        <View style={styles.listSection}>
          <Text style={styles.sectionHeader}>Recently Used Boards:</Text>
          {recentBoards.length === 0 ? (
            <Text style={styles.emptyText}>No recently used boards yet.</Text>
          ) : (
            <ScrollView style={styles.scrollList}>
              {recentBoards.map((item) => (
                <View key={item.id} style={styles.boardListItem}>
                  <View style={styles.boardInfo}>
                    <Text style={styles.boardName}>{item.name}</Text>
                    <Text style={styles.boardDate}>
                      5×5 • 1–{maxNumber} • {item.lastUsedAt ? new Date(item.lastUsedAt).toLocaleTimeString() : 'Recently'}
                    </Text>
                  </View>

                  <HandDrawnButton
                    title="REUSE BOARD"
                    variant="accent"
                    onPress={() => handleSelectTemplate(item)}
                    size="small"
                  />
                </View>
              ))}
            </ScrollView>
          )}

          {/* Board Grid Preview & Confirmation */}
          <View style={{ marginTop: 12 }}>
            <ManualNumberEntry
              grid={grid}
              maxNumber={maxNumber}
              onGridChange={onGridChange}
              onGenerateRandom={handleGenerateRandom}
              onConfirmBoard={onConfirmBoard}
            />
          </View>
        </View>
      )}

      {/* Save Template Action Box if current grid is valid */}
      {isGridValid && activeTab !== 'choice' && (
        <View style={styles.saveTemplateBox}>
          <Text style={styles.saveTitle}>Save Board as Template:</Text>
          <View style={styles.saveInputRow}>
            <TextInput
              style={styles.saveInput}
              value={boardNameInput}
              onChangeText={setBoardNameInput}
              placeholder="e.g. My Lucky Board"
              placeholderTextColor="#888"
            />
            <HandDrawnButton
              title="Save 💾"
              variant="accent"
              onPress={handleSaveCurrentBoard}
              size="small"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  choiceLandingContainer: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 16,
    ...THEME.shadows.handDrawn,
  },
  choiceHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.pencil,
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  choiceHeaderSubtitle: {
    fontSize: 13,
    color: THEME.colors.pencilLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  choiceCard: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  choiceCardRecommended: {
    backgroundColor: '#FFFBEB',
    borderColor: THEME.colors.mustard,
    borderWidth: 2,
  },
  choiceCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  choiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  choiceCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  choiceCardDesc: {
    fontSize: 12.5,
    color: THEME.colors.pencilLight,
    lineHeight: 17,
  },
  recommendedBadge: {
    backgroundColor: THEME.colors.mustard,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.maroon,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
  countBadge: {
    backgroundColor: THEME.colors.notebookBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  backToChoiceBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: THEME.colors.maroon,
    backgroundColor: '#FFE6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToChoiceText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.paperLight,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.mustard,
    borderColor: THEME.colors.maroon,
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  tabTextActive: {
    color: THEME.colors.maroon,
    fontWeight: '900',
  },
  randomPreviewContainer: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    ...THEME.shadows.handDrawn,
  },
  subText: {
    fontSize: 12,
    color: THEME.colors.pencilLight,
    marginBottom: 10,
  },
  previewGrid: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.pencil,
    backgroundColor: THEME.colors.paperLight,
    marginBottom: 14,
  },
  gridRow: {
    flexDirection: 'row',
  },
  previewCell: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: THEME.colors.notebookBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.paperCard,
  },
  previewCellText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  toastBox: {
    backgroundColor: '#D1E7DD',
    borderWidth: 1.5,
    borderColor: THEME.colors.keralaGreen,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.keralaGreen,
  },
  saveTemplateBox: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  saveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 6,
  },
  saveInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  saveInput: {
    flex: 1,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: THEME.colors.pencil,
  },
  listSection: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 10,
    padding: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: THEME.colors.pencilLight,
    fontStyle: 'italic',
  },
  scrollList: {
    maxHeight: 220,
  },
  boardListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1,
    borderColor: THEME.colors.notebookBlue,
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
  },
  boardInfo: {
    flex: 1,
  },
  boardName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  boardDate: {
    fontSize: 11,
    color: THEME.colors.pencilLight,
    marginTop: 2,
  },
  boardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
