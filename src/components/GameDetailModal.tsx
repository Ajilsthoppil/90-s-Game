import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { GameDefinition } from '../games/types/game.types';
import { THEME } from '../theme/theme';
import { HandDrawnButton } from './HandDrawnButton';

interface GameDetailModalProps {
  visible: boolean;
  game: GameDefinition | null;
  onPlayWithSystem: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onClose: () => void;
}

export const GameDetailModal: React.FC<GameDetailModalProps> = ({
  visible,
  game,
  onPlayWithSystem,
  onCreateRoom,
  onJoinRoom,
  onClose,
}) => {
  const [showRules, setShowRules] = useState(false);

  if (!game) return null;

  const isBrain = game.gameType === 'brain';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Close Header Button */}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Visual Hero Card */}
            <View style={styles.heroCard}>
              <Text style={styles.heroEmoji}>{game.icon}</Text>
              <Text style={styles.heroTitle}>{game.name}</Text>
              <Text style={styles.heroSubtitle}>{game.subtitle}</Text>
            </View>

            {/* Metadata Chips Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>👥 {game.minPlayers === game.maxPlayers ? `${game.minPlayers} Players` : `${game.minPlayers}–${game.maxPlayers} Players`}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>⚡ {game.difficulty || 'Medium'}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>⏱️ {game.estimatedTime || '10 min'}</Text>
              </View>
              <View style={styles.metaBadge}>
                <Text style={styles.metaBadgeText}>{game.supportsOnline ? '🌐 Online + Offline' : '📡 Offline'}</Text>
              </View>
            </View>

            {/* Description Card */}
            <View style={styles.descBox}>
              <Text style={styles.descTitle}>📖 ABOUT THE GAME</Text>
              <Text style={styles.descText}>{game.description}</Text>
              {game.nostalgiaText ? (
                <Text style={styles.nostalgiaText}>" {game.nostalgiaText} "</Text>
              ) : null}
            </View>

            {/* Rules Accordion Toggle */}
            <Pressable onPress={() => setShowRules(!showRules)} style={styles.rulesToggleBtn}>
              <Text style={styles.rulesToggleText}>
                {showRules ? '📖 HIDE RULES ▲' : '📖 HOW TO PLAY / RULES ▼'}
              </Text>
            </Pressable>

            {showRules && (
              <View style={styles.rulesBodyBox}>
                <Text style={styles.ruleBullet}>• Objective: Complete match conditions to win points or line patterns.</Text>
                <Text style={styles.ruleBullet}>• Turn Order: Take turns in clockwise order or single player puzzle solving.</Text>
                <Text style={styles.ruleBullet}>• Action Validation: Validated locally or by authoritative game rules engine.</Text>
                {isBrain && (
                  <Text style={styles.ruleBullet}>• Hints: Tap 💡 during puzzle play for hints.</Text>
                )}
              </View>
            )}

            {/* Launch Action Buttons */}
            <View style={styles.actionBtnSection}>
              {isBrain ? (
                <HandDrawnButton
                  title="START PUZZLE 🧠"
                  variant="primary"
                  onPress={onPlayWithSystem}
                  style={styles.mainPlayBtn}
                />
              ) : (
                <>
                  <HandDrawnButton
                    title="PLAY VS BOTS 🤖"
                    variant="primary"
                    onPress={onPlayWithSystem}
                    style={styles.mainPlayBtn}
                  />

                  <View style={styles.multiplayerBtnRow}>
                    <HandDrawnButton
                      title="CREATE ROOM 🏠"
                      variant="accent"
                      onPress={onCreateRoom}
                      style={{ flex: 1 }}
                      size="small"
                    />
                    <HandDrawnButton
                      title="JOIN ROOM 🔑"
                      variant="secondary"
                      onPress={onJoinRoom}
                      style={{ flex: 1 }}
                      size="small"
                    />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: THEME.colors.paperCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    maxHeight: '88%',
    paddingTop: 16,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.pencil,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 2,
    borderColor: THEME.colors.cyanBright,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    ...THEME.shadows.handDrawn,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.ink,
    letterSpacing: 0.8,
  },
  heroSubtitle: {
    fontSize: 12,
    color: THEME.colors.pencilGrey,
    textAlign: 'center',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
    justifyContent: 'center',
  },
  metaBadge: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1,
    borderColor: THEME.colors.pencilLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  descBox: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  descTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.pencil,
    marginBottom: 6,
  },
  descText: {
    fontSize: 12,
    color: THEME.colors.pencil,
    lineHeight: 17,
  },
  nostalgiaText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: THEME.colors.maroon,
    marginTop: 8,
    fontWeight: '700',
  },
  rulesToggleBtn: {
    backgroundColor: THEME.colors.mustard,
    borderWidth: 1.5,
    borderColor: THEME.colors.maroon,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  rulesToggleText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
  rulesBodyBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: THEME.colors.mustard,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  ruleBullet: {
    fontSize: 11,
    color: THEME.colors.pencil,
    marginVertical: 3,
  },
  actionBtnSection: {
    marginTop: 10,
    gap: 10,
  },
  mainPlayBtn: {
    width: '100%',
  },
  multiplayerBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
