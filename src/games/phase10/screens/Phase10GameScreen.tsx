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
import { Phase10Engine } from '../engine/Phase10Engine';
import { Phase10Bot } from '../bot/Phase10Bot';
import { Phase10GameState } from '../types/phase10.types';
import { Phase10BoardComponent } from '../components/Phase10BoardComponent';
import { GameRulesModal } from '../../../components/GameRulesModal';
import { GameScreenHeader } from '../../../components/GameScreenHeader';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { THEME } from '../../../theme/theme';

interface Phase10GameScreenProps {
  localPlayerName: string;
  onExit: () => void;
}

export const Phase10GameScreen: React.FC<Phase10GameScreenProps> = ({
  localPlayerName,
  onExit,
}) => {
  const [isRulesAcknowledged, setIsRulesAcknowledged] = useState(true);
  const [botCount, setBotCount] = useState<number>(3);
  const [engineState, setEngineState] = useState<Phase10GameState | null>(null);

  const engineRef = useRef<Phase10Engine>(new Phase10Engine());
  const botsRef = useRef<Phase10Bot[]>([]);

  useEffect(() => {
    const engine = engineRef.current;
    const unsub = engine.subscribe((st) => setEngineState(st));
    handleStartMatch();
    return () => unsub();
  }, []);

  const handleStartMatch = () => {
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

    botsRef.current = players
      .filter((p) => p.isBot)
      .map((p) => {
        const bot = new Phase10Bot(engine, p.id);
        bot.activate();
        return bot;
      });
  };

  const handleDraw = (fromDiscard: boolean) => {
    try {
      engineRef.current.drawCard('player_local_1', fromDiscard);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleDiscard = (cardId: string, skipTargetPlayerId?: string) => {
    try {
      engineRef.current.discardCard('player_local_1', cardId, skipTargetPlayerId);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleLayDownPhase = (cardGroups: any) => {
    try {
      engineRef.current.layDownPhase('player_local_1', cardGroups);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleHitPhase = (targetPlayerId: string, groupIndex: number, cardId: string) => {
    try {
      engineRef.current.hitPhase('player_local_1', targetPlayerId, groupIndex, cardId);
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

      <GameRulesModal
        visible={!isRulesAcknowledged}
        gameTitle="PHASE 10"
        rules={[
          'Complete 10 official phases in order: Phase 1 (2 sets of 3) through Phase 10 (1 set of 5 + 1 set of 3).',
          'Every turn: DRAW card -> LAY DOWN PHASE (if complete) -> HIT (if phase laid) -> DISCARD 1 card.',
          'Skip cards cause selected target opponent to lose their turn.',
          'Round ends when a player goes out (0 cards). Round winner scores 0 pts.',
          'Players who completed phase advance to next phase. Players remaining repeat current phase.',
          'Winner: First player to complete Phase 10 with lowest total score!',
        ]}
        onAcknowledge={() => setIsRulesAcknowledged(true)}
      />

      <View style={styles.container}>
        {(!engineState || engineState.status !== 'PLAYING') && (
          <GameScreenHeader
            title="🔢 PHASE 10 ARENA"
            badge={`ROUND ${engineState?.roundNumber || 1}`}
            onExit={onExit}
            onOpenRules={() => setIsRulesAcknowledged(false)}
          />
        )}

        {engineState && engineState.status === 'PLAYING' ? (
          <View style={{ flex: 1 }}>
            <Phase10BoardComponent
              state={engineState}
              localPlayerId="player_local_1"
              onDraw={handleDraw}
              onDiscard={handleDiscard}
              onLayDownPhase={handleLayDownPhase}
              onHitPhase={handleHitPhase}
              hideHeader={false}
              onExit={onExit}
              onOpenRules={() => setIsRulesAcknowledged(false)}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {(!engineState || engineState.status === 'SETUP') && isRulesAcknowledged && (
              <View style={styles.setupCard}>
                <Text style={styles.setupTitle}>Phase 10 Match Setup:</Text>

                <Text style={styles.label}>Select Opponent Bots:</Text>
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

                <HandDrawnButton
                  title="START PHASE 10 MATCH 🔢"
                  variant="primary"
                  onPress={handleStartMatch}
                  style={{ marginTop: 16 }}
                />
              </View>
            )}

          {engineState && engineState.status === 'ROUND_OVER' && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>🎉 ROUND {engineState.roundNumber - 1} OVER!</Text>
              <Text style={styles.resultDesc}>
                Round Winner:{' '}
                {engineState.players.find((p) => p.id === engineState.roundWinnerId)?.name} (0 pts)
              </Text>

              <View style={styles.scoreboardBox}>
                <Text style={styles.scoreboardTitle}>Cumulative Standings & Phase Progress:</Text>
                {engineState.players.map((p) => (
                  <View key={p.id} style={styles.scoreRow}>
                    <Text style={styles.scoreName}>{p.name}:</Text>
                    <Text style={styles.scorePhase}>Current Target: Phase {p.currentPhase}</Text>
                    <Text style={styles.scorePts}>{p.totalScore} total pts</Text>
                  </View>
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

          {engineState && engineState.status === 'MATCH_OVER' && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>🏆 PHASE 10 CHAMPION!</Text>
              <Text style={styles.resultDesc}>
                {engineState.players.find((p) => p.id === engineState.winnerId)?.name} completed
                Phase 10 and won the match!
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
    backgroundColor: '#1C1108',
  },
  container: {
    flex: 1,
    backgroundColor: '#1C1108',
  },
  headerBar: {
    backgroundColor: '#2D1608',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#8B5A2B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitBtn: {
    backgroundColor: '#3E2415',
    borderWidth: 1,
    borderColor: '#7B4E2E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  exitBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FEFCBF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FEFCBF',
  },
  badge: {
    backgroundColor: '#D69E2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1C1108',
  },
  scrollContent: {
    padding: 14,
  },
  setupCard: {
    backgroundColor: '#2A180D',
    borderWidth: 2.5,
    borderColor: '#8B5A2B',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FEFCBF',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEFCBF',
    marginTop: 10,
    marginBottom: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#3E2415',
    borderWidth: 1.5,
    borderColor: '#6B4021',
    borderRadius: 8,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#B45309',
    elevation: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEFCBF',
  },
  chipTextActive: {
    color: '#1C1108',
    fontWeight: '900',
  },
  resultCard: {
    backgroundColor: '#2A180D',
    borderWidth: 2.5,
    borderColor: '#8B5A2B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FEFCBF',
    marginBottom: 6,
    textAlign: 'center',
  },
  resultDesc: {
    fontSize: 14,
    color: '#CBD5E0',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreboardBox: {
    width: '100%',
    backgroundColor: '#1C1008',
    borderWidth: 1.5,
    borderColor: '#4E2C17',
    borderRadius: 8,
    padding: 10,
  },
  scoreboardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FEFCBF',
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  scoreName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FEFCBF',
    flex: 1,
  },
  scorePhase: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F6E05E',
    marginRight: 8,
  },
  scorePts: {
    fontSize: 12,
    fontWeight: '900',
    color: '#68D391',
  },
});

