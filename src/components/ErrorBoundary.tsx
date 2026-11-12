import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View, Pressable, SafeAreaView, StatusBar, Platform } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.safeContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#060E1D" />
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>🛡️</Text>
              </View>

              <Text style={styles.title}>GAME SAFE RECOVERY</Text>
              <Text style={styles.subtitle}>
                An unexpected game state was intercepted safely. Your player data and settings remain safe.
              </Text>

              {this.state.error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText} numberOfLines={3}>
                    {this.state.error.message || 'Unknown runtime state'}
                  </Text>
                </View>
              )}

              <Pressable onPress={this.handleReset} style={styles.recoveryBtn}>
                <Text style={styles.recoveryBtnText}>RETURN TO ARCADE HOME ➔</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#050D1A',
  },
  container: {
    flex: 1,
    backgroundColor: '#050D1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0A1C36',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F0F9FF',
    letterSpacing: 0.8,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#BAE6FD',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#07152B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#183863',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  recoveryBtn: {
    width: '100%',
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  recoveryBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#050D1A',
    letterSpacing: 0.8,
  },
});
