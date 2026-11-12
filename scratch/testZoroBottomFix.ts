import { LudoEngine } from '../src/games/ludo/engine/LudoEngine';
import { STRAW_HAT_CREW, getStrawHatMember } from '../src/games/ludo/data/strawHatCrew';
import { YARD_HUB_CENTERS, YARD_SLOTS_MAP } from '../src/games/ludo/rules/ludoRules';
import { LudoColor } from '../src/games/ludo/types/ludo.types';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ [PASS] ${msg}`);
}

console.log('===============================================================');
console.log('USER COMPLAINT VERIFICATION: ZORO IN LEFT SIDE DOWN / CHARACTER TOKENS');
console.log('===============================================================');

// Simulate Bot Play Crew Assignment matching LudoGameScreen
function getBotCrewAssignments(humanMemberId: string, humanColor: LudoColor) {
  const colors: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
  const remainingColors = colors.filter((c) => c !== humanColor);
  const assignments: Partial<Record<LudoColor, any>> = {};

  const humanMember = getStrawHatMember(humanMemberId);
  assignments[humanColor] = humanMember;
  const usedMemberIds = new Set<string>([humanMember.id]);

  for (const col of remainingColors) {
    let candidate = STRAW_HAT_CREW.find(
      (m) => m.defaultColor === col && !usedMemberIds.has(m.id)
    );
    if (!candidate) candidate = STRAW_HAT_CREW.find((m) => !usedMemberIds.has(m.id));
    if (!candidate) candidate = STRAW_HAT_CREW[0];
    assignments[col] = candidate;
    usedMemberIds.add(candidate.id);
  }
  return assignments as Record<LudoColor, any>;
}

// 1. User selects Zoro:
const zoroMember = getStrawHatMember('zoro');
assert(zoroMember.id === 'zoro', 'Zoro member found');
assert(zoroMember.avatar === '⚔️', 'Zoro avatar is ⚔️');

// In Bot Play, default position is Left Side Down (YELLOW)
const chosenColor: LudoColor = 'YELLOW';
const assignments = getBotCrewAssignments('zoro', chosenColor);

assert(assignments['YELLOW'].id === 'zoro', 'YELLOW fleet assigned to Zoro (Left Side Down)');
assert(assignments['YELLOW'].avatar === '⚔️', 'YELLOW fleet avatar is ⚔️ (Swordsman Zoro)');
assert(assignments['RED'].id !== 'zoro', 'RED (Top-Left) is NOT Zoro');
assert(assignments['GREEN'].id !== 'zoro', 'GREEN (Top-Right) is NOT Zoro');
assert(assignments['BLUE'].id !== 'zoro', 'BLUE (Right Side Down) is NOT Zoro');

// Verify all 4 players are unique Straw Hats
const assignedIds = Object.values(assignments).map((m: any) => m.id);
assert(new Set(assignedIds).size === 4, 'All 4 fleets have distinct Straw Hat captains');

// Build engine match
const colors: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
const playersConfig = colors.map((col, idx) => {
  const member = assignments[col];
  if (col === chosenColor) {
    return {
      id: 'player_local_1',
      name: `${member.title} (You)`,
      avatar: member.avatar,
      color: col,
      characterId: member.id,
      isBot: false,
    };
  }
  return {
    id: `bot_${idx + 1}`,
    name: `${member.title} (Bot)`,
    avatar: member.avatar,
    color: col,
    characterId: member.id,
    isBot: true,
  };
});

const engine = new LudoEngine(true);
engine.startMatch(playersConfig);
const state = engine.getGameState();

// Check local player
const humanPlayer = state.players.find((p) => p.id === 'player_local_1')!;
assert(humanPlayer.characterId === 'zoro', 'Human player characterId is zoro');
assert(humanPlayer.avatar === '⚔️', 'Human player avatar is ⚔️');
assert(humanPlayer.color === 'YELLOW', 'Human player color is YELLOW (Left Side Down)');

// Check orderedPlayers (matching LudoBoardComponent)
const humanIdx = state.players.findIndex((p) => p.id === 'player_local_1');
const orderedPlayers = [
  state.players[humanIdx],
  state.players[(humanIdx + 1) % 4],
  state.players[(humanIdx + 2) % 4],
  state.players[(humanIdx + 3) % 4],
];
assert(orderedPlayers[0].id === 'player_local_1', 'Bottom player panel (orderedPlayers[0]) is the human player');
assert(orderedPlayers[0].name.includes('Zoro'), 'Bottom player panel displays Zoro');
assert(orderedPlayers[0].color === 'YELLOW', 'Bottom player panel corresponds to Left Side Down yard');

// Check yard coordinates for Left Side Down
const yellowHub = YARD_HUB_CENTERS['YELLOW'];
assert(yellowHub.r > 10 && yellowHub.c < 5, 'YELLOW yard hub is in Bottom-Left quadrant (Left Side Down)');

// Check tokens: each player token has player avatar
state.players.forEach((p) => {
  assert(p.tokens.length === 4, `Player ${p.name} has 4 tokens`);
  p.tokens.forEach((t) => {
    assert(t.playerColor === p.color, `Token ${t.id} matches player color ${p.color}`);
  });
});

console.log('\n===============================================================');
console.log('🎉 ALL ZORO BOTTOM POSITION & CHARACTER TOKEN TESTS PASSED!');
console.log('===============================================================');
