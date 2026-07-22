# Custom Position Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to set up custom positions by dragging/clicking pieces, then choose which color plays next.

**Architecture:** New PositionEditor component with drag-and-drop support, piece palette, and FEN generation.

**Tech Stack:** TypeScript, React, chess.js

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `components/PositionEditor.tsx` | **Create** | Position editor component |
| `components/SetupModal.tsx` | Modify | Add "Setup" tab |
| `app/page.tsx` | Modify | Handle position editor flow |

---

### Task 1: Create PositionEditor Component

**Covers:** [S3]

**Files:**
- Create: `components/PositionEditor.tsx`

- [ ] **Step 1: Create component structure**

```tsx
// components/PositionEditor.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

interface PositionEditorProps {
  onPositionReady: (fen: string, playerSide: 'white' | 'black') => void;
}

type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
type PieceColor = 'w' | 'b';

interface PlacedPiece {
  type: PieceType;
  color: PieceColor;
}

const PIECES: { type: PieceType; color: PieceColor; symbol: string }[] = [
  // White pieces
  { type: 'k', color: 'w', symbol: '♔' },
  { type: 'q', color: 'w', symbol: '♕' },
  { type: 'r', color: 'w', symbol: '♖' },
  { type: 'b', color: 'w', symbol: '♗' },
  { type: 'n', color: 'w', symbol: '♘' },
  { type: 'p', color: 'w', symbol: '♙' },
  // Black pieces
  { type: 'k', color: 'b', symbol: '♚' },
  { type: 'q', color: 'b', symbol: '♛' },
  { type: 'r', color: 'b', symbol: '♜' },
  { type: 'b', color: 'b', symbol: '♝' },
  { type: 'n', color: 'b', symbol: '♞' },
  { type: 'p', color: 'b', symbol: '♟' },
];

export function PositionEditor({ onPositionReady }: PositionEditorProps) {
  const [board, setBoard] = useState<(PlacedPiece | null)[][]>(() => {
    // Initialize empty 8x8 board
    return Array(8).fill(null).map(() => Array(8).fill(null));
  });
  const [selectedPiece, setSelectedPiece] = useState<PlacedPiece | null>(null);
  const [playerSide, setPlayerSide] = useState<'white' | 'black'>('white');

  // Handle square click
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (selectedPiece) {
      // Place piece
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = selectedPiece;
      setBoard(newBoard);
      setSelectedPiece(null);
    } else if (board[row][col]) {
      // Remove piece
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = null;
      setBoard(newBoard);
    }
  }, [selectedPiece, board]);

  // Handle palette click
  const handlePaletteClick = useCallback((piece: PlacedPiece) => {
    setSelectedPiece(selectedPiece?.type === piece.type && selectedPiece?.color === piece.color ? null : piece);
  }, [selectedPiece]);

  // Generate FEN from board
  const generateFen = useCallback((): string => {
    let fen = '';
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
          fen += symbol;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty;
      if (row < 7) fen += '/';
    }
    // Add active color, castling, en passant, halfmove, fullmove
    fen += ` ${playerSide === 'white' ? 'w' : 'b'} - - 0 1`;
    return fen;
  }, [board, playerSide]);

  // Start game with current position
  const handleStart = useCallback(() => {
    const fen = generateFen();
    onPositionReady(fen, playerSide);
  }, [generateFen, playerSide, onPositionReady]);

  // Clear board
  const handleClear = useCallback(() => {
    setBoard(Array(8).fill(null).map(() => Array(8).fill(null)));
    setSelectedPiece(null);
  }, []);

  // Set up standard position
  const handleSetupStandard = useCallback(() => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    // Set up standard position
    const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let col = 0; col < 8; col++) {
      newBoard[0][col] = { type: backRank[col], color: 'b' };
      newBoard[1][col] = { type: 'p', color: 'b' };
      newBoard[6][col] = { type: 'p', color: 'w' };
      newBoard[7][col] = { type: backRank[col], color: 'w' };
    }
    setBoard(newBoard);
  }, []);

  return (
    <div className="position-editor">
      <div className="editor-layout">
        {/* Piece palette */}
        <div className="piece-palette">
          <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '8px' }}>
            Select piece:
          </p>
          <div className="palette-pieces">
            {PIECES.map((piece, i) => (
              <div
                key={i}
                className={`palette-piece ${selectedPiece?.type === piece.type && selectedPiece?.color === piece.color ? 'selected' : ''}`}
                onClick={() => handlePaletteClick(piece)}
              >
                {piece.symbol}
              </div>
            ))}
          </div>
        </div>

        {/* Board */}
        <div className="editor-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="editor-row">
              {row.map((piece, colIndex) => (
                <div
                  key={colIndex}
                  className={`editor-square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {piece && (
                    <span className="piece-symbol">
                      {PIECES.find(p => p.type === piece.type && p.color === piece.color)?.symbol}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="editor-controls">
        <div className="side-picker">
          <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '8px' }}>
            Who plays next?
          </p>
          <div className="side-options">
            <div
              className={`side-option ${playerSide === 'white' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('white')}
            >
              <div className="piece">♙</div>
              <div className="label">White</div>
            </div>
            <div
              className={`side-option ${playerSide === 'black' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('black')}
            >
              <div className="piece">♟</div>
              <div className="label">Black</div>
            </div>
          </div>
        </div>

        <div className="editor-actions">
          <button className="btn-modal-secondary" onClick={handleClear}>
            Clear Board
          </button>
          <button className="btn-modal-secondary" onClick={handleSetupStandard}>
            Standard Position
          </button>
          <button className="btn-modal-primary" onClick={handleStart}>
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS for position editor**

```css
/* Add to app/globals.css */
.position-editor {
  padding: 16px;
}

.editor-layout {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.piece-palette {
  flex: 0 0 120px;
}

.palette-pieces {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.palette-piece {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 2px solid #333;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.palette-piece:hover {
  border-color: #666;
}

.palette-piece.selected {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.1);
}

.editor-board {
  flex: 0 0 320px;
}

.editor-row {
  display: flex;
}

.editor-square {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid #333;
}

.editor-square.light {
  background: #f0d9b5;
}

.editor-square.dark {
  background: #b58863;
}

.editor-square:hover {
  opacity: 0.8;
}

.piece-symbol {
  font-size: 28px;
  user-select: none;
}

.editor-controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.editor-actions {
  display: flex;
  gap: 8px;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add components/PositionEditor.tsx app/globals.css
git commit -m "feat: add position editor component"
```

---

### Task 2: Add Setup Tab to SetupModal

**Covers:** [S3]

**Files:**
- Modify: `components/SetupModal.tsx`

- [ ] **Step 1: Import PositionEditor**

```typescript
// Add to imports
import { PositionEditor } from './PositionEditor';
```

- [ ] **Step 2: Add Setup tab**

```typescript
// Update activeTab type
activeTab: 'new' | 'load' | 'openings' | 'setup';

// Add Setup tab button
<button
  className={`modal-tab ${activeTab === 'setup' ? 'active' : ''}`}
  onClick={() => onTabChange('setup')}
>
  🎯 Setup
</button>

// Add Setup tab content
{activeTab === 'setup' && (
  <PositionEditor onPositionReady={onPositionReady} />
)}
```

- [ ] **Step 3: Add onPositionReady prop**

```typescript
// Update SetupModalProps
interface SetupModalProps {
  // ... existing props
  onPositionReady?: (fen: string, playerSide: 'white' | 'black') => void;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add components/SetupModal.tsx
git commit -m "feat: add setup tab to SetupModal"
```

---

### Task 3: Wire Up Position Editor

**Covers:** [S3]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add handlePositionReady callback**

```typescript
// Add to page.tsx
const handlePositionReady = useCallback((fen: string, playerSide: 'white' | 'black') => {
  game.loadFromFEN(fen);
  game.startGame(playerSide);
  setModalOpen(false);
  gameStartedRef.current = true;
}, [game]);
```

- [ ] **Step 2: Pass handler to SetupModal**

```typescript
// Update SetupModal usage
<SetupModal
  // ... existing props
  onPositionReady={handlePositionReady}
/>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire position editor to page"
```

---

### Task 4: Test Position Editor

**Covers:** [S3]

**Files:**
- None (verification only)

- [ ] **Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 2: Start dev server and test manually**

Run: `npm run dev`
Manual test:
1. Open SetupModal → Setup tab
2. Click a piece in palette → click board square to place
3. Click placed piece to remove
4. Choose "White" or "Black" to play next
5. Click "Start Game"
6. Verify game starts with custom position

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: custom position editor complete"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create PositionEditor component | `components/PositionEditor.tsx` |
| 2 | Add Setup tab to SetupModal | `components/SetupModal.tsx` |
| 3 | Wire up position editor | `app/page.tsx` |
| 4 | Test position editor | All |
