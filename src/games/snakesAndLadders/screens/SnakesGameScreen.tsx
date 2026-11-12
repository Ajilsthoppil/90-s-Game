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
import { SnakesEngine } from '../engine/SnakesEngine';
import { SnakesBot } from '../bot/SnakesBot';
import { SnakesGameState } from '../types/snakes.types';
import { SnakesBoardComponent } from '../components/SnakesBoardComponent';
import { GameRulesModal } from '../../../components/GameRulesModal';
import { GameScreenHeader } from '../../../components/GameScreenHeader';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { THEME } from '../../../theme/theme';

interface SnakesGameScreenProps {
  localPlayerName: string;
  onExit: () => void;
}

type MatchSetupOption =
  | '1_BOT'
  | '3_BOTS'
  | '5_BOTS'
  | '7_BOTS'
  | '2_HUMANS'
  | '4_HUMANS'
  | '6_HUMANS'
  | '8_HUMANS';

export const SnakesGameScreen: React.FC<SnakesGameScreenProps> = ({
  localPlayerName,
  onExit,
}) => {
  const [isRulesAcknowledged, setIsRulesAcknowledged] = useState(true);
  const [setupMode, setSetupMode] = useState<MatchSetupOption>('3_BOTS');
  const [engineState, setEngineState] = useState<SnakesGameState | null>(null);

  const engineRef = useRef<SnakesEngine>(new SnakesEngine());
  const botsRef = useRef<SnakesBot[]>([]);

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
    // Clean up any prior running bots
    botsRef.current.forEach((b) => b.deactivate());
    botsRef.current = [];

    const engine = engineRef.current;
    let players: { id: string; name: string; avatar: string; color: string; isBot: boolean }[] = [];

    const BOT_POOL = [
      { name: 'Robo Rahul', avatar: '🤖', color: '#2563EB' },
      { name: 'Robo Monu', avatar: '🦊', color: '#16A34A' },
      { name: 'Robo Anu', avatar: '🐯', color: '#D97706' },
      { name: 'Robo Vikram', avatar: '🦁', color: '#9333EA' },
      { name: 'Robo Priya', avatar: '🐼', color: '#EA580C' },
      { name: 'Robo Arjun', avatar: '🦄', color: '#06B6D4' },
      { name: 'Robo Maya', avatar: '🐙', color: '#EC4899' },
    ];
    const HUMAN_COLORS = [
      '#DC2626', '#2563EB', '#16A34A', '#D97706',
      '#9333EA', '#EA580C', '#06B6D4', '#EC4899',
    ];
    const HUMAN_AVATARS = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '🔷', '🌸'];

    if (setupMode === '1_BOT' || setupMode === '3_BOTS' || setupMode === '5_BOTS' || setupMode === '7_BOTS') {
      const botCount =
        setupMode === '1_BOT' ? 1 : setupMode === '3_BOTS' ? 3 : setupMode === '5_BOTS' ? 5 : 7;
      players = [
        { id: 'player_local_1', name: localPlayerName, avatar: '👤', color: '#DC2626', isBot: false },
        ...BOT_POOL.slice(0, botCount).map((b, i) => ({
          id: `bot_${i + 1}`,
          name: b.name,
          avatar: b.avatar,
          color: b.color,
          isBot: true,
        })),
      ];
    } else {
      const humanCount =
        setupMode === '2_HUMANS' ? 2 : setupMode === '4_HUMANS' ? 4 : setupMode === '6_HUMANS' ? 6 : 8;
      players = Array.from({ length: humanCount }).map((_, i) => ({
        id: `player_local_${i + 1}`,
        name: i === 0 ? `${localPlayerName} (P1)` : `Player ${i + 1}`,
        avatar: HUMAN_AVATARS[i % HUMAN_AVATARS.length],
        color: HUMAN_COLORS[i % HUMAN_COLORS.length],
        isBot: false,
      }));
    }

    engine.startMatch(players);

    botsRef.current = players
      .filter((p) => p.isBot)
      .map((p) => {
        const bot = new SnakesBot(engine, p.id);
        bot.activate();
        return bot;
      });
  };

  const handleRollDice = () => {
    if (!engineState) return;
    const curr = engineState.players[engineState.currentTurnIdx];
    if (!curr || curr.isBot) return;

    try {
      engineRef.current.rollDice(curr.id);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.paperDarker} />

      <GameRulesModal
        visible={!isRulesAcknowledged}
        gameTitle="SNAKES & LADDERS"
        rules={[
          '100-square grid (1 to 100) with alternating zig-zag numbering.',
          'Roll the 6-sided dice on your turn to advance your token forward.',
          'Roll a 6: Awards an immediate bonus roll! (3 consecutive 6s forfeits turn).',
          'Ladders (🪜): Landing on the base of a ladder climbs you UP to the top!',
          'Snakes (🐍): Landing on a snake head slides you DOWN to its tail!',
          'Exact 100 Rule: You must land on square 100 with an exact roll to win.',
        ]}
        onAcknowledge={() => setIsRulesAcknowledged(true)}
      />

      <View style={styles.container}>
        {(!engineState || engineState.status !== 'PLAYING') && (
          <GameScreenHeader
            title="🐍 SNAKES & LADDERS"
            badge="100 SQUARES"
            onExit={onExit}
            onOpenRules={() => setIsRulesAcknowledged(false)}
          />
        )}

        {engineState && engineState.status === 'PLAYING' ? (
          <View style={{ flex: 1 }}>
            <SnakesBoardComponent
              state={engineState}
              localPlayerId={engineState.players[engineState.currentTurnIdx]?.id || 'player_local_1'}
              onRollDice={handleRollDice}
              hideHeader={false}
              onExit={onExit}
              onOpenRules={() => setIsRulesAcknowledged(false)}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {(!engineState || engineState.status === 'SETUP') && isRulesAcknowledged && (
              <View style={styles.setupCard}>
                <Text style={styles.setupTitle}>Snakes & Ladders Match Setup</Text>

                <Text style={styles.label}>Select Game Mode:</Text>
                <View style={styles.btnGrid}>
                  <Pressable
                    onPress={() => setSetupMode('3_BOTS')}
                    style={[styles.chip, setupMode === '3_BOTS' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '3_BOTS' && styles.chipTextActive]}>
                      4 Players (3 Bots)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('1_BOT')}
                    style={[styles.chip, setupMode === '1_BOT' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '1_BOT' && styles.chipTextActive]}>
                      2 Players (1 Bot Duel)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('5_BOTS')}
                    style={[styles.chip, setupMode === '5_BOTS' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '5_BOTS' && styles.chipTextActive]}>
                      6 Players (5 Bots)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('7_BOTS')}
                    style={[styles.chip, setupMode === '7_BOTS' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '7_BOTS' && styles.chipTextActive]}>
                      8 Players (7 Bots)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('2_HUMANS')}
                    style={[styles.chip, setupMode === '2_HUMANS' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '2_HUMANS' && styles.chipTextActive]}>
                      2 Players (Pass & Play)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('4_HUMANS')}
                    style={[styles.chip, setupMode === '4_HUMANS' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '4_HUMANS' && styles.chipTextActive]}>
                      4 Humans (Pass & Play)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('6_HUMANS')}
                    style={[styles.chip, setupMode === '6_HUMANS' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '6_HUMANS' && styles.chipTextActive]}>
                      6 Humans (Pass & Play)
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('8_HUMANS')}
                    style={[styles.chip, setupMode === '8_HUMANS' && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, setupMode === '8_HUMANS' && styles.chipTextActive]}>
                      8 Humans (Pass & Play)
                    </Text>
                  </Pressable>
                </View>

                <HandDrawnButton
                  title="START MATCH 🎲"
                  variant="primary"
                  onPress={handleStartMatch}
                  style={{ marginTop: 18 }}
                />
              </View>
            )}

            {engineState && engineState.status === 'FINISHED' && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>🏆 CHAMPION REACHED 100!</Text>
                <Text style={styles.resultDesc}>
                  {engineState.players.find((p) => p.id === engineState.winnerId)?.name} reached square
                  100 and won!
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
    backgroundColor: '#0D1912',
  },
  container: {
    flex: 1,
    backgroundColor: '#0D1912',
  },
  scrollContent: {
    padding: 16,
    justifyContent: 'center',
    flexGrow: 1,
  },
  setupCard: {
    backgroundColor: '#183024',
    borderWidth: 2.5,
    borderColor: '#8B5A2B',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FEFCBF',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FEFCBF',
    marginTop: 8,
    marginBottom: 8,
  },
  btnGrid: {
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#234433',
    borderWidth: 1.5,
    borderColor: '#3D6C52',
    borderRadius: 10,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#B45309',
    elevation: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEFCBF',
  },
  chipTextActive: {
    color: '#183024',
    fontWeight: '900',
  },
  resultCard: {
    backgroundColor: '#183024',
    borderWidth: 2.5,
    borderColor: '#8B5A2B',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FEFCBF',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultDesc: {
    fontSize: 15,
    color: '#CBD5E0',
    marginBottom: 14,
    textAlign: 'center',
  },

});
