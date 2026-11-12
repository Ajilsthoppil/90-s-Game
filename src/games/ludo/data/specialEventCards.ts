import { AdventureCardDefinition } from '../types/ludoAdventure.types';

export const SPECIAL_EVENT_CARDS: Record<string, AdventureCardDefinition> = {
  EVENT_REVENGE: {
    id: 'EVENT_REVENGE',
    cardType: 'SPECIAL_EVENT',
    title: 'REVENGE!',
    subtitle: "It's Payback Time! — Monkey D. Luffy",
    description: 'Choose an opponent who previously captured your token in this game. Send one of their tokens back to their Base! Cannot target Safe Zone or Home.',
    quote: '"You knocked my crew out earlier?! Gomu Gomu no... PAYBACK!" — Luffy',
    icon: '👊',
    badgeText: 'E1. REVENGE',
    accentColor: '#EF4444', // Red Impact
    requiresTarget: true,
    targetType: 'REVENGE_TARGET',
  },
  EVENT_BODY_SWAP: {
    id: 'EVENT_BODY_SWAP',
    cardType: 'SPECIAL_EVENT',
    title: 'BODY SWAP',
    subtitle: "Let's Switch! — Sanji & Zoro",
    description: 'Choose one of your tokens and one opponent token. Swap their positions! Valid positions only. Cannot swap tokens in Safe Zone or Home.',
    quote: '"Hey moss-head, switch with me! Why do I have to swap with you, curly-brow?!"',
    icon: '🔄',
    badgeText: 'E2. BODY SWAP',
    accentColor: '#8B5CF6', // Mystic Purple
    requiresTarget: true,
    targetType: 'TOKEN_SWAP',
  },
  EVENT_ESCAPE_ARTIST: {
    id: 'EVENT_ESCAPE_ARTIST',
    cardType: 'SPECIAL_EVENT',
    title: 'ESCAPE ARTIST',
    subtitle: 'To Safety! — Nami',
    description: 'Move one of your tokens to the next Safe Zone ahead. Forward direction only. Cannot move backward. If no Safe Zone ahead, redraw card.',
    quote: '"Mirage tempo! Slip past the cannon fire straight to the island harbor!" — Nami',
    icon: '🏃‍♀️',
    badgeText: 'E3. ESCAPE ARTIST',
    accentColor: '#14B8A6', // Teal Escape
    requiresTarget: true,
    targetType: 'OWN_TOKEN',
  },
  EVENT_WANTED: {
    id: 'EVENT_WANTED',
    cardType: 'SPECIAL_EVENT',
    title: 'WANTED!',
    subtitle: 'Target Acquired! — Sniper King Usopp',
    description: 'Choose an opponent token as your target. If you capture this target on your next eligible turn, you get one extra dice roll! If not captured, effect expires.',
    quote: '"Lock on target! 100,000,000 Berry bounty on that scoundrel!" — Usopp',
    icon: '📜',
    badgeText: 'E4. WANTED!',
    accentColor: '#F59E0B', // Amber Bounty
    requiresTarget: true,
    targetType: 'OPPONENT_TOKEN',
  },
  EVENT_PIRATE_PRANK: {
    id: 'EVENT_PIRATE_PRANK',
    cardType: 'SPECIAL_EVENT',
    title: 'PIRATE PRANK',
    subtitle: 'HA!! HA! HA! — Tony Tony Chopper',
    description: 'A funny event! No gameplay change, just a prank and funny animation. "Your captain has lost the map!"',
    quote: '"Bwahahaha! The captain is holding the treasure map upside down again!" — Chopper',
    icon: '🤣',
    badgeText: 'E5. PIRATE PRANK',
    accentColor: '#EC4899', // Pink Prank
    requiresTarget: false,
    targetType: 'NONE',
  },
  EVENT_CREW_CHAOS: {
    id: 'EVENT_CREW_CHAOS',
    cardType: 'SPECIAL_EVENT',
    title: 'CREW CHAOS',
    subtitle: 'Soul King Rock Concert! — Brook',
    description: 'Random funny event for everyone! Soul King Brook plays a wild rock solo! Show a random crew reaction, sound or animation. No gameplay change.',
    quote: '"Yohohoho! Listen to my new sea shanty rock solo! Skeleton burst!" — Brook',
    icon: '🎸',
    badgeText: 'E6. CREW CHAOS',
    accentColor: '#6366F1', // Brook Indigo Rock
    requiresTarget: false,
    targetType: 'NONE',
  },
  EVENT_CAPTAINS_ORDER: {
    id: 'EVENT_CAPTAINS_ORDER',
    cardType: 'SPECIAL_EVENT',
    title: "CAPTAIN'S ORDER (+2)",
    subtitle: 'Move Forward! — Trafalgar D. Water Law',
    description: 'Move one of your tokens 2 extra spaces forward! Follow normal path rules and resolve any tile effects.',
    quote: '"ROOM... Shambles! By strategic order, march forward 2 spaces!" — Law',
    icon: '🧭',
    badgeText: 'E7. CAPTAIN\'S ORDER',
    accentColor: '#3B82F6', // Law Navy Blue
    requiresTarget: true,
    targetType: 'OWN_TOKEN',
  },
  EVENT_SECOND_CHANCE: {
    id: 'EVENT_SECOND_CHANCE',
    cardType: 'SPECIAL_EVENT',
    title: 'SECOND CHANCE (+1)',
    subtitle: 'Roll Once More! — Monkey D. Luffy',
    description: 'Roll the dice one more time! You get an additional dice roll. Apply normal rules. Does not grant unlimited rolls.',
    quote: '"Shishishi! Lady luck is on our ship! Let me roll the dice again!" — Luffy',
    icon: '✨',
    badgeText: 'E8. SECOND CHANCE',
    accentColor: '#EAB308', // Gold Chance
    requiresTarget: false,
    targetType: 'NONE',
  },
};

export const SPECIAL_EVENT_CARD_LIST: AdventureCardDefinition[] = Object.values(SPECIAL_EVENT_CARDS);
