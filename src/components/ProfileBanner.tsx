import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { PlayerProfile } from '../types';
import { THEME } from '../theme/theme';

interface ProfileBannerProps {
  profile: PlayerProfile;
  onEditPress: () => void;
}

export const ProfileBanner: React.FC<ProfileBannerProps> = ({ profile, onEditPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Anime Gamer Header Badge */}
      <View style={styles.idTagBar}>
        <Text style={styles.idTagText}>⚡ PLAYER PROFILE • RETRO ANIME MATRIX</Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankBadgeText}>RANK #1</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Animated.View style={[styles.avatarBox, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.avatarText}>{profile.avatar || '⚡'}</Text>
        </Animated.View>

        <View style={styles.infoBox}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{profile.name.toUpperCase()}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL 99</Text>
            </View>
          </View>
          {profile.nickname ? (
            <Text style={styles.nicknameText}>⚔️ "{profile.nickname}"</Text>
          ) : (
            <Text style={styles.nicknameText}>🎮 Ready for Battle</Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.editBtn,
            pressed && styles.editBtnPressed,
          ]}
          onPress={onEditPress}
        >
          <Text style={styles.editBtnText}>✏️ EDIT</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.purple,
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 12,
    overflow: 'hidden',
    ...THEME.shadows.notebookCard,
  },
  idTagBar: {
    backgroundColor: THEME.colors.purple,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  rankBadge: {
    backgroundColor: THEME.colors.pink,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  rankBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: THEME.colors.paperLight,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2,
    borderColor: THEME.colors.cyanBright,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...THEME.shadows.neonGlowCyan,
  },
  avatarText: {
    fontSize: 28,
  },
  infoBox: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.colors.ink,
    letterSpacing: 0.8,
  },
  levelBadge: {
    backgroundColor: THEME.colors.gold,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  levelText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  nicknameText: {
    fontSize: 12.5,
    color: THEME.colors.cyanBright,
    fontWeight: '700',
    marginTop: 3,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.cyanBright,
    borderRadius: 10,
  },
  editBtnPressed: {
    opacity: 0.8,
    backgroundColor: THEME.colors.cyanGlow,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 0.5,
  },
});
