import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Player } from '../../../types';
import { THEME } from '../../../theme/theme';

interface OtherPlayersStatusProps {
  players: Player[];
  localPlayerId: string;
  currentTurnPlayerId?: string;
}

export const OtherPlayersStatus: React.FC<OtherPlayersStatusProps> = ({
  players,
  localPlayerId,
  currentTurnPlayerId,
}) => {
  const otherPlayers = players.filter((p) => p.id !== localPlayerId);

  if (otherPlayers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 OTHER PLAYERS IN ROOM</Text>

      <View style={styles.playerList}>
        {otherPlayers.map((player) => {
          const isCurrentTurn = player.id === currentTurnPlayerId;
          const prog = player.progress || {
            B: false,
            I: false,
            N: false,
            G: false,
            O: false,
            completedLinesCount: 0,
          };

          return (
            <View
              key={player.id}
              style={[
                styles.playerCard,
                isCurrentTurn && styles.playerCardActiveTurn,
              ]}
            >
              <View style={styles.playerHeader}>
                <Text style={styles.avatarText}>{player.avatar || '👤'}</Text>
                <Text style={styles.nameText}>
                  {player.name} {player.isHost ? '👑 (Host)' : ''}
                </Text>

                {isCurrentTurn && (
                  <View style={styles.callingBadge}>
                    <Text style={styles.callingBadgeText}>📣 Calling...</Text>
                  </View>
                )}

                <View style={styles.winsTag}>
                  <Text style={styles.winsText}>{player.wins} wins</Text>
                </View>
              </View>

              {/* B-I-N-G-O Public Progress (Section 16: Never expose their board grid!) */}
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Progress:</Text>
                {(['B', 'I', 'N', 'G', 'O'] as const).map((letter) => {
                  const isDone = prog[letter];
                  return (
                    <View
                      key={`other-${player.id}-${letter}`}
                      style={[
                        styles.letterBadge,
                        isDone && styles.letterBadgeDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.letterBadgeText,
                          isDone && styles.letterBadgeTextDone,
                        ]}
                      >
                        {letter} {isDone ? '✓' : '○'}
                      </Text>
                    </View>
                  );
                })}
              </View>
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
    borderRadius: 10,
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
  playerList: {
    gap: 8,
  },
  playerCard: {
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.notebookBlue,
    borderRadius: 8,
    padding: 10,
  },
  playerCardActiveTurn: {
    borderColor: THEME.colors.keralaGreen,
    borderWidth: 2.5,
    backgroundColor: '#F4FFF4',
  },
  callingBadge: {
    backgroundColor: THEME.colors.keralaGreen,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  callingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  avatarText: {
    fontSize: 18,
    marginRight: 6,
  },
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pencil,
    flex: 1,
  },
  winsTag: {
    backgroundColor: '#FFF2C6',
    borderWidth: 1,
    borderColor: THEME.colors.mustard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  winsText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.maroon,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.pencilLight,
    marginRight: 4,
  },
  letterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EAEAEA',
    borderWidth: 1,
    borderColor: '#CCC',
  },
  letterBadgeDone: {
    backgroundColor: THEME.colors.mustard,
    borderColor: THEME.colors.maroon,
  },
  letterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  letterBadgeTextDone: {
    color: THEME.colors.pencil,
  },
});
