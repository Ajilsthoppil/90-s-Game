import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { ActiveCardEvent } from '../types/ludoAdventure.types';
import { LudoGameState, LudoPlayer, LudoToken } from '../types/ludo.types';
import { CardResolveParams } from '../engine/CardEffectResolver';
import { soundService } from '../../../audio/soundService';

interface AdventureCardModalProps {
  visible: boolean;
  activeCardEvent: ActiveCardEvent | null;
  gameState: LudoGameState;
  onResolve: (params: CardResolveParams) => void;
  onDismiss: () => void;
}

export const AdventureCardModal: React.FC<AdventureCardModalProps> = ({
  visible,
  activeCardEvent,
  gameState,
  onResolve,
  onDismiss,
}) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(1)).current;
  const chestBounceAnim = useRef(new Animated.Value(0)).current;

  // Target selection state
  const [selectedOwnTokenId, setSelectedOwnTokenId] = useState<string | undefined>();
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | undefined>();
  const [selectedOpponentTokenId, setSelectedOpponentTokenId] = useState<string | undefined>();

  useEffect(() => {
    if (visible && activeCardEvent) {
      // Reset target choices to sensible defaults
      setSelectedOwnTokenId(activeCardEvent.triggeringTokenId);
      setSelectedOpponentId(undefined);
      setSelectedOpponentTokenId(undefined);

      // Sound
      try {
        if (activeCardEvent.cardType === 'TREASURE') {
          soundService.playCardPlay();
        } else {
          soundService.playCardDraw();
        }
      } catch (e) {
        // audio fallback
      }

      // Enter animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(chestBounceAnim, {
            toValue: -14,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(chestBounceAnim, {
            toValue: 0,
            duration: 180,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1.08,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1.0,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      glowLoop.start();

      return () => glowLoop.stop();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      chestBounceAnim.setValue(0);
    }
  }, [visible, activeCardEvent]);

  if (!visible || !activeCardEvent) return null;

  const { card, cardType, playerId } = activeCardEvent;
  const isTreasure = cardType === 'TREASURE';
  const player = gameState.players.find((p) => p.id === playerId);

  const handleActivate = () => {
    onResolve({
      ownTokenId: selectedOwnTokenId,
      opponentId: selectedOpponentId,
      opponentTokenId: selectedOpponentTokenId,
    });
  };

  const modalMaxWidth = Math.min(420, winWidth - 32);

  // Render Target Selection if required
  const renderTargetSelection = () => {
    if (!card.requiresTarget) return null;

    if (card.targetType === 'REVENGE_TARGET') {
      const revengeOpps = activeCardEvent.eligibleTargets?.revengeOpponents || [];
      if (revengeOpps.length === 0) {
        return (
          <View style={styles.targetSection}>
            <Text style={styles.targetSectionNotice}>
              🛡️ No opponent has captured you yet in this match!
            </Text>
            <Text style={styles.targetSectionSub}>
              Card will automatically convert into a bonus roll!
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.targetSection}>
          <Text style={styles.targetTitle}>🎯 SELECT A CAPTOR TO STRIKE BACK:</Text>
          {revengeOpps.map((opp) => {
            const oppPlayer = gameState.players.find((p) => p.id === opp.playerId);
            const isSelected = selectedOpponentId === opp.playerId;
            return (
              <View key={opp.playerId} style={styles.targetGroup}>
                <Pressable
                  onPress={() => {
                    setSelectedOpponentId(opp.playerId);
                    if (opp.tokenIds.length > 0) {
                      setSelectedOpponentTokenId(opp.tokenIds[0]);
                    }
                  }}
                  style={[styles.targetChoiceBtn, isSelected && styles.targetChoiceBtnActive]}
                >
                  <Text style={styles.targetChoiceText}>
                    {oppPlayer?.avatar} {oppPlayer?.name} ({opp.color})
                  </Text>
                  <Text style={styles.targetChoiceSub}>
                    {opp.tokenIds.length > 0
                      ? `${opp.tokenIds.length} vulnerable token(s)`
                      : 'No vulnerable tokens'}
                  </Text>
                </Pressable>

                {isSelected && opp.tokenIds.length > 0 && (
                  <View style={styles.tokenPillRow}>
                    {opp.tokenIds.map((tId) => (
                      <Pressable
                        key={tId}
                        onPress={() => setSelectedOpponentTokenId(tId)}
                        style={[
                          styles.tokenPill,
                          selectedOpponentTokenId === tId && styles.tokenPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.tokenPillText,
                            selectedOpponentTokenId === tId && styles.tokenPillTextActive,
                          ]}
                        >
                          Token {tId}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      );
    }

    if (card.targetType === 'OPPONENT_TOKEN') {
      const oppTokenIds = activeCardEvent.eligibleTargets?.opponentTokenIds || [];
      return (
        <View style={styles.targetSection}>
          <Text style={styles.targetTitle}>🎯 CHOOSE AN OPPONENT TARGET:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {oppTokenIds.map((tId) => {
              const isSelected = selectedOpponentTokenId === tId;
              return (
                <Pressable
                  key={tId}
                  onPress={() => setSelectedOpponentTokenId(tId)}
                  style={[styles.tokenCard, isSelected && styles.tokenCardActive]}
                >
                  <Text style={{ fontSize: 22 }}>🏴‍☠️</Text>
                  <Text style={styles.tokenCardId}>{tId}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      );
    }

    if (card.targetType === 'TOKEN_SWAP') {
      const ownTokens = activeCardEvent.eligibleTargets?.ownTokenIds || [];
      const oppTokens = activeCardEvent.eligibleTargets?.opponentTokenIds || [];

      return (
        <View style={styles.targetSection}>
          <Text style={styles.targetTitle}>🔄 SELECT YOUR TOKEN TO SWAP:</Text>
          <View style={styles.tokenPillRow}>
            {ownTokens.map((tId) => (
              <Pressable
                key={tId}
                onPress={() => setSelectedOwnTokenId(tId)}
                style={[
                  styles.tokenPill,
                  selectedOwnTokenId === tId && styles.tokenPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.tokenPillText,
                    selectedOwnTokenId === tId && styles.tokenPillTextActive,
                  ]}
                >
                  My {tId}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.targetTitle, { marginTop: 10 }]}>🎯 SWAP WITH OPPONENT TOKEN:</Text>
          <View style={styles.tokenPillRow}>
            {oppTokens.map((tId) => (
              <Pressable
                key={tId}
                onPress={() => setSelectedOpponentTokenId(tId)}
                style={[
                  styles.tokenPill,
                  selectedOpponentTokenId === tId && styles.tokenPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.tokenPillText,
                    selectedOpponentTokenId === tId && styles.tokenPillTextActive,
                  ]}
                >
                  Enemy {tId}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    if (card.targetType === 'OWN_TOKEN') {
      const ownTokens = activeCardEvent.eligibleTargets?.ownTokenIds || [];
      if (ownTokens.length > 1) {
        return (
          <View style={styles.targetSection}>
            <Text style={styles.targetTitle}>⚓ SELECT CREW TOKEN TO RECEIVE EFFECT:</Text>
            <View style={styles.tokenPillRow}>
              {ownTokens.map((tId) => (
                <Pressable
                  key={tId}
                  onPress={() => setSelectedOwnTokenId(tId)}
                  style={[
                    styles.tokenPill,
                    selectedOwnTokenId === tId && styles.tokenPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tokenPillText,
                      selectedOwnTokenId === tId && styles.tokenPillTextActive,
                    ]}
                  >
                    Token {tId}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      }
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.cardContainer,
            {
              width: modalMaxWidth,
              borderColor: card.accentColor,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Top Banner Ribbon */}
          <View style={[styles.cardHeaderRibbon, { backgroundColor: card.accentColor }]}>
            <Text style={styles.headerRibbonBadge}>{card.badgeText}</Text>
            <Text style={styles.headerRibbonType}>
              {isTreasure ? '✨ TREASURE CHEST' : '⚡ SPECIAL EVENT'}
            </Text>
          </View>

          {/* Large Card Art Icon */}
          <Animated.View
            style={[
              styles.artIconContainer,
              {
                borderColor: card.accentColor,
                transform: [{ translateY: chestBounceAnim }, { scale: glowAnim }],
              },
            ]}
          >
            <Text style={styles.artIconEmoji}>{card.icon}</Text>
          </Animated.View>

          {/* Title & Subtitle */}
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={[styles.cardSubtitle, { color: card.accentColor }]}>
            {card.subtitle}
          </Text>

          {/* Pirate anime quote */}
          {card.quote && (
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>{card.quote}</Text>
            </View>
          )}

          {/* Effect Description */}
          <View style={styles.descContainer}>
            <Text style={styles.descText}>{card.description}</Text>
          </View>

          {/* Target Selection View */}
          {renderTargetSelection()}

          {/* Player Trigger Info */}
          <View style={styles.playerTriggerPill}>
            <Text style={styles.playerTriggerText}>
              Triggered by {player?.avatar} {player?.name} ({player?.color})
            </Text>
          </View>

          {/* Action Button */}
          <Pressable
            onPress={handleActivate}
            style={[styles.actionBtn, { backgroundColor: card.accentColor }]}
          >
            <Text style={styles.actionBtnText}>
              {card.requiresTarget ? 'CONFIRM & EXECUTE ⚔️' : 'ACTIVATE REWARD 🌟'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#1E1B18',
    borderRadius: 22,
    borderWidth: 3.5,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 16,
    position: 'relative',
  },
  cardHeaderRibbon: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  headerRibbonBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  headerRibbonType: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  artIconContainer: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#2D2824',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  artIconEmoji: {
    fontSize: 44,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FEFCBF',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quoteBox: {
    backgroundColor: '#141210',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 8,
    width: '100%',
  },
  quoteText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  descContainer: {
    backgroundColor: '#2A241F',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#4A3E36',
  },
  descText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    lineHeight: 18,
    textAlign: 'center',
  },
  targetSection: {
    width: '100%',
    marginVertical: 8,
    backgroundColor: '#181512',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3B322A',
  },
  targetTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FDE047',
    marginBottom: 6,
    textAlign: 'center',
  },
  targetSectionNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#93C5FD',
    textAlign: 'center',
  },
  targetSectionSub: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  targetGroup: {
    marginVertical: 4,
  },
  targetChoiceBtn: {
    backgroundColor: '#2A241F',
    borderWidth: 1.5,
    borderColor: '#524338',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetChoiceBtnActive: {
    backgroundColor: '#451A03',
    borderColor: '#F59E0B',
  },
  targetChoiceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FEFCBF',
  },
  targetChoiceSub: {
    fontSize: 10,
    color: '#A0AEC0',
  },
  tokenPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    justifyContent: 'center',
  },
  tokenPill: {
    backgroundColor: '#322A23',
    borderWidth: 1,
    borderColor: '#604F42',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tokenPillActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEFCBF',
  },
  tokenPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  horizontalScroll: {
    marginTop: 6,
  },
  tokenCard: {
    backgroundColor: '#2A241F',
    borderWidth: 1.5,
    borderColor: '#524338',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginRight: 8,
    minWidth: 70,
  },
  tokenCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#451A03',
  },
  tokenCardId: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEFCBF',
    marginTop: 4,
  },
  playerTriggerPill: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginVertical: 6,
  },
  playerTriggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
