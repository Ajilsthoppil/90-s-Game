import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { BrainDifficulty } from '../types/brain.types';

export interface BrainGameDifficultySelectorProps {
  current: BrainDifficulty;
  onSelect: (diff: BrainDifficulty) => void;
  variant?: 'dropdown' | 'segmented';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface DifficultyOption {
  key: BrainDifficulty;
  label: string;
  short: string;
  color: string;
  badge: string;
  description: string;
}

const DIFFICULTIES: DifficultyOption[] = [
  {
    key: 'EASY',
    label: 'EASY',
    short: 'E',
    color: '#10B981',
    badge: '🟢',
    description: 'Beginner friendly with generous hints',
  },
  {
    key: 'MEDIUM',
    label: 'MEDIUM',
    short: 'M',
    color: '#F59E0B',
    badge: '🟡',
    description: 'Balanced challenge with standard pacing',
  },
  {
    key: 'HARD',
    label: 'HARD',
    short: 'H',
    color: '#EF4444',
    badge: '🔴',
    description: 'Advanced complexity for puzzle masters',
  },
];

export const BrainGameDifficultySelector: React.FC<BrainGameDifficultySelectorProps> = ({
  current,
  onSelect,
  variant = 'dropdown',
  compact = false,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const activeOption =
    DIFFICULTIES.find((d) => d.key === current) || DIFFICULTIES[0];

  const handleSelect = (diff: BrainDifficulty) => {
    onSelect(diff);
    setModalVisible(false);
  };

  if (variant === 'segmented') {
    return (
      <View style={[styles.container, compact && styles.containerCompact, style]}>
        {DIFFICULTIES.map((d) => {
          const isActive = current === d.key;
          return (
            <Pressable
              key={d.key}
              onPress={() => onSelect(d.key)}
              accessibilityRole="button"
              accessibilityLabel={`Set difficulty to ${d.label}`}
              style={({ pressed }) => [
                styles.pill,
                compact && styles.pillCompact,
                isActive && styles.pillActive,
                isActive && { borderColor: d.color, shadowColor: d.color },
                pressed && styles.pillPressed,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  compact && styles.pillTextCompact,
                  isActive && styles.pillTextActive,
                  isActive && { color: '#081325' },
                ]}
              >
                {compact ? d.short : d.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  // Default: Compact Dropdown Button with Frosted Selection Modal
  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Difficulty level ${current}. Tap to change difficulty.`}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          compact && styles.dropdownTriggerCompact,
          pressed && styles.dropdownTriggerPressed,
          style,
        ]}
      >
        <View
          style={[styles.statusDot, { backgroundColor: activeOption.color }]}
        />
        <Text style={styles.dropdownPrefix}>LVL:</Text>
        <Text
          style={[
            styles.dropdownValue,
            { color: activeOption.color },
          ]}
        >
          {compact ? activeOption.short : activeOption.label}
        </Text>
        <Text style={styles.dropdownCaret}>▾</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Text style={styles.modalHeaderIcon}>⚙️</Text>
                <Text style={styles.modalHeaderTitle}>SELECT DIFFICULTY</Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close difficulty selector"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </Pressable>
            </View>

            {/* Difficulty Options List */}
            <View style={styles.modalOptionsContainer}>
              {DIFFICULTIES.map((option) => {
                const isSelected = option.key === current;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleSelect(option.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${option.label} difficulty`}
                    style={({ pressed }) => [
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemSelected,
                      isSelected && { borderColor: option.color },
                      pressed && styles.modalOptionItemPressed,
                    ]}
                  >
                    <View style={styles.optionLeftCol}>
                      <View
                        style={[
                          styles.optionBadgeCircle,
                          { borderColor: option.color },
                          isSelected && { backgroundColor: `${option.color}22` },
                        ]}
                      >
                        <Text style={styles.optionBadgeEmoji}>
                          {option.badge}
                        </Text>
                      </View>
                      <View style={styles.optionTextCol}>
                        <View style={styles.optionTitleRow}>
                          <Text
                            style={[
                              styles.optionLabel,
                              isSelected && { color: option.color },
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <View
                              style={[
                                styles.activeTag,
                                { backgroundColor: `${option.color}33` },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.activeTagText,
                                  { color: option.color },
                                ]}
                              >
                                ACTIVE
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.optionDescription}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Text
                        style={[styles.checkmarkIcon, { color: option.color }]}
                      >
                        ✓
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Dismiss Footer */}
            <Pressable
              onPress={() => setModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Cancel difficulty selection"
              style={styles.dismissBtn}
            >
              <Text style={styles.dismissBtnText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Segmented Variant
  container: {
    flexDirection: 'row',
    backgroundColor: '#0A1B30',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    gap: 4,
  },
  containerCompact: {
    borderRadius: 8,
    padding: 2,
    gap: 3,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 36,
    borderRadius: 6,
  },
  pillActive: {
    backgroundColor: '#38BDF8',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  pillPressed: {
    opacity: 0.8,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  pillTextCompact: {
    fontSize: 10,
    fontWeight: '900',
  },
  pillTextActive: {
    fontWeight: '900',
  },

  // Dropdown Trigger Button
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E223D',
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    borderRadius: 12,
    paddingHorizontal: 10,
    minHeight: 44,
    gap: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownTriggerCompact: {
    minHeight: 38,
    paddingHorizontal: 8,
    gap: 4,
    borderRadius: 10,
  },
  dropdownTriggerPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropdownPrefix: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  dropdownValue: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dropdownCaret: {
    fontSize: 12,
    fontWeight: '900',
    color: '#38BDF8',
    marginLeft: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 10, 20, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0E223D',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#1C3F69',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C3F69',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderIcon: {
    fontSize: 16,
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.8,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0A1B30',
    borderWidth: 1,
    borderColor: '#1C3F69',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94A3B8',
  },
  modalOptionsContainer: {
    paddingVertical: 12,
    gap: 10,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A1B30',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  modalOptionItemSelected: {
    backgroundColor: '#0D274A',
    borderWidth: 2,
  },
  modalOptionItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  optionLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionBadgeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#081325',
  },
  optionBadgeEmoji: {
    fontSize: 14,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.6,
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  optionDescription: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  checkmarkIcon: {
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  dismissBtn: {
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#0A1B30',
    borderWidth: 1,
    borderColor: '#1C3F69',
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
  },
});
