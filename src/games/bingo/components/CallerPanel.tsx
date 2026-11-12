import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { GameSettings } from '../../../types';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';

interface CallerPanelProps {
  currentTurnPlayerId: string;
  currentTurnPlayerName: string;
  isLocalTurn: boolean;
  currentNumber: number | null;
  calledNumbers: number[];
  maxNumber?: number;
  onCallNext: (specificNumber?: number) => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  isFinished: boolean;
  selectedNumToCall?: number | null;
  onClearSelectedNumToCall?: () => void;
}

export const CallerPanel: React.FC<CallerPanelProps> = ({
  currentTurnPlayerId,
  currentTurnPlayerName,
  isLocalTurn,
  currentNumber,
  calledNumbers,
  maxNumber = 25,
  onCallNext,
  settings,
  onUpdateSettings,
  isFinished,
  selectedNumToCall: externalSelectedNumToCall = null,
  onClearSelectedNumToCall,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [activeNumToCall, setActiveNumToCall] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const calledSet = new Set(calledNumbers);

  // Clear timer on unmount or reset
  useEffect(() => {
    return () => {
      clearConfirmationTimer();
    };
  }, []);

  // Handle external number selection from direct board cell tap
  useEffect(() => {
    if (externalSelectedNumToCall !== null && isLocalTurn && !isFinished) {
      if (!calledSet.has(externalSelectedNumToCall)) {
        startConfirmationTimer(externalSelectedNumToCall);
      }
    } else if (externalSelectedNumToCall === null) {
      clearConfirmationTimer();
      setActiveNumToCall(null);
    }
  }, [externalSelectedNumToCall, isLocalTurn, isFinished]);

  // Reset selection if turn changes away from local player
  useEffect(() => {
    if (!isLocalTurn) {
      clearConfirmationTimer();
      setActiveNumToCall(null);
      onClearSelectedNumToCall?.();
    }
  }, [isLocalTurn]);

  const clearConfirmationTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startConfirmationTimer = (num: number) => {
    clearConfirmationTimer();
    setActiveNumToCall(num);
    setCountdown(3);

    let currentSeconds = 3;
    timerRef.current = setInterval(() => {
      currentSeconds -= 1;
      setCountdown(currentSeconds);

      if (currentSeconds <= 0) {
        clearConfirmationTimer();
        onCallNext(num);
        setActiveNumToCall(null);
        onClearSelectedNumToCall?.();
      }
    }, 1000);
  };

  const handleConfirmImmediate = () => {
    if (activeNumToCall !== null) {
      const num = activeNumToCall;
      clearConfirmationTimer();
      setActiveNumToCall(null);
      onClearSelectedNumToCall?.();
      onCallNext(num);
    }
  };

  const handleCancelCall = () => {
    clearConfirmationTimer();
    setActiveNumToCall(null);
    onClearSelectedNumToCall?.();
  };

  const toggleVoice = () => {
    onUpdateSettings({ ...settings, voiceEnabled: !settings.voiceEnabled });
  };

  const toggleSFX = () => {
    onUpdateSettings({ ...settings, soundEffectsEnabled: !settings.soundEffectsEnabled });
  };

  const toggleMarkingStyle = () => {
    onUpdateSettings({
      ...settings,
      markingStyle: settings.markingStyle === 'pencil' ? 'pen' : 'pencil',
    });
  };

  return (
    <View style={styles.container}>
      {/* 1. Turn & Caller Header Banner */}
      <View style={[styles.turnBanner, isLocalTurn ? styles.turnBannerLocal : styles.turnBannerOpponent]}>
        <Text style={styles.turnTitle}>
          {isLocalTurn ? '📣 YOUR TURN TO CALL' : `🤖 ${currentTurnPlayerName.toUpperCase()}'S TURN`}
        </Text>
        <Text style={styles.turnSubtext}>
          {isLocalTurn
            ? 'Tap any uncalled number directly on your board'
            : `${currentTurnPlayerName} is choosing a number...`}
        </Text>
      </View>

      {/* 2. Dominant Last Called Number Card */}
      <View style={styles.currentNumberCard}>
        <Text style={styles.currentNumberLabel}>LAST CALLED NUMBER</Text>
        <Text style={styles.currentNumberValue}>
          {currentNumber !== null ? `# ${currentNumber}` : '--'}
        </Text>
        <View style={styles.callerMetaRow}>
          <Text style={styles.callCountText}>
            Called: {calledNumbers.length} / {maxNumber}
          </Text>
          <Pressable onPress={() => setIsHistoryOpen(true)} style={styles.compactHistoryBtn}>
            <Text style={styles.compactHistoryBtnText}>📋 History ({calledNumbers.length}) ›</Text>
          </Pressable>
        </View>
      </View>

      {/* Bot Thinking Card (Visible ONLY during Bot turn - ZERO buttons!) */}
      {!isLocalTurn && !isFinished && (
        <View style={styles.botThinkingCard}>
          <Text style={styles.botThinkingTitle}>🤖 {currentTurnPlayerName} is thinking...</Text>
          <Text style={styles.botThinkingDesc}>Selecting a legal number automatically. Please wait.</Text>
        </View>
      )}

      {/* Audio & Settings Control */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => setShowSettings(!showSettings)}
          style={styles.settingsToggle}
        >
          <Text style={styles.settingsToggleText}>
            ⚙️ Audio: {settings.voiceEnabled ? '🔊 ON' : '🔇 OFF'} | Style: {settings.markingStyle === 'pencil' ? '✏️ Pencil' : '🖊️ Pen'}
          </Text>
        </Pressable>
      </View>

      {showSettings && (
        <View style={styles.settingsBox}>
          <Text style={styles.settingsHeader}>Audio & Marking Preferences</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Voice Announcement (TTS):</Text>
            <Pressable
              onPress={toggleVoice}
              style={[
                styles.toggleBtn,
                settings.voiceEnabled && styles.toggleBtnActive,
              ]}
            >
              <Text style={styles.toggleBtnText}>
                {settings.voiceEnabled ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sound Effects (SFX):</Text>
            <Pressable
              onPress={toggleSFX}
              style={[
                styles.toggleBtn,
                settings.soundEffectsEnabled && styles.toggleBtnActive,
              ]}
            >
              <Text style={styles.toggleBtnText}>
                {settings.soundEffectsEnabled ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Marking Tool Style:</Text>
            <Pressable onPress={toggleMarkingStyle} style={styles.styleBtn}>
              <Text style={styles.styleBtnText}>
                {settings.markingStyle === 'pencil' ? '✏️ Pencil Mode' : '🖊️ Pen Mode'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 4. 3-Second Confirmation Modal */}
      <Modal
        visible={activeNumToCall !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelCall}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>CALL NUMBER?</Text>

            <View style={styles.bigNumCircle}>
              <Text style={styles.bigNumText}>#{activeNumToCall}</Text>
            </View>

            <Text style={styles.confirmSubtext}>
              Call number {activeNumToCall} globally for all players?
            </Text>

            <View style={styles.timerBadge}>
              <Text style={styles.timerBadgeText}>⏱️ Auto-calling in {countdown}s...</Text>
            </View>

            <View style={styles.confirmActionRow}>
              <HandDrawnButton
                title="CANCEL"
                variant="disabled"
                onPress={handleCancelCall}
                size="medium"
                style={{ flex: 1, marginRight: 6 }}
              />
              <HandDrawnButton
                title={`CALL #${activeNumToCall} 🔊`}
                variant="primary"
                onPress={handleConfirmImmediate}
                size="medium"
                style={{ flex: 1.3, marginLeft: 6 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Called Number Timeline History Modal */}
      <Modal
        visible={isHistoryOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsHistoryOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>📋 CALLED NUMBER HISTORY</Text>
            <Text style={styles.historySubtext}>
              Called sequence timeline ({calledNumbers.length} / {maxNumber}):
            </Text>

            <ScrollView style={styles.historyScroll}>
              {calledNumbers.length === 0 ? (
                <Text style={styles.emptyHistoryText}>No numbers called yet.</Text>
              ) : (
                <View style={styles.historyGrid}>
                  {calledNumbers.map((num, idx) => (
                    <View key={`hist-${idx}-${num}`} style={styles.historyChip}>
                      <Text style={styles.historyChipOrder}>{idx + 1}.</Text>
                      <Text style={styles.historyChipNum}>#{num}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <HandDrawnButton
              title="CLOSE"
              variant="secondary"
              onPress={() => setIsHistoryOpen(false)}
              size="medium"
              style={{ width: '100%', marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    padding: 12,
    marginVertical: 10,
    ...THEME.shadows.handDrawn,
  },
  turnBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    marginBottom: 10,
    alignItems: 'center',
  },
  turnBannerLocal: {
    backgroundColor: THEME.colors.keralaGreen,
  },
  turnBannerOpponent: {
    backgroundColor: THEME.colors.mustard,
  },
  turnTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  turnSubtext: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 2,
  },
  currentNumberCard: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 2,
    borderColor: THEME.colors.maroon,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  currentNumberLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.maroon,
    letterSpacing: 1,
  },
  currentNumberValue: {
    fontSize: 44,
    fontWeight: '900',
    color: THEME.colors.pencil,
    marginTop: 2,
  },
  callerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.notebookBlue,
  },
  callCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pencilLight,
  },
  compactHistoryBtn: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compactHistoryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  selectorContainer: {
    backgroundColor: THEME.colors.paperLight,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    padding: 10,
    marginBottom: 10,
  },
  selectorTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.maroon,
    marginBottom: 2,
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-start',
    marginTop: 6,
  },
  selectorKey: {
    width: 38,
    height: 34,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.paperCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorKeyDisabled: {
    backgroundColor: '#E0E0E0',
    borderColor: '#BBB',
  },
  selectorKeyText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  selectorKeyTextDisabled: {
    color: '#999',
  },
  botThinkingCard: {
    backgroundColor: THEME.colors.paperLight,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  botThinkingTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.maroon,
    marginBottom: 4,
  },
  botThinkingDesc: {
    fontSize: 12,
    color: THEME.colors.pencilLight,
    fontStyle: 'italic',
  },
  headerRow: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  settingsToggle: {
    backgroundColor: THEME.colors.paperLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
  },
  settingsToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  settingsBox: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  settingsHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.pencil,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.disabled,
  },
  toggleBtnActive: {
    backgroundColor: THEME.colors.keralaGreen,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  styleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.mustard,
  },
  styleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: THEME.colors.borderDark,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.maroon,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bigNumCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 3,
    borderColor: THEME.colors.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  bigNumText: {
    fontSize: 32,
    fontWeight: '900',
    color: THEME.colors.pencil,
  },
  confirmSubtext: {
    fontSize: 13,
    color: THEME.colors.pencil,
    textAlign: 'center',
    marginBottom: 12,
  },
  timerBadge: {
    backgroundColor: THEME.colors.mustard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    marginBottom: 16,
  },
  timerBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
  confirmActionRow: {
    flexDirection: 'row',
    width: '100%',
  },
  historyCard: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: THEME.colors.borderDark,
    padding: 18,
    width: '100%',
    maxHeight: '80%',
    ...THEME.shadows.handDrawn,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.maroon,
    marginBottom: 4,
  },
  historySubtext: {
    fontSize: 12,
    color: THEME.colors.pencilLight,
    marginBottom: 10,
  },
  historyScroll: {
    maxHeight: 280,
  },
  emptyHistoryText: {
    fontSize: 13,
    color: THEME.colors.pencilLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  historyChipOrder: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.pencilLight,
    marginRight: 4,
  },
  historyChipNum: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.maroon,
  },
});

