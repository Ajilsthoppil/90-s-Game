# 90s Kids Kerala Games — Multi-Game Architecture Documentation

This document describes the multi-game library architecture designed in **Phase 4** of the 90s Kids Kerala Games application.

---

## 1. Overview & Core Design Goals

The primary goal of the multi-game architecture is to allow adding future childhood games (Paper Games, Number Games, Hand Games, School Games, Kerala Village Games) **without modifying core navigation, repositories, or UI layout files**.

Bingo is the first fully implemented game module and lives in its own isolated directory: `src/games/bingo/`.

---

## 2. Architecture Diagram

```
Home Screen
    ↓
GameRegistry  <--- (Query helper API: getAllGames, getAvailableGames, getGameById)
    ↓
GameDefinition & GameCapabilities
    ↓
Game Session / RoomController
    ↓
Game Engine (BingoEngine, etc.)
    ↓
Game Repository (LocalGameRepository -> Future ApiGameRepository -> FastAPI -> PostgreSQL)
```

---

## 3. Key Concepts & Domain Boundaries

### A. `GameDefinition` (`src/games/types/game.types.ts`)
A data-driven schema defining a game's metadata (id, title, emoji, category, min/max players, capabilities, availability status). No game rules live inside `GameDefinition`.

### B. `GameRegistry` (`src/games/GameRegistry.ts`)
The central registry containing all registered games.
- Provides helper methods: `getAllGames()`, `getAvailableGames()`, `getComingSoonGames()`, `getGameById(id)`, `isGameAvailable(id)`.
- Replaces hardcoded UI checks throughout `HomeScreen` and navigation components.

### C. `GameCapabilities` (`src/games/types/game.types.ts`)
Defines what features a game supports:
- `supportsLocalMultiplayer`
- `supportsRemoteMultiplayer`
- `supportsVoice`
- `supportsReactions`
- `supportsScoreboard`
- `supportsReplay`

### D. `GameSession` (`src/games/types/game.types.ts`)
A generic session entity representing an instance of a game inside a room.
- Holds `sessionId`, `roomId`, `gameId`, `matchId`, `status`, `createdAt`, `startedAt`, `finishedAt`.

### E. `GameEngine` Interface (`src/games/types/game.types.ts`)
A generic interface that game engines implement or adapt to (`getState()`, `start()`, `reset()`). Strongly typed engines like `BingoEngine` retain their full specific API.

### F. Module Boundaries
```
src/games/
├── GameRegistry.ts
├── types/
│   └── game.types.ts
├── bingo/
│   ├── components/
│   ├── controllers/
│   ├── engine/
│   ├── events/
│   ├── rules/
│   └── types/
├── paper/        (Future game module)
├── number/       (Future game module)
└── hand/         (Future game module)
```

---

## 4. Room, Game & Match Relationship

A `GameRoom` is generic and can host different games across matches over time:

```
Room 90S-7291
 ├── Bingo
 │    ├── Match #1
 │    └── Match #2
 └── Paper Games (Future)
      └── Match #1
```

---

## 6. Phase 5 Architecture — System Bots, Mandatory Rules & Saved Boards

Phase 5 extends Bingo to a complete offline standalone game:

### A. System Bot Engine (`src/games/bingo/bot/`)
- `BingoBot`: Deterministic System Bot opponent. Each bot instance wraps a private `BingoEngine` so it obeys all standard Bingo rules (no cheating, illegal marking rejection, mandatory host call broadcasts).
- `botTypes.ts`: Defines `BotPersonality` and preset bots (*Robo Monu 🤖*, *School Bot 🤖*, *Kunjunni 🤖*, *Bingo Chettan 🤖*) with difficulty-based decision delays (`EASY` ~800ms, `NORMAL` ~500ms, `HARD` ~250ms).
- `RoomController.setupBotOpponents(count)`: Dynamically adds 1, 2, or 3 System Bots to a match room.

### B. Mandatory Rules Confirmation (`GameRulesModal.tsx`)
- Displays nostalgic 90s Kerala notebook rules modal before every match.
- Includes `[ OK, I UNDERSTAND ]` acknowledgment button to ensure all players confirm rules before starting.

### C. Redesigned Board Setup & Persistence (`BoardSetupContainer.tsx`)
- 4 Tab Interface: 🎲 Random Board, ✏️ Manual Creation, 💾 Saved Boards, 🕘 Recently Used Boards.
- Template Immutability: When a saved template is loaded into a match, `cloneGrid` creates a deep copy for the `BingoEngine`, ensuring gameplay markings never mutate stored board templates.
- Recently Used Stack: Stores up to 10 recently played board configurations automatically via `localGameRepository`.

