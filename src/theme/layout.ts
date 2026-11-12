import { useWindowDimensions, Platform, StatusBar } from 'react-native';
import {
  ScreenClass,
  Orientation,
  OrientationPolicy,
  MIN_TOUCH_TARGET,
  GAME_ORIENTATION_POLICY,
  getOrientation,
  getScreenClass,
  getStatusBarHeight,
  getBottomNavInset,
  BoardCalculationOptions,
  BoardCalculationResult,
  calculateBoardDimensions,
  HandCardLayoutOptions,
  HandCardLayoutResult,
  calculateHandCardLayout,
} from './layoutUtils';

// Re-export all layout utilities and constants
export * from './layoutUtils';

export interface ResponsiveLayoutState {
  width: number;
  height: number;
  statusBarHeight: number;
  bottomNavInset: number;
  orientation: Orientation;
  isLandscape: boolean;
  isPortrait: boolean;
  screenClass: ScreenClass;
  isCompact: boolean;
  isRegular: boolean;
  isLarge: boolean;
  minTouchTarget: number;
  getBoardDimensions: (
    gridCount: number,
    overrides?: Partial<BoardCalculationOptions>
  ) => BoardCalculationResult;
  getHandCardLayout: (
    cardCount: number,
    overrides?: Partial<HandCardLayoutOptions>
  ) => HandCardLayoutResult;
  getGamePolicy: (gameId: string) => OrientationPolicy;
  isOptimalOrientation: (gameId: string) => boolean;
}

/**
 * React hook that dynamically tracks window dimensions on rotation
 * and provides responsive helpers.
 */
export function useResponsiveLayout(): ResponsiveLayoutState {
  const { width, height } = useWindowDimensions();

  const orientation = getOrientation(width, height);
  const isLandscape = orientation === 'LANDSCAPE';
  const isPortrait = orientation === 'PORTRAIT';
  const screenClass = getScreenClass(width, height);

  const statusBarHeight =
    Platform.OS === 'android'
      ? getStatusBarHeight(isLandscape, StatusBar.currentHeight)
      : 0;
  const bottomNavInset =
    Platform.OS === 'android' ? getBottomNavInset(isLandscape) : 0;

  const isCompact = screenClass === 'compact';
  const isRegular = screenClass === 'regular';
  const isLarge = screenClass === 'large';

  const getBoardDimensions = (
    gridCount: number,
    overrides?: Partial<BoardCalculationOptions>
  ): BoardCalculationResult => {
    return calculateBoardDimensions({
      width,
      height,
      gridCount,
      isLandscape,
      ...overrides,
    });
  };

  const getHandCardLayout = (
    cardCount: number,
    overrides?: Partial<HandCardLayoutOptions>
  ): HandCardLayoutResult => {
    return calculateHandCardLayout({
      cardCount,
      availableWidth: isLandscape ? width - 120 : width - 24,
      ...overrides,
    });
  };

  const getGamePolicy = (gameId: string): OrientationPolicy => {
    return GAME_ORIENTATION_POLICY[gameId] || 'DUAL';
  };

  const isOptimalOrientation = (gameId: string): boolean => {
    const policy = getGamePolicy(gameId);
    if (policy === 'DUAL') return true;
    if (policy === 'LANDSCAPE_PRIORITY') return isLandscape;
    if (policy === 'PORTRAIT_PRIORITY' || policy === 'PORTRAIT_ONLY') return isPortrait;
    return true;
  };

  return {
    width,
    height,
    statusBarHeight,
    bottomNavInset,
    orientation,
    isLandscape,
    isPortrait,
    screenClass,
    isCompact,
    isRegular,
    isLarge,
    minTouchTarget: MIN_TOUCH_TARGET,
    getBoardDimensions,
    getHandCardLayout,
    getGamePolicy,
    isOptimalOrientation,
  };
}
