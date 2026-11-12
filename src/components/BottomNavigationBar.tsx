import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';

export type BottomTabType = 'HOME' | 'GAMES' | 'PROFILE';

export interface BottomNavigationBarProps {
  activeTab: BottomTabType;
  onTabChange: (tab: BottomTabType) => void;
}

interface TabConfig {
  id: BottomTabType;
  label: string;
  accentColor: string;
  capsuleBg: string;
  glowColor: string;
  dotColor: string;
  cutoutActive: string;
}

// ---------------------------------------------------------
// Pixel-Perfect Vector Icons Matching Reference Silhouettes
// ---------------------------------------------------------

interface IconProps {
  color: string;
  cutoutColor: string;
  isCompact?: boolean;
}

/**
 * Solid House Silhouette: Peaked roof with eaves overhang,
 * solid base, and vertical doorway cutout.
 */
const HomeIcon: React.FC<IconProps> = ({ color, cutoutColor, isCompact }) => {
  const roofW = isCompact ? 18 : 22;
  const roofH = isCompact ? 7.5 : 9;
  const bodyW = isCompact ? 12 : 14;
  const bodyH = isCompact ? 8 : 9.5;
  const doorW = isCompact ? 3.5 : 4.5;
  const doorH = isCompact ? 4.5 : 5.5;

  return (
    <View style={[iconStyles.iconWrapper, { height: roofH + bodyH - 1 }]}>
      {/* Pitched Roof Triangle */}
      <View style={{ width: roofW, height: roofH, alignItems: 'center', overflow: 'hidden' }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: roofW / 2,
            borderRightWidth: roofW / 2,
            borderBottomWidth: roofH,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: color,
          }}
        />
      </View>
      {/* House Body */}
      <View
        style={{
          width: bodyW,
          height: bodyH,
          backgroundColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          alignItems: 'center',
          justifyContent: 'flex-end',
          marginTop: -0.5,
        }}
      >
        {/* Doorway Cutout */}
        <View
          style={{
            width: doorW,
            height: doorH,
            backgroundColor: cutoutColor,
            borderTopLeftRadius: 1.5,
            borderTopRightRadius: 1.5,
          }}
        />
      </View>
    </View>
  );
};

/**
 * Gamepad Silhouette: Classic console controller body with
 * top shoulder bumpers, left D-pad cutout, and right action buttons.
 */
const GamepadIcon: React.FC<IconProps> = ({ color, cutoutColor, isCompact }) => {
  const ctrlW = isCompact ? 20 : 23;
  const ctrlH = isCompact ? 11 : 13;
  const bumperW = isCompact ? 3.5 : 4.5;

  return (
    <View style={[iconStyles.iconWrapper, { height: ctrlH + 2 }]}>
      {/* Shoulder Bumpers */}
      <View style={{ width: ctrlW - 4, flexDirection: 'row', justifyContent: 'space-between', marginBottom: -0.5 }}>
        <View
          style={{
            width: bumperW,
            height: 1.8,
            borderTopLeftRadius: 1.5,
            borderTopRightRadius: 1.5,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            width: bumperW,
            height: 1.8,
            borderTopLeftRadius: 1.5,
            borderTopRightRadius: 1.5,
            backgroundColor: color,
          }}
        />
      </View>

      {/* Main Controller Body */}
      <View
        style={{
          width: ctrlW,
          height: ctrlH,
          borderRadius: 5,
          backgroundColor: color,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 3,
        }}
      >
        {/* Left D-pad (Cutout plus) */}
        <View style={{ width: 6, height: 6, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 6, height: 2, borderRadius: 0.5, backgroundColor: cutoutColor }} />
          <View style={{ width: 2, height: 6, borderRadius: 0.5, backgroundColor: cutoutColor, position: 'absolute' }} />
        </View>

        {/* Center Select / Start Slits */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 1.8, height: 1.2, borderRadius: 0.6, backgroundColor: cutoutColor, marginRight: 1.5 }} />
          <View style={{ width: 1.8, height: 1.2, borderRadius: 0.6, backgroundColor: cutoutColor }} />
        </View>

        {/* Right Action Buttons */}
        <View style={{ width: 6, height: 6, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: cutoutColor, marginBottom: 1 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 6 }}>
            <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: cutoutColor }} />
            <View style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: cutoutColor }} />
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * Profile Silhouette: Classic user bust with circular head
 * and rounded shoulders body.
 */
const ProfileIcon: React.FC<IconProps> = ({ color, isCompact }) => {
  const headSize = isCompact ? 7.5 : 9;
  const bustW = isCompact ? 14 : 17;
  const bustH = isCompact ? 6.5 : 8;

  return (
    <View style={[iconStyles.iconWrapper, { height: headSize + bustH + 2 }]}>
      {/* Head */}
      <View
        style={{
          width: headSize,
          height: headSize,
          borderRadius: headSize / 2,
          backgroundColor: color,
          marginBottom: 2,
        }}
      />
      {/* Torso / Shoulders Bust */}
      <View
        style={{
          width: bustW,
          height: bustH,
          borderTopLeftRadius: bustW / 2,
          borderTopRightRadius: bustW / 2,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

const iconStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});

// ---------------------------------------------------------
// Tab Configurations (Colors matching reference design)
// ---------------------------------------------------------

const TABS: TabConfig[] = [
  {
    id: 'HOME',
    label: 'Home',
    accentColor: '#38BDF8', // Cyan / Sky Blue
    capsuleBg: 'rgba(14, 165, 233, 0.22)',
    glowColor: '#38BDF8',
    dotColor: '#38BDF8',
    cutoutActive: '#082544',
  },
  {
    id: 'GAMES',
    label: 'Games',
    accentColor: '#C084FC', // Purple / Violet
    capsuleBg: 'rgba(168, 85, 247, 0.22)',
    glowColor: '#A855F7',
    dotColor: '#C084FC',
    cutoutActive: '#26123D',
  },
  {
    id: 'PROFILE',
    label: 'Profile',
    accentColor: '#34D399', // Emerald Green
    capsuleBg: 'rgba(16, 185, 129, 0.22)',
    glowColor: '#10B981',
    dotColor: '#34D399',
    cutoutActive: '#0B2B1E',
  },
];

// ---------------------------------------------------------
// Main Modernized Bottom Navigation Component
// ---------------------------------------------------------

export const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const TabButton: React.FC<{ tab: TabConfig }> = ({ tab }) => {
    const isActive = activeTab === tab.id;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.94,
        useNativeDriver: true,
        friction: 6,
        tension: 300,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 250,
      }).start();
    };

    // Color definitions based on state
    const iconColor = isActive ? '#FFFFFF' : '#64748B';
    const labelColor = isActive ? '#FFFFFF' : '#64748B';
    const cutoutColor = isActive ? tab.cutoutActive : '#07152B';

    return (
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.tabSlot]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onTabChange(tab.id)}
          style={[
            styles.tabCapsule,
            isLandscape && styles.tabCapsuleLandscape,
            isActive
              ? [
                  styles.tabCapsuleActive,
                  {
                    backgroundColor: tab.capsuleBg,
                    borderColor: tab.accentColor,
                    shadowColor: tab.glowColor,
                  },
                ]
              : styles.tabCapsuleInactive,
          ]}
        >
          {/* Subtle Top Edge Glow Accent (Reference feature) */}
          {isActive && (
            <View
              style={[
                styles.topAccentLine,
                { backgroundColor: tab.accentColor },
              ]}
            />
          )}

          {/* Crisp Vector Icon */}
          <View style={styles.iconContainer}>
            {tab.id === 'HOME' && (
              <HomeIcon
                color={iconColor}
                cutoutColor={cutoutColor}
                isCompact={isLandscape}
              />
            )}
            {tab.id === 'GAMES' && (
              <GamepadIcon
                color={iconColor}
                cutoutColor={cutoutColor}
                isCompact={isLandscape}
              />
            )}
            {tab.id === 'PROFILE' && (
              <ProfileIcon
                color={iconColor}
                cutoutColor={cutoutColor}
                isCompact={isLandscape}
              />
            )}
          </View>

          {/* Label */}
          <Text
            style={[
              styles.labelText,
              isActive ? styles.labelActive : styles.labelInactive,
              { color: labelColor },
            ]}
          >
            {tab.label}
          </Text>

          {/* Active Dot Indicator directly below label (Reference feature) */}
          <View
            style={[
              styles.activeDot,
              isActive && {
                backgroundColor: tab.dotColor,
                shadowColor: tab.dotColor,
              },
              !isActive && styles.activeDotHidden,
            ]}
          />
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.outerWrapper, isLandscape && styles.outerWrapperLandscape]}>
      <View
        style={[
          styles.dockContainer,
          isLandscape && styles.dockContainerLandscape,
        ]}
      >
        {TABS.map((tab) => (
          <TabButton key={tab.id} tab={tab} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: '#050D1A',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'android' ? 10 : 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerWrapperLandscape: {
    paddingHorizontal: 24,
    paddingBottom: 6,
    paddingTop: 2,
  },
  dockContainer: {
    width: '100%',
    height: 68,
    backgroundColor: '#07152B',
    borderRadius: 30,
    borderWidth: 1.2,
    borderColor: '#132B4F',
    paddingHorizontal: 6,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  dockContainerLandscape: {
    maxWidth: 440,
    height: 58,
    borderRadius: 26,
    paddingVertical: 4,
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    marginHorizontal: 3,
  },
  tabCapsule: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  tabCapsuleLandscape: {
    borderRadius: 18,
    paddingVertical: 3,
  },
  tabCapsuleInactive: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  tabCapsuleActive: {
    ...(Platform.OS === 'ios'
      ? {
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.55,
          shadowRadius: 8,
        }
      : {}),
  },
  topAccentLine: {
    position: 'absolute',
    top: 0,
    width: 26,
    height: 2,
    borderRadius: 1,
    opacity: 0.85,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 22,
  },
  labelText: {
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 1,
  },
  labelInactive: {
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '800',
  },
  activeDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    marginTop: 3,
    ...(Platform.OS === 'ios'
      ? {
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 3,
        }
      : {}),
  },
  activeDotHidden: {
    opacity: 0,
  },
});
