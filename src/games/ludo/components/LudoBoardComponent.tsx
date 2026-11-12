import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { LudoGameState, LudoColor, LudoToken, LudoPlayer } from '../types/ludo.types';
import {
  getAbsoluteTrackPosition,
  SAFE_CELLS,
  START_SQUARES,
  TRACK_GRID_MAP,
  HOME_CORRIDOR_MAP,
  YARD_SLOTS_MAP,
  YARD_HUB_CENTERS,
  CAPTAINS_INFO,
} from '../rules/ludoRules';
import { isTreasureTile, isEventTile, isDirectionTile, DIRECTION_TILES } from '../rules/ludoAdventureRules';
import { AdventureCardModal } from './AdventureCardModal';
import { ComicReactionOverlay } from './ComicReactionOverlay';
import { CardResolveParams } from '../engine/CardEffectResolver';
import { THEME } from '../../../theme/theme';
import { soundService } from '../../../audio/soundService';
import { TREASURE_CARDS, TREASURE_CARD_LIST } from '../data/treasureCards';
import { SPECIAL_EVENT_CARDS, SPECIAL_EVENT_CARD_LIST } from '../data/specialEventCards';
import { AdventureCardDefinition } from '../types/ludoAdventure.types';
import { STRAW_HAT_CREW, getStrawHatMember } from '../data/strawHatCrew';

export { TRACK_GRID_MAP, HOME_CORRIDOR_MAP, YARD_SLOTS_MAP };

interface LudoBoardComponentProps {
  state: LudoGameState;
  localPlayerId: string;
  onRollDice: () => void;
  onMoveToken: (tokenId: string) => void;
  onResolveActiveCard?: (params: CardResolveParams) => void;
  onDismissActiveCard?: () => void;
  hideHeader?: boolean;
  onExit?: () => void;
  onOpenRules?: () => void;
}

export const COLOR_HEX: Record<LudoColor, string> = {
  RED: '#E52521',
  GREEN: '#009E49',
  YELLOW: '#FFB800',
  BLUE: '#0066CC',
};

export const COLOR_DARK_HEX: Record<LudoColor, string> = {
  RED: '#8E1614',
  GREEN: '#005C2B',
  YELLOW: '#B37D00',
  BLUE: '#003D7A',
};

export const COLOR_LIGHT_HEX: Record<LudoColor, string> = {
  RED: '#FFCDD2',
  GREEN: '#C8E6C9',
  YELLOW: '#FFF9C4',
  BLUE: '#BBDEFB',
};

// Comprehensive encyclopedia describing "What this card means" and "How to use this card"
export const CARD_GUIDE_DATA: Record<
  string,
  {
    meaning: string;
    howToUse: string;
    rules: string;
    category: 'TREASURE' | 'SPECIAL_EVENT';
  }
> = {
  TREASURE_SAFE_ESCAPE: {
    meaning:
      'A legendary pirate treasure chart revealing hidden sea caves! When enemy cannons draw near, the map points to a tranquil harbor where no foe can harm your ship.',
    howToUse:
      '1. Tap your token on the track you want to reposition.\n2. The token instantly glides forward along the clockwise route to the nearest Safe Zone (⭐/🛡️).\n3. It will NEVER travel backwards.',
    rules:
      '• Safe Zone Immunity: Enemy tokens cannot capture you on a Safe Zone.\n• If no Safe Zone exists ahead before the home corridor, you draw another card.',
    category: 'TREASURE',
  },
  TREASURE_PIRATE_DASH: {
    meaning:
      'Zoro’s ferocious Three-Sword Style speed burst! The crew slices through turbulent sea waves, accelerating with unstoppable kinetic momentum.',
    howToUse:
      '1. Select any of your active tokens on the track.\n2. The chosen token charges 3 additional tiles forward along the path.\n3. Follows all normal movement, safe zone, and capture rules.',
    rules:
      '• Can capture an enemy token if landing on an unprotected opponent tile!\n• Resolves any special tile landed on.',
    category: 'TREASURE',
  },
  TREASURE_PIRATE_SHIELD: {
    meaning:
      'Chopper’s Iron Skull Shield! A heavy pirate-steel barrier forged to protect comrades from sneak attacks and rival cannon fire.',
    howToUse:
      '1. Select one of your tokens on the track.\n2. A golden defense shield (🛡️) appears over your token.\n3. When an enemy token lands on your tile, the shield absorbs the capture! Your token stays safe and the enemy lands peacefully.',
    rules:
      '• The shield absorbs exactly ONE capture strike.\n• Consumed immediately upon defending.',
    category: 'TREASURE',
  },
  TREASURE_LUCKY_DICE: {
    meaning:
      'Nami’s Lucky Gold Compass Dice! The weather changes favorably in an instant, filling your ship’s sails with a fortunate tailwind.',
    howToUse:
      '1. Automatically awards +1 Bonus Dice Roll.\n2. The dice re-activates immediately for you to roll again.\n3. Move normally according to your new roll.',
    rules:
      '• Does not require selecting a token.\n• Bonus rolls stack if consecutive sixes or lucky effects trigger.',
    category: 'TREASURE',
  },
  EVENT_REVENGE: {
    meaning:
      'Luffy’s Nakama Payback! When rival pirates knock down your crew members, your captain launches an explosive counterattack!',
    howToUse:
      '1. Select an opponent captain who previously captured one of your tokens in this match.\n2. Choose one of their tokens currently sailing on the track.\n3. Send that enemy token straight back to their starting Yard!',
    rules:
      '• Cannot target tokens resting in Safe Zones (⭐) or inside Home Corridors.\n• Valid only if the opponent previously captured your token.',
    category: 'SPECIAL_EVENT',
  },
  EVENT_BODY_SWAP: {
    meaning:
      'Trafalgar Law’s ROOM: Shambles! A mystical spatial sphere warps two crew members across the ocean, instantly trading places.',
    howToUse:
      '1. Select one of your tokens currently on the track.\n2. Select an opponent token on the track.\n3. Both tokens instantly swap their exact coordinates!',
    rules:
      '• Perfect for catapulting your token forward while pushing an aggressive opponent backward.\n• Cannot swap tokens resting in Safe Zones or Home Corridors.',
    category: 'SPECIAL_EVENT',
  },
  EVENT_ESCAPE_ARTIST: {
    meaning:
      'Nami’s Mirage Tempo! A thick coastal fog conceals your ship, allowing a daring retreat straight into the nearest island cove.',
    howToUse:
      '1. Select your token.\n2. Advances directly to the next Safe Zone forward.\n3. Gain absolute immunity against captures while on the safe tile.',
    rules:
      '• Forward direction only; cannot move backward.\n• Guaranteed sanctuary from trailing pursuers.',
    category: 'SPECIAL_EVENT',
  },
  EVENT_WANTED: {
    meaning:
      'Sniper King Usopp’s 100,000,000 Berry Bounty Poster! A high-value rival pirate is marked with a crosshair target across the seas.',
    howToUse:
      '1. Select an opponent token as your bounty target.\n2. A glowing crosshair badge (🎯) marks the target.\n3. If you capture this target on your next eligible turn, you claim the bounty and receive a Bonus Roll!',
    rules:
      '• Expires if the target is not captured on your next turn.\n• Safe zones still protect the target.',
    category: 'SPECIAL_EVENT',
  },
  EVENT_PIRATE_PRANK: {
    meaning:
      'Classic Straw Hat Comedy! Captain Luffy held the treasure map completely upside down, triggering wild laughter across the entire crew!',
    howToUse:
      '1. Enjoy the funny pirate comic reaction!\n2. No tokens are moved or harmed.\n3. Normal play resumes immediately.',
    rules:
      '• Harmless fun event that brings good cheer to all players.',
    category: 'SPECIAL_EVENT',
  },
  EVENT_CREW_CHAOS: {
    meaning:
      'Soul King Brook’s Wild Sea Shanty Concert! Brook rocks an electrifying guitar solo that gets every sailor dancing on deck!',
    howToUse:
      '1. Enjoy the wild musical party animation!\n2. No tokens are damaged or moved.\n3. Game continues smoothly.',
    rules:
      '• Comic relief celebration for the entire fleet.',
    category: 'SPECIAL_EVENT',
  },
  EVENT_CAPTAINS_ORDER: {
    meaning:
      'Trafalgar Law’s Tactical Command! An assertive tactical instruction advances your crew unit into superior board position.',
    howToUse:
      '1. Choose one of your active tokens.\n2. Advances 2 extra tiles forward along the track.\n3. Follows standard path and capture rules.',
    rules:
      '• Captures any unprotected opponent on the destination tile.',
    category: 'SPECIAL_EVENT',
  },
  EVENT_SECOND_CHANCE: {
    meaning:
      'Luffy’s Unshakable Optimism! The sea gives second chances to bold dreamers! Spin the golden wheel and take another shot!',
    howToUse:
      '1. Instantly grants +1 extra dice roll on your current turn.\n2. Roll the dice again and deploy or advance your crew.',
    rules:
      '• Does not grant unlimited rolls; standard one-roll extension.',
    category: 'SPECIAL_EVENT',
  },
};

// 3D Glossy Pawn with Specular Highlights and Pulsing Selection Bounce
interface LudoPawnProps {
  color: LudoColor;
  size: number;
  avatar?: string;
  isSelectable?: boolean;
  hasShield?: boolean;
  hasWanted?: boolean;
  onPress?: () => void;
}

const LudoPawn: React.FC<LudoPawnProps> = ({
  color,
  size,
  avatar,
  isSelectable,
  hasShield,
  hasWanted,
  onPress,
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let bounceLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (isSelectable) {
      bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -6,
            duration: 240,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 240, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 240, useNativeDriver: true }),
        ])
      );
      bounceLoop.start();
      pulseLoop.start();
    } else {
      bounceAnim.setValue(0);
      pulseAnim.setValue(1);
    }

    return () => {
      bounceLoop?.stop();
      pulseLoop?.stop();
    };
  }, [isSelectable]);

  const mainColor = COLOR_HEX[color];
  const darkColor = COLOR_DARK_HEX[color];

  return (
    <Pressable
      disabled={!isSelectable}
      onPress={onPress}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      style={{
        width: size,
        height: size * 1.35,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Floating Shield Badge */}
      {hasShield && (
        <View
          style={{
            position: 'absolute',
            top: -size * 0.38,
            zIndex: 15,
            backgroundColor: '#FEF3C7',
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: '#D97706',
            paddingHorizontal: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: size * 0.42 }}>🛡️</Text>
        </View>
      )}

      {/* Floating Wanted Target Badge */}
      {hasWanted && (
        <View
          style={{
            position: 'absolute',
            top: -size * 0.38,
            zIndex: 15,
            backgroundColor: '#FEE2E2',
            borderRadius: 8,
            borderWidth: 1.5,
            borderColor: '#DC2626',
            paddingHorizontal: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <Text style={{ fontSize: size * 0.42 }}>🎯</Text>
        </View>
      )}

      {/* Ground Drop Shadow */}
      <View
        style={[
          pawnStyles.shadowBase,
          { width: size * 0.85, height: size * 0.28, borderRadius: size * 0.14 },
        ]}
      />

      {/* Pulsing Selection Ring Indicator */}
      {isSelectable && (
        <Animated.View
          style={[
            pawnStyles.selectionRing,
            {
              width: size * 1.1,
              height: size * 1.1,
              borderRadius: size * 0.55,
              borderColor: '#FFF59D',
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      {/* Pawn 3D Body Structure */}
      <Animated.View
        style={[pawnStyles.pawnBody, { transform: [{ translateY: bounceAnim }] }]}
      >
        {/* Dome Sphere Head */}
        <View
          style={[
            pawnStyles.headSphere,
            {
              width: size * 0.58,
              height: size * 0.58,
              borderRadius: size * 0.29,
              backgroundColor: mainColor,
              borderColor: darkColor,
            },
          ]}
        >
          {/* Specular White Shine Reflection */}
          <View style={pawnStyles.headSpecularHighlight} />
          {/* Straw Hat Character Emblem on Head */}
          <Text style={{ fontSize: Math.round(size * 0.34) }}>
            {avatar || '⭐'}
          </Text>
        </View>

        {/* Neck Ring Collar */}
        <View
          style={[
            pawnStyles.neckRing,
            { width: size * 0.38, height: size * 0.1, backgroundColor: darkColor },
          ]}
        />

        {/* Flared Base Skirt */}
        <View
          style={[
            pawnStyles.baseSkirt,
            {
              width: size * 0.78,
              height: size * 0.44,
              borderBottomLeftRadius: size * 0.2,
              borderBottomRightRadius: size * 0.2,
              backgroundColor: mainColor,
              borderColor: darkColor,
            },
          ]}
        >
          <View style={pawnStyles.baseSkirtShine} />
        </View>
      </Animated.View>
    </Pressable>
  );
};

const pawnStyles = StyleSheet.create({
  shadowBase: {
    position: 'absolute',
    bottom: -1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  selectionRing: {
    position: 'absolute',
    bottom: -4,
    borderWidth: 2.5,
    backgroundColor: 'rgba(255, 245, 157, 0.35)',
  },
  pawnBody: {
    alignItems: 'center',
    position: 'relative',
  },
  headSphere: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  headSpecularHighlight: {
    position: 'absolute',
    top: 2,
    left: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  neckRing: {
    borderRadius: 3,
    marginVertical: -2,
    zIndex: 2,
  },
  baseSkirt: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  baseSkirtShine: {
    position: 'absolute',
    bottom: 2,
    width: '80%',
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
});

// Realistic 3D White Dice with Gold Pips & Physics-styled Roll Animation
interface VisualDiceProps {
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  onPress: () => void;
  size?: number;
}

const VisualDice: React.FC<VisualDiceProps> = ({
  value,
  rolling,
  disabled,
  onPress,
  size = 44,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [displayValue, setDisplayValue] = useState<number>(value || 6);

  useEffect(() => {
    if (rolling) {
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);

      // Rapidly flicker random faces during the tumble
      const flickerInterval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 65);

      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 2,
          duration: 480,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.28, duration: 240, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.0, duration: 240, useNativeDriver: true }),
        ]),
      ]).start(() => {
        clearInterval(flickerInterval);
        setDisplayValue(value || 6);
      });

      return () => clearInterval(flickerInterval);
    } else {
      setDisplayValue(value || 6);
    }
  }, [rolling, value]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg'],
  });

  const val = displayValue;

  const renderGoldPips = () => {
    const dots: { r: number; c: number }[] = [];
    if (val === 1) dots.push({ r: 1, c: 1 });
    if (val === 2) dots.push({ r: 0, c: 0 }, { r: 2, c: 2 });
    if (val === 3) dots.push({ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 });
    if (val === 4) dots.push({ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 2 });
    if (val === 5) dots.push({ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }, { r: 2, c: 2 });
    if (val === 6) {
      dots.push({ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 2 });
    }

    const pipGridSize = Math.round(size * 0.65);
    const pipSlotSize = Math.round(pipGridSize / 3.3);
    const pipDotSize = Math.max(5, Math.round(pipSlotSize * 0.75));

    return (
      <View style={[diceStyles.pipGrid, { width: pipGridSize, height: pipGridSize }]}>
        {[0, 1, 2].map((r) => (
          <View key={r} style={diceStyles.pipRow}>
            {[0, 1, 2].map((c) => {
              const hasDot = dots.some((d) => d.r === r && d.c === c);
              return (
                <View key={c} style={[diceStyles.pipSlot, { width: pipSlotSize, height: pipSlotSize }]}>
                  {hasDot && (
                    <View
                      style={[
                        diceStyles.goldPipDot,
                        {
                          width: pipDotSize,
                          height: pipDotSize,
                          borderRadius: pipDotSize / 2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          diceStyles.goldPipInnerShine,
                          {
                            width: Math.max(2, pipDotSize * 0.3),
                            height: Math.max(2, pipDotSize * 0.3),
                            borderRadius: pipDotSize * 0.15,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View
        style={[
          diceStyles.diceCube,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.22),
            transform: [{ rotate: spin }, { scale: scaleAnim }],
          },
          disabled && diceStyles.diceDisabled,
        ]}
      >
        <View style={diceStyles.diceTopSpecular} />
        {renderGoldPips()}
      </Animated.View>
    </Pressable>
  );
};

const diceStyles = StyleSheet.create({
  diceCube: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E0',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
    position: 'relative',
  },
  diceDisabled: {
    opacity: 0.75,
  },
  diceTopSpecular: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  pipGrid: {
    justifyContent: 'space-between',
  },
  pipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pipSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldPipDot: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#0F172A',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 0.5,
  },
  goldPipInnerShine: {
    backgroundColor: '#475569',
  },
});

export const LudoBoardComponent: React.FC<LudoBoardComponentProps> = ({
  state,
  localPlayerId,
  onRollDice,
  onMoveToken,
  onResolveActiveCard,
  onDismissActiveCard,
  hideHeader = false,
  onExit,
  onOpenRules,
}) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;

  const [rolling, setRolling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showCardGuideModal, setShowCardGuideModal] = useState(false);
  const [selectedGuideCard, setSelectedGuideCard] = useState<AdventureCardDefinition>(
    TREASURE_CARDS.TREASURE_SAFE_ESCAPE
  );

  // 3-5s Card Announcement Banner state
  const [activeAnnouncement, setActiveAnnouncement] = useState<{
    card: AdventureCardDefinition;
    player: LudoPlayer;
    title: string;
    description: string;
  } | null>(null);
  const announcementProgressAnim = useRef(new Animated.Value(1)).current;
  const lastAnnouncedCardKey = useRef<string | null>(null);

  // Persistent small card displayed in top section for all players to read anytime
  const [topPersistentCard, setTopPersistentCard] = useState<{
    card: AdventureCardDefinition;
    player: LudoPlayer;
  } | null>({
    card: TREASURE_CARDS.TREASURE_SAFE_ESCAPE,
    player: state.players[0] || {
      id: 'player_local_1',
      name: 'Pirate Captain',
      color: 'RED',
      isBot: false,
      avatar: '🏴‍☠️',
      tokens: [],
      finishedTokensCount: 0,
    },
  });

  const [gameEvents, setGameEvents] = useState<{ id: string; icon: string; text: string; timeAgo: string }[]>([
    { id: 'ev_0', icon: '🎲', text: 'Pirate Ludo Arena match started!', timeAgo: 'just now' },
  ]);

  const [comicReaction, setComicReaction] = useState<{
    visible: boolean;
    type: 'PRANK' | 'CHAOS' | 'SHIELD_BLOCK' | 'BOUNTY_CLAIM';
    title: string;
    message: string;
  } | null>(null);

  // Listen to activeCardEvent to trigger 3-5s Card Display for all players + persistent top card
  useEffect(() => {
    if (state.activeCardEvent && state.activeCardEvent.card) {
      const card = state.activeCardEvent.card;
      const player =
        state.players.find((p) => p.id === state.activeCardEvent?.playerId) ||
        state.players[state.currentTurnIdx];

      if (lastAnnouncedCardKey.current !== card.id) {
        lastAnnouncedCardKey.current = card.id;
        setSelectedGuideCard(card);
        setTopPersistentCard({ card, player });

        // Trigger 4.0-second announcement modal/banner with countdown progress bar
        setActiveAnnouncement({
          card,
          player,
          title: card.title,
          description: card.description,
        });

        announcementProgressAnim.setValue(1);
        Animated.timing(announcementProgressAnim, {
          toValue: 0,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          setActiveAnnouncement(null);
        });
      }
    }
  }, [state.activeCardEvent]);

  // Audio and commentary tracking
  useEffect(() => {
    if (state.lastActionMessage) {
      const msg = state.lastActionMessage;
      let icon = 'ℹ️';
      if (msg.includes('rolled') || msg.includes('Rolled')) icon = '🎲';
      else if (msg.includes('captured') || msg.includes('CAPTURED')) {
        icon = '⚔️';
        if (soundEnabled) soundService.playCapture();
      } else if (msg.includes('entered') || msg.includes('deployed') || msg.includes('Yard')) {
        icon = '➡️';
      } else if (msg.includes('HOME') || msg.includes('home')) {
        icon = '🏠';
        if (soundEnabled) soundService.playBingoSuccess();
      } else if (msg.includes('Card') || msg.includes('CARD') || msg.includes('Treasure') || msg.includes('Event')) {
        icon = '⭐';
        if (soundEnabled) soundService.playCardDraw();
      } else if (msg.includes('won') || msg.includes('CHAMPION')) {
        icon = '🏆';
        if (soundEnabled) soundService.playBingoSuccess();
      }

      setGameEvents((prev) => [
        {
          id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          icon,
          text: msg,
          timeAgo: 'just now',
        },
        ...prev.slice(0, 14),
      ]);

      if (msg.includes('PIRATE PRANK')) {
        setComicReaction({
          visible: true,
          type: 'PRANK',
          title: 'PIRATE PRANK! 🤣',
          message: 'The crew is howling with laughter at the upside-down map!',
        });
      } else if (msg.includes('CREW CHAOS')) {
        setComicReaction({
          visible: true,
          type: 'CHAOS',
          title: 'CREW CHAOS! 🐒💥',
          message: 'The ship monkey stole the compass and ran across deck!',
        });
      } else if (msg.includes('Shield absorbed')) {
        setComicReaction({
          visible: true,
          type: 'SHIELD_BLOCK',
          title: 'PIRATE SHIELD! 🛡️',
          message: 'The Iron Skull Shield absorbed the enemy cannon strike!',
        });
      } else if (msg.includes('WANTED PIRATE') || msg.includes('Bounty Claimed')) {
        setComicReaction({
          visible: true,
          type: 'BOUNTY_CLAIM',
          title: 'BOUNTY CLAIMED! 💰',
          message: '100,000,000 Berry Bounty secured! Bonus Roll Awarded!',
        });
      }
    }
  }, [state.lastActionMessage]);

  const [animatedTokensPos, setAnimatedTokensPos] = useState<Record<string, number>>({});
  const isAnimatingRef = useRef(false);

  const [countdown, setCountdown] = useState<number>(3);
  const autoRollTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const [tokenCountdown, setTokenCountdown] = useState<number>(3);
  const autoMoveTimeoutRef = useRef<any>(null);
  const tokenCountdownIntervalRef = useRef<any>(null);

  const rollPulseAnim = useRef(new Animated.Value(1)).current;

  const activePlayer = state.players[state.currentTurnIdx];
  const isCurrentPlayerHuman = activePlayer ? !activePlayer.isBot : false;
  const canInteract = state.status === 'PLAYING' && isCurrentPlayerHuman;
  const canRoll = canInteract && !rolling && !state.mustSelectToken && !isAnimatingRef.current;

  // Pulse animation for the Roll button when active
  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (canRoll) {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rollPulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rollPulseAnim, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      rollPulseAnim.setValue(1);
    }
    return () => animLoop?.stop();
  }, [canRoll]);

  const lastSeenRollNonceRef = useRef<number>(state.rollNonce || 0);
  const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger dice rolling rotation animation and sound for all rolls (bots and human)
  useEffect(() => {
    const currentNonce = state.rollNonce || 0;
    if (currentNonce === 0 || currentNonce === lastSeenRollNonceRef.current) return;
    lastSeenRollNonceRef.current = currentNonce;

    setRolling(true);
    if (soundEnabled) soundService.playDiceRoll();

    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
    }
    rollTimeoutRef.current = setTimeout(() => {
      setRolling(false);
      rollTimeoutRef.current = null;
    }, 500);
  }, [state.rollNonce, soundEnabled]);

  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) {
        clearTimeout(rollTimeoutRef.current);
        rollTimeoutRef.current = null;
      }
    };
  }, []);

  // 3-second auto-roll countdown timer for human turn
  useEffect(() => {
    if (autoRollTimeoutRef.current) clearTimeout(autoRollTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (canRoll) {
      setCountdown(3);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      autoRollTimeoutRef.current = setTimeout(() => {
        handleRoll();
      }, 3000);
    } else {
      setCountdown(3);
    }

    return () => {
      if (autoRollTimeoutRef.current) clearTimeout(autoRollTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [state.currentTurnIdx, state.mustSelectToken, canRoll]);

  // Deterministic legal token chooser
  const pickBestTokenToMove = (
    tokens: LudoToken[],
    rollVal: number,
    st: LudoGameState,
    playerCol: LudoColor
  ): LudoToken | null => {
    const selectable = tokens.filter((t) => {
      if (t.position === 0) return rollVal === 6;
      if (t.position + rollVal > 58) return false;
      return true;
    });
    if (selectable.length === 0) return null;

    // 1. Capture priority
    for (const t of selectable) {
      const destPos = t.position === 0 ? 1 : t.position + rollVal;
      const absPos = getAbsoluteTrackPosition(playerCol, destPos);
      if (absPos && !SAFE_CELLS.has(absPos)) {
        const canCapture = st.players.some(
          (otherP) =>
            otherP.color !== playerCol &&
            otherP.tokens.some((ot) => {
              const otAbs = getAbsoluteTrackPosition(otherP.color, ot.position);
              return otAbs === absPos && !st.activeShields?.includes(ot.id);
            })
        );
        if (canCapture) return t;
      }
    }

    // 2. Reach Home priority
    const homeToken = selectable.find((t) => t.position + rollVal === 58);
    if (homeToken) return homeToken;

    // 3. Yard exit priority on roll 6
    if (rollVal === 6) {
      const yardToken = selectable.find((t) => t.position === 0);
      if (yardToken) return yardToken;
    }

    // 4. Furthest token on track
    const sorted = [...selectable].sort((a, b) => b.position - a.position);
    return sorted[0];
  };

  // 3-second auto-token-select countdown timer for human turn
  useEffect(() => {
    if (autoMoveTimeoutRef.current) clearTimeout(autoMoveTimeoutRef.current);
    if (tokenCountdownIntervalRef.current) clearInterval(tokenCountdownIntervalRef.current);

    if (canInteract && state.mustSelectToken && !isAnimatingRef.current) {
      setTokenCountdown(3);
      tokenCountdownIntervalRef.current = setInterval(() => {
        setTokenCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);

      autoMoveTimeoutRef.current = setTimeout(() => {
        if (activePlayer && state.lastDiceRoll) {
          const best = pickBestTokenToMove(
            activePlayer.tokens,
            state.lastDiceRoll,
            state,
            activePlayer.color
          );
          if (best) {
            handleTokenTap(best.id);
          }
        }
      }, 3000);
    } else {
      setTokenCountdown(3);
    }

    return () => {
      if (autoMoveTimeoutRef.current) clearTimeout(autoMoveTimeoutRef.current);
      if (tokenCountdownIntervalRef.current) clearInterval(tokenCountdownIntervalRef.current);
    };
  }, [state.currentTurnIdx, state.mustSelectToken, canInteract]);

  const animWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnimWatchdog = () => {
    if (animWatchdogRef.current) {
      clearTimeout(animWatchdogRef.current);
      animWatchdogRef.current = null;
    }
  };

  const startAnimWatchdog = () => {
    clearAnimWatchdog();
    animWatchdogRef.current = setTimeout(() => {
      isAnimatingRef.current = false;
    }, 2200);
  };

  // Step-by-step token movement animation along track
  useEffect(() => {
    state.players.forEach((p) => {
      p.tokens.forEach((t) => {
        const currPos = animatedTokensPos[t.id] ?? t.position;
        const targetPos = t.position;

        if (currPos !== targetPos && !isAnimatingRef.current) {
          isAnimatingRef.current = true;
          startAnimWatchdog();
          animateLudoToken(t.id, currPos, targetPos);
        }
      });
    });
  }, [state.players]);

  const animateLudoToken = (tokenId: string, startPos: number, targetPos: number) => {
    // Case 1: Captured token returning to Yard
    if (targetPos === 0 && startPos > 0) {
      if (soundEnabled) soundService.playTokenMove();
      setTimeout(() => {
        setAnimatedTokensPos((prev) => ({ ...prev, [tokenId]: 0 }));
        isAnimatingRef.current = false;
        clearAnimWatchdog();
      }, 350);
      return;
    }

    // Case 2: Yard to start entry on 6
    if (startPos === 0 && targetPos === 1) {
      if (soundEnabled) soundService.playTokenMove();
      setTimeout(() => {
        setAnimatedTokensPos((prev) => ({ ...prev, [tokenId]: 1 }));
        isAnimatingRef.current = false;
        clearAnimWatchdog();
      }, 250);
      return;
    }

    // Case 3: Step-by-step sequential movement at 280ms per step (within 250-350ms)
    let curr = startPos;
    const interval = setInterval(() => {
      if (curr < targetPos) {
        curr += 1;
        setAnimatedTokensPos((prev) => ({ ...prev, [tokenId]: curr }));
        if (soundEnabled) soundService.playTokenMove();
      } else {
        clearInterval(interval);
        isAnimatingRef.current = false;
        clearAnimWatchdog();
      }
    }, 280);
  };

  const handleRoll = () => {
    if (!canInteract || rolling || state.mustSelectToken || isAnimatingRef.current) return;
    if (autoRollTimeoutRef.current) clearTimeout(autoRollTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    onRollDice();
  };

  const handleTokenTap = (tokenId: string) => {
    if (!canInteract || !state.mustSelectToken || isAnimatingRef.current) return;
    if (autoMoveTimeoutRef.current) clearTimeout(autoMoveTimeoutRef.current);
    if (tokenCountdownIntervalRef.current) clearInterval(tokenCountdownIntervalRef.current);
    if (soundEnabled) soundService.playTokenMove();
    onMoveToken(tokenId);
  };

  // Responsive board dimensions
  const topHeaderHeight = hideHeader ? 0 : 48;
  const statusBarPadding =
    Platform.OS === 'android'
      ? isLandscape
        ? 0
        : Math.max(28, StatusBar.currentHeight || 28)
      : 0;

  // Portrait layout budget (with top card banner + bottom player panel)
  const availPortraitH = winHeight - (topHeaderHeight + statusBarPadding) - 235;
  const availPortraitW = winWidth - 14;
  const maxPortraitDim = Math.min(availPortraitW, availPortraitH);
  const portraitCellSize = Math.max(18, Math.min(25, Math.floor(maxPortraitDim / 15)));

  // Landscape layout budget
  const availLandscapeW = winWidth - 334;
  const availLandscapeH = winHeight - topHeaderHeight - 110;
  const maxLandscapeDim = Math.min(availLandscapeW, availLandscapeH);
  const landscapeCellSize = Math.max(15, Math.min(22, Math.floor(maxLandscapeDim / 15)));

  const cellSize = isLandscape ? landscapeCellSize : portraitCellSize;
  const boardDim = cellSize * 15;

  // Deriving ordered players: selected human player is ALWAYS orderedPlayers[0] (Bottom panel)
  const humanIdx = state.players.findIndex((p) => p.id === localPlayerId);
  const safeHumanIdx = humanIdx >= 0 ? humanIdx : 0;
  const orderedPlayers: LudoPlayer[] = [
    state.players[safeHumanIdx],
    state.players[(safeHumanIdx + 1) % 4],
    state.players[(safeHumanIdx + 2) % 4],
    state.players[(safeHumanIdx + 3) % 4],
  ].filter(Boolean);

  const getTokenCoords = (
    color: LudoColor,
    token: LudoToken,
    tokenIdx: number
  ): { r: number; c: number } => {
    const pos = animatedTokensPos[token.id] ?? token.position;
    if (pos === 0) {
      return YARD_SLOTS_MAP[color][tokenIdx % 4];
    }
    if (pos === 58) {
      return { r: 7, c: 7 };
    }
    if (pos >= 52) {
      return HOME_CORRIDOR_MAP[color][pos] || { r: 7, c: 7 };
    }
    const absPos = getAbsoluteTrackPosition(color, pos);
    if (absPos && TRACK_GRID_MAP[absPos]) {
      return TRACK_GRID_MAP[absPos];
    }
    return { r: 7, c: 7 };
  };

  const roll = state.lastDiceRoll;

  const getIsTokenSelectable = (token: LudoToken): boolean => {
    if (!canInteract || !state.mustSelectToken || !roll || isAnimatingRef.current) return false;
    if (activePlayer?.color !== token.playerColor) return false;
    if (token.position === 0) return roll === 6;
    if (token.position + roll > 58) return false;
    return true;
  };

  // Group tokens for multiple-pawn visual offset
  const allTokensWithCoords: {
    token: LudoToken;
    color: LudoColor;
    player: LudoPlayer;
    coords: { r: number; c: number };
    isSelectable: boolean;
  }[] = [];

  state.players.forEach((p) => {
    p.tokens.forEach((t, tIdx) => {
      const coords = getTokenCoords(p.color, t, tIdx);
      allTokensWithCoords.push({
        token: t,
        color: p.color,
        player: p,
        coords,
        isSelectable: getIsTokenSelectable(t),
      });
    });
  });

  const cellOccupancy: Record<string, number> = {};
  const tokenOffsetMap: Record<string, { ox: number; oy: number }> = {};

  allTokensWithCoords.forEach((item) => {
    if (item.token.position === 0) {
      tokenOffsetMap[item.token.id] = { ox: 0, oy: 0 };
      return;
    }

    const key = `${Math.round(item.coords.r)}_${Math.round(item.coords.c)}`;
    const count = cellOccupancy[key] || 0;
    cellOccupancy[key] = count + 1;

    const delta = cellSize * 0.16;
    if (count === 1) {
      tokenOffsetMap[item.token.id] = { ox: delta, oy: delta };
    } else if (count === 2) {
      tokenOffsetMap[item.token.id] = { ox: -delta, oy: delta };
    } else if (count === 3) {
      tokenOffsetMap[item.token.id] = { ox: delta, oy: -delta };
    } else {
      tokenOffsetMap[item.token.id] = { ox: -delta * 0.5, oy: -delta * 0.5 };
    }
  });

  const getActionBannerText = (): string => {
    if (state.status === 'FINISHED') {
      const win = state.players.find((p) => p.id === state.winnerId);
      return `🏆 ${win?.name || 'Winner'} won Ludo Arena!`;
    }
    if (isAnimatingRef.current) return '⏳ Moving token...';
    if (
      state.lastActionMessage &&
      !state.mustSelectToken &&
      (state.lastActionMessage.includes('captured') ||
        state.lastActionMessage.includes('CAPTURED') ||
        state.lastActionMessage.includes('entered') ||
        state.lastActionMessage.includes('HOME'))
    ) {
      return state.lastActionMessage;
    }
    if (!isCurrentPlayerHuman) return `🤖 ${activePlayer?.name}'s turn (Thinking...)`;
    if (state.mustSelectToken) return `👉 Rolled ${roll}! Tap a highlighted token to move.`;
    return `🎲 Your turn, ${activePlayer?.name}! Roll the dice.`;
  };

  const renderPlayerCard = (
    p: LudoPlayer,
    isBottomPlayer: boolean,
    isOpponentStrip: boolean = false
  ) => {
    const isTurn = activePlayer?.id === p.id;
    const pColor = COLOR_HEX[p.color];
    const displayName = p.name;

    return (
      <View
        key={p.id}
        style={[
          isOpponentStrip
            ? styles.opponentCardStrip
            : isBottomPlayer
            ? styles.bottomPlayerCardSelected
            : styles.standardPlayerCard,
          { borderColor: isTurn ? '#F59E0B' : pColor },
          isTurn && styles.cardActiveTurnGlow,
        ]}
      >
        {isTurn && (
          <View style={styles.turnIndicatorArrow}>
            <Text style={{ fontSize: isOpponentStrip ? 8 : 10, color: '#F59E0B', fontWeight: '900' }}>
              ▼
            </Text>
          </View>
        )}

        <View
          style={[
            isOpponentStrip ? styles.avatarCircleSmall : styles.avatarCircleMain,
            { borderColor: pColor },
            isTurn && styles.avatarCircleTurnActive,
          ]}
        >
          <Text style={{ fontSize: isOpponentStrip ? 13 : isBottomPlayer ? 18 : 14 }}>
            {p.avatar || '👤'}
          </Text>
        </View>

        <View style={{ flex: 1, marginLeft: isOpponentStrip ? 4 : 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={[
                isOpponentStrip ? styles.playerNameStripText : styles.playerNameMainText,
                isTurn && { color: '#FDE047' },
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {isBottomPlayer && !isOpponentStrip && (
              <View style={styles.mineBadgePill}>
                <Text style={styles.mineBadgeText}>YOU</Text>
              </View>
            )}
          </View>
          <View style={styles.playerCardStatsRow}>
            <Text style={isOpponentStrip ? styles.playerHomeCountStrip : styles.playerHomeCountMain}>
              🏠 {p.finishedTokensCount}/4
            </Text>
            <View style={styles.tokenPipsRow}>
              {p.tokens.map((tok, tIdx) => {
                const isYard = tok.position === 0;
                const isHome = tok.position === 58;
                return (
                  <View
                    key={tok.id || tIdx}
                    style={[
                      isOpponentStrip ? styles.tokenPipDotSmall : styles.tokenPipDotMain,
                      {
                        backgroundColor: isHome
                          ? '#F59E0B'
                          : isYard
                          ? 'rgba(255,255,255,0.2)'
                          : pColor,
                        borderColor: isHome ? '#FFFFFF' : pColor,
                      },
                    ]}
                  >
                    {isHome && (
                      <Text style={{ fontSize: isOpponentStrip ? 5 : 6, color: '#FFF' }}>⭐</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Renders the Authentic Anime Adventure Ludo Board Artwork (from anime_board.jpg)
  // Perfectly mapped to the 15x15 mathematical grid: 800x800 at left: 112, top: 16
  const renderLudoBoardGrid = (bDim: number, cSize: number) => {
    const scale = bDim / 800;

    return (
      <View style={[styles.boardWoodFrame, { width: bDim + 10, height: bDim + 10 }]}>
        <View style={[styles.boardContainer, { width: bDim, height: bDim }]}>
          {/* Authentic Anime Adventure Ludo Board Artwork Background */}
          <Image
            source={require('../../../../assets/games/ludo/anime_board.jpg')}
            style={{
              position: 'absolute',
              width: bDim,
              height: bDim,
              left: 0,
              top: 0,
            }}
            resizeMode="stretch"
          />

          {/* Dynamic Straw Hat Captain Crests for each of the 4 Yard Pedestals */}
          {state.players.map((p) => {
            const hub = YARD_HUB_CENTERS[p.color];
            if (!hub) return null;
            const hubSize = cSize * 2.3;
            const hLeft = hub.c * cSize - hubSize / 2;
            const hTop = hub.r * cSize - hubSize / 2;
            const pColor = COLOR_HEX[p.color];
            const isTurn = state.players[state.currentTurnIdx]?.id === p.id;
            const strawMember = p.characterId
              ? getStrawHatMember(p.characterId)
              : STRAW_HAT_CREW.find((m) => m.avatar === p.avatar);
            const shortName = strawMember?.shortName || p.name.replace(/\s*\(.*\)/, '').trim();

            return (
              <View
                key={`yard_captain_crest_${p.id}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: hLeft,
                  top: hTop,
                  width: hubSize,
                  height: hubSize,
                  borderRadius: hubSize / 2,
                  backgroundColor: 'rgba(18, 11, 7, 0.95)',
                  borderWidth: isTurn ? 2.5 : 2,
                  borderColor: isTurn ? '#F59E0B' : pColor,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: pColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.7,
                  shadowRadius: 4,
                  elevation: 6,
                  zIndex: 12,
                }}
              >
                <Text style={{ fontSize: Math.round(cSize * 0.82) }}>
                  {p.avatar || '🏴‍☠️'}
                </Text>
                <View
                  style={{
                    marginTop: 1,
                    backgroundColor: pColor + '40',
                    paddingHorizontal: 4,
                    paddingVertical: 0.5,
                    borderRadius: 3,
                    borderWidth: 0.5,
                    borderColor: pColor + '80',
                  }}
                >
                  <Text
                    style={{
                      fontSize: Math.max(7, Math.round(cSize * 0.28)),
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      letterSpacing: 0.3,
                    }}
                    numberOfLines={1}
                  >
                    {shortName}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* 52 Shared Outer Track Cells with Transparent Touch Overlays */}
          {Object.entries(TRACK_GRID_MAP).map(([absStr, pos]) => {
            const abs = parseInt(absStr, 10);
            return (
              <View
                key={`track-${abs}`}
                style={[
                  styles.trackCell,
                  {
                    left: pos.c * cSize,
                    top: pos.r * cSize,
                    width: cSize,
                    height: cSize,
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                  },
                ]}
              />
            );
          })}

          {/* Empty Yard Dock Sockets when tokens leave the yard */}
          {state.players.map((p) => {
            return p.tokens.map((tok, tIdx) => {
              const animatedPos = animatedTokensPos[tok.id] ?? tok.position;
              if (animatedPos === 0) return null; // Token pawn is in yard
              const slot = YARD_SLOTS_MAP[p.color]?.[tIdx % 4];
              if (!slot) return null;
              const dockSize = cSize * 1.0;
              const dLeft = slot.c * cSize - dockSize / 2;
              const dTop = slot.r * cSize - dockSize / 2;

              return (
                <View
                  key={`empty_dock_${p.color}_${tIdx}`}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: dLeft,
                    top: dTop,
                    width: dockSize,
                    height: dockSize,
                    borderRadius: dockSize / 2,
                    backgroundColor: '#1C120C',
                    borderColor: '#3D2415',
                    borderWidth: 1.5,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.6,
                    shadowRadius: 2,
                    elevation: 3,
                    zIndex: 15,
                  }}
                >
                  <View
                    style={{
                      width: dockSize * 0.55,
                      height: dockSize * 0.55,
                      borderRadius: (dockSize * 0.55) / 2,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      borderWidth: 1,
                      borderColor: COLOR_HEX[p.color] + '50',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 3.5,
                        height: 3.5,
                        borderRadius: 2,
                        backgroundColor: COLOR_HEX[p.color] + '70',
                      }}
                    />
                  </View>
                </View>
              );
            });
          })}

          {/* Pawns Overlay with Precise Centering on Each Tile & Dock */}
          {allTokensWithCoords.map(({ token, color, player, coords, isSelectable }) => {
            const offset = tokenOffsetMap[token.id] || { ox: 0, oy: 0 };
            const isYard = token.position === 0;
            const pawnSize = cSize * 0.82;
            const pawnHeight = pawnSize * 1.35;

            // In yard: coords is the exact socket center (coords.c, coords.r) in grid units
            // On track/home: coords is a 1x1 tile index (0..14), tile center is at (coords + 0.5)
            const targetX = isYard ? coords.c * cSize : (coords.c + 0.5) * cSize;
            const targetY = isYard ? coords.r * cSize : (coords.r + 0.5) * cSize;

            const pLeft = targetX - pawnSize / 2 + offset.ox;
            const pTop = targetY - pawnHeight / 2 + offset.oy;

            return (
              <View
                key={token.id}
                style={{
                  position: 'absolute',
                  left: pLeft,
                  top: pTop,
                  zIndex: isSelectable ? 35 : 20,
                }}
              >
                <LudoPawn
                  color={color}
                  size={pawnSize}
                  avatar={player.avatar}
                  isSelectable={isSelectable}
                  hasShield={state.activeShields?.includes(token.id)}
                  hasWanted={state.wantedTargets?.some((w) => w.targetTokenId === token.id)}
                  onPress={() => handleTokenTap(token.id)}
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.woodTableContainer}>
      {/* Top Header Bar */}
      {!hideHeader && (
        <View
          style={[
            styles.topHeaderBar,
            { paddingTop: statusBarPadding, height: 46 + statusBarPadding },
            !isLandscape && { width: boardDim + 10, maxWidth: boardDim + 10 },
          ]}
        >
          <Pressable
            onPress={onExit || (() => {})}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            style={styles.woodExitButton}
          >
            <Text style={styles.woodExitButtonText}>← EXIT</Text>
          </Pressable>

          <View style={styles.carvedSignPlaque}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🎲</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.carvedSignTitle}>LUDO ARENA</Text>
              <View style={styles.carvedSignSubPill}>
                <Text style={styles.carvedSignSubText}>15 × 15 CLASSIC</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, marginLeft: 4 }}>🎲</Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable
              onPress={() => setMusicEnabled(!musicEnabled)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.headerIconBtn}
            >
              <Text style={styles.headerIconText}>{musicEnabled ? '🎵' : '🔇'}</Text>
            </Pressable>

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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.woodRulesButton}
              >
                <Text style={{ fontSize: 13, marginBottom: -1 }}>📜</Text>
                <Text style={styles.woodRulesButtonText}>Rules</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Persistent Small Card Banner in Top Section for All Players */}
      {topPersistentCard && (
        <Pressable
          onPress={() => {
            setSelectedGuideCard(topPersistentCard.card);
            setShowCardGuideModal(true);
          }}
          style={[
            styles.persistentTopCardPill,
            !isLandscape && { width: boardDim + 10, maxWidth: boardDim + 10 },
          ]}
        >
          <View style={styles.topCardPillLeft}>
            <View style={styles.topCardPillIconSquare}>
              <Text style={{ fontSize: 16 }}>{topPersistentCard.card.icon}</Text>
            </View>
            <View style={{ marginLeft: 6, flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.topCardPillBadge}>
                  {topPersistentCard.card.cardType === 'TREASURE' ? '🎁 TREASURE' : '⚡ EVENT'}
                </Text>
                <Text style={styles.topCardPillPlayerText} numberOfLines={1}>
                  • {topPersistentCard.player?.name}
                </Text>
              </View>
              <Text style={styles.topCardPillTitle} numberOfLines={1}>
                {topPersistentCard.card.title}
              </Text>
            </View>
          </View>

          <View style={styles.topCardPillAction}>
            <Text style={styles.topCardPillActionText}>📖 Meaning & Rules</Text>
          </View>
        </Pressable>
      )}

      {/* Main Table Layout */}
      {!isLandscape ? (
        /* Portrait Layout */
        <View style={styles.portraitMainContainer}>
          {/* 4 Players Strip above the board matching reference design */}
          <View style={[styles.opponentsStrip, { width: boardDim + 10 }]}>
            {orderedPlayers.map((p, idx) => renderPlayerCard(p, idx === 0, true))}
          </View>

          {/* Centered Board */}
          {renderLudoBoardGrid(boardDim, cellSize)}

          {/* Selected Player Bottom Card (Directly below board) */}
          <View style={[styles.selectedPlayerBottomRow, { width: boardDim + 10 }]}>
            {renderPlayerCard(orderedPlayers[0], true, false)}
          </View>

          {/* Bottom Control Bar */}
          <View style={[styles.bottomControlBarPortrait, { width: boardDim + 10 }]}>
            <VisualDice
              value={state.lastDiceRoll}
              rolling={rolling}
              disabled={!canRoll}
              onPress={handleRoll}
              size={46}
            />

            <View style={styles.rollActionColumn}>
              <Pressable
                disabled={!canRoll}
                onPress={handleRoll}
                style={[styles.redRollButton, !canRoll && styles.redRollButtonDisabled]}
              >
                <View style={styles.redRollButtonSheen} />
                <Text style={styles.redRollButtonText}>
                  {rolling ? '...' : isAnimatingRef.current ? '...' : 'ROLL'}
                </Text>
              </Pressable>

              {canRoll ? (
                <View style={styles.timerBarWrapper}>
                  <Text style={styles.autoTimerText}>Auto roll in {countdown}s...</Text>
                  <View style={styles.timerTrack}>
                    <View style={[styles.timerFill, { width: `${(countdown / 3) * 100}%` }]} />
                  </View>
                </View>
              ) : state.mustSelectToken && canInteract ? (
                <View style={styles.timerBarWrapper}>
                  <Text style={styles.autoTimerText}>Auto move in {tokenCountdown}s...</Text>
                  <View style={styles.timerTrack}>
                    <View
                      style={[
                        styles.timerFill,
                        { width: `${(tokenCountdown / 3) * 100}%`, backgroundColor: '#F59E0B' },
                      ]}
                    />
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.bottomControlRightBtns}>
              <Pressable
                onPress={() => {
                  if (topPersistentCard) setSelectedGuideCard(topPersistentCard.card);
                  setShowCardGuideModal(true);
                }}
                style={styles.myCardsBadgeBtn}
              >
                <View style={styles.cardIconStack}>
                  <Text style={{ fontSize: 16 }}>🎴</Text>
                  <View style={styles.cardsCountBadge}>
                    <Text style={styles.cardsCountBadgeText}>
                      {state.activeCardEvent ? 1 : 0}
                    </Text>
                  </View>
                </View>
                <View style={{ marginLeft: 5 }}>
                  <Text style={styles.myCardsLabel}>My Cards (0)</Text>
                  <View style={styles.myCardsViewPill}>
                    <Text style={styles.myCardsViewPillText}>View</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable onPress={() => setShowEventsModal(true)} style={styles.eventsBadgeBtn}>
                <Text style={styles.eventsBadgeText}>📜 Log</Text>
              </Pressable>
            </View>
          </View>

          {/* Action Commentary Line */}
          <View style={[styles.commentaryContainerWood, { width: boardDim + 10 }]}>
            <Text style={styles.commentaryText} numberOfLines={1}>
              {getActionBannerText()}
            </Text>
          </View>
        </View>
      ) : (
        /* Landscape Layout */
        <View style={styles.landscapeMainContainer}>
          {/* Left Panel: Active Card */}
          <View style={styles.landscapeLeftPanel}>
            <View style={styles.parchmentCardBox}>
              <View style={styles.cardThumbnailPill}>
                <Text style={{ fontSize: 24 }}>
                  {topPersistentCard?.card.cardType === 'SPECIAL_EVENT' ? '⚡' : '🎁'}
                </Text>
                <Text style={styles.cardThumbnailBadge}>
                  {topPersistentCard ? '🎴' : '+1'}
                </Text>
              </View>
              <Text style={styles.parchmentCardTitle} numberOfLines={1}>
                {topPersistentCard?.card.title || 'Adventure Cards'}
              </Text>
              <Text style={styles.parchmentCardDesc} numberOfLines={2}>
                {topPersistentCard?.card.description ||
                  'Land on 🎁 or ⚡ tiles to trigger pirate powers!'}
              </Text>
              <Pressable
                onPress={() => {
                  if (topPersistentCard) setSelectedGuideCard(topPersistentCard.card);
                  setShowCardGuideModal(true);
                }}
                style={styles.viewDetailsBlueBtn}
              >
                <Text style={styles.viewDetailsBlueBtnText}>📖 Meaning & Rules</Text>
              </Pressable>
            </View>
          </View>

          {/* Center Column: Board + 4 Players Row + Controls */}
          <View style={styles.landscapeCenterCol}>
            {renderLudoBoardGrid(boardDim, cellSize)}

            <View style={[styles.landscapePlayersRow, { width: boardDim + 10 }]}>
              {orderedPlayers.map((p, idx) => renderPlayerCard(p, idx === 0, false))}
            </View>

            <View style={[styles.landscapeControlsRow, { width: boardDim + 10 }]}>
              <VisualDice
                value={state.lastDiceRoll}
                rolling={rolling}
                disabled={!canRoll}
                onPress={handleRoll}
                size={38}
              />
              <View style={styles.rollActionColumn}>
                <Pressable
                  disabled={!canRoll}
                  onPress={handleRoll}
                  style={[styles.redRollButtonSmall, !canRoll && styles.redRollButtonDisabled]}
                >
                  <View style={styles.redRollButtonSheen} />
                  <Text style={styles.redRollButtonTextSmall}>
                    {rolling ? '...' : isAnimatingRef.current ? '...' : 'ROLL'}
                  </Text>
                </Pressable>
                {canRoll && (
                  <View style={styles.timerBarWrapper}>
                    <Text style={styles.autoTimerText}>Auto roll in {countdown}s...</Text>
                    <View style={styles.timerTrack}>
                      <View style={[styles.timerFill, { width: `${(countdown / 3) * 100}%` }]} />
                    </View>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => {
                  if (topPersistentCard) setSelectedGuideCard(topPersistentCard.card);
                  setShowCardGuideModal(true);
                }}
                style={styles.myCardsBadgeBtnSmall}
              >
                <Text style={styles.myCardsLabel}>My Cards</Text>
                <View style={styles.myCardsViewPill}>
                  <Text style={styles.myCardsViewPillText}>View</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Right Panel: Game Events */}
          <View style={styles.landscapeRightPanel}>
            <View style={styles.gameEventsBox}>
              <Text style={styles.gameEventsTitle}>Game Events</Text>
              <ScrollView style={styles.gameEventsScrollView} showsVerticalScrollIndicator={false}>
                {gameEvents.map((ev) => (
                  <View key={ev.id} style={styles.eventRowItem}>
                    <View style={styles.eventIconCircle}>
                      <Text style={{ fontSize: 11 }}>{ev.icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 6 }}>
                      <Text style={styles.eventRowText} numberOfLines={2}>
                        {ev.text}
                      </Text>
                      <Text style={styles.eventRowTime}>{ev.timeAgo}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      {/* 3-5s Card Display Announcement Banner for All Players */}
      {activeAnnouncement && (
        <View style={styles.announcementOverlayContainer} pointerEvents="box-none">
          <View style={styles.announcementCardBox}>
            <View style={styles.announcementHeaderRow}>
              <View style={styles.announcementBadgePill}>
                <Text style={styles.announcementBadgeText}>
                  {activeAnnouncement.card.cardType === 'TREASURE'
                    ? '🎁 TREASURE CARD'
                    : '⚡ SPECIAL EVENT CARD'}
                </Text>
              </View>
              <Pressable
                onPress={() => setActiveAnnouncement(null)}
                style={styles.announcementCloseBtn}
              >
                <Text style={styles.announcementCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.announcementBodyRow}>
              <View style={styles.announcementIconBox}>
                <Text style={{ fontSize: 28 }}>{activeAnnouncement.card.icon}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.announcementPlayerNotice}>
                  {activeAnnouncement.player.avatar} {activeAnnouncement.player.name} drew:
                </Text>
                <Text style={styles.announcementCardTitle}>{activeAnnouncement.title}</Text>
                <Text style={styles.announcementCardDesc} numberOfLines={2}>
                  {activeAnnouncement.description}
                </Text>
              </View>
            </View>

            {/* Countdown timer track */}
            <View style={styles.announcementTimerTrack}>
              <Animated.View
                style={[
                  styles.announcementTimerFill,
                  {
                    width: announcementProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>

            <View style={styles.announcementFooterRow}>
              <Text style={styles.announcementTimerNotice}>Auto-dismissing in 4s...</Text>
              <Pressable
                onPress={() => {
                  setSelectedGuideCard(activeAnnouncement.card);
                  setActiveAnnouncement(null);
                  setShowCardGuideModal(true);
                }}
                style={styles.announcementViewRulesBtn}
              >
                <Text style={styles.announcementViewRulesBtnText}>📖 Meaning & Rules</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Comprehensive "What it means & How to use" Card Guide Modal */}
      <Modal
        visible={showCardGuideModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCardGuideModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.cardGuideModalContainer}>
            <View style={styles.eventsModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: 6 }}>📖</Text>
                <Text style={styles.gameEventsTitle}>Card Meaning & Usage Guide</Text>
              </View>
              <Pressable
                onPress={() => setShowCardGuideModal(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Quick Card Switcher Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cardGuideDeckPicker}
            >
              {[...TREASURE_CARD_LIST, ...SPECIAL_EVENT_CARD_LIST].map((c) => {
                const isSelected = selectedGuideCard.id === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedGuideCard(c)}
                    style={[
                      styles.cardGuideTabPill,
                      isSelected && styles.cardGuideTabPillActive,
                      { borderColor: c.accentColor || '#D97706' },
                    ]}
                  >
                    <Text style={{ fontSize: 13, marginRight: 4 }}>{c.icon}</Text>
                    <Text
                      style={[
                        styles.cardGuideTabPillText,
                        isSelected && { color: '#FDE047', fontWeight: 'bold' },
                      ]}
                    >
                      {c.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={true}>
              {selectedGuideCard && (
                <View style={styles.cardGuideDetailBox}>
                  {/* Card Header Card */}
                  <View
                    style={[
                      styles.cardGuideBanner,
                      { borderColor: selectedGuideCard.accentColor || '#D97706' },
                    ]}
                  >
                    <View style={styles.cardGuideBannerIcon}>
                      <Text style={{ fontSize: 32 }}>{selectedGuideCard.icon}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[
                          styles.cardGuideBadge,
                          { color: selectedGuideCard.accentColor || '#F59E0B' },
                        ]}
                      >
                        {selectedGuideCard.badgeText} •{' '}
                        {selectedGuideCard.cardType === 'TREASURE'
                          ? '🎁 TREASURE'
                          : '⚡ SPECIAL EVENT'}
                      </Text>
                      <Text style={styles.cardGuideTitle}>{selectedGuideCard.title}</Text>
                      <Text style={styles.cardGuideSubtitle}>{selectedGuideCard.subtitle}</Text>
                    </View>
                  </View>

                  {/* Section 1: What this card means */}
                  <View style={styles.guideSectionCard}>
                    <View style={styles.guideSectionHeaderRow}>
                      <Text style={{ fontSize: 16, marginRight: 6 }}>📜</Text>
                      <Text style={styles.guideSectionHeading}>WHAT THIS CARD MEANS</Text>
                    </View>
                    <Text style={styles.guideSectionBodyText}>
                      {CARD_GUIDE_DATA[selectedGuideCard.id]?.meaning ||
                        selectedGuideCard.description}
                    </Text>
                    {selectedGuideCard.quote && (
                      <View style={styles.guideQuoteBox}>
                        <Text style={styles.guideQuoteText}>{selectedGuideCard.quote}</Text>
                      </View>
                    )}
                  </View>

                  {/* Section 2: How to use this card */}
                  <View style={styles.guideSectionCard}>
                    <View style={styles.guideSectionHeaderRow}>
                      <Text style={{ fontSize: 16, marginRight: 6 }}>⚔️</Text>
                      <Text style={styles.guideSectionHeading}>HOW TO USE THIS CARD</Text>
                    </View>
                    <Text style={styles.guideSectionBodyText}>
                      {CARD_GUIDE_DATA[selectedGuideCard.id]?.howToUse ||
                        selectedGuideCard.description}
                    </Text>
                  </View>

                  {/* Section 3: Safe Zone & Rules Protection */}
                  <View style={styles.guideSectionCard}>
                    <View style={styles.guideSectionHeaderRow}>
                      <Text style={{ fontSize: 16, marginRight: 6 }}>🛡️</Text>
                      <Text style={styles.guideSectionHeading}>RULES & PROTECTIONS</Text>
                    </View>
                    <Text style={styles.guideSectionBodyText}>
                      {CARD_GUIDE_DATA[selectedGuideCard.id]?.rules ||
                        '• Safe Zones (⭐) and Home Corridors cannot be breached by special cards.\n• Tokens in Home can never be captured or displaced.'}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <Pressable
              onPress={() => setShowCardGuideModal(false)}
              style={styles.cardGuideCloseFullBtn}
            >
              <Text style={styles.cardGuideCloseFullBtnText}>GOT IT / RESUME MATCH ⚔️</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Game Events Modal (in Portrait) */}
      <Modal
        visible={showEventsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEventsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.eventsModalContainer}>
            <View style={styles.eventsModalHeader}>
              <Text style={styles.gameEventsTitle}>📜 Game Events Log</Text>
              <Pressable onPress={() => setShowEventsModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={true}>
              {gameEvents.map((ev) => (
                <View key={ev.id} style={styles.eventRowItem}>
                  <View style={styles.eventIconCircle}>
                    <Text style={{ fontSize: 13 }}>{ev.icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.eventRowText}>{ev.text}</Text>
                    <Text style={styles.eventRowTime}>{ev.timeAgo}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Adventure Card Target Resolution Modal */}
      {state.activeCardEvent && !state.activeCardEvent.resolved && (
        <AdventureCardModal
          visible={state.activeCardEvent !== null}
          activeCardEvent={state.activeCardEvent}
          gameState={state}
          onResolve={onResolveActiveCard || (() => {})}
          onDismiss={onDismissActiveCard || (() => {})}
        />
      )}

      {comicReaction && (
        <ComicReactionOverlay
          visible={comicReaction.visible}
          type={comicReaction.type}
          title={comicReaction.title}
          message={comicReaction.message}
          onFinish={() => setComicReaction(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  woodTableContainer: {
    flex: 1,
    backgroundColor: '#0D1912',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 4,
    height: 46,
    width: '100%',
  },
  woodExitButton: {
    minWidth: 48,
    minHeight: 44,
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  woodExitButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FEF3C7',
    letterSpacing: 0.5,
  },
  carvedSignPlaque: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A2814',
    borderColor: '#6F3E22',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    elevation: 4,
  },
  carvedSignTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FEF3C7',
    letterSpacing: 1,
  },
  carvedSignSubPill: {
    backgroundColor: '#D97706',
    borderRadius: 6,
    paddingHorizontal: 5,
    marginTop: 1,
  },
  carvedSignSubText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1C1917',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    elevation: 3,
  },
  headerIconText: {
    fontSize: 14,
  },
  woodRulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    elevation: 3,
  },
  woodRulesButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FEF3C7',
    marginLeft: 3,
  },

  // Persistent small card in top section
  persistentTopCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#241409',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    elevation: 4,
  },
  topCardPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topCardPillIconSquare: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#4A2814',
    borderWidth: 1,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCardPillBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
  },
  topCardPillPlayerText: {
    fontSize: 9,
    color: '#CBD5E1',
    marginLeft: 4,
  },
  topCardPillTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FEF3C7',
  },
  topCardPillAction: {
    backgroundColor: '#D97706',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  topCardPillActionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1C1917',
  },

  // Portrait Layout
  portraitMainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  opponentsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  opponentCardStrip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1107',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginHorizontal: 2,
    position: 'relative',
    elevation: 3,
  },
  selectedPlayerBottomRow: {
    marginTop: 4,
    marginBottom: 2,
  },
  bottomPlayerCardSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#271509',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: 'relative',
    elevation: 5,
  },
  standardPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1107',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    elevation: 3,
  },
  cardActiveTurnGlow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    borderColor: '#F59E0B',
  },
  turnIndicatorArrow: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    zIndex: 10,
  },
  avatarCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: '#2A180E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleMain: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    backgroundColor: '#2A180E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleTurnActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#3E2413',
  },
  playerNameStripText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  playerNameMainText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FEF3C7',
  },
  mineBadgePill: {
    backgroundColor: '#E52521',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginLeft: 6,
  },
  mineBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  playerCardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  playerHomeCountStrip: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  playerHomeCountMain: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: 'bold',
  },
  tokenPipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenPipDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenPipDotMain: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    marginHorizontal: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Board Frame & Canvas
  boardWoodFrame: {
    backgroundColor: '#381D0D',
    borderColor: '#603318',
    borderWidth: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  boardContainer: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 6,
    overflow: 'hidden',
  },
  trackCell: {
    position: 'absolute',
  },

  // Bottom Control Bar
  bottomControlBarPortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#221208',
    borderColor: '#542D13',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 4,
    elevation: 4,
  },
  rollActionColumn: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  redRollButton: {
    width: '100%',
    height: 38,
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
  },
  redRollButtonDisabled: {
    backgroundColor: '#4B5563',
    borderColor: '#6B7280',
    opacity: 0.6,
  },
  redRollButtonSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  redRollButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  timerBarWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 3,
  },
  autoTimerText: {
    fontSize: 9,
    color: '#CBD5E1',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timerTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  bottomControlRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myCardsBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#351B0A',
    borderColor: '#6F3C18',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 4,
  },
  cardIconStack: {
    position: 'relative',
  },
  cardsCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsCountBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#FFF',
  },
  myCardsLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FEF3C7',
  },
  myCardsViewPill: {
    backgroundColor: '#D97706',
    borderRadius: 4,
    paddingHorizontal: 4,
    marginTop: 1,
    alignItems: 'center',
  },
  myCardsViewPillText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1C1917',
  },
  eventsBadgeBtn: {
    backgroundColor: '#351B0A',
    borderColor: '#6F3C18',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  eventsBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FEF3C7',
  },
  commentaryContainerWood: {
    marginTop: 4,
    backgroundColor: '#1A0E06',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#43230E',
    alignItems: 'center',
  },
  commentaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FDE047',
  },

  // 3-5s Card Announcement Banner
  announcementOverlayContainer: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    zIndex: 999,
    alignItems: 'center',
  },
  announcementCardBox: {
    width: '100%',
    backgroundColor: '#271509',
    borderColor: '#F59E0B',
    borderWidth: 2,
    borderRadius: 14,
    padding: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  announcementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  announcementBadgePill: {
    backgroundColor: '#D97706',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  announcementBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1C1917',
  },
  announcementCloseBtn: {
    padding: 4,
  },
  announcementCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  announcementBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  announcementIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#4A2814',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementPlayerNotice: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: 'bold',
  },
  announcementCardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FEF3C7',
  },
  announcementCardDesc: {
    fontSize: 11,
    color: '#E2E8F0',
    marginTop: 2,
  },
  announcementTimerTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  announcementTimerFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  announcementFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementTimerNotice: {
    fontSize: 9,
    color: '#94A3B8',
  },
  announcementViewRulesBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  announcementViewRulesBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Card Guide Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  cardGuideModalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1E1107',
    borderColor: '#8C4D1D',
    borderWidth: 2,
    borderRadius: 16,
    padding: 12,
    elevation: 10,
  },
  eventsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  gameEventsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FEF3C7',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#CBD5E1',
  },
  cardGuideDeckPicker: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  cardGuideTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#351C0C',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  cardGuideTabPillActive: {
    backgroundColor: '#5A3115',
  },
  cardGuideTabPillText: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  cardGuideDetailBox: {
    paddingVertical: 4,
  },
  cardGuideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A170A',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  cardGuideBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#3D220E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGuideBadge: {
    fontSize: 10,
    fontWeight: '900',
  },
  cardGuideTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FEF3C7',
    marginTop: 1,
  },
  cardGuideSubtitle: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  guideSectionCard: {
    backgroundColor: '#251409',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4D2912',
    padding: 8,
    marginBottom: 6,
  },
  guideSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guideSectionHeading: {
    fontSize: 11,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  guideSectionBodyText: {
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  guideQuoteBox: {
    marginTop: 6,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  guideQuoteText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#FEF3C7',
  },
  cardGuideCloseFullBtn: {
    marginTop: 8,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  cardGuideCloseFullBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Events Log Modal
  eventsModalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E1107',
    borderColor: '#784323',
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
  },
  eventRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  eventIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#351B0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventRowText: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  eventRowTime: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },

  // Landscape Styles
  landscapeMainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  landscapeLeftPanel: {
    width: 145,
    marginRight: 8,
  },
  parchmentCardBox: {
    backgroundColor: '#271509',
    borderColor: '#784323',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  cardThumbnailPill: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  cardThumbnailBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
    fontSize: 10,
  },
  parchmentCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FEF3C7',
    textAlign: 'center',
  },
  parchmentCardDesc: {
    fontSize: 9,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  viewDetailsBlueBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewDetailsBlueBtnText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  landscapeCenterCol: {
    alignItems: 'center',
  },
  landscapePlayersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  landscapeControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#221208',
    borderColor: '#542D13',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: 4,
  },
  redRollButtonSmall: {
    height: 32,
    backgroundColor: '#DC2626',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  redRollButtonTextSmall: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  myCardsBadgeBtnSmall: {
    backgroundColor: '#351B0A',
    borderColor: '#6F3C18',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
  },
  landscapeRightPanel: {
    width: 145,
    marginLeft: 8,
  },
  gameEventsBox: {
    backgroundColor: '#1E1107',
    borderColor: '#784323',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 8,
    height: 240,
  },
  gameEventsScrollView: {
    flex: 1,
    marginTop: 4,
  },
});
