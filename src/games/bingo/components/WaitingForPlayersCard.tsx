import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Player } from '../../../types';
import { THEME } from '../../../theme/theme';

interface WaitingForPlayersCardProps {
  players: Player[];
  localPlayerId: string;
}

export const WaitingForPlayersCard: React.FC<WaitingForPlayersCardProps> = ({
  players,
  localPlayerId,
}) => {
  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBadge}>
        <Text style={styles.headerTitle}>✓ BOARD READY</Text>
      </View>

      <Text style={styles.subtitle}>
        Your board is locked. Waiting for other players...
      </Text>

      {/* Live Readiness List */}
      <View style={styles.listCard}>
        <Text style={styles.listHeader}>BOARD SETUP STATUS</Text>
        <ScrollView style={styles.scrollList}>
          {players.map((p) => {
            const isSelf = p.id === localPlayerId;
            const isDone = (p.status === 'READY' || p.status === 'PLAYING') && Boolean(p.isLocked);

            return (
              <View key={`waiting-p-${p.id}`} style={styles.playerRow}>
                <View style={styles.playerLeft}>
                  <Text style={styles.avatar}>{p.avatar || '🎒'}</Text>
                  <Text style={styles.playerName}>
                    {p.name} {isSelf ? '(You)' : ''}
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isDone ? styles.statusBadgeDone : styles.statusBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isDone ? styles.statusTextDone : styles.statusTextPending,
                    ]}
                  >
                    {isDone ? '✓ READY' : '⏳ SETTING BOARD'}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.paperCard,
    borderWidth: 2.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 12,
    padding: 18,
    marginVertical: 14,
    alignItems: 'center',
    ...THEME.shadows.handDrawn,
  },
  headerBadge: {
    backgroundColor: '#006633',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#004D26',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.pencil,
    marginBottom: 16,
    textAlign: 'center',
  },
  listCard: {
    width: '100%',
    backgroundColor: THEME.colors.paperLight,
    borderWidth: 1.5,
    borderColor: THEME.colors.borderDark,
    borderRadius: 8,
    padding: 12,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.maroon,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  scrollList: {
    maxHeight: 180,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2D8C3',
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 18,
    marginRight: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.pencil,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeDone: {
    backgroundColor: '#D1E7DD',
    borderColor: '#006633',
  },
  statusBadgePending: {
    backgroundColor: '#FFF2C6',
    borderColor: THEME.colors.mustard,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusTextDone: {
    color: '#006633',
  },
  statusTextPending: {
    color: THEME.colors.pencil,
  },
});
