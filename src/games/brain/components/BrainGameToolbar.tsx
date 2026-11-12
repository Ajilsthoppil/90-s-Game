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
import { BrainGameDifficultySelector } from './BrainGameDifficultySelector';

export interface BrainGameToolbarProps {
  leftElement?: React.ReactNode;
  centerElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  // Standard integrated controls:
  difficulty?: BrainDifficulty;
  onSelectDifficulty?: (diff: BrainDifficulty) => void;
  supportsDifficulty?: boolean;
  difficultyVariant?: 'dropdown' | 'segmented';
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  isPaused?: boolean;
  onPause?: () => void;
  onOpenSettings?: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const BrainGameToolbar: React.FC<BrainGameToolbarProps> = ({
  leftElement,
  centerElement,
  rightElement,
  difficulty,
  onSelectDifficulty,
  supportsDifficulty = true,
  difficultyVariant = 'dropdown',
  soundEnabled = true,
  onToggleSound,
  isPaused = false,
  onPause,
  onOpenSettings,
  children,
  style,
}) => {
  return (
    <View style={[styles.toolbar, style]}>
      {children ? (
        children
      ) : (
        <View style={styles.row}>
          {/* Left Element / Integrated Difficulty Selector */}
          <View style={styles.leftCol}>
            {leftElement ? (
              leftElement
            ) : supportsDifficulty && difficulty && onSelectDifficulty ? (
              <BrainGameDifficultySelector
                current={difficulty}
                onSelect={onSelectDifficulty}
                variant={difficultyVariant}
              />
            ) : null}
          </View>

          {/* Optional Center Element */}
          {centerElement ? (
            <View style={styles.centerCol}>{centerElement}</View>
          ) : null}

          {/* Right Column: Custom Right Element OR Standard Secondary Controls */}
          <View style={styles.rightCol}>
            {rightElement ? (
              rightElement
            ) : (
              <View style={styles.secondaryControlsRow}>
                {onOpenSettings ? (
                  <Pressable
                    onPress={onOpenSettings}
                    accessibilityRole="button"
                    accessibilityLabel="Game rules and settings"
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={({ pressed }) => [
                      styles.ctrlBtn,
                      pressed && styles.ctrlBtnPressed,
                    ]}
                  >
                    <Text style={styles.ctrlIcon}>⚙️</Text>
                  </Pressable>
                ) : null}

                {onToggleSound ? (
                  <Pressable
                    onPress={onToggleSound}
                    accessibilityRole="button"
                    accessibilityLabel={
                      soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'
                    }
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={({ pressed }) => [
                      styles.ctrlBtn,
                      !soundEnabled && styles.ctrlBtnMuted,
                      pressed && styles.ctrlBtnPressed,
                    ]}
                  >
                    <Text style={styles.ctrlIcon}>
                      {soundEnabled ? '🔊' : '🔇'}
                    </Text>
                  </Pressable>
                ) : null}

                {onPause ? (
                  <Pressable
                    onPress={onPause}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPaused ? 'Resume game' : 'Pause game'
                    }
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={({ pressed }) => [
                      styles.ctrlBtn,
                      isPaused && styles.ctrlBtnPaused,
                      pressed && styles.ctrlBtnPressed,
                    ]}
                  >
                    <Text style={styles.ctrlIcon}>
                      {isPaused ? '▶️' : '⏸️'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: '#0E223D',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 10,
    marginVertical: 4,
    minHeight: 52,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 6,
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctrlBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    backgroundColor: '#0A1B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  ctrlBtnMuted: {
    borderColor: '#334155',
    backgroundColor: '#071220',
  },
  ctrlBtnPaused: {
    borderColor: '#F59E0B',
    backgroundColor: '#1E293B',
  },
  ctrlBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },
  ctrlIcon: {
    fontSize: 16,
  },
});
