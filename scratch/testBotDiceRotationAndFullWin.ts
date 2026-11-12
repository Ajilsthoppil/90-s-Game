import { LudoEngine } from '../src/games/ludo/engine/LudoEngine';
import { LudoBot } from '../src/games/ludo/bot/LudoBot';
import { LudoColor } from '../src/games/ludo/types/ludo.types';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ [PASS] ${msg}`);
}

console.log('===============================================================');
console.log('TEST: BOT DICE ROLL ROTATION (rollNonce) & FULL MATCH VICTORY');
console.log('===============================================================');

const engine = new LudoEngine(true);

const players = [
  {
    id: 'bot_luffy',
    name: 'Luffy (Bot)',
    avatar: '👒',
    color: 'RED' as LudoColor,
    characterId: 'luffy',
    isBot: true,
  },
  {
    id: 'bot_zoro',
    name: 'Zoro (Bot)',
    avatar: '⚔️',
    color: 'GREEN' as LudoColor,
    characterId: 'zoro',
    isBot: true,
  },
  {
    id: 'player_local_1',
    name: 'Sanji (You)',
    avatar: '🍳',
    color: 'YELLOW' as LudoColor,
    characterId: 'sanji',
    isBot: false,
  },
  {
    id: 'bot_brook',
    name: 'Brook (Bot)',
    avatar: '🎻',
    color: 'BLUE' as LudoColor,
    characterId: 'brook',
    isBot: true,
  },
];

engine.startMatch(players);
let state = engine.getGameState();

assert(state.status === 'PLAYING', 'Match successfully started');
assert(state.rollNonce === 0, 'rollNonce initialized to 0');

// 1. Test that whenever a bot rolls, rollNonce increments
const firstPlayer = state.players[state.currentTurnIdx];
console.log(`First turn: ${firstPlayer.name} (${firstPlayer.isBot ? 'Bot' : 'Human'})`);

const initialNonce = state.rollNonce || 0;
const rollRes = engine.rollDice(firstPlayer.id);
state = engine.getGameState();

assert(
  (state.rollNonce || 0) === initialNonce + 1,
  `rollNonce incremented from ${initialNonce} to ${state.rollNonce} on roll (Value: ${rollRes.roll})`
);
assert(state.lastDiceRoll === rollRes.roll, `lastDiceRoll is set to ${rollRes.roll}`);

// 2. Simulate complete game until ONE PLAYER WINS
console.log('\n--- Simulating Match until a Player Wins ---');
let totalTurns = 0;
let botRollsCount = 0;
let humanRollsCount = 0;

while (state.status === 'PLAYING' && totalTurns < 1200) {
  totalTurns++;
  const curr = state.players[state.currentTurnIdx];
  if (!curr) break;

  try {
    // Dismiss active cards if any
    if (state.activeCardEvent) {
      engine.dismissActiveCard();
      state = engine.getGameState();
      continue;
    }

    if (!state.mustSelectToken) {
      const prevNonce = state.rollNonce || 0;
      const { roll, playableTokens } = engine.rollDice(curr.id);
      state = engine.getGameState();

      if (curr.isBot) botRollsCount++;
      else humanRollsCount++;

      assert(
        (state.rollNonce || 0) === prevNonce + 1,
        `Turn ${totalTurns}: ${curr.name} roll triggered rollNonce increment (${state.rollNonce})`
      );

      if (playableTokens.length > 0) {
        // Move first playable token
        engine.moveToken(curr.id, playableTokens[0]);
        state = engine.getGameState();
      }
    } else {
      const playable = engine.getPlayableTokenIds(curr.id);
      if (playable.length > 0) {
        engine.moveToken(curr.id, playable[0]);
        state = engine.getGameState();
      }
    }
  } catch (err: any) {
    console.error(`Error on turn ${totalTurns} for ${curr.name}:`, err.message);
    break;
  }
}

console.log(`\nMatch ended after ${totalTurns} turns!`);
console.log(`Bot rolls verified: ${botRollsCount}, Human rolls verified: ${humanRollsCount}`);
console.log(`Total rollNonce reached: ${state.rollNonce}`);

assert(state.status === 'FINISHED', "Match status is 'FINISHED'");
assert(state.winnerId !== null, `Winner ID is present: ${state.winnerId}`);
assert(state.winnerColor !== null, `Winner Color is present: ${state.winnerColor}`);

const winnerPlayer = state.players.find((p) => p.id === state.winnerId);
assert(winnerPlayer !== undefined, `Winner player found: ${winnerPlayer?.name}`);
assert(winnerPlayer?.finishedTokensCount === 4, `Winner has brought all 4 tokens Home: ${winnerPlayer?.finishedTokensCount}/4`);

console.log('\n===============================================================');
console.log(`🏆 VICTORY CONFIRMED: ${winnerPlayer?.avatar} ${winnerPlayer?.name} (${winnerPlayer?.color}) WON THE MATCH!`);
console.log(`🎲 All ${botRollsCount} bot rolls successfully triggered rollNonce & dice rotation!`);
console.log('🎉 ALL TESTS PASSED WITH 0 ERRORS!');
console.log('===============================================================');
