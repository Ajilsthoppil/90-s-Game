import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { PlayerProfile } from '../types';
import { THEME } from '../theme/theme';
import { HandDrawnButton } from './HandDrawnButton';

const AVATAR_STICKERS = ['🎒', '⚡', '🏏', '🐘', '🥥', '🚲', '📜', '⛵', '🌴', '⚽', '👑', '⭐', '👾', '🔥', '⚔️'];

interface ProfileEditModalProps {
  visible: boolean;
  profile: PlayerProfile;
  onSave: (updated: PlayerProfile) => void;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  visible,
  profile,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(profile.name);
  const [nickname, setNickname] = useState(profile.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar || '⚡');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...profile,
      name: name.trim(),
      nickname: nickname.trim(),
      avatar: selectedAvatar,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>⚡ EDIT PLAYER PROFILE</Text>
          <Text style={styles.subtitle}>
            Customize your Anime Gamer handle & avatar.
          </Text>

          {/* Name input */}
          <Text style={styles.label}>PLAYER NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ajil"
            placeholderTextColor={THEME.colors.pencilLight}
          />

          {/* Nickname input */}
          <Text style={styles.label}>GAMER TAG / NICKNAME</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. Ajju_Pro"
            placeholderTextColor={THEME.colors.pencilLight}
          />

          {/* Avatar / Sticker picker */}
          <Text style={styles.label}>CHOOSE AVATAR BADGE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickerRowContainer}
            style={styles.stickerRow}
          >
            {AVATAR_STICKERS.map((sticker) => {
              const isSelected = sticker === selectedAvatar;
              return (
                <Pressable
                  key={sticker}
                  onPress={() => setSelectedAvatar(sticker)}
                  style={[
                    styles.stickerItem,
                    isSelected && styles.stickerSelected,
                  ]}
                >
                  <Text style={styles.stickerText}>{sticker}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <HandDrawnButton
              title="CANCEL"
              variant="secondary"
              onPress={onClose}
              size="small"
              style={{ flex: 1 }}
            />
            <HandDrawnButton
              title="SAVE PROFILE"
              variant="primary"
              onPress={handleSave}
              size="small"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 15, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: THEME.colors.cyanBright,
    padding: 22,
    ...THEME.shadows.neonGlowCyan,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.cyanBright,
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: THEME.colors.pencilGrey,
    marginBottom: 16,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '900',
    color: THEME.colors.ink,
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.ink,
  },
  stickerRow: {
    marginVertical: 10,
  },
  stickerRowContainer: {
    gap: 8,
  },
  stickerItem: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: THEME.colors.paperBorder,
    backgroundColor: THEME.colors.paperLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerSelected: {
    backgroundColor: THEME.colors.cyanGlow,
    borderColor: THEME.colors.cyanBright,
    borderWidth: 2.5,
    ...THEME.shadows.neonGlowCyan,
  },
  stickerText: {
    fontSize: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
});
