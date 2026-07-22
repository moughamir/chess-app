# Chess App Restructure — Design Spec

**Date:** 2026-07-22
**Status:** Approved
**Approach:** Incremental Modular Rewrite

---

## [S1] Architecture Overview

**Goal:** Transform the monolithic 1088-line `page.tsx` into a clean, testable component architecture while preserving all existing features.

**Key principles:**
- **Single responsibility:** Each component does one thing
- **No jQuery:** Replace chessboard.js/jQuery with React-controlled board rendering
- **Type safety:** Eliminate all `any` types with proper TypeScript interfaces
- **No XSS:** Replace `dangerouslySetInnerHTML` with React element rendering
- **Preserved features:** Arabic explanations, Chess.com integration, opening database, PGN/FEN loading

**Directory structure:**
```
app/
├── page.tsx                    # Shell: layout + state provider (~150 lines)
├── components/
│   ├── Board.tsx               # Chess board (SVG-based, no jQuery)
│   ├── GamePanel.tsx           # Right panel container
│   ├── StatusBox.tsx           # Status text + thinking indicator
│   ├── Explanation.tsx         # Arabic move analysis
│   ├── MoveHistory.tsx         # Scrollable move list
│   ├── ActionButton.tsx        # Context-aware action button
│   ├── SetupModal.tsx          # Modal container + tabs
│   ├── NewGameTab.tsx          # Side picker + start
│   ├── LoadGameTab.tsx         # PGN/FEN/Chess.com sub-tabs
│   ├── OpeningsTab.tsx         # Opening browser + replay/force
│   └── Toast.tsx               # Notification overlay
├── hooks/
│   ├── useChessGame.ts         # Game state machine + move logic
│   ├── useEngine.ts            # API calls + loading/error state
│   └── useBoardInteraction.ts  # Square click handling + highlights
└── lib/
    ├── types.ts                # Shared interfaces (Game, Move, Opening, etc.)
    ├── engine.ts               # Keep as-is (optimized minimax)
    ├── constants.ts            # Keep as-is
    ├── explanations.ts         # Keep as-is
    ├── openings.ts             # Keep as-is
    ├── pgn-parser.ts           # Keep as-is
    ├── chesscom-api.ts         # Keep as-is
    └── lichess.ts              # Keep as-is
```

---

## [S2] Component Breakdown

**Board.tsx** (~200 lines)
- SVG-based chess board (replace chessboard.js)
- Renders 64 squares with pieces as Unicode characters
- Highlights: selected square, legal moves, last move
- Click handler passes square to parent
- Responsive sizing via CSS grid
- No external dependencies (pure React)

**GamePanel.tsx** (~80 lines)
- Container for right panel
- Conditionally renders SetupModal or game UI based on `gameStarted`
- Passes state down to child components

**StatusBox.tsx** (~40 lines)
- Displays status text (thinking, user turn, game over)
- Shows explanation when available
- Renders action button (Step Back, Let AI Calculate)
- Uses React elements instead of `dangerouslySetInnerHTML`

**MoveHistory.tsx** (~50 lines)
- Scrollable move list
- Move numbers with white/black moves
- Auto-scrolls to bottom on new moves
- Clean React rendering (no HTML strings)

**SetupModal.tsx** (~120 lines)
- Modal overlay with 3 tabs: New Game, Load Game, Openings
- Tab navigation
- Closes on backdrop click

**NewGameTab.tsx** (~60 lines)
- Side picker (White/Black)
- Start Battle button

**LoadGameTab.tsx** (~150 lines)
- Sub-tabs: PGN, FEN, Chess.com
- PGN textarea with parse/load flow
- FEN input with validation
- Chess.com username → archives → games flow

**OpeningsTab.tsx** (~100 lines)
- Search input
- Filter buttons (e4, d4, c4, Nf3)
- Opening list with replay/force mode buttons

**Toast.tsx** (~20 lines)
- Fixed-position notification
- Warning/error styling
- Auto-dismiss after 3 seconds

---

## [S3] State Management

**Strategy:** React hooks with `useState`/`useReducer` — no external state library (YAGNI).

**useChessGame.ts** (~150 lines)
```typescript
interface GameState {
  chess: Chess | null;
  playerSide: 'white' | 'black';
  myColor: 'w' | 'b';
  oppColor: 'w' | 'b';
  gameStarted: boolean;
  sourceSquare: string | null;
  openingMode: 'replay' | 'force' | null;
  selectedOpening: Opening | null;
  forceMoveIndex: number;
}
```
- Encapsulates all chess.js interactions
- Provides: `startGame`, `makeMove`, `undoMove`, `loadFromPGN`, `loadFromFEN`
- Handles game-over detection
- Manages opening replay/force logic

**useEngine.ts** (~60 lines)
```typescript
interface EngineState {
  loading: boolean;
  error: string | null;
  lastResult: EngineResult | null;
}
```
- `calculateBestMove(fen, depth)` → calls `/api/engine`
- Returns loading state and result
- Handles timeout and error cases

**useBoardInteraction.ts** (~80 lines)
```typescript
interface BoardState {
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  highlightedSquares: string[];
}
```
- Manages square selection and legal move highlighting
- Handles click-to-move logic
- Coordinates with useChessGame for move execution

**Data flow:**
```
page.tsx (shell)
  └── useChessGame() ←→ useEngine()
        ↓
  └── GamePanel
        ├── StatusBox ← game state
        ├── Explanation ← last move analysis
        ├── MoveHistory ← chess.history()
        └── Board ← board state + click handler
```

---

## [S4] Board Migration Strategy

**Current:** chessboard.js + jQuery (external CDN, global state, DOM manipulation)

**Target:** Pure React SVG board (no dependencies, declarative, testable)

**Implementation:**

**Board.tsx** renders an 8×8 CSS grid:
- Each square is a `<div>` with background color (light/dark)
- Pieces rendered as Unicode chess symbols
- Highlights via CSS classes (selected, legal-move, last-move)
- Click handler on each square div

**Piece rendering:**
```typescript
const PIECES: Record<string, string> = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
};
```

**Benefits:**
- No CDN dependency (pieces are Unicode characters)
- No jQuery (React handles events)
- Responsive via CSS (no resize handler needed)
- Testable (render board, assert squares)
- Board orientation flips via CSS `transform: rotate(180deg)` on pieces

**Migration path:**
1. Create Board.tsx with Unicode pieces
2. Wire up click handler
3. Add highlight support
4. Replace chessboard.js in page.tsx
5. Remove jQuery/chessboard.js from layout.tsx

**Risk:** Board visual fidelity may differ slightly from chessboard.js. Unicode pieces are simpler but less detailed than image-based pieces.

---

## [S5] Type System

**Goal:** Eliminate all `any` types with proper TypeScript interfaces.

**lib/types.ts:**
```typescript
// Chess piece types
type PieceColor = 'w' | 'b';
type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

interface Piece {
  type: PieceType;
  color: PieceColor;
}

interface Move {
  from: string;
  to: string;
  san: string;
  color: PieceColor;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
}

// Game state
interface GameState {
  chess: Chess | null;
  playerSide: 'white' | 'black';
  myColor: PieceColor;
  oppColor: PieceColor;
  gameStarted: boolean;
  sourceSquare: string | null;
  openingMode: 'replay' | 'force' | null;
  selectedOpening: Opening | null;
  forceMoveIndex: number;
}

// Engine
interface EngineResult {
  bestMove: string;
  san: string;
  explanation: string;
  evaluation: number;
  depth: number;
  nodes: number;
  timeMs: number;
  engine: 'custom-minimax' | 'stockfish-cloud';
}

// Openings
interface Opening {
  name: string;
  moves: string[];
  eco: string;
  category: string;
}

// Chess.com API
interface Archive {
  url: string;
  year: number;
  month: number;
}

interface ChessComGame {
  pgn: string;
  opponent: string;
  date: string;
  result: string;
}

// PGN Parser
interface ParsedGame {
  headers: Record<string, string>;
  moves: string[];
  fen: string;
  moveCount: number;
}
```

**Anti-pattern elimination:**
- `Window` extensions → use type assertions at call sites
- `useRef<any>` → `useRef<Chess | null>(null)`
- Engine `any` parameters → proper `Chess` type from chess.js
- `dangerouslySetInnerHTML` → React element rendering

---

## [S6] Testing Strategy (Bun)

**Framework:** Bun test (built-in, fast, TypeScript-native)

**Test tiers:**

**1. Unit tests (lib/):**
- `lib/engine.test.ts` — minimax, evaluateBoard, getBestMove
- `lib/openings.test.ts` — searchOpenings, filterByFirstMove
- `lib/pgn-parser.test.ts` — parsePGN, getGamePreview
- `lib/explanations.test.ts` — generateExplanation

**2. Component tests (components/):**
- `Board.test.tsx` — renders squares, handles clicks, shows highlights
- `StatusBox.test.tsx` — displays status, shows explanation
- `MoveHistory.test.tsx` — renders moves, auto-scrolls

**3. Hook tests (hooks/):**
- `useChessGame.test.ts` — startGame, makeMove, undoMove
- `useEngine.test.ts` — API calls, loading state

**4. Integration tests:**
- `app/page.test.tsx` — full game flow (start → move → engine → history)

**Test commands:**
```bash
bun test            # Run all tests
bun test --watch    # Watch mode
bun test --coverage # Coverage report
```

**Coverage targets:**
- lib/ functions: 90%+ (critical game logic)
- Components: 70%+ (render + interaction)
- Hooks: 80%+ (state transitions)

**What we WON'T test:**
- API route (requires serverless environment)
- Chess.com API calls (external dependency)
- Visual rendering details (CSS)

---

## Implementation Order

1. **Phase 1:** Add TypeScript types (`lib/types.ts`)
2. **Phase 2:** Create hooks (`useChessGame`, `useEngine`, `useBoardInteraction`)
3. **Phase 3:** Create Board component (replace chessboard.js)
4. **Phase 4:** Create UI components (StatusBox, MoveHistory, etc.)
5. **Phase 5:** Create modal components (SetupModal, tabs)
6. **Phase 6:** Refactor page.tsx to use new components
7. **Phase 7:** Remove jQuery/chessboard.js from layout.tsx
8. **Phase 8:** Add tests (Bun)
9. **Phase 9:** Clean up and verify
