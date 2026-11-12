import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { BingoVariant, BotDifficulty, GameRoom, PlayMode } from '../types';
import { THEME } from '../theme/theme';
import { HandDrawnButton } from '../components/HandDrawnButton';

interface LobbyScreenProps {
  room: GameRoom;
  localPlayerId: string;
  onToggleReady: (playerId: string, isReady: boolean) => void;
  onAddSimulatedPlayer: (name: string, nickname: string, avatar: string) => void;
  onSetupBots: (botCount: number, difficulty?: BotDifficulty) => void;
  onSetPlayMode?: (mode: PlayMode) => void;
  onSetVariant?: (variant: BingoVariant) => void;
  onStartMatch: () => void;
  onLeaveLobby: () => void;
  canStart: boolean;
  startReason?: string;
}

const DEFAULT_SIMULATED_FRIENDS = [
  { name: 'Rahul', nickname: 'Rahu', avatar: '🏏' },
  { name: 'Anu', nickname: 'Anumol', avatar: '🌸' },
  { name: 'Akhil', nickname: 'Akku', avatar: '⚽' },
];

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  room,
  localPlayerId,
  onToggleReady,
  onAddSimulatedPlayer,
  onSetupBots,
  onSetPlayMode,
  onSetVariant,
  onStartMatch,
  onLeaveLobby,
  canStart,
  startReason,
}) => {
  const currentBots = room.players.filter((p) => p.isBot);
  const currentMode: PlayMode = room.playMode || (currentBots.length > 0 ? 'SYSTEM' : 'FRIENDS');
  const currentVariant: BingoVariant = room.variant || 'CLASSIC_1_25';

  const [selectedBotCount, setSelectedBotCount] = useState<number>(
    currentBots.length > 0 ? currentBots.length : 1
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty>(
    currentBots[0]?.botDifficulty || 'NORMAL'
  );

  const localPlayer = room.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost ?? false;
  const humanPlayers = room.players.filter((p) => !p.isBot);

  // Animations
  const pulseRoomCode = useRef(new Animated.Value(1)).current;
  const startBtnPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Room code breathing glow animation
    const roomCodeAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRoomCode, {
          toValue: 1.02,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseRoomCode, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    roomCodeAnim.start();

    return () => roomCodeAnim.stop();
  }, [pulseRoomCode]);

  useEffect(() => {
    if (canStart) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(startBtnPulse, {
            toValue: 1.04,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(startBtnPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    } else {
      startBtnPulse.setValue(1);
    }
  }, [canStart, startBtnPulse]);

  const handleSelectMode = (mode: PlayMode) => {
    onSetPlayMode?.(mode);
    if (mode === 'SYSTEM') {
      onSetupBots(selectedBotCount, selectedDifficulty);
    } else {
      onSetupBots(0);
    }
  };

  const handleSelectBotCount = (count: number) => {
    setSelectedBotCount(count);
    onSetupBots(count, selectedDifficulty);
  };

  const handleSelectDifficulty = (diff: BotDifficulty) => {
    setSelectedDifficulty(diff);
    onSetupBots(selectedBotCount, diff);
  };

  const handleSelectVariant = (v: BingoVariant) => {
    onSetVariant?.(v);
  };

  const { width: scrWidth, height: scrHeight } = useWindowDimensions();
  const isLandscape = scrWidth > scrHeight;
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
        {/* Anime Header Bar with Android Status Bar Clearance */}
        <View style={[styles.headerBar, { paddingTop: statusBarPadding + 10 }]}>
          <Pressable
            onPress={onLeaveLobby}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Exit lobby"
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
            ]}
          >
            <Text style={styles.backBtnText}>← EXIT LOBBY</Text>
          </Pressable>
          <Text style={styles.headerTitle}>BINGO ARENA</Text>
          <View style={styles.headerAccentsBox}>
            <Text style={styles.headerAccents}>⚔️ 👾</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Animated Pulsing Room Code Banner */}
          <Animated.View style={[styles.roomCodeCard, { transform: [{ scale: pulseRoomCode }] }]}>
            <Text style={styles.roomCodeLabel}>ROOM BATTLE CODE</Text>
            <Text style={styles.roomCodeText}>{room.roomCode}</Text>
            <Text style={styles.roomCodeSubtext}>Share code with squad to join room</Text>
          </Animated.View>

          {/* Game Mode Selector */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.modeSectionTitle}>SELECT BATTLE MODE:</Text>
          </View>

          <View style={styles.modeToggleRow}>
            <Pressable
              onPress={() => handleSelectMode('FRIENDS')}
              style={[
                styles.modeBtn,
                currentMode === 'FRIENDS' && styles.modeBtnActive,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.modeBtnText,
                  currentMode === 'FRIENDS' && styles.modeBtnTextActive,
                ]}
              >
                ⚔️ VS FRIENDS
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSelectMode('SYSTEM')}
              style={[
                styles.modeBtn,
                currentMode === 'SYSTEM' && styles.modeBtnActive,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.modeBtnText,
                  currentMode === 'SYSTEM' && styles.modeBtnTextActive,
                ]}
              >
                👾 VS SYSTEM BOTS
              </Text>
            </Pressable>
          </View>

          {/* System Bot Options Container */}
          {currentMode === 'SYSTEM' && (
            <View style={styles.botSelectorBox}>
              <Text style={styles.botSelectorLabel}>NUMBER OF BOTS:</Text>
              <View style={styles.botCountRow}>
                {[1, 2, 3].map((count) => {
                  const isSelected = selectedBotCount === count;
                  return (
                    <Pressable
                      key={`bot-count-${count}`}
                      onPress={() => handleSelectBotCount(count)}
                      style={[
                        styles.botCountBtn,
                        isSelected && styles.botCountBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.botCountText,
                          isSelected && styles.botCountTextActive,
                        ]}
                      >
                        🤖 {count} {count === 1 ? 'BOT' : 'BOTS'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.botSelectorLabel, { marginTop: 12 }]}>BOT DIFFICULTY LEVEL:</Text>
              <View style={styles.botCountRow}>
                {(['EASY', 'NORMAL', 'HARD'] as BotDifficulty[]).map((diff) => {
                  const isSelected = selectedDifficulty === diff;
                  return (
                    <Pressable
                      key={`bot-diff-${diff}`}
                      onPress={() => handleSelectDifficulty(diff)}
                      style={[
                        styles.botCountBtn,
                        isSelected && styles.botCountBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.botCountText,
                          isSelected && styles.botCountTextActive,
                        ]}
                      >
                        {diff === 'EASY' ? '🌱 EASY' : diff === 'NORMAL' ? '⚙️ NORMAL' : '🔥 HARD'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Game Variant Selector */}
          {currentMode === 'FRIENDS' && humanPlayers.length >= 2 && (
            <View style={styles.variantSelectorBox}>
              <Text style={styles.variantSectionTitle}>GAME VARIANT MODE:</Text>
              <View style={styles.variantToggleRow}>
                <Pressable
                  onPress={() => handleSelectVariant('CLASSIC_1_25')}
                  style={[
                    styles.variantBtn,
                    currentVariant === 'CLASSIC_1_25' && styles.variantBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.variantBtnText,
                      currentVariant === 'CLASSIC_1_25' && styles.variantBtnTextActive,
                    ]}
                  >
                    🎯 CLASSIC BINGO{'\n'}5×5 (1–25)
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSelectVariant('BINGO_1_50')}
                  style={[
                    styles.variantBtn,
                    currentVariant === 'BINGO_1_50' && styles.variantBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.variantBtnText,
                      currentVariant === 'BINGO_1_50' && styles.variantBtnTextActive,
                    ]}
                  >
                    ⚡ 50-NUM BATTLE{'\n'}5×5 (1–50)
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Players Section Header */}
          <View style={styles.playersSectionHeader}>
            <Text style={styles.sectionTitle}>
              👥 PLAYERS IN LOBBY ({room.players.length})
            </Text>
          </View>

          {/* Quick Add Friends */}
          {currentMode === 'FRIENDS' && room.players.length < 4 && (
            <View style={styles.addFriendSection}>
              <Text style={styles.addFriendLabel}>QUICK ADD TEST PLAYERS:</Text>
              <View style={styles.addFriendRow}>
                {DEFAULT_SIMULATED_FRIENDS.map((friend) => {
                  const alreadyIn = room.players.some((p) => p.name === friend.name);
                  if (alreadyIn) return null;
                  return (
                    <Pressable
                      key={friend.name}
                      onPress={() => onAddSimulatedPlayer(friend.name, friend.nickname, friend.avatar)}
                      style={({ pressed }) => [
                        styles.addFriendBtn,
                        pressed && styles.addFriendBtnPressed,
                      ]}
                    >
                      <Text style={styles.addFriendText}>
                        + {friend.avatar} {friend.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Player List Cards */}
          <View style={styles.playerList}>
            {room.players.map((player) => {
              const isSelf = player.id === localPlayerId;
              const isReady = (player.status === 'READY' || player.status === 'PLAYING') && Boolean(player.isLocked);

              return (
                <View
                  key={player.id}
                  style={[
                    styles.playerCard,
                    isReady && styles.playerCardReady,
                  ]}
                >
                  <View style={[styles.avatarBox, isReady && styles.avatarBoxReady]}>
                    <Text style={styles.avatarText}>{player.avatar || '👤'}</Text>
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      {player.isHost && (
                        <View style={styles.hostBadge}>
                          <Text style={styles.hostBadgeText}>👑 HOST</Text>
                        </View>
                      )}
                      {player.isBot && (
                        <View style={styles.botBadge}>
                          <Text style={styles.botBadgeText}>🤖 BOT</Text>
                        </View>
                      )}
                      {isSelf && (
                        <View style={styles.youBadge}>
                          <Text style={styles.youBadgeText}>YOU</Text>
                        </View>
                      )}
                    </View>
                    {player.nickname ? (
                      <Text style={styles.playerNickname}>"{player.nickname}"</Text>
                    ) : null}
                  </View>

                  {/* Ready Action Button */}
                  {!player.isBot ? (
                    <Pressable
                      onPress={() => onToggleReady(player.id, !isReady)}
                      style={({ pressed }) => [
                        styles.statusBtn,
                        isReady ? styles.statusBtnReady : (isSelf ? styles.statusBtnSelfNotReady : styles.statusBtnNotReady),
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          isReady ? styles.statusBtnTextReady : (isSelf ? styles.statusBtnTextSelfNotReady : styles.statusBtnTextNotReady),
                        ]}
                      >
                        {isReady ? 'READY ✓' : (isSelf ? 'READY UP ⚡' : 'WAITING ○')}
                      </Text>
                    </Pressable>
                  ) : (
                    <View style={[styles.statusBtn, styles.statusBtnReady]}>
                      <Text style={[styles.statusBtnText, styles.statusBtnTextReady]}>
                        READY ✓
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Start Game Action Banner */}
          <View style={styles.startActionBox}>
            {startReason ? (
              <Text
                style={[
                  styles.startReasonText,
                  canStart && styles.startReasonReady,
                ]}
              >
                {startReason}
              </Text>
            ) : null}

            {/* If local player is NOT ready, display explicit READY UP button */}
            {localPlayer && localPlayer.status !== 'READY' && (
              <HandDrawnButton
                title="⚡ I'M READY UP!"
                variant="accent"
                onPress={() => onToggleReady(localPlayerId, true)}
                size="large"
                style={{ width: '100%', marginBottom: 12 }}
              />
            )}

            {isHost ? (
              <Animated.View style={{ width: '100%', transform: [{ scale: startBtnPulse }] }}>
                <HandDrawnButton
                  title="🔥 START MATCH"
                  variant={canStart ? 'primary' : 'disabled'}
                  disabled={!canStart}
                  onPress={onStartMatch}
                  size="large"
                  style={{ width: '100%' }}
                />
              </Animated.View>
            ) : (
              <Text style={styles.waitingHostText}>
                Waiting for room host ({room.players.find((p) => p.isHost)?.name}) to launch match...
              </Text>
            )}
          </View>
        </ScrollView>
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.cyanBright,
    borderRadius: 10,
  },
  backBtnPressed: {
    opacity: 0.8,
    backgroundColor: THEME.colors.cyanGlow,
  },
  backBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 1.5,
  },
  headerAccentsBox: {
    backgroundColor: THEME.colors.paperCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.purpleBright,
  },
  headerAccents: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  roomCodeCard: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME.colors.cyanBright,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    ...THEME.shadows.neonGlowCyan,
  },
  roomCodeLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: THEME.colors.pencilGrey,
    letterSpacing: 1.8,
  },
  roomCodeText: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 3,
    marginVertical: 4,
  },
  roomCodeSubtext: {
    fontSize: 12,
    color: THEME.colors.pinkBright,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    marginBottom: 8,
  },
  modeSectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.ink,
    letterSpacing: 0.8,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    backgroundColor: THEME.colors.paperCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: THEME.colors.cyanGlow,
    borderColor: THEME.colors.cyanBright,
    borderWidth: 2,
    ...THEME.shadows.neonGlowCyan,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.pencilGrey,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modeBtnTextActive: {
    color: THEME.colors.cyanBright,
  },
  botSelectorBox: {
    backgroundColor: THEME.colors.paperLight,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    padding: 14,
    marginBottom: 16,
  },
  botSelectorLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.ink,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  botCountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  botCountBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    backgroundColor: THEME.colors.paperCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botCountBtnActive: {
    backgroundColor: THEME.colors.purpleGlow,
    borderColor: THEME.colors.purpleBright,
    borderWidth: 2,
  },
  botCountText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.pencilGrey,
  },
  botCountTextActive: {
    color: THEME.colors.purpleBright,
  },
  variantSelectorBox: {
    backgroundColor: THEME.colors.paperLight,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    padding: 14,
    marginBottom: 16,
  },
  variantSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.pinkBright,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  variantToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  variantBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    backgroundColor: THEME.colors.paperCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantBtnActive: {
    backgroundColor: THEME.colors.pinkGlow,
    borderColor: THEME.colors.pinkBright,
    borderWidth: 2,
  },
  variantBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.pencilGrey,
    textAlign: 'center',
    lineHeight: 17,
  },
  variantBtnTextActive: {
    color: THEME.colors.pinkBright,
  },
  playersSectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.ink,
    letterSpacing: 0.5,
  },
  addFriendSection: {
    marginBottom: 14,
    backgroundColor: THEME.colors.paperLight,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.paperBorder,
  },
  addFriendLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    color: THEME.colors.pencilGrey,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  addFriendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addFriendBtn: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.cyanBright,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addFriendBtnPressed: {
    backgroundColor: THEME.colors.cyanGlow,
  },
  addFriendText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.cyanBright,
  },
  playerList: {
    gap: 12,
    marginBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    padding: 12,
  },
  playerCardReady: {
    backgroundColor: THEME.colors.paperLight,
    borderColor: THEME.colors.emeraldBright,
    ...THEME.shadows.neonGlowCyan,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarBoxReady: {
    borderColor: THEME.colors.emeraldBright,
    backgroundColor: THEME.colors.emeraldGlow,
  },
  avatarText: {
    fontSize: 22,
  },
  playerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  playerName: {
    fontSize: 15.5,
    fontWeight: '900',
    color: THEME.colors.ink,
  },
  playerNickname: {
    fontSize: 12,
    fontStyle: 'italic',
    color: THEME.colors.cyanBright,
    marginTop: 2,
  },
  hostBadge: {
    backgroundColor: THEME.colors.gold,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  hostBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  botBadge: {
    backgroundColor: THEME.colors.purpleBright,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  botBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  youBadge: {
    backgroundColor: THEME.colors.pinkBright,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  youBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusBtnReady: {
    backgroundColor: THEME.colors.emeraldBright,
    borderColor: THEME.colors.emeraldBright,
  },
  statusBtnNotReady: {
    backgroundColor: THEME.colors.paperLight,
    borderColor: THEME.colors.paperBorder,
  },
  statusBtnSelfNotReady: {
    backgroundColor: THEME.colors.gold,
    borderColor: THEME.colors.goldBright,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBtnTextReady: {
    color: '#0F172A',
  },
  statusBtnTextNotReady: {
    color: THEME.colors.pencilGrey,
  },
  statusBtnTextSelfNotReady: {
    color: '#0F172A',
  },
  startActionBox: {
    marginTop: 8,
    alignItems: 'center',
  },
  startReasonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.colors.pinkBright,
    marginBottom: 10,
    textAlign: 'center',
  },
  startReasonReady: {
    color: THEME.colors.emeraldBright,
  },
  waitingHostText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: THEME.colors.pencilGrey,
    textAlign: 'center',
    marginTop: 6,
  },
});
