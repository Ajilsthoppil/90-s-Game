import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, BackHandler } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { GamesScreen, MainCategoryFilter } from './src/screens/GamesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LobbyScreen } from './src/screens/LobbyScreen';
import { BingoGameScreen } from './src/screens/BingoGameScreen';
import { UnoGameScreen } from './src/games/uno/screens/UnoGameScreen';
import { Phase10GameScreen } from './src/games/phase10/screens/Phase10GameScreen';
import { SnakesGameScreen } from './src/games/snakesAndLadders/screens/SnakesGameScreen';
import { LudoGameScreen } from './src/games/ludo/screens/LudoGameScreen';
import { BrainGameScreen } from './src/games/brain/screens/BrainGameScreen';
import { BrainGamesBrowserScreen } from './src/games/brain/screens/BrainGamesBrowserScreen';
import { RoomController } from './src/games/bingo/controllers/RoomController';
import { localGameRepository, DEFAULT_PROFILE } from './src/storage/LocalGameRepository';
import { PlayerProfile } from './src/types';
import { THEME } from './src/theme/theme';
import { BrainGameId } from './src/games/brain/types/brain.types';
import { getGameById } from './src/games/GameRegistry';
import { BottomNavigationBar, BottomTabType } from './src/components/BottomNavigationBar';
import { ErrorBoundary } from './src/components/ErrorBoundary';

type GameModeType =
  | 'MAIN_TABS'
  | 'BRAIN_BROWSER'
  | 'LOBBY'
  | 'BINGO'
  | 'UNO'
  | 'PHASE10'
  | 'SNAKES_LADDERS'
  | 'LUDO'
  | 'BRAIN';

// QA Test verification override (set to null in production)
let TEST_MODE_OVERRIDE: GameModeType | null = null;
let TEST_TAB_OVERRIDE: BottomTabType | null = null;
let TEST_CATEGORY_OVERRIDE: MainCategoryFilter | null = null;
let TEST_BRAIN_OVERRIDE: BrainGameId | null = null;

interface AppProps {
  brainGame?: BrainGameId;
  mode?: GameModeType;
  tab?: BottomTabType;
  sudokuMode?: 'STANDARD' | 'MINI';
}

const brainTitleMap: Record<BrainGameId, string> = {
  circuit_connect: 'Circuit Connection',
  tile_connect: 'Tile Connection',
  word_fill: 'Word Fill',
  word_puzzle: 'Word Puzzle',
  word_connect: 'Word Connection',
  sudoku: 'Sudoku',
  memory_match: 'Memory Match',
  pattern_complete: 'Pattern Complete',
  number_puzzles: 'Number Puzzles',
  sliding_puzzle: 'Sliding Puzzle',
  maze: 'Maze Labyrinth',
  visual_diff: 'Visual Difference',
};

export default function App(props?: AppProps) {
  const initialMode: GameModeType = props?.brainGame ? 'BRAIN' : (props?.mode ?? 'MAIN_TABS');
  const initialBrainGame: BrainGameId = props?.brainGame ?? 'circuit_connect';
  const initialBrainTitle = props?.brainGame ? (brainTitleMap[props.brainGame] || 'Brain Game') : 'Circuit Connection';

  const [activeTab, setActiveTab] = useState<BottomTabType>(props?.tab ?? 'HOME');
  const [gamesCategoryFilter, setGamesCategoryFilter] = useState<MainCategoryFilter>('ALL');
  const [currentMode, setCurrentMode] = useState<GameModeType>(initialMode);

  const effectiveMode = TEST_MODE_OVERRIDE ?? currentMode;
  const effectiveTab = TEST_TAB_OVERRIDE ?? activeTab;
  const effectiveCategory = TEST_CATEGORY_OVERRIDE ?? gamesCategoryFilter;
  const [activeBrainGameId, setActiveBrainGameId] = useState<BrainGameId>(initialBrainGame);
  const [activeBrainTitle, setActiveBrainTitle] = useState<string>(initialBrainTitle);

  const effectiveBrainGameId = TEST_BRAIN_OVERRIDE ?? activeBrainGameId;
  const effectiveBrainTitle = TEST_BRAIN_OVERRIDE ? brainTitleMap[TEST_BRAIN_OVERRIDE] : activeBrainTitle;
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [controller, setController] = useState<RoomController | null>(null);

  useEffect(() => {
    loadProfile();
    if (TEST_MODE_OVERRIDE === 'LOBBY') {
      const c = new RoomController(DEFAULT_PROFILE);
      c.addPlayer({ id: 'player_rahul', name: 'Rahul', nickname: 'Rahu', avatar: '🏏' });
      c.addPlayer({ id: 'player_anu', name: 'Anu', nickname: 'Anumol', avatar: '🌸' });
      setController(c);
    }
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (currentMode !== 'MAIN_TABS') {
        handleLeaveRoom();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentMode]);

  const loadProfile = async () => {
    const p = await localGameRepository.getProfile();
    setProfile(p);
  };

  const handleSelectGame = async (gameId: string, playMode: 'SYSTEM' | 'CREATE' | 'JOIN') => {
    const p = await localGameRepository.getProfile();

    if (gameId === 'bingo') {
      const newController = new RoomController(p);
      if (playMode === 'SYSTEM') {
        newController.setPlayMode('SYSTEM');
      } else if (playMode === 'JOIN') {
        newController.addPlayer({ id: 'player_rahul', name: 'Rahul', nickname: 'Rahu', avatar: '🏏' });
        newController.addPlayer({ id: 'player_anu', name: 'Anu', nickname: 'Anumol', avatar: '🌸' });
      }
      setController(newController);
      setCurrentMode('LOBBY');
    } else if (gameId === 'uno') {
      setCurrentMode('UNO');
    } else if (gameId === 'phase10') {
      setCurrentMode('PHASE10');
    } else if (gameId === 'snakes_ladders') {
      setCurrentMode('SNAKES_LADDERS');
    } else if (gameId === 'ludo') {
      setCurrentMode('LUDO');
    } else {
      // Single-player Brain Game - Go directly to BrainGameScreen
      const def = getGameById(gameId);
      setActiveBrainGameId(gameId as BrainGameId);
      setActiveBrainTitle(def?.title || 'Brain Game');
      setCurrentMode('BRAIN');
    }
  };

  const handleToggleReady = (playerId: string, isReady: boolean) => {
    if (!controller) return;
    controller.setPlayerReady(playerId, isReady);
  };

  const handleAddSimulatedPlayer = (name: string, nickname: string, avatar: string) => {
    if (!controller) return;
    const id = `player_${name.toLowerCase()}`;
    controller.addPlayer({ id, name, nickname, avatar });
  };

  const handleStartMatch = () => {
    if (!controller) return;
    const check = controller.canStartMatch();
    if (!check.canStart) return;

    controller.startMatch();
    setCurrentMode('BINGO');
  };

  const handleLeaveRoom = () => {
    setController(null);
    setCurrentMode('MAIN_TABS');
  };

  return (
    <ErrorBoundary onReset={handleLeaveRoom}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.paperLight} />

      {/* Main Tab Screens Shell */}
      {effectiveMode === 'MAIN_TABS' && (
        <View style={styles.tabContentShell}>
          {effectiveTab === 'HOME' && (
            <HomeScreen
              onSelectGame={handleSelectGame}
              onNavigateTab={(tab, category) => {
                if (category) {
                  setGamesCategoryFilter(category);
                }
                setActiveTab(tab);
              }}
            />
          )}

          {effectiveTab === 'GAMES' && (
            <GamesScreen
              onSelectGame={handleSelectGame}
              initialCategory={effectiveCategory}
            />
          )}

          {effectiveTab === 'PROFILE' && (
            <ProfileScreen />
          )}

          {/* Persistent Mobile Bottom Navigation Bar */}
          <BottomNavigationBar
            activeTab={effectiveTab}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        </View>
      )}

      {/* Dedicated Brain Games Browser Screen */}
      {effectiveMode === 'BRAIN_BROWSER' && (
        <BrainGamesBrowserScreen
          onSelectBrainGame={(id) => {
            const def = getGameById(id);
            setActiveBrainGameId(id as BrainGameId);
            setActiveBrainTitle(def?.title || 'Brain Game');
            setCurrentMode('BRAIN');
          }}
          onBackToHome={() => setCurrentMode('MAIN_TABS')}
        />
      )}

      {/* Direct Full-screen Active Game Modes */}
      {effectiveMode === 'LOBBY' && controller && (
        <LobbyScreen
          room={controller.getRoomData()}
          localPlayerId={profile.id || 'player_local_1'}
          onToggleReady={handleToggleReady}
          onAddSimulatedPlayer={handleAddSimulatedPlayer}
          onSetupBots={(count, diff) => controller.setupBotOpponents(count, diff)}
          onSetPlayMode={(mode) => controller.setPlayMode(mode)}
          onSetVariant={(v) => controller.setVariant(v)}
          onStartMatch={handleStartMatch}
          onLeaveLobby={handleLeaveRoom}
          canStart={controller.canStartMatch().canStart}
          startReason={controller.canStartMatch().reason}
        />
      )}

      {effectiveMode === 'BINGO' && controller && (
        <BingoGameScreen
          controller={controller}
          localPlayerId={profile.id || 'player_local_1'}
          onExit={handleLeaveRoom}
        />
      )}

      {effectiveMode === 'UNO' && (
        <UnoGameScreen
          localPlayerName={profile.name || 'Ajil'}
          onExit={handleLeaveRoom}
        />
      )}

      {effectiveMode === 'PHASE10' && (
        <Phase10GameScreen
          localPlayerName={profile.name || 'Ajil'}
          onExit={handleLeaveRoom}
        />
      )}

      {effectiveMode === 'SNAKES_LADDERS' && (
        <SnakesGameScreen
          localPlayerName={profile.name || 'Ajil'}
          onExit={handleLeaveRoom}
        />
      )}

      {effectiveMode === 'LUDO' && (
        <LudoGameScreen
          localPlayerName={profile.name || 'Ajil'}
          onExit={handleLeaveRoom}
        />
      )}

      {effectiveMode === 'BRAIN' && (
        <BrainGameScreen
          gameId={effectiveBrainGameId}
          title={effectiveBrainTitle}
          onExit={handleLeaveRoom}
          initialSudokuMode={props?.sudokuMode}
        />
      )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.paper,
  },
  tabContentShell: {
    flex: 1,
    justifyContent: 'space-between',
  },
});
