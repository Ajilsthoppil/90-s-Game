import React from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { THEME } from '../../../theme/theme';

export interface BrainGameContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export const BrainGameContainer: React.FC<BrainGameContainerProps> = ({
  children,
  style,
  contentContainerStyle,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <StatusBar barStyle="light-content" backgroundColor="#050D1A" translucent={false} />
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081325', // Main deep ocean marine background
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'android' ? 4 : 0,
    paddingBottom: 4,
  },
});
