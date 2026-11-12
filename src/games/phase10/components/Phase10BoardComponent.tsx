import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Modal,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { Phase10Card, Phase10GameState, LaidPhaseGroup } from '../types/phase10.types';
import { findValidPhaseGrouping } from '../rules/phase10Rules';
import { Phase10CardComponent } from '../../../components/Phase10CardComponent';
import { soundService } from '../../../audio/soundService';

interface Phase10BoardComponentProps {
  state: Phase10GameState;
  localPlayerId: string;
  onDraw: (fromDiscard: boolean) => void;
  onDiscard: (cardId: string, skipTargetPlayerId?: string) => void;
  onLayDownPhase: (cardGroups: Phase10Card[][]) => void;
  onHitPhase: (targetPlayerId: string, groupIndex: number, cardId: string) => void;
  hideHeader?: boolean;
  onExit?: () => void;
  onOpenRules?: () => void;
}

const PHASE_DESCRIPTIONS: Record<number, string> = {
  1: 'Phase 1: 2 sets of 3',
  2: 'Phase 2: 1 set of 3 + 1 run of 4',
  3: 'Phase 3: 1 set of 4 + 1 run of 4',
  4: 'Phase 4: 1 run of 7',
  5: 'Phase 5: 1 run of 8',
  6: 'Phase 6: 1 run of 9',
  7: 'Phase 7: 2 sets of 4',
  8: 'Phase 8: 7 cards of 1 color',
  9: 'Phase 9: 1 set of 5 + 1 set of 2',
  10: 'Phase 10: 1 set of 5 + 1 set of 3',
};

export const Phase10BoardComponent: React.FC<Phase10BoardComponentProps> = ({
  state,
  localPlayerId,
  onDraw,
  onDiscard,
  onLayDownPhase,
  onHitPhase,
  hideHeader = false,
  onExit,
  onOpenRules,
}) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [skipModalVisible, setSkipModalVisible] = useState(false);
  const [pendingSkipCardId, setPendingSkipCardId] = useState<string | null>(null);

  const localPlayer = state.players.find((p) => p.id === localPlayerId);
  const activePlayer = state.players[state.currentTurnIdx];
  const isMyTurn = state.status === 'PLAYING' && activePlayer?.id === localPlayerId;
  const hasDrawn = state.hasDrawnThisTurn;

  const topDiscard = state.discardPile[state.discardPile.length - 1];
  const opponents = state.players.filter((p) => p.id !== localPlayerId);

  // Check if selected cards can form a valid Phase grouping
  const selectedCards = (localPlayer?.hand || []).filter((c) =>
    selectedCardIds.includes(c.id)
  );

  const validPhaseGrouping =
    localPlayer && !localPlayer.hasLaidPhaseThisRound && isMyTurn && hasDrawn && selectedCards.length >= 6
      ? findValidPhaseGrouping(localPlayer.currentPhase, selectedCards)
      : null;

  const handleCardPress = (card: Phase10Card) => {
    if (!isMyTurn) return;

    if (selectedCardIds.includes(card.id)) {
      setSelectedCardIds(selectedCardIds.filter((id) => id !== card.id));
    } else {
      setSelectedCardIds([...selectedCardIds, card.id]);
    }
  };

  const handleDrawPress = (fromDiscard: boolean) => {
    if (!isMyTurn || hasDrawn) return;
    if (fromDiscard && topDiscard?.value === 'SKIP') return;

    if (soundEnabled) soundService.playCardDraw();
    onDraw(fromDiscard);
    setSelectedCardIds([]);
  };

  const handleLayPhasePress = () => {
    if (!validPhaseGrouping || !isMyTurn || !hasDrawn) return;
    if (soundEnabled) soundService.playCardPlay();
    onLayDownPhase(validPhaseGrouping);
    setSelectedCardIds([]);
  };

  const handleDiscardPress = () => {
    if (!isMyTurn || !hasDrawn || selectedCardIds.length !== 1) return;
    const cardId = selectedCardIds[0];
    const card = localPlayer?.hand.find((c) => c.id === cardId);
    if (!card) return;

    if (card.value === 'SKIP' && opponents.length > 0) {
      setPendingSkipCardId(cardId);
      setSkipModalVisible(true);
      return;
    }

    if (soundEnabled) soundService.playCardPlay();
    onDiscard(cardId);
    setSelectedCardIds([]);
  };

  const handleSkipTargetSelected = (targetId: string) => {
    if (!pendingSkipCardId) return;
    if (soundEnabled) soundService.playCardPlay();
    onDiscard(pendingSkipCardId, targetId);
    setPendingSkipCardId(null);
    setSkipModalVisible(false);
    setSelectedCardIds([]);
  };

  const handleHitOnGroup = (targetPlayerId: string, groupIndex: number) => {
    if (!isMyTurn || !hasDrawn || !localPlayer?.hasLaidPhaseThisRound) return;
    if (selectedCardIds.length !== 1) return;

    const cardId = selectedCardIds[0];
    if (soundEnabled) soundService.playCardPlay();
    onHitPhase(targetPlayerId, groupIndex, cardId);
    setSelectedCardIds([]);
  };

  // Status message for local player
  const getTurnInstruction = (): string => {
    if (state.status !== 'PLAYING') return '';
    if (!isMyTurn) {
      return `⏳ ${activePlayer?.name}'s turn...`;
    }
    if (!hasDrawn) {
      return '👉 Draw a card to begin turn (Draw Pile or Discard Pile)';
    }
    if (validPhaseGrouping) {
      return `✨ Valid ${PHASE_DESCRIPTIONS[localPlayer?.currentPhase || 1]}! Tap LAY DOWN PHASE.`;
    }
    if (localPlayer?.hasLaidPhaseThisRound && selectedCardIds.length === 1) {
      return '🎯 Tap a laid phase on the table to HIT, or tap DISCARD to finish turn.';
    }
    if (selectedCardIds.length === 1) {
      return 'Tap DISCARD to end your turn.';
    }
    return 'Select cards for your Phase, or select 1 card to Discard.';
  };

  // Check if any player has laid down phases
  const playersWithLaidPhases = state.players.filter(
    (p) => p.hasLaidPhaseThisRound && p.laidPhaseGroups.length > 0
  );

  const statusBarPadding =
    Platform.OS === 'android'
      ? isLandscape
        ? 0
        : Math.max(32, StatusBar.currentHeight || 32)
      : 0;

  return (
    <View style={styles.woodTableContainer}>
      {/* Top Header Bar with Android Status Bar Clearance */}
      {!hideHeader && (
        <View style={[styles.headerBar, { paddingTop: statusBarPadding, height: 48 + statusBarPadding }]}>
          <Pressable
            onPress={onExit || (() => {})}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            style={styles.exitPill}
          >
            <Text style={styles.exitPillText}>← EXIT</Text>
          </Pressable>

          <View style={styles.woodenBanner}>
            <Text style={styles.bannerTitle}>🔢 PHASE 10</Text>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>ROUND {state.roundNumber}</Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              onPress={() => setSoundEnabled(!soundEnabled)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.headerIconBtn}
            >
              <Text style={styles.headerIconText}>{soundEnabled ? '🔊' : '🔇'}</Text>
            </Pressable>

            {onOpenRules && (
              <Pressable
                onPress={onOpenRules}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={styles.rulesPill}
              >
                <Text style={styles.rulesPillText}>📜 Rules</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Opponents Status Row (Scrollable for up to 8 players) */}
      <View style={styles.opponentsRowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.opponentsRowScroll}
        >
          {opponents.map((opp) => {
            const isOppTurn = activePlayer?.id === opp.id;
            return (
              <View
                key={opp.id}
                style={[
                  styles.oppChip,
                  isOppTurn && styles.oppChipActive,
                  opp.isSkipped && styles.oppChipSkipped,
                ]}
              >
                <View style={[styles.oppAvatarRing, isOppTurn && styles.oppAvatarRingActive]}>
                  <Text style={styles.oppAvatar}>{opp.avatar || (opp.isBot ? '🤖' : '👤')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.oppName} numberOfLines={1}>
                    {opp.name}
                  </Text>
                  <View style={styles.oppSubRow}>
                    <Text style={styles.oppSubBadge}>Phase {opp.currentPhase}</Text>
                    <Text style={styles.oppCardCount}>{opp.hand.length} 🂠</Text>
                  </View>
                </View>
                {opp.hasLaidPhaseThisRound && (
                  <View style={styles.laidTag}>
                    <Text style={styles.laidTagText}>LAID ✓</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Instruction Banner */}
      <View style={[styles.instructionBanner, isMyTurn && styles.instructionBannerActive]}>
        <Text style={styles.instructionText}>{getTurnInstruction()}</Text>
      </View>

      {/* Main Table Surface */}
      <View style={[styles.tableSurface, isLandscape && styles.tableSurfaceLandscape]}>
        {/* Center Piles: Draw & Discard */}
        <View style={styles.pilesArea}>
          {/* Draw Pile */}
          <Pressable
            disabled={!isMyTurn || hasDrawn}
            onPress={() => handleDrawPress(false)}
            style={({ pressed }) => [
              styles.pileContainer,
              isMyTurn && !hasDrawn && styles.pileHighlight,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <View style={styles.cardBack}>
              <View style={styles.cardBackInner}>
                <Text style={styles.cardBackTitle}>PHASE</Text>
                <Text style={styles.cardBackNum}>10</Text>
                <Text style={styles.cardBackDeckCount}>{state.deck.length}</Text>
              </View>
            </View>
            <Text style={styles.pileLabel}>
              {isMyTurn && !hasDrawn ? '👉 DRAW' : 'Draw Pile'}
            </Text>
          </Pressable>

          {/* Discard Pile */}
          <Pressable
            disabled={!isMyTurn || hasDrawn || topDiscard?.value === 'SKIP'}
            onPress={() => handleDrawPress(true)}
            style={({ pressed }) => [
              styles.pileContainer,
              isMyTurn && !hasDrawn && topDiscard?.value !== 'SKIP' && styles.pileHighlight,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            {topDiscard ? (
              <Phase10CardComponent card={topDiscard} size="medium" />
            ) : (
              <View style={styles.emptyDiscardBox}>
                <Text style={styles.emptyDiscardText}>Empty</Text>
              </View>
            )}
            <Text style={styles.pileLabel}>
              {topDiscard?.value === 'SKIP' ? 'Skip (No Draw)' : 'Discard Pile'}
            </Text>
          </Pressable>
        </View>

        {/* Laid Phases Display on Table Surface */}
        <View style={styles.laidPhasesArea}>
          <Text style={styles.laidPhasesTitle}>TABLE PHASES</Text>
          {playersWithLaidPhases.length === 0 ? (
            <View style={styles.noPhasesBox}>
              <Text style={styles.noPhasesText}>No phases laid down yet this round</Text>
            </View>
          ) : (
            <ScrollView style={styles.laidPhasesScroll} nestedScrollEnabled>
              {playersWithLaidPhases.map((p) => (
                <View key={p.id} style={styles.playerLaidRow}>
                  <View style={styles.playerLaidHeader}>
                    <Text style={styles.playerLaidName}>
                      {p.name} (Phase {p.currentPhase})
                    </Text>
                  </View>
                  <View style={styles.groupsRow}>
                    {p.laidPhaseGroups.map((grp, gIdx) => {
                      const canHitThisGroup =
                        isMyTurn &&
                        hasDrawn &&
                        localPlayer?.hasLaidPhaseThisRound &&
                        selectedCardIds.length === 1;

                      return (
                        <Pressable
                          key={`${p.id}_grp_${gIdx}`}
                          disabled={!canHitThisGroup}
                          onPress={() => handleHitOnGroup(p.id, gIdx)}
                          style={[
                            styles.laidGroupPill,
                            canHitThisGroup && styles.laidGroupHitTarget,
                          ]}
                        >
                          <View style={styles.cardsInlineList}>
                            {grp.cards.map((c, cIdx) => (
                              <View
                                key={c.id}
                                style={{
                                  marginLeft: cIdx > 0 ? -22 : 0,
                                  zIndex: cIdx,
                                }}
                              >
                                <Phase10CardComponent card={c} size="small" />
                              </View>
                            ))}
                          </View>
                          {canHitThisGroup && (
                            <View style={styles.hitPromptBadge}>
                              <Text style={styles.hitPromptText}>+ HIT</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Action Control Bar (Draw, Lay Phase, Discard) */}
      <View style={styles.actionBar}>
        <Pressable
          disabled={!isMyTurn || hasDrawn}
          onPress={() => handleDrawPress(false)}
          style={[
            styles.actionBtn,
            styles.drawBtn,
            (!isMyTurn || hasDrawn) && styles.actionBtnDisabled,
          ]}
        >
          <Text style={styles.actionBtnText}>📥 DRAW</Text>
        </Pressable>

        <Pressable
          disabled={!validPhaseGrouping}
          onPress={handleLayPhasePress}
          style={[
            styles.actionBtn,
            styles.layPhaseBtn,
            !validPhaseGrouping && styles.actionBtnDisabled,
          ]}
        >
          <Text style={styles.layPhaseBtnText}>
            🌟 LAY DOWN PHASE {localPlayer?.currentPhase || 1}
          </Text>
        </Pressable>

        <Pressable
          disabled={!isMyTurn || !hasDrawn || selectedCardIds.length !== 1}
          onPress={handleDiscardPress}
          style={[
            styles.actionBtn,
            styles.discardBtn,
            (!isMyTurn || !hasDrawn || selectedCardIds.length !== 1) && styles.actionBtnDisabled,
          ]}
        >
          <Text style={styles.actionBtnText}>📤 DISCARD</Text>
        </Pressable>
      </View>

      {/* Local Player Hand Tray */}
      <View style={styles.handTray}>
        <View style={styles.handHeaderRow}>
          <View style={styles.handHeaderLeft}>
            <Text style={styles.handPlayerName}>{localPlayer?.name || 'You'}</Text>
            <View style={styles.targetPhasePill}>
              <Text style={styles.targetPhasePillText}>
                Target: {PHASE_DESCRIPTIONS[localPlayer?.currentPhase || 1]}
              </Text>
            </View>
          </View>
          <Text style={styles.handCountText}>
            {localPlayer?.hand.length || 0} cards (
            {selectedCardIds.length} selected)
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.handCardsContainer}
        >
          {(localPlayer?.hand || []).map((card, idx) => {
            const isSelected = selectedCardIds.includes(card.id);
            return (
              <View
                key={card.id}
                style={{
                  marginLeft: idx > 0 ? -24 : 0,
                  zIndex: isSelected ? 50 : idx,
                }}
              >
                <Phase10CardComponent
                  card={card}
                  size="medium"
                  selected={isSelected}
                  disabled={!isMyTurn}
                  onPress={() => handleCardPress(card)}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Skip Target Selection Modal */}
      <Modal visible={skipModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🚫 PLAY SKIP CARD</Text>
            <Text style={styles.modalSubtitle}>
              Choose which opponent to skip for their next turn:
            </Text>
            <View style={styles.modalOpponentsList}>
              {opponents.map((opp) => (
                <Pressable
                  key={opp.id}
                  onPress={() => handleSkipTargetSelected(opp.id)}
                  style={styles.modalOppBtn}
                >
                  <Text style={styles.modalOppAvatar}>{opp.avatar || '🤖'}</Text>
                  <Text style={styles.modalOppName}>{opp.name}</Text>
                  <Text style={styles.modalOppSub}>Phase {opp.currentPhase}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  woodTableContainer: {
    flex: 1,
    backgroundColor: '#1C1108',
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  exitPill: {
    minWidth: 48,
    minHeight: 48,
    backgroundColor: '#4E2C17',
    borderWidth: 1.5,
    borderColor: '#8B5A2B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  exitPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FEFCBF',
  },
  woodenBanner: {
    backgroundColor: '#5C3A21',
    borderWidth: 2,
    borderColor: '#9E6D38',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: 'center',
    elevation: 4,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FEFCBF',
    letterSpacing: 1,
  },
  bannerBadge: {
    backgroundColor: '#2D1608',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F6E05E',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#4E2C17',
    borderWidth: 1.5,
    borderColor: '#8B5A2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 14,
  },
  rulesPill: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1.5,
    borderColor: '#D69E2E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rulesPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#744210',
  },
  opponentsRowWrapper: {
    marginBottom: 4,
  },
  opponentsRowScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  oppChip: {
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A180D',
    borderWidth: 1.5,
    borderColor: '#4E2C17',
    borderRadius: 8,
    padding: 4,
    gap: 6,
  },
  oppChipActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#3E2415',
    elevation: 4,
  },
  oppChipSkipped: {
    opacity: 0.6,
    borderColor: '#E53E3E',
  },
  oppAvatarRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1A1008',
    borderWidth: 1.5,
    borderColor: '#8B5A2B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oppAvatarRingActive: {
    borderColor: '#F59E0B',
  },
  oppAvatar: {
    fontSize: 13,
  },
  oppName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  oppSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  oppSubBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F6E05E',
  },
  oppCardCount: {
    fontSize: 9,
    color: '#CBD5E0',
    fontWeight: '700',
  },
  laidTag: {
    backgroundColor: '#276749',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  laidTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFF',
  },
  instructionBanner: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginVertical: 2,
    borderWidth: 1,
    borderColor: '#4E2C17',
  },
  instructionBannerActive: {
    borderColor: '#D69E2E',
    backgroundColor: 'rgba(214, 158, 46, 0.15)',
  },
  instructionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEFCBF',
    textAlign: 'center',
  },
  tableSurface: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#26140A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4E2C17',
    padding: 8,
    marginVertical: 4,
  },
  tableSurfaceLandscape: {
    flexDirection: 'row',
  },
  pilesArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 4,
  },
  pileContainer: {
    alignItems: 'center',
    padding: 4,
    borderRadius: 10,
  },
  pileHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  cardBack: {
    width: 64,
    height: 96,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    padding: 4,
  },
  cardBackInner: {
    flex: 1,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBackTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  cardBackNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F6E05E',
  },
  cardBackDeckCount: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CBD5E0',
    marginTop: 2,
  },
  emptyDiscardBox: {
    width: 64,
    height: 96,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#718096',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDiscardText: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '700',
  },
  pileLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEFCBF',
    marginTop: 4,
  },
  laidPhasesArea: {
    flex: 1,
    backgroundColor: '#1C1008',
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
  },
  laidPhasesTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A0AEC0',
    letterSpacing: 1,
    marginBottom: 4,
  },
  noPhasesBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhasesText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
  },
  laidPhasesScroll: {
    flex: 1,
  },
  playerLaidRow: {
    marginBottom: 6,
    backgroundColor: '#2A180D',
    borderRadius: 6,
    padding: 4,
  },
  playerLaidHeader: {
    marginBottom: 2,
  },
  playerLaidName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F6E05E',
  },
  groupsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  laidGroupPill: {
    backgroundColor: '#1A1008',
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
    borderColor: '#4E2C17',
    position: 'relative',
  },
  laidGroupHitTarget: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  cardsInlineList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hitPromptBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  hitPromptText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1A1008',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  drawBtn: {
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
  },
  layPhaseBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#15803D',
  },
  layPhaseBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  discardBtn: {
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#B91C1C',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  handTray: {
    backgroundColor: '#26140A',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4E2C17',
    padding: 6,
  },
  handHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  handHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handPlayerName: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FEFCBF',
  },
  targetPhasePill: {
    backgroundColor: '#744210',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  targetPhasePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEFCBF',
  },
  handCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AEC0',
  },
  handCardsContainer: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#2A180D',
    borderWidth: 2,
    borderColor: '#8B5A2B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FEFCBF',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E0',
    textAlign: 'center',
    marginBottom: 14,
  },
  modalOpponentsList: {
    width: '100%',
    gap: 8,
  },
  modalOppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E2415',
    borderWidth: 1.5,
    borderColor: '#8B5A2B',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  modalOppAvatar: {
    fontSize: 20,
  },
  modalOppName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalOppSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F6E05E',
  },
});
