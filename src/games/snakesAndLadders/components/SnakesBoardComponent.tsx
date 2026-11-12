import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
  ScrollView,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { SnakesGameState, SnakesPlayer } from '../types/snakes.types';
import {
  LADDERS,
  SNAKES,
  getSquareGridCoords,
  getSquarePixelCenter,
  getLadderTransform,
  getSnakeGeometry,
  getSnakeCurvePoints,
} from '../rules/snakesRules';
import { THEME } from '../../../theme/theme';
import { soundService } from '../../../audio/soundService';

interface SnakesBoardComponentProps {
  state: SnakesGameState;
  localPlayerId: string;
  onRollDice: () => void;
  hideHeader?: boolean;
  onExit?: () => void;
  onOpenRules?: () => void;
}

const PLAYER_COLORS: string[] = [
  '#DC2626', // Red
  '#2563EB', // Blue
  '#16A34A', // Green
  '#D97706', // Gold
  '#9333EA', // Purple
  '#EA580C', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
];
const PLAYER_DARK_COLORS: string[] = [
  '#991B1B',
  '#1D4ED8',
  '#15803D',
  '#B45309',
  '#7E22CE',
  '#C2410C',
  '#0E7490',
  '#BE185D',
];
const PLAYER_LIGHT_COLORS: string[] = [
  '#FCA5A5',
  '#93C5FD',
  '#86EFAC',
  '#FDE047',
  '#D8B4FE',
  '#FDBA74',
  '#67E8F9',
  '#F472B6',
];

// 3D Pawn with Specular Light and Gold Star Crown
const Pawn3D: React.FC<{
  colorIdx: number;
  avatar?: string;
  size: number;
  isTurn?: boolean;
}> = ({ colorIdx, size, isTurn }) => {
  const mainColor = PLAYER_COLORS[colorIdx % PLAYER_COLORS.length];
  const darkColor = PLAYER_DARK_COLORS[colorIdx % PLAYER_DARK_COLORS.length];
  const lightColor = PLAYER_LIGHT_COLORS[colorIdx % PLAYER_LIGHT_COLORS.length];
  const isSmall = size < 13;

  return (
    <View style={{ width: size, height: size * 1.3, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Base drop shadow */}
      <View
        style={[
          pawnStyles.shadowBase,
          {
            width: size * 0.9,
            height: size * 0.28,
            borderRadius: size * 0.14,
          },
        ]}
      />

      {/* Pawn structure */}
      <View style={pawnStyles.pawnBody}>
        {/* Head Sphere */}
        <View
          style={[
            pawnStyles.headSphere,
            {
              width: size * 0.58,
              height: size * 0.58,
              borderRadius: size * 0.29,
              backgroundColor: mainColor,
              borderColor: darkColor,
              borderWidth: isSmall ? 1 : 1.5,
            },
          ]}
        >
          {/* Top specular highlight reflection */}
          <View style={[pawnStyles.specularLight, { backgroundColor: lightColor }]} />
          {/* Gold Star Crown for larger pawns */}
          {!isSmall && (
            <Text style={[pawnStyles.crownStar, { fontSize: Math.max(6, size * 0.28) }]}>★</Text>
          )}
        </View>

        {/* Neck collar ring */}
        <View
          style={[
            pawnStyles.neckRing,
            {
              width: size * 0.4,
              height: isSmall ? 2 : size * 0.1,
              backgroundColor: darkColor,
              borderColor: lightColor,
            },
          ]}
        />

        {/* Skirt base */}
        <View
          style={[
            pawnStyles.baseSkirt,
            {
              width: size * 0.8,
              height: size * 0.42,
              borderBottomLeftRadius: size * 0.2,
              borderBottomRightRadius: size * 0.2,
              backgroundColor: mainColor,
              borderColor: darkColor,
              borderWidth: isSmall ? 1 : 1.5,
            },
          ]}
        >
          <View style={[pawnStyles.baseRing, { backgroundColor: lightColor, height: isSmall ? 1.5 : 2 }]} />
        </View>
      </View>
    </View>
  );
};

const pawnStyles = StyleSheet.create({
  shadowBase: {
    position: 'absolute',
    bottom: -1.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pawnBody: {
    alignItems: 'center',
  },
  headSphere: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    position: 'relative',
  },
  specularLight: {
    position: 'absolute',
    top: 1.5,
    left: 2,
    width: '35%',
    height: '35%',
    borderRadius: 4,
    opacity: 0.85,
  },
  crownStar: {
    color: '#FEFCBF',
    fontWeight: '900',
    marginTop: -1,
  },
  neckRing: {
    borderWidth: 0.5,
    borderRadius: 2,
    marginVertical: -1,
    zIndex: 2,
  },
  baseSkirt: {
    borderTopWidth: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    elevation: 3,
  },
  baseRing: {
    width: '80%',
    borderRadius: 1,
    marginBottom: 1.5,
    opacity: 0.7,
  },
});

// Realistic 3D Ivory Dice with Gold Pips
const VisualDice: React.FC<{
  value: number | null;
  rolling: boolean;
  disabled: boolean;
  onPress: () => void;
  size?: number;
}> = ({ value, rolling, disabled, onPress, size = 48 }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (rolling) {
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.22,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [rolling]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const val = value || 6;

  const renderBlackPips = () => {
    const dots: { r: number; c: number }[] = [];
    if (val === 1) dots.push({ r: 1, c: 1 });
    if (val === 2) dots.push({ r: 0, c: 0 }, { r: 2, c: 2 });
    if (val === 3) dots.push({ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 2 });
    if (val === 4) dots.push({ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 2 });
    if (val === 5) dots.push({ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }, { r: 2, c: 2 });
    if (val === 6)
      dots.push(
        { r: 0, c: 0 },
        { r: 0, c: 2 },
        { r: 1, c: 0 },
        { r: 1, c: 2 },
        { r: 2, c: 0 },
        { r: 2, c: 2 }
      );

    const pipGridSize = Math.round(size * 0.65);
    const pipSlotSize = Math.round(pipGridSize / 3.3);
    const pipDotSize = Math.max(6, Math.round(pipSlotSize * 0.75));

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
                        diceStyles.blackPipDot,
                        {
                          width: pipDotSize,
                          height: pipDotSize,
                          borderRadius: pipDotSize / 2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          diceStyles.blackPipInnerShine,
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
    <Pressable disabled={disabled} onPress={onPress}>
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
        {renderBlackPips()}
      </Animated.View>
    </Pressable>
  );
};

const diceStyles = StyleSheet.create({
  diceCube: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D1D5DB',
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
    opacity: 0.85,
    borderColor: '#94A3B8',
  },
  diceTopSpecular: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
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
  blackPipDot: {
    backgroundColor: '#0F172A',
    borderWidth: 0.5,
    borderColor: '#020617',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 0.5,
  },
  blackPipInnerShine: {
    backgroundColor: '#334155',
  },
});

// Exotic Snake Color Themes with Rich Scales & Facial Features (Matching Image 2)
const SNAKE_PALETTES = [
  { skin: '#15803D', belly: '#FEF08A', border: '#14532D', head: '#166534', eye: '#FFFFFF', spots: '#FEF08A' }, // Emerald Viper (17->7)
  { skin: '#EA580C', belly: '#FED7AA', border: '#7C2D12', head: '#C2410C', eye: '#FFFFFF', spots: '#FEF08A' }, // Copperhead (54->34)
  { skin: '#7C3AED', belly: '#EDE9FE', border: '#5B21B6', head: '#6D28D9', eye: '#FFFFFF', spots: '#DDD6FE' }, // Amethyst Boa (62->19)
  { skin: '#DC2626', belly: '#FEE2E2', border: '#991B1B', head: '#B91C1C', eye: '#FFFFFF', spots: '#FEF08A' }, // Coral Snake (64->60)
  { skin: '#2563EB', belly: '#DBEAFE', border: '#1E40AF', head: '#1D4ED8', eye: '#FFFFFF', spots: '#93C5FD' }, // Cobalt Python (87->24)
  { skin: '#15803D', belly: '#FEF08A', border: '#14532D', head: '#166534', eye: '#FFFFFF', spots: '#FEF08A' }, // Green Viper (93->73)
  { skin: '#0D9488', belly: '#CCFBF1', border: '#115E59', head: '#0F766E', eye: '#FFFFFF', spots: '#99F6E4' }, // Jade River Snake (95->75)
  { skin: '#DC2626', belly: '#FEF08A', border: '#991B1B', head: '#B91C1C', eye: '#FFFFFF', spots: '#FEF08A' }, // Crimson Rattler (99->78)
];

export const SnakesBoardComponent: React.FC<SnakesBoardComponentProps> = ({
  state,
  localPlayerId,
  onRollDice,
  hideHeader = false,
  onExit,
  onOpenRules,
}) => {
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth > winHeight;

  const [rolling, setRolling] = useState(false);
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, number>>({});
  const [autoRollCountdown, setAutoRollCountdown] = useState<number | null>(null);
  const [isRosterOpen, setIsRosterOpen] = useState(false);
  const isAnimatingRef = useRef(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTurnPlayer = state.players[state.currentTurnIdx];
  // Pass-and-play enabled: Any human player whose turn it is can roll
  const isCurrentHumanTurn =
    state.status === 'PLAYING' && currentTurnPlayer && !currentTurnPlayer.isBot;

  // Sync / Animate token movement safely
  useEffect(() => {
    state.players.forEach((p) => {
      const currentPos = animatedPositions[p.id];
      const targetPos = p.position;

      if (currentPos === undefined) {
        // Initial setup sync
        setAnimatedPositions((prev) => ({ ...prev, [p.id]: targetPos }));
      } else if (currentPos !== targetPos && !isAnimatingRef.current) {
        isAnimatingRef.current = true;
        animateStepMovement(p.id, currentPos, targetPos);
      }
    });
  }, [state.players]);

  // Five-second auto-roll countdown for active human player turns
  useEffect(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (isCurrentHumanTurn && !rolling && !isAnimatingRef.current) {
      setAutoRollCountdown(5);
      let count = 5;

      countdownTimerRef.current = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setAutoRollCountdown(count);
        } else {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setAutoRollCountdown(null);
          handleRoll();
        }
      }, 1000);
    } else {
      setAutoRollCountdown(null);
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [state.currentTurnIdx, state.status, isCurrentHumanTurn, rolling]);

  const [eventBanner, setEventBanner] = useState<string | null>(null);

  const animateStepMovement = (playerId: string, startSq: number, targetSq: number) => {
    let curr = startSq;

    // Check if movement involves a ladder climb or snake slide
    let intermediateSq = targetSq;
    const ladderEntry = Object.entries(LADDERS).find(
      ([from, to]) => parseInt(from, 10) >= startSq && to === targetSq
    );
    const snakeEntry = Object.entries(SNAKES).find(
      ([from, to]) => parseInt(from, 10) >= startSq && to === targetSq
    );

    if (ladderEntry) intermediateSq = parseInt(ladderEntry[0], 10);
    if (snakeEntry) intermediateSq = parseInt(snakeEntry[0], 10);

    // Slower sequential movement at 200ms per square (within 180-250ms range)
    const stepInterval = setInterval(() => {
      if (curr < intermediateSq) {
        curr += 1;
        setAnimatedPositions((prev) => ({ ...prev, [playerId]: curr }));
        soundService.playTokenMove();
      } else {
        clearInterval(stepInterval);

        const movingPlayer = state.players.find((p) => p.id === playerId);
        const pName = movingPlayer?.name || 'Player';

        if (ladderEntry && curr !== targetSq) {
          // Pause at ladder base, show feedback banner, then climb up
          setEventBanner(`🪜 ${pName} climbed a ladder! (${ladderEntry[0]} ➔ ${targetSq})`);
          setTimeout(() => {
            soundService.playLadderClimb();
            setAnimatedPositions((prev) => ({ ...prev, [playerId]: targetSq }));
            isAnimatingRef.current = false;
            setTimeout(() => setEventBanner(null), 3000);
          }, 450);
        } else if (snakeEntry && curr !== targetSq) {
          // Pause at snake head, show feedback banner, then slide down
          setEventBanner(`🐍 ${pName} slid down a snake! (${snakeEntry[0]} ➔ ${targetSq})`);
          setTimeout(() => {
            soundService.playSnakeSlide();
            setAnimatedPositions((prev) => ({ ...prev, [playerId]: targetSq }));
            isAnimatingRef.current = false;
            setTimeout(() => setEventBanner(null), 3000);
          }, 450);
        } else {
          setAnimatedPositions((prev) => ({ ...prev, [playerId]: targetSq }));
          isAnimatingRef.current = false;
        }
      }
    }, 200);
  };

  const handleRoll = () => {
    if (!isCurrentHumanTurn || rolling || isAnimatingRef.current) return;
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoRollCountdown(null);
    setRolling(true);
    soundService.playDiceRoll();
    setTimeout(() => {
      setRolling(false);
      onRollDice();
    }, 380);
  };

  // Accurate Responsive Board Budgeting
  // Parent GameScreenHeader takes ~52dp.
  // In portrait:
  // - Top bar allowance: 52dp
  // Responsive layout dimensions (Optimized for Image 2 Wood & Jungle UI)
  // In portrait:
  // - Top wooden header allowance: 52dp
  // - Bottom wooden deck allowance: 116dp (wood deck: ~82dp, status text: ~24dp, gaps: ~10dp)
  // - Safe margins: 16dp
  // In landscape:
  // - Top wooden header allowance: 48dp
  // - Bottom safe margin: 16dp
  // - Side HUD panel width: 170dp + margins: 20dp = 190dp
  const sidePanelWidth = isLandscape ? 170 : 0;
  const topBarAllowance = hideHeader ? 8 : (isLandscape ? 48 : 52);
  const bottomAllowance = isLandscape ? 16 : 120;
  const horizontalPadding = isLandscape ? 20 : 10;
  const verticalPadding = 8;

  const maxAvailWidth = winWidth - sidePanelWidth - horizontalPadding;
  const maxAvailHeight = winHeight - topBarAllowance - bottomAllowance - verticalPadding;

  const maxBoardDim = Math.min(maxAvailWidth, maxAvailHeight);
  // Integer cell size ensures all 100 squares fit without overflow
  const cellSize = isLandscape
    ? Math.floor(Math.max(24, Math.min(38, maxBoardDim / 10)))
    : Math.floor(Math.max(28, Math.min(46, (winWidth - horizontalPadding) / 10)));
  const boardDim = cellSize * 10;

  // Render High-Fidelity Wooden Ladders using Exact Midpoint Transforms
  const renderLaddersOverlay = () => {
    const ladderThickness = Math.min(16, Math.max(11, cellSize * 0.38));

    return Object.entries(LADDERS).map(([fromStr, toNum]) => {
      const fromNum = parseInt(fromStr, 10);
      const transform = getLadderTransform(fromNum, toNum, cellSize, ladderThickness);
      const rungsCount = Math.max(3, Math.floor(transform.length / 15));

      return (
        <React.Fragment key={`ladder-${fromNum}-${toNum}`}>
          {/* Ladder Drop Shadow */}
          <View
            style={{
              position: 'absolute',
              left: transform.left + 2,
              top: transform.top + 2.5,
              width: transform.length,
              height: ladderThickness,
              transform: [{ rotate: `${transform.angleDeg}deg` }],
              backgroundColor: 'rgba(0,0,0,0.28)',
              borderRadius: 3,
              zIndex: 3,
              pointerEvents: 'none',
            }}
          />

          {/* 3D Wooden Ladder Frame */}
          <View
            style={{
              position: 'absolute',
              left: transform.left,
              top: transform.top,
              width: transform.length,
              height: ladderThickness,
              transform: [{ rotate: `${transform.angleDeg}deg` }],
              justifyContent: 'space-between',
              paddingVertical: 1,
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            {/* Top Mahogany Rail */}
            <View style={[boardStyles.ladderRail3D, { height: Math.max(2.5, ladderThickness * 0.18) }]}>
              <View style={boardStyles.ladderRailSheen} />
            </View>

            {/* Cylindrical Wooden Rungs */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                alignItems: 'center',
              }}
            >
              {Array.from({ length: rungsCount }).map((_, rIdx) => (
                <View
                  key={rIdx}
                  style={[
                    boardStyles.ladderRung3D,
                    {
                      width: Math.max(2.5, ladderThickness * 0.2),
                      height: ladderThickness,
                    },
                  ]}
                >
                  <View style={boardStyles.ladderRungSheen} />
                </View>
              ))}
            </View>

            {/* Bottom Mahogany Rail */}
            <View style={[boardStyles.ladderRail3D, { height: Math.max(2.5, ladderThickness * 0.18) }]}>
              <View style={boardStyles.ladderRailSheen} />
            </View>

            {/* Metallic End Fasteners (Lower Bracket) */}
            <View style={[boardStyles.ladderMetalCap, { left: 0 }]} />
            {/* Metallic End Fasteners (Upper Bracket) */}
            <View style={[boardStyles.ladderMetalCap, { right: 0 }]} />
          </View>
        </React.Fragment>
      );
    });
  };

  // Render Smooth Continuous Exotic Snakes with Exact Geometry & Scaled Artwork
  const renderSnakesOverlay = () => {
    return Object.entries(SNAKES).map(([fromStr, toNum], idx) => {
      const headSq = parseInt(fromStr, 10);
      const tailSq = toNum;
      const geom = getSnakeGeometry(headSq, tailSq, cellSize);
      const palette = SNAKE_PALETTES[idx % SNAKE_PALETTES.length];

      // Proportional dimensions scaled to board cell size
      const headRadius = Math.max(7, Math.min(10, cellSize * 0.24));
      const headDiameter = headRadius * 2;
      const tailRadius = Math.max(2.5, cellSize * 0.08);

      // Generate continuous body segments using zero-boundary envelope
      const segmentCount = Math.max(35, Math.min(80, Math.round(geom.length / 3)));
      const curvePoints = getSnakeCurvePoints(headSq, tailSq, cellSize, segmentCount);

      const bodyDisks = curvePoints.map((pt, i) => {
        return (
          <React.Fragment key={`snake-seg-${headSq}-${i}`}>
            {/* Scale Shadow */}
            <View
              style={{
                position: 'absolute',
                left: pt.x - pt.radius + 1,
                top: pt.y - pt.radius + 1.5,
                width: pt.radius * 2,
                height: pt.radius * 2,
                borderRadius: pt.radius,
                backgroundColor: 'rgba(0,0,0,0.22)',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />
            {/* Scale Body Disk - Smooth continuous serpent body without internal border segmentation */}
            <View
              style={{
                position: 'absolute',
                left: pt.x - pt.radius,
                top: pt.y - pt.radius,
                width: pt.radius * 2,
                height: pt.radius * 2,
                borderRadius: pt.radius,
                backgroundColor: palette.skin,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            >
              {i % 3 === 0 && pt.radius > 3.2 && (
                <View
                  style={{
                    width: pt.radius * 0.7,
                    height: pt.radius * 0.7,
                    borderRadius: pt.radius * 0.35,
                    backgroundColor: palette.spots,
                    opacity: 0.85,
                  }}
                />
              )}
            </View>
          </React.Fragment>
        );
      });

      // Tail Tip Artwork (anchored directly on tail destination square center)
      const tailTip = (
        <View
          key={`snake-tail-${headSq}-${tailSq}`}
          style={{
            position: 'absolute',
            left: geom.tailPos.x - tailRadius - 0.5,
            top: geom.tailPos.y - tailRadius - 0.5,
            width: (tailRadius + 0.5) * 2,
            height: (tailRadius + 0.5) * 2,
            borderRadius: tailRadius + 0.5,
            backgroundColor: palette.head,
            borderWidth: 1,
            borderColor: palette.border,
            zIndex: 7,
            pointerEvents: 'none',
          }}
        />
      );

      // Head Artwork:
      // Rotated along (angleDeg - 90) so it faces OUTWARD into the square, alert and facing players
      const headAngle = geom.angleDeg - 90;
      const tongueStemH = Math.max(2.5, headRadius * 0.35);
      const tongueForkH = Math.max(2, headRadius * 0.3);
      const eyeSize = Math.max(3.5, headRadius * 0.45);

      return (
        <React.Fragment key={`snake-${headSq}-${tailSq}`}>
          {bodyDisks}
          {tailTip}

          {/* Proportional 3D Snake Head anchored on square center */}
          <View
            style={{
              position: 'absolute',
              left: geom.headPos.x - headRadius,
              top: geom.headPos.y - headRadius,
              width: headDiameter,
              height: headDiameter,
              borderRadius: headRadius,
              backgroundColor: palette.head,
              borderWidth: 1.5,
              borderColor: palette.border,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: `${headAngle}deg` }],
              zIndex: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 2.5,
              elevation: 5,
              pointerEvents: 'none',
            }}
          >
            {/* Split Forked Red Snake Tongue */}
            <View
              style={[
                boardStyles.snakeTongueWrapper,
                { top: -Math.round(tongueStemH + tongueForkH - 1) },
              ]}
            >
              <View style={[boardStyles.tongueStem, { height: tongueStemH }]} />
              <View style={boardStyles.tongueForkRow}>
                <View
                  style={[
                    boardStyles.tongueForkLeft,
                    { height: tongueForkH, backgroundColor: '#DC2626' },
                  ]}
                />
                <View
                  style={[
                    boardStyles.tongueForkRight,
                    { height: tongueForkH, backgroundColor: '#DC2626' },
                  ]}
                />
              </View>
            </View>

            {/* Nostrils */}
            <View style={boardStyles.snakeNostrilRow}>
              <View style={boardStyles.snakeNostrilDot} />
              <View style={boardStyles.snakeNostrilDot} />
            </View>

            {/* Expressive Cartoon Eyes */}
            <View style={boardStyles.snakeEyesRow}>
              <View
                style={[
                  boardStyles.snakeEyeOuter,
                  {
                    width: eyeSize,
                    height: eyeSize,
                    borderRadius: eyeSize / 2,
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              >
                <View
                  style={[
                    boardStyles.snakePupilDot,
                    {
                      width: Math.max(2, eyeSize * 0.55),
                      height: Math.max(2, eyeSize * 0.55),
                      borderRadius: (eyeSize * 0.55) / 2,
                    },
                  ]}
                />
              </View>
              <View
                style={[
                  boardStyles.snakeEyeOuter,
                  {
                    width: eyeSize,
                    height: eyeSize,
                    borderRadius: eyeSize / 2,
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              >
                <View
                  style={[
                    boardStyles.snakePupilDot,
                    {
                      width: Math.max(2, eyeSize * 0.55),
                      height: Math.max(2, eyeSize * 0.55),
                      borderRadius: (eyeSize * 0.55) / 2,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </React.Fragment>
      );
    });
  };

  // Build 10x10 Grid with Alternating Zig-Zag Cells & Multi-Token Layout
  const gridRows = [];
  for (let r = 9; r >= 0; r--) {
    const cells = [];
    for (let c = 0; c < 10; c++) {
      let squareNum = r * 10 + 1;
      if (r % 2 === 0) {
        squareNum += c;
      } else {
        squareNum += 9 - c;
      }

      const isOddCell = (r + c) % 2 === 1;
      const isStart = squareNum === 1;
      const isFinish = squareNum === 100;
      const isLadderFrom = LADDERS[squareNum] !== undefined;
      const isSnakeHead = SNAKES[squareNum] !== undefined;

      const tokensOnCell = state.players.filter(
        (p) => (animatedPositions[p.id] ?? p.position) === squareNum
      );

      cells.push(
        <View
          key={`cell-${squareNum}`}
          style={[
            boardStyles.cell,
            { width: cellSize, height: cellSize },
            isOddCell ? boardStyles.cellMint : boardStyles.cellIceBlue,
            isFinish && boardStyles.cellFinish,
          ]}
        >
          {/* Square Number & Victory Badge */}
          <View style={boardStyles.cellHeader}>
            <Text
              style={[
                boardStyles.cellNum,
                { fontSize: Math.max(8.5, cellSize * 0.28) },
                isFinish && { color: '#FEF08A', fontWeight: '900' },
              ]}
            >
              {squareNum}
            </Text>
            {isFinish && (
              <Text style={{ fontSize: Math.max(9, cellSize * 0.32) }}>👑</Text>
            )}
            {isStart && (
              <Text style={{ fontSize: Math.max(7.5, cellSize * 0.24) }}>🏁</Text>
            )}
          </View>

          {/* Square 1 START Label */}
          {isStart && (
            <View style={boardStyles.startLabelContainer}>
              <Text style={[boardStyles.startLabelText, { fontSize: Math.max(6.5, cellSize * 0.20) }]}>
                START
              </Text>
            </View>
          )}

          {/* Multi-Token Layout in Square Lower Area */}
          {tokensOnCell.length > 0 && (
            <View style={[boardStyles.tokenCenterWrapper, isStart && { paddingBottom: 8 }]}>
              {tokensOnCell.length === 1 ? (
                <Pawn3D
                  colorIdx={state.players.findIndex((p) => p.id === tokensOnCell[0].id)}
                  avatar={tokensOnCell[0].avatar}
                  size={Math.min(18, cellSize * 0.44)}
                />
              ) : tokensOnCell.length === 2 ? (
                <View style={boardStyles.tokenRow2}>
                  {tokensOnCell.map((p) => (
                    <Pawn3D
                      key={p.id}
                      colorIdx={state.players.findIndex((sp) => sp.id === p.id)}
                      avatar={p.avatar}
                      size={Math.min(13, cellSize * 0.32)}
                    />
                  ))}
                </View>
              ) : tokensOnCell.length === 3 ? (
                <View style={boardStyles.tokenCol3}>
                  <View style={boardStyles.tokenRowTop1}>
                    <Pawn3D
                      colorIdx={state.players.findIndex((sp) => sp.id === tokensOnCell[0].id)}
                      avatar={tokensOnCell[0].avatar}
                      size={Math.min(11, cellSize * 0.26)}
                    />
                  </View>
                  <View style={boardStyles.tokenRowBottom2}>
                    {tokensOnCell.slice(1).map((p) => (
                      <Pawn3D
                        key={p.id}
                        colorIdx={state.players.findIndex((sp) => sp.id === p.id)}
                        avatar={p.avatar}
                        size={Math.min(11, cellSize * 0.26)}
                      />
                    ))}
                  </View>
                </View>
              ) : tokensOnCell.length === 4 ? (
                <View style={boardStyles.tokenGrid4}>
                  <View style={boardStyles.tokenGridRow}>
                    {tokensOnCell.slice(0, 2).map((p) => (
                      <Pawn3D
                        key={p.id}
                        colorIdx={state.players.findIndex((sp) => sp.id === p.id)}
                        avatar={p.avatar}
                        size={Math.min(10, cellSize * 0.24)}
                      />
                    ))}
                  </View>
                  <View style={boardStyles.tokenGridRow}>
                    {tokensOnCell.slice(2, 4).map((p) => (
                      <Pawn3D
                        key={p.id}
                        colorIdx={state.players.findIndex((sp) => sp.id === p.id)}
                        avatar={p.avatar}
                        size={Math.min(10, cellSize * 0.24)}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                /* 5 to 8 tokens: neatly packed in compact 2-row multi grid */
                <View style={boardStyles.tokenGridMulti}>
                  {tokensOnCell.slice(0, 8).map((p) => (
                    <Pawn3D
                      key={p.id}
                      colorIdx={state.players.findIndex((sp) => sp.id === p.id)}
                      avatar={p.avatar}
                      size={Math.min(7.5, cellSize * 0.18)}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      );
    }

    gridRows.push(
      <View key={`row-${r}`} style={{ flexDirection: 'row' }}>
        {cells}
      </View>
    );
  }

  const statusBarPadding =
    Platform.OS === 'android'
      ? isLandscape
        ? 0
        : Math.max(32, StatusBar.currentHeight || 32)
      : 0;

  return (
    <View style={boardStyles.mainContainer}>
      {/* Themed Jungle / Wood Header Bar with Android Status Bar Clearance */}
      {!hideHeader && (
        <View
          style={[
            boardStyles.topHeaderBar,
            { paddingTop: statusBarPadding, height: 48 + statusBarPadding },
            !isLandscape && { width: boardDim + 8, maxWidth: boardDim + 8 },
          ]}
        >
          <Pressable
            onPress={onExit || (() => {})}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Exit game"
            style={boardStyles.woodExitButton}
          >
            <Text style={boardStyles.woodExitButtonText}>← EXIT</Text>
          </Pressable>

          <View style={boardStyles.carvedSignPlaque}>
            <Text style={{ fontSize: 13, marginRight: 4 }}>🌿</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={boardStyles.carvedSignTitle}>SNAKES & LADDERS</Text>
              <View style={boardStyles.carvedSignSubPill}>
                <Text style={boardStyles.carvedSignSubText}>100 SQUARES</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, marginLeft: 4 }}>🌿</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={() => setIsRosterOpen(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={boardStyles.woodRosterButton}
            >
              <Text style={{ fontSize: 12, marginBottom: -1 }}>📋</Text>
              <Text style={boardStyles.woodRulesButtonText}>Roster</Text>
            </Pressable>

            <Pressable
              onPress={onOpenRules || (() => {})}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={boardStyles.woodRulesButton}
            >
              <Text style={{ fontSize: 12, marginBottom: -1 }}>📜</Text>
              <Text style={boardStyles.woodRulesButtonText}>Rules</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Ladder / Snake Transition Feedback Banner */}
      {eventBanner && (
        <View style={boardStyles.eventBannerContainer}>
          <Text style={boardStyles.eventBannerText}>{eventBanner}</Text>
        </View>
      )}

      {/* Main Responsive Layout Shell */}
      <View
        style={[
          boardStyles.layoutShell,
          isLandscape && boardStyles.layoutShellLandscape,
        ]}
      >
        {/* Dominant 10x10 Board with Wooden Frame & Bezel */}
        <View style={[boardStyles.boardFrame, { width: boardDim + 8, height: boardDim + 8 }]}>
          <View style={[boardStyles.boardSurface, { width: boardDim, height: boardDim }]}>
            <View style={boardStyles.gridHolder}>{gridRows}</View>
            {renderLaddersOverlay()}
            {renderSnakesOverlay()}
          </View>
        </View>

        {/* Compact HUD & Controls Panel */}
        <View style={[boardStyles.hudPanel, isLandscape ? boardStyles.hudPanelLandscape : { width: boardDim + 8, maxWidth: boardDim + 8 }]}>
          {isLandscape ? (
            /* Landscape Side Panel */
            <View style={boardStyles.sidePanelLandscape}>
              {/* Player list stacked vertically in single column */}
              <ScrollView
                style={{ maxHeight: 180, width: '100%' }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={boardStyles.playersListLandscape}
              >
                {state.players.map((p, idx) => {
                  const isTurn = state.currentTurnIdx === idx;
                  const isBot = p.isBot;
                  const displayName = isBot
                    ? p.name.replace(/^Robo\s+/, '')
                    : p.name.replace(/\s*\([^)]*\)/, '');
                  const roleTag = isBot ? 'Bot' : '(You)';

                  return (
                    <View
                      key={p.id}
                      style={[
                        boardStyles.playerCardLandscape,
                        isTurn && boardStyles.playerCardLandscapeActive,
                      ]}
                    >
                      <View
                        style={[
                          boardStyles.avatarCircleLandscape,
                          { borderColor: isTurn ? '#F59E0B' : '#452A18' },
                        ]}
                      >
                        <Pawn3D colorIdx={idx} size={15} isTurn={isTurn} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={boardStyles.playerNameLandscape} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text style={boardStyles.playerRoleLandscape}>{roleTag}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Centered White Ivory Dice */}
              <View style={{ alignItems: 'center', marginVertical: 6 }}>
                <VisualDice
                  value={state.lastDiceRoll}
                  rolling={rolling}
                  disabled={!isCurrentHumanTurn || isAnimatingRef.current}
                  onPress={handleRoll}
                  size={44}
                />
              </View>

              {/* Glossy Green ROLL Button */}
              <View style={{ alignItems: 'center' }}>
                <Pressable
                  disabled={!isCurrentHumanTurn || rolling || isAnimatingRef.current}
                  onPress={handleRoll}
                  style={[
                    boardStyles.rollButtonGreenLandscape,
                    (!isCurrentHumanTurn || isAnimatingRef.current) && boardStyles.rollButtonGreenDisabled,
                  ]}
                >
                  <View style={boardStyles.rollButtonSheen} />
                  <Text style={boardStyles.rollButtonGreenText}>
                    {rolling ? '...' : isAnimatingRef.current ? '...' : 'ROLL'}
                  </Text>
                </Pressable>

                {/* Auto rolls in 5s... and Timer Progress Bar */}
                {isCurrentHumanTurn && (
                  <View style={{ alignItems: 'center', marginTop: 4 }}>
                    <Text style={boardStyles.autoRollText}>
                      Auto rolls in {autoRollCountdown ?? 5}s...
                    </Text>
                    <View style={boardStyles.timerBarTrack}>
                      <View
                        style={[
                          boardStyles.timerBarFill,
                          { width: `${((autoRollCountdown ?? 5) / 5) * 100}%` },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Status commentary in Landscape */}
              <View style={boardStyles.commentaryContainerLandscape}>
                <Text style={boardStyles.commentaryText} numberOfLines={2}>
                  {state.lastActionMessage ||
                    `${currentTurnPlayer?.name || 'Player'}'s turn.`}
                </Text>
              </View>
            </View>
          ) : (
            /* Portrait Horizontal Wooden Deck */
            <View style={boardStyles.woodDeckPortrait}>
              <View style={boardStyles.deckRow}>
                {/* Scrollable Player Avatars on Left (Supports 1-8 players smoothly) */}
                <View style={{ flex: 1, marginRight: 4 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={boardStyles.playersDeckRow}
                  >
                    {state.players.map((p, idx) => {
                      const isTurn = state.currentTurnIdx === idx;
                      const isBot = p.isBot;
                      const displayName = isBot
                        ? p.name.replace(/^Robo\s+/, '')
                        : p.name.replace(/\s*\([^)]*\)/, '');
                      const roleTag = isBot ? 'Bot' : '(You)';

                      return (
                        <View key={p.id} style={boardStyles.avatarDeckItem}>
                          {/* Turn indicator triangle */}
                          <View style={{ height: 8, justifyContent: 'center', alignItems: 'center' }}>
                            {isTurn && <Text style={{ fontSize: 9, color: '#F59E0B' }}>▲</Text>}
                          </View>
                          <View
                            style={[
                              boardStyles.avatarCircleDeck,
                              isTurn && boardStyles.avatarCircleDeckActive,
                            ]}
                          >
                            <Pawn3D colorIdx={idx} size={18} isTurn={isTurn} />
                          </View>
                          <Text style={boardStyles.avatarDeckName} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={boardStyles.avatarDeckRole}>{roleTag}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Single-Column Roster quick button */}
                <Pressable
                  onPress={() => setIsRosterOpen(true)}
                  style={boardStyles.rosterQuickPill}
                >
                  <Text style={{ fontSize: 11 }}>📋</Text>
                  <Text style={boardStyles.rosterQuickPillText}>Roster</Text>
                </Pressable>

                {/* White 3D Dice in Middle */}
                <View style={boardStyles.diceDeckContainer}>
                  <VisualDice
                    value={state.lastDiceRoll}
                    rolling={rolling}
                    disabled={!isCurrentHumanTurn || isAnimatingRef.current}
                    onPress={handleRoll}
                    size={44}
                  />
                </View>

                {/* Glossy Green ROLL Button on Right */}
                <View style={boardStyles.rollDeckContainer}>
                  <Pressable
                    disabled={!isCurrentHumanTurn || rolling || isAnimatingRef.current}
                    onPress={handleRoll}
                    style={[
                      boardStyles.rollButtonGreen,
                      (!isCurrentHumanTurn || isAnimatingRef.current) && boardStyles.rollButtonGreenDisabled,
                    ]}
                  >
                    <View style={boardStyles.rollButtonSheen} />
                    <Text style={boardStyles.rollButtonGreenText}>
                      {rolling ? '...' : isAnimatingRef.current ? '...' : 'ROLL'}
                    </Text>
                  </Pressable>

                  {/* Auto rolls in 5s... and Timer Progress Bar */}
                  {isCurrentHumanTurn && (
                    <View style={{ alignItems: 'center', marginTop: 3 }}>
                      <Text style={boardStyles.autoRollText}>
                        Auto rolls in {autoRollCountdown ?? 5}s...
                      </Text>
                      <View style={boardStyles.timerBarTrack}>
                        <View
                          style={[
                            boardStyles.timerBarFill,
                            { width: `${((autoRollCountdown ?? 5) / 5) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Turn status / commentary line inside wooden deck */}
              <View style={boardStyles.commentaryContainer}>
                <Text style={boardStyles.commentaryText} numberOfLines={1}>
                  {state.lastActionMessage ||
                    `${currentTurnPlayer?.name || 'Player'}'s turn. Roll the dice to move.`}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 🏆 Single-Column Player Roster Modal (Displays all players in 1 vertical column) */}
      <Modal
        visible={isRosterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRosterOpen(false)}
      >
        <Pressable
          style={boardStyles.rosterModalOverlay}
          onPress={() => setIsRosterOpen(false)}
        >
          <Pressable
            style={boardStyles.rosterModalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={boardStyles.rosterModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 18 }}>📋</Text>
                <View>
                  <Text style={boardStyles.rosterModalTitle}>1-COLUMN PLAYER ROSTER</Text>
                  <Text style={boardStyles.rosterModalSubtitle}>
                    {state.players.length} Players • Ranked by Board Position
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setIsRosterOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={boardStyles.rosterCloseButton}
              >
                <Text style={boardStyles.rosterCloseButtonText}>✕</Text>
              </Pressable>
            </View>

            {/* Vertical 1-Column Scrollable List */}
            <ScrollView
              style={{ maxHeight: 380 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={boardStyles.rosterListContainer}
            >
              {[...state.players]
                .sort((a, b) => (animatedPositions[b.id] ?? b.position) - (animatedPositions[a.id] ?? a.position))
                .map((p, rankIdx) => {
                  const origIdx = state.players.findIndex((sp) => sp.id === p.id);
                  const isTurn = state.currentTurnIdx === origIdx;
                  const currentSq = animatedPositions[p.id] ?? p.position;
                  const progressPct = Math.min(100, Math.round((currentSq / 100) * 100));
                  const rankMedal =
                    rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `#${rankIdx + 1}`;

                  return (
                    <View
                      key={p.id}
                      style={[
                        boardStyles.rosterPlayerCard,
                        isTurn && boardStyles.rosterPlayerCardActive,
                      ]}
                    >
                      {/* Rank Medal */}
                      <View style={boardStyles.rosterRankBadge}>
                        <Text style={boardStyles.rosterRankText}>{rankMedal}</Text>
                      </View>

                      {/* 3D Pawn preview */}
                      <View style={boardStyles.rosterPawnWrapper}>
                        <Pawn3D colorIdx={origIdx} size={20} isTurn={isTurn} />
                      </View>

                      {/* Player info */}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={boardStyles.rosterPlayerName} numberOfLines={1}>
                            {p.name}
                          </Text>
                          {p.isBot ? (
                            <View style={boardStyles.rosterBotPill}>
                              <Text style={boardStyles.rosterBotPillText}>BOT</Text>
                            </View>
                          ) : (
                            <View style={boardStyles.rosterYouPill}>
                              <Text style={boardStyles.rosterYouPillText}>YOU</Text>
                            </View>
                          )}
                          {isTurn && (
                            <View style={boardStyles.rosterActiveTurnPill}>
                              <Text style={boardStyles.rosterActiveTurnText}>TURN</Text>
                            </View>
                          )}
                        </View>

                        {/* Progress Bar towards 100 */}
                        <View style={boardStyles.rosterProgressBarTrack}>
                          <View
                            style={[
                              boardStyles.rosterProgressBarFill,
                              {
                                width: `${progressPct}%`,
                                backgroundColor: PLAYER_COLORS[origIdx % PLAYER_COLORS.length],
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Square Number */}
                      <View style={boardStyles.rosterSquareBadge}>
                        <Text style={boardStyles.rosterSquareText}>
                          {currentSq === 100 ? 'WIN' : `Sq ${currentSq}`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </ScrollView>

            {/* Footer Close */}
            <Pressable
              onPress={() => setIsRosterOpen(false)}
              style={boardStyles.rosterDismissBtn}
            >
              <Text style={boardStyles.rosterDismissBtnText}>RESUME BOARD 🎲</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};


const boardStyles = StyleSheet.create({
  mainContainer: {
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
    marginBottom: 6,
    height: 48,
    width: '100%',
  },
  woodExitButton: {
    minWidth: 48,
    minHeight: 48,
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  eventBannerContainer: {
    backgroundColor: '#3C2213',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  eventBannerText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FEF3C7',
    textAlign: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  carvedSignTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  carvedSignSubPill: {
    backgroundColor: '#28150A',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 1,
  },
  carvedSignSubText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FDE68A',
    letterSpacing: 0.5,
  },
  woodRulesButton: {
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  woodRulesButtonText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FEF3C7',
  },
  layoutShell: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  layoutShellLandscape: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  boardFrame: {
    backgroundColor: '#3B1F0E',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#6D3A1B',
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  boardSurface: {
    position: 'relative',
    backgroundColor: '#D7EEF8',
    borderWidth: 1,
    borderColor: '#2D1609',
    borderRadius: 6,
    overflow: 'hidden',
  },
  gridHolder: {
    flex: 1,
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#B0D7C1',
    justifyContent: 'space-between',
    padding: 1,
    position: 'relative',
  },
  cellMint: {
    backgroundColor: '#D2EED8',
  },
  cellIceBlue: {
    backgroundColor: '#D7EEF8',
  },
  cellFinish: {
    backgroundColor: '#EF4444',
  },
  cellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 1.5,
    paddingTop: 0.5,
  },
  cellNum: {
    fontWeight: '800',
    color: '#1E293B',
    paddingLeft: 0.5,
  },
  startLabelContainer: {
    position: 'absolute',
    bottom: 1,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  startLabelText: {
    color: '#166534',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tokenCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenRow2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  tokenCol3: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenRowTop1: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -1,
  },
  tokenRowBottom2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  tokenGrid4: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenGridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  ladderRail3D: {
    backgroundColor: '#6E3816',
    borderWidth: 0.5,
    borderColor: '#3D1C08',
    borderRadius: 1.5,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  ladderRailSheen: {
    height: 1,
    backgroundColor: '#FDE68A',
    opacity: 0.6,
  },
  ladderRung3D: {
    backgroundColor: '#8F4D22',
    borderWidth: 0.5,
    borderColor: '#3D1C08',
    borderRadius: 1,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  ladderRungSheen: {
    height: 1,
    backgroundColor: '#FDE68A',
    opacity: 0.65,
  },
  ladderMetalCap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: '#B45309',
    borderWidth: 0.5,
    borderColor: '#78350F',
    borderRadius: 1,
  },
  snakeTongueWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  tongueStem: {
    width: 1.5,
    backgroundColor: '#DC2626',
  },
  tongueForkRow: {
    flexDirection: 'row',
    width: 5,
    justifyContent: 'space-between',
    marginTop: -0.5,
  },
  tongueForkLeft: {
    width: 1.5,
    transform: [{ rotate: '-25deg' }],
  },
  tongueForkRight: {
    width: 1.5,
    transform: [{ rotate: '25deg' }],
  },
  snakeNostrilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '30%',
    marginTop: 1,
  },
  snakeNostrilDot: {
    width: 1.5,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  snakeEyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '64%',
    marginTop: 1.5,
  },
  snakeEyeOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  snakePupilDot: {
    backgroundColor: '#0F172A',
  },
  hudPanel: {
    width: '100%',
    maxWidth: 390,
    marginTop: 4,
  },
  hudPanelLandscape: {
    width: 170,
    marginTop: 0,
    justifyContent: 'center',
  },
  woodDeckPortrait: {
    backgroundColor: '#24150C',
    borderColor: '#5C361D',
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playersDeckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  avatarDeckItem: {
    alignItems: 'center',
    width: 38,
  },
  avatarCircleDeck: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#160C06',
    borderWidth: 1.5,
    borderColor: '#4A2A18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleDeckActive: {
    borderColor: '#F59E0B',
    borderWidth: 2.5,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarDeckName: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 2,
    textAlign: 'center',
  },
  avatarDeckRole: {
    fontSize: 8,
    color: '#94A3B8',
    textAlign: 'center',
  },
  diceDeckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  rollDeckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollButtonGreen: {
    backgroundColor: '#16A34A',
    borderColor: '#14532D',
    borderWidth: 1.5,
    borderRadius: 12,
    width: 82,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'hidden',
  },
  rollButtonGreenLandscape: {
    backgroundColor: '#16A34A',
    borderColor: '#14532D',
    borderWidth: 1.5,
    borderRadius: 12,
    width: 120,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'hidden',
  },
  rollButtonGreenDisabled: {
    backgroundColor: '#334155',
    borderColor: '#1E293B',
    opacity: 0.75,
  },
  rollButtonSheen: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  rollButtonGreenText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  autoRollText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#86EFAC',
    marginTop: 2,
  },
  timerBarTrack: {
    width: 76,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginTop: 1,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 1.5,
  },
  commentaryContainer: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentaryContainerLandscape: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentaryText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#FDE047',
    textAlign: 'center',
  },
  sidePanelLandscape: {
    backgroundColor: '#24150C',
    borderColor: '#5C361D',
    borderWidth: 2,
    borderRadius: 16,
    padding: 8,
    width: 170,
  },
  playersListLandscape: {
    gap: 4,
  },
  playerCardLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: '#3D2516',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  playerCardLandscapeActive: {
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  avatarCircleLandscape: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#160C06',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerNameLandscape: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  playerRoleLandscape: {
    fontSize: 8,
    color: '#94A3B8',
  },
  woodRosterButton: {
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  rosterQuickPill: {
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rosterQuickPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FDE047',
  },
  tokenGridMulti: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '96%',
    gap: 1.5,
  },
  rosterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  rosterModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#121F17',
    borderWidth: 2,
    borderColor: '#8B5A2B',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
  rosterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#273C2C',
    paddingBottom: 10,
    marginBottom: 12,
  },
  rosterModalTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  rosterModalSubtitle: {
    fontSize: 10.5,
    color: '#86EFAC',
    marginTop: 1,
  },
  rosterCloseButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#3C2213',
    borderWidth: 1,
    borderColor: '#784323',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterCloseButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FEF08A',
  },
  rosterListContainer: {
    gap: 8,
  },
  rosterPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#182C21',
    borderWidth: 1,
    borderColor: '#2D4B39',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rosterPlayerCardActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#243C2C',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  rosterRankBadge: {
    width: 26,
    alignItems: 'center',
  },
  rosterRankText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  rosterPawnWrapper: {
    width: 28,
    alignItems: 'center',
  },
  rosterPlayerName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
    maxWidth: 110,
  },
  rosterBotPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rosterBotPillText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
  },
  rosterYouPill: {
    backgroundColor: '#065F46',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rosterYouPillText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  rosterActiveTurnPill: {
    backgroundColor: '#B45309',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  rosterActiveTurnText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FEF3C7',
  },
  rosterProgressBarTrack: {
    height: 4,
    backgroundColor: '#0D1912',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  rosterProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  rosterSquareBadge: {
    backgroundColor: '#3C2213',
    borderColor: '#784323',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    marginLeft: 6,
  },
  rosterSquareText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FDE047',
  },
  rosterDismissBtn: {
    backgroundColor: '#16A34A',
    borderColor: '#14532D',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  rosterDismissBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
