import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Easing } from 'react-native';

interface ComicReactionOverlayProps {
  visible: boolean;
  type: 'PRANK' | 'CHAOS' | 'SHIELD_BLOCK' | 'BOUNTY_CLAIM';
  title: string;
  message: string;
  onFinish: () => void;
}

export const ComicReactionOverlay: React.FC<ComicReactionOverlayProps> = ({
  visible,
  type,
  title,
  message,
  onFinish,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.2)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1.1, friction: 4, tension: 50, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
        Animated.delay(1600),
        Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        onFinish();
      });
    } else {
      scaleAnim.setValue(0.2);
      shakeAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const getEmoji = () => {
    switch (type) {
      case 'PRANK':
        return '🤣 🍖';
      case 'CHAOS':
        return '🎸 🎶 💀';
      case 'SHIELD_BLOCK':
        return '🛡️ ⚔️';
      case 'BOUNTY_CLAIM':
        return '💰 📜';
      default:
        return '⚡';
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.comicBurstContainer,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateX: shakeAnim },
            ],
          },
        ]}
      >
        <Text style={styles.burstEmoji}>{getEmoji()}</Text>
        <Text style={styles.burstTitle}>{title}</Text>
        <Text style={styles.burstMessage}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comicBurstContainer: {
    backgroundColor: 'rgba(26, 15, 10, 0.94)',
    borderWidth: 3,
    borderColor: '#F59E0B',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 14,
    maxWidth: 320,
  },
  burstEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  burstTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FDE047',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  burstMessage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
