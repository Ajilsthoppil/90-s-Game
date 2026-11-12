import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

export interface BrainGameStatsFooterProps {
  score?: number;
  timeSeconds?: number;
  moves?: number;
  mistakes?: number;
  hintsRemaining?: number;
  onHint?: () => void;
  showMoves?: boolean;
  showMistakes?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const BrainGameStatsFooter: React.FC<BrainGameStatsFooterProps> = ({
  score = 100,
  timeSeconds = 0,
  moves = 0,
  mistakes = 0,
  hintsRemaining = 3,
  onHint,
  showMoves = true,
  showMistakes = true,
  style,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left/Center Stat Chips */}
      <View style={styles.statsGroup}>
        {/* Score Chip */}
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>SCORE</Text>
          <Text style={[styles.statValue, styles.scoreValue]}>{score}</Text>
        </View>

        {/* Time Chip */}
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>TIME</Text>
          <Text style={styles.statValue}>{formatTime(timeSeconds)}</Text>
        </View>

        {/* Moves Chip (if applicable) */}
        {showMoves ? (
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>MOVES</Text>
            <Text style={styles.statValue}>{moves}</Text>
          </View>
        ) : null}

        {/* Mistakes Chip (if applicable) */}
        {showMistakes ? (
          <View style={styles.statChip}>
            <Text style={styles.statLabel}>ERRORS</Text>
            <Text
              style={[
                styles.statValue,
                mistakes > 0 ? styles.mistakeValue : styles.statValue,
              ]}
            >
              {mistakes}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Right: Hint Action Button */}
      {onHint ? (
        <Pressable
          onPress={onHint}
          accessibilityRole="button"
          accessibilityLabel={`Use hint, ${hintsRemaining} remaining`}
          style={({ pressed }) => [
            styles.hintBtn,
            hintsRemaining <= 0 && styles.hintBtnDisabled,
            pressed && hintsRemaining > 0 && styles.hintBtnPressed,
          ]}
        >
          <Text style={styles.hintBtnIcon}>💡</Text>
          <Text style={styles.hintBtnText}>
            {isCompact ? `${hintsRemaining}` : `Hint (${hintsRemaining})`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E223D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    minHeight: 52,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  statsGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  statChip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A1B30',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#193557',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 50,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8BACD1',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#F8FAFC',
    marginTop: 1,
  },
  scoreValue: {
    color: '#FBBF24', // Warm Gold highlight for score
  },
  mistakeValue: {
    color: '#EF4444', // Red for mistake alert
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 78,
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  hintBtnDisabled: {
    backgroundColor: '#334155',
    borderColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  hintBtnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  hintBtnIcon: {
    fontSize: 14,
  },
  hintBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#081325', // High-contrast navy on gold
    letterSpacing: 0.4,
  },
});
