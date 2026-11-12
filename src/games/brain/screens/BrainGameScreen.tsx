import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { BrainDifficulty, BrainGameId, BrainGameState } from '../types/brain.types';
import {
  createCircuitGame,
  createTileConnectGame,
  createWordFillGame,
  createWordPuzzleGame,
  createWordConnectGame,
  createSudokuGame,
  createMemoryMatchGame,
  createPatternGame,
  createNumberPuzzleGame,
  createSlidingPuzzleGame,
  createMazeGame,
  createVisualDiffGame,
  computeCircuitPower,
  getTilePorts,
  canConnectTilesOnet,
  getSudokuConflicts,
  getCircuitHint,
  getMazeShortestPath,
  VocabularyWord,
  CircuitWireTile,
  TileConnectItem,
  MemoryCardItem,
  MazeCell,
  VisualDiffData,
  PatternPuzzleData,
  NumberPuzzleData,
  WordFillPuzzle,
  WordPuzzleData,
  WordConnectData,
  SudokuGrid,
} from '../engine/BrainEngines';
import { THEME } from '../../../theme/theme';
import { soundService } from '../../../audio/soundService';
import { getBrainAsset, fitAspectRatio } from '../assets/brainAssetRegistry';
import {
  BrainGameContainer,
  BrainGameHeader,
  BrainGameToolbar,
  BrainGameDifficultySelector,
  BrainGameCard,
  BrainGameButton,
  BrainGameStatsFooter,
  BrainGamePauseModal,
  BrainGameHintModal,
  BrainGameVictoryModal,
  BrainGameSettingsModal,
} from '../components';
import { brainProgressionService, BrainGameProgress } from '../services/BrainProgressionService';

const GAME_CATEGORY_MAP: Record<BrainGameId, { badge: string; instructions: string }> = {
  circuit_connect: {
    badge: 'LOGIC',
    instructions: 'Tap wire tiles to rotate them 90°. Connect the Battery 🔋 to the Lightbulb 💡 in an unbroken powered circuit!',
  },
  tile_connect: {
    badge: 'CONNECT',
    instructions: 'Tap two matching retro items to connect them. The connection line can make at most 2 turns through empty spaces!',
  },
  word_fill: {
    badge: 'VOCAB',
    instructions: 'Study the clue and meaning. Tap an empty slot and pick letters from the keyboard to complete the mystery word!',
  },
  word_puzzle: {
    badge: 'ANAGRAM',
    instructions: 'Tap available scrambled letters to form the word described by the clue. Tap placed letters to return them to the pool.',
  },
  word_connect: {
    badge: 'WORDS',
    instructions: 'Tap the letter wheel buttons to build valid words. Discover all target words to clear the stage!',
  },
  sudoku: {
    badge: 'NUMBERS',
    instructions: 'Fill the grid so every row, column, and subgrid contains each number exactly once without duplicates.',
  },
  memory_match: {
    badge: 'MEMORY',
    instructions: 'Flip two cards at a time to find identical nostalgic pairs. Match all cards with the fewest moves!',
  },
  pattern_complete: {
    badge: 'PATTERNS',
    instructions: 'Examine the sequence pattern, select the matching tile that completes it, and tap Submit Pattern.',
  },
  number_puzzles: {
    badge: 'MATH',
    instructions: 'Calculate the missing value that balances the equation, select your answer, and confirm with Submit Answer.',
  },
  sliding_puzzle: {
    badge: 'TILES',
    instructions: 'Slide adjacent tiles into the empty space to arrange numbers 1 to 8 in order!',
  },
  maze: {
    badge: 'SPATIAL',
    instructions: 'Use the D-pad navigation controls to guide the Rocket 🚀 through the labyrinth corridors to the checkered flag 🏁!',
  },
  visual_diff: {
    badge: 'OBSERVE',
    instructions: 'Compare the Original grid to the Spot Diff grid. Tap all changed items on the right grid to clear the level!',
  },
};

interface BrainGameScreenProps {
  gameId: BrainGameId;
  title: string;
  onExit: () => void;
  initialSudokuMode?: 'STANDARD' | 'MINI';
}

export const BrainGameScreen: React.FC<BrainGameScreenProps> = ({
  gameId,
  title,
  onExit,
  initialSudokuMode,
}) => {
  const { width: scrWidth, height: scrHeight } = useWindowDimensions();
  const isLandscape = scrWidth > scrHeight;
  const isTablet = Math.min(scrWidth, scrHeight) >= 600;

  const [difficulty, setDifficulty] = useState<BrainDifficulty>('EASY');
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeVocab, setActiveVocab] = useState<VocabularyWord | null>(null);

  // Sudoku mode: Standard 9x9 or Mini 4x4
  const [sudokuMode, setSudokuMode] = useState<'STANDARD' | 'MINI'>(
    initialSudokuMode || 'STANDARD'
  );

  const [gameState, setGameState] = useState<BrainGameState>({
    gameId,
    puzzleId: `puz_${Date.now()}`,
    difficulty: 'EASY',
    startedAt: Date.now(),
    elapsedTime: 0,
    score: 100,
    moves: 0,
    hintsUsed: 0,
    hintsRemaining: 3,
    mistakes: 0,
    status: 'PLAYING',
    timeSeconds: 0,
    isCompleted: false,
    isLearningMode: false,
    customData: null,
  });

  const [activeData, setActiveData] = useState<any>(null);
  const [showHintModal, setShowHintModal] = useState(false);
  const [hintText, setHintText] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Timeouts ref for unmount cleanup
  const activeTimeouts = useRef<NodeJS.Timeout[]>([]);
  const clearAllTimeouts = () => {
    activeTimeouts.current.forEach((t) => clearTimeout(t));
    activeTimeouts.current = [];
  };

  const registerTimeout = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      activeTimeouts.current = activeTimeouts.current.filter((item) => item !== t);
      fn();
    }, ms);
    activeTimeouts.current.push(t);
    return t;
  };

  // 1. Circuit Connect State
  // (managed directly in activeData.tiles)

  // 2. Tile Connect State
  const [tileConnectSelected, setTileConnectSelected] = useState<TileConnectItem | null>(null);
  const [isProcessingTileMatch, setIsProcessingTileMatch] = useState(false);

  // 3. Word Fill State
  const [wordFillInputs, setWordFillInputs] = useState<string[]>([]);
  const [wordFillActiveIndex, setWordFillActiveIndex] = useState<number>(0);

  // 4. Word Puzzle State
  const [wordPuzzleAnswer, setWordPuzzleAnswer] = useState<string[]>([]);
  const [wordPuzzlePool, setWordPuzzlePool] = useState<string[]>([]);

  // 5. Word Connect State
  const [wordConnectCurrent, setWordConnectCurrent] = useState<string>('');
  const [wordConnectFound, setWordConnectFound] = useState<string[]>([]);

  // 6. Sudoku State
  const [selectedSudokuCell, setSelectedSudokuCell] = useState<{ r: number; c: number } | null>(null);

  // 7. Memory Match State
  const [memoryFlippedIds, setMemoryFlippedIds] = useState<string[]>([]);
  const [memoryMatchedCount, setMemoryMatchedCount] = useState<number>(0);
  const [isProcessingMemoryMatch, setIsProcessingMemoryMatch] = useState(false);

  // 8. Pattern Complete State
  const [patternSelectedOption, setPatternSelectedOption] = useState<string | null>(null);
  const [patternShowExplanation, setPatternShowExplanation] = useState(false);

  // 9. Number Puzzle State
  const [numberSelectedOption, setNumberSelectedOption] = useState<number | null>(null);

  // 10. Sliding Puzzle State
  // (managed in activeData as (number | null)[])

  // 11. Maze State
  const [mazePlayerPos, setMazePlayerPos] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [mazeTrail, setMazeTrail] = useState<{ r: number; c: number }[]>([{ r: 0, c: 0 }]);

  // 12. Visual Diff State
  const [visualDiffFound, setVisualDiffFound] = useState<{ row: number; col: number }[]>([]);

  // Level Progression State
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState<number>(1);
  const [highestCompletedLevel, setHighestCompletedLevel] = useState<number>(0);

  // Submission lock to avoid repeated duplicate score updates
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadAndInit = async () => {
      const progress = await brainProgressionService.loadProgress(gameId, difficulty);
      if (!isMounted) return;
      setCurrentLevel(progress.currentLevel);
      setHighestUnlockedLevel(progress.highestUnlockedLevel);
      setHighestCompletedLevel(progress.highestCompletedLevel);
      initPuzzle(difficulty, progress.currentLevel);
    };
    loadAndInit();
    return () => {
      isMounted = false;
      clearAllTimeouts();
    };
  }, [gameId, difficulty, sudokuMode]);

  // Master game timer with pause and completion safeguards
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (gameState.status === 'PLAYING' && !isPaused && !gameState.isCompleted) {
      timer = setInterval(() => {
        setGameState((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
          timeSeconds: prev.timeSeconds + 1,
        }));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameState.status, isPaused, gameState.isCompleted]);

  const showToast = (text: string, isError: boolean = false, duration: number = 2000) => {
    setFeedbackToast({ text, isError });
    registerTimeout(() => {
      setFeedbackToast(null);
    }, duration);
  };

  const initPuzzle = (diff: BrainDifficulty, lvl?: number) => {
    const levelToPlay = lvl ?? currentLevel;
    clearAllTimeouts();
    setIsSubmitting(false);
    setIsProcessingTileMatch(false);
    setIsProcessingMemoryMatch(false);
    setFeedbackToast(null);

    // Clear vocabulary modal state by default for non-vocabulary games
    if (gameId !== 'word_fill' && gameId !== 'word_puzzle') {
      setActiveVocab(null);
    }

    // Reset sub-game states
    setTileConnectSelected(null);
    setWordFillInputs([]);
    setWordFillActiveIndex(0);
    setWordPuzzleAnswer([]);
    setWordPuzzlePool([]);
    setWordConnectCurrent('');
    setWordConnectFound([]);
    setSelectedSudokuCell(null);
    setMemoryFlippedIds([]);
    setMemoryMatchedCount(0);
    setPatternSelectedOption(null);
    setPatternShowExplanation(false);
    setNumberSelectedOption(null);
    setMazePlayerPos({ r: 0, c: 0 });
    setMazeTrail([{ r: 0, c: 0 }]);
    setVisualDiffFound([]);

    let data: any = null;
    let defaultHint = 'Observe the puzzle constraints carefully.';

    switch (gameId) {
      case 'circuit_connect': {
        data = createCircuitGame(diff, levelToPlay);
        defaultHint = 'Rotate tiles by tapping them to create an unbroken powered line from 🔋 to 💡!';
        break;
      }
      case 'tile_connect': {
        data = createTileConnectGame(diff, levelToPlay);
        defaultHint = 'Connect matching items with a path containing at most 2 turns!';
        break;
      }
      case 'word_fill': {
        const wf = createWordFillGame(diff, levelToPlay);
        data = wf;
        setActiveVocab(wf.vocab);
        const initialInputs = wf.vocab.word.split('').map((ch, i) => wf.displayLetters[i] || '');
        setWordFillInputs(initialInputs);
        const firstEmpty = initialInputs.findIndex((c) => c === '');
        setWordFillActiveIndex(firstEmpty !== -1 ? firstEmpty : 0);
        defaultHint = `Clue: ${wf.vocab.meaning}`;
        break;
      }
      case 'word_puzzle': {
        const wp = createWordPuzzleGame(diff, levelToPlay);
        data = wp;
        setActiveVocab(wp.vocab);
        setWordPuzzleAnswer([]);
        setWordPuzzlePool([...wp.scrambled]);
        defaultHint = `Unscramble anagram to match: "${wp.vocab.meaning}"`;
        break;
      }
      case 'word_connect': {
        const wc = createWordConnectGame(diff, levelToPlay);
        data = wc;
        setWordConnectFound([]);
        setWordConnectCurrent('');
        defaultHint = `Spell words using letters: ${wc.letters.join(' - ')}`;
        break;
      }
      case 'sudoku': {
        data = createSudokuGame(diff, sudokuMode, levelToPlay);
        defaultHint =
          data.size === 9
            ? 'Each row, column, and 3x3 block must contain digits 1 through 9 with no repeats.'
            : 'Each row, column, and 2x2 box must contain numbers 1 through 4 with no duplicates.';
        break;
      }
      case 'memory_match': {
        data = createMemoryMatchGame(diff, levelToPlay);
        defaultHint = 'Flip pairs of identical nostalgic items from memory!';
        break;
      }
      case 'pattern_complete': {
        data = createPatternGame(diff, levelToPlay);
        defaultHint = data.explanation || 'Observe the sequence progression and pick the next item.';
        break;
      }
      case 'number_puzzles': {
        data = createNumberPuzzleGame(diff, levelToPlay);
        defaultHint = 'Pick the number that balances the equation correctly.';
        break;
      }
      case 'sliding_puzzle': {
        data = createSlidingPuzzleGame(diff, levelToPlay);
        defaultHint = 'Tap tiles adjacent to the empty slot to slide them into sequential order!';
        break;
      }
      case 'maze': {
        data = createMazeGame(diff, levelToPlay);
        setMazePlayerPos({ r: 0, c: 0 });
        setMazeTrail([{ r: 0, c: 0 }]);
        defaultHint = 'Guide rocket 🚀 through the labyrinth corridors to destination flag 🏁!';
        break;
      }
      case 'visual_diff': {
        data = createVisualDiffGame(diff, levelToPlay);
        defaultHint = 'Spot all the differences on the right grid compared to the left original.';
        break;
      }
    }

    setActiveData(data);
    setHintText(defaultHint);
    setGameState({
      gameId,
      puzzleId: `puz_${Date.now()}`,
      difficulty: diff,
      startedAt: Date.now(),
      elapsedTime: 0,
      score: 100,
      moves: 0,
      hintsUsed: 0,
      hintsRemaining: 3,
      mistakes: 0,
      status: 'PLAYING',
      timeSeconds: 0,
      isCompleted: false,
      isLearningMode: false,
      customData: data,
    });
  };

  const handleCompletePuzzle = async () => {
    if (gameState.isCompleted) return;
    if (soundEnabled) soundService.playPuzzleSuccess();
    const finalScore = Math.max(50, gameState.score + 50);
    const finalTime = gameState.elapsedTime;
    const finalHints = gameState.hintsUsed;

    setGameState((prev) => ({
      ...prev,
      isCompleted: true,
      status: 'COMPLETED',
      score: finalScore,
    }));

    try {
      const updated = await brainProgressionService.recordLevelCompletion(
        gameId,
        difficulty,
        currentLevel,
        finalScore,
        finalTime,
        finalHints
      );
      setHighestUnlockedLevel(updated.highestUnlockedLevel);
      setHighestCompletedLevel(updated.highestCompletedLevel);
    } catch (e) {
      console.warn('[BrainGameScreen] Error saving level completion:', e);
    }
  };

  const handleNextLevel = async () => {
    try {
      const next = await brainProgressionService.advanceToNextLevel(gameId, difficulty);
      setCurrentLevel(next.currentLevel);
      setHighestUnlockedLevel(next.highestUnlockedLevel);
      setHighestCompletedLevel(next.highestCompletedLevel);
      initPuzzle(difficulty, next.currentLevel);
    } catch (e) {
      const fallbackLvl = currentLevel + 1;
      setCurrentLevel(fallbackLvl);
      initPuzzle(difficulty, fallbackLvl);
    }
  };

  const handleReplayLevel = () => {
    initPuzzle(difficulty, currentLevel);
  };

  const handleUseHint = () => {
    if (gameState.hintsRemaining <= 0) {
      Alert.alert('No Hints Left', 'You have used all hints for this puzzle round!');
      return;
    }

    let contextualHint = hintText;

    if (gameId === 'circuit_connect' && activeData?.tiles) {
      const hintObj = getCircuitHint(activeData.tiles);
      if (hintObj) contextualHint = hintObj.text;
    } else if (gameId === 'visual_diff' && activeData?.differences) {
      const unfound = activeData.differences.filter(
        (d: { row: number; col: number }) =>
          !visualDiffFound.some((f) => f.row === d.row && f.col === d.col)
      );
      if (unfound.length > 0) {
        contextualHint = `Look closely at Row ${unfound[0].row + 1}, Col ${unfound[0].col + 1} on the Spot Diff grid!`;
      }
    } else if (gameId === 'maze' && activeData) {
      const path = getMazeShortestPath(
        activeData,
        mazePlayerPos,
        { r: activeData.length - 1, c: activeData.length - 1 }
      );
      if (path && path.length > 1) {
        const nextStep = path[1];
        const dr = nextStep.r - mazePlayerPos.r;
        const dc = nextStep.c - mazePlayerPos.c;
        const dirName = dr === -1 ? 'UP ⬆️' : dr === 1 ? 'DOWN ⬇️' : dc === -1 ? 'LEFT ⬅️' : 'RIGHT ➡️';
        contextualHint = `Next recommended move: Step ${dirName}!`;
      }
    }

    setGameState((prev) => ({
      ...prev,
      hintsRemaining: prev.hintsRemaining - 1,
      hintsUsed: prev.hintsUsed + 1,
      score: Math.max(10, prev.score - 15),
    }));
    setHintText(contextualHint);
    setShowHintModal(true);
  };

  // ==========================================
  // 1. CIRCUIT CONNECT LOGIC
  // ==========================================
  const handleRotateCircuitTile = (r: number, c: number) => {
    if (!activeData || gameState.isCompleted) return;
    if (soundEnabled) soundService.playTokenMove();

    const newTiles = activeData.tiles.map((rowArr: CircuitWireTile[], rIdx: number) =>
      rowArr.map((tile: CircuitWireTile, cIdx: number) => {
        if (rIdx === r && cIdx === c) {
          const nextRot = ((tile.rotation + 90) % 360) as 0 | 90 | 180 | 270;
          return { ...tile, rotation: nextRot };
        }
        return tile;
      })
    );

    const { poweredTiles, isBulbPowered } = computeCircuitPower(newTiles);
    setActiveData({ ...activeData, tiles: poweredTiles });
    setGameState((prev) => ({ ...prev, moves: prev.moves + 1 }));

    if (isBulbPowered) {
      handleCompletePuzzle();
    }
  };

  // ==========================================
  // 2. TILE CONNECT LOGIC (With Onet 2-Turn Path Rule)
  // ==========================================
  const handleTileConnectPress = (item: TileConnectItem) => {
    if (item.matched || gameState.isCompleted || isProcessingTileMatch) return;

    if (!tileConnectSelected) {
      if (soundEnabled) soundService.playTokenMove();
      setTileConnectSelected(item);
      return;
    }

    if (tileConnectSelected.id === item.id) {
      // Deselect
      setTileConnectSelected(null);
      return;
    }

    // Must be same icon
    if (tileConnectSelected.icon !== item.icon) {
      if (soundEnabled) soundService.playPuzzleFailure();
      showToast('Items do not match! Try another pair.', true);
      setTileConnectSelected(null);
      setGameState((prev) => ({ ...prev, mistakes: prev.mistakes + 1, moves: prev.moves + 1 }));
      return;
    }

    // Validate 2-turn path rule
    const pathCheck = canConnectTilesOnet(activeData, tileConnectSelected.id, item.id);
    if (!pathCheck.canConnect) {
      if (soundEnabled) soundService.playPuzzleFailure();
      showToast(pathCheck.reason || 'Cannot connect: max 2 turns path required!', true);
      setTileConnectSelected(null);
      setGameState((prev) => ({ ...prev, mistakes: prev.mistakes + 1, moves: prev.moves + 1 }));
      return;
    }

    // Valid Match
    setIsProcessingTileMatch(true);
    if (soundEnabled) soundService.playTokenMove();
    showToast('Valid connection! ✨', false, 1000);

    const updated = activeData.map((t: TileConnectItem) => {
      if (t.id === item.id || t.id === tileConnectSelected.id) {
        return { ...t, matched: true };
      }
      return t;
    });
    setActiveData(updated);
    setTileConnectSelected(null);
    setGameState((prev) => ({ ...prev, moves: prev.moves + 1, score: prev.score + 20 }));

    registerTimeout(() => {
      setIsProcessingTileMatch(false);
      if (updated.every((t: TileConnectItem) => t.matched)) {
        handleCompletePuzzle();
      }
    }, 300);
  };

  // ==========================================
  // 3. WORD FILL LOGIC
  // ==========================================
  const handleWordFillSlotTap = (index: number) => {
    if (activeData?.displayLetters[index]) return; // Fixed letter
    setWordFillActiveIndex(index);
  };

  const handleWordFillKey = (char: string) => {
    if (!activeData || gameState.isCompleted) return;
    const targetWord = activeData.vocab.word;
    const nextInputs = [...wordFillInputs];

    nextInputs[wordFillActiveIndex] = char;
    setWordFillInputs(nextInputs);

    // Auto advance focus to next empty slot
    let nextIdx = -1;
    for (let i = wordFillActiveIndex + 1; i < targetWord.length; i++) {
      if (!activeData.displayLetters[i] && nextInputs[i] === '') {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx === -1) {
      for (let i = 0; i < wordFillActiveIndex; i++) {
        if (!activeData.displayLetters[i] && nextInputs[i] === '') {
          nextIdx = i;
          break;
        }
      }
    }
    if (nextIdx !== -1) setWordFillActiveIndex(nextIdx);
  };

  const handleWordFillBackspace = () => {
    if (!activeData || gameState.isCompleted) return;
    const nextInputs = [...wordFillInputs];
    if (!activeData.displayLetters[wordFillActiveIndex]) {
      nextInputs[wordFillActiveIndex] = '';
      setWordFillInputs(nextInputs);
    }
  };

  const handleWordFillReset = () => {
    if (!activeData || gameState.isCompleted) return;
    const initialInputs = activeData.vocab.word
      .split('')
      .map((ch: string, i: number) => activeData.displayLetters[i] || '');
    setWordFillInputs(initialInputs);
    const firstEmpty = initialInputs.findIndex((c: string) => c === '');
    setWordFillActiveIndex(firstEmpty !== -1 ? firstEmpty : 0);
  };

  const handleWordFillCheck = () => {
    if (!activeData || gameState.isCompleted || isSubmitting) return;
    setIsSubmitting(true);
    const targetWord = activeData.vocab.word;
    const fullWord = wordFillInputs.join('');

    if (fullWord.length < targetWord.length || wordFillInputs.includes('')) {
      showToast('Please fill all letter slots before checking!', true);
      setIsSubmitting(false);
      return;
    }

    if (fullWord === targetWord) {
      handleCompletePuzzle();
    } else {
      if (soundEnabled) soundService.playPuzzleFailure();
      setGameState((prev) => ({
        ...prev,
        mistakes: prev.mistakes + 1,
        score: Math.max(10, prev.score - 10),
      }));
      showToast('Not quite right. Check clue and try again!', true);
      registerTimeout(() => setIsSubmitting(false), 500);
    }
  };

  // ==========================================
  // 4. WORD PUZZLE (ANAGRAM) LOGIC
  // ==========================================
  const handleWordPuzzlePoolTap = (char: string, index: number) => {
    if (gameState.isCompleted) return;
    if (soundEnabled) soundService.playTokenMove();

    const newPool = [...wordPuzzlePool];
    newPool.splice(index, 1);
    const newAnswer = [...wordPuzzleAnswer, char];

    setWordPuzzlePool(newPool);
    setWordPuzzleAnswer(newAnswer);
    setGameState((prev) => ({ ...prev, moves: prev.moves + 1 }));
  };

  const handleWordPuzzleAnswerTap = (char: string, index: number) => {
    if (gameState.isCompleted) return;
    if (soundEnabled) soundService.playTokenMove();

    const newAnswer = [...wordPuzzleAnswer];
    newAnswer.splice(index, 1);
    const newPool = [...wordPuzzlePool, char];

    setWordPuzzleAnswer(newAnswer);
    setWordPuzzlePool(newPool);
  };

  const handleWordPuzzleReset = () => {
    if (gameState.isCompleted) return;
    setWordPuzzleAnswer([]);
    setWordPuzzlePool([...activeData.scrambled]);
  };

  const handleWordPuzzleCheck = () => {
    if (gameState.isCompleted || !activeData || isSubmitting) return;
    setIsSubmitting(true);

    const fullAnswer = wordPuzzleAnswer.join('');
    if (fullAnswer === activeData.vocab.word) {
      handleCompletePuzzle();
    } else {
      if (soundEnabled) soundService.playPuzzleFailure();
      setGameState((prev) => ({
        ...prev,
        mistakes: prev.mistakes + 1,
        score: Math.max(10, prev.score - 10),
      }));
      showToast('Not the correct word! Try rearranging the tiles.', true);
      registerTimeout(() => setIsSubmitting(false), 500);
    }
  };

  // ==========================================
  // 5. WORD CONNECT LOGIC
  // ==========================================
  const handleWordConnectLetterTap = (letter: string) => {
    if (gameState.isCompleted) return;
    if (soundEnabled) soundService.playTokenMove();
    setWordConnectCurrent((prev) => prev + letter);
  };

  const handleWordConnectUndo = () => {
    setWordConnectCurrent((prev) => prev.slice(0, -1));
  };

  const handleWordConnectClear = () => {
    setWordConnectCurrent('');
  };

  const handleWordConnectSubmit = () => {
    if (!activeData || gameState.isCompleted) return;
    const word = wordConnectCurrent.toUpperCase();

    if (word.length === 0) return;

    if (activeData.validWords.includes(word)) {
      if (wordConnectFound.includes(word)) {
        showToast(`You already found "${word}"!`, true);
        setWordConnectCurrent('');
        return;
      }

      if (soundEnabled) soundService.playTokenMove();
      const updatedFound = [...wordConnectFound, word];
      setWordConnectFound(updatedFound);
      setWordConnectCurrent('');
      setGameState((prev) => ({ ...prev, score: prev.score + 25, moves: prev.moves + 1 }));
      showToast(`Found "${word}"! ⭐️`, false);

      const target = activeData.targetWordCount || Math.min(4, activeData.validWords.length);
      if (updatedFound.length >= target) {
        handleCompletePuzzle();
      }
    } else {
      if (soundEnabled) soundService.playPuzzleFailure();
      setGameState((prev) => ({ ...prev, mistakes: prev.mistakes + 1 }));
      showToast(`"${word}" is not on the valid word list.`, true);
      setWordConnectCurrent('');
    }
  };

  // ==========================================
  // 6. SUDOKU LOGIC (Standard 9x9 + Mini 4x4)
  // ==========================================
  const sudokuConflicts = useMemo(() => {
    if (gameId === 'sudoku' && activeData?.current) {
      return getSudokuConflicts(activeData.current, activeData.size);
    }
    return [];
  }, [gameId, activeData?.current, activeData?.size]);

  const handleSudokuInput = (num: number) => {
    if (!selectedSudokuCell || !activeData || gameState.isCompleted) return;
    const { r, c } = selectedSudokuCell;

    if (activeData.initial[r][c] !== null) return; // Cannot edit fixed clues

    const newCurrent = activeData.current.map((rowArr: any, rowIdx: number) =>
      rowArr.map((cellVal: any, colIdx: number) => {
        if (rowIdx === r && colIdx === c) return num;
        return cellVal;
      })
    );

    const isWrong = activeData.solution[r][c] !== num;
    let mistakes = gameState.mistakes;
    if (isWrong) {
      mistakes += 1;
      if (soundEnabled) soundService.playPuzzleFailure();
    } else {
      if (soundEnabled) soundService.playTokenMove();
    }

    setActiveData({ ...activeData, current: newCurrent });
    setGameState((prev) => ({
      ...prev,
      moves: prev.moves + 1,
      mistakes,
      score: isWrong ? Math.max(10, prev.score - 5) : prev.score,
    }));

    // Auto verify completion if filled
    const isFull = newCurrent.every((rowArr: any) => rowArr.every((cell: any) => cell !== null));
    const isAllCorrect = newCurrent.every((rowArr: any, rIdx: number) =>
      rowArr.every((cell: any, cIdx: number) => cell === activeData.solution[rIdx][cIdx])
    );

    if (isFull && isAllCorrect) handleCompletePuzzle();
  };

  const handleSudokuErase = () => {
    if (!selectedSudokuCell || !activeData || gameState.isCompleted) return;
    const { r, c } = selectedSudokuCell;
    if (activeData.initial[r][c] !== null) return;

    const newCurrent = activeData.current.map((rowArr: any, rowIdx: number) =>
      rowArr.map((cellVal: any, colIdx: number) => {
        if (rowIdx === r && colIdx === c) return null;
        return cellVal;
      })
    );
    setActiveData({ ...activeData, current: newCurrent });
  };

  const handleSudokuCheckSubmit = () => {
    if (!activeData || gameState.isCompleted) return;
    const isFull = activeData.current.every((rowArr: any) => rowArr.every((cell: any) => cell !== null));
    const isAllCorrect = activeData.current.every((rowArr: any, rIdx: number) =>
      rowArr.every((cell: any, cIdx: number) => cell === activeData.solution[rIdx][cIdx])
    );

    if (isFull && isAllCorrect) {
      handleCompletePuzzle();
    } else if (sudokuConflicts.length > 0) {
      showToast(`Conflicts detected! Fix red-highlighted duplicate cells.`, true);
    } else {
      showToast(`Keep solving! All filled numbers so far are valid.`, false);
    }
  };

  // ==========================================
  // 7. MEMORY MATCH LOGIC
  // ==========================================
  const handleMemoryCardPress = (card: MemoryCardItem) => {
    if (
      card.isMatched ||
      gameState.isCompleted ||
      isProcessingMemoryMatch ||
      memoryFlippedIds.includes(card.id) ||
      memoryFlippedIds.length >= 2
    ) {
      return;
    }

    if (soundEnabled) soundService.playTokenMove();
    const nextFlipped = [...memoryFlippedIds, card.id];
    setMemoryFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      setIsProcessingMemoryMatch(true);
      setGameState((prev) => ({ ...prev, moves: prev.moves + 1 }));
      const [firstId, secondId] = nextFlipped;
      const firstCard = activeData.find((c: MemoryCardItem) => c.id === firstId);
      const secondCard = activeData.find((c: MemoryCardItem) => c.id === secondId);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match
        registerTimeout(() => {
          if (soundEnabled) soundService.playTokenMove();
          const updated = activeData.map((c: MemoryCardItem) =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          );
          setActiveData(updated);
          setMemoryFlippedIds([]);
          setIsProcessingMemoryMatch(false);
          const matchedPairs = updated.filter((c: MemoryCardItem) => c.isMatched).length / 2;
          setMemoryMatchedCount(matchedPairs);

          if (updated.every((c: MemoryCardItem) => c.isMatched)) {
            handleCompletePuzzle();
          }
        }, 500);
      } else {
        // Mismatch
        registerTimeout(() => {
          if (soundEnabled) soundService.playPuzzleFailure();
          setMemoryFlippedIds([]);
          setIsProcessingMemoryMatch(false);
          setGameState((prev) => ({
            ...prev,
            mistakes: prev.mistakes + 1,
            score: Math.max(10, prev.score - 5),
          }));
        }, 800);
      }
    }
  };

  // ==========================================
  // 8. PATTERN COMPLETE LOGIC (Select-and-Submit)
  // ==========================================
  const handlePatternOptionSelect = (option: string) => {
    if (gameState.isCompleted || isSubmitting) return;
    setPatternSelectedOption(option);
  };

  const handlePatternSubmit = () => {
    if (gameState.isCompleted || !patternSelectedOption || isSubmitting) return;
    setIsSubmitting(true);

    if (patternSelectedOption === activeData.correctAnswer) {
      setPatternShowExplanation(true);
      handleCompletePuzzle();
    } else {
      if (soundEnabled) soundService.playPuzzleFailure();
      setGameState((prev) => ({
        ...prev,
        mistakes: prev.mistakes + 1,
        score: Math.max(10, prev.score - 10),
      }));
      showToast('Incorrect choice! Select another tile and check.', true);
      registerTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  // ==========================================
  // 9. NUMBER PUZZLE LOGIC (Select-and-Submit)
  // ==========================================
  const handleNumberOptionSelect = (option: number) => {
    if (gameState.isCompleted || isSubmitting) return;
    setNumberSelectedOption(option);
  };

  const handleNumberSubmit = () => {
    if (gameState.isCompleted || numberSelectedOption === null || isSubmitting) return;
    setIsSubmitting(true);

    if (numberSelectedOption === activeData.correctAnswer) {
      handleCompletePuzzle();
    } else {
      if (soundEnabled) soundService.playPuzzleFailure();
      setGameState((prev) => ({
        ...prev,
        mistakes: prev.mistakes + 1,
        score: Math.max(10, prev.score - 10),
      }));
      showToast('Does not balance the equation! Choose another number.', true);
      registerTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  // ==========================================
  // 10. SLIDING PUZZLE LOGIC
  // ==========================================
  const handleSlidingTilePress = (index: number) => {
    if (gameState.isCompleted || !activeData) return;
    const board: (number | null)[] = activeData;
    const dim = Math.sqrt(board.length);
    const blankIdx = board.indexOf(null);

    const r = Math.floor(index / dim);
    const c = index % dim;
    const br = Math.floor(blankIdx / dim);
    const bc = blankIdx % dim;

    // Check orthogonal adjacency
    const isAdjacent = (Math.abs(r - br) === 1 && c === bc) || (Math.abs(c - bc) === 1 && r === br);
    if (!isAdjacent) return;

    if (soundEnabled) soundService.playTokenMove();
    const newBoard = [...board];
    newBoard[blankIdx] = newBoard[index];
    newBoard[index] = null;

    setActiveData(newBoard);
    setGameState((prev) => ({ ...prev, moves: prev.moves + 1 }));

    // Check solved: 1, 2, ..., N-1, null
    let isSolved = true;
    for (let i = 0; i < newBoard.length - 1; i++) {
      if (newBoard[i] !== i + 1) {
        isSolved = false;
        break;
      }
    }
    if (isSolved && newBoard[newBoard.length - 1] === null) {
      handleCompletePuzzle();
    }
  };

  // ==========================================
  // 11. MAZE LOGIC
  // ==========================================
  const handleMazeMove = (dr: number, dc: number) => {
    if (gameState.isCompleted || !activeData) return;
    const size = activeData.length;
    const nr = mazePlayerPos.r + dr;
    const nc = mazePlayerPos.c + dc;

    if (nr < 0 || nr >= size || nc < 0 || nc >= size) return;
    if (activeData[nr][nc].isWall) {
      if (soundEnabled) soundService.playPuzzleFailure();
      return;
    }

    if (soundEnabled) soundService.playTokenMove();
    setMazePlayerPos({ r: nr, c: nc });
    setMazeTrail((prev) => [...prev, { r: nr, c: nc }]);
    setGameState((prev) => ({ ...prev, moves: prev.moves + 1 }));

    if (nr === size - 1 && nc === size - 1) {
      handleCompletePuzzle();
    }
  };

  // ==========================================
  // 12. VISUAL DIFFERENCE LOGIC
  // ==========================================
  const handleVisualDiffCellPress = (r: number, c: number) => {
    if (gameState.isCompleted || !activeData) return;

    const isDiff = activeData.differences.some(
      (d: { row: number; col: number }) => d.row === r && d.col === c
    );
    const alreadyFound = visualDiffFound.some((d) => d.row === r && d.col === c);

    if (alreadyFound) return; // Prevent duplicate hits

    if (isDiff) {
      if (soundEnabled) soundService.playTokenMove();
      const updatedFound = [...visualDiffFound, { row: r, col: c }];
      setVisualDiffFound(updatedFound);
      setGameState((prev) => ({ ...prev, score: prev.score + 30, moves: prev.moves + 1 }));
      showToast(`Difference spotted! ✨ (${updatedFound.length}/${activeData.differences.length})`);

      if (updatedFound.length === activeData.differences.length) {
        handleCompletePuzzle();
      }
    } else {
      if (soundEnabled) soundService.playPuzzleFailure();
      setGameState((prev) => ({ ...prev, mistakes: prev.mistakes + 1, moves: prev.moves + 1 }));
      showToast('No difference at that spot!', true, 1200);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // RESPONSIVE DIMENSION CALCULATIONS
  // ==========================================
  const statusBarPadding =
    Platform.OS === 'android'
      ? isLandscape
        ? 0
        : Math.max(32, StatusBar.currentHeight || 32)
      : 0;

  const contentWidth = Math.max(280, scrWidth - (isLandscape ? 32 : 16));
  const availableContentHeight = Math.max(
    320,
    scrHeight - statusBarPadding - (isLandscape ? 95 : 135)
  );

  // Responsive Board Size clamping
  const squareBoardMax = Math.min(
    contentWidth - (isLandscape ? 180 : 16),
    availableContentHeight,
    isTablet ? 540 : 420
  );

  // 1. Circuit Connect: cell size
  const circuitTileSize = Math.max(
    48,
    Math.floor((squareBoardMax - 20) / (activeData?.tiles?.length || 3))
  );

  // 2. Tile Connect: card size
  const tileConnectCardSize = Math.max(
    52,
    Math.min(
      Math.floor((contentWidth - 48) / 4),
      Math.floor((availableContentHeight - 50) / 4),
      isTablet ? 90 : 72
    )
  );

  // 6. Sudoku: cell size
  const sudokuGridSize = activeData?.size || 9;
  const sudokuCellSize = Math.max(
    sudokuGridSize === 9 ? 34 : 52,
    Math.floor((squareBoardMax - 12) / sudokuGridSize)
  );

  // 10. Sliding: tile size
  const slidingDim = activeData?.length === 16 ? 4 : 3;
  const slidingTileSize = Math.max(
    54,
    Math.floor((squareBoardMax - 24) / slidingDim)
  );

  // 11. Maze: cell size
  const mazeDim = activeData?.length || 5;
  const mazeCellSize = Math.max(
    28,
    Math.min(
      Math.floor((squareBoardMax - 16) / mazeDim),
      isTablet ? 56 : 46
    )
  );

  // 12. Visual diff: cell size
  const diffGridDim = activeData?.gridLeft?.length || 3;
  const diffGridWidth = isLandscape
    ? Math.min((contentWidth - 60) / 2, availableContentHeight - 40)
    : Math.min((contentWidth - 32) / 2, 210);
  const diffCellSize = Math.max(40, Math.floor((diffGridWidth - 8) / diffGridDim));

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const renderCircuitWireCell = (tile: CircuitWireTile) => {
    const ports = getTilePorts(tile.type, tile.rotation);
    const isPowered = tile.isPowered;
    const wireColor = isPowered ? '#00F5FF' : '#475569';

    return (
      <Pressable
        key={tile.id}
        onPress={() => handleRotateCircuitTile(tile.row, tile.col)}
        style={[
          styles.circuitTileCell,
          { width: circuitTileSize, height: circuitTileSize },
          isPowered && styles.circuitTilePowered,
        ]}
      >
        {ports.north && <View style={[styles.wireLineNorth, { backgroundColor: wireColor }]} />}
        {ports.south && <View style={[styles.wireLineSouth, { backgroundColor: wireColor }]} />}
        {ports.east && <View style={[styles.wireLineEast, { backgroundColor: wireColor }]} />}
        {ports.west && <View style={[styles.wireLineWest, { backgroundColor: wireColor }]} />}
        <View style={[styles.wireCenterJunction, { backgroundColor: wireColor }]} />

        {tile.type === 'SOURCE' && (
          <View style={styles.circuitTerminalBadge}>
            <Text style={{ fontSize: circuitTileSize > 60 ? 24 : 18 }}>🔋</Text>
            <Text style={styles.circuitPwrLabel}>PWR</Text>
          </View>
        )}
        {tile.type === 'BULB' && (
          <View style={[styles.circuitTerminalBadge, isPowered && styles.circuitBulbGlow]}>
            <Text style={{ fontSize: isPowered ? (circuitTileSize > 60 ? 30 : 24) : 20 }}>💡</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <BrainGameContainer>
      {/* Unified Anime-Adventure Header */}
      <BrainGameHeader
        title={title}
        categoryBadge={GAME_CATEGORY_MAP[gameId]?.badge || 'PUZZLE'}
        level={currentLevel}
        isLevelCompleted={gameState.isCompleted}
        onBack={onExit}
      />

      {/* Unified Responsive Secondary Controls Toolbar */}
      <BrainGameToolbar
        difficulty={difficulty}
        onSelectDifficulty={(d) => setDifficulty(d)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        isPaused={isPaused}
        onPause={() => setIsPaused(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        leftElement={
          gameId === 'sudoku' ? (
            <View style={styles.sudokuToolbarLeft}>
              <BrainGameDifficultySelector
                current={difficulty}
                onSelect={(d) => setDifficulty(d)}
              />
              <View style={styles.sudokuModeToggleRow}>
                <Pressable
                  onPress={() => setSudokuMode('STANDARD')}
                  accessibilityRole="button"
                  accessibilityLabel="Standard 9 by 9 Sudoku Grid"
                  style={[
                    styles.sudokuModePill,
                    sudokuMode === 'STANDARD' && styles.sudokuModePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sudokuModePillText,
                      sudokuMode === 'STANDARD' && styles.sudokuModePillTextActive,
                    ]}
                  >
                    9×9
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSudokuMode('MINI')}
                  accessibilityRole="button"
                  accessibilityLabel="Mini 4 by 4 Sudoku Grid"
                  style={[
                    styles.sudokuModePill,
                    sudokuMode === 'MINI' && styles.sudokuModePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sudokuModePillText,
                      sudokuMode === 'MINI' && styles.sudokuModePillTextActive,
                    ]}
                  >
                    4×4
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.toolbarLeftDefaultRow}>
              <BrainGameDifficultySelector
                current={difficulty}
                onSelect={(d) => setDifficulty(d)}
              />
              {gameId === 'word_connect' && (
                <View style={styles.diffCounterPill}>
                  <Text style={styles.diffCounterText}>
                    Words: {wordConnectFound.length}/{activeData?.targetWordCount || 4}
                  </Text>
                </View>
              )}
              {gameId === 'visual_diff' && (
                <View style={styles.diffCounterPill}>
                  <Text style={styles.diffCounterText}>
                    Found: {visualDiffFound.length}/{activeData?.differences?.length || 2}
                  </Text>
                </View>
              )}
              {gameId === 'memory_match' && (
                <View style={styles.diffCounterPill}>
                  <Text style={styles.diffCounterText}>
                    Pairs: {memoryMatchedCount}/{(activeData?.length || 8) / 2}
                  </Text>
                </View>
              )}
            </View>
          )
        }
      />

      {/* Main Single-Player Game Board Frame */}
      <View style={styles.boardCardFrame}>
        {/* Feedback Toast Banner */}
        {feedbackToast && (
          <View
            style={[
              styles.feedbackToast,
              feedbackToast.isError ? styles.feedbackToastError : styles.feedbackToastSuccess,
            ]}
          >
            <Text style={styles.feedbackToastText}>{feedbackToast.text}</Text>
          </View>
        )}

        {/* ======================================================== */}
        {/* 1. CIRCUIT CONNECT */}
        {/* ======================================================== */}
        {gameId === 'circuit_connect' && activeData?.tiles && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.puzzlePromptBanner}>
              <Text style={styles.puzzlePromptText}>
                Rotate wires to connect Battery 🔋 to Bulb 💡!
              </Text>
            </View>

            <View style={styles.circuitWoodChassis}>
              <View style={styles.circuitGridInner}>
                {activeData.tiles?.map((rowArr: CircuitWireTile[], r: number) => (
                  <View key={r} style={{ flexDirection: 'row' }}>
                    {rowArr.map((tile: CircuitWireTile) => renderCircuitWireCell(tile))}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.circuitLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#00F5FF' }]} />
                <Text style={styles.legendText}>Powered Wire</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#475569' }]} />
                <Text style={styles.legendText}>Disconnected</Text>
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 2. TILE CONNECT (With Onet Path Logic) */}
        {/* ======================================================== */}
        {gameId === 'tile_connect' && Array.isArray(activeData) && activeData[0]?.icon && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.puzzlePromptBanner}>
              <Text style={styles.puzzlePromptText}>
                Tap pairs of matching items! Path must have at most 2 turns.
              </Text>
            </View>

            <View
              style={[
                styles.tileConnectGrid,
                { maxWidth: tileConnectCardSize * 4 + 40 },
              ]}
            >
              {activeData.map((item: TileConnectItem) => {
                const isSelected = tileConnectSelected?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleTileConnectPress(item)}
                    disabled={item.matched || isProcessingTileMatch}
                    style={[
                      styles.tileConnectCard,
                      { width: tileConnectCardSize, height: tileConnectCardSize },
                      item.matched && styles.tileConnectCardMatched,
                      isSelected && styles.tileConnectCardSelected,
                    ]}
                  >
                    <Text style={[styles.tileConnectEmoji, { fontSize: tileConnectCardSize > 64 ? 34 : 26 }]}>
                      {item.matched ? '✨' : item.icon}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 3. WORD FILL */}
        {/* ======================================================== */}
        {gameId === 'word_fill' && activeData?.vocab && (
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.puzzleScrollCol}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.notebookCard}>
              <View style={styles.notebookHeaderRow}>
                <Text style={styles.notebookHeaderBadge}>VOCABULARY PUZZLE 📖</Text>
                <Text style={styles.notebookCategoryPill}>
                  {activeData.vocab?.category || 'General'}
                </Text>
              </View>

              <Text style={styles.notebookInstruction}>
                Fill in the missing letters to spell the word:
              </Text>

              {/* Target Word Slots */}
              <View style={styles.wordSlotsRow}>
                {activeData.vocab.word.split('').map((char: string, idx: number) => {
                  const isFixed = !!activeData.displayLetters[idx];
                  const val = wordFillInputs[idx] || '';
                  const isActive = wordFillActiveIndex === idx;

                  return (
                    <Pressable
                      key={idx}
                      onPress={() => handleWordFillSlotTap(idx)}
                      style={[
                        styles.wordSlot,
                        isFixed && styles.wordSlotFixed,
                        isActive && styles.wordSlotActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.wordSlotText,
                          isFixed && styles.wordSlotFixedText,
                          isActive && styles.wordSlotActiveText,
                        ]}
                      >
                        {val}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Meaning & Clue Card */}
              <View style={styles.vocabDefinitionBox}>
                <Text style={styles.vocabDefTitle}>Meaning & Clue:</Text>
                <Text style={styles.vocabDefMeaning}>"{activeData.vocab.meaning}"</Text>
                {activeData.vocab.exampleSentence && (
                  <Text style={styles.vocabDefExample}>
                    e.g. {activeData.vocab.exampleSentence}
                  </Text>
                )}
              </View>

              {/* Tactile Letter Keyboard (All A-Z) */}
              <View style={styles.keyboardContainer}>
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch) => (
                  <Pressable
                    key={ch}
                    onPress={() => handleWordFillKey(ch)}
                    style={styles.keyCap}
                  >
                    <Text style={styles.keyCapText}>{ch}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={handleWordFillBackspace} style={styles.keyCapWide}>
                  <Text style={styles.keyCapText}>⌫</Text>
                </Pressable>
              </View>

              {/* Action Buttons: Reset & Check */}
              <View style={styles.actionBtnRow}>
                <BrainGameButton
                  title="Reset"
                  icon="🔄"
                  onPress={handleWordFillReset}
                  variant="ghost"
                  size="md"
                  style={{ flex: 1 }}
                />
                <BrainGameButton
                  title="CHECK WORD"
                  icon="✏️"
                  onPress={handleWordFillCheck}
                  variant="primary"
                  size="md"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          </ScrollView>
        )}

        {/* ======================================================== */}
        {/* 4. WORD PUZZLE (ANAGRAM) */}
        {/* ======================================================== */}
        {gameId === 'word_puzzle' && activeData?.vocab && (
          <ScrollView
            style={{ width: '100%' }}
            contentContainerStyle={styles.puzzleScrollCol}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.notebookCard}>
              <View style={styles.notebookHeaderRow}>
                <Text style={styles.notebookHeaderBadge}>ANAGRAM UNSCRAMBLE 🔠</Text>
              </View>

              <View style={styles.vocabDefinitionBox}>
                <Text style={styles.vocabDefTitle}>Clue / Meaning:</Text>
                <Text style={styles.vocabDefMeaning}>"{activeData.vocab?.meaning}"</Text>
              </View>

              {/* Answer Placed Slots */}
              <Text style={styles.sectionLabel}>Your Word:</Text>
              <View style={styles.wordSlotsRow}>
                {Array.from({ length: activeData.vocab?.word?.length || 0 }).map((_, idx) => {
                  const ch = wordPuzzleAnswer[idx];
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => ch && handleWordPuzzleAnswerTap(ch, idx)}
                      style={[styles.wordSlot, !ch && styles.wordSlotDashed]}
                    >
                      <Text style={styles.wordSlotText}>{ch || ''}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Scrambled Pool */}
              <Text style={styles.sectionLabel}>Available Letters (Tap to place):</Text>
              <View style={styles.scramblePoolRow}>
                {wordPuzzlePool.map((ch, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleWordPuzzlePoolTap(ch, idx)}
                    style={styles.scrambleTile}
                  >
                    <Text style={styles.scrambleTileText}>{ch}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.actionBtnRow}>
                <BrainGameButton
                  title="Reset"
                  icon="🔄"
                  onPress={handleWordPuzzleReset}
                  variant="ghost"
                  size="md"
                  style={{ flex: 1 }}
                />
                <BrainGameButton
                  title="CHECK ANSWER"
                  icon="✏️"
                  onPress={handleWordPuzzleCheck}
                  disabled={wordPuzzleAnswer.length !== activeData.vocab?.word?.length}
                  variant="primary"
                  size="md"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          </ScrollView>
        )}

        {/* ======================================================== */}
        {/* 5. WORD CONNECTION */}
        {/* ======================================================== */}
        {gameId === 'word_connect' && activeData?.letters && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.puzzlePromptBanner}>
              <Text style={styles.puzzlePromptText}>
                Spell valid words from the letter wheel!
              </Text>
            </View>

            {/* Found Words Header & Chips */}
            <View style={styles.foundWordsScroll}>
              <Text style={styles.foundWordsHeader}>
                Words Discovered ({wordConnectFound.length}/
                {activeData.targetWordCount || Math.min(4, activeData.validWords?.length || 4)}):
              </Text>
              <View style={styles.foundWordsChipsRow}>
                {wordConnectFound.map((w, i) => (
                  <View key={i} style={styles.foundWordChip}>
                    <Text style={styles.foundWordChipText}>{w} ⭐️</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Current Spelling Bar */}
            <View style={styles.spellingBar}>
              <Text style={styles.spellingBarText}>
                {wordConnectCurrent || 'TAP LETTERS BELOW'}
              </Text>
            </View>

            {/* Interactive Letter Wheel Tiles */}
            <View style={styles.letterWheelContainer}>
              <View style={styles.letterWheelRow}>
                {activeData.letters?.map((letter: string, i: number) => (
                  <Pressable
                    key={i}
                    onPress={() => handleWordConnectLetterTap(letter)}
                    style={styles.wheelLetterBtn}
                  >
                    <Text style={styles.wheelLetterBtnText}>{letter}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Action Bar: Undo, Clear, Submit */}
            <View style={styles.wheelActionRow}>
              <BrainGameButton
                title="UNDO"
                icon="⌫"
                onPress={handleWordConnectUndo}
                variant="ghost"
                size="md"
                style={{ flex: 1 }}
              />
              <BrainGameButton
                title="CLEAR"
                icon="❌"
                onPress={handleWordConnectClear}
                variant="danger"
                size="md"
                style={{ flex: 1 }}
              />
              <BrainGameButton
                title="SUBMIT"
                icon="🚀"
                onPress={handleWordConnectSubmit}
                variant="primary"
                size="md"
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 6. SUDOKU (Standard 9x9 & Mini 4x4) */}
        {/* ======================================================== */}
        {gameId === 'sudoku' && activeData?.current && (
          <View style={isLandscape ? styles.sudokuLandscapeRow : styles.sudokuPortraitCol}>
            {/* Sudoku Grid Wrapper */}
            <View style={styles.sudokuGridWrapper}>
              {activeData.current?.map((rowArr: any, r: number) => (
                <View
                  key={r}
                  style={[
                    styles.sudokuRow,
                    activeData.size === 9 && r % 3 === 2 && r < 8 && styles.sudokuMajorRow,
                    activeData.size === 4 && r % 2 === 1 && r < 3 && styles.sudokuMajorRow,
                  ]}
                >
                  {rowArr.map((val: any, c: number) => {
                    const isFixed = activeData.initial?.[r]?.[c] !== null;
                    const isSelected = selectedSudokuCell?.r === r && selectedSudokuCell?.c === c;
                    const isRelated =
                      selectedSudokuCell &&
                      (selectedSudokuCell.r === r ||
                        selectedSudokuCell.c === c ||
                        (val !== null && val === activeData.current?.[selectedSudokuCell.r]?.[selectedSudokuCell.c]));
                    const isConflicting = sudokuConflicts.some((cf) => cf.row === r && cf.col === c);

                    return (
                      <Pressable
                        key={c}
                        onPress={() => setSelectedSudokuCell({ r, c })}
                        style={[
                          styles.sudokuCell,
                          { width: sudokuCellSize, height: sudokuCellSize },
                          activeData.size === 9 && c % 3 === 2 && c < 8 && styles.sudokuMajorCol,
                          activeData.size === 4 && c % 2 === 1 && c < 3 && styles.sudokuMajorCol,
                          isFixed && styles.sudokuCellFixed,
                          isRelated && !isSelected && styles.sudokuCellRelated,
                          isSelected && styles.sudokuCellSelected,
                          isConflicting && styles.sudokuCellConflict,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sudokuCellText,
                            { fontSize: activeData.size === 9 ? 16 : 22 },
                            isFixed && styles.sudokuCellFixedText,
                            isConflicting && styles.sudokuCellConflictText,
                          ]}
                        >
                          {val || ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Sudoku Control Panel (Numpad, Erase, Check) */}
            <View style={isLandscape ? styles.sudokuSidePanelLandscape : styles.sudokuBottomPanelPortrait}>
              <View style={styles.sudokuNumpadGrid}>
                {(activeData.size === 4 ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 7, 8, 9]).map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => handleSudokuInput(n)}
                    style={styles.sudokuNumKey}
                  >
                    <Text style={styles.sudokuNumKeyText}>{n}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.sudokuToolsRow}>
                <BrainGameButton
                  title="Erase"
                  icon="🧹"
                  onPress={handleSudokuErase}
                  variant="ghost"
                  size="md"
                  style={{ flex: 1 }}
                />
                <BrainGameButton
                  title="Check"
                  icon="✓"
                  onPress={handleSudokuCheckSubmit}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 7. MEMORY MATCH */}
        {/* ======================================================== */}
        {gameId === 'memory_match' && Array.isArray(activeData) && activeData[0]?.emoji && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.puzzlePromptBanner}>
              <Text style={styles.puzzlePromptText}>
                Flip cards to match nostalgic pairs! (Matched: {memoryMatchedCount}/
                {activeData.length / 2})
              </Text>
            </View>

            <View style={styles.memoryCardsGrid}>
              {activeData.map((card: MemoryCardItem) => {
                const isFlipped = memoryFlippedIds.includes(card.id) || card.isMatched;

                return (
                  <Pressable
                    key={card.id}
                    onPress={() => handleMemoryCardPress(card)}
                    disabled={card.isMatched || isProcessingMemoryMatch}
                    style={[
                      styles.memoryCard,
                      { width: tileConnectCardSize, height: tileConnectCardSize },
                      isFlipped && styles.memoryCardFlipped,
                      card.isMatched && styles.memoryCardMatched,
                    ]}
                  >
                    <Text style={[styles.memoryCardEmoji, { fontSize: tileConnectCardSize > 64 ? 32 : 24 }]}>
                      {isFlipped ? card.emoji : '⭐'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 8. PATTERN COMPLETE (Select-and-Submit) */}
        {/* ======================================================== */}
        {gameId === 'pattern_complete' && activeData?.sequence && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.parchmentCard}>
              <Text style={styles.parchmentQuestionText}>
                What item completes the sequence?
              </Text>

              {/* Sequence Row */}
              <View style={styles.sequenceTilesRow}>
                {activeData.sequence?.map((item: string, idx: number) => {
                  const isTarget = item === '❓';
                  return (
                    <View
                      key={idx}
                      style={[styles.seqTile, isTarget && styles.seqTileTarget]}
                    >
                      <Text style={styles.seqTileText}>{item}</Text>
                    </View>
                  );
                })}
              </View>

              {/* 4 Choices */}
              <Text style={styles.sectionLabel}>Select the matching tile:</Text>
              <View style={styles.patternOptionsGrid}>
                {activeData.options?.map((opt: string, idx: number) => {
                  const isSelected = patternSelectedOption === opt;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => handlePatternOptionSelect(opt)}
                      style={[
                        styles.patternChoiceTile,
                        isSelected && styles.choiceTileSelected,
                      ]}
                    >
                      <Text style={styles.patternChoiceText}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Submit Pattern Button */}
              <BrainGameButton
                title="SUBMIT PATTERN"
                icon="🚀"
                onPress={handlePatternSubmit}
                disabled={!patternSelectedOption || isSubmitting}
                variant="primary"
                size="md"
                style={{ marginTop: 8, width: '100%' }}
              />

              {patternShowExplanation && (
                <View style={styles.patternExplanationBox}>
                  <Text style={styles.patternExplanationTitle}>Pattern Rule:</Text>
                  <Text style={styles.patternExplanationText}>
                    {activeData.explanation}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 9. NUMBER PUZZLES (Select-and-Submit) */}
        {/* ======================================================== */}
        {gameId === 'number_puzzles' && activeData?.equation && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.parchmentCard}>
              <Text style={styles.parchmentQuestionText}>
                Find the number that balances the equation:
              </Text>

              {/* Equation Banner */}
              <View style={styles.equationCard}>
                <Text style={styles.equationText}>{activeData.equation}</Text>
              </View>

              {/* 4 Number Options */}
              <Text style={styles.sectionLabel}>Select the missing number:</Text>
              <View style={styles.numberOptionsGrid}>
                {activeData.options?.map((opt: number, idx: number) => {
                  const isSelected = numberSelectedOption === opt;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => handleNumberOptionSelect(opt)}
                      style={[
                        styles.numChoiceTile,
                        isSelected && styles.choiceTileSelected,
                      ]}
                    >
                      <Text style={styles.numChoiceText}>{opt}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Submit Equation Answer Button */}
              <BrainGameButton
                title="SUBMIT ANSWER"
                icon="🚀"
                onPress={handleNumberSubmit}
                disabled={numberSelectedOption === null || isSubmitting}
                variant="primary"
                size="md"
                style={{ marginTop: 8, width: '100%' }}
              />
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 10. SLIDING PUZZLE */}
        {/* ======================================================== */}
        {gameId === 'sliding_puzzle' && Array.isArray(activeData) && activeData.length >= 9 && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.puzzlePromptBanner}>
              <Text style={styles.puzzlePromptText}>
                Slide numbered tiles to order them 1 to {activeData.length - 1}!
              </Text>
            </View>

            <View style={styles.slidingBoardFrame}>
              <View
                style={[
                  styles.slidingGrid,
                  { width: slidingTileSize * slidingDim + 16 },
                ]}
              >
                {activeData.map((val: number | null, idx: number) => {
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => handleSlidingTilePress(idx)}
                      style={[
                        styles.slidingTile,
                        { width: slidingTileSize, height: slidingTileSize },
                        val === null && styles.slidingTileBlank,
                      ]}
                    >
                      {val !== null ? (
                        <Text style={[styles.slidingTileText, { fontSize: slidingTileSize > 64 ? 26 : 20 }]}>
                          {val}
                        </Text>
                      ) : (
                        <Text style={styles.slidingTileBlankText}>_</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 11. MAZE */}
        {/* ======================================================== */}
        {gameId === 'maze' && Array.isArray(activeData) && Array.isArray(activeData[0]) && activeData[0][0]?.isWall !== undefined && (
          <View style={isLandscape ? styles.mazeLandscapeRow : styles.puzzleFlexCol}>
            {/* Maze Grid */}
            <View style={styles.mazeGridChassis}>
              {activeData.map((rowArr: MazeCell[], r: number) => (
                <View key={r} style={{ flexDirection: 'row' }}>
                  {rowArr.map((cell: MazeCell, c: number) => {
                    const isPlayer = mazePlayerPos.r === r && mazePlayerPos.c === c;
                    const isTrailed = mazeTrail.some((t) => t.r === r && t.c === c);

                    return (
                      <View
                        key={c}
                        style={[
                          styles.mazeCell,
                          { width: mazeCellSize, height: mazeCellSize },
                          cell.isWall && styles.mazeCellWall,
                          cell.isExit && styles.mazeCellExit,
                        ]}
                      >
                        {isPlayer ? (
                          <Text style={{ fontSize: mazeCellSize > 36 ? 22 : 16 }}>🚀</Text>
                        ) : cell.isExit ? (
                          <Text style={{ fontSize: mazeCellSize > 36 ? 20 : 15 }}>🏁</Text>
                        ) : cell.isWall ? (
                          <Text style={{ fontSize: mazeCellSize > 36 ? 18 : 13 }}>🧱</Text>
                        ) : isTrailed ? (
                          <View style={styles.mazeBreadcrumb} />
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Directional D-Pad with Accessible Targets */}
            <View style={styles.dpadContainer}>
              <Pressable
                onPress={() => handleMazeMove(-1, 0)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.dpadBtn}
              >
                <Text style={styles.dpadBtnText}>⬆️</Text>
              </Pressable>
              <View style={styles.dpadMidRow}>
                <Pressable
                  onPress={() => handleMazeMove(0, -1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.dpadBtn}
                >
                  <Text style={styles.dpadBtnText}>⬅️</Text>
                </Pressable>
                <View style={styles.dpadCenterSpacer} />
                <Pressable
                  onPress={() => handleMazeMove(0, 1)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.dpadBtn}
                >
                  <Text style={styles.dpadBtnText}>➡️</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => handleMazeMove(1, 0)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.dpadBtn}
              >
                <Text style={styles.dpadBtnText}>⬇️</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* 12. VISUAL DIFFERENCE */}
        {/* ======================================================== */}
        {gameId === 'visual_diff' && activeData?.gridLeft && (
          <View style={styles.puzzleFlexCol}>
            <View style={styles.puzzlePromptBanner}>
              <Text style={styles.puzzlePromptText}>
                Tap differences on the Right Grid! (Found: {visualDiffFound.length}/
                {activeData.differences?.length || 2})
              </Text>
            </View>

            <View style={styles.dualGridRow}>
              {/* Left Original */}
              <View style={styles.diffGridWrapper}>
                <Text style={styles.diffGridHeader}>ORIGINAL</Text>
                {activeData.gridLeft.map((rowArr: string[], r: number) => (
                  <View key={r} style={{ flexDirection: 'row' }}>
                    {rowArr.map((emoji: string, c: number) => (
                      <View
                        key={c}
                        style={[styles.diffCell, { width: diffCellSize, height: diffCellSize }]}
                      >
                        <Text style={[styles.diffCellEmoji, { fontSize: diffCellSize > 50 ? 28 : 22 }]}>
                          {emoji}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              {/* Right Spot Diff */}
              <View style={styles.diffGridWrapper}>
                <Text style={styles.diffGridHeader}>SPOT DIFF</Text>
                {activeData.gridRight.map((rowArr: string[], r: number) => (
                  <View key={r} style={{ flexDirection: 'row' }}>
                    {rowArr.map((emoji: string, c: number) => {
                      const isFound = visualDiffFound.some(
                        (d) => d.row === r && d.col === c
                      );
                      return (
                        <Pressable
                          key={c}
                          onPress={() => handleVisualDiffCellPress(r, c)}
                          style={[
                            styles.diffCell,
                            { width: diffCellSize, height: diffCellSize },
                            isFound && styles.diffCellFound,
                          ]}
                        >
                          <Text style={[styles.diffCellEmoji, { fontSize: diffCellSize > 50 ? 28 : 22 }]}>
                            {emoji}
                          </Text>
                          {isFound && <Text style={styles.diffFoundStar}>✨</Text>}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Shared Stats Footer */}
      <BrainGameStatsFooter
        score={gameState.score}
        timeSeconds={gameState.elapsedTime}
        moves={gameState.moves}
        mistakes={gameState.mistakes}
        hintsRemaining={gameState.hintsRemaining}
        onHint={handleUseHint}
      />

      {/* Shared Pause Modal */}
      <BrainGamePauseModal
        visible={isPaused}
        onResume={() => setIsPaused(false)}
        onRestart={() => {
          setIsPaused(false);
          initPuzzle(difficulty, currentLevel);
        }}
        onHome={onExit}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Shared Hint Modal */}
      <BrainGameHintModal
        visible={showHintModal}
        hintText={hintText}
        hintsRemaining={gameState.hintsRemaining}
        onClose={() => setShowHintModal(false)}
      />

      {/* Shared Victory / Level Completed Modal */}
      <BrainGameVictoryModal
        visible={gameState.isCompleted}
        score={gameState.score}
        timeSeconds={gameState.elapsedTime}
        moves={gameState.moves}
        mistakes={gameState.mistakes}
        hintsUsed={gameState.hintsUsed}
        level={currentLevel}
        nextLevel={currentLevel + 1}
        activeVocab={
          activeVocab && (gameId === 'word_fill' || gameId === 'word_puzzle')
            ? activeVocab
            : null
        }
        onNextLevel={handleNextLevel}
        onReplayLevel={handleReplayLevel}
        onPlayAgain={handleReplayLevel}
        onHome={onExit}
      />

      {/* Shared Settings / Rules Modal */}
      <BrainGameSettingsModal
        visible={showSettingsModal}
        gameTitle={title}
        instructions={
          GAME_CATEGORY_MAP[gameId]?.instructions ||
          'Solve the puzzle using logic, observation, and deduction.'
        }
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onRestart={() => {
          setShowSettingsModal(false);
          initPuzzle(difficulty, currentLevel);
        }}
        onClose={() => setShowSettingsModal(false)}
      />
    </BrainGameContainer>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 40,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  titleBadge: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  titleBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  sudokuToolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarLeftDefaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sudokuModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0A1B30',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
  },
  sudokuModePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sudokuModePillActive: {
    backgroundColor: '#38BDF8',
  },
  sudokuModePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  sudokuModePillTextActive: {
    color: '#081325',
    fontWeight: '900',
  },
  toolbarPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarIcon: {
    fontSize: 14,
  },
  toolbarLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  toolbarPrompt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  diffCounterPill: {
    backgroundColor: '#0A1B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diffCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  diffSelectorRow: {
    flexDirection: 'row',
    gap: 3,
  },
  diffPillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  diffPillSmallActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  diffPillSmallText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  diffPillSmallTextActive: {
    color: '#FFF',
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 13,
  },
  boardCardFrame: {
    flex: 1,
    backgroundColor: '#0E223D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  feedbackToast: {
    position: 'absolute',
    top: 8,
    zIndex: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    alignSelf: 'center',
    elevation: 8,
  },
  feedbackToastError: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  feedbackToastSuccess: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  feedbackToastText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
  },
  puzzleFlexCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
  },
  puzzleScrollCol: {
    alignItems: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  puzzlePromptBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    marginBottom: 8,
  },
  puzzlePromptText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    textAlign: 'center',
  },

  // 1. Circuit Connect
  circuitWoodChassis: {
    backgroundColor: '#090D16',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#0284C7',
    shadowColor: '#00F5FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  circuitGridInner: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  circuitTileCell: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circuitTilePowered: {
    backgroundColor: '#082F49',
    borderColor: '#0369A1',
  },
  wireLineNorth: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: '52%',
    borderRadius: 2,
  },
  wireLineSouth: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: '52%',
    borderRadius: 2,
  },
  wireLineEast: {
    position: 'absolute',
    top: '50%',
    right: 0,
    marginTop: -4,
    height: 8,
    width: '52%',
    borderRadius: 2,
  },
  wireLineWest: {
    position: 'absolute',
    top: '50%',
    left: 0,
    marginTop: -4,
    height: 8,
    width: '52%',
    borderRadius: 2,
  },
  wireCenterJunction: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
  },
  circuitTerminalBadge: {
    position: 'absolute',
    zIndex: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuitPwrLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#38BDF8',
    marginTop: -2,
  },
  circuitBulbGlow: {
    shadowColor: '#FBBF24',
    shadowRadius: 12,
    shadowOpacity: 0.95,
    elevation: 8,
  },
  circuitLegendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },

  // 2. Tile Connect
  tileConnectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tileConnectCard: {
    backgroundColor: '#334155',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  tileConnectCardSelected: {
    backgroundColor: '#1E3A8A',
    borderColor: '#F59E0B',
    transform: [{ scale: 1.06 }],
    elevation: 6,
  },
  tileConnectCardMatched: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)',
    borderColor: '#10B981',
    opacity: 0.35,
  },
  tileConnectEmoji: {
    textAlign: 'center',
  },

  // 3 & 4. Notebook / Word Puzzles
  notebookCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0F223D',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1C3F69',
    padding: 10,
    alignItems: 'center',
  },
  notebookHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  notebookHeaderBadge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
  },
  notebookCategoryPill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    backgroundColor: '#0C2B4E',
    borderWidth: 1,
    borderColor: '#0284C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  notebookInstruction: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 8,
  },
  wordSlotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  wordSlot: {
    width: 36,
    height: 44,
    borderWidth: 2,
    borderColor: '#1C3F69',
    borderRadius: 6,
    backgroundColor: '#122B4D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordSlotFixed: {
    backgroundColor: '#091526',
    borderColor: '#0F2038',
  },
  wordSlotActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0369A1',
  },
  wordSlotDashed: {
    borderStyle: 'dashed',
    borderColor: '#334155',
  },
  wordSlotText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38BDF8',
  },
  wordSlotFixedText: {
    color: '#F8FAFC',
  },
  wordSlotActiveText: {
    color: '#FFF',
  },
  vocabDefinitionBox: {
    backgroundColor: '#122B4D',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 8,
    width: '100%',
    marginVertical: 6,
  },
  vocabDefTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F59E0B',
    marginBottom: 2,
  },
  vocabDefMeaning: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  vocabDefExample: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#94A3B8',
    marginTop: 2,
  },
  keyboardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
  },
  keyCap: {
    width: 25,
    height: 32,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyCapWide: {
    width: 38,
    height: 32,
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyCapText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  actionBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  checkWordBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkWordBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
  },
  resetWordBtn: {
    backgroundColor: '#64748B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetWordBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  scramblePoolRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 8,
  },
  scrambleTile: {
    width: 42,
    height: 46,
    backgroundColor: '#FEF08A',
    borderWidth: 2,
    borderColor: '#CA8A04',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrambleTileText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#713F12',
  },

  // 5. Word Connect
  foundWordsScroll: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  foundWordsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
  },
  foundWordsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foundWordChip: {
    backgroundColor: '#065F46',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  foundWordChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ECFDF5',
  },
  spellingBar: {
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#38BDF8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginVertical: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  spellingBarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 2,
  },
  letterWheelContainer: {
    marginVertical: 8,
  },
  letterWheelRow: {
    flexDirection: 'row',
    gap: 10,
  },
  wheelLetterBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F59E0B',
    borderWidth: 2.5,
    borderColor: '#B45309',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  wheelLetterBtnText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#451A03',
  },
  wheelActionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  wheelUndoBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  wheelUndoBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
  wheelClearBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  wheelClearBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
  wheelSubmitBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  wheelSubmitBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },

  // 6. Sudoku (Standard 9x9 & Mini 4x4)
  sudokuPortraitCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
  },
  sudokuLandscapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    flex: 1,
  },
  sudokuGridWrapper: {
    borderWidth: 2.5,
    borderColor: '#0284C7',
    backgroundColor: '#0B1727',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sudokuRow: {
    flexDirection: 'row',
  },
  sudokuMajorRow: {
    borderBottomWidth: 2.5,
    borderColor: '#38BDF8',
  },
  sudokuMajorCol: {
    borderRightWidth: 2.5,
    borderColor: '#38BDF8',
  },
  sudokuCell: {
    borderWidth: 0.5,
    borderColor: '#1E3A5F',
    backgroundColor: '#0F223D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sudokuCellFixed: {
    backgroundColor: '#091526',
  },
  sudokuCellRelated: {
    backgroundColor: '#163359',
  },
  sudokuCellSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
    borderWidth: 2,
  },
  sudokuCellConflict: {
    backgroundColor: '#7F1D1D',
    borderColor: '#EF4444',
  },
  sudokuCellText: {
    fontWeight: '800',
    color: '#38BDF8',
  },
  sudokuCellFixedText: {
    color: '#F8FAFC',
    fontWeight: '900',
  },
  sudokuCellConflictText: {
    color: '#FCA5A5',
    fontWeight: '900',
  },
  sudokuBottomPanelPortrait: {
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  sudokuSidePanelLandscape: {
    alignItems: 'center',
    gap: 8,
  },
  sudokuNumpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    justifyContent: 'center',
    maxWidth: 320,
  },
  sudokuNumKey: {
    width: 38,
    height: 42,
    backgroundColor: '#122B4D',
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sudokuNumKeyText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  sudokuToolsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  sudokuToolBtn: {
    backgroundColor: '#334155',
    borderWidth: 1.5,
    borderColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  sudokuCheckBtn: {
    backgroundColor: '#0284C7',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  sudokuToolIcon: {
    fontSize: 12,
    color: '#FFF',
  },
  sudokuToolText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },

  // 7. Memory Match
  memoryCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 360,
  },
  memoryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  memoryCardFlipped: {
    backgroundColor: '#FFF',
    borderColor: '#38BDF8',
  },
  memoryCardMatched: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  memoryCardEmoji: {
    textAlign: 'center',
  },

  // 8 & 9. Parchment / Pattern / Number
  parchmentCard: {
    width: '95%',
    maxWidth: 480,
    backgroundColor: '#0F223D',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1C3F69',
    padding: 12,
    alignItems: 'center',
  },
  parchmentQuestionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  sequenceTilesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  seqTile: {
    width: 44,
    height: 44,
    backgroundColor: '#122B4D',
    borderWidth: 2,
    borderColor: '#1C3F69',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seqTileTarget: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  seqTileText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  patternOptionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  patternChoiceTile: {
    width: 52,
    height: 52,
    backgroundColor: '#122B4D',
    borderWidth: 2,
    borderColor: '#1C3F69',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternChoiceText: {
    fontSize: 24,
    fontWeight: '900',
  },
  choiceTileSelected: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
    borderWidth: 2.5,
    transform: [{ scale: 1.06 }],
  },
  submitAnswerBtn: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  submitAnswerBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
  },
  patternExplanationBox: {
    backgroundColor: '#122B4D',
    borderWidth: 1,
    borderColor: '#0284C7',
    borderRadius: 6,
    padding: 6,
    marginTop: 8,
    width: '100%',
  },
  patternExplanationTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38BDF8',
  },
  patternExplanationText: {
    fontSize: 11,
    color: '#F8FAFC',
  },
  equationCard: {
    backgroundColor: '#091526',
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
  },
  equationText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 2,
  },
  numberOptionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  numChoiceTile: {
    width: 54,
    height: 48,
    backgroundColor: '#122B4D',
    borderWidth: 2,
    borderColor: '#1C3F69',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numChoiceText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
  },

  // 10. Sliding Puzzle
  slidingBoardFrame: {
    backgroundColor: '#5C3A21',
    padding: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#3E2415',
  },
  slidingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: '#27170C',
    padding: 4,
    borderRadius: 8,
    justifyContent: 'center',
  },
  slidingTile: {
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#B45309',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  slidingTileBlank: {
    backgroundColor: '#27170C',
    borderColor: '#3E2415',
    elevation: 0,
  },
  slidingTileText: {
    fontWeight: '900',
    color: '#FFF',
  },
  slidingTileBlankText: {
    fontSize: 14,
    color: '#3E2415',
  },

  // 11. Maze
  mazeLandscapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    flex: 1,
  },
  mazeGridChassis: {
    backgroundColor: '#0F172A',
    padding: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#334155',
  },
  mazeCell: {
    borderWidth: 0.5,
    borderColor: '#1E293B',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mazeCellWall: {
    backgroundColor: '#090D16',
  },
  mazeCellExit: {
    backgroundColor: '#064E3B',
  },
  mazeBreadcrumb: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  dpadContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  dpadMidRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  dpadCenterSpacer: {
    width: 48,
    height: 48,
  },
  dpadBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dpadBtnText: {
    fontSize: 20,
  },

  // 12. Visual Difference
  dualGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    justifyContent: 'center',
  },
  diffGridWrapper: {
    alignItems: 'center',
  },
  diffGridHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 4,
  },
  diffCell: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  diffCellFound: {
    backgroundColor: '#065F46',
    borderColor: '#10B981',
  },
  diffCellEmoji: {
    textAlign: 'center',
  },
  diffFoundStar: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 12,
  },

  // Bottom Status Bar
  bottomStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  statPill: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
  },
  statVal: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  hintGoldBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  hintGoldBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    width: '85%',
    maxWidth: 420,
    backgroundColor: '#FFFDF5',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D97706',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 8,
  },
  modalBodyText: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalDismissBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalDismissBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
  },

  // Victory Card
  victoryCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#FFFDF5',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#16A34A',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  victoryTrophy: {
    fontSize: 48,
    marginBottom: 4,
  },
  victoryTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803D',
  },
  victorySub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 4,
  },
  victoryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 8,
    marginVertical: 10,
  },
  victoryStatCol: {
    alignItems: 'center',
  },
  victoryStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  victoryStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  vocabLearnedCard: {
    width: '100%',
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FACC15',
    padding: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  vocabLearnedTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#854D0E',
  },
  vocabLearnedWord: {
    fontSize: 16,
    fontWeight: '900',
    color: '#713F12',
    marginVertical: 2,
  },
  vocabLearnedMeaning: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#475569',
    textAlign: 'center',
  },
  victoryActionsCol: {
    width: '100%',
    gap: 8,
  },
  victoryNextBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  victoryNextBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
  },
  victoryExitBtn: {
    backgroundColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  victoryExitBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
});
