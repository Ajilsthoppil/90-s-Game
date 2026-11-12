import {
  StyleSheet,
  Text,
  View,
  Pressable,
  StyleProp,
  ViewStyle,
  Platform,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { THEME } from '../theme/theme';
import { MIN_TOUCH_TARGET } from '../theme/layout';

export interface GameScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  onExit: () => void;
  exitLabel?: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenRules?: () => void;
  onOpenSettings?: () => void;
  orientationHint?: string;
  rightElement?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GameScreenHeader: React.FC<GameScreenHeaderProps> = ({
  title,
  subtitle,
  badge,
  onExit,
  exitLabel = '← EXIT',
  soundEnabled,
  onToggleSound,
  onOpenRules,
  onOpenSettings,
  orientationHint,
  rightElement,
  style,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const statusBarPadding =
    Platform.OS === 'android'
      ? isLandscape
        ? 0
        : Math.max(32, StatusBar.currentHeight || 32)
      : 0;

  return (
    <View style={[styles.headerContainer, { paddingTop: statusBarPadding + 6 }, style]}>
      {/* Left: Functional Exit / Back Button with 48dp minimum touch target */}
      <Pressable
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel="Exit game"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={({ pressed }) => [
          styles.exitButton,
          pressed && styles.exitButtonPressed,
        ]}
      >
        <Text style={styles.exitButtonText}>{exitLabel}</Text>
      </Pressable>

      {/* Center: Title, optional badge & subtitle */}
      <View style={styles.centerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {orientationHint ? (
          <Text style={styles.orientationHintText} numberOfLines={1}>
            {orientationHint}
          </Text>
        ) : null}
      </View>

      {/* Right Actions: Sound toggle, rules, settings, or custom element */}
      <View style={styles.rightSection}>
        {rightElement ? rightElement : null}

        {onOpenRules ? (
          <Pressable
            onPress={onOpenRules}
            accessibilityRole="button"
            accessibilityLabel="Game rules"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.actionIconButton,
              pressed && styles.actionIconButtonPressed,
            ]}
          >
            <Text style={styles.actionIconText}>📜</Text>
          </Pressable>
        ) : null}

        {onToggleSound !== undefined ? (
          <Pressable
            onPress={onToggleSound}
            accessibilityRole="button"
            accessibilityLabel={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.actionIconButton,
              pressed && styles.actionIconButtonPressed,
            ]}
          >
            <Text style={styles.actionIconText}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </Pressable>
        ) : null}

        {onOpenSettings ? (
          <Pressable
            onPress={onOpenSettings}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => [
              styles.actionIconButton,
              pressed && styles.actionIconButtonPressed,
            ]}
          >
            <Text style={styles.actionIconText}>⚙️</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    minHeight: 52,
    backgroundColor: THEME.colors.paperLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: THEME.colors.cyanBright,
    ...THEME.shadows.neonGlowCyan,
    zIndex: 20,
  },
  exitButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.pinkBright,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exitButtonPressed: {
    opacity: 0.75,
    backgroundColor: THEME.colors.pinkGlow,
  },
  exitButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.pinkBright,
    letterSpacing: 0.5,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 0.5,
  },
  badgeContainer: {
    backgroundColor: THEME.colors.purpleGlow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.purpleBright,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: THEME.colors.purpleBright,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.pencilGrey,
    marginTop: 1,
  },
  orientationHintText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: THEME.colors.goldBright,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconButton: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 8,
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconButtonPressed: {
    opacity: 0.75,
    backgroundColor: THEME.colors.cyanGlow,
    borderColor: THEME.colors.cyanBright,
  },
  actionIconText: {
    fontSize: 16,
  },
});
