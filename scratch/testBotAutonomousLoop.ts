import { LudoEngine } from '../src/games/ludo/engine/LudoEngine';
import { LudoBot } from '../src/games/ludo/bot/LudoBot';
import { LudoColor } from '../src/games/ludo/types/ludo.types';
declare const process: any;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ [PASS] ${msg}`);
}

console.log('===============================================================');
console.log('TEST: AUTONOMOUS BOT ROLL EXECUTION ON MATCH START');
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

// Instantiate and activate bots
const bots = players
  .filter((p) => p.isBot)
  .map((p) => {
    const bot = new LudoBot(engine, p.id);
    bot.activate();
    return bot;
  });

// Start match - Player 0 is bot_luffy!
engine.startMatch(players);
let state = engine.getGameState();

assert(state.status === 'PLAYING', 'Match status is PLAYING');
assert(state.currentTurnIdx === 0, 'Turn 0 belongs to Player 0');
assert(state.players[0].isBot === true, 'Player 0 is a BOT (Luffy)');
assert(state.rollNonce === 0, 'rollNonce starts at 0');

console.log('Waiting 1500ms for Player 0 (Bot) to AUTONOMOUSLY roll dice...');

setTimeout(() => {
  const newState = engine.getGameState();
  console.log('State after 1500ms:');
  console.log(`- rollNonce: ${newState.rollNonce}`);
  console.log(`- lastDiceRoll: ${newState.lastDiceRoll}`);
  console.log(`- lastActionMessage: ${newState.lastActionMessage}`);

  assert(
    (newState.rollNonce || 0) > 0,
    `Player 0 (Bot) autonomously rolled the dice! (rollNonce = ${newState.rollNonce})`
  );
  assert(
    newState.lastDiceRoll !== null,
    `Dice value rolled by bot: ${newState.lastDiceRoll}`
  );

  console.log('\n===============================================================');
  console.log('🎉 AUTONOMOUS BOT ROLL TEST PASSED PERFECTLY!');
  console.log('===============================================================');

  // Clean up
  bots.forEach((b) => b.deactivate());
  process.exit(0);
}, 1600);
