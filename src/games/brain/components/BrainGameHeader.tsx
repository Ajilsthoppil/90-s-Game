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
import { BrainDifficulty } from '../types/brain.types';

export interface BrainGameHeaderProps {
  title: string;
  categoryBadge?: string;
  level?: number;
  isLevelCompleted?: boolean;
  onBack?: () => void;
  onHome?: () => void; // backwards compatibility
  // Secondary control props preserved for backward compatibility if passed:
  difficulty?: BrainDifficulty;
  onSelectDifficulty?: (diff: BrainDifficulty) => void;
  supportsDifficulty?: boolean;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onPause?: () => void;
  onOpenSettings?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const BrainGameHeader: React.FC<BrainGameHeaderProps> = ({
  title,
  categoryBadge,
  level,
  isLevelCompleted = false,
  onBack,
  onHome,
  style,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const handleBack = onBack || onHome || (() => {});

  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.topRow}>
        {/* Left: Back Button with >=44dp Accessible Target */}
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to game selection"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.backBtnPressed,
          ]}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>

        {/* Center: Game Title & Subtitle Category Badge + Level Indicator */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.titleText,
              isCompact && styles.titleTextCompact,
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {title}
          </Text>
          {categoryBadge || level ? (
            <View style={styles.categorySubRow}>
              {categoryBadge ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{categoryBadge}</Text>
                </View>
              ) : null}
              {level ? (
                <View
                  style={[
                    styles.levelPill,
                    isLevelCompleted && styles.levelPillCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.levelPillText,
                      isLevelCompleted && styles.levelPillTextCompleted,
                    ]}
                  >
                    {isLevelCompleted ? `✓ LEVEL ${level} COMPLETE` : `LEVEL ${level}`}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Right: Symmetry Spacer to keep Title Centered */}
        <View style={styles.headerRightSpacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  backBtn: {
    minHeight: 44,
    minWidth: 70,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    backgroundColor: '#0E223D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
    backgroundColor: '#0D274A',
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8', // Electric Sky Blue
    letterSpacing: 0.4,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  titleTextCompact: {
    fontSize: 14,
  },
  categorySubRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  categoryPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  levelPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    marginLeft: 4,
  },
  levelPillCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  levelPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.6,
  },
  levelPillTextCompleted: {
    color: '#10B981',
  },
  headerRightSpacer: {
    minWidth: 70,
    minHeight: 44,
  },
});
