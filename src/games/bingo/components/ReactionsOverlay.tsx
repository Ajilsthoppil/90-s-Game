import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '../../../theme/theme';

interface ReactionsOverlayProps {
  reaction: {
    playerName: string;
    text: string;
  } | null;
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ reaction }) => {
  if (!reaction) return null;

  return (
    <View style={styles.toastContainer}>
      <Text style={styles.toastPlayer}>{reaction.playerName}:</Text>
      <Text style={styles.toastText}>{reaction.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#FFF2C6',
    borderWidth: 2,
    borderColor: THEME.colors.maroon,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 99,
    ...THEME.shadows.handDrawn,
  },
  toastPlayer: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.pencilLight,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.maroon,
  },
});
