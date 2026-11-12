import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { THEME } from '../theme/theme';
import { useResponsiveLayout, ResponsiveLayoutState } from '../theme/layout';
import { GameScreenHeader, GameScreenHeaderProps } from './GameScreenHeader';

export interface ResponsiveGameContainerProps {
  gameId: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onExit: () => void;
  exitLabel?: string;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenRules?: () => void;
  onOpenSettings?: () => void;
  hideHeader?: boolean;
  customHeader?: React.ReactNode;
  children:
    | React.ReactNode
    | ((layout: ResponsiveLayoutState) => React.ReactNode);
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const ResponsiveGameContainer: React.FC<ResponsiveGameContainerProps> = ({
  gameId,
  title,
  subtitle,
  badge,
  onExit,
  exitLabel,
  soundEnabled,
  onToggleSound,
  onOpenRules,
  onOpenSettings,
  hideHeader = false,
  customHeader,
  children,
  style,
  contentStyle,
}) => {
  const layout = useResponsiveLayout();
  const [showOrientationHint, setShowOrientationHint] = useState(true);

  const policy = layout.getGamePolicy(gameId);
  const isLandscapePreferred = policy === 'LANDSCAPE_PRIORITY';
  const isPortraitPreferred = policy === 'PORTRAIT_PRIORITY' || policy === 'PORTRAIT_ONLY';

  const needsLandscapeHint = isLandscapePreferred && layout.isPortrait && showOrientationHint;
  const needsPortraitHint = isPortraitPreferred && layout.isLandscape && showOrientationHint;

  return (
    <SafeAreaView style={[styles.safeContainer, style]}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.colors.paperDarker} />

      {/* Header: Unified single header */}
      {!hideHeader &&
        (customHeader || (
          <GameScreenHeader
            title={title}
            subtitle={subtitle}
            badge={badge}
            onExit={onExit}
            exitLabel={exitLabel}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            onOpenRules={onOpenRules}
            onOpenSettings={onOpenSettings}
          />
        ))}

      {/* Non-intrusive Orientation Hint Banner if orientation is suboptimal */}
      {needsLandscapeHint ? (
        <View style={styles.hintBanner}>
          <Text style={styles.hintBannerText}>
            🔄 Tip: Rotate to Landscape for the largest board view
          </Text>
          <Pressable
            onPress={() => setShowOrientationHint(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.hintBannerDismiss}
          >
            <Text style={styles.hintBannerDismissText}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {needsPortraitHint ? (
        <View style={styles.hintBanner}>
          <Text style={styles.hintBannerText}>
            🔄 Tip: Rotate to Portrait for standard puzzle view
          </Text>
          <Pressable
            onPress={() => setShowOrientationHint(false)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.hintBannerDismiss}
          >
            <Text style={styles.hintBannerDismissText}>✕</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Main Content Area - Preserves Children across rotation */}
      <View
        style={[
          styles.contentArea,
          { paddingBottom: layout.bottomNavInset },
          contentStyle,
        ]}
      >
        {typeof children === 'function' ? children(layout) : children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: THEME.colors.paperDarker,
  },
  contentArea: {
    flex: 1,
    backgroundColor: THEME.colors.paper,
    overflow: 'hidden',
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 15,
  },
  hintBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.goldBright,
  },
  hintBannerDismiss: {
    paddingLeft: 8,
    paddingVertical: 2,
  },
  hintBannerDismissText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.goldBright,
  },
});
