import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  StatusBar,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { RoomController } from '../games/bingo/controllers/RoomController';
import { multiplayerEventBus } from '../games/bingo/events/MultiplayerEventBus';
import {
  BingoBoardGrid,
  BingoProgress,
  GamePhase,
} from '../games/bingo/types/bingo.types';
import { GameSettings, MatchResultSnapshot } from '../types';
import { localGameRepository, DEFAULT_SETTINGS } from '../storage/LocalGameRepository';
import { soundService } from '../audio/soundService';
import { THEME } from '../theme/theme';
import { BoardSetupContainer } from '../games/bingo/components/BoardSetupContainer';
import { CallerPanel } from '../games/bingo/components/CallerPanel';
import { BingoBoardGridComponent } from '../games/bingo/components/BingoBoardGridComponent';
import { OtherPlayersStatus } from '../games/bingo/components/OtherPlayersStatus';
import { ScoreboardComponent } from '../components/ScoreboardComponent';
import { WinnerModal } from '../games/bingo/components/WinnerModal';
import { WinnerBoardModal } from '../games/bingo/components/WinnerBoardModal';
import { ReportIssueModal } from '../games/bingo/components/ReportIssueModal';
import { ReactionsOverlay } from '../games/bingo/components/ReactionsOverlay';
import { GameRulesModal } from '../components/GameRulesModal';
import { WaitingForPlayersCard } from '../games/bingo/components/WaitingForPlayersCard';

interface BingoGameScreenProps {
  controller: RoomController;
  localPlayerId: string;
  onExit: () => void;
}

export const BingoGameScreen: React.FC<BingoGameScreenProps> = ({
  controller,
  localPlayerId,
  onExit,
}) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [room, setRoom] = useState(controller.getRoomData());
  const [match, setMatch] = useState(controller.getCurrentMatch());

  const localEngine = controller.getPlayerEngine(localPlayerId)!;

  const [grid, setGrid] = useState<BingoBoardGrid>(localEngine.getGrid());
  const [isLocked, setIsLocked] = useState<boolean>(localEngine.getIsLocked());
  const [phase, setPhase] = useState<GamePhase>(localEngine.getPhase());
  const [calledNumbers, setCalledNumbers] = useState<number[]>(match?.calledNumbers || []);
  const [currentNumber, setCurrentNumber] = useState<number | null>(
    match?.calledNumbers.length ? match.calledNumbers[match.calledNumbers.length - 1] : null
  );
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(localEngine.getMarkedNumbers());
  const [progress, setProgress] = useState<BingoProgress>(localEngine.getProgress());

  const [selectedNumToCall, setSelectedNumToCall] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [activeReaction, setActiveReaction] = useState<{ playerName: string; text: string } | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState<boolean>(false);
  const [isRulesAcknowledged, setIsRulesAcknowledged] = useState<boolean>(false);

  const [activeSnapshot, setActiveSnapshot] = useState<MatchResultSnapshot | null>(null);
  const [isWinnerBoardOpen, setIsWinnerBoardOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  const localPlayer = room.players.find((p) => p.id === localPlayerId);

  useEffect(() => {
    loadSettings();
    const unsubscribeBus = setupMultiplayerBusListeners();
    const unsubscribeEngine = setupLocalEngineListeners();

    return () => {
      unsubscribeBus();
      unsubscribeEngine();
    };
  }, []);

  const loadSettings = async () => {
    const s = await localGameRepository.getSettings();
    setSettings(s);
  };

  const handleUpdateSettings = async (newSettings: GameSettings) => {
    setSettings(newSettings);
    await localGameRepository.saveSettings(newSettings);
  };

  const syncStateFromController = () => {
    const updatedRoom = controller.getRoomData();
    const updatedMatch = controller.getCurrentMatch();
    setRoom(updatedRoom);
    setMatch(updatedMatch);

    if (updatedMatch) {
      setCalledNumbers([...updatedMatch.calledNumbers]);
      if (updatedMatch.calledNumbers.length > 0) {
        setCurrentNumber(updatedMatch.calledNumbers[updatedMatch.calledNumbers.length - 1]);
      }
    }

    setGrid(localEngine.getGrid());
    setIsLocked(localEngine.getIsLocked());
    setPhase(localEngine.getPhase());
    setMarkedNumbers(localEngine.getMarkedNumbers());
    setProgress(localEngine.getProgress());
  };

  const setupMultiplayerBusListeners = () => {
    return multiplayerEventBus.subscribe('*', (event) => {
      syncStateFromController();

      if (event.eventType === 'FIRST_CALLER_SELECTED') {
        const callerName = event.payload.callerName || 'Player';
        setToastMessage(`📣 FIRST CALLER: ${callerName}`);
        setTimeout(() => setToastMessage(null), 4000);
      }

      if (event.eventType === 'NUMBER_CALLED') {
        const num = event.payload.number;
        setCurrentNumber(num);
        soundService.playCallChime(settings);
        soundService.speakNumber(num, settings);

        // Auto-mark valid called number on player's card when opponent or bot calls it
        if (event.payload.callerId !== localPlayerId) {
          if (localEngine.hasNumberOnBoard(num) && !localEngine.getMarkedNumbers().has(num)) {
            controller.markPlayerNumber(localPlayerId, num);
          }
        }
      }

      if (event.eventType === 'BINGO_CLAIMED') {
        soundService.playVictoryFanfare(settings);
        if (event.payload.snapshot) {
          setActiveSnapshot(event.payload.snapshot);
        }
        setIsWinnerModalOpen(true);
      }

      if (event.eventType === 'PLAYER_REACTION_SENT') {
        const p = room.players.find((player) => player.id === event.playerId);
        setActiveReaction({
          playerName: p ? p.name : 'Friend',
          text: event.payload.reaction,
        });
        setTimeout(() => setActiveReaction(null), 3000);
      }
    });
  };

  const setupLocalEngineListeners = () => {
    return localEngine.on('*', (event) => {
      setGrid(localEngine.getGrid());
      setIsLocked(localEngine.getIsLocked());
      setPhase(localEngine.getPhase());
      setMarkedNumbers(localEngine.getMarkedNumbers());
      setProgress(localEngine.getProgress());

      if (event.type === 'PLAYER_MARKED') {
        soundService.playMarkSound(settings.markingStyle, settings);
      }

      if (event.type === 'B_PATTERN_COMPLETED') {
        setToastMessage('🎉 B COMPLETE! (Line 1)');
        setTimeout(() => setToastMessage(null), 3000);
      }
      if (event.type === 'I_PATTERN_COMPLETED') {
        setToastMessage('🎉 I COMPLETE! (Line 2)');
        setTimeout(() => setToastMessage(null), 3000);
      }
      if (event.type === 'N_PATTERN_COMPLETED') {
        setToastMessage('🎉 N COMPLETE! (Line 3)');
        setTimeout(() => setToastMessage(null), 3000);
      }
      if (event.type === 'G_PATTERN_COMPLETED') {
        setToastMessage('🎉 G COMPLETE! (Line 4)');
        setTimeout(() => setToastMessage(null), 3000);
      }
      if (event.type === 'O_PATTERN_COMPLETED') {
        setToastMessage('🎉 O COMPLETE! (Line 5)');
        setTimeout(() => setToastMessage(null), 3000);
      }
    });
  };

  const handleGridChange = (newGrid: BingoBoardGrid) => {
    setGrid(newGrid);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        localEngine.setCell(r, c, newGrid[r][c]);
      }
    }
  };

  const handleConfirmBoard = () => {
    const res = localEngine.confirmBoard();
    if (res.isValid) {
      setIsLocked(true);
      setPhase(localEngine.getPhase());
      syncStateFromController();
    }
  };

  const handleCallNextNumber = (numToCall?: number) => {
    try {
      controller.callNextNumber(localPlayerId, numToCall);
      setSelectedNumToCall(null);
    } catch (e: any) {
      setFeedbackMessage(e.message || 'Cannot call number.');
      setTimeout(() => setFeedbackMessage(null), 2500);
    }
  };

  const handleCellPress = (num: number) => {
    const isLocalTurn = (match?.currentTurnPlayerId || room.hostPlayerId) === localPlayerId;
    const isCalled = calledNumbers.includes(num);

    if (isCalled) {
      const res = controller.markPlayerNumber(localPlayerId, num);
      if (!res.success) {
        setFeedbackMessage(res.message || 'Cannot mark number.');
        setTimeout(() => setFeedbackMessage(null), 2500);
      }
    } else if (isLocalTurn) {
      setSelectedNumToCall(num);
    } else {
      setFeedbackMessage('Number not called yet.');
      setTimeout(() => setFeedbackMessage(null), 2500);
    }
  };

  const handleClaimBingo = () => {
    const res = controller.claimBingo(localPlayerId);
    if (!res.isValid) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleRevengeRound = () => {
    setIsWinnerModalOpen(false);
    controller.startRevengeRound();
    syncStateFromController();
  };

  const handlePlayAgainNewBoard = () => {
    setIsWinnerModalOpen(false);
    controller.startPlayAgain();
    syncStateFromController();
  };

  const winnerPlayer = room.players.find((p) => p.id === match?.winnerId) || localPlayer;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const statusBarPadding =
    Platform.OS === 'android'
      ? isLandscape
        ? 0
        : Math.max(32, StatusBar.currentHeight || 32)
      : 0;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.paperDarker} />
      <View style={styles.container}>
        {/* Mandatory Game Rules Confirmation Modal */}
        <GameRulesModal
          visible={!isRulesAcknowledged}
          gameTitle="BINGO"
          onAcknowledge={() => setIsRulesAcknowledged(true)}
        />

        {/* Reaction Toast Overlay */}
        <ReactionsOverlay reaction={activeReaction} />

        {/* Anime Match Header Bar with Android Status Bar Clearance */}
        <View style={[styles.headerBar, { paddingTop: statusBarPadding + 10 }]}>
          <Pressable
            onPress={onExit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
          >
            <Text style={styles.backBtnText}>← EXIT</Text>
          </Pressable>

          <View style={styles.roomInfoGroup}>
            <Text style={styles.roomCodeText}>ROOM {room.roomCode}</Text>
            <Text style={styles.matchCountText}>MATCH #{match?.matchNumber || 1}</Text>
          </View>

          <View style={styles.playerTag}>
            <Text style={styles.playerAvatarText}>{localPlayer?.avatar || '⚡'}</Text>
            <Text style={styles.playerNameText}>{localPlayer?.name}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Room Scoreboard */}
          <ScoreboardComponent scoreboard={room.scoreboard} roomId={room.roomCode} />

          {/* Phase 1: Board Setup */}
          {!isLocked && isRulesAcknowledged && (
            <BoardSetupContainer
              grid={grid}
              maxNumber={match?.maxNumber || (room.variant === 'BINGO_1_50' ? 50 : 25)}
              onGridChange={handleGridChange}
              onConfirmBoard={handleConfirmBoard}
            />
          )}

          {/* Phase 1.5: Board Locked, Waiting for Other Players */}
          {isLocked && isRulesAcknowledged && match?.status !== 'PLAYING' && (
            <WaitingForPlayersCard
              players={room.players}
              localPlayerId={localPlayerId}
            />
          )}

          {/* Phase 2: Active Match */}
          {isLocked && isRulesAcknowledged && match?.status === 'PLAYING' && (
            <>
              <CallerPanel
                currentTurnPlayerId={match?.currentTurnPlayerId || room.hostPlayerId}
                currentTurnPlayerName={
                  room.players.find((p) => p.id === (match?.currentTurnPlayerId || room.hostPlayerId))?.name || 'Player'
                }
                isLocalTurn={(match?.currentTurnPlayerId || room.hostPlayerId) === localPlayerId}
                currentNumber={currentNumber}
                calledNumbers={calledNumbers}
                maxNumber={match?.maxNumber || (room.variant === 'BINGO_1_50' ? 50 : 25)}
                onCallNext={handleCallNextNumber}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                isFinished={calledNumbers.length >= (match?.maxNumber || (room.variant === 'BINGO_1_50' ? 50 : 25))}
                selectedNumToCall={selectedNumToCall}
                onClearSelectedNumToCall={() => setSelectedNumToCall(null)}
              />

              <OtherPlayersStatus
                players={room.players}
                localPlayerId={localPlayerId}
                currentTurnPlayerId={match?.currentTurnPlayerId || room.hostPlayerId}
              />

              <BingoBoardGridComponent
                grid={grid}
                markedNumbers={markedNumbers}
                calledNumbers={calledNumbers}
                markingStyle={settings.markingStyle}
                onCellPress={handleCellPress}
                feedbackMessage={feedbackMessage}
                progress={progress}
                celebrationText={toastMessage}
                onClaimBingo={handleClaimBingo}
                selectedNumToCall={selectedNumToCall}
              />
            </>
          )}
        </ScrollView>

        <WinnerModal
          visible={isWinnerModalOpen}
          winnerName={winnerPlayer?.name || 'Player'}
          winnerNickname={winnerPlayer?.nickname}
          winnerAvatar={winnerPlayer?.avatar}
          roomId={room.roomCode}
          matchNumber={match?.matchNumber || 1}
          totalCalls={calledNumbers.length}
          onRevengeRound={handleRevengeRound}
          onPlayAgain={handlePlayAgainNewBoard}
          onExitRoom={onExit}
          onViewWinnerBoard={() => setIsWinnerBoardOpen(true)}
          onReportIssue={() => setIsReportModalOpen(true)}
          reportSuccessMsg={reportSuccessMsg}
        />

        <WinnerBoardModal
          visible={isWinnerBoardOpen}
          snapshot={activeSnapshot}
          onClose={() => setIsWinnerBoardOpen(false)}
        />

        <ReportIssueModal
          visible={isReportModalOpen}
          snapshot={activeSnapshot}
          reportingPlayerId={localPlayerId}
          reportingPlayerName={localPlayer?.name || 'Player'}
          onClose={() => setIsReportModalOpen(false)}
          onReportSubmitted={() => {
            setIsReportModalOpen(false);
            setReportSuccessMsg('Dispute report filed successfully.');
            setTimeout(() => setReportSuccessMsg(null), 4000);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: THEME.colors.paperDarker,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.paper,
  },
  headerBar: {
    backgroundColor: THEME.colors.paperLight,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: THEME.colors.cyanBright,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...THEME.shadows.neonGlowCyan,
  },
  backBtn: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.pinkBright,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPressed: {
    opacity: 0.8,
    backgroundColor: THEME.colors.pinkGlow,
  },
  backBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: THEME.colors.pinkBright,
    letterSpacing: 0.5,
  },
  roomInfoGroup: {
    alignItems: 'center',
  },
  roomCodeText: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 1,
  },
  matchCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.pencilGrey,
  },
  playerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.purpleGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.purpleBright,
  },
  playerAvatarText: {
    fontSize: 16,
    marginRight: 6,
  },
  playerNameText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.purpleBright,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
  },
});
