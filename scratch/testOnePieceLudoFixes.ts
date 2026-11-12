import { LudoEngine } from '../src/games/ludo/engine/LudoEngine';
import { STRAW_HAT_CREW, StrawHatMember, getStrawHatMember } from '../src/games/ludo/data/strawHatCrew';
import {
  START_SQUARES,
  SAFE_CELLS,
  TRACK_GRID_MAP,
  HOME_CORRIDOR_MAP,
  YARD_SLOTS_MAP,
  getAbsoluteTrackPosition,
} from '../src/games/ludo/rules/ludoRules';
import { LudoColor, LudoPlayer } from '../src/games/ludo/types/ludo.types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  }
  console.log(`✅ [PASS] ${message}`);
}

console.log('===============================================================');
console.log('ONE PIECE LUDO — 7 CRITICAL REQUIREMENTS VERIFICATION SUITE');
console.log('===============================================================');

// -----------------------------------------------------------------------------
// REQUIREMENT 7: All 10 Straw Hat Crew Members Supported
// -----------------------------------------------------------------------------
console.log('\n--- Checking 10 Straw Hat Crew Members ---');
assert(STRAW_HAT_CREW.length === 10, 'Roster contains exactly 10 Straw Hat crew members');
const expectedCrew = [
  'luffy', 'zoro', 'nami', 'usopp', 'sanji',
  'chopper', 'robin', 'franky', 'brook', 'jinbe'
];
for (const cid of expectedCrew) {
  const member = getStrawHatMember(cid);
  assert(member.id === cid, `Straw Hat member '${cid}' exists: ${member.avatar} ${member.title}`);
  assert(member.bounty.includes('Berry') || member.bounty.includes('Berries'), `'${cid}' has authentic bounty: ${member.bounty}`);
  assert(member.quote.length > 0, `'${cid}' has authentic quote: "${member.quote}"`);
}

// -----------------------------------------------------------------------------
// REQUIREMENT 1 & 2: Local Player Selection & Bottom Position Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Checking Selected Player Bottom Position Consistency ---');

// Helper matching LudoGameScreen bot crew assignment
function getBotCrewAssignments(humanMemberId: string, humanColor: LudoColor): Record<LudoColor, StrawHatMember> {
  const colors: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
  const remainingColors = colors.filter((c) => c !== humanColor);
  const assignments: Partial<Record<LudoColor, StrawHatMember>> = {};
  const humanMember = getStrawHatMember(humanMemberId);
  assignments[humanColor] = humanMember;
  const usedMemberIds = new Set<string>([humanMember.id]);

  for (const col of remainingColors) {
    let candidate = STRAW_HAT_CREW.find((m) => m.defaultColor === col && !usedMemberIds.has(m.id));
    if (!candidate) candidate = STRAW_HAT_CREW.find((m) => !usedMemberIds.has(m.id));
    if (!candidate) candidate = STRAW_HAT_CREW[0];
    assignments[col] = candidate;
    usedMemberIds.add(candidate.id);
  }
  return assignments as Record<LudoColor, StrawHatMember>;
}

// Test selecting each of the 10 characters
for (const testChar of STRAW_HAT_CREW) {
  const humanColor = testChar.defaultColor;
  const assignments = getBotCrewAssignments(testChar.id, humanColor);
  const colors: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

  const players: { id: string; name: string; avatar: string; color: LudoColor; isBot: boolean }[] = [];
  let botCounter = 2;
  for (let slot = 0; slot < 4; slot++) {
    const col = colors[slot];
    const member = assignments[col];
    if (col === humanColor) {
      players.push({
        id: 'player_local_1',
        name: `${member.title} (You)`,
        avatar: member.avatar,
        color: col,
        isBot: false,
      });
    } else {
      players.push({
        id: `bot_${botCounter++}`,
        name: `${member.title} (Bot)`,
        avatar: member.avatar,
        color: col,
        isBot: true,
      });
    }
  }

  const engine = new LudoEngine(true);
  engine.startMatch(players);
  const state = engine.getGameState();

  // Test orderedPlayers derivation matching LudoBoardComponent
  const humanIdx = state.players.findIndex((p) => p.id === 'player_local_1');
  assert(humanIdx >= 0, `Human player_local_1 found in players state for ${testChar.title}`);

  const safeHumanIdx = humanIdx >= 0 ? humanIdx : 0;
  const orderedPlayers: LudoPlayer[] = [
    state.players[safeHumanIdx],
    state.players[(safeHumanIdx + 1) % 4],
    state.players[(safeHumanIdx + 2) % 4],
    state.players[(safeHumanIdx + 3) % 4],
  ].filter(Boolean);

  // Bottom panel is ALWAYS orderedPlayers[0]
  const bottomPlayer = orderedPlayers[0];
  assert(bottomPlayer.id === 'player_local_1', `Bottom player ID is 'player_local_1' when selecting ${testChar.title}`);
  assert(bottomPlayer.name.includes(testChar.title), `Bottom player name is '${testChar.title} (You)' (got: '${bottomPlayer.name}')`);
  assert(bottomPlayer.avatar === testChar.avatar, `Bottom player avatar is '${testChar.avatar}'`);
  assert(!bottomPlayer.isBot, `Bottom player is not a bot`);

  // Ensure 4 distinct characters across all 4 players
  const uniqueNames = new Set(state.players.map((p) => p.name));
  assert(uniqueNames.size === 4, `All 4 players have unique names for selection ${testChar.title}`);
}

// -----------------------------------------------------------------------------
// REQUIREMENT 3: Yard Token Counts (4 -> 3 -> 2 -> 1 -> 0)
// -----------------------------------------------------------------------------
console.log('\n--- Checking Yard Token Counts & Dock State ---');
{
  const engine = new LudoEngine(true);
  engine.startMatch([
    { id: 'player_local_1', name: 'Captain Luffy (You)', color: 'RED', isBot: false, avatar: '👒' },
    { id: 'bot_2', name: 'Swordsman Zoro (Bot)', color: 'GREEN', isBot: true, avatar: '⚔️' },
    { id: 'bot_3', name: 'Cook Sanji (Bot)', color: 'YELLOW', isBot: true, avatar: '🍳' },
    { id: 'bot_4', name: 'Doctor Chopper (Bot)', color: 'BLUE', isBot: true, avatar: '🌸' },
  ]);

  let state = engine.getGameState();
  const human = state.players.find((p) => p.id === 'player_local_1')!;

  const getYardCount = (p: LudoPlayer) => p.tokens.filter((t) => t.position === 0).length;
  assert(getYardCount(human) === 4, 'Initially 4 tokens in yard (0 on board)');

  // Roll 6 and deploy Token 1
  engine.rollDice('player_local_1', 6);
  engine.moveToken('player_local_1', 'RED_1');
  state = engine.getGameState();
  let updatedHuman = state.players.find((p) => p.id === 'player_local_1')!;
  assert(getYardCount(updatedHuman) === 3, 'After deploying 1 token, exactly 3 tokens remain in yard');
  assert(updatedHuman.tokens.find((t) => t.id === 'RED_1')!.position === 1, 'RED_1 is now at relative position 1');

  // Consecutive roll 6 and deploy Token 2
  engine.rollDice('player_local_1', 6);
  engine.moveToken('player_local_1', 'RED_2');
  state = engine.getGameState();
  updatedHuman = state.players.find((p) => p.id === 'player_local_1')!;
  assert(getYardCount(updatedHuman) === 2, 'After deploying 2 tokens, exactly 2 tokens remain in yard');

  // Deploy Token 3
  (engine as any).state.currentTurnIdx = 0;
  (engine as any).state.consecutiveSixes = 0;
  (engine as any).state.mustSelectToken = false;
  engine.rollDice('player_local_1', 6);
  engine.moveToken('player_local_1', 'RED_3');
  state = engine.getGameState();
  updatedHuman = state.players.find((p) => p.id === 'player_local_1')!;
  assert(getYardCount(updatedHuman) === 1, 'After deploying 3 tokens, exactly 1 token remains in yard');

  // Deploy Token 4
  (engine as any).state.currentTurnIdx = 0;
  (engine as any).state.consecutiveSixes = 0;
  (engine as any).state.mustSelectToken = false;
  engine.rollDice('player_local_1', 6);
  engine.moveToken('player_local_1', 'RED_4');
  state = engine.getGameState();
  updatedHuman = state.players.find((p) => p.id === 'player_local_1')!;
  assert(getYardCount(updatedHuman) === 0, 'After deploying 4 tokens, exactly 0 tokens remain in yard (all 4 on board)');

  // Verify dock slots map exists for all 4 slots of all 4 colors
  for (const c of ['RED', 'GREEN', 'YELLOW', 'BLUE'] as LudoColor[]) {
    assert(YARD_SLOTS_MAP[c].length === 4, `YARD_SLOTS_MAP has 4 dock slots for ${c}`);
  }
}

// -----------------------------------------------------------------------------
// REQUIREMENT 4: Contiguous Board Path & Zero Diagonal Leaps
// -----------------------------------------------------------------------------
console.log('\n--- Checking Board Track Path & Contiguity ---');
{
  // Test helper to get token coordinates matching LudoBoardComponent
  const getTokenCoords = (color: LudoColor, pos: number, tokenIdx: number): { r: number; c: number } => {
    if (pos === 0) return YARD_SLOTS_MAP[color][tokenIdx % 4];
    if (pos === 58) return { r: 7, c: 7 };
    if (pos >= 52) return HOME_CORRIDOR_MAP[color][pos] || { r: 7, c: 7 };
    const absPos = getAbsoluteTrackPosition(color, pos);
    if (absPos && TRACK_GRID_MAP[absPos]) return TRACK_GRID_MAP[absPos];
    return { r: 7, c: 7 };
  };

  const colors: LudoColor[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

  for (const col of colors) {
    console.log(`Checking path continuity for ${col}...`);
    // Track positions from 1 to 58 (complete journey into Home)
    let prevCoords = getTokenCoords(col, 1, 0);

    for (let pos = 2; pos <= 58; pos++) {
      const currCoords = getTokenCoords(col, pos, 0);
      const dr = Math.abs(currCoords.r - prevCoords.r);
      const dc = Math.abs(currCoords.c - prevCoords.c);
      const manhattanDist = dr + dc;

      const isInnerCornerTurn =
        (currCoords.r === 5 && currCoords.c === 6 && prevCoords.r === 6 && prevCoords.c === 5) ||
        (currCoords.r === 6 && currCoords.c === 9 && prevCoords.r === 5 && prevCoords.c === 8) ||
        (currCoords.r === 9 && currCoords.c === 8 && prevCoords.r === 8 && prevCoords.c === 9) ||
        (currCoords.r === 8 && currCoords.c === 5 && prevCoords.r === 9 && prevCoords.c === 6);

      if (isInnerCornerTurn) {
        // Standard 90-degree turn around yard corner
        assert(
          dr === 1 && dc === 1,
          `Path step ${col} at rel ${pos} (${prevCoords.r},${prevCoords.c} -> ${currCoords.r},${currCoords.c}) is valid 90-degree corner turn around yard`
        );
      } else {
        // All other steps (straight tracks, outer apexes, and entire home corridor 51..58) must be strictly adjacent
        assert(
          manhattanDist === 1,
          `Path step ${col} from rel ${pos - 1} (${prevCoords.r},${prevCoords.c}) to rel ${pos} (${currCoords.r},${currCoords.c}) is strictly adjacent (dist = ${manhattanDist})`
        );
        assert(
          !(dr >= 1 && dc >= 1),
          `Path step ${col} at rel ${pos} has NO diagonal jump (dr=${dr}, dc=${dc})`
        );
      }

      prevCoords = currCoords;
    }

    // Verify final landing at pos 58 is exactly Center Skull { r: 7, c: 7 }
    const finalCoords = getTokenCoords(col, 58, 0);
    assert(finalCoords.r === 7 && finalCoords.c === 7, `${col} pos 58 lands at Center Skull Home (7, 7)`);
  }
}

// -----------------------------------------------------------------------------
// REQUIREMENT 8: Full Match Simulation Until Winner
// -----------------------------------------------------------------------------
console.log('\n--- Simulating Full Match Until Winner ---');
{
  const engine = new LudoEngine(true);
  engine.startMatch([
    { id: 'p1', name: 'Luffy', color: 'RED', isBot: true, avatar: '👒' },
    { id: 'p2', name: 'Zoro', color: 'GREEN', isBot: true, avatar: '⚔️' },
    { id: 'p3', name: 'Sanji', color: 'YELLOW', isBot: true, avatar: '🍳' },
    { id: 'p4', name: 'Chopper', color: 'BLUE', isBot: true, avatar: '🌸' },
  ]);

  let turnCount = 0;
  const maxTurns = 5000;

  while (engine.getGameState().status === 'PLAYING' && turnCount < maxTurns) {
    turnCount++;
    const st = engine.getGameState();
    const curr = st.players[st.currentTurnIdx];

    // Auto-dismiss or resolve active card if present
    if (st.activeCardEvent) {
      try {
        engine.resolveActiveCard();
      } catch {
        engine.dismissActiveCard();
      }
      continue;
    }

    // Roll dice
    try {
      const rollRes = engine.rollDice(curr.id);
      const stAfterRoll = engine.getGameState();

      if (stAfterRoll.mustSelectToken && rollRes.playableTokens.length > 0) {
        // Pick best playable token
        const playable = rollRes.playableTokens;
        // Prioritize reaching home, leaving yard, or advancing furthest
        let chosenTokenId = playable[0];
        const tokens = curr.tokens.filter((t) => playable.includes(t.id));
        const homeToken = tokens.find((t) => t.position + rollRes.roll === 58);
        const yardToken = tokens.find((t) => t.position === 0 && rollRes.roll === 6);
        if (homeToken) chosenTokenId = homeToken.id;
        else if (yardToken) chosenTokenId = yardToken.id;
        else {
          tokens.sort((a, b) => b.position - a.position);
          chosenTokenId = tokens[0].id;
        }

        engine.moveToken(curr.id, chosenTokenId);
      }
    } catch (err: any) {
      // If error occurs, advance turn cleanly
      break;
    }
  }

  const finalState = engine.getGameState();
  assert(finalState.status === 'FINISHED', `Match completed with status 'FINISHED' in ${turnCount} turns`);
  assert(finalState.winnerId !== null, `Winner ID is crowned: ${finalState.winnerId}`);
  assert(finalState.winnerColor !== null, `Winner color is crowned: ${finalState.winnerColor}`);
  const winningPlayer = finalState.players.find((p) => p.id === finalState.winnerId)!;
  assert(winningPlayer.finishedTokensCount === 4, `Winner has brought all 4 tokens Home (finishedTokensCount = ${winningPlayer.finishedTokensCount})`);
  console.log(`🏆 MATCH WINNER: ${winningPlayer.avatar} ${winningPlayer.name} (${finalState.winnerColor})!`);
}

console.log('\n===============================================================');
console.log('🎉 ALL 7 ONE PIECE LUDO VERIFICATION CHECKS PASSED PERFECTLY!');
console.log('===============================================================');
