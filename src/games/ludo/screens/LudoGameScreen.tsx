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
import { LudoEngine } from '../engine/LudoEngine';
import { LudoBot } from '../bot/LudoBot';
import { LudoGameState, LudoColor } from '../types/ludo.types';
import { LudoBoardComponent, COLOR_HEX } from '../components/LudoBoardComponent';
import { GameRulesModal } from '../../../components/GameRulesModal';
import { GameScreenHeader } from '../../../components/GameScreenHeader';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { THEME } from '../../../theme/theme';
import { CAPTAINS_INFO } from '../rules/ludoRules';
import {
  STRAW_HAT_CREW,
  StrawHatMember,
  getStrawHatMember,
} from '../data/strawHatCrew';

export { CAPTAINS_INFO };

interface LudoGameScreenProps {
  localPlayerName: string;
  onExit: () => void;
}

const FLEET_COLORS: { col: LudoColor; label: string; icon: string; corner: string; isBottom: boolean }[] = [
  { col: 'YELLOW', label: 'Yellow Fleet', icon: '🟡', corner: 'Left Side Down (Bottom-Left)', isBottom: true },
  { col: 'BLUE', label: 'Blue Fleet', icon: '🔵', corner: 'Right Side Down (Bottom-Right)', isBottom: true },
  { col: 'RED', label: 'Red Fleet', icon: '🔴', corner: 'Top-Left Side', isBottom: false },
  { col: 'GREEN', label: 'Green Fleet', icon: '🟢', corner: 'Top-Right Side', isBottom: false },
];

/**
 * Deterministically assigns the remaining 3 board colors to 3 distinct Straw Hat crew members
 */
function getBotCrewAssignments(
  humanMemberId: string,
  humanColor: LudoColor
): Record<LudoColor, StrawHatMember> {
  const colors: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
  const remainingColors = colors.filter((c) => c !== humanColor);
  const assignments: Partial<Record<LudoColor, StrawHatMember>> = {};

  const humanMember = getStrawHatMember(humanMemberId);
  assignments[humanColor] = humanMember;

  const usedMemberIds = new Set<string>([humanMember.id]);

  for (const col of remainingColors) {
    let candidate = STRAW_HAT_CREW.find(
      (m) => m.defaultColor === col && !usedMemberIds.has(m.id)
    );
    if (!candidate) {
      candidate = STRAW_HAT_CREW.find((m) => !usedMemberIds.has(m.id));
    }
    if (!candidate) {
      candidate = STRAW_HAT_CREW[0];
    }
    assignments[col] = candidate;
    usedMemberIds.add(candidate.id);
  }

  return assignments as Record<LudoColor, StrawHatMember>;
}

export const LudoGameScreen: React.FC<LudoGameScreenProps> = ({
  localPlayerName,
  onExit,
}) => {
  const [isRulesAcknowledged, setIsRulesAcknowledged] = useState(true);
  const [setupMode, setSetupMode] = useState<'BOT_PLAY' | 'GROUP_PLAY'>('BOT_PLAY');

  // Bot Play choices: Default to Left Side Down (YELLOW) so chosen character is at the bottom
  const [botPlayMemberId, setBotPlayMemberId] = useState<string>('luffy');
  const [botPlayColor, setBotPlayColor] = useState<LudoColor>('YELLOW');

  // Group Play choices: Default Player 1 to Left Side Down (YELLOW)
  const [groupPlayerCount, setGroupPlayerCount] = useState<number>(4);
  const [groupPlayerMembers, setGroupPlayerMembers] = useState<Record<number, string>>({
    1: 'luffy',
    2: 'zoro',
    3: 'sanji',
    4: 'chopper',
  });
  const [groupPlayerColors, setGroupPlayerColors] = useState<Record<number, LudoColor>>({
    1: 'YELLOW',
    2: 'BLUE',
    3: 'RED',
    4: 'GREEN',
  });

  const selectedGroupMembers = Object.entries(groupPlayerMembers)
    .slice(0, groupPlayerCount)
    .map(([_, m]) => m);
  const selectedGroupColors = Object.entries(groupPlayerColors)
    .slice(0, groupPlayerCount)
    .map(([_, c]) => c);

  const isGroupSelectionUnique =
    new Set(selectedGroupMembers).size === groupPlayerCount &&
    new Set(selectedGroupColors).size === groupPlayerCount;

  const [engineState, setEngineState] = useState<LudoGameState | null>(null);

  const engineRef = useRef<LudoEngine>(new LudoEngine());
  const botsRef = useRef<LudoBot[]>([]);

  useEffect(() => {
    const engine = engineRef.current;
    const unsub = engine.subscribe((st) => setEngineState(st));
    return () => {
      unsub();
      botsRef.current.forEach((b) => b.deactivate());
      botsRef.current = [];
    };
  }, []);

  const handleSelectStrawHatMember = (member: StrawHatMember) => {
    setBotPlayMemberId(member.id);
    // Keep user's fleet at the bottom (Left Side Down or Right Side Down), never push to top side
    if (botPlayColor !== 'YELLOW' && botPlayColor !== 'BLUE') {
      setBotPlayColor('YELLOW');
    }
  };

  const handleStartMatch = () => {
    // Clean up previous bots
    botsRef.current.forEach((b) => b.deactivate());
    botsRef.current = [];

    const engine = engineRef.current;
    const colors: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
    const players: {
      id: string;
      name: string;
      avatar: string;
      color: LudoColor;
      characterId?: string;
      isBot: boolean;
    }[] = [];

    if (setupMode === 'BOT_PLAY') {
      const assignments = getBotCrewAssignments(botPlayMemberId, botPlayColor);
      let botCounter = 2;

      for (let slot = 0; slot < 4; slot++) {
        const col = colors[slot];
        const member = assignments[col];

        if (col === botPlayColor) {
          players.push({
            id: 'player_local_1',
            name: `${member.shortName} (You)`,
            avatar: member.avatar,
            color: col,
            characterId: member.id,
            isBot: false,
          });
        } else {
          players.push({
            id: `bot_${botCounter++}`,
            name: `${member.shortName} (Bot)`,
            avatar: member.avatar,
            color: col,
            characterId: member.id,
            isBot: true,
          });
        }
      }
    } else {
      // GROUP PLAY: each player has their chosen distinct Straw Hat captain & color
      const colorToPNum: Record<string, number> = {};
      for (let pNum = 1; pNum <= groupPlayerCount; pNum++) {
        colorToPNum[groupPlayerColors[pNum]] = pNum;
      }

      const usedMemberIds = new Set<string>();
      for (let pNum = 1; pNum <= groupPlayerCount; pNum++) {
        usedMemberIds.add(groupPlayerMembers[pNum]);
      }

      let botCounter = 1;
      for (let slot = 0; slot < 4; slot++) {
        const col = colors[slot];
        const pNum = colorToPNum[col];

        if (pNum) {
          const member = getStrawHatMember(groupPlayerMembers[pNum]);
          players.push({
            id: `player_local_${pNum}`,
            name: `${member.shortName} (P${pNum})`,
            avatar: member.avatar,
            color: col,
            characterId: member.id,
            isBot: false,
          });
        } else {
          // Fill remaining slots with bot using unchosen Straw Hat member
          let botMember =
            STRAW_HAT_CREW.find(
              (m) => m.defaultColor === col && !usedMemberIds.has(m.id)
            ) ||
            STRAW_HAT_CREW.find((m) => !usedMemberIds.has(m.id)) ||
            STRAW_HAT_CREW[0];
          usedMemberIds.add(botMember.id);

          players.push({
            id: `bot_${botCounter++}`,
            name: `${botMember.shortName} (Bot)`,
            avatar: botMember.avatar,
            color: col,
            characterId: botMember.id,
            isBot: true,
          });
        }
      }
    }

    // Activate bots BEFORE starting match so all bots are subscribed to initial start notification
    botsRef.current = players
      .filter((p) => p.isBot)
      .map((p) => {
        const bot = new LudoBot(engine, p.id);
        bot.activate();
        return bot;
      });

    engine.startMatch(players);
  };

  const handleRollDice = () => {
    const state = engineRef.current.getGameState();
    const curr = state.players[state.currentTurnIdx];
    if (!curr || curr.isBot) return;
    try {
      engineRef.current.rollDice(curr.id);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleMoveToken = (tokenId: string) => {
    const state = engineRef.current.getGameState();
    const curr = state.players[state.currentTurnIdx];
    if (!curr || curr.isBot) return;
    try {
      engineRef.current.moveToken(curr.id, tokenId);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleResolveActiveCard = (params: any) => {
    try {
      engineRef.current.resolveActiveCard(params);
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const handleDismissActiveCard = () => {
    try {
      engineRef.current.dismissActiveCard();
    } catch (e: any) {
      console.warn(e.message);
    }
  };

  const activeBotAssignments = getBotCrewAssignments(botPlayMemberId, botPlayColor);
  const humanMember = getStrawHatMember(botPlayMemberId);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.paperDarker} />

      <GameRulesModal
        visible={!isRulesAcknowledged}
        gameTitle="🏴‍☠️ ANIME ADVENTURE LUDO"
        rules={[
          'Anime Pirate Adventure: 4 rival crews race across the Grand Sea track.',
          'Treasure Tiles (🎁): Land to draw Treasure Cards — Safe Escape, Pirate Dash (+3), Pirate Shield (absorbs 1 capture), or Lucky Dice (+1 roll).',
          'Special Event Tiles (⚡): Land to draw Special Event Cards — Revenge (strike back at a previous captor), Body Swap, Wanted Bounties, Escape Artist, and hilarious anime comic surprises!',
          'Safe Zones (⭐/🛡️): Fortified against captures. Special cards can never bypass Safe Zone or Home protection.',
          'Six to Enter: Roll a 6 to deploy a crew token from the Yard into the ocean.',
          'Winning: First captain to bring all 4 crew tokens into the central Home Treasure Cove wins!',
        ]}
        onAcknowledge={() => setIsRulesAcknowledged(true)}
      />

      <View style={styles.container}>
        {(!engineState || engineState.status !== 'PLAYING') && (
          <GameScreenHeader
            title="🏴‍☠️ PIRATE LUDO"
            badge="ANIME ADVENTURE"
            onExit={onExit}
            onOpenRules={() => setIsRulesAcknowledged(false)}
          />
        )}

        {engineState && engineState.status === 'PLAYING' ? (
          <View style={{ flex: 1 }}>
            <LudoBoardComponent
              state={engineState}
              localPlayerId={
                setupMode === 'GROUP_PLAY'
                  ? engineState.players[engineState.currentTurnIdx]?.id || 'player_local_1'
                  : 'player_local_1'
              }
              onRollDice={handleRollDice}
              onMoveToken={handleMoveToken}
              onResolveActiveCard={handleResolveActiveCard}
              onDismissActiveCard={handleDismissActiveCard}
              hideHeader={false}
              onExit={() => setEngineState(null)}
              onOpenRules={() => setIsRulesAcknowledged(false)}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {(!engineState || engineState.status === 'SETUP') && isRulesAcknowledged && (
              <View style={styles.setupCard}>
                <Text style={styles.setupTitle}>🏴‍☠️ Pirate Fleet Match Setup:</Text>

                {/* Step 1: Mode Selection */}
                <Text style={styles.label}>1. Choose How to Play:</Text>
                <View style={styles.modeRow}>
                  <Pressable
                    onPress={() => setSetupMode('BOT_PLAY')}
                    style={[
                      styles.modeCard,
                      setupMode === 'BOT_PLAY' && styles.modeCardActive,
                    ]}
                  >
                    <Text style={styles.modeCardIcon}>🤖</Text>
                    <Text style={styles.modeCardTitle}>Play with Bot</Text>
                    <Text style={styles.modeCardSub}>You vs 3 Pirate Bots</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setSetupMode('GROUP_PLAY')}
                    style={[
                      styles.modeCard,
                      setupMode === 'GROUP_PLAY' && styles.modeCardActive,
                    ]}
                  >
                    <Text style={styles.modeCardIcon}>👥</Text>
                    <Text style={styles.modeCardTitle}>Join the Group</Text>
                    <Text style={styles.modeCardSub}>Pass & Play with Friends</Text>
                  </Pressable>
                </View>

                {/* Step 2: Character Selection for Bot Play */}
                {setupMode === 'BOT_PLAY' ? (
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.label}>2. Choose Your Pirate Captain (Straw Hat Crew):</Text>
                    <Text style={styles.helperText}>
                      Select any member of the Straw Hat Pirates. You will always appear at the bottom panel!
                    </Text>

                    {/* 10 Straw Hat Crew Member Cards */}
                    <View style={styles.crewGrid}>
                      {STRAW_HAT_CREW.map((member) => {
                        const isSelected = botPlayMemberId === member.id;
                        return (
                          <Pressable
                            key={member.id}
                            onPress={() => handleSelectStrawHatMember(member)}
                            style={[
                              styles.crewCard,
                              isSelected && styles.crewCardSelected,
                            ]}
                          >
                            <View style={styles.crewCardTop}>
                              <View
                                style={[
                                  styles.crewAvatarCircle,
                                  { borderColor: COLOR_HEX[member.defaultColor] },
                                  isSelected && styles.crewAvatarCircleSelected,
                                ]}
                              >
                                <Text style={styles.crewAvatarText}>{member.avatar}</Text>
                              </View>
                              <View style={styles.crewInfoCol}>
                                <Text
                                  style={[
                                    styles.crewNameText,
                                    isSelected && styles.crewNameTextSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {member.title}
                                </Text>
                                <Text style={styles.crewRoleText}>
                                  {member.role}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.crewBountyRow}>
                              <Text style={styles.crewBountyLabel}>Bounty:</Text>
                              <Text style={styles.crewBountyValue} numberOfLines={1}>
                                💰 {member.bounty}
                              </Text>
                            </View>

                            <Text style={styles.crewQuoteText} numberOfLines={1}>
                              "{member.quote}"
                            </Text>

                            {isSelected && (
                              <View style={styles.selectedCaptainPill}>
                                <Text style={styles.selectedCaptainPillText}>✓ SELECTED (YOU)</Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Step 3: Fleet Corner / Position Selection */}
                    <Text style={[styles.label, { marginTop: 14 }]}>
                      3. Choose Fleet Corner & Position:
                    </Text>
                    <Text style={styles.helperText}>
                      Your pirate fleet launches from the bottom (Left Side Down or Right Side Down):
                    </Text>

                    <View style={styles.fleetColorsRow}>
                      {FLEET_COLORS.map((fc) => {
                        const isSelectedColor = botPlayColor === fc.col;
                        return (
                          <Pressable
                            key={fc.col}
                            onPress={() => setBotPlayColor(fc.col)}
                            style={[
                              styles.fleetColorChip,
                              { borderColor: COLOR_HEX[fc.col] },
                              isSelectedColor && styles.fleetColorChipSelected,
                            ]}
                          >
                            <Text style={{ fontSize: 16 }}>{fc.icon}</Text>
                            <Text
                              style={[
                                styles.fleetColorChipText,
                                isSelectedColor && styles.fleetColorChipTextSelected,
                              ]}
                            >
                              {fc.label}
                            </Text>
                            <Text style={styles.fleetCornerText}>{fc.corner}</Text>
                            {fc.isBottom && (
                              <View
                                style={{
                                  marginTop: 3,
                                  backgroundColor: isSelectedColor ? '#F59E0B' : 'rgba(245, 158, 11, 0.25)',
                                  borderRadius: 4,
                                  paddingHorizontal: 5,
                                  paddingVertical: 1,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 8,
                                    fontWeight: '900',
                                    color: isSelectedColor ? '#1A0F0A' : '#FDE047',
                                  }}
                                >
                                  ★ BOTTOM
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Step 4: AI Rival Fleets Preview */}
                    <Text style={[styles.label, { marginTop: 14 }]}>
                      4. Rival AI Fleets:
                    </Text>
                    <View style={styles.rivalsPreviewBox}>
                      {(['RED', 'GREEN', 'YELLOW', 'BLUE'] as LudoColor[])
                        .filter((c) => c !== botPlayColor)
                        .map((c) => {
                          const botMember = activeBotAssignments[c];
                          return (
                            <View key={c} style={styles.rivalBotItem}>
                              <Text style={{ fontSize: 16 }}>{botMember.avatar}</Text>
                              <View style={{ marginLeft: 6 }}>
                                <Text style={styles.rivalBotName}>
                                  {botMember.title} (Bot)
                                </Text>
                                <Text style={styles.rivalBotColor}>
                                  {c} Fleet Corner
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                    </View>

                    <HandDrawnButton
                      title={`SET SAIL AS ${humanMember.title.toUpperCase()} 🏴‍☠️`}
                      variant="primary"
                      onPress={handleStartMatch}
                      style={{ marginTop: 18 }}
                    />
                  </View>
                ) : (
                  /* GROUP PLAY */
                  <View style={{ marginTop: 14 }}>
                    <Text style={styles.label}>2. Select Number of Players in Group:</Text>
                    <View style={styles.btnRowHorizontal}>
                      {[2, 3, 4].map((count) => (
                        <Pressable
                          key={count}
                          onPress={() => setGroupPlayerCount(count)}
                          style={[
                            styles.chipHorizontal,
                            groupPlayerCount === count && styles.chipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              groupPlayerCount === count && styles.chipTextActive,
                            ]}
                          >
                            {count} Players
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Text style={[styles.label, { marginTop: 14 }]}>
                      3. Each Player Choose Unique Character & Fleet Color:
                    </Text>
                    <Text style={styles.helperText}>
                      Every player must choose a different Straw Hat member and distinct color!
                    </Text>

                    {[1, 2, 3, 4].slice(0, groupPlayerCount).map((pNum) => {
                      const chosenMemberId = groupPlayerMembers[pNum] || 'luffy';
                      const chosenCol = groupPlayerColors[pNum] || 'RED';
                      const currentMember = getStrawHatMember(chosenMemberId);

                      return (
                        <View key={`player_select_${pNum}`} style={styles.playerSelectBox}>
                          <View style={styles.playerSelectTitleRow}>
                            <Text style={styles.playerSelectHeader}>
                              👤 Player {pNum}: {currentMember.avatar} {currentMember.title} ({chosenCol})
                            </Text>
                          </View>

                          {/* Member selector chips */}
                          <Text style={styles.playerSubLabel}>Choose Straw Hat Character:</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.memberChipsScroll}
                          >
                            {STRAW_HAT_CREW.map((m) => {
                              const isSelected = chosenMemberId === m.id;
                              const takenByPNum = Object.entries(groupPlayerMembers)
                                .slice(0, groupPlayerCount)
                                .find(([otherP, memId]) => Number(otherP) !== pNum && memId === m.id);
                              const isTaken = Boolean(takenByPNum);

                              return (
                                <Pressable
                                  key={`p${pNum}_m_${m.id}`}
                                  disabled={isTaken}
                                  onPress={() =>
                                    setGroupPlayerMembers((prev) => ({
                                      ...prev,
                                      [pNum]: m.id,
                                    }))
                                  }
                                  style={[
                                    styles.groupMemberChip,
                                    isSelected && styles.chipActive,
                                    isTaken && styles.chipDisabled,
                                  ]}
                                >
                                  <Text style={styles.groupMemberChipIcon}>{m.avatar}</Text>
                                  <Text
                                    style={[
                                      styles.chipSmallText,
                                      isSelected && styles.chipTextActive,
                                      isTaken && styles.chipDisabledText,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {m.shortName}
                                  </Text>
                                  {isTaken && (
                                    <Text style={styles.takenBadgeText}>
                                      P{takenByPNum![0]}
                                    </Text>
                                  )}
                                </Pressable>
                              );
                            })}
                          </ScrollView>

                          {/* Color selector chips */}
                          <Text style={[styles.playerSubLabel, { marginTop: 8 }]}>
                            Choose Fleet Color:
                          </Text>
                          <View style={styles.groupColorRow}>
                            {FLEET_COLORS.map((fc) => {
                              const isSelectedCol = chosenCol === fc.col;
                              const takenByPNum = Object.entries(groupPlayerColors)
                                .slice(0, groupPlayerCount)
                                .find(([otherP, col]) => Number(otherP) !== pNum && col === fc.col);
                              const isTaken = Boolean(takenByPNum);

                              return (
                                <Pressable
                                  key={`p${pNum}_c_${fc.col}`}
                                  disabled={isTaken}
                                  onPress={() =>
                                    setGroupPlayerColors((prev) => ({
                                      ...prev,
                                      [pNum]: fc.col,
                                    }))
                                  }
                                  style={[
                                    styles.groupColorChip,
                                    { borderColor: COLOR_HEX[fc.col] },
                                    isSelectedCol && styles.chipActive,
                                    isTaken && styles.chipDisabled,
                                  ]}
                                >
                                  <Text style={{ fontSize: 13 }}>{fc.icon}</Text>
                                  <Text
                                    style={[
                                      styles.chipSmallText,
                                      isSelectedCol && styles.chipTextActive,
                                      isTaken && styles.chipDisabledText,
                                    ]}
                                  >
                                    {fc.col}
                                  </Text>
                                  {isTaken && (
                                    <Text style={styles.takenBadgeText}>
                                      P{takenByPNum![0]}
                                    </Text>
                                  )}
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}

                    <HandDrawnButton
                      title={
                        isGroupSelectionUnique
                          ? 'START GROUP ADVENTURE 🏴‍☠️'
                          : 'SELECT UNIQUE CREW & COLORS ⚠️'
                      }
                      variant="primary"
                      disabled={!isGroupSelectionUnique}
                      onPress={handleStartMatch}
                      style={{ marginTop: 18, opacity: isGroupSelectionUnique ? 1 : 0.6 }}
                    />
                  </View>
                )}
              </View>
            )}

            {engineState && engineState.status === 'FINISHED' && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>🏆 LUDO CHAMPION!</Text>
                <Text style={styles.resultDesc}>
                  {engineState.players.find((p) => p.id === engineState.winnerId)?.name} (
                  {engineState.winnerColor}) brought all 4 tokens HOME and won!
                </Text>

                <HandDrawnButton
                  title="PLAY AGAIN 🔄"
                  variant="primary"
                  onPress={handleStartMatch}
                  style={{ marginTop: 14 }}
                />
                <HandDrawnButton
                  title="CHANGE FLEET / SETUP ⚙️"
                  variant="secondary"
                  onPress={() => setEngineState(null)}
                  style={{ marginTop: 8 }}
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
    backgroundColor: '#1A0F0A',
  },
  container: {
    flex: 1,
    backgroundColor: '#1A0F0A',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  setupCard: {
    backgroundColor: '#2A180D',
    borderWidth: 2,
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
  helperText: {
    fontSize: 11,
    color: '#D1D5DB',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modeCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#3E2415',
    borderWidth: 1.5,
    borderColor: '#6B4021',
    borderRadius: 10,
    alignItems: 'center',
  },
  modeCardActive: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
    borderWidth: 2,
    elevation: 4,
  },
  modeCardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  modeCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FEFCBF',
  },
  modeCardSub: {
    fontSize: 10,
    color: '#CBD5E0',
    textAlign: 'center',
    marginTop: 2,
  },
  crewGrid: {
    gap: 8,
    marginTop: 4,
  },
  crewCard: {
    backgroundColor: '#341E11',
    borderWidth: 1.5,
    borderColor: '#5C381E',
    borderRadius: 10,
    padding: 10,
  },
  crewCardSelected: {
    backgroundColor: '#4D270C',
    borderColor: '#F59E0B',
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  crewCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crewAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C110A',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crewAvatarCircleSelected: {
    borderColor: '#FDE047',
    borderWidth: 2.5,
  },
  crewAvatarText: {
    fontSize: 19,
  },
  crewInfoCol: {
    flex: 1,
    marginLeft: 10,
  },
  crewNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  crewNameTextSelected: {
    color: '#FDE047',
  },
  crewRoleText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  crewBountyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  crewBountyLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginRight: 4,
  },
  crewBountyValue: {
    fontSize: 11,
    color: '#FBBF24',
    fontWeight: '700',
  },
  crewQuoteText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontStyle: 'italic',
    marginTop: 3,
  },
  selectedCaptainPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 6,
  },
  selectedCaptainPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1A0F0A',
  },
  fleetColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  fleetColorChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#341E11',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  fleetColorChipSelected: {
    backgroundColor: '#78350F',
    borderWidth: 2.5,
    elevation: 3,
  },
  fleetColorChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEFCBF',
    marginTop: 2,
  },
  fleetColorChipTextSelected: {
    color: '#FDE047',
  },
  fleetCornerText: {
    fontSize: 9,
    color: '#CBD5E0',
    marginTop: 1,
  },
  rivalsPreviewBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    gap: 6,
  },
  rivalBotItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rivalBotName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  rivalBotColor: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  btnRowHorizontal: {
    flexDirection: 'row',
    gap: 8,
  },
  chipHorizontal: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
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
  chipDisabled: {
    opacity: 0.45,
    backgroundColor: '#26160C',
    borderColor: '#4A2C18',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEFCBF',
  },
  chipTextActive: {
    color: '#1A0F0A',
    fontWeight: '900',
  },
  chipDisabledText: {
    color: '#9CA3AF',
  },
  playerSelectBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: '#6B4021',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  playerSelectTitleRow: {
    marginBottom: 6,
  },
  playerSelectHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE68A',
  },
  playerSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D1D5DB',
    marginBottom: 4,
  },
  memberChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  groupMemberChip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#3E2415',
    borderWidth: 1,
    borderColor: '#6B4021',
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 54,
  },
  groupMemberChipIcon: {
    fontSize: 15,
  },
  groupColorRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  groupColorChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#3E2415',
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
  },
  chipSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FEFCBF',
    marginTop: 1,
  },
  takenBadgeText: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: '800',
    marginTop: 1,
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
});
