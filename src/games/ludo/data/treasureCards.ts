import { AdventureCardDefinition } from '../types/ludoAdventure.types';

export const TREASURE_CARDS: Record<string, AdventureCardDefinition> = {
  TREASURE_SAFE_ESCAPE: {
    id: 'TREASURE_SAFE_ESCAPE',
    cardType: 'TREASURE',
    title: 'SAFE ESCAPE',
    subtitle: 'Find a Safe Place! — Monkey D. Luffy',
    description: 'Move your selected token to the next Safe Zone ahead in the path. Cannot move backward. If no Safe Zone ahead, redraw another card.',
    quote: '"I found a safe cove ahead! Full speed towards the island!" — Luffy',
    icon: '🗺️',
    badgeText: 'T1. SAFE ESCAPE',
    accentColor: '#0EA5E9', // Oceanic Cyan
    requiresTarget: true,
    targetType: 'OWN_TOKEN',
  },
  TREASURE_PIRATE_DASH: {
    id: 'TREASURE_PIRATE_DASH',
    cardType: 'TREASURE',
    title: 'PIRATE DASH (+3)',
    subtitle: 'Move Faster! — Roronoa Zoro',
    description: 'Move your selected token 3 extra spaces forward! Follow normal path rules and resolve any tile effects you land on.',
    quote: '"Three-sword style tidal rush! Cutting right through the waves!" — Zoro',
    icon: '⚔️',
    badgeText: 'T2. PIRATE DASH',
    accentColor: '#10B981', // Zoro Emerald Green
    requiresTarget: true,
    targetType: 'OWN_TOKEN',
  },
  TREASURE_PIRATE_SHIELD: {
    id: 'TREASURE_PIRATE_SHIELD',
    cardType: 'TREASURE',
    title: 'PIRATE SHIELD',
    subtitle: 'Stay Safe! — Tony Tony Chopper',
    description: 'Give one of your tokens a shield protection for its next attack! Protects against one capture and expires after use.',
    quote: '"Leave the defense to me! My skull shield will protect the crew!" — Chopper',
    icon: '🛡️',
    badgeText: 'T3. PIRATE SHIELD',
    accentColor: '#38BDF8', // Chopper Cyan Shield
    requiresTarget: true,
    targetType: 'OWN_TOKEN',
  },
  TREASURE_LUCKY_DICE: {
    id: 'TREASURE_LUCKY_DICE',
    cardType: 'TREASURE',
    title: 'LUCKY DICE (+1)',
    subtitle: 'Roll Again! — Nami',
    description: 'Roll the dice one more time! You get an additional dice roll. Apply normal rules for the extra roll.',
    quote: '"Money, treasure, and golden dice! Let lady luck roll another six!" — Nami',
    icon: '🎲',
    badgeText: 'T4. LUCKY DICE',
    accentColor: '#F59E0B', // Nami Golden Orange
    requiresTarget: false,
    targetType: 'NONE',
  },
};

export const TREASURE_CARD_LIST: AdventureCardDefinition[] = Object.values(TREASURE_CARDS);
