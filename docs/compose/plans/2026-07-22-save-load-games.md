# Save/Load Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localStorage-based save/load functionality for chess games with auto-save on every move and manual save with custom names.

**Architecture:** New `lib/storage.ts` module handles all localStorage operations. StatusBox gains a save button. LoadGameTab gets a "Saved" sub-tab. page.tsx orchestrates auto-save and manual save flows.

**Tech Stack:** TypeScript, React hooks, localStorage API

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/types.ts` | Modify | Add `SavedGame` interface |
| `lib/storage.ts` | **Create** | localStorage CRUD helpers |
| `components/StatusBox.tsx` | Modify | Add save button |
| `components/GamePanel.tsx` | Modify | Pass save handler to StatusBox |
| `components/LoadGameTab.tsx` | Modify | Add "Saved" sub-tab |
| `app/page.tsx` | Modify | Auto-save on move, manual save flow |

---

### Task 1: Add SavedGame Type

**Covers:** [S1]

**Files:**
- Modify: `lib/types.ts:110`

- [ ] **Step 1: Add SavedGame interface**

```typescript
// Add at end of lib/types.ts

// Saved Games
export interface SavedGame {
  name: string;
  fen: string;
  timestamp: number;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add SavedGame type definition"
```

---

### Task 2: Create Storage Helpers

**Covers:** [S7]

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/storage.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { getSavedGames, saveGame, deleteGame, autoSave } from './storage';
import type { SavedGame } from './types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no games saved', () => {
    expect(getSavedGames()).toEqual([]);
  });

  it('saves and retrieves a game', () => {
    const game: SavedGame = { name: 'Test Game', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', timestamp: 1234567890 };
    saveGame(game);
    const games = getSavedGames();
    expect(games).toHaveLength(1);
    expect(games[0].name).toBe('Test Game');
  });

  it('deletes a game by timestamp', () => {
    const game: SavedGame = { name: 'Test', fen: 'fen', timestamp: 123 };
    saveGame(game);
    deleteGame(123);
    expect(getSavedGames()).toEqual([]);
  });

  it('auto-saves with Auto-save name', () => {
    autoSave('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const games = getSavedGames();
    expect(games).toHaveLength(1);
    expect(games[0].name).toBe('Auto-save');
  });

  it('limits to 50 saved games', () => {
    for (let i = 0; i < 55; i++) {
      saveGame({ name: `Game ${i}`, fen: 'fen', timestamp: i });
    }
    expect(getSavedGames()).toHaveLength(50);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test lib/storage.test.ts`
Expected: FAIL with "Cannot find module './storage'"

- [ ] **Step 3: Implement storage helpers**

```typescript
// lib/storage.ts
import type { SavedGame } from './types';

const STORAGE_KEY = 'chess-saved-games';
const MAX_GAMES = 50;

export function getSavedGames(): SavedGame[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveGame(game: SavedGame): void {
  if (typeof window === 'undefined') return;
  const games = getSavedGames();
  games.unshift(game);
  if (games.length > MAX_GAMES) {
    games.pop();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function deleteGame(timestamp: number): void {
  if (typeof window === 'undefined') return;
  const games = getSavedGames().filter(g => g.timestamp !== timestamp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function autoSave(fen: string): void {
  if (typeof window === 'undefined') return;
  const games = getSavedGames().filter(g => g.name !== 'Auto-save');
  games.unshift({ name: 'Auto-save', fen, timestamp: Date.now() });
  if (games.length > MAX_GAMES) {
    games.pop();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test lib/storage.test.ts`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts lib/storage.test.ts
git commit -m "feat: add localStorage helpers for save/load games"
```

---

### Task 3: Add Save Button to StatusBox

**Covers:** [S3]

**Files:**
- Modify: `components/StatusBox.tsx`
- Modify: `lib/types.ts:89-98`

- [ ] **Step 1: Update StatusBoxProps type**

```typescript
// Update in lib/types.ts
export interface StatusBoxProps {
  statusText: string;
  isThinking: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}
```

- [ ] **Step 2: Add save button to StatusBox**

```typescript
// Update components/StatusBox.tsx
interface StatusBoxProps {
  statusText: string;
  isThinking: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export function StatusBox({
  statusText,
  isThinking,
  explanation,
  showExplanation,
  actionButtonText,
  showActionButton,
  onAction,
  onSave,
  showSaveButton,
}: StatusBoxProps) {
  return (
    <div className="status-box">
      <div className={isThinking ? 'thinking' : ''}>
        {statusText}
      </div>
      {showExplanation && explanation && (
        <div className="explanation">{explanation}</div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {showActionButton && actionButtonText && (
          <button className="action-button" onClick={onAction}>
            {actionButtonText}
          </button>
        )}
        {showSaveButton && onSave && (
          <button className="action-button" onClick={onSave}>
            💾 Save Game
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/StatusBox.tsx lib/types.ts
git commit -m "feat: add save button to StatusBox"
```

---

### Task 4: Update GamePanel to Pass Save Handler

**Covers:** [S3]

**Files:**
- Modify: `components/GamePanel.tsx`

- [ ] **Step 1: Add onSave prop to GamePanel**

```typescript
// Update components/GamePanel.tsx
interface GamePanelProps {
  gameStarted: boolean;
  gameState: GameState;
  engineResult: EngineResult | null;
  isEngineLoading: boolean;
  statusText: string;
  isThinking: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
  onNewGame: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export function GamePanel({
  gameStarted,
  gameState,
  engineResult,
  isEngineLoading,
  statusText,
  isThinking,
  explanation,
  showExplanation,
  actionButtonText,
  showActionButton,
  onAction,
  onNewGame,
  onSave,
  showSaveButton,
}: GamePanelProps) {
  // ... existing code ...

  return (
    <div id="game-section">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button className="btn-new-game" onClick={onNewGame}>
          ♟ New Game
        </button>
      </div>
      
      <StatusBox
        statusText={statusText}
        isThinking={isThinking}
        explanation={explanation}
        showExplanation={showExplanation}
        actionButtonText={actionButtonText}
        showActionButton={showActionButton}
        onAction={onAction}
        onSave={onSave}
        showSaveButton={showSaveButton}
      />

      {/* ... rest unchanged ... */}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/GamePanel.tsx
git commit -m "feat: pass save handler through GamePanel"
```

---

### Task 5: Add "Saved" Sub-Tab to LoadGameTab

**Covers:** [S4]

**Files:**
- Modify: `components/LoadGameTab.tsx`

- [ ] **Step 1: Add saved games state and sub-tab**

```typescript
// Update components/LoadGameTab.tsx
import { useState, useCallback, useEffect } from 'react';
import { getSavedGames, deleteGame } from '@/lib/storage';
import type { SavedGame } from '@/lib/types';

interface LoadGameTabProps {
  onLoadPGN?: (game: ParsedGame) => void;
  onLoadFEN?: (fen: string) => void;
  onLoadChessCom?: (game: ChessComGame) => void;
}

export function LoadGameTab({ onLoadPGN, onLoadFEN, onLoadChessCom }: LoadGameTabProps) {
  const [loadSubTab, setLoadSubTab] = useState<'pgn' | 'fen' | 'chesscom' | 'saved'>('pgn');
  
  // ... existing state ...

  // Saved games state
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);

  const loadSavedGames = useCallback(() => {
    setSavedGames(getSavedGames());
  }, []);

  useEffect(() => {
    loadSavedGames();
  }, [loadSavedGames]);

  const handleLoadSaved = useCallback((game: SavedGame) => {
    if (onLoadFEN) {
      onLoadFEN(game.fen);
    }
  }, [onLoadFEN]);

  const handleDeleteSaved = useCallback((timestamp: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteGame(timestamp);
    loadSavedGames();
  }, [loadSavedGames]);

  // Add sub-tab button
  // Add saved games list UI
  // ... (see full implementation in commit)
}
```

- [ ] **Step 2: Add "Saved" sub-tab button**

```typescript
// In the sub-tabs div, add after Chess.com button
<button
  className={`sub-tab ${loadSubTab === 'saved' ? 'active' : ''}`}
  onClick={() => {
    setLoadSubTab('saved');
    loadSavedGames();
  }}
>
  Saved
</button>
```

- [ ] **Step 3: Add saved games list UI**

```typescript
// Add after chesscom section
{loadSubTab === 'saved' && (
  <div>
    {savedGames.length === 0 ? (
      <p style={{ color: '#71717a', textAlign: 'center', padding: '20px' }}>
        No saved games yet
      </p>
    ) : (
      <div className="chesscom-list">
        {savedGames.map((game) => (
          <div
            key={game.timestamp}
            className="chesscom-item"
            onClick={() => handleLoadSaved(game)}
          >
            <div className="opponent">{game.name}</div>
            <div className="meta">{new Date(game.timestamp).toLocaleDateString()}</div>
            <button
              className="btn-delete"
              onClick={(e) => handleDeleteSaved(game.timestamp, e)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    )}
    <button className="btn-modal-secondary" onClick={loadSavedGames}>
      Refresh
    </button>
  </div>
)}
```

- [ ] **Step 4: Add delete button CSS**

```css
/* Add to app/globals.css */
.btn-delete {
  background: none;
  border: none;
  color: #71717a;
  cursor: pointer;
  padding: 4px 8px;
  font-size: 0.9em;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-delete:hover {
  opacity: 1;
  color: #ef4444;
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add components/LoadGameTab.tsx app/globals.css
git commit -m "feat: add Saved sub-tab to LoadGameTab"
```

---

### Task 6: Add Auto-Save and Manual Save to page.tsx

**Covers:** [S2, S3]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Import storage helpers**

```typescript
// Add to imports in app/page.tsx
import { autoSave, saveGame } from '@/lib/storage';
```

- [ ] **Step 2: Add auto-save after each move**

Find the `handleSquareClick` function. After `board.setLastMove({ from: move.from, to: move.to });` (around line 164), add:

```typescript
autoSave(chess.fen());
```

- [ ] **Step 3: Add manual save handler**

```typescript
// Add after showToast callback
const handleManualSave = useCallback(() => {
  const name = prompt('Enter game name:');
  if (!name?.trim()) return;
  
  const chess = game.chess;
  if (!chess) return;
  
  saveGame({
    name: name.trim(),
    fen: chess.fen(),
    timestamp: Date.now(),
  });
  
  showToast('Game saved!', 'warning');
}, [game.chess, showToast]);
```

- [ ] **Step 4: Pass save props to GamePanel**

Update the GamePanel component usage:

```typescript
<GamePanel
  gameStarted={game.gameStarted}
  gameState={gameState as any}
  engineResult={engine.lastResult}
  isEngineLoading={engine.loading}
  statusText={statusText}
  isThinking={engine.loading}
  explanation={explanation}
  showExplanation={!!explanation}
  actionButtonText={actionButtonText}
  showActionButton={!!actionButtonText}
  onAction={stepBack}
  onNewGame={() => setModalOpen(true)}
  onSave={handleManualSave}
  showSaveButton={game.gameStarted && !game.chess?.isGameOver()}
/>
```

- [ ] **Step 5: Add auto-save on engine moves**

Find the `useEffect` that handles engine results (around line 257). After `board.setLastMove({ from: move.from, to: move.to });` (around line 270), add:

```typescript
autoSave(chess.fen());
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add auto-save and manual save to page"
```

---

### Task 7: Run Full Test Suite and Verify

**Covers:** All

**Files:**
- None (verification only)

- [ ] **Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Start dev server and test manually**

Run: `npm run dev`
Manual test:
1. Start a new game
2. Make a move → verify auto-save works
3. Click "Save Game" → enter name → verify toast
4. Open SetupModal → Load Game → Saved tab → verify game appears
5. Click saved game → verify it loads
6. Delete saved game → verify it's removed

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: save/load games complete with auto-save and manual save"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add SavedGame type | `lib/types.ts` |
| 2 | Create storage helpers | `lib/storage.ts` |
| 3 | Add save button to StatusBox | `components/StatusBox.tsx` |
| 4 | Update GamePanel props | `components/GamePanel.tsx` |
| 5 | Add Saved sub-tab | `components/LoadGameTab.tsx` |
| 6 | Wire up auto-save and manual save | `app/page.tsx` |
| 7 | Verify everything works | All |
