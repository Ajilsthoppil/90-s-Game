import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { UnoCard, UnoColor, UnoGameState } from '../types/uno.types';
import { isCardPlayable } from '../rules/unoRules';
import { THEME } from '../../../theme/theme';
import { UnoCardComponent } from '../../../components/UnoCardComponent';
import { soundService } from '../../../audio/soundService';

interface UnoBoardComponentProps {
  state: UnoGameState;
  localPlayerId: string;
  onPlayCard: (cardId: string, chosenColor?: UnoColor) => void;
  onDrawCard: () => void;
  onCallUno: () => void;
  onCatchUno: (targetId: string) => void;
  onChallenge: (accept: boolean) => void;
  hideHeader?: boolean;
  onExit?: () => void;
}

const COLOR_MAP: Record<UnoColor, string> = {
  RED: '#DC2626',
  GREEN: '#16A34A',
  BLUE: '#2563EB',
  YELLOW: '#D97706',
};

const COLOR_BG_MAP: Record<UnoColor, string> = {
  RED: 'rgba(220, 38, 38, 0.25)',
  GREEN: 'rgba(22, 163, 74, 0.25)',
  BLUE: 'rgba(37, 99, 235, 0.25)',
  YELLOW: 'rgba(217, 119, 6, 0.25)',
};

export const UnoBoardComponent: React.FC<UnoBoardComponentProps> = ({
  state,
  localPlayerId,
  onPlayCard,
  onDrawCard,
  onCallUno,
  onCatchUno,
  onChallenge,
  hideHeader = false,
  onExit,
}) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);

  const localPlayer = state.players.find((p) => p.id === localPlayerId);
  const activePlayer = state.players[state.currentTurnIdx];
  const isMyTurn = state.status === 'PLAYING' && activePlayer?.id === localPlayerId;

  const topCard = state.discardPile[state.discardPile.length - 1];
  const pendingChallenge = state.pendingChallenge;
  const isChallengeTargetedAtMe =
    pendingChallenge && pendingChallenge.challengerId === localPlayerId;

  const opponents = state.players.filter((p) => p.id !== localPlayerId);
  const topOpponent = opponents[0];
  const leftOpponent = opponents[1];
  const rightOpponent = opponents[2];

  const handleCardPress = (card: UnoCard) => {
    if (!isMyTurn || pendingChallenge) return;

    if (!isCardPlayable(card, state.activeColor, state.activeValue)) {
      // Not playable: select it anyway so player can inspect
      setSelectedCardId(selectedCardId === card.id ? null : card.id);
      return;
    }

    if (selectedCardId === card.id) {
      // Second tap: play the card
      executePlayCard(card);
    } else {
      // First tap: select and elevate
      setSelectedCardId(card.id);
    }
  };

  const executePlayCard = (card: UnoCard) => {
    if (card.color === 'WILD') {
      setPendingWildCardId(card.id);
    } else {
      soundService.playCardPlay();
      onPlayCard(card.id);
      setSelectedCardId(null);
    }
  };

  const handleSelectColor = (col: UnoColor) => {
    if (pendingWildCardId) {
      soundService.playCardPlay();
      onPlayCard(pendingWildCardId, col);
      setPendingWildCardId(null);
      setSelectedCardId(null);
    }
  };

  const handleDraw = () => {
    if (!isMyTurn || pendingChallenge) return;
    soundService.playCardDraw();
    onDrawCard();
    setSelectedCardId(null);
  };

  const handleUnoCallPress = () => {
    soundService.playUnoCall();
    onCallUno();
  };

  const selectedCard = localPlayer?.hand.find((c) => c.id === selectedCardId);
  const isSelectedPlayable =
    selectedCard && isCardPlayable(selectedCard, state.activeColor, state.activeValue);

  return (
    <View style={boardStyles.rootContainer}>
      {/* Top Header Bar when not provided by parent */}
      {!hideHeader && (
        <View style={boardStyles.headerBar}>
          <Pressable onPress={onExit || (() => {})} style={boardStyles.backBtn}>
            <Text style={{ fontSize: 14 }}>⬅️</Text>
          </Pressable>
          <View style={boardStyles.titleBadge}>
            <Text style={boardStyles.titleText}>🃏 UNO ARENA</Text>
          </View>
          <View style={{ width: 34 }} />
        </View>
      )}

      {/* Main Table Layout: Portrait vs Landscape */}
      <View
        style={[
          boardStyles.layoutContainer,
          isLandscape && boardStyles.layoutContainerLandscape,
        ]}
      >
        {/* Oval Felt Table Frame */}
        <View
          style={[
            boardStyles.feltSurface,
            isLandscape && boardStyles.feltSurfaceLandscape,
          ]}
        >
          {opponents.length > 3 ? (
            /* Multi-Opponents (4-7 Opponents / up to 8 Players) Horizontal Roster */
            <View style={boardStyles.multiOppRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={boardStyles.multiOppScroll}
              >
                {opponents.map((opp) => {
                  const isTurn = state.players[state.currentTurnIdx]?.id === opp.id;
                  return (
                    <View
                      key={opp.id}
                      style={[
                        boardStyles.oppBadgeCompact,
                        isTurn && boardStyles.oppActiveTurn,
                      ]}
                    >
                      <Text style={boardStyles.oppAvatar}>{opp.avatar || '🤖'}</Text>
                      <View style={{ marginLeft: 6 }}>
                        <Text style={boardStyles.oppNameCompact} numberOfLines={1}>
                          {opp.name}
                        </Text>
                        <Text style={boardStyles.oppCardCount}>🎴 {opp.hand.length}</Text>
                      </View>
                      {opp.hand.length === 1 && !opp.calledUno && (
                        <Pressable
                          onPress={() => onCatchUno(opp.id)}
                          style={boardStyles.catchUnoBadge}
                        >
                          <Text style={boardStyles.catchUnoText}>CATCH!</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : (
            <>
              {/* Top Opponent */}
              {topOpponent && (
                <View
                  style={[
                    boardStyles.oppBadge,
                    boardStyles.oppTop,
                    state.players[state.currentTurnIdx]?.id === topOpponent.id &&
                      boardStyles.oppActiveTurn,
                  ]}
                >
                  <Text style={boardStyles.oppAvatar}>{topOpponent.avatar || '🤖'}</Text>
                  <View>
                    <Text style={boardStyles.oppName} numberOfLines={1}>
                      {topOpponent.name}
                    </Text>
                    <Text style={boardStyles.oppCardCount}>🎴 {topOpponent.hand.length} cards</Text>
                  </View>
                  {topOpponent.hand.length === 1 && !topOpponent.calledUno && (
                    <Pressable
                      onPress={() => onCatchUno(topOpponent.id)}
                      style={boardStyles.catchUnoBadge}
                    >
                      <Text style={boardStyles.catchUnoText}>CATCH!</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Left Opponent */}
              {leftOpponent && (
                <View
                  style={[
                    boardStyles.oppBadge,
                    boardStyles.oppLeft,
                    state.players[state.currentTurnIdx]?.id === leftOpponent.id &&
                      boardStyles.oppActiveTurn,
                  ]}
                >
                  <Text style={boardStyles.oppAvatar}>{leftOpponent.avatar || '🤖'}</Text>
                  <View>
                    <Text style={boardStyles.oppName} numberOfLines={1}>
                      {leftOpponent.name}
                    </Text>
                    <Text style={boardStyles.oppCardCount}>🎴 {leftOpponent.hand.length}</Text>
                  </View>
                  {leftOpponent.hand.length === 1 && !leftOpponent.calledUno && (
                    <Pressable
                      onPress={() => onCatchUno(leftOpponent.id)}
                      style={boardStyles.catchUnoBadge}
                    >
                      <Text style={boardStyles.catchUnoText}>CATCH!</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Right Opponent */}
              {rightOpponent && (
                <View
                  style={[
                    boardStyles.oppBadge,
                    boardStyles.oppRight,
                    state.players[state.currentTurnIdx]?.id === rightOpponent.id &&
                      boardStyles.oppActiveTurn,
                  ]}
                >
                  <Text style={boardStyles.oppAvatar}>{rightOpponent.avatar || '🤖'}</Text>
                  <View>
                    <Text style={boardStyles.oppName} numberOfLines={1}>
                      {rightOpponent.name}
                    </Text>
                    <Text style={boardStyles.oppCardCount}>🎴 {rightOpponent.hand.length}</Text>
                  </View>
                  {rightOpponent.hand.length === 1 && !rightOpponent.calledUno && (
                    <Pressable
                      onPress={() => onCatchUno(rightOpponent.id)}
                      style={boardStyles.catchUnoBadge}
                    >
                      <Text style={boardStyles.catchUnoText}>CATCH!</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          )}

          {/* Direction Orbit Ring & Center Active Color Indicator */}
          <View style={boardStyles.centerRingContainer}>
            <View
              style={[
                boardStyles.activeColorDisk,
                {
                  borderColor: COLOR_MAP[state.activeColor],
                  backgroundColor: COLOR_BG_MAP[state.activeColor],
                },
              ]}
            >
              <Text style={[boardStyles.activeColorText, { color: COLOR_MAP[state.activeColor] }]}>
                {state.activeColor}
              </Text>
              <Text style={boardStyles.directionIcon}>
                {state.direction === 1 ? '↻ CLOCKWISE' : '↺ COUNTER'}
              </Text>
            </View>
          </View>

          {/* Center Discard & Draw Piles */}
          <View style={boardStyles.tableCenterPiles}>
            {/* Draw Pile with Deck Depth Layering */}
            <Pressable
              disabled={!isMyTurn || !!pendingChallenge}
              onPress={handleDraw}
              style={[
                boardStyles.drawPileContainer,
                (!isMyTurn || !!pendingChallenge) && boardStyles.drawPileDisabled,
              ]}
            >
              <View style={boardStyles.deckDepthUnder} />
              <View style={boardStyles.deckDepthMid} />
              <View style={boardStyles.cardBackTop}>
                <Text style={boardStyles.cardBackText}>UNO</Text>
                <View style={boardStyles.drawHintPill}>
                  <Text style={boardStyles.drawHintText}>DRAW 🎴</Text>
                </View>
              </View>
            </Pressable>

            {/* Top Discard Pile Card */}
            {topCard && (
              <View style={boardStyles.discardContainer}>
                <UnoCardComponent card={topCard} size="large" />
                <View style={boardStyles.discardTag}>
                  <Text style={boardStyles.discardTagText}>DISCARD</Text>
                </View>
              </View>
            )}
          </View>

          {/* Wild Draw Four Pending Challenge Interactive Banner */}
          {isChallengeTargetedAtMe && (
            <View style={boardStyles.challengeOverlayBox}>
              <Text style={boardStyles.challengeTitle}>⚠️ WILD +4 PLAYED AGAINST YOU!</Text>
              <Text style={boardStyles.challengeSub}>
                Did opponent illegally hold a {pendingChallenge.prePlayColor} card?
              </Text>
              <View style={boardStyles.challengeBtnRow}>
                <Pressable
                  onPress={() => onChallenge(false)}
                  style={[boardStyles.challengeBtn, boardStyles.acceptBtn]}
                >
                  <Text style={boardStyles.challengeBtnText}>ACCEPT (+4)</Text>
                </Pressable>
                <Pressable
                  onPress={() => onChallenge(true)}
                  style={[boardStyles.challengeBtn, boardStyles.challengeActionBtn]}
                >
                  <Text style={boardStyles.challengeBtnText}>CHALLENGE! ⚔️</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* You Avatar / Active Turn Badge on Table */}
          <View
            style={[
              boardStyles.youTableBadge,
              isMyTurn && boardStyles.youTableBadgeActive,
            ]}
          >
            <Text style={{ fontSize: 13 }}>{localPlayer?.avatar || '👤'}</Text>
            <Text style={boardStyles.youTableText}>
              {localPlayer?.name} (You) • {localPlayer?.hand.length} cards
            </Text>
            {isMyTurn && <Text style={boardStyles.yourTurnDot}>● YOUR TURN</Text>}
          </View>
        </View>

        {/* Player Action and Hand Tray Area */}
        <View style={[boardStyles.handTrayArea, isLandscape && boardStyles.handTrayAreaLandscape]}>
          {/* Action Bar (Play Selected / Draw / Call UNO / Status Commentary) */}
          <View style={boardStyles.actionBar}>
            {selectedCard && isMyTurn && isSelectedPlayable ? (
              <Pressable
                onPress={() => executePlayCard(selectedCard)}
                style={boardStyles.playSelectedBtn}
              >
                <Text style={boardStyles.playSelectedText}>
                  PLAY {selectedCard.color === 'WILD' ? 'WILD' : selectedCard.color}{' '}
                  {selectedCard.value} 🃏
                </Text>
              </Pressable>
            ) : isMyTurn ? (
              <Pressable onPress={handleDraw} style={boardStyles.drawActionBtn}>
                <Text style={boardStyles.drawActionText}>DRAW CARD 📥</Text>
              </Pressable>
            ) : (
              <View style={boardStyles.waitingTurnPill}>
                <Text style={boardStyles.waitingTurnText}>
                  {activePlayer?.name}'s Turn...
                </Text>
              </View>
            )}

            {/* CALL UNO Button */}
            <Pressable
              onPress={handleUnoCallPress}
              style={[
                boardStyles.callUnoBtn,
                localPlayer?.calledUno && boardStyles.callUnoBtnCalled,
              ]}
            >
              <Text style={boardStyles.callUnoText}>
                {localPlayer?.calledUno ? 'UNO! ✓' : 'CALL\nUNO!'}
              </Text>
            </Pressable>
          </View>

          {/* Player Hand Cards Fanned ScrollView */}
          <View style={boardStyles.handScrollContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={boardStyles.handScrollContent}
            >
              {localPlayer?.hand.map((card, idx) => {
                const isPlayable = isCardPlayable(
                  card,
                  state.activeColor,
                  state.activeValue
                );
                const isSelected = selectedCardId === card.id;

                return (
                  <View
                    key={card.id}
                    style={{
                      marginLeft: idx > 0 ? (localPlayer.hand.length > 7 ? -22 : -14) : 0,
                      zIndex: isSelected ? 99 : idx,
                    }}
                  >
                    <UnoCardComponent
                      card={card}
                      size="medium"
                      selected={isSelected}
                      isPlayable={isMyTurn && isPlayable}
                      onPress={() => handleCardPress(card)}
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {/* Commentary Status Footer */}
          <View
            style={[
              boardStyles.statusFooter,
              (state.lastActionMessage?.includes('Draw') ||
                state.lastActionMessage?.includes('draws')) && {
                borderColor: '#F59E0B',
                backgroundColor: '#2E1905',
              },
            ]}
          >
            <Text style={boardStyles.statusFooterText} numberOfLines={2}>
              {state.lastActionMessage || 'Match in progress. Play or draw a card.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Wild 4-Color Selection Modal */}
      <Modal visible={!!pendingWildCardId} transparent animationType="fade">
        <View style={boardStyles.modalOverlay}>
          <View style={boardStyles.colorPickerCard}>
            <Text style={boardStyles.colorPickerHeader}>CHOOSE ACTIVE COLOR</Text>
            <View style={boardStyles.colorGrid}>
              {(['RED', 'GREEN', 'BLUE', 'YELLOW'] as UnoColor[]).map((col) => (
                <Pressable
                  key={col}
                  onPress={() => handleSelectColor(col)}
                  style={[boardStyles.colorOptionBtn, { backgroundColor: COLOR_MAP[col] }]}
                >
                  <Text style={boardStyles.colorOptionText}>{col}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const boardStyles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBadge: {
    backgroundColor: '#78350F',
    borderWidth: 2,
    borderColor: '#D97706',
    paddingHorizontal: 16,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FEF3C7',
    letterSpacing: 1,
  },
  layoutContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  layoutContainerLandscape: {
    flexDirection: 'row',
  },
  feltSurface: {
    flex: 1,
    backgroundColor: '#064E3B',
    borderRadius: 100,
    borderWidth: 5,
    borderColor: '#78350F',
    marginVertical: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  feltSurfaceLandscape: {
    flex: 1.2,
    marginRight: 8,
    borderRadius: 80,
  },
  multiOppRow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    zIndex: 15,
  },
  multiOppScroll: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  oppBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  oppNameCompact: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#F8FAFC',
    maxWidth: 60,
  },
  oppBadge: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 14,
    gap: 5,
    zIndex: 10,
  },
  oppActiveTurn: {
    borderColor: '#F59E0B',
    borderWidth: 2,
    backgroundColor: '#1E293B',
  },
  oppTop: {
    top: 8,
  },
  oppLeft: {
    left: 8,
  },
  oppRight: {
    right: 8,
  },
  oppAvatar: {
    fontSize: 15,
  },
  oppName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F8FAFC',
    maxWidth: 65,
  },
  oppCardCount: {
    fontSize: 8.5,
    color: '#94A3B8',
    fontWeight: '700',
  },
  catchUnoBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 2,
  },
  catchUnoText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFF',
  },
  centerRingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  activeColorDisk: {
    width: 170,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeColorText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  directionIcon: {
    fontSize: 9,
    fontWeight: '800',
    color: '#CBD5E1',
    marginTop: 2,
  },
  tableCenterPiles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    zIndex: 6,
  },
  drawPileContainer: {
    position: 'relative',
    width: 80,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawPileDisabled: {
    opacity: 0.8,
  },
  deckDepthUnder: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 74,
    height: 112,
    borderRadius: 9,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
  },
  deckDepthMid: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 74,
    height: 112,
    borderRadius: 9,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#64748B',
  },
  cardBackTop: {
    width: 74,
    height: 112,
    borderRadius: 9,
    backgroundColor: '#0F172A',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  cardBackText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 1.5,
    transform: [{ rotate: '-25deg' }],
  },
  drawHintPill: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  drawHintText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#78350F',
  },
  discardContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardTag: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#1E293B',
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: '#475569',
  },
  discardTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#94A3B8',
  },
  challengeOverlayBox: {
    position: 'absolute',
    bottom: 36,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    zIndex: 30,
    elevation: 12,
    width: '90%',
  },
  challengeTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F87171',
  },
  challengeSub: {
    fontSize: 9.5,
    color: '#CBD5E1',
    marginTop: 2,
    textAlign: 'center',
  },
  challengeBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  challengeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: '#475569',
  },
  challengeActionBtn: {
    backgroundColor: '#DC2626',
  },
  challengeBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
  },
  youTableBadge: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 6,
    zIndex: 8,
  },
  youTableBadgeActive: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  youTableText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  yourTurnDot: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#F59E0B',
  },
  handTrayArea: {
    paddingVertical: 2,
    justifyContent: 'flex-end',
  },
  handTrayAreaLandscape: {
    flex: 1,
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
    gap: 8,
  },
  playSelectedBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#14532D',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    elevation: 4,
  },
  playSelectedText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFF',
  },
  drawActionBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#1D4ED8',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    elevation: 4,
  },
  drawActionText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFF',
  },
  waitingTurnPill: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  waitingTurnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  callUnoBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F59E0B',
    borderWidth: 2.5,
    borderColor: '#B45309',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  callUnoBtnCalled: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  callUnoText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#78350F',
    textAlign: 'center',
  },
  handScrollContainer: {
    height: 115,
    justifyContent: 'center',
  },
  handScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    paddingTop: 8,
  },
  statusFooter: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  statusFooterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEF3C7',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#D97706',
    elevation: 10,
  },
  colorPickerHeader: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FEF3C7',
    marginBottom: 14,
    letterSpacing: 1,
  },
  colorGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOptionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
    elevation: 6,
  },
  colorOptionText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
});
