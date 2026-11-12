import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';
import { soundService } from '../../../audio/soundService';

const PRESET_REACTIONS = [
  '😂 Lucky!',
  '😡 Revenge!',
  '🤣 No way!',
  '🤨 Suspicious!',
  '😭 I was one number away!',
  '🔥 Next round!',
  '👑 Champion!',
];

interface WinnerModalProps {
  visible: boolean;
  winnerName: string;
  winnerNickname?: string;
  winnerAvatar?: string;
  roomId: string;
  matchNumber: number;
  totalCalls: number;
  onRevengeRound: () => void;
  onPlayAgain: () => void;
  onExitRoom: () => void;
  onViewWinnerBoard?: () => void;
  onReportIssue?: () => void;
  reportSuccessMsg?: string | null;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  visible,
  winnerName,
  winnerNickname,
  winnerAvatar = '🎒',
  roomId,
  matchNumber,
  totalCalls,
  onRevengeRound,
  onPlayAgain,
  onExitRoom,
  onViewWinnerBoard,
  onReportIssue,
  reportSuccessMsg,
}) => {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [sentReactions, setSentReactions] = useState<string[]>([]);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      soundService.playBingoSuccess();
      scaleAnim.setValue(0.85);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSendReaction = (reaction: string) => {
    setSelectedReaction(reaction);
    setSentReactions([reaction, ...sentReactions]);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          {/* Confetti & Trophy Header */}
          <Text style={styles.confettiBanner}>🎉 🎈 🎊 📜 🏆</Text>
          <Text style={styles.title}>🏆 BINGO!</Text>

          <View style={styles.winnerBox}>
            <Text style={styles.avatarBig}>{winnerAvatar}</Text>
            <Text style={styles.winnerNameText}>{winnerName} finished first!</Text>
            {winnerNickname ? (
              <Text style={styles.winnerNickname}>"{winnerNickname}"</Text>
            ) : null}
          </View>

          <Text style={styles.statsText}>
            Match #{matchNumber} in Room {roomId} · Won in {totalCalls} calls
          </Text>

          {reportSuccessMsg ? (
            <View style={styles.reportSuccessBox}>
              <Text style={styles.reportSuccessText}>📩 {reportSuccessMsg}</Text>
            </View>
          ) : null}

          {/* Verification & Inspection Actions */}
          <View style={styles.verifyRow}>
            {onViewWinnerBoard && (
              <Pressable onPress={onViewWinnerBoard} style={styles.verifyBtn}>
                <Text style={styles.verifyBtnText}>🎟️ VIEW WINNER BOARD</Text>
              </Pressable>
            )}
            {onReportIssue && (
              <Pressable onPress={onReportIssue} style={styles.reportBtn}>
                <Text style={styles.reportBtnText}>⚠ REPORT ISSUE</Text>
              </Pressable>
            )}
          </View>

          {/* Preset Funny Friend Reactions */}
          <Text style={styles.reactionTitle}>Send Childhood Reaction:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.reactionScroll}
          >
            {PRESET_REACTIONS.map((reaction) => {
              const isSelected = selectedReaction === reaction;
              return (
                <Pressable
                  key={reaction}
                  onPress={() => handleSendReaction(reaction)}
                  style={[
                    styles.reactionPill,
                    isSelected && styles.reactionPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.reactionPillText,
                      isSelected && styles.reactionPillTextSelected,
                    ]}
                  >
                    {reaction}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {sentReactions.length > 0 && (
            <View style={styles.sentBox}>
              <Text style={styles.sentLabel}>Room Reactions:</Text>
              <Text style={styles.sentText}>
                {sentReactions.slice(0, 3).join('  ·  ')}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionColumn}>
            <HandDrawnButton
              title="🔥 REVENGE ROUND"
              variant="accent"
              onPress={onRevengeRound}
              size="medium"
              style={styles.actionBtn}
            />
            <HandDrawnButton
              title="🔄 PLAY AGAIN (New Board)"
              variant="primary"
              onPress={onPlayAgain}
              size="medium"
              style={styles.actionBtn}
            />
            <HandDrawnButton
              title="🏠 EXIT ROOM"
              variant="secondary"
              onPress={onExitRoom}
              size="medium"
              style={styles.actionBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: THEME.colors.borderDark,
    padding: 20,
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  confettiBanner: {
    fontSize: 26,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: THEME.colors.maroon,
    letterSpacing: 2,
    marginBottom: 12,
  },
  winnerBox: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 2,
    borderColor: THEME.colors.mustard,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  avatarBig: {
    fontSize: 40,
    marginBottom: 4,
  },
  winnerNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  winnerNickname: {
    fontSize: 14,
    fontStyle: 'italic',
    color: THEME.colors.maroon,
    marginTop: 2,
  },
  statsText: {
    fontSize: 13,
    color: THEME.colors.pencilLight,
    marginBottom: 8,
    fontWeight: '600',
  },
  reportSuccessBox: {
    backgroundColor: '#D1E7DD',
    borderWidth: 1.5,
    borderColor: '#006633',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  reportSuccessText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006633',
  },
  verifyRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  verifyBtn: {
    flex: 1.2,
    backgroundColor: THEME.colors.mustard,
    borderWidth: 1.5,
    borderColor: THEME.colors.maroon,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
  reportBtn: {
    flex: 1,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.maroon,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  reportBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.maroon,
  },
  reactionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.pencil,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  reactionScroll: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  reactionPill: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  reactionPillSelected: {
    backgroundColor: THEME.colors.mustard,
    borderColor: THEME.colors.maroon,
  },
  reactionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  reactionPillTextSelected: {
    color: THEME.colors.maroon,
  },
  sentBox: {
    backgroundColor: '#FFF2C6',
    borderRadius: 6,
    padding: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.colors.mustard,
  },
  sentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pencilLight,
  },
  sentText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginTop: 2,
  },
  actionColumn: {
    width: '100%',
  },
  actionBtn: {
    marginVertical: 4,
  },
});
