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
console.log('TEST: HUMAN DICE ROLL ON HUMAN TURN AFTER BOT ROLLS');
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
    id: 'player_local_1',
    name: 'Zoro (You)',
    avatar: '⚔️',
    color: 'GREEN' as LudoColor,
    characterId: 'zoro',
    isBot: false,
  },
  {
    id: 'bot_sanji',
    name: 'Sanji (Bot)',
    avatar: '🍳',
    color: 'YELLOW' as LudoColor,
    characterId: 'sanji',
    isBot: true,
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

// Instantiate and activate bots for bot players
const bots = players
  .filter((p) => p.isBot)
  .map((p) => {
    const bot = new LudoBot(engine, p.id);
    bot.activate();
    return bot;
  });

// Start match - Turn 0 belongs to bot_luffy (RED)
engine.startMatch(players);
let state = engine.getGameState();
assert(state.status === 'PLAYING', 'Game started in PLAYING state');
assert(state.currentTurnIdx === 0, 'Turn 0 is bot_luffy');

// Simulate bot_luffy rolling non-6 so turn advances to player_local_1 (Zoro / You)
const botRoll = engine.rollDice('bot_luffy', 2);
state = engine.getGameState();
console.log(`Bot rolled: ${botRoll.roll}`);
console.log(`Current turn index after bot roll: ${state.currentTurnIdx}`);
console.log(`Current player: ${state.players[state.currentTurnIdx].name}`);

assert(state.currentTurnIdx === 1, 'Turn successfully advanced to Player 1 (Zoro / You)');
assert(!state.players[state.currentTurnIdx].isBot, 'Current player is HUMAN');

// Now HUMAN rolls the dice!
const initialNonce = state.rollNonce || 0;
console.log(`rollNonce before human roll: ${initialNonce}`);

const humanRollResult = engine.rollDice('player_local_1');
state = engine.getGameState();

console.log(`Human rolled: ${humanRollResult.roll}`);
console.log(`rollNonce after human roll: ${state.rollNonce}`);

assert(
  (state.rollNonce || 0) === initialNonce + 1,
  'rollNonce incremented cleanly for Human roll'
);
assert(
  state.lastDiceRoll === humanRollResult.roll,
  `lastDiceRoll matches human roll (${humanRollResult.roll})`
);

console.log('\n===============================================================');
console.log('🎉 HUMAN DICE ROLL VERIFICATION PASSED WITH 0 ERRORS!');
console.log('===============================================================');

bots.forEach((b) => b.deactivate());
