# Chess App Feature Spec: Game Loading, Openings, Modal UI

**Date:** 2026-07-20
**Status:** Approved

## [S1] Problem

The chess app currently only supports starting a new game from scratch (pick side → play). Users cannot load existing games from PGN/FEN notation or Chess.com, nor can they practice specific openings. The setup UI is a simple dropdown that disappears once the game starts.

## [S2] Solution Overview

Replace the current setup section with a persistent modal overlay containing 3 tabs:

1. **New Game** — current behavior (pick side, start)
2. **Load Game** — paste PGN, paste FEN, or fetch from Chess.com by username
3. **Openings** — browse/search openings, replay or force practice mode

All game loading is client-side (chess.js parses PGN/FEN, Chess.com API is public CORS). No server changes needed.

## [S3] Modal Overlay UI

A single modal with 3 tabs replaces the current `#setup-section` in `page.tsx`.

**Tabs:**
- `♟ New Game` — side picker (White/Black) + Start button
- `📂 Load Game` — 3 sub-tabs: PGN, FEN, Chess.com
- `📖 Openings` — search bar + first-move filters + opening list + mode selector

**Behavior:**
- Modal opens on page load (before any game starts)
- Modal can be reopened via a "New Game" button in the status panel during play
- Modal dismisses when a game is started/loaded
- Board is visible behind the modal (dimmed)

**State additions to `page.tsx`:**
- `modalOpen: boolean`
- `activeTab: 'new' | 'load' | 'openings'`
- `loadSubTab: 'pgn' | 'fen' | 'chesscom'`

## [S4] PGN Loading

**Input:** Textarea for pasting PGN notation.

**Parsing:**
- Use `chess.js` client-side: `new Chess().load_pgn(pgnString)`
- Extract headers: White, Black, Result, Date
- If multiple games in PGN (separated by `\n\n\n`), show a game selector

**Flow:**
1. User pastes PGN
2. Parse and validate
3. Show preview: players, result, move count
4. User clicks "Load Game"
5. Modal closes, board replays all moves, game continues from final position (or game-over state)

**Error states:**
- Invalid PGN → red border + "Could not parse PGN"
- Empty input → disable Load button

**New file:** `lib/pgn-parser.ts`
- `parsePGN(pgn: string): { games: ParsedGame[], error?: string }`
- `ParsedGame = { headers: Record<string,string>, moves: string[], fen: string }`

## [S5] FEN Loading

**Input:** Text input for FEN string.

**Parsing:**
- Validate with `new Chess().load(fen)`
- Determine turn from FEN (6th field)

**Flow:**
1. User pastes FEN
2. Validate
3. Show preview: whose turn, castling rights, move number
4. User picks side (if FEN turn matches their choice, they play; otherwise AI goes first)
5. Modal closes, board jumps to position

**Error states:**
- Invalid FEN → red border + "Invalid FEN string"

## [S6] Chess.com Integration

**Flow:**
1. User enters Chess.com username
2. Fetch `https://api.chess.com/pub/player/{username}/games/archives` (CORS-enabled)
3. Show list of monthly archives (most recent first)
4. User clicks an archive → fetch games list
5. Show games: opponent name, result, date
6. User clicks a game → extract PGN from response, load onto board

**New file:** `lib/chesscom-api.ts`
- `fetchArchives(username: string): Promise<Archive[]>`
- `fetchGames(archiveUrl: string): Promise<ChessComGame[]>`
- `Archive = { url: string, year: number, month: number }`
- `ChessComGame = { pgn: string, opponent: string, result: string, date: string }`

**Error states:**
- Invalid username → "Player not found"
- Network error → "Could not connect to Chess.com"
- Private profile → "Profile is private"
- No games → "No games found for this player"

**UX:**
- Loading spinner during API calls
- Cache fetched archives in component state to avoid re-fetching

## [S7] Opening Picker

**Opening database:** Static JSON file with ~30-50 common openings.

**New file:** `lib/openings.ts`
- `OPENINGS: Opening[]` — static array
- `Opening = { name: string, moves: string[], eco: string, category: string }`
- `searchOpenings(query: string): Opening[]`
- `filterByFirstMove(move: string): Opening[]`

**UI elements:**
- Search bar (filters by opening name)
- First-move filter buttons: 1.e4, 1.d4, 1.c4, 1.Nf3
- Scrollable list of matching openings (name + move sequence preview)
- Two mode buttons: "🔄 Replay (Demo)" and "🔒 Force (Practice)"

**Replay (Demo) mode:**
- AI plays the opening moves on the board at ~1 move/sec
- User watches the sequence unfold
- After replay ends, game continues normally (AI vs user)
- Implementation: setTimeout loop over opening moves, call `chess.move()` + update board position

**Force (Practice) mode:**
- User must play the opening moves in order
- Track `forceMoveIndex` — the next expected move in the sequence
- On user move: check if it matches `opening.moves[forceMoveIndex]`
  - Match → increment index, continue
  - Mismatch → show warning toast "Wrong move! Expected: [move]"
  - User can click "Try Again" (reset to index 0) or "Free Play" (stop forcing)
- After all opening moves are played, game continues normally

**State additions:**
- `selectedOpening: Opening | null`
- `openingMode: 'replay' | 'force' | null`
- `forceMoveIndex: number`

## [S8] Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid PGN | Red border + "Could not parse PGN" message |
| Invalid FEN | Red border + "Invalid FEN string" message |
| Empty input | Disable Load/Start button |
| Chess.com invalid username | "Player not found" message |
| Chess.com network error | "Could not connect to Chess.com" message |
| Chess.com private profile | "Profile is private" message |
| Chess.com no games | "No games found for this player" message |
| Opening force mode deviation | Toast warning + reset/free-play options |
| Multiple PGN games | Show game selector (players, date, result) |

## [S9] Architecture

**Files to create:**
- `lib/openings.ts` — opening database + search/filter
- `lib/pgn-parser.ts` — PGN validation + parsing wrapper
- `lib/chesscom-api.ts` — Chess.com API fetch functions

**Files to modify:**
- `app/page.tsx` — modal state, tab switching, loading handlers, opening mode logic
- `app/globals.css` — modal styles, tabs, opening list, toast notifications

**No server changes** — all parsing is client-side, Chess.com API is public CORS.

**Dependencies:** No new npm packages needed — chess.js (already installed) handles PGN/FEN parsing.

## [S10] Testing Strategy

- Manual testing: paste known PGNs/FENs, verify board loads correctly
- Test Chess.com fetch with real usernames
- Test opening replay and force modes
- Test error states (invalid input, network failures)
- No automated tests (project has no test framework)
