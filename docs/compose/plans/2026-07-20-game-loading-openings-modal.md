# Game Loading, Openings, Modal UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simple setup dropdown with a modal overlay supporting PGN/FEN/Chess.com game loading and opening picker with replay/force modes.

**Architecture:** All changes are client-side. Three new utility modules (`lib/openings.ts`, `lib/pgn-parser.ts`, `lib/chesscom-api.ts`) provide data and parsing. The main `page.tsx` gets modal state management and new handlers. CSS gets modal/tab/toast styles.

**Tech Stack:** Next.js 16, React 19, chess.js 0.10.3 (client-side via CDN), jQuery/chessboard.js (CDN), TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/openings.ts` | Create | Static opening database + search/filter |
| `lib/pgn-parser.ts` | Create | PGN validation + parsing wrapper |
| `lib/chesscom-api.ts` | Create | Chess.com public API fetch functions |
| `app/page.tsx` | Modify | Modal state, tab UI, loading/opening handlers |
| `app/globals.css` | Modify | Modal, tab, toast, opening-list styles |

---

### Task 1: Create Opening Database

**Covers:** [S7]

**Files:**
- Create: `lib/openings.ts`

- [ ] **Step 1: Create `lib/openings.ts` with opening data and search functions**

```typescript
export interface Opening {
  name: string;
  moves: string[];
  eco: string;
  category: string;
}

export const OPENINGS: Opening[] = [
  // 1. e4 Openings
  { name: "Italian Game", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"], eco: "C50", category: "e4" },
  { name: "Ruy López", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"], eco: "C60", category: "e4" },
  { name: "Scotch Game", moves: ["e4", "e5", "Nf3", "Nc6", "d4"], eco: "C44", category: "e4" },
  { name: "King's Gambit", moves: ["e4", "e5", "f4"], eco: "C30", category: "e4" },
  { name: "Vienna Game", moves: ["e4", "e5", "Nc3"], eco: "C25", category: "e4" },
  { name: "Four Knights Game", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"], eco: "C47", category: "e4" },
  { name: "Petrov's Defense", moves: ["e4", "e5", "Nf3", "Nf6"], eco: "C42", category: "e4" },
  { name: "Philidor Defense", moves: ["e4", "e5", "Nf3", "d6"], eco: "C41", category: "e4" },
  { name: "Center Game", moves: ["e4", "e5", "d4", "exd4", "Qxd4"], eco: "C22", category: "e4" },
  { name: "Bishop's Opening", moves: ["e4", "e5", "Bc4"], eco: "C23", category: "e4" },
  // Sicilian
  { name: "Sicilian Defense", moves: ["e4", "c5"], eco: "B20", category: "e4" },
  { name: "Sicilian Najdorf", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], eco: "B90", category: "e4" },
  { name: "Sicilian Dragon", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"], eco: "B70", category: "e4" },
  { name: "Sicilian Sveshnikov", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5"], eco: "B33", category: "e4" },
  // French
  { name: "French Defense", moves: ["e4", "e6"], eco: "C00", category: "e4" },
  { name: "French Winawer", moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"], eco: "C15", category: "e4" },
  { name: "French Classical", moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7"], eco: "C11", category: "e4" },
  // Caro-Kann
  { name: "Caro-Kann Defense", moves: ["e4", "c6"], eco: "B10", category: "e4" },
  { name: "Caro-Kann Advance", moves: ["e4", "c6", "d4", "d5", "e5"], eco: "B12", category: "e4" },
  // 1. d4 Openings
  { name: "Queen's Gambit", moves: ["d4", "d5", "c4"], eco: "D06", category: "d4" },
  { name: "Queen's Gambit Declined", moves: ["d4", "d5", "c4", "e6"], eco: "D30", category: "d4" },
  { name: "Queen's Gambit Accepted", moves: ["d4", "d5", "c4", "dxc4"], eco: "D20", category: "d4" },
  { name: "Slav Defense", moves: ["d4", "d5", "c4", "c6"], eco: "D10", category: "d4" },
  { name: "King's Indian Defense", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"], eco: "E60", category: "d4" },
  { name: "Nimzo-Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"], eco: "E20", category: "d4" },
  { name: "Queen's Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"], eco: "E15", category: "d4" },
  { name: "Grünfeld Defense", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"], eco: "D80", category: "d4" },
  { name: "Benoni Defense", moves: ["d4", "Nf6", "c4", "c5"], eco: "A56", category: "d4" },
  { name: "Dutch Defense", moves: ["d4", "f5"], eco: "A80", category: "d4" },
  { name: "London System", moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"], eco: "D00", category: "d4" },
  { name: "Colle System", moves: ["d4", "d5", "Nf3", "Nf6", "e3"], eco: "D05", category: "d4" },
  // 1. c4 Openings
  { name: "English Opening", moves: ["c4", "e5"], eco: "B20", category: "c4" },
  { name: "English Symmetrical", moves: ["c4", "c5"], eco: "A30", category: "c4" },
  // 1. Nf3 Openings
  { name: "Réti Opening", moves: ["Nf3", "d5", "c4"], eco: "A09", category: "Nf3" },
  { name: "King's Indian Attack", moves: ["Nf3", "d6", "g3", "Bg7", "Bg2"], eco: "A05", category: "Nf3" },
];

export function searchOpenings(query: string): Opening[] {
  const q = query.toLowerCase();
  return OPENINGS.filter(o => o.name.toLowerCase().includes(q));
}

export function filterByFirstMove(move: string): Opening[] {
  return OPENINGS.filter(o => o.moves[0].toLowerCase() === move.toLowerCase());
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd chess-app && npx tsc --noEmit lib/openings.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/openings.ts
git commit -m "feat: add opening database with search and filter"
```

---

### Task 2: Create PGN Parser

**Covers:** [S4]

**Files:**
- Create: `lib/pgn-parser.ts`

- [ ] **Step 1: Create `lib/pgn-parser.ts`**

```typescript
declare global {
  interface Window {
    Chess: any;
  }
}

export interface ParsedGame {
  headers: Record<string, string>;
  moves: string[];
  fen: string;
  moveCount: number;
}

export function parsePGN(pgn: string): { games: ParsedGame[]; error?: string } {
  if (!pgn || !pgn.trim()) {
    return { games: [], error: "PGN is empty" };
  }

  const Chess = window.Chess;
  if (!Chess) {
    return { games: [], error: "Chess library not loaded" };
  }

  const games: ParsedGame[] = [];
  const chunks = pgn.split(/\n\n\n+/).filter(c => c.trim());

  for (const chunk of chunks) {
    const chess = new Chess();
    if (chess.load_pgn(chunk.trim())) {
      const headers = chess.header();
      const moves = chess.history();
      const fen = chess.fen();
      games.push({
        headers,
        moves,
        fen,
        moveCount: moves.length,
      });
    }
  }

  if (games.length === 0) {
    return { games: [], error: "Could not parse PGN" };
  }

  return { games };
}

export function getGamePreview(game: ParsedGame): string {
  const white = game.headers["White"] || "Unknown";
  const black = game.headers["Black"] || "Unknown";
  const result = game.headers["Result"] || "*";
  return `${white} vs ${black} — ${game.moveCount} moves — ${result}`;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd chess-app && npx tsc --noEmit lib/pgn-parser.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/pgn-parser.ts
git commit -m "feat: add PGN parser with validation and preview"
```

---

### Task 3: Create Chess.com API Client

**Covers:** [S6]

**Files:**
- Create: `lib/chesscom-api.ts`

- [ ] **Step 1: Create `lib/chesscom-api.ts`**

```typescript
export interface Archive {
  url: string;
  year: number;
  month: number;
}

export interface ChessComGame {
  pgn: string;
  opponent: string;
  result: string;
  date: string;
  timeControl: string;
}

const BASE = "https://api.chess.com/pub";

export async function fetchArchives(username: string): Promise<{ archives: Archive[]; error?: string }> {
  try {
    const res = await fetch(`${BASE}/player/${encodeURIComponent(username)}/games/archives`);
    if (res.status === 404) {
      return { archives: [], error: "Player not found" };
    }
    if (!res.ok) {
      return { archives: [], error: "Could not connect to Chess.com" };
    }
    const data = await res.json();
    const archives: Archive[] = (data.archives || []).reverse().map((url: string) => {
      const match = url.match(/\/(\d{4})\/(\d{2})$/);
      return {
        url,
        year: match ? parseInt(match[1]) : 0,
        month: match ? parseInt(match[2]) : 0,
      };
    });
    return { archives };
  } catch {
    return { archives: [], error: "Could not connect to Chess.com" };
  }
}

export async function fetchGames(archiveUrl: string): Promise<{ games: ChessComGame[]; error?: string }> {
  try {
    const res = await fetch(archiveUrl);
    if (!res.ok) {
      return { games: [], error: "Could not load games" };
    }
    const data = await res.json();
    const games: ChessComGame[] = (data.games || []).map((g: any) => {
      const headers = parseHeaders(g.pgn);
      const opponent = headers["White"] === username(archiveUrl)
        ? headers["Black"] || "Unknown"
        : headers["White"] || "Unknown";
      return {
        pgn: g.pgn || "",
        opponent,
        result: headers["Result"] || "*",
        date: headers["Date"] || "Unknown",
        timeControl: headers["TimeControl"] || "Unknown",
      };
    });
    return { games };
  } catch {
    return { games: [], error: "Could not load games" };
  }
}

function parseHeaders(pgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const regex = /\[(\w+)\s+"([^"]*)"\]/g;
  let match;
  while ((match = regex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

function username(archiveUrl: string): string {
  const match = archiveUrl.match(/\/player\/([^/]+)\//);
  return match ? match[1] : "";
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd chess-app && npx tsc --noEmit lib/chesscom-api.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/chesscom-api.ts
git commit -m "feat: add Chess.com API client for fetching games"
```

---

### Task 4: Add Modal CSS Styles

**Covers:** [S3]

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add modal, tab, toast, and opening-list styles to `globals.css`**

Append the following to the end of `app/globals.css`:

```css
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* Tabs */
.modal-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #27272a;
  margin-bottom: 20px;
}

.modal-tab {
  padding: 10px 16px;
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  font-size: 0.9em;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.modal-tab:hover {
  color: #a1a1aa;
}

.modal-tab.active {
  color: #f4f4f5;
  border-bottom-color: #e11d48;
}

/* Sub-tabs */
.sub-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.sub-tab {
  flex: 1;
  padding: 8px;
  background: #27272a;
  border: none;
  border-radius: 6px;
  color: #71717a;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.2s, color 0.2s;
}

.sub-tab:hover {
  background: #3f3f46;
}

.sub-tab.active {
  background: #e11d48;
  color: #fff;
}

/* Side Picker */
.side-picker {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.side-option {
  flex: 1;
  padding: 16px;
  background: #27272a;
  border: 2px solid transparent;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.side-option:hover {
  border-color: #3f3f46;
}

.side-option.selected {
  border-color: #e11d48;
}

.side-option .piece {
  font-size: 28px;
}

.side-option .label {
  font-weight: bold;
  margin-top: 4px;
}

.side-option .desc {
  color: #71717a;
  font-size: 0.8em;
}

/* Input Fields */
.modal-input,
.modal-textarea {
  width: 100%;
  padding: 10px 12px;
  background: #09090b;
  color: #f4f4f5;
  border: 1px solid #27272a;
  border-radius: 6px;
  font-size: 0.9em;
  margin-bottom: 12px;
  transition: border-color 0.2s;
}

.modal-input:focus,
.modal-textarea:focus {
  outline: none;
  border-color: #e11d48;
}

.modal-textarea {
  min-height: 120px;
  resize: vertical;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}

.modal-input.error,
.modal-textarea.error {
  border-color: #ef4444;
}

/* Buttons */
.btn-modal-primary {
  width: 100%;
  padding: 12px;
  background: #e11d48;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1em;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-modal-primary:hover {
  background: #be123c;
}

.btn-modal-primary:disabled {
  background: #3f3f46;
  color: #71717a;
  cursor: not-allowed;
}

.btn-modal-secondary {
  width: 100%;
  padding: 10px;
  background: #27272a;
  color: #a1a1aa;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-modal-secondary:hover {
  background: #3f3f46;
}

.btn-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn-row > * {
  flex: 1;
}

/* Opening List */
.opening-search {
  width: 100%;
  padding: 10px 12px;
  background: #09090b;
  color: #f4f4f5;
  border: 1px solid #27272a;
  border-radius: 6px;
  margin-bottom: 12px;
}

.opening-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.opening-filter-btn {
  padding: 6px 12px;
  background: #27272a;
  border: none;
  border-radius: 4px;
  color: #a1a1aa;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.2s, color 0.2s;
}

.opening-filter-btn:hover {
  background: #3f3f46;
}

.opening-filter-btn.active {
  background: #e11d48;
  color: #fff;
}

.opening-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #27272a;
  border-radius: 6px;
  margin-bottom: 16px;
}

.opening-item {
  padding: 10px 12px;
  border-bottom: 1px solid #27272a;
  cursor: pointer;
  transition: background 0.15s;
}

.opening-item:last-child {
  border-bottom: none;
}

.opening-item:hover {
  background: #27272a;
}

.opening-item.selected {
  background: #1c1917;
  border-left: 3px solid #e11d48;
}

.opening-item .name {
  font-weight: bold;
  color: #f4f4f5;
}

.opening-item .moves {
  color: #71717a;
  font-size: 0.85em;
  font-family: monospace;
  margin-top: 2px;
}

/* Mode Buttons */
.mode-buttons {
  display: flex;
  gap: 10px;
}

.mode-btn {
  flex: 1;
  padding: 10px;
  background: #27272a;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background 0.2s;
}

.mode-btn:hover {
  background: #3f3f46;
}

.mode-btn.replay {
  color: #34d399;
}

.mode-btn.force {
  color: #f59e0b;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 12px 20px;
  color: #f4f4f5;
  font-size: 0.9em;
  z-index: 2000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  animation: toast-in 0.3s ease;
}

.toast.warning {
  border-color: #f59e0b;
  color: #f59e0b;
}

.toast.error {
  border-color: #ef4444;
  color: #ef4444;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* Game Preview */
.game-preview {
  background: #09090b;
  border: 1px solid #27272a;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  font-size: 0.9em;
  color: #a1a1aa;
}

.game-preview .title {
  color: #f4f4f5;
  font-weight: bold;
}

/* Chess.com Game List */
.chesscom-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #27272a;
  border-radius: 6px;
  margin-bottom: 12px;
}

.chesscom-item {
  padding: 10px 12px;
  border-bottom: 1px solid #27272a;
  cursor: pointer;
  transition: background 0.15s;
}

.chesscom-item:last-child {
  border-bottom: none;
}

.chesscom-item:hover {
  background: #27272a;
}

.chesscom-item .opponent {
  font-weight: bold;
  color: #f4f4f5;
}

.chesscom-item .meta {
  color: #71717a;
  font-size: 0.85em;
}

/* Loading Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #3f3f46;
  border-top-color: #e11d48;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* New Game Button in Status */
.btn-new-game {
  padding: 6px 12px;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 6px;
  color: #a1a1aa;
  cursor: pointer;
  font-size: 0.8em;
  transition: background 0.2s;
}

.btn-new-game:hover {
  background: #3f3f46;
  color: #f4f4f5;
}
```

- [ ] **Step 2: Verify CSS is valid (no syntax errors)**

Run: `cd chess-app && npx next build 2>&1 | head -20`
Expected: Build starts without CSS errors

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add modal, tab, toast, and opening-list CSS styles"
```

---

### Task 5: Add Modal State and UI to page.tsx

**Covers:** [S3]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add new state variables and imports**

Add these imports at the top of `app/page.tsx`:

```typescript
import { parsePGN, getGamePreview, ParsedGame } from '@/lib/pgn-parser';
import { fetchArchives, fetchGames, Archive, ChessComGame } from '@/lib/chesscom-api';
import { searchOpenings, filterByFirstMove, Opening, OPENINGS } from '@/lib/openings';
```

Add these state variables after the existing ones:

```typescript
const [modalOpen, setModalOpen] = useState(true);
const [activeTab, setActiveTab] = useState<'new' | 'load' | 'openings'>('new');
const [loadSubTab, setLoadSubTab] = useState<'pgn' | 'fen' | 'chesscom'>('pgn');
const [pgnInput, setPgnInput] = useState('');
const [fenInput, setFenInput] = useState('');
const [pgnError, setPgnError] = useState('');
const [fenError, setFenError] = useState('');
const [parsedGames, setParsedGames] = useState<ParsedGame[]>([]);
const [selectedGameIndex, setSelectedGameIndex] = useState(0);
const [chesscomUsername, setChesscomUsername] = useState('');
const [chesscomArchives, setChesscomArchives] = useState<Archive[]>([]);
const [chesscomGames, setChesscomGames] = useState<ChessComGame[]>([]);
const [chesscomLoading, setChesscomLoading] = useState(false);
const [chesscomError, setChesscomError] = useState('');
const [chesscomStep, setChesscomStep] = useState<'username' | 'archives' | 'games'>('username');
const [openingSearch, setOpeningSearch] = useState('');
const [openingFilter, setOpeningFilter] = useState('');
const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
const [openingMode, setOpeningMode] = useState<'replay' | 'force' | null>(null);
const [forceMoveIndex, setForceMoveIndex] = useState(0);
const [toastMessage, setToastMessage] = useState('');
const [toastType, setToastType] = useState<'warning' | 'error' | ''>('');
```

- [ ] **Step 2: Add toast helper function**

```typescript
const showToast = useCallback((message: string, type: 'warning' | 'error' | '' = '') => {
  setToastMessage(message);
  setToastType(type);
  setTimeout(() => setToastMessage(''), 3000);
}, []);
```

- [ ] **Step 3: Add "New Game" button to the status panel**

In the `game-section` div, add a button before the status-box:

```tsx
<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
  <button className="btn-new-game" onClick={() => setModalOpen(true)}>
    ♟ New Game
  </button>
</div>
```

- [ ] **Step 4: Add modal JSX before the closing `</div>` of main-wrapper**

Replace the modal section with this complete modal:

```tsx
{modalOpen && (
  <div className="modal-overlay" onClick={(e) => {
    if (e.target === e.currentTarget) setModalOpen(false);
  }}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-tabs">
        <button
          className={`modal-tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          ♟ New Game
        </button>
        <button
          className={`modal-tab ${activeTab === 'load' ? 'active' : ''}`}
          onClick={() => setActiveTab('load')}
        >
          📂 Load Game
        </button>
        <button
          className={`modal-tab ${activeTab === 'openings' ? 'active' : ''}`}
          onClick={() => setActiveTab('openings')}
        >
          📖 Openings
        </button>
      </div>

      {activeTab === 'new' && (
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '12px' }}>
            Choose your side:
          </p>
          <div className="side-picker">
            <div
              className={`side-option ${playerSide === 'white' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('white')}
            >
              <div className="piece">♙</div>
              <div className="label">White</div>
              <div className="desc">Attack First</div>
            </div>
            <div
              className={`side-option ${playerSide === 'black' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('black')}
            >
              <div className="piece">♟</div>
              <div className="label">Black</div>
              <div className="desc">Counter Attack</div>
            </div>
          </div>
          <button className="btn-modal-primary" onClick={() => {
            setModalOpen(false);
            startGame();
          }}>
            Start Battle
          </button>
        </div>
      )}

      {activeTab === 'load' && (
        <div>
          <div className="sub-tabs">
            <button
              className={`sub-tab ${loadSubTab === 'pgn' ? 'active' : ''}`}
              onClick={() => setLoadSubTab('pgn')}
            >
              PGN
            </button>
            <button
              className={`sub-tab ${loadSubTab === 'fen' ? 'active' : ''}`}
              onClick={() => setLoadSubTab('fen')}
            >
              FEN
            </button>
            <button
              className={`sub-tab ${loadSubTab === 'chesscom' ? 'active' : ''}`}
              onClick={() => setLoadSubTab('chesscom')}
            >
              Chess.com
            </button>
          </div>

          {loadSubTab === 'pgn' && (
            <div>
              <textarea
                className={`modal-textarea ${pgnError ? 'error' : ''}`}
                placeholder="Paste PGN here..."
                value={pgnInput}
                onChange={(e) => {
                  setPgnInput(e.target.value);
                  setPgnError('');
                  setParsedGames([]);
                }}
              />
              {pgnError && (
                <p style={{ color: '#ef4444', fontSize: '0.85em', marginBottom: '12px' }}>
                  {pgnError}
                </p>
              )}
              {parsedGames.length > 1 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#a1a1aa', fontSize: '0.85em', marginBottom: '8px' }}>
                    Multiple games found — select one:
                  </p>
                  {parsedGames.map((game, i) => (
                    <div
                      key={i}
                      className={`opening-item ${selectedGameIndex === i ? 'selected' : ''}`}
                      onClick={() => setSelectedGameIndex(i)}
                    >
                      <div className="name">{getGamePreview(game)}</div>
                    </div>
                  ))}
                </div>
              )}
              {parsedGames.length === 1 && (
                <div className="game-preview">
                  <div className="title">{getGamePreview(parsedGames[0])}</div>
                </div>
              )}
              <div className="btn-row">
                <button className="btn-modal-secondary" onClick={() => {
                  setPgnInput('');
                  setPgnError('');
                  setParsedGames([]);
                }}>
                  Clear
                </button>
                <button
                  className="btn-modal-primary"
                  disabled={!pgnInput.trim()}
                  onClick={() => {
                    const result = parsePGN(pgnInput);
                    if (result.error) {
                      setPgnError(result.error);
                      return;
                    }
                    setParsedGames(result.games);
                    setSelectedGameIndex(0);
                    if (result.games.length === 1) {
                      loadGameFromPGN(result.games[0]);
                    }
                  }}
                >
                  {parsedGames.length > 1 ? 'Load Selected' : 'Parse PGN'}
                </button>
              </div>
            </div>
          )}

          {loadSubTab === 'fen' && (
            <div>
              <input
                className={`modal-input ${fenError ? 'error' : ''}`}
                placeholder="Paste FEN string here..."
                value={fenInput}
                onChange={(e) => {
                  setFenInput(e.target.value);
                  setFenError('');
                }}
              />
              {fenError && (
                <p style={{ color: '#ef4444', fontSize: '0.85em', marginBottom: '12px' }}>
                  {fenError}
                </p>
              )}
              <div className="btn-row">
                <button className="btn-modal-secondary" onClick={() => {
                  setFenInput('');
                  setFenError('');
                }}>
                  Clear
                </button>
                <button
                  className="btn-modal-primary"
                  disabled={!fenInput.trim()}
                  onClick={() => loadGameFromFEN(fenInput)}
                >
                  Load Position
                </button>
              </div>
            </div>
          )}

          {loadSubTab === 'chesscom' && (
            <div>
              {chesscomStep === 'username' && (
                <div>
                  <input
                    className="modal-input"
                    placeholder="Chess.com username..."
                    value={chesscomUsername}
                    onChange={(e) => setChesscomUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && chesscomUsername.trim()) {
                        loadChessComArchives();
                      }
                    }}
                  />
                  {chesscomError && (
                    <p style={{ color: '#ef4444', fontSize: '0.85em', marginBottom: '12px' }}>
                      {chesscomError}
                    </p>
                  )}
                  <button
                    className="btn-modal-primary"
                    disabled={!chesscomUsername.trim() || chesscomLoading}
                    onClick={loadChessComArchives}
                  >
                    {chesscomLoading && <span className="spinner" />}
                    Find Games
                  </button>
                </div>
              )}

              {chesscomStep === 'archives' && (
                <div>
                  <p style={{ color: '#a1a1aa', fontSize: '0.85em', marginBottom: '8px' }}>
                    Select a month:
                  </p>
                  <div className="chesscom-list">
                    {chesscomArchives.map((archive, i) => (
                      <div
                        key={i}
                        className="chesscom-item"
                        onClick={() => loadChessComGames(archive)}
                      >
                        <div className="opponent">
                          {archive.year}-{String(archive.month).padStart(2, '0')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="btn-modal-secondary" onClick={() => {
                    setChesscomStep('username');
                    setChesscomArchives([]);
                  }}>
                    Back
                  </button>
                </div>
              )}

              {chesscomStep === 'games' && (
                <div>
                  <p style={{ color: '#a1a1aa', fontSize: '0.85em', marginBottom: '8px' }}>
                    Select a game:
                  </p>
                  <div className="chesscom-list">
                    {chesscomGames.map((game, i) => (
                      <div
                        key={i}
                        className="chesscom-item"
                        onClick={() => loadGameFromChessCom(game)}
                      >
                        <div className="opponent">vs {game.opponent}</div>
                        <div className="meta">{game.date} — {game.result}</div>
                      </div>
                    ))}
                  </div>
                  {chesscomGames.length === 0 && (
                    <p style={{ color: '#71717a', textAlign: 'center', padding: '20px' }}>
                      No games found for this month
                    </p>
                  )}
                  <button className="btn-modal-secondary" onClick={() => {
                    setChesscomStep('archives');
                    setChesscomGames([]);
                  }}>
                    Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'openings' && (
        <div>
          <input
            className="opening-search"
            placeholder="Search openings..."
            value={openingSearch}
            onChange={(e) => {
              setOpeningSearch(e.target.value);
              setOpeningFilter('');
            }}
          />
          <div className="opening-filters">
            {['e4', 'd4', 'c4', 'Nf3'].map(move => (
              <button
                key={move}
                className={`opening-filter-btn ${openingFilter === move ? 'active' : ''}`}
                onClick={() => {
                  setOpeningFilter(openingFilter === move ? '' : move);
                  setOpeningSearch('');
                }}
              >
                1. {move}
              </button>
            ))}
          </div>
          <div className="opening-list">
            {getFilteredOpenings().map((opening, i) => (
              <div
                key={i}
                className={`opening-item ${selectedOpening?.name === opening.name ? 'selected' : ''}`}
                onClick={() => setSelectedOpening(opening)}
              >
                <div className="name">{opening.name}</div>
                <div className="moves">{opening.moves.join(' ')}</div>
              </div>
            ))}
            {getFilteredOpenings().length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#71717a' }}>
                No openings found
              </div>
            )}
          </div>
          {selectedOpening && (
            <div className="mode-buttons">
              <button
                className="mode-btn replay"
                onClick={() => startOpeningReplay(selectedOpening)}
              >
                🔄 Replay (Demo)
              </button>
              <button
                className="mode-btn force"
                onClick={() => startOpeningForce(selectedOpening)}
              >
                🔒 Force (Practice)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}

{toastMessage && (
  <div className={`toast ${toastType}`}>
    {toastMessage}
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add modal overlay UI with tabs for new game, load, and openings"
```

---

### Task 6: Add Game Loading Handlers

**Covers:** [S4, S5, S6]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add PGN/FEN/Chess.com loading handler functions**

Add these functions inside the `Home` component, after the existing `startGame` function:

```typescript
const loadGameFromPGN = useCallback((game: ParsedGame) => {
  if (typeof window === 'undefined') return;
  const Chess = window.Chess;
  const $ = window.jQuery;
  if (!$ || !window.Chessboard || !Chess) return;

  chessRef.current = new Chess();
  chessRef.current.load_pgn(game.moves.join(' '));

  const turn = chessRef.current.turn();
  myColorRef.current = turn;
  oppColorRef.current = turn === 'w' ? 'b' : 'w';
  setPlayerSide(turn === 'w' ? 'white' : 'black');

  setGameStarted(true);
  setModalOpen(false);

  setTimeout(() => {
    if (!boardRef.current) return;
    const config = {
      draggable: false,
      position: chessRef.current.fen(),
      orientation: myColorRef.current === 'w' ? 'white' : 'black',
      moveSpeed: 0,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    boardInstance.current = window.Chessboard(boardRef.current, config);
    $(window).off('resize').on('resize', () => boardInstance.current?.resize());
    $(boardRef.current).off('click touchend', '.square-55d63');
    $(boardRef.current).on('click touchend', '.square-55d63', function(this: HTMLElement, e: any) {
      e.preventDefault();
      const square = $(this).attr('data-square');
      if (square) handleSquareClick(square);
    });
    renderHistory();
    updateStatusUI();
  }, 100);
}, [handleSquareClick, updateStatusUI, renderHistory]);

const loadGameFromFEN = useCallback((fen: string) => {
  if (typeof window === 'undefined') return;
  const Chess = window.Chess;
  const $ = window.jQuery;
  if (!$ || !window.Chessboard || !Chess) return;

  const test = new Chess();
  if (!test.load(fen)) {
    setFenError('Invalid FEN string');
    return;
  }

  chessRef.current = new Chess();
  chessRef.current.load(fen);

  const turn = chessRef.current.turn();
  myColorRef.current = turn;
  oppColorRef.current = turn === 'w' ? 'b' : 'w';
  setPlayerSide(turn === 'w' ? 'white' : 'black');

  setGameStarted(true);
  setModalOpen(false);

  setTimeout(() => {
    if (!boardRef.current) return;
    const config = {
      draggable: false,
      position: chessRef.current.fen(),
      orientation: myColorRef.current === 'w' ? 'white' : 'black',
      moveSpeed: 0,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    boardInstance.current = window.Chessboard(boardRef.current, config);
    $(window).off('resize').on('resize', () => boardInstance.current?.resize());
    $(boardRef.current).off('click touchend', '.square-55d63');
    $(boardRef.current).on('click touchend', '.square-55d63', function(this: HTMLElement, e: any) {
      e.preventDefault();
      const square = $(this).attr('data-square');
      if (square) handleSquareClick(square);
    });
    renderHistory();
    updateStatusUI();
  }, 100);
}, [handleSquareClick, updateStatusUI, renderHistory]);

const loadChessComArchives = useCallback(async () => {
  setChesscomLoading(true);
  setChesscomError('');
  const result = await fetchArchives(chesscomUsername);
  setChesscomLoading(false);
  if (result.error) {
    setChesscomError(result.error);
    return;
  }
  setChesscomArchives(result.archives);
  setChesscomStep('archives');
}, [chesscomUsername]);

const loadChessComGames = useCallback(async (archive: Archive) => {
  setChesscomLoading(true);
  setChesscomError('');
  const result = await fetchGames(archive.url);
  setChesscomLoading(false);
  if (result.error) {
    setChesscomError(result.error);
    return;
  }
  setChesscomGames(result.games);
  setChesscomStep('games');
}, []);

const loadGameFromChessCom = useCallback((game: ChessComGame) => {
  const result = parsePGN(game.pgn);
  if (result.error || result.games.length === 0) {
    showToast('Could not parse game', 'error');
    return;
  }
  loadGameFromPGN(result.games[0]);
}, [loadGameFromPGN, showToast]);
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add PGN, FEN, and Chess.com game loading handlers"
```

---

### Task 7: Add Opening Picker Handlers

**Covers:** [S7]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add opening filter helper and replay/force handlers**

Add these functions inside the `Home` component:

```typescript
const getFilteredOpenings = useCallback((): Opening[] => {
  if (openingSearch) return searchOpenings(openingSearch);
  if (openingFilter) return filterByFirstMove(openingFilter);
  return OPENINGS;
}, [openingSearch, openingFilter]);

const startOpeningReplay = useCallback((opening: Opening) => {
  if (typeof window === 'undefined') return;
  const Chess = window.Chess;
  const $ = window.jQuery;
  if (!$ || !window.Chessboard || !Chess) return;

  chessRef.current = new Chess();
  setGameStarted(true);
  setModalOpen(false);
  setOpeningMode('replay');
  setSelectedOpening(opening);

  setTimeout(() => {
    if (!boardRef.current) return;
    const config = {
      draggable: false,
      position: 'start',
      orientation: playerSide,
      moveSpeed: 300,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    boardInstance.current = window.Chessboard(boardRef.current, config);
    $(window).off('resize').on('resize', () => boardInstance.current?.resize());
    $(boardRef.current).off('click touchend', '.square-55d63');
    $(boardRef.current).on('click touchend', '.square-55d63', function(this: HTMLElement, e: any) {
      e.preventDefault();
      const square = $(this).attr('data-square');
      if (square) handleSquareClick(square);
    });

    let moveIndex = 0;
    const replayNextMove = () => {
      if (moveIndex >= opening.moves.length) {
        setOpeningMode(null);
        myColorRef.current = playerSide === 'white' ? 'w' : 'b';
        oppColorRef.current = myColorRef.current === 'w' ? 'b' : 'w';
        renderHistory();
        updateStatusUI();
        return;
      }
      const move = chessRef.current.move(opening.moves[moveIndex]);
      if (move) {
        boardInstance.current.position(chessRef.current.fen(), false);
        highlightLastMove(move);
        moveIndex++;
        setTimeout(replayNextMove, 800);
      } else {
        showToast(`Invalid move in opening: ${opening.moves[moveIndex]}`, 'error');
        setOpeningMode(null);
      }
    };
    setTimeout(replayNextMove, 500);
  }, 100);
}, [playerSide, handleSquareClick, updateStatusUI, highlightLastMove, renderHistory, showToast]);

const startOpeningForce = useCallback((opening: Opening) => {
  if (typeof window === 'undefined') return;
  const Chess = window.Chess;
  const $ = window.jQuery;
  if (!$ || !window.Chessboard || !Chess) return;

  chessRef.current = new Chess();
  setGameStarted(true);
  setModalOpen(false);
  setOpeningMode('force');
  setSelectedOpening(opening);
  setForceMoveIndex(0);
  myColorRef.current = playerSide === 'white' ? 'w' : 'b';
  oppColorRef.current = myColorRef.current === 'w' ? 'b' : 'w';

  setTimeout(() => {
    if (!boardRef.current) return;
    const config = {
      draggable: false,
      position: 'start',
      orientation: playerSide,
      moveSpeed: 0,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    boardInstance.current = window.Chessboard(boardRef.current, config);
    $(window).off('resize').on('resize', () => boardInstance.current?.resize());
    $(boardRef.current).off('click touchend', '.square-55d63');
    $(boardRef.current).on('click touchend', '.square-55d63', function(this: HTMLElement, e: any) {
      e.preventDefault();
      const square = $(this).attr('data-square');
      if (square) handleSquareClick(square);
    });
    updateStatusUI();
    showToast(`Practice mode: Play ${opening.moves[0]}`, 'warning');
  }, 100);
}, [playerSide, handleSquareClick, updateStatusUI, showToast]);
```

- [ ] **Step 2: Modify `handleSquareClick` to check forced opening moves**

In the existing `handleSquareClick` function, after the move is made and validated (around line 230-240), add opening force check:

```typescript
// After: const move = chess.move({ from: sourceSquareRef.current, to: square, promotion: 'q' });
// Add this block after the move succeeds:

if (openingMode === 'force' && selectedOpening && myColorRef.current === chess.turn()) {
  // Wait, this check needs to happen BEFORE the move is made
}
```

Actually, the check needs to happen before the move. Modify the move-making section:

```typescript
// Replace the move-making block (around lines 230-240) with:

if (openingMode === 'force' && selectedOpening && forceMoveIndex < selectedOpening.moves.length) {
  const expectedMove = selectedOpening.moves[forceMoveIndex];
  const testMove = chess.move({
    from: sourceSquareRef.current,
    to: square,
    promotion: 'q'
  });

  if (testMove === null) {
    sourceSquareRef.current = null;
    removeHighlights();
    return;
  }

  // Check if the move matches the expected opening move
  const actualSAN = testMove.san;
  // Undo and redo to compare properly
  chess.undo();

  const expectedSAN = expectedMove;
  const moveAttempt = chess.move({
    from: sourceSquareRef.current,
    to: square,
    promotion: 'q'
  });

  if (moveAttempt && moveAttempt.san === expectedSAN) {
    // Correct move
    sourceSquareRef.current = null;
    removeHighlights();
    if (boardInstance.current) {
      boardInstance.current.position(chess.fen(), false);
    }
    highlightLastMove(moveAttempt);
    renderHistory();

    const newForceIndex = forceMoveIndex + 1;
    setForceMoveIndex(newForceIndex);

    if (newForceIndex >= selectedOpening.moves.length) {
      setOpeningMode(null);
      showToast('Opening completed! Free play now.', 'warning');
    }

    if (chess.game_over()) {
      handleGameOver();
    } else {
      updateStatusUI();
    }
  } else {
    // Wrong move
    sourceSquareRef.current = null;
    removeHighlights();
    showToast(`Wrong move! Expected: ${expectedSAN}`, 'warning');
  }
  return;
}

// Original move-making code continues here...
const move = chess.move({
  from: sourceSquareRef.current,
  to: square,
  promotion: 'q'
});
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add opening replay and force practice modes"
```

---

### Task 8: Reset Chess.com State on Tab Switch

**Covers:** [S6]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Reset Chess.com state when switching away from Load tab**

In the modal tab buttons, add state reset:

```tsx
<button
  className={`modal-tab ${activeTab === 'load' ? 'active' : ''}`}
  onClick={() => {
    setActiveTab('load');
    // Reset Chess.com state when entering load tab
    setChesscomStep('username');
    setChesscomArchives([]);
    setChesscomGames([]);
    setChesscomError('');
  }}
>
  📂 Load Game
</button>
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "fix: reset Chess.com state on tab switch"
```

---

### Task 9: Final Integration and Manual Testing

**Covers:** [S3, S4, S5, S6, S7, S8]

**Files:**
- Verify: `app/page.tsx`, `app/globals.css`, `lib/openings.ts`, `lib/pgn-parser.ts`, `lib/chesscom-api.ts`

- [ ] **Step 1: Run build to verify no TypeScript errors**

Run: `cd chess-app && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Start dev server and test manually**

Run: `cd chess-app && npm run dev`

Test checklist:
- [ ] Modal opens on page load
- [ ] New Game tab: select side, start game
- [ ] Load Game > PGN: paste valid PGN, parse, load
- [ ] Load Game > PGN: paste invalid PGN, see error
- [ ] Load Game > FEN: paste valid FEN, load position
- [ ] Load Game > FEN: paste invalid FEN, see error
- [ ] Load Game > Chess.com: enter username, fetch archives, select game
- [ ] Openings tab: search openings, filter by first move
- [ ] Openings > Replay: select opening, watch AI play moves
- [ ] Openings > Force: select opening, play correct moves, see deviation warning
- [ ] "New Game" button in status panel reopens modal
- [ ] Toast notifications appear for errors and force-mode warnings

- [ ] **Step 3: Commit final changes**

```bash
git add -A
git commit -m "feat: complete game loading, openings, and modal UI feature"
```
