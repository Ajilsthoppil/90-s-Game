export const THEME = {
  colors: {
    // Deep Marine & Oceanic Backgrounds
    paper: '#081325', // Main deep ocean marine background
    paperDarker: '#050D1A', // Deeper abyss navy
    paperLight: '#0E223D', // Elevated marine card background
    paperCard: '#122B4D', // Ocean glass card surface
    paperBorder: '#1C3F69', // Subtle ocean border

    // Marine, Sky Blue & Oceanic Palette
    skyBlue: '#38BDF8', // Bright Electric Sky Blue
    marineBlue: '#0284C7', // Deep Marine Blue
    azure: '#0EA5E9', // Electric Azure
    cyan: '#06B6D4', // Primary Electric Cyan
    cyanBright: '#22D3EE',
    cyanGlow: 'rgba(56, 189, 248, 0.25)',
    iceBlue: '#E0F2FE', // Crisp Ice Blue
    royalBlue: '#2563EB', // Ocean Royal Blue
    cobaltBright: '#60A5FA', // Vibrant Sky Cobalt
    oceanTeal: '#14B8A6', // Tropical Oceanic Teal
    oceanTealBright: '#2DD4BF',
    deepIndigo: '#6366F1', // Deep Sea Indigo
    deepIndigoBright: '#818CF8',

    // Supporting Accents harmonized to Marine & Sky
    pink: '#0EA5E9',
    pinkBright: '#38BDF8',
    pinkGlow: 'rgba(56, 189, 248, 0.25)',
    purple: '#6366F1',
    purpleBright: '#818CF8',
    purpleGlow: 'rgba(99, 102, 241, 0.25)',
    gold: '#38BDF8',
    goldBright: '#7DD3FC',
    emerald: '#14B8A6',
    emeraldBright: '#2DD4BF',
    emeraldGlow: 'rgba(45, 212, 191, 0.25)',

    // Backward-compatibility aliases for component rendering
    notebookBlue: '#1C3F69',
    marginRed: '#0284C7',

    // Functional Ink / Text
    ink: '#F8FAFC', // Crisp white text
    pencil: '#CBD5E1', // Soft slate text
    pencilGrey: '#8BACD1', // Marine muted metadata
    pencilLight: '#597E9F', // Marine darker muted
    borderDark: '#1E4472',

    // Theme Accents
    keralaGreen: '#14B8A6',
    keralaGreenLight: '#042F2E',
    maroon: '#0284C7',
    maroonLight: '#082F49',
    mustard: '#38BDF8',
    mustardLight: '#075985',
    penBlue: '#38BDF8',
    disabled: '#0C1C30',
    disabledText: '#476582',
    success: '#14B8A6',
    warning: '#38BDF8',
    error: '#EF4444',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  typography: {
    screenTitle: {
      fontSize: 24,
      fontWeight: '900' as const,
      color: '#22D3EE',
      letterSpacing: 1.5,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800' as const,
      color: '#F8FAFC',
      letterSpacing: 0.5,
    },
    body: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: '#CBD5E1',
    },
    metadata: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: '#94A3B8',
    },
  },
  shadows: {
    handDrawn: {
      shadowColor: '#22D3EE',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    notebookCard: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    button: {
      shadowColor: '#06B6D4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    neonGlowCyan: {
      shadowColor: '#22D3EE',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
    neonGlowPink: {
      shadowColor: '#F43F5E',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};
