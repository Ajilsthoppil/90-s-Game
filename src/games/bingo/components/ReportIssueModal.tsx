import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import { GameDisputeReport, MatchResultSnapshot } from '../../../types';
import { localGameRepository } from '../../../storage/LocalGameRepository';
import { THEME } from '../../../theme/theme';
import { HandDrawnButton } from '../../../components/HandDrawnButton';

interface ReportIssueModalProps {
  visible: boolean;
  snapshot: MatchResultSnapshot | null;
  reportingPlayerId: string;
  reportingPlayerName: string;
  onClose: () => void;
  onReportSubmitted: () => void;
}

const REPORT_REASONS = [
  'Winner board is incorrect',
  'Number marking is wrong',
  'Bingo pattern is wrong',
  'Called number sequence is incorrect',
  'Other issue',
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  visible,
  snapshot,
  reportingPlayerId,
  reportingPlayerName,
  onClose,
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!snapshot) return null;

  const handleSubmitReport = async () => {
    setIsSubmitting(true);

    const report: GameDisputeReport = {
      id: `report_${Date.now()}`,
      matchId: snapshot.matchId,
      reportingPlayerId,
      reportingPlayerName,
      winnerId: snapshot.winnerId,
      winnerName: snapshot.winnerName,
      winnerBoardSnapshot: snapshot.winningBoard,
      calledNumbers: snapshot.calledNumbers,
      playerMarks: snapshot.winningMarks,
      reportReason: selectedReason,
      additionalNotes: notes.trim(),
      createdAt: Date.now(),
    };

    await localGameRepository.saveDisputeReport(report);
    setIsSubmitting(false);
    onReportSubmitted();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.card}>
          <Text style={styles.title}>⚠ REPORT GAME DISPUTE / ISSUE</Text>
          <Text style={styles.subtext}>
            File an official dispute report for Match #{snapshot.matchNumber} ({snapshot.winnerName}'s win):
          </Text>

          <Text style={styles.sectionTitle}>Select Issue Category:</Text>
          <View style={styles.reasonsList}>
            {REPORT_REASONS.map((reason) => (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    selectedReason === reason && styles.reasonOptionTextSelected,
                  ]}
                >
                  {selectedReason === reason ? '◉ ' : '◯ '} {reason}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Additional Notes (Optional):</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Provide any additional details..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={3}
          />

          <View style={styles.actionRow}>
            <HandDrawnButton
              title="CANCEL"
              variant="disabled"
              onPress={onClose}
              size="medium"
              style={{ flex: 1, marginRight: 6 }}
            />
            <HandDrawnButton
              title={isSubmitting ? 'SUBMITTING...' : 'SUBMIT REPORT 📩'}
              variant="primary"
              onPress={handleSubmitReport}
              size="medium"
              style={{ flex: 1.3, marginLeft: 6 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: THEME.colors.borderDark,
    padding: 18,
    width: '100%',
    ...THEME.shadows.handDrawn,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.colors.maroon,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.pencilLight,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 6,
    marginTop: 4,
  },
  reasonsList: {
    gap: 6,
    marginBottom: 10,
  },
  reasonOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    backgroundColor: THEME.colors.paperLight,
  },
  reasonOptionSelected: {
    backgroundColor: THEME.colors.mustard,
    borderColor: THEME.colors.maroon,
  },
  reasonOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  reasonOptionTextSelected: {
    color: THEME.colors.maroon,
    fontWeight: '900',
  },
  notesInput: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: THEME.colors.pencil,
    textAlignVertical: 'top',
    marginBottom: 14,
    height: 70,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
  },
});
