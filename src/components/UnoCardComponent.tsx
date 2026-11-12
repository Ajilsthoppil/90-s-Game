import React from 'react';
import { StyleSheet, Text, View, Pressable, ViewStyle, StyleProp } from 'react-native';
import { UnoCard, UnoColor } from '../games/uno/types/uno.types';

interface UnoCardComponentProps {
  card: UnoCard;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isPlayable?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}

const COLOR_HEX: Record<UnoColor | 'WILD', string> = {
  RED: '#DC2626',
  GREEN: '#16A34A',
  BLUE: '#2563EB',
  YELLOW: '#D97706',
  WILD: '#1E293B',
};

export const UnoCardComponent: React.FC<UnoCardComponentProps> = ({
  card,
  onPress,
  selected = false,
  disabled = false,
  isPlayable = false,
  size = 'medium',
  style,
}) => {
  const getDisplaySymbol = (val: string) => {
    switch (val) {
      case 'SKIP':
        return '🚫';
      case 'REVERSE':
        return '⇄';
      case 'DRAW_TWO':
        return '+2';
      case 'WILD':
        return '🌈';
      case 'WILD_DRAW_FOUR':
        return '+4';
      default:
        return val;
    }
  };

  const isWild = card.color === 'WILD';
  const symbol = getDisplaySymbol(card.value);
  const cardBgColor = COLOR_HEX[card.color] || '#334155';

  const dimensions = {
    small: { width: 48, height: 72, fontMain: 18, fontCorner: 9, ovalWidth: 34, ovalHeight: 50 },
    medium: { width: 64, height: 96, fontMain: 24, fontCorner: 11, ovalWidth: 46, ovalHeight: 68 },
    large: { width: 88, height: 132, fontMain: 34, fontCorner: 14, ovalWidth: 62, ovalHeight: 94 },
  }[size];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: cardBgColor,
        },
        isPlayable && !disabled && styles.playableCard,
        selected && styles.selectedCard,
        pressed && !disabled && styles.pressedCard,
        disabled && styles.disabledCard,
        style,
      ]}
    >
      {/* Outer Card Frame */}
      <View style={styles.innerFrame}>
        {/* Wild 4-Color Background Quadrant if Wild Card */}
        {isWild && (
          <View style={styles.wildQuadrantContainer}>
            <View style={[styles.quadrant, { backgroundColor: '#DC2626' }]} />
            <View style={[styles.quadrant, { backgroundColor: '#16A34A' }]} />
            <View style={[styles.quadrant, { backgroundColor: '#2563EB' }]} />
            <View style={[styles.quadrant, { backgroundColor: '#D97706' }]} />
          </View>
        )}

        {/* High-Contrast Top-Left Corner Index (Always visible in overlapping hand) */}
        <View style={styles.topLeftCorner}>
          <View style={styles.cornerPill}>
            <Text style={[styles.cornerText, { fontSize: dimensions.fontCorner }]}>{symbol}</Text>
          </View>
        </View>

        {/* Center Oval with Value */}
        <View
          style={[
            styles.centerOval,
            {
              width: dimensions.ovalWidth,
              height: dimensions.ovalHeight,
            },
          ]}
        >
          <Text
            style={[
              styles.mainValueText,
              {
                fontSize: dimensions.fontMain,
                color: isWild ? '#0F172A' : cardBgColor,
              },
            ]}
          >
            {symbol}
          </Text>
        </View>

        {/* Bottom-Right Corner Index (Rotated 180deg) */}
        <View style={styles.bottomRightCorner}>
          <View style={styles.cornerPill}>
            <Text style={[styles.cornerText, { fontSize: dimensions.fontCorner }]}>{symbol}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    padding: 2,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    marginHorizontal: 2,
    overflow: 'hidden',
  },
  innerFrame: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  wildQuadrantContainer: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quadrant: {
    width: '50%',
    height: '50%',
  },
  topLeftCorner: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 4,
  },
  bottomRightCorner: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    zIndex: 4,
    transform: [{ rotate: '180deg' }],
  },
  cornerPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 4,
    paddingHorizontal: 2.5,
    paddingVertical: 1,
    minWidth: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerText: {
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  centerOval: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-25deg' }],
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    zIndex: 2,
    elevation: 3,
  },
  mainValueText: {
    fontWeight: '900',
    textAlign: 'center',
    transform: [{ rotate: '25deg' }],
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  playableCard: {
    borderColor: '#F59E0B',
    borderWidth: 3,
    elevation: 7,
  },
  selectedCard: {
    transform: [{ translateY: -16 }, { scale: 1.08 }],
    borderColor: '#FCD34D',
    borderWidth: 3.5,
    elevation: 10,
    zIndex: 100,
  },
  pressedCard: {
    opacity: 0.9,
    transform: [{ translateY: -4 }],
  },
  disabledCard: {
    opacity: 0.55,
  },
});
