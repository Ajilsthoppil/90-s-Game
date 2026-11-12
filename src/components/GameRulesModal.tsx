import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { THEME } from '../theme/theme';
import { HandDrawnButton } from './HandDrawnButton';

interface GameRulesModalProps {
  visible: boolean;
  gameTitle?: string;
  rules?: string[];
  onAcknowledge: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  visible,
  gameTitle = 'BINGO',
  rules,
  onAcknowledge,
}) => {
  const defaultBingoRules = [
    '5×5 Board: Fill or select a grid containing numbers 1 to 25 exactly once.',
    'Board Locking: Lock your board before play begins. No changes allowed during match.',
    'Number Calling: The host caller announces numbers 1–25 one by one.',
    'Strict Marking: You can only mark a number AFTER it has been called by the caller.',
    'B → I → N → G → O Sequence: Complete 5 unique straight lines in order to spell B-I-N-G-O.',
    'Claiming Bingo: Press # BINGO! to validate cleanly with the engine.',
  ];

  const displayRules = rules && rules.length > 0 ? rules : defaultBingoRules;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.headerEmoji}>📜 🎮</Text>
          <Text style={styles.title}>{gameTitle} RULES</Text>
          <Text style={styles.subtitle}>
            "Classroom rules we played by in the 90s."
          </Text>

          <ScrollView style={styles.scrollContent}>
            {displayRules.map((ruleText, idx) => (
              <View key={`rule-${idx}`} style={styles.ruleItem}>
                <Text style={styles.ruleNum}>{idx + 1}.</Text>
                <Text style={styles.ruleText}>{ruleText}</Text>
              </View>
            ))}
          </ScrollView>

          <HandDrawnButton
            title="[ OK, I UNDERSTAND ]"
            variant="primary"
            onPress={onAcknowledge}
            size="large"
            style={styles.ackBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: THEME.colors.borderDark,
    padding: 18,
    maxHeight: '85%',
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  headerEmoji: {
    fontSize: 32,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.maroon,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    color: THEME.colors.pencil,
    marginBottom: 12,
  },
  scrollContent: {
    width: '100%',
    marginBottom: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: THEME.colors.paperLight,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.notebookBlue,
  },
  ruleNum: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.maroon,
    marginRight: 8,
    width: 20,
  },
  ruleText: {
    fontSize: 13,
    color: THEME.colors.pencil,
    lineHeight: 18,
    flex: 1,
  },
  ackBtn: {
    width: '100%',
  },
});
