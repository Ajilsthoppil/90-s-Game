import { LudoEngine } from '../src/games/ludo/engine/LudoEngine';
import { LudoBot } from '../src/games/ludo/bot/LudoBot';
import { STRAW_HAT_CREW, getStrawHatMember } from '../src/games/ludo/data/strawHatCrew';
import { LudoColor } from '../src/games/ludo/types/ludo.types';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ [FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`✅ [PASS] ${msg}`);
}

console.log('===============================================================');
console.log('SIMULATING COMPLETE GAMEPLAY & VERIFYING ZERO ERRORS');
console.log('===============================================================');

// Set up match with User as Swordsman Zoro in Left Side Down (YELLOW)
const engine = new LudoEngine(true);

const players = [
  {
    id: 'bot_luffy',
    name: 'Captain Luffy (Bot)',
    avatar: '👒',
    color: 'RED' as LudoColor,
    characterId: 'luffy',
    isBot: true,
  },
  {
    id: 'bot_nami',
    name: 'Navigator Nami (Bot)',
    avatar: '🍊',
    color: 'GREEN' as LudoColor,
    characterId: 'nami',
    isBot: true,
  },
  {
    id: 'player_local_1',
    name: 'Swordsman Zoro (You)',
    avatar: '⚔️',
    color: 'YELLOW' as LudoColor,
    characterId: 'zoro',
    isBot: false,
  },
  {
    id: 'bot_chopper',
    name: 'Doctor Chopper (Bot)',
    avatar: '🌸',
    color: 'BLUE' as LudoColor,
    characterId: 'chopper',
    isBot: true,
  },
];

engine.startMatch(players);
console.log('Match successfully started!');

let state = engine.getGameState();
assert(state.status === 'PLAYING', 'Status is PLAYING');
assert(state.players.length === 4, '4 players initialized');

// Let bots and auto-player play a series of 150 turns to verify engine stability
let turns = 0;
let errors = 0;

while (state.status === 'PLAYING' && turns < 600) {
  turns++;
  const curr = state.players[state.currentTurnIdx];
  if (!curr) break;

  try {
    // 1. If active card event exists, resolve it
    if (state.activeCardEvent) {
      engine.dismissActiveCard();
      state = engine.getGameState();
      continue;
    }

    // 2. Roll dice
    if (!state.mustSelectToken) {
      const { playableTokens } = engine.rollDice(curr.id);
      state = engine.getGameState();

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
    console.error(`Error on turn ${turns} for ${curr.name}:`, err.message);
    errors++;
    break;
  }
}

console.log(`\nSimulation finished after ${turns} actions.`);
console.log(`Final Status: ${state.status}`);
if (state.status === 'FINISHED') {
  console.log(`🏆 Winner: ${state.players.find(p => p.id === state.winnerId)?.name} (${state.winnerColor})!`);
} else {
  console.log(`Game ongoing smoothly with 0 exceptions at turn ${turns}.`);
}

assert(errors === 0, 'Zero runtime errors occurred during entire game simulation');
console.log('===============================================================');
console.log('🎉 LIVE GAMEPLAY SIMULATION TEST PASSED WITH 0 ERRORS!');
console.log('===============================================================');
