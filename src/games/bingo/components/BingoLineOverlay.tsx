import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CompletedBingoLine } from '../types/bingo.types';
import { GameSettings, MarkingStyle } from '../../../types';
import { soundService } from '../../../audio/soundService';

interface BingoLineOverlayProps {
  gridWidth: number;
  gridHeight: number;
  completedLines: CompletedBingoLine[];
  animateNewLines?: boolean;
  markingStyle?: MarkingStyle;
  settings?: GameSettings;
}

export const BingoLineOverlay: React.FC<BingoLineOverlayProps> = ({
  gridWidth,
  gridHeight,
  completedLines,
  animateNewLines = true,
  markingStyle = 'pencil',
  settings,
}) => {
  const lineAnimMapRef = useRef<Map<string, Animated.Value>>(new Map());

  if (gridWidth <= 0 || gridHeight <= 0) return null;

  const cw = gridWidth / 5;
  const ch = gridHeight / 5;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlayContainer]} pointerEvents="none">
      {completedLines.map((line, idx) => {
        const lineKey = line.key || `line-${line.sequenceNumber}`;
        const key = `${lineKey}-${line.type}`;

        let x1 = 0;
        let y1 = 0;
        let x2 = 0;
        let y2 = 0;
        let badgeLeft = 0;
        let badgeTop = 0;

        if (line.direction === 'horizontal') {
          const r = line.index !== undefined ? line.index : line.cells[0]?.row || 0;
          x1 = cw * 0.08;
          y1 = (r + 0.5) * ch;
          x2 = cw * 4.92;
          y2 = (r + 0.5) * ch;
          badgeLeft = Math.max(0, x1 - 14);
          badgeTop = Math.max(0, y1 - 12);
        } else if (line.direction === 'vertical') {
          const c = line.index !== undefined ? line.index : line.cells[0]?.col || 0;
          x1 = (c + 0.5) * cw;
          y1 = ch * 0.08;
          x2 = (c + 0.5) * cw;
          y2 = ch * 4.92;
          badgeLeft = Math.max(0, x1 - 10);
          badgeTop = Math.max(0, y1 - 16);
        } else if (line.direction === 'mainDiagonal') {
          // Top-Left -> Bottom-Right (\)
          x1 = cw * 0.15;
          y1 = ch * 0.15;
          x2 = cw * 4.85;
          y2 = ch * 4.85;
          badgeLeft = Math.max(0, x1 - 10);
          badgeTop = Math.max(0, y1 - 14);
        } else if (line.direction === 'antiDiagonal') {
          // Top-Right -> Bottom-Left (/)
          x1 = cw * 4.85;
          y1 = ch * 0.15;
          x2 = cw * 0.15;
          y2 = ch * 4.85;
          badgeLeft = Math.min(gridWidth - 24, x1 - 4);
          badgeTop = Math.max(0, y1 - 14);
        }

        const fullLen = Math.hypot(x2 - x1, y2 - y1);
        const ang = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        // Retrieve or create animation value for line key
        let anim = lineAnimMapRef.current.get(key);
        if (!anim) {
          anim = new Animated.Value(animateNewLines ? 0 : 1);
          lineAnimMapRef.current.set(key, anim);

          if (animateNewLines) {
            const startDelay = idx * 550; // Stagger multi-line completions sequentially
            setTimeout(() => {
              // Play synchronized pencil/pen line drawing sound at exact start of visual line stroke
              soundService.playLineDrawingSound(markingStyle, settings);

              Animated.timing(anim!, {
                toValue: 1,
                duration: 450,
                useNativeDriver: false,
              }).start();
            }, startDelay);
          }
        }

        const animWidth = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, fullLen],
        });

        const badgeOpacity = anim.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, 0.5, 1],
        });

        return (
          <React.Fragment key={`overlay-${key}`}>
            {/* Hand-Drawn Animated Line */}
            <View
              style={[
                styles.lineWrapper,
                {
                  left: x1,
                  top: y1 - 3,
                  width: fullLen,
                  height: 6,
                  transform: [
                    { translateX: -fullLen / 2 },
                    { rotate: `${ang}deg` },
                    { translateX: fullLen / 2 },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.lineStroke,
                  {
                    width: animWidth,
                  },
                ]}
              />
            </View>

            {/* Pattern Badge (B, I, N, G, O) */}
            <Animated.View
              style={[
                styles.badge,
                {
                  left: badgeLeft,
                  top: badgeTop,
                  opacity: badgeOpacity,
                },
              ]}
            >
              <Text style={styles.badgeText}>{line.type}</Text>
            </Animated.View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    zIndex: 10,
  },
  lineWrapper: {
    position: 'absolute',
    justifyContent: 'center',
  },
  lineStroke: {
    height: 6,
    backgroundColor: '#991B1B', // Deep crimson maroon
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#7F1D1D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#991B1B',
    borderColor: '#FFD700',
    borderWidth: 1.5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 15,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
