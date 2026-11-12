import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { THEME } from '../theme/theme';

interface NotebookCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  hasRedMargin?: boolean;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({
  children,
  style,
  hasRedMargin = true,
}) => {
  return (
    <View style={[styles.card, style]}>
      {hasRedMargin && <View style={styles.redMargin} />}
      <View style={styles.notebookLine1} />
      <View style={styles.notebookLine2} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    ...THEME.shadows.handDrawn,
  },
  redMargin: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: THEME.colors.marginRed,
    opacity: 0.8,
    zIndex: 1,
  },
  notebookLine1: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: THEME.colors.notebookBlue,
    opacity: 0.5,
  },
  notebookLine2: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: THEME.colors.notebookBlue,
    opacity: 0.5,
  },
  content: {
    zIndex: 2,
  },
});
