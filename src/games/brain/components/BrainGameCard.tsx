import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { THEME } from '../../../theme/theme';

export interface BrainGameCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  highlight?: boolean;
}

export const BrainGameCard: React.FC<BrainGameCardProps> = ({
  title,
  subtitle,
  badge,
  badgeColor = '#38BDF8',
  children,
  style,
  highlight = false,
}) => {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight, style]}>
      {(title || badge) && (
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            {title ? <Text style={styles.titleText}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          </View>
          {badge ? (
            <View style={[styles.badge, { borderColor: badgeColor }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0E223D', // Elevated ocean marine card
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1C3F69',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHighlight: {
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
