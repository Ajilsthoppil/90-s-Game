import React, { useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  View,
  Animated,
} from 'react-native';
import { THEME } from '../theme/theme';

interface HandDrawnButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'disabled';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
  size?: 'small' | 'medium' | 'large';
}

export const HandDrawnButton: React.FC<HandDrawnButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
  icon,
  size = 'medium',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 5,
      tension: 300,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 4,
      tension: 200,
    }).start();
  };

  const getBackgroundColor = () => {
    if (disabled || variant === 'disabled') return THEME.colors.disabled;
    switch (variant) {
      case 'primary':
        return THEME.colors.cyan;
      case 'secondary':
        return THEME.colors.paperCard;
      case 'accent':
        return THEME.colors.gold;
      case 'danger':
        return THEME.colors.pink;
      default:
        return THEME.colors.cyan;
    }
  };

  const getBorderColor = () => {
    if (disabled || variant === 'disabled') return '#2A2E4B';
    if (variant === 'primary') return THEME.colors.cyanBright;
    if (variant === 'accent') return THEME.colors.goldBright;
    if (variant === 'danger') return THEME.colors.pinkBright;
    return THEME.colors.purple;
  };

  const getTextColor = () => {
    if (disabled || variant === 'disabled') return THEME.colors.disabledText;
    if (variant === 'secondary') return THEME.colors.cyanBright;
    return '#0F172A'; // High-contrast bold dark text on neon fill
  };

  const getGlowStyle = () => {
    if (disabled || variant === 'disabled') return null;
    if (variant === 'primary') return THEME.shadows.neonGlowCyan;
    if (variant === 'danger') return THEME.shadows.neonGlowPink;
    return THEME.shadows.button;
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={disabled ? undefined : onPress}
        style={[
          styles.button,
          getGlowStyle(),
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
          },
          size === 'small' && styles.small,
          size === 'large' && styles.large,
          disabled && styles.disabledButton,
        ]}
        disabled={disabled}
      >
        <View style={styles.contentRow}>
          {icon ? <Text style={styles.iconText}>{icon}</Text> : null}
          <Text
            numberOfLines={1}
            style={[
              styles.text,
              { color: getTextColor() },
              size === 'small' && styles.smallText,
              size === 'large' && styles.largeText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    borderWidth: 2,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconText: {
    fontSize: 18,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 2.5,
  },
  disabledButton: {
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  smallText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  largeText: {
    fontSize: 18,
    letterSpacing: 1,
  },
});
