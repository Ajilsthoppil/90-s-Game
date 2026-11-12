import React from 'react';
import { StyleSheet, Text, View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { Phase10Card, Phase10Color } from '../games/phase10/types/phase10.types';

interface Phase10CardComponentProps {
  card: Phase10Card;
  onPress?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}

const COLOR_HEX: Record<Phase10Color | 'WILD', string> = {
  RED: '#DC2626',
  BLUE: '#2563EB',
  GREEN: '#16A34A',
  YELLOW: '#D97706',
  WILD: '#7E22CE',
};

export const Phase10CardComponent: React.FC<Phase10CardComponentProps> = ({
  card,
  onPress,
  selected = false,
  disabled = false,
  size = 'medium',
  style,
}) => {
  const isWild = card.value === 'WILD';
  const isSkip = card.value === 'SKIP';

  const cardBgColor = isWild ? '#7E22CE' : isSkip ? '#EA580C' : COLOR_HEX[card.color] || '#1E293B';
  const displayVal = isWild ? '★' : isSkip ? '🚫' : `${card.value}`;

  const dimensions = {
    small: { width: 48, height: 72, fontMain: 18, fontCorner: 9, pillSize: 18 },
    medium: { width: 64, height: 96, fontMain: 26, fontCorner: 11, pillSize: 22 },
    large: { width: 88, height: 132, fontMain: 36, fontCorner: 14, pillSize: 28 },
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
        selected && styles.selectedCard,
        pressed && !disabled && styles.pressedCard,
        disabled && styles.disabledCard,
        style,
      ]}
    >
      <View style={styles.innerFrame}>
        {/* Top-Left Corner Index Pill */}
        <View style={styles.topLeftCorner}>
          <View style={[styles.cornerPill, { width: dimensions.pillSize, height: dimensions.pillSize, borderRadius: dimensions.pillSize / 2 }]}>
            <Text style={[styles.cornerText, { fontSize: dimensions.fontCorner, color: cardBgColor }]}>
              {displayVal}
            </Text>
          </View>
        </View>

        {/* Center Main Symbol */}
        <View style={styles.centerBox}>
          <Text style={[styles.mainValueText, { fontSize: dimensions.fontMain }]}>{displayVal}</Text>
          {isWild && <Text style={styles.subText}>WILD</Text>}
          {isSkip && <Text style={styles.subText}>SKIP</Text>}
        </View>

        {/* Bottom-Right Corner Index Pill */}
        <View style={styles.bottomRightCorner}>
          <View style={[styles.cornerPill, { width: dimensions.pillSize, height: dimensions.pillSize, borderRadius: dimensions.pillSize / 2 }]}>
            <Text style={[styles.cornerText, { fontSize: dimensions.fontCorner, color: cardBgColor }]}>
              {displayVal}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 8,
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
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topLeftCorner: {
    position: 'absolute',
    top: 2,
    left: 2,
  },
  bottomRightCorner: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    transform: [{ rotate: '180deg' }],
  },
  cornerPill: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  cornerText: {
    fontWeight: '900',
    textAlign: 'center',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainValueText: {
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  subText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FEFCBF',
    letterSpacing: 0.8,
    marginTop: -2,
  },
  selectedCard: {
    transform: [{ translateY: -14 }],
    borderColor: '#F59E0B',
    borderWidth: 3.5,
    elevation: 10,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  pressedCard: {
    opacity: 0.9,
    transform: [{ translateY: -4 }],
  },
  disabledCard: {
    opacity: 0.5,
  },
});

