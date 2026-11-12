import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { THEME } from '../theme/theme';

interface ScoreboardComponentProps {
  scoreboard: Record<string, number>;
  roomId: string;
}

export const ScoreboardComponent: React.FC<ScoreboardComponentProps> = ({
  scoreboard,
  roomId,
}) => {
  // Sort players by win count descending
  const entries = Object.entries(scoreboard).sort((a, b) => b[1] - a[1]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 ROOM SCOREBOARD ({roomId})</Text>

      <View style={styles.list}>
        {entries.map(([name, wins], index) => {
          const isLeader = index === 0 && wins > 0;
          return (
            <View
              key={name}
              style={[styles.row, isLeader && styles.leaderRow]}
            >
              <Text style={styles.rankText}>
                {isLeader ? '👑' : `#${index + 1}`}
              </Text>
              <Text style={[styles.nameText, isLeader && styles.leaderName]}>
                {name}
              </Text>
              <Text style={styles.winCountText}>
                {wins} {wins === 1 ? 'win' : 'wins'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.paperCard,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: THEME.colors.borderDark,
    padding: 12,
    marginVertical: 10,
    ...THEME.shadows.handDrawn,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.pencil,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  list: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.paperLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.notebookBlue,
  },
  leaderRow: {
    backgroundColor: '#FFF2C6',
    borderColor: THEME.colors.mustard,
    borderWidth: 1.5,
  },
  rankText: {
    width: 28,
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.pencilLight,
  },
  nameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pencil,
  },
  leaderName: {
    color: THEME.colors.maroon,
  },
  winCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.keralaGreen,
  },
});
