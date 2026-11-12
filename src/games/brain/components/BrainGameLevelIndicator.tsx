import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BrainDifficulty } from '../types/brain.types';

export interface BrainGameLevelIndicatorProps {
  level: number;
  difficulty?: BrainDifficulty;
  isCompleted?: boolean;
  onPress?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const BrainGameLevelIndicator: React.FC<BrainGameLevelIndicatorProps> = ({
  level,
  difficulty = 'EASY',
  isCompleted = false,
  onPress,
  compact = false,
  style,
}) => {
  const content = (
    <View
      style={[
        styles.indicatorContainer,
        compact && styles.indicatorCompact,
        isCompleted && styles.indicatorCompleted,
        style,
      ]}
    >
      <Text style={styles.icon}>{isCompleted ? '✓' : '⭐'}</Text>
      <Text style={[styles.levelText, isCompleted && styles.levelTextCompleted]}>
        {compact
          ? `LVL ${level}`
          : isCompleted
          ? `LEVEL ${level} COMPLETE`
          : `LEVEL ${level} · ${difficulty}`}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Level ${level}, ${difficulty}. Tap for details.`}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Current Level ${level}, ${difficulty}`}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  indicatorCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indicatorCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  icon: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F59E0B',
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.6,
  },
  levelTextCompleted: {
    color: '#10B981',
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
  },
});
