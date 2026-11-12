import React, { useEffect, useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { UnoEngine } from '../engine/UnoEngine';
import { UnoBot, BotDifficulty } from '../bot/UnoBot';
import { UnoColor, UnoGameState } from '../types/uno.types';
import { UnoBoardComponent } from '../components/UnoBoardComponent';
import { GameRulesModal } from '../../../components/GameRulesModal';
import { GameScreenHeader } from '../../../components/GameScreenHeader';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { THEME } from '../../../theme/theme';

interface UnoGameScreenProps {
  localPlayerName: string;
  onExit: () => void;
}

export const UnoGameScreen: React.FC<UnoGameScreenProps> = ({
  localPlayerName,
  onExit,
}) => {
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [botCount, setBotCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('NORMAL');
  const [engineState, setEngineState] = useState<UnoGameState | null>(null);

  const engineRef = useRef<UnoEngine>(new UnoEngine());
  const botsRef = useRef<UnoBot[]>([]);

  useEffect(() => {
    const engine = engineRef.current;
    const unsub = engine.subscribe((st) => setEngineState(st));
    handleStartMatch();
    return () => {
      unsub();
      botsRef.current.forEach((b) => b.deactivate());
      botsRef.current = [];
    };
  }, []);

  const handleStartMatch = () => {
    // Clean up prior bots
    botsRef.current.forEach((b) => b.deactivate());
    botsRef.current = [];

    const engine = engineRef.current;

    const players = [
      { id: 'player_local_1', name: localPlayerName, isBot: false },
    ];

    const botNames = [
      'Robo Monu',
      'Robo Rahul',
      'Robo Anu',
      'Robo Priya',
      'Robo Appu',
      'Robo Maya',
      'Robo Kuttan',
    ];
    for (let i = 0; i < botCount; i++) {
      players.push({
        id: `bot_${i + 1}`,
        name: botNames[i] || `Bot ${i + 1}`,
        isBot: true,
      });
    }

    engine.startMatch(players);

    // Initialize & activate bots
    botsRef.current = players
      .filter((p) => p.isBot)
      .map((p) => {
        const bot = new UnoBot(engine, p.id, difficulty);
        bot.activate();
        return bot;
      });
  };

  const handlePlayCard = (cardId: string, chosenColor?: UnoColor) => {
    try {
      const activePlayer = engineState?.players[engineState.currentTurnIdx];
      const actingId = activePlayer && !activePlayer.isBot ? activePlayer.id : 'player_local_1';
      engineRef.current.playCard(actingId, cardId, chosenColor);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleDrawCard = () => {
    try {
      const activePlayer = engineState?.players[engineState.currentTurnIdx];
      const actingId = activePlayer && !activePlayer.isBot ? activePlayer.id : 'player_local_1';
      engineRef.current.drawCard(actingId);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleCallUno = () => {
    const activePlayer = engineState?.players[engineState.currentTurnIdx];
    const actingId = activePlayer && !activePlayer.isBot ? activePlayer.id : 'player_local_1';
    engineRef.current.callUno(actingId);
  };

  const handleCatchUno = (targetId: string) => {
    engineRef.current.catchUno(targetId);
  };

  const handleChallenge = (accept: boolean) => {
    try {
      const challengerId = engineState?.pendingChallenge?.challengerId || 'player_local_1';
      engineRef.current.challengeWildDrawFour(challengerId, accept);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleNextRound = () => {
    engineRef.current.startRound();
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.paperDarker} />

      {/* Rules Modal */}
      <GameRulesModal
        visible={showRulesModal}
        gameTitle="UNO"
        rules={[
          'Deal 7 cards per player. Objective is to get rid of all cards.',
          'Match active card by color OR number/symbol.',
          'Special Cards: Skip (lose turn), Reverse (flip direction), Draw Two (draw 2 & lose turn).',
          'Wild & Wild Draw Four: Set next color. Next player draws 4 (can be challenged!).',
          'Call UNO! when holding 1 card left. If caught before next turn, draw 2 penalty cards.',
          'Scoring: First player to 500 points across rounds wins the match!',
        ]}
        onAcknowledge={() => setShowRulesModal(false)}
      />

      <View style={styles.container}>
        {/* Unified Game Screen Header */}
        <GameScreenHeader
          title="🃏 UNO ARENA"
          badge="TARGET: 500 PTS"
          onExit={onExit}
        />

        {engineState && engineState.status === 'PLAYING' ? (
          <View style={{ flex: 1 }}>
            {/* Scoreboard Bar */}
            <View style={styles.scoreboardBox}>
              <Text style={styles.scoreboardTitle}>Current Match Scores:</Text>
              <View style={styles.scoreRow}>
                {engineState.players.map((p) => (
                  <View key={p.id} style={styles.scoreChip}>
                    <Text style={styles.scoreName}>{p.name}:</Text>
                    <Text style={styles.scoreVal}>{p.score} pts</Text>
                  </View>
                ))}
              </View>
            </View>

            <UnoBoardComponent
              state={engineState}
              localPlayerId="player_local_1"
              onPlayCard={handlePlayCard}
              onDrawCard={handleDrawCard}
              onCallUno={handleCallUno}
              onCatchUno={handleCatchUno}
              onChallenge={handleChallenge}
              hideHeader={true}
              onExit={onExit}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Phase 1: Setup Options */}
            {(!engineState || engineState.status === 'SETUP') && (
              <View style={styles.setupCard}>
                <Text style={styles.setupTitle}>UNO Match Setup:</Text>

                <Text style={styles.label}>Select Number of Opponent Bots:</Text>
                <View style={styles.btnRow}>
                  {[1, 2, 3, 5, 7].map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => setBotCount(num)}
                      style={[styles.chip, botCount === num && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, botCount === num && styles.chipTextActive]}>
                        +{num} ({num + 1}P)
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Select Bot Difficulty:</Text>
                <View style={styles.btnRow}>
                  {(['EASY', 'NORMAL', 'HARD'] as BotDifficulty[]).map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setDifficulty(d)}
                      style={[styles.chip, difficulty === d && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, difficulty === d && styles.chipTextActive]}>
                        {d}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <HandDrawnButton
                  title="DEAL CARDS & START 🃏"
                  variant="primary"
                  onPress={handleStartMatch}
                  style={{ marginTop: 16 }}
                />

                <HandDrawnButton
                  title="HOW TO PLAY / RULES 📖"
                  variant="secondary"
                  onPress={() => setShowRulesModal(true)}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}

            {/* Phase 3: Round Over Modal / Card */}
            {engineState && engineState.status === 'ROUND_OVER' && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>🎉 ROUND COMPLETED!</Text>
                <Text style={styles.resultDesc}>
                  Winner:{' '}
                  {engineState.players.find((p) => p.id === engineState.roundWinnerId)?.name}
                </Text>

                <View style={styles.scoreboardBox}>
                  <Text style={styles.scoreboardTitle}>Cumulative Match Standings:</Text>
                  {engineState.players.map((p) => (
                    <Text key={p.id} style={styles.standingsText}>
                      {p.name}: {p.score} / 500 pts
                    </Text>
                  ))}
                </View>

                <HandDrawnButton
                  title="START NEXT ROUND ➡️"
                  variant="primary"
                  onPress={handleNextRound}
                  style={{ marginTop: 14 }}
                />
              </View>
            )}

            {/* Phase 4: Match Over Winner Card */}
            {engineState && engineState.status === 'MATCH_OVER' && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>🏆 UNO MATCH CHAMPION!</Text>
                <Text style={styles.resultDesc}>
                  {engineState.players.find((p) => p.id === engineState.winnerId)?.name} reached 500
                  points and won the match!
                </Text>

                <HandDrawnButton
                  title="PLAY AGAIN 🔄"
                  variant="primary"
                  onPress={handleStartMatch}
                  style={{ marginTop: 14 }}
                />
                <HandDrawnButton
                  title="BACK TO HOME 🏠"
                  variant="secondary"
                  onPress={onExit}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </ScrollView>
        )}
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
  },
  exitBtn: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1,
    borderColor: THEME.colors.maroon,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  exitBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
  },
  scoreBadge: {
    backgroundColor: THEME.colors.purpleGlow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.colors.purpleBright,
  },
  scrollContent: {
    padding: 14,
  },
  setupCard: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 16,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.pencil,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pencil,
    marginTop: 10,
    marginBottom: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 8,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: THEME.colors.mustard,
    borderColor: THEME.colors.maroon,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  chipTextActive: {
    color: THEME.colors.maroon,
    fontWeight: '900',
  },
  scoreboardBox: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  scoreboardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.pencilLight,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreChip: {
    flexDirection: 'row',
    gap: 4,
  },
  scoreName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  scoreVal: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.keralaGreen,
  },
  resultCard: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 14,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.pencil,
    marginBottom: 6,
  },
  resultDesc: {
    fontSize: 14,
    color: THEME.colors.pencilLight,
    marginBottom: 12,
  },
  standingsText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pencil,
    marginVertical: 2,
  },
});
