import React from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { THEME } from '../../../theme/theme';

export interface BrainGameButtonProps {
  title: string;
  icon?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const BrainGameButton: React.FC<BrainGameButtonProps> = ({
  title,
  icon,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isAccent = variant === 'accent';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        isAccent && styles.accent,
        isDanger && styles.danger,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {icon ? <Text style={[styles.iconText, isPrimary && styles.primaryIcon]}>{icon} </Text> : null}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[
          styles.text,
          styles[`text_${size}` as keyof typeof styles],
          isPrimary && styles.textPrimary,
          isSecondary && styles.textSecondary,
          isAccent && styles.textAccent,
          isDanger && styles.textDanger,
          isGhost && styles.textGhost,
          disabled && styles.textDisabled,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 44,
  },
  sm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 38,
    borderRadius: 10,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 12,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    minHeight: 52,
    borderRadius: 14,
  },
  primary: {
    backgroundColor: '#F59E0B', // Warm Amber
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#0284C7', // Ocean Marine
    borderColor: '#38BDF8',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  accent: {
    backgroundColor: '#0EA5E9', // Sky Azure
    borderColor: '#7DD3FC',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  danger: {
    backgroundColor: '#DC2626', // Ruby Red
    borderColor: '#F87171',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  ghost: {
    backgroundColor: '#0E223D',
    borderColor: '#1C3F69',
  },
  disabled: {
    backgroundColor: '#0D1E33',
    borderColor: '#193557',
    opacity: 0.55,
    elevation: 0,
    shadowOpacity: 0,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconText: {
    fontSize: 15,
  },
  primaryIcon: {
    color: '#081325',
  },
  text: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  text_sm: {
    fontSize: 12,
  },
  text_md: {
    fontSize: 14,
  },
  text_lg: {
    fontSize: 16,
  },
  textPrimary: {
    color: '#081325', // High-contrast navy on gold
  },
  textSecondary: {
    color: '#FFFFFF',
  },
  textAccent: {
    color: '#081325',
  },
  textDanger: {
    color: '#FFFFFF',
  },
  textGhost: {
    color: '#CBD5E1',
  },
  textDisabled: {
    color: '#64748B',
  },
});
