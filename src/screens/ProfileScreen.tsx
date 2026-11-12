import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  Switch,
  Animated,
  Easing,
} from 'react-native';
import { PlayerProfile, GameSettings } from '../types';
import { localGameRepository, DEFAULT_PROFILE, DEFAULT_SETTINGS } from '../storage/LocalGameRepository';
import { ProfileEditModal } from '../components/ProfileEditModal';

interface ProfileScreenProps {
  onBackToHome?: () => void;
}

const CHIBI_AVATARS = ['⚡', '🎒', '🦊', '⚔️', '👑', '🐉', '🌸', '🎮', '🍙', '🐱', '🎯', '🔥'];

export const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const [profile, setProfile] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Animations
  const avatarGlowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadProfileAndSettings();

    // Looping avatar aura pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlowAnim, {
          toValue: 1.08,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(avatarGlowAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadProfileAndSettings = async () => {
    const loadedProf = await localGameRepository.getProfile();
    const loadedSet = await localGameRepository.getSettings();
    setProfile(loadedProf);
    setSettings(loadedSet);
  };

  const handleSaveProfile = async (updated: PlayerProfile) => {
    setProfile(updated);
    await localGameRepository.saveProfile(updated);
  };

  const handleSaveSettings = async (updated: GameSettings) => {
    setSettings(updated);
    await localGameRepository.saveSettings(updated);
  };

  const handleSelectQuickAvatar = async (avatar: string) => {
    const updated = { ...profile, avatar };
    setProfile(updated);
    await localGameRepository.saveProfile(updated);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <View style={styles.animeTagRow}>
              <View style={styles.animePulseDot} />
              <Text style={styles.animeTagText}>RETRO ARCADE PASSPORT</Text>
            </View>
            <Text style={styles.headerTitle}>PLAYER PROFILE</Text>
          </View>
          <Pressable onPress={() => setIsSettingsOpen(true)} style={styles.settingsIconBtn}>
            <Text style={styles.settingsIconText}>⚙️ SETTINGS</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Player Profile Card (Clean, no fake levels or points) */}
          <View style={styles.licenseCard}>
            <View style={styles.licenseTopRow}>
              <View style={styles.licenseBadge}>
                <Text style={styles.licenseBadgeText}>✦ PLAYER ID CARD ✦</Text>
              </View>
              <Text style={styles.licenseRegText}>OFFLINE / HOTSPOT</Text>
            </View>

            <View style={styles.avatarRow}>
              {/* Animated Avatar Container */}
              <Animated.View
                style={[
                  styles.avatarWrapper,
                  {
                    transform: [{ scale: avatarGlowAnim }],
                  },
                ]}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{profile.avatar || '🎒'}</Text>
                </View>
              </Animated.View>

              <View style={styles.playerMetaCol}>
                <Text style={styles.displayName}>{profile.name || 'Ajil'}</Text>
                <Text style={styles.nicknameText}>@{profile.nickname || 'ajil_pro'}</Text>

                <View style={styles.titleChipRow}>
                  <View style={styles.titleChip}>
                    <Text style={styles.titleChipText}>CLASSIC GAMER</Text>
                  </View>
                  <View style={[styles.titleChip, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Text style={[styles.titleChipText, { color: '#38BDF8' }]}>READY</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Player Status Strip (Clean, purposeful) */}
            <View style={styles.playerStatusStrip}>
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxNum}>17</Text>
                <Text style={styles.statusBoxLabel}>GAMES</Text>
              </View>
              <View style={styles.statusBoxDivider} />
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxNum}>HOTSPOT</Text>
                <Text style={styles.statusBoxLabel}>LOCAL NET</Text>
              </View>
              <View style={styles.statusBoxDivider} />
              <View style={styles.statusBox}>
                <Text style={styles.statusBoxNum}>OFFLINE</Text>
                <Text style={styles.statusBoxLabel}>PLAY MODE</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <Pressable onPress={() => setIsEditModalOpen(true)} style={styles.editProfileBtn}>
              <Text style={styles.editProfileBtnText}>✏️ EDIT PROFILE & GAMER TAG</Text>
            </Pressable>
          </View>

          {/* Quick Chibi Avatar Selector */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>⚡ CHIBI AVATAR GALLERY</Text>
              <Text style={styles.sectionSubBadge}>TAP TO EQUIP</Text>
            </View>
            <View style={styles.avatarGrid}>
              {CHIBI_AVATARS.map((av) => {
                const isSelected = profile.avatar === av;
                return (
                  <Pressable
                    key={av}
                    onPress={() => handleSelectQuickAvatar(av)}
                    style={[styles.chibiTile, isSelected && styles.chibiTileSelected]}
                  >
                    <Text style={styles.chibiEmoji}>{av}</Text>
                    {isSelected && <View style={styles.chibiActiveDot} />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Arcade Gameplay Record Statistics */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📊 GAMEPLAY RECORD</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { borderColor: '#38BDF8' }]}>
                <Text style={[styles.statVal, { color: '#38BDF8' }]}>142</Text>
                <Text style={styles.statLabel}>GAMES PLAYED</Text>
              </View>
              <View style={[styles.statBox, { borderColor: '#0EA5E9' }]}>
                <Text style={[styles.statVal, { color: '#0EA5E9' }]}>98</Text>
                <Text style={styles.statLabel}>VICTORIES</Text>
              </View>
              <View style={[styles.statBox, { borderColor: '#06B6D4' }]}>
                <Text style={[styles.statVal, { color: '#06B6D4' }]}>69%</Text>
                <Text style={styles.statLabel}>WIN RATE</Text>
              </View>
              <View style={[styles.statBox, { borderColor: '#60A5FA' }]}>
                <Text style={[styles.statVal, { color: '#60A5FA' }]}>1,450</Text>
                <Text style={styles.statLabel}>BRAIN PUZZLES</Text>
              </View>
            </View>
          </View>

          {/* Anime Achievements & Stamps */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🏆 TROPHY CASE & BADGES</Text>

            <View style={styles.achieveCard}>
              <View style={[styles.achieveIconBox, { backgroundColor: 'rgba(255, 208, 0, 0.15)', borderColor: '#FFD000' }]}>
                <Text style={styles.achieveIcon}>🎟️</Text>
              </View>
              <View style={styles.achieveTextCol}>
                <Text style={styles.achieveTitle}>BINGO MASTER</Text>
                <Text style={styles.achieveDesc}>Completed 5 lines in under 15 calls</Text>
              </View>
              <View style={styles.unlockedStamp}>
                <Text style={styles.unlockedStampText}>★ UNLOCKED</Text>
              </View>
            </View>

            <View style={styles.achieveCard}>
              <View style={[styles.achieveIconBox, { backgroundColor: 'rgba(255, 42, 133, 0.15)', borderColor: '#FF2A85' }]}>
                <Text style={styles.achieveIcon}>🃏</Text>
              </View>
              <View style={styles.achieveTextCol}>
                <Text style={styles.achieveTitle}>WILD +4 SLAP</Text>
                <Text style={styles.achieveDesc}>Played Wild Draw Four to win UNO</Text>
              </View>
              <View style={styles.unlockedStamp}>
                <Text style={styles.unlockedStampText}>★ UNLOCKED</Text>
              </View>
            </View>

            <View style={styles.achieveCard}>
              <View style={[styles.achieveIconBox, { backgroundColor: 'rgba(0, 245, 255, 0.15)', borderColor: '#00F5FF' }]}>
                <Text style={styles.achieveIcon}>🎲</Text>
              </View>
              <View style={styles.achieveTextCol}>
                <Text style={styles.achieveTitle}>LUDO CHAMPION</Text>
                <Text style={styles.achieveDesc}>Successfully walked all 4 tokens Home</Text>
              </View>
              <View style={styles.unlockedStamp}>
                <Text style={styles.unlockedStampText}>★ UNLOCKED</Text>
              </View>
            </View>

            <View style={styles.achieveCard}>
              <View style={[styles.achieveIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' }]}>
                <Text style={styles.achieveIcon}>💡</Text>
              </View>
              <View style={styles.achieveTextCol}>
                <Text style={styles.achieveTitle}>CIRCUIT OVERLOAD</Text>
                <Text style={styles.achieveDesc}>Powered every tile in 5×5 circuit puzzle</Text>
              </View>
              <View style={styles.unlockedStamp}>
                <Text style={styles.unlockedStampText}>★ UNLOCKED</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Profile Edit Modal */}
        <ProfileEditModal
          visible={isEditModalOpen}
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsEditModalOpen(false)}
        />

        {/* Anime Game Settings Modal */}
        <Modal visible={isSettingsOpen} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.settingsBox}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>⚙️ GAME SYSTEM SETTINGS</Text>
                <Pressable onPress={() => setIsSettingsOpen(false)} style={styles.settingsCloseBtn}>
                  <Text style={styles.settingsCloseText}>✕</Text>
                </Pressable>
              </View>

              {/* TTS Voice Toggle */}
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Anime Caller Voice (TTS)</Text>
                  <Text style={styles.settingSub}>Announces numbers and calls out loud</Text>
                </View>
                <Switch
                  value={settings.voiceEnabled}
                  trackColor={{ false: '#1A2044', true: '#00F5FF' }}
                  thumbColor={settings.voiceEnabled ? '#FFFFFF' : '#94A3B8'}
                  onValueChange={(val) => handleSaveSettings({ ...settings, voiceEnabled: val })}
                />
              </View>

              {/* Sound Effects Toggle */}
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Sound Effects & Audio</Text>
                  <Text style={styles.settingSub}>Tactile card, dice, and puzzle audio</Text>
                </View>
                <Switch
                  value={settings.soundEffectsEnabled}
                  trackColor={{ false: '#1A2044', true: '#FF2A85' }}
                  thumbColor={settings.soundEffectsEnabled ? '#FFFFFF' : '#94A3B8'}
                  onValueChange={(val) => handleSaveSettings({ ...settings, soundEffectsEnabled: val })}
                />
              </View>

              {/* Marking Style Selector */}
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Board Marking Tool</Text>
                  <Text style={styles.settingSub}>Choose drawing style for Bingo cards</Text>
                </View>
                <View style={styles.styleBtnRow}>
                  <Pressable
                    onPress={() => handleSaveSettings({ ...settings, markingStyle: 'pencil' })}
                    style={[
                      styles.styleChoiceBtn,
                      settings.markingStyle === 'pencil' && styles.styleChoiceActive,
                    ]}
                  >
                    <Text style={styles.styleBtnText}>✏️ Pencil</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSaveSettings({ ...settings, markingStyle: 'pen' })}
                    style={[
                      styles.styleChoiceBtn,
                      settings.markingStyle === 'pen' && styles.styleChoiceActive,
                    ]}
                  >
                    <Text style={styles.styleBtnText}>🖊️ Pen</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={() => setIsSettingsOpen(false)} style={styles.closeSettingsBtn}>
                <Text style={styles.closeSettingsBtnText}>SAVE & CLOSE</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#060E1D',
  },
  container: {
    flex: 1,
    backgroundColor: '#060E1D',
  },
  headerBar: {
    backgroundColor: '#0A1C36',
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: '#16365C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  animeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  animePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  animeTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 0.8,
  },
  settingsIconBtn: {
    backgroundColor: '#0E274A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1D4A7D',
  },
  settingsIconText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
  },
  licenseCard: {
    backgroundColor: '#0C203B',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#1E4472',
    elevation: 4,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 16,
  },
  licenseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#17365C',
    paddingBottom: 8,
  },
  licenseBadge: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  licenseBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#061325',
    letterSpacing: 0.8,
  },
  licenseRegText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#122E54',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  playerMetaCol: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 0.5,
  },
  nicknameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 6,
  },
  titleChipRow: {
    flexDirection: 'row',
  },
  titleChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  titleChipText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  playerStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#091A30',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#163863',
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
  },
  statusBoxNum: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  statusBoxLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#7EA1C4',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusBoxDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#163863',
  },
  editProfileBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#061325',
    letterSpacing: 0.8,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionSubBadge: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chibiTile: {
    width: '15%',
    aspectRatio: 1,
    backgroundColor: '#0C203B',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#183A63',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  chibiTileSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  chibiEmoji: {
    fontSize: 20,
  },
  chibiActiveDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48.5%',
    backgroundColor: '#0C203B',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7EA1C4',
    letterSpacing: 0.5,
  },
  achieveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C203B',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#183A63',
    padding: 10,
    marginBottom: 8,
  },
  achieveIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  achieveIcon: {
    fontSize: 20,
  },
  achieveTextCol: {
    flex: 1,
  },
  achieveTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  achieveDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  unlockedStamp: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  unlockedStampText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#34D399',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  settingsBox: {
    width: '100%',
    backgroundColor: '#0F132B',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#00F5FF',
    padding: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#202754',
    paddingBottom: 10,
  },
  settingsTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  settingsCloseBtn: {
    padding: 4,
  },
  settingsCloseText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '900',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2044',
    paddingBottom: 10,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  settingSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  styleBtnRow: {
    flexDirection: 'row',
  },
  styleChoiceBtn: {
    backgroundColor: '#161C3D',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262F64',
    marginLeft: 6,
  },
  styleChoiceActive: {
    backgroundColor: '#00F5FF',
    borderColor: '#38BDF8',
  },
  styleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  closeSettingsBtn: {
    backgroundColor: '#00F5FF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closeSettingsBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#080915',
    letterSpacing: 0.8,
  },
});
