import { LudoEngine } from '../src/games/ludo/engine/LudoEngine';
import { TREASURE_CARDS } from '../src/games/ludo/data/treasureCards';
import { SPECIAL_EVENT_CARDS } from '../src/games/ludo/data/specialEventCards';
import {
  TREASURE_TILES,
  EVENT_TILES,
  findNextSafeZone,
  absoluteToRelative,
} from '../src/games/ludo/rules/ludoAdventureRules';
import { SAFE_CELLS, isSafeCell, getAbsoluteTrackPosition } from '../src/games/ludo/rules/ludoRules';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('==================================================');
console.log('ANIME ADVENTURE LUDO — COMPREHENSIVE TEST SUITE');
console.log('==================================================');

// -----------------------------------------------------------------
// 1. BOARD TILE CONFIGURATION & GEOMETRY
// -----------------------------------------------------------------
assert(TREASURE_TILES.size === 4, 'ADVENTURE TILE TEST: Exactly 4 Treasure Tiles exist');
assert(EVENT_TILES.size === 4, 'ADVENTURE TILE TEST: Exactly 4 Special Event Tiles exist');

// Symmetrical distribution: Ensure no Treasure/Event tile overlaps with Safe Cells or each other
for (const t of TREASURE_TILES) {
  assert(!SAFE_CELLS.has(t), `ADVENTURE TILE TEST: Treasure Tile at abs ${t} is not a Safe Cell`);
  assert(!EVENT_TILES.has(t), `ADVENTURE TILE TEST: Treasure Tile at abs ${t} is not an Event Tile`);
}
for (const e of EVENT_TILES) {
  assert(!SAFE_CELLS.has(e), `ADVENTURE TILE TEST: Event Tile at abs ${e} is not a Safe Cell`);
}

// -----------------------------------------------------------------
// 2. SPATIAL HELPER TESTS
// -----------------------------------------------------------------
// Red start is 1. Next safe zones on track: 1, 9, 14, 22, 27, 35, 40, 48.
const redNextSafeFrom5 = findNextSafeZone('RED', 5);
assert(redNextSafeFrom5 === 9, 'SPATIAL TEST: From relative 5, next safe zone for Red is 9 (abs 9)');

const greenNextSafeFrom1 = findNextSafeZone('GREEN', 1);
// Green start is 14. Rel 1 = 14 (safe). Rel 2 = 15.
// Next safe for Green ahead of rel 1 is rel 9 (abs 22).
assert(greenNextSafeFrom1 === 9, 'SPATIAL TEST: Ahead of relative 1, next safe zone for Green is relative 9 (abs 22)');

// Relative to absolute round-trip
assert(absoluteToRelative('RED', 1) === 1, 'SPATIAL TEST: Red abs 1 -> rel 1');
assert(absoluteToRelative('GREEN', 14) === 1, 'SPATIAL TEST: Green abs 14 -> rel 1');
assert(absoluteToRelative('BLUE', 27) === 1, 'SPATIAL TEST: Blue abs 27 -> rel 1');
assert(absoluteToRelative('YELLOW', 40) === 1, 'SPATIAL TEST: Yellow abs 40 -> rel 1');

// -----------------------------------------------------------------
// 3. TREASURE CARD 01 — SAFE ESCAPE
// -----------------------------------------------------------------
const engine = new LudoEngine(true);
engine.startMatch([
  { id: 'p1', name: 'Luffy' },
  { id: 'p2', name: 'Zoro' },
  { id: 'p3', name: 'Sanji' },
  { id: 'p4', name: 'Jinbe' },
]);

// Place Red token at relative 5 (Treasure tile abs 5)
(engine as any).state.players[0].tokens[0].position = 1;
(engine as any).state.currentTurnIdx = 0;
// Roll 4: lands on relative 5 (abs 5 = Treasure Tile)
engine.rollDice('p1', 4);
engine.moveToken('p1', 'RED_1', TREASURE_CARDS.TREASURE_SAFE_ESCAPE);

let state = engine.getGameState();
assert(state.activeCardEvent !== null, 'TREASURE 1: Landing on Treasure Tile opens active card event');
assert(state.activeCardEvent?.card.id === 'TREASURE_SAFE_ESCAPE', 'TREASURE 1: Opened SAFE ESCAPE');

// Resolve Safe Escape
const safeEscapeRes = engine.resolveActiveCard({ ownTokenId: 'RED_1' });
assert(safeEscapeRes.success, 'TREASURE 1: Safe Escape resolves successfully');
state = engine.getGameState();
assert(state.players[0].tokens[0].position === 9, 'TREASURE 1: Token escaped to Safe Zone at relative 9 (abs 9)');
assert(state.activeCardEvent === null, 'TREASURE 1: Active card cleared after resolution');

// -----------------------------------------------------------------
// 4. TREASURE CARD 02 — PIRATE DASH (+3)
// -----------------------------------------------------------------
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.mustSelectToken = false;
(engine as any).state.lastDiceRoll = null;
(engine as any).state.players[0].tokens[0].position = 9;

// Trigger Pirate Dash
(engine as any).state.activeCardEvent = {
  card: TREASURE_CARDS.TREASURE_PIRATE_DASH,
  cardType: 'TREASURE',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const dashRes = engine.resolveActiveCard({ ownTokenId: 'RED_1' });
assert(dashRes.success, 'TREASURE 2: Pirate Dash resolves');
state = engine.getGameState();
assert(state.players[0].tokens[0].position === 12, 'TREASURE 2: Token moved forward exactly 3 spaces (9 + 3 = 12)');

// -----------------------------------------------------------------
// 5. TREASURE CARD 03 — PIRATE SHIELD
// -----------------------------------------------------------------
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.activeCardEvent = {
  card: TREASURE_CARDS.TREASURE_PIRATE_SHIELD,
  cardType: 'TREASURE',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const shieldRes = engine.resolveActiveCard({ ownTokenId: 'RED_1' });
assert(shieldRes.success, 'TREASURE 3: Pirate Shield equipped');
state = engine.getGameState();
assert(!!state.activeShields?.includes('RED_1'), 'TREASURE 3: Token RED_1 has active shield');

// Test that Shield PREVENTS capture!
// Place Green token on abs 11, Red token on abs 12 (relative 12 for Red).
// Wait, Red token is at relative 12 (abs 12).
// Green start is 14. For Green to land on abs 12, Green needs relative pos:
// abs 12 = rel 51 for Green.
(engine as any).state.players[1].tokens[0].position = 50; // Green rel 50 = abs 11
(engine as any).state.currentTurnIdx = 1;
engine.rollDice('p2', 1);
// Green moves from 50 to 51 (abs 12) where Red is located with a shield!
engine.moveToken('p2', 'GREEN_1');
state = engine.getGameState();
assert(state.players[0].tokens[0].position === 12, 'TREASURE 3: RED_1 was NOT sent to Yard because Shield absorbed capture!');
assert(!state.activeShields?.includes('RED_1'), 'TREASURE 3: Shield was consumed upon absorbing the attack');

// -----------------------------------------------------------------
// 6. TREASURE CARD 04 — LUCKY DICE
// -----------------------------------------------------------------
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.activeCardEvent = {
  card: TREASURE_CARDS.TREASURE_LUCKY_DICE,
  cardType: 'TREASURE',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const luckyRes = engine.resolveActiveCard();
assert(luckyRes.success, 'TREASURE 4: Lucky Dice resolves');
assert(luckyRes.extraRollAwarded === true, 'TREASURE 4: Extra roll was awarded');
state = engine.getGameState();
assert(state.currentTurnIdx === 0, 'TREASURE 4: Turn stays with p1 for the bonus roll');

// -----------------------------------------------------------------
// 7. SPECIAL EVENT 01 — REVENGE
// -----------------------------------------------------------------
// First, have Green capture Red so capture history has Green as a captor
(engine as any).state.players[0].tokens[1].position = 20; // Red relative 20 = abs 20 (non-safe)
(engine as any).state.players[1].tokens[1].position = 6;  // Green rel 6 = abs 19 (non-safe)
(engine as any).state.currentTurnIdx = 1;
(engine as any).state.mustSelectToken = false;
(engine as any).state.lastDiceRoll = null;
engine.rollDice('p2', 1);
engine.moveToken('p2', 'GREEN_2'); // Lands on abs 20, captures RED_2
state = engine.getGameState();
assert(state.players[0].tokens[1].position === 0, 'CAPTURE: RED_2 captured to Yard');
assert(engine.getCaptureHistory().getCaptorsOfPlayer('p1').length === 1, 'CAPTURE: p2 recorded as captor of p1');

// Now, p1 draws REVENGE!
// Green has a token GREEN_1 at pos 51 (abs 12, non-safe)
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.mustSelectToken = false;
(engine as any).state.lastDiceRoll = null;
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_REVENGE,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const revengeRes = engine.resolveActiveCard({
  opponentId: 'p2',
  opponentTokenId: 'GREEN_1',
});
assert(revengeRes.success, 'EVENT 1: Revenge resolves successfully');
state = engine.getGameState();
assert(state.players[1].tokens[0].position === 0, 'EVENT 1: Targeted Green token returned to Yard by Revenge!');

// Revenge on a safe cell must be rejected
(engine as any).state.players[1].tokens[2].position = 1; // Green rel 1 = abs 14 (Safe)
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_REVENGE,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const revengeSafeRes = engine.resolveActiveCard({
  opponentId: 'p2',
  opponentTokenId: 'GREEN_3',
});
assert(!revengeSafeRes.success, 'EVENT 1: Revenge correctly rejected targeting token in Safe Zone');

// -----------------------------------------------------------------
// 8. SPECIAL EVENT 02 — BODY SWAP
// -----------------------------------------------------------------
// Red token at rel 12 (abs 12). Yellow token at rel 15 (abs 41).
(engine as any).state.players[0].tokens[0].position = 12; // abs 12
(engine as any).state.players[2].tokens[0].position = 2; // abs 41 for Yellow (start 40)
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_BODY_SWAP,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const swapRes = engine.resolveActiveCard({
  ownTokenId: 'RED_1',
  opponentTokenId: 'YELLOW_1',
});
assert(swapRes.success, 'EVENT 2: Body Swap resolves');
state = engine.getGameState();
// Red should now be at abs 41 (rel 41 for Red)
assert(getAbsoluteTrackPosition('RED', state.players[0].tokens[0].position) === 41, 'EVENT 2: Red token moved to abs 41');
// Yellow should now be at abs 12 (rel 38 for Yellow: (12 - 27 + 52) % 52 + 1 = 38)
assert(getAbsoluteTrackPosition('YELLOW', state.players[2].tokens[0].position) === 12, 'EVENT 2: Yellow token moved to abs 12');

// -----------------------------------------------------------------
// 9. SPECIAL EVENT 03 — ESCAPE ARTIST
// -----------------------------------------------------------------
(engine as any).state.players[0].tokens[0].position = 15; // abs 15 (non-safe)
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_ESCAPE_ARTIST,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const escapeRes = engine.resolveActiveCard({ ownTokenId: 'RED_1' });
assert(escapeRes.success, 'EVENT 3: Escape Artist resolves');
state = engine.getGameState();
assert(state.players[0].tokens[0].position === 22, 'EVENT 3: Token dashed to next Safe Zone at relative 22 (abs 22)');

// -----------------------------------------------------------------
// 10. SPECIAL EVENT 04 — WANTED!
// -----------------------------------------------------------------
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.players[1].tokens[1].position = 10; // Green token at rel 10 (abs 23)
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_WANTED,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const wantedRes = engine.resolveActiveCard({ opponentTokenId: 'GREEN_2' });
assert(wantedRes.success, 'EVENT 4: Wanted card resolves');
state = engine.getGameState();
assert(!!state.wantedTargets?.some((w) => w.targetTokenId === 'GREEN_2'), 'EVENT 4: Bounty placed on GREEN_2');

// -----------------------------------------------------------------
// 11. SPECIAL EVENT 05 & 06 — COSMETIC CARDS (PIRATE PRANK, CREW CHAOS)
// -----------------------------------------------------------------
(engine as any).state.currentTurnIdx = 0;
const prevTokensSnapshot = JSON.stringify(engine.getGameState().players.map((p) => p.tokens));
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_PIRATE_PRANK,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const prankRes = engine.resolveActiveCard();
assert(prankRes.success, 'EVENT 5: Pirate Prank resolves');
const afterTokensSnapshot = JSON.stringify(engine.getGameState().players.map((p) => p.tokens));
assert(prevTokensSnapshot === afterTokensSnapshot, 'EVENT 5: Cosmetic card did NOT alter any token positions');

// -----------------------------------------------------------------
// 12. SPECIAL EVENT 07 — CAPTAIN'S ORDER (+2)
// -----------------------------------------------------------------
(engine as any).state.players[0].tokens[0].position = 22;
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_CAPTAINS_ORDER,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const orderRes = engine.resolveActiveCard({ ownTokenId: 'RED_1' });
assert(orderRes.success, 'EVENT 7: Captain Order resolves');
state = engine.getGameState();
assert(state.players[0].tokens[0].position === 24, 'EVENT 7: Token advanced exactly 2 spaces (22 + 2 = 24)');

// -----------------------------------------------------------------
// 13. SPECIAL EVENT 08 — SECOND CHANCE
// -----------------------------------------------------------------
(engine as any).state.currentTurnIdx = 0;
(engine as any).state.activeCardEvent = {
  card: SPECIAL_EVENT_CARDS.EVENT_SECOND_CHANCE,
  cardType: 'SPECIAL_EVENT',
  playerId: 'p1',
  playerColor: 'RED',
  triggeringTokenId: 'RED_1',
  resolved: false,
};
const secondChanceRes = engine.resolveActiveCard();
assert(secondChanceRes.success, 'EVENT 8: Second Chance resolves');
assert(secondChanceRes.extraRollAwarded === true, 'EVENT 8: Second Chance awards extra roll');

// -----------------------------------------------------------------
// 14. RESET TEST (New match resets capture history, shields, bounties)
// -----------------------------------------------------------------
engine.startMatch([
  { id: 'p1', name: 'Luffy' },
  { id: 'p2', name: 'Zoro' },
  { id: 'p3', name: 'Sanji' },
  { id: 'p4', name: 'Jinbe' },
]);
state = engine.getGameState();
assert(engine.getCaptureHistory().getAllRecords().length === 0, 'RESET TEST: Capture history reset for new match');
assert(state.activeShields?.length === 0, 'RESET TEST: Active shields cleared for new match');
assert(state.wantedTargets?.length === 0, 'RESET TEST: Wanted targets cleared for new match');
assert(state.activeCardEvent === null, 'RESET TEST: Active card event cleared for new match');

console.log('==================================================');
console.log('ALL ANIME ADVENTURE LUDO TESTS PASSED (100%)');
console.log('==================================================');
