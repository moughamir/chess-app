# Chess App Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the monolithic 1088-line `page.tsx` into a clean, testable component architecture with proper TypeScript types, no jQuery, and no `dangerouslySetInnerHTML`.

**Architecture:** Decompose into focused React components, custom hooks for state management, and a pure SVG/Unicode chess board. Keep existing engine, API, and lib files intact.

**Tech Stack:** Next.js 16, React 19, chess.js, TypeScript strict mode, Bun test

---

## File Structure

```
app/
├── page.tsx                    # MODIFIED: Shell + state provider (~150 lines)
├── components/
│   ├── Board.tsx               # NEW: SVG/Unicode chess board
│   ├── GamePanel.tsx           # NEW: Right panel container
│   ├── StatusBox.tsx           # NEW: Status text + thinking indicator
│   ├── Explanation.tsx         # NEW: Arabic move analysis
│   ├── MoveHistory.tsx         # NEW: Scrollable move list
│   ├── ActionButton.tsx        # NEW: Context-aware action button
│   ├── SetupModal.tsx          # NEW: Modal container + tabs
│   ├── NewGameTab.tsx          # NEW: Side picker + start
│   ├── LoadGameTab.tsx         # NEW: PGN/FEN/Chess.com sub-tabs
│   ├── OpeningsTab.tsx         # NEW: Opening browser + replay/force
│   └── Toast.tsx               # NEW: Notification overlay
├── hooks/
│   ├── useChessGame.ts         # NEW: Game state machine + move logic
│   ├── useEngine.ts            # NEW: API calls + loading/error state
│   └── useBoardInteraction.ts  # NEW: Square click handling + highlights
└── lib/
    ├── types.ts                # NEW: Shared TypeScript interfaces
    ├── engine.ts               # UNCHANGED
    ├── constants.ts            # UNCHANGED
    ├── explanations.ts         # UNCHANGED
    ├── openings.ts             # UNCHANGED
    ├── pgn-parser.ts           # UNCHANGED
    ├── chesscom-api.ts         # UNCHANGED
    └── lichess.ts              # UNCHANGED
```

---

## Task 1: Add TypeScript Types

**Covers:** [S5]

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create types.ts with all shared interfaces**

```typescript
// lib/types.ts

import type { Chess } from 'chess.js';

// Chess piece types
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Move {
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
export interface GameState {
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
export interface EngineResult {
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
export interface Opening {
  name: string;
  moves: string[];
  eco: string;
  category: string;
}

// Chess.com API
export interface Archive {
  url: string;
  year: number;
  month: number;
}

export interface ChessComGame {
  pgn: string;
  opponent: string;
  date: string;
  result: string;
}

// PGN Parser
export interface ParsedGame {
  headers: Record<string, string>;
  moves: string[];
  fen: string;
  moveCount: number;
}

// Board
export interface BoardProps {
  fen: string;
  orientation: 'white' | 'black';
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  onSquareClick: (square: string) => void;
  moveSpeed?: number;
}

// Status
export interface StatusBoxProps {
  statusText: string;
  isThinking: boolean;
  isUserTurn: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
}

// Move History
export interface MoveHistoryProps {
  moves: string[];
}

// Toast
export interface ToastProps {
  message: string;
  type: 'warning' | 'error' | '';
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript interfaces"
```

---

## Task 2: Create useChessGame Hook

**Covers:** [S3]

**Files:**
- Create: `hooks/useChessGame.ts`
- Test: `hooks/useChessGame.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// hooks/useChessGame.test.ts
import { describe, it, expect } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from './useChessGame';

describe('useChessGame', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChessGame());
    
    expect(result.current.gameStarted).toBe(false);
    expect(result.current.playerSide).toBe('white');
    expect(result.current.myColor).toBe('w');
    expect(result.current.oppColor).toBe('b');
  });

  it('should start game with correct orientation', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.playerSide).toBe('white');
    expect(result.current.myColor).toBe('w');
    expect(result.current.oppColor).toBe('b');
  });

  it('should start game with black orientation', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('black');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.playerSide).toBe('black');
    expect(result.current.myColor).toBe('b');
    expect(result.current.oppColor).toBe('w');
  });

  it('should make a valid move', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    const move = result.current.makeMove('e2', 'e4');
    expect(move).not.toBeNull();
    expect(move?.san).toBe('e4');
  });

  it('should reject invalid move', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    const move = result.current.makeMove('e2', 'e5');
    expect(move).toBeNull();
  });

  it('should undo last move', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    act(() => {
      result.current.makeMove('e2', 'e4');
    });
    
    act(() => {
      result.current.undoMove();
    });
    
    expect(result.current.chess?.history()).toHaveLength(0);
  });

  it('should load PGN', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.loadFromPGN('1. e4 e5 2. Nf3');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.chess?.history()).toHaveLength(3);
  });

  it('should load FEN', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.loadFromFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.myColor).toBe('b');
  });

  it('should detect game over', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    // Scholar's mate
    act(() => { result.current.makeMove('e2', 'e4'); });
    act(() => { result.current.makeMove('e7', 'e5'); });
    act(() => { result.current.makeMove('f1', 'c4'); });
    act(() => { result.current.makeMove('b8', 'c6'); });
    act(() => { result.current.makeMove('d1', 'h5'); });
    act(() => { result.current.makeMove('g8', 'f6'); });
    act(() => { result.current.makeMove('h5', 'f7'); });
    
    expect(result.current.isGameOver()).toBe(true);
    expect(result.current.isCheckmate()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test hooks/useChessGame.test.ts`
Expected: FAIL with "module not found" or "function not defined"

- [ ] **Step 3: Write minimal implementation**

```typescript
// hooks/useChessGame.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { PieceColor, Opening, Move } from '@/lib/types';

interface UseChessGameReturn {
  chess: Chess | null;
  playerSide: 'white' | 'black';
  myColor: PieceColor;
  oppColor: PieceColor;
  gameStarted: boolean;
  sourceSquare: string | null;
  openingMode: 'replay' | 'force' | null;
  selectedOpening: Opening | null;
  forceMoveIndex: number;
  startGame: (side: 'white' | 'black') => void;
  makeMove: (from: string, to: string, promotion?: string) => Move | null;
  undoMove: () => void;
  loadFromPGN: (pgn: string) => boolean;
  loadFromFEN: (fen: string) => boolean;
  setSourceSquare: (square: string | null) => void;
  setOpeningMode: (mode: 'replay' | 'force' | null) => void;
  setSelectedOpening: (opening: Opening | null) => void;
  setForceMoveIndex: (index: number) => void;
  isGameOver: () => boolean;
  isCheckmate: () => boolean;
  isCheck: () => boolean;
  getHistory: () => string[];
  getFen: () => string;
  getTurn: () => PieceColor;
}

export function useChessGame(): UseChessGameReturn {
  const chessRef = useRef<Chess | null>(null);
  const [playerSide, setPlayerSide] = useState<'white' | 'black'>('white');
  const [myColor, setMyColor] = useState<PieceColor>('w');
  const [oppColor, setOppColor] = useState<PieceColor>('b');
  const [gameStarted, setGameStarted] = useState(false);
  const [sourceSquare, setSourceSquare] = useState<string | null>(null);
  const [openingMode, setOpeningMode] = useState<'replay' | 'force' | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [forceMoveIndex, setForceMoveIndex] = useState(0);

  const startGame = useCallback((side: 'white' | 'black') => {
    chessRef.current = new Chess();
    setPlayerSide(side);
    setMyColor(side === 'white' ? 'w' : 'b');
    setOppColor(side === 'white' ? 'b' : 'w');
    setGameStarted(true);
    setSourceSquare(null);
    setOpeningMode(null);
    setSelectedOpening(null);
    setForceMoveIndex(0);
  }, []);

  const makeMove = useCallback((from: string, to: string, promotion: string = 'q'): Move | null => {
    if (!chessRef.current) return null;
    
    const move = chessRef.current.move({ from, to, promotion });
    if (!move) return null;
    
    setSourceSquare(null);
    return move as Move;
  }, []);

  const undoMove = useCallback(() => {
    if (!chessRef.current) return;
    chessRef.current.undo();
    setSourceSquare(null);
  }, []);

  const loadFromPGN = useCallback((pgn: string): boolean => {
    try {
      const newChess = new Chess();
      newChess.load_pgn(pgn);
      
      chessRef.current = newChess;
      const turn = newChess.turn();
      setMyColor(turn);
      setOppColor(turn === 'w' ? 'b' : 'w');
      setPlayerSide(turn === 'w' ? 'white' : 'black');
      setGameStarted(true);
      setSourceSquare(null);
      setOpeningMode(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadFromFEN = useCallback((fen: string): boolean => {
    try {
      const test = new Chess();
      if (!test.load(fen)) return false;
      
      chessRef.current = new Chess();
      chessRef.current.load(fen);
      
      const turn = chessRef.current.turn();
      setMyColor(turn);
      setOppColor(turn === 'w' ? 'b' : 'w');
      setPlayerSide(turn === 'w' ? 'white' : 'black');
      setGameStarted(true);
      setSourceSquare(null);
      setOpeningMode(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const isGameOver = useCallback((): boolean => {
    return chessRef.current?.isGameOver() ?? false;
  }, []);

  const isCheckmate = useCallback((): boolean => {
    return chessRef.current?.isCheckmate() ?? false;
  }, []);

  const isCheck = useCallback((): boolean => {
    return chessRef.current?.isCheck() ?? false;
  }, []);

  const getHistory = useCallback((): string[] => {
    return chessRef.current?.history() ?? [];
  }, []);

  const getFen = useCallback((): string => {
    return chessRef.current?.fen() ?? '';
  }, []);

  const getTurn = useCallback((): PieceColor => {
    return chessRef.current?.turn() ?? 'w';
  }, []);

  return {
    chess: chessRef.current,
    playerSide,
    myColor,
    oppColor,
    gameStarted,
    sourceSquare,
    openingMode,
    selectedOpening,
    forceMoveIndex,
    startGame,
    makeMove,
    undoMove,
    loadFromPGN,
    loadFromFEN,
    setSourceSquare,
    setOpeningMode,
    setSelectedOpening,
    setForceMoveIndex,
    isGameOver,
    isCheckmate,
    isCheck,
    getHistory,
    getFen,
    getTurn,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test hooks/useChessGame.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useChessGame.ts hooks/useChessGame.test.ts
git commit -m "feat: add useChessGame hook with game state management"
```

---

## Task 3: Create useEngine Hook

**Covers:** [S3]

**Files:**
- Create: `hooks/useEngine.ts`
- Test: `hooks/useEngine.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// hooks/useEngine.test.ts
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEngine } from './useEngine';

// Mock fetch
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    bestMove: 'e2e4',
    san: 'e4',
    explanation: '测试解释',
    evaluation: 50,
    depth: 5,
    nodes: 1000,
    timeMs: 100,
    engine: 'custom-minimax',
  }),
}));

global.fetch = mockFetch;

describe('useEngine', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEngine());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResult).toBeNull();
  });

  it('should calculate best move', async () => {
    const { result } = renderHook(() => useEngine());
    
    await act(async () => {
      await result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.lastResult).not.toBeNull();
    expect(result.current.lastResult?.san).toBe('e4');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Engine error' }),
    });
    
    const { result } = renderHook(() => useEngine());
    
    await act(async () => {
      await result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Engine error');
    expect(result.current.lastResult).toBeNull();
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useEngine());
    
    await act(async () => {
      await result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should set loading state during calculation', async () => {
    let resolvePromise: (value: any) => void;
    mockFetch.mockReturnValueOnce(new Promise((resolve) => {
      resolvePromise = resolve;
    }));
    
    const { result } = renderHook(() => useEngine());
    
    act(() => {
      result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({
          bestMove: 'e7e5',
          san: 'e5',
          explanation: '测试',
          evaluation: -30,
          depth: 3,
          nodes: 500,
          timeMs: 50,
          engine: 'custom-minimax',
        }),
      });
    });
    
    expect(result.current.loading).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test hooks/useEngine.test.ts`
Expected: FAIL with "module not found"

- [ ] **Step 3: Write minimal implementation**

```typescript
// hooks/useEngine.ts
'use client';

import { useState, useCallback } from 'react';
import type { EngineResult } from '@/lib/types';

interface UseEngineReturn {
  loading: boolean;
  error: string | null;
  lastResult: EngineResult | null;
  calculateBestMove: (fen: string, depth?: number) => Promise<EngineResult | null>;
  clearError: () => void;
}

export function useEngine(): UseEngineReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<EngineResult | null>(null);

  const calculateBestMove = useCallback(async (fen: string, depth: number = 3): Promise<EngineResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, depth }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Engine error');
      }
      
      const result = await response.json();
      setLastResult(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    lastResult,
    calculateBestMove,
    clearError,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test hooks/useEngine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useEngine.ts hooks/useEngine.test.ts
git commit -m "feat: add useEngine hook for API calls"
```

---

## Task 4: Create useBoardInteraction Hook

**Covers:** [S3, S4]

**Files:**
- Create: `hooks/useBoardInteraction.ts`
- Test: `hooks/useBoardInteraction.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// hooks/useBoardInteraction.test.ts
import { describe, it, expect } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useBoardInteraction } from './useBoardInteraction';

describe('useBoardInteraction', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toHaveLength(0);
    expect(result.current.lastMove).toBeNull();
    expect(result.current.highlightedSquares).toHaveLength(0);
  });

  it('should select a square', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
    });
    
    expect(result.current.selectedSquare).toBe('e2');
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
    });
    
    act(() => {
      result.current.clearSelection();
    });
    
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toHaveLength(0);
  });

  it('should set legal moves for selected square', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
      result.current.setLegalMoves(['e3', 'e4']);
    });
    
    expect(result.current.legalMoves).toEqual(['e3', 'e4']);
  });

  it('should set last move', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.setLastMove({ from: 'e2', to: 'e4' });
    });
    
    expect(result.current.lastMove).toEqual({ from: 'e2', to: 'e4' });
  });

  it('should compute highlighted squares', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
      result.current.setLegalMoves(['e3', 'e4']);
      result.current.setLastMove({ from: 'd2', to: 'd4' });
    });
    
    expect(result.current.highlightedSquares).toContain('e2');
    expect(result.current.highlightedSquares).toContain('e3');
    expect(result.current.highlightedSquares).toContain('e4');
    expect(result.current.highlightedSquares).toContain('d2');
    expect(result.current.highlightedSquares).toContain('d4');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test hooks/useBoardInteraction.test.ts`
Expected: FAIL with "module not found"

- [ ] **Step 3: Write minimal implementation**

```typescript
// hooks/useBoardInteraction.ts
'use client';

import { useState, useCallback, useMemo } from 'react';

interface UseBoardInteractionReturn {
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  highlightedSquares: string[];
  selectSquare: (square: string) => void;
  clearSelection: () => void;
  setLegalMoves: (moves: string[]) => void;
  setLastMove: (move: { from: string; to: string } | null) => void;
}

export function useBoardInteraction(): UseBoardInteractionReturn {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const highlightedSquares = useMemo(() => {
    const squares = new Set<string>();
    if (selectedSquare) squares.add(selectedSquare);
    legalMoves.forEach((sq) => squares.add(sq));
    if (lastMove) {
      squares.add(lastMove.from);
      squares.add(lastMove.to);
    }
    return Array.from(squares);
  }, [selectedSquare, legalMoves, lastMove]);

  const selectSquare = useCallback((square: string) => {
    setSelectedSquare(square);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  return {
    selectedSquare,
    legalMoves,
    lastMove,
    highlightedSquares,
    selectSquare,
    clearSelection,
    setLegalMoves,
    setLastMove,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test hooks/useBoardInteraction.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/useBoardInteraction.ts hooks/useBoardInteraction.test.ts
git commit -m "feat: add useBoardInteraction hook for square selection"
```

---

## Task 5: Create Board Component

**Covers:** [S2, S4]

**Files:**
- Create: `components/Board.tsx`
- Test: `components/Board.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// components/Board.test.tsx
import { describe, it, expect, mock } from 'bun:test';
import { render, fireEvent, screen } from '@testing-library/react';
import { Board } from './Board';

describe('Board', () => {
  const defaultProps = {
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    orientation: 'white' as const,
    selectedSquare: null,
    legalMoves: [],
    lastMove: null,
    onSquareClick: mock(() => {}),
  };

  it('should render 64 squares', () => {
    render(<Board {...defaultProps} />);
    
    const squares = screen.getAllByRole('button');
    expect(squares).toHaveLength(64);
  });

  it('should render pieces from FEN', () => {
    render(<Board {...defaultProps} />);
    
    // Black king should be on e8
    const e8 = screen.getByTestId('square-e8');
    expect(e8.textContent).toContain('♚');
    
    // White pawn on e4
    const e4 = screen.getByTestId('square-e4');
    expect(e4.textContent).toContain('♙');
  });

  it('should call onSquareClick when square is clicked', () => {
    render(<Board {...defaultProps} />);
    
    const e2 = screen.getByTestId('square-e2');
    fireEvent.click(e2);
    
    expect(defaultProps.onSquareClick).toHaveBeenCalledWith('e2');
  });

  it('should highlight selected square', () => {
    render(<Board {...defaultProps} selectedSquare="e2" />);
    
    const e2 = screen.getByTestId('square-e2');
    expect(e2.className).toContain('selected');
  });

  it('should highlight legal moves', () => {
    render(<Board {...defaultProps} legalMoves={['e3', 'e4']} />);
    
    const e3 = screen.getByTestId('square-e3');
    const e4 = screen.getByTestId('square-e4');
    expect(e3.className).toContain('legal-move');
    expect(e4.className).toContain('legal-move');
  });

  it('should highlight last move', () => {
    render(<Board {...defaultProps} lastMove={{ from: 'e2', to: 'e4' }} />);
    
    const e2 = screen.getByTestId('square-e2');
    const e4 = screen.getByTestId('square-e4');
    expect(e2.className).toContain('last-move');
    expect(e4.className).toContain('last-move');
  });

  it('should flip board for black orientation', () => {
    render(<Board {...defaultProps} orientation="black" />);
    
    // a1 should be top-left for black orientation
    const a1 = screen.getByTestId('square-a1');
    expect(a1.style.gridRow).toBe('1');
    expect(a1.style.gridColumn).toBe('8');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test components/Board.test.tsx`
Expected: FAIL with "module not found"

- [ ] **Step 3: Write minimal implementation**

```typescript
// components/Board.tsx
'use client';

import React, { useMemo } from 'react';
import type { BoardProps } from '@/lib/types';

const PIECES: Record<string, string> = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function parseFen(fen: string): Map<string, string> {
  const pieces = new Map<string, string>();
  const rows = fen.split(' ')[0].split('/');
  
  for (let i = 0; i < rows.length; i++) {
    let col = 0;
    for (const char of rows[i]) {
      if (char >= '1' && char <= '8') {
        col += parseInt(char);
      } else {
        const color = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase();
        const square = FILES[col] + RANKS[i];
        pieces.set(square, color + type);
        col++;
      }
    }
  }
  
  return pieces;
}

export function Board({
  fen,
  orientation,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
}: BoardProps) {
  const pieces = useMemo(() => parseFen(fen), [fen]);
  
  const squares = useMemo(() => {
    const result: Array<{ square: string; row: number; col: number }> = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const fileIdx = orientation === 'white' ? col : 7 - col;
        const rankIdx = orientation === 'white' ? row : 7 - row;
        const square = FILES[fileIdx] + RANKS[rankIdx];
        result.push({ square, row: row + 1, col: col + 1 });
      }
    }
    
    return result;
  }, [orientation]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        width: '100%',
        aspectRatio: '1',
        border: '2px solid #27272a',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      {squares.map(({ square, row, col }) => {
        const isLight = (row + col) % 2 === 1;
        const piece = pieces.get(square);
        const isSelected = selectedSquare === square;
        const isLegalMove = legalMoves.includes(square);
        const isLastMove = lastMove?.from === square || lastMove?.to === square;
        
        let bgColor = isLight ? '#f0d9b5' : '#b58863';
        if (isSelected) bgColor = '#829769';
        else if (isLastMove) bgColor = '#cdd16a';
        
        return (
          <button
            key={square}
            data-testid={`square-${square}`}
            onClick={() => onSquareClick(square)}
            style={{
              backgroundColor: bgColor,
              border: 'none',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'min(8vw, 60px)',
              cursor: 'pointer',
              position: 'relative',
              gridRow: row,
              gridColumn: col,
            }}
            className={[
              isSelected ? 'selected' : '',
              isLegalMove ? 'legal-move' : '',
              isLastMove ? 'last-move' : '',
            ].filter(Boolean).join(' ')}
          >
            {piece && (
              <span style={{ pointerEvents: 'none' }}>
                {PIECES[piece] || ''}
              </span>
            )}
            {isLegalMove && !piece && (
              <div
                style={{
                  width: '30%',
                  height: '30%',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test components/Board.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/Board.tsx components/Board.test.tsx
git commit -m "feat: add Board component with SVG/Unicode pieces"
```

---

## Task 6: Create UI Components

**Covers:** [S2]

**Files:**
- Create: `components/StatusBox.tsx`
- Create: `components/MoveHistory.tsx`
- Create: `components/ActionButton.tsx`
- Create: `components/Explanation.tsx`
- Create: `components/Toast.tsx`
- Test: `components/StatusBox.test.tsx`
- Test: `components/MoveHistory.test.tsx`
- Test: `components/Toast.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// components/StatusBox.test.tsx
import { describe, it, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { StatusBox } from './StatusBox';

describe('StatusBox', () => {
  it('should display status text', () => {
    render(
      <StatusBox
        statusText="Thinking..."
        isThinking={false}
        isUserTurn={false}
        explanation={null}
        showExplanation={false}
        actionButtonText={null}
        showActionButton={false}
        onAction={mock(() => {})}
      />
    );
    
    expect(screen.getByText('Thinking...')).toBeTruthy();
  });

  it('should show thinking indicator', () => {
    const { container } = render(
      <StatusBox
        statusText="Thinking..."
        isThinking={true}
        isUserTurn={false}
        explanation={null}
        showExplanation={false}
        actionButtonText={null}
        showActionButton={false}
        onAction={mock(() => {})}
      />
    );
    
    expect(container.querySelector('.thinking')).toBeTruthy();
  });

  it('should show explanation when enabled', () => {
    render(
      <StatusBox
        statusText="Move played"
        isThinking={false}
        isUserTurn={false}
        explanation="This is a good move"
        showExplanation={true}
        actionButtonText={null}
        showActionButton={false}
        onAction={mock(() => {})}
      />
    );
    
    expect(screen.getByText('This is a good move')).toBeTruthy();
  });

  it('should show action button when enabled', () => {
    const onAction = mock(() => {});
    render(
      <StatusBox
        statusText="Your turn"
        isThinking={false}
        isUserTurn={true}
        explanation={null}
        showExplanation={false}
        actionButtonText="Step Back"
        showActionButton={true}
        onAction={onAction}
      />
    );
    
    const button = screen.getByText('Step Back');
    expect(button).toBeTruthy();
  });
});

// components/MoveHistory.test.tsx
import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { MoveHistory } from './MoveHistory';

describe('MoveHistory', () => {
  it('should display ready message when no moves', () => {
    render(<MoveHistory moves={[]} />);
    
    expect(screen.getByText('Ready for war...')).toBeTruthy();
  });

  it('should display moves', () => {
    render(<MoveHistory moves={['e4', 'e5', 'Nf3', 'Nc6']} />);
    
    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('e4')).toBeTruthy();
    expect(screen.getByText('e5')).toBeTruthy();
  });

  it('should group moves by pairs', () => {
    render(<MoveHistory moves={['e4', 'e5', 'Nf3']} />);
    
    expect(screen.getByText('1.')).toBeTruthy();
    expect(screen.getByText('2.')).toBeTruthy();
  });
});

// components/Toast.test.tsx
import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('should display message', () => {
    render(<Toast message="Test message" type="" />);
    
    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('should apply warning class', () => {
    const { container } = render(<Toast message="Warning" type="warning" />);
    
    expect(container.querySelector('.warning')).toBeTruthy();
  });

  it('should apply error class', () => {
    const { container } = render(<Toast message="Error" type="error" />);
    
    expect(container.querySelector('.error')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test components/StatusBox.test.tsx components/MoveHistory.test.tsx components/Toast.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write implementations**

```typescript
// components/StatusBox.tsx
'use client';

import React from 'react';
import type { StatusBoxProps } from '@/lib/types';

export function StatusBox({
  statusText,
  isThinking,
  isUserTurn,
  explanation,
  showExplanation,
  actionButtonText,
  showActionButton,
  onAction,
}: StatusBoxProps) {
  return (
    <div
      id="status-box"
      className={isUserTurn ? 'user-turn' : ''}
    >
      <div
        id="status-title"
        className={isThinking ? 'thinking' : ''}
        dangerouslySetInnerHTML={{ __html: statusText }}
      />
      {showExplanation && explanation && (
        <div
          id="move-explanation"
          dangerouslySetInnerHTML={{ __html: explanation }}
        />
      )}
      {showActionButton && actionButtonText && (
        <button
          className="btn-secondary"
          onClick={onAction}
          dangerouslySetInnerHTML={{ __html: actionButtonText }}
        />
      )}
    </div>
  );
}

// components/MoveHistory.tsx
'use client';

import React from 'react';
import type { MoveHistoryProps } from '@/lib/types';

export function MoveHistory({ moves }: MoveHistoryProps) {
  if (moves.length === 0) {
    return (
      <div id="history">
        <div style={{ color: '#71717a', textAlign: 'center', padding: '20px' }}>
          Ready for war...
        </div>
      </div>
    );
  }

  const pairs: Array<{ number: number; white: string; black?: string }> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div id="history">
      {pairs.map((pair) => (
        <div
          key={pair.number}
          style={{
            marginBottom: '8px',
            borderBottom: '1px solid #27272a',
            paddingBottom: '4px',
          }}
        >
          <b>{pair.number}.</b> &nbsp;
          <span style={{ color: '#f4f4f5' }}>{pair.white}</span>
          &nbsp;&nbsp;&nbsp;
          {pair.black && (
            <span style={{ color: '#a1a1aa' }}>{pair.black}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// components/ActionButton.tsx
'use client';

import React from 'react';

interface ActionButtonProps {
  text: string;
  onClick: () => void;
}

export function ActionButton({ text, onClick }: ActionButtonProps) {
  return (
    <button
      className="btn-secondary"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

// components/Explanation.tsx
'use client';

import React from 'react';

interface ExplanationProps {
  content: string;
}

export function Explanation({ content }: ExplanationProps) {
  return (
    <div
      id="move-explanation"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// components/Toast.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { ToastProps } from '@/lib/types';

export function Toast({ message, type }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test components/StatusBox.test.tsx components/MoveHistory.test.tsx components/Toast.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/StatusBox.tsx components/MoveHistory.tsx components/ActionButton.tsx components/Explanation.tsx components/Toast.tsx components/StatusBox.test.tsx components/MoveHistory.test.tsx components/Toast.test.tsx
git commit -m "feat: add UI components (StatusBox, MoveHistory, ActionButton, Explanation, Toast)"
```

---

## Task 7: Create Modal Components

**Covers:** [S2]

**Files:**
- Create: `components/SetupModal.tsx`
- Create: `components/NewGameTab.tsx`
- Create: `components/LoadGameTab.tsx`
- Create: `components/OpeningsTab.tsx`

- [ ] **Step 1: Create SetupModal**

```typescript
// components/SetupModal.tsx
'use client';

import React from 'react';
import { NewGameTab } from './NewGameTab';
import { LoadGameTab } from './LoadGameTab';
import { OpeningsTab } from './OpeningsTab';

interface SetupModalProps {
  isOpen: boolean;
  activeTab: 'new' | 'load' | 'openings';
  onTabChange: (tab: 'new' | 'load' | 'openings') => void;
  onClose: () => void;
  onStartGame: () => void;
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
}

export function SetupModal({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  onStartGame,
  playerSide,
  onPlayerSideChange,
}: SetupModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => onTabChange('new')}
          >
            ♟ New Game
          </button>
          <button
            className={`modal-tab ${activeTab === 'load' ? 'active' : ''}`}
            onClick={() => onTabChange('load')}
          >
            📂 Load Game
          </button>
          <button
            className={`modal-tab ${activeTab === 'openings' ? 'active' : ''}`}
            onClick={() => onTabChange('openings')}
          >
            📖 Openings
          </button>
        </div>

        {activeTab === 'new' && (
          <NewGameTab
            playerSide={playerSide}
            onPlayerSideChange={onPlayerSideChange}
            onStartGame={onStartGame}
          />
        )}

        {activeTab === 'load' && (
          <LoadGameTab />
        )}

        {activeTab === 'openings' && (
          <OpeningsTab />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create NewGameTab**

```typescript
// components/NewGameTab.tsx
'use client';

import React from 'react';

interface NewGameTabProps {
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
  onStartGame: () => void;
}

export function NewGameTab({
  playerSide,
  onPlayerSideChange,
  onStartGame,
}: NewGameTabProps) {
  return (
    <div>
      <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '12px' }}>
        Choose your side:
      </p>
      <div className="side-picker">
        <div
          className={`side-option ${playerSide === 'white' ? 'selected' : ''}`}
          onClick={() => onPlayerSideChange('white')}
        >
          <div className="piece">♙</div>
          <div className="label">White</div>
          <div className="desc">Attack First</div>
        </div>
        <div
          className={`side-option ${playerSide === 'black' ? 'selected' : ''}`}
          onClick={() => onPlayerSideChange('black')}
        >
          <div className="piece">♟</div>
          <div className="label">Black</div>
          <div className="desc">Counter Attack</div>
        </div>
      </div>
      <button className="btn-modal-primary" onClick={onStartGame}>
        Start Battle
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create LoadGameTab**

```typescript
// components/LoadGameTab.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { parsePGN, getGamePreview, ParsedGame } from '@/lib/pgn-parser';
import { fetchArchives, fetchGames, Archive, ChessComGame } from '@/lib/chesscom-api';

interface LoadGameTabProps {
  onLoadPGN?: (game: ParsedGame) => void;
  onLoadFEN?: (fen: string) => void;
  onLoadChessCom?: (game: ChessComGame) => void;
}

export function LoadGameTab({ onLoadPGN, onLoadFEN, onLoadChessCom }: LoadGameTabProps) {
  const [loadSubTab, setLoadSubTab] = useState<'pgn' | 'fen' | 'chesscom'>('pgn');
  
  // PGN state
  const [pgnInput, setPgnInput] = useState('');
  const [pgnError, setPgnError] = useState('');
  const [parsedGames, setParsedGames] = useState<ParsedGame[]>([]);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  
  // FEN state
  const [fenInput, setFenInput] = useState('');
  const [fenError, setFenError] = useState('');
  
  // Chess.com state
  const [chesscomUsername, setChesscomUsername] = useState('');
  const [chesscomArchives, setChesscomArchives] = useState<Archive[]>([]);
  const [chesscomGames, setChesscomGames] = useState<ChessComGame[]>([]);
  const [chesscomLoading, setChesscomLoading] = useState(false);
  const [chesscomError, setChesscomError] = useState('');
  const [chesscomStep, setChesscomStep] = useState<'username' | 'archives' | 'games'>('username');

  const handleParsePGN = useCallback(() => {
    if (parsedGames.length > 0 && onLoadPGN) {
      onLoadPGN(parsedGames[selectedGameIndex]);
      return;
    }
    
    const result = parsePGN(pgnInput);
    if (result.error) {
      setPgnError(result.error);
      return;
    }
    
    setParsedGames(result.games);
    setSelectedGameIndex(0);
    if (result.games.length === 1 && onLoadPGN) {
      onLoadPGN(result.games[0]);
    }
  }, [pgnInput, parsedGames, selectedGameIndex, onLoadPGN]);

  const handleLoadFEN = useCallback(() => {
    if (fenInput.trim() && onLoadFEN) {
      onLoadFEN(fenInput.trim());
    }
  }, [fenInput, onLoadFEN]);

  const handleLoadChessComArchives = useCallback(async () => {
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

  const handleLoadChessComGames = useCallback(async (archive: Archive) => {
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

  const handleLoadChessComGame = useCallback((game: ChessComGame) => {
    if (onLoadChessCom) {
      onLoadChessCom(game);
    }
  }, [onLoadChessCom]);

  return (
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
              onClick={handleParsePGN}
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
              onClick={handleLoadFEN}
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
              />
              {chesscomError && (
                <p style={{ color: '#ef4444', fontSize: '0.85em', marginBottom: '12px' }}>
                  {chesscomError}
                </p>
              )}
              <button
                className="btn-modal-primary"
                disabled={!chesscomUsername.trim() || chesscomLoading}
                onClick={handleLoadChessComArchives}
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
                  <div key={i} className="chesscom-item" onClick={() => handleLoadChessComGames(archive)}>
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
                  <div key={i} className="chesscom-item" onClick={() => handleLoadChessComGame(game)}>
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
  );
}
```

- [ ] **Step 4: Create OpeningsTab**

```typescript
// components/OpeningsTab.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { searchOpenings, filterByFirstMove, OPENINGS } from '@/lib/openings';
import type { Opening } from '@/lib/types';

interface OpeningsTabProps {
  onSelectOpening?: (opening: Opening, mode: 'replay' | 'force') => void;
}

export function OpeningsTab({ onSelectOpening }: OpeningsTabProps) {
  const [openingSearch, setOpeningSearch] = useState('');
  const [openingFilter, setOpeningFilter] = useState('');
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);

  const getFilteredOpenings = useCallback((): Opening[] => {
    if (openingSearch) return searchOpenings(openingSearch);
    if (openingFilter) return filterByFirstMove(openingFilter);
    return OPENINGS;
  }, [openingSearch, openingFilter]);

  return (
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
            onClick={() => onSelectOpening?.(selectedOpening, 'replay')}
          >
            🔄 Replay (Demo)
          </button>
          <button
            className="mode-btn force"
            onClick={() => onSelectOpening?.(selectedOpening, 'force')}
          >
            🔒 Force (Practice)
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/SetupModal.tsx components/NewGameTab.tsx components/LoadGameTab.tsx components/OpeningsTab.tsx
git commit -m "feat: add modal components (SetupModal, NewGameTab, LoadGameTab, OpeningsTab)"
```

---

## Task 8: Create GamePanel Component

**Covers:** [S2]

**Files:**
- Create: `components/GamePanel.tsx`

- [ ] **Step 1: Create GamePanel**

```typescript
// components/GamePanel.tsx
'use client';

import React from 'react';
import { StatusBox } from './StatusBox';
import { MoveHistory } from './MoveHistory';
import type { GameState, EngineResult } from '@/lib/types';

interface GamePanelProps {
  gameStarted: boolean;
  gameState: GameState;
  engineResult: EngineResult | null;
  isEngineLoading: boolean;
  statusText: string;
  isThinking: boolean;
  isUserTurn: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
  onNewGame: () => void;
}

export function GamePanel({
  gameStarted,
  gameState,
  engineResult,
  isEngineLoading,
  statusText,
  isThinking,
  isUserTurn,
  explanation,
  showExplanation,
  actionButtonText,
  showActionButton,
  onAction,
  onNewGame,
}: GamePanelProps) {
  if (!gameStarted) {
    return null;
  }

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
        isUserTurn={isUserTurn}
        explanation={explanation}
        showExplanation={showExplanation}
        actionButtonText={actionButtonText}
        showActionButton={showActionButton}
        onAction={onAction}
      />

      <div className="history-header">
        <h4>Move History</h4>
        {gameState.chess && gameState.chess.history().length > 0 && (
          <button className="btn-small" onClick={onAction} title="Undo Error">
            ⏪ Step Back
          </button>
        )}
      </div>

      <div id="history-wrapper">
        <MoveHistory moves={gameState.chess?.history() ?? []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/GamePanel.tsx
git commit -m "feat: add GamePanel component"
```

---

## Task 9: Refactor page.tsx

**Covers:** [S1, S2, S3]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx to use new components**

```typescript
// app/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useChessGame } from '@/hooks/useChessGame';
import { useEngine } from '@/hooks/useEngine';
import { useBoardInteraction } from '@/hooks/useBoardInteraction';
import { Board } from '@/components/Board';
import { GamePanel } from '@/components/GamePanel';
import { SetupModal } from '@/components/SetupModal';
import { Toast } from '@/components/Toast';
import { generateExplanation } from '@/lib/explanations';
import type { Opening, ParsedGame, ChessComGame } from '@/lib/types';

export default function Home() {
  const game = useChessGame();
  const engine = useEngine();
  const board = useBoardInteraction();
  
  const [modalOpen, setModalOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'load' | 'openings'>('new');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'warning' | 'error' | ''>('');
  const [statusText, setStatusText] = useState('Preparing the board...');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [actionButtonText, setActionButtonText] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'warning' | 'error' | '' = '') => {
    setToastMessage(message);
    setToastType(type);
  }, []);

  const updateStatusUI = useCallback((systemMove: any = null, serverExplanation?: string) => {
    if (game.getTurn() === game.oppColor) {
      if (systemMove) {
        setStatusText(`🔥 System Played: <b style="color:#e11d48">${systemMove.san}</b><br><br>👉 CLICK opponent's piece to match move.`);
        setExplanation(serverExplanation || generateExplanation(systemMove));
        setActionButtonText("🔄 Undo System Move & Play Manually");
      } else {
        setStatusText("👉 Waiting for opponent's move...");
        setExplanation(null);
        setActionButtonText(null);
      }
    } else {
      setStatusText("⏳ Thinking...");
      setExplanation(null);
      setActionButtonText(null);
    }
  }, [game]);

  const handleGameOver = useCallback(() => {
    board.clearSelection();
    if (game.isCheckmate()) {
      setStatusText(game.getTurn() === game.myColor ? "💀 CHECKMATE. You lost." : "🏆 BOOOM! CHECKMATE! You won!");
    } else {
      setStatusText("🤝 Game Over - Draw!");
    }
  }, [game, board]);

  const startEngineCalculation = useCallback(async () => {
    setStatusText('🧠 Calculating lethal move...');
    
    const result = await engine.calculateBestMove(game.getFen(), 3);
    
    if (result) {
      const move = game.makeMove(result.san.substring(0, 2), result.san.substring(2, 4));
      if (move) {
        board.setLastMove({ from: move.from, to: move.to });
        
        if (game.isGameOver()) {
          handleGameOver();
        } else {
          updateStatusUI(move, result.explanation);
        }
      }
    }
  }, [game, engine, board, handleGameOver, updateStatusUI]);

  const handleSquareClick = useCallback((square: string) => {
    if (!game.chess || game.isGameOver()) return;
    
    const piece = game.chess.get(square);
    
    if (!board.selectedSquare) {
      if (!piece || piece.color !== game.getTurn()) return;
      
      board.selectSquare(square);
      const moves = game.chess.moves({ square, verbose: true });
      board.setLegalMoves(moves.map((m: any) => m.to));
    } else {
      if (square === board.selectedSquare) {
        board.clearSelection();
        return;
      }
      
      if (piece && piece.color === game.getTurn()) {
        board.clearSelection();
        board.selectSquare(square);
        const moves = game.chess.moves({ square, verbose: true });
        board.setLegalMoves(moves.map((m: any) => m.to));
        return;
      }
      
      const move = game.makeMove(board.selectedSquare, square);
      board.clearSelection();
      
      if (move) {
        board.setLastMove({ from: move.from, to: move.to });
        
        if (game.isGameOver()) {
          handleGameOver();
        } else if (game.getTurn() === game.myColor) {
          startEngineCalculation();
        } else {
          updateStatusUI(move, generateExplanation(move));
        }
      }
    }
  }, [game, board, handleGameOver, startEngineCalculation, updateStatusUI]);

  const stepBack = useCallback(() => {
    game.undoMove();
    board.clearSelection();
    board.setLastMove(null);
    
    if (game.getTurn() === game.myColor) {
      setStatusText("⏸️ System Paused. Play manually or let AI decide.");
      setActionButtonText("🧠 Let AI Calculate");
    } else {
      setStatusText("👉 Waiting for opponent's correct move...");
      setActionButtonText(null);
    }
  }, [game, board]);

  const startGame = useCallback(() => {
    game.startGame(game.playerSide);
    setModalOpen(false);
    updateStatusUI();
    
    if (game.myColor === 'w') {
      startEngineCalculation();
    }
  }, [game, updateStatusUI, startEngineCalculation]);

  const handleLoadPGN = useCallback((parsedGame: ParsedGame) => {
    game.loadFromPGN(parsedGame.moves.join(' '));
    setModalOpen(false);
    updateStatusUI();
  }, [game, updateStatusUI]);

  const handleLoadFEN = useCallback((fen: string) => {
    game.loadFromFEN(fen);
    setModalOpen(false);
    updateStatusUI();
  }, [game, updateStatusUI]);

  const handleLoadChessCom = useCallback((chessComGame: ChessComGame) => {
    const result = game.loadFromPGN(chessComGame.pgn);
    if (result) {
      setModalOpen(false);
      updateStatusUI();
    }
  }, [game, updateStatusUI]);

  const handleSelectOpening = useCallback((opening: Opening, mode: 'replay' | 'force') => {
    game.startGame(game.playerSide);
    game.setOpeningMode(mode);
    game.setSelectedOpening(opening);
    setModalOpen(false);
    
    if (mode === 'replay') {
      // Auto-play opening moves
      let moveIndex = 0;
      const replayNextMove = () => {
        if (moveIndex >= opening.moves.length) {
          game.setOpeningMode(null);
          updateStatusUI();
          return;
        }
        const move = game.makeMove(
          opening.moves[moveIndex].substring(0, 2),
          opening.moves[moveIndex].substring(2, 4)
        );
        if (move) {
          board.setLastMove({ from: move.from, to: move.to });
          moveIndex++;
          setTimeout(replayNextMove, 800);
        }
      };
      setTimeout(replayNextMove, 500);
    } else {
      showToast(`Practice mode: Play ${opening.moves[0]}`, 'warning');
    }
  }, [game, board, updateStatusUI, showToast]);

  useEffect(() => {
    if (game.gameStarted) {
      updateStatusUI();
    }
  }, [game.gameStarted]);

  return (
    <div className="main-wrapper">
      <div className="left-panel">
        <h2>♟️ Chess Assistant <span style={{ color: '#e11d48' }}>PRO</span></h2>
        <div id="board-container">
          <Board
            fen={game.chess?.fen() ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'}
            orientation={game.playerSide}
            selectedSquare={board.selectedSquare}
            legalMoves={board.legalMoves}
            lastMove={board.lastMove}
            onSquareClick={handleSquareClick}
          />
        </div>
      </div>

      <div className="right-panel">
        {!game.gameStarted ? (
          <div id="setup-section">
            <label style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '5px', display: 'block' }}>
              Choose your side:
            </label>
            <select
              value={game.playerSide}
              onChange={(e) => {
                game.startGame(e.target.value as 'white' | 'black');
              }}
            >
              <option value="white">White ♙ (Attack First)</option>
              <option value="black">Black ♟ (Counter Attack)</option>
            </select>
            <button className="btn-primary" onClick={startGame}>Start Battle</button>
          </div>
        ) : (
          <GamePanel
            gameStarted={game.gameStarted}
            gameState={game}
            engineResult={engine.lastResult}
            isEngineLoading={engine.loading}
            statusText={statusText}
            isThinking={engine.loading}
            isUserTurn={game.getTurn() === game.myColor}
            explanation={explanation}
            showExplanation={!!explanation}
            actionButtonText={actionButtonText}
            showActionButton={!!actionButtonText}
            onAction={stepBack}
            onNewGame={() => setModalOpen(true)}
          />
        )}
      </div>

      <SetupModal
        isOpen={modalOpen}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onClose={() => setModalOpen(false)}
        onStartGame={startGame}
        playerSide={game.playerSide}
        onPlayerSideChange={(side) => game.startGame(side)}
      />

      <Toast message={toastMessage} type={toastType} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: rewrite page.tsx to use new component architecture"
```

---

## Task 10: Remove jQuery/chessboard.js

**Covers:** [S1, S4]

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Remove CDN scripts from layout.tsx**

```typescript
// app/layout.tsx — remove these Script tags:
// <Script src="https://code.jquery.com/jquery-3.5.1.min.js" />
// <Script src="https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js" />
// <Script src="https://unpkg.com/chess.js@0.10.3/chess.js" />
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "chore: remove jQuery and chessboard.js CDN dependencies"
```

---

## Task 11: Add Bun Test Configuration

**Covers:** [S6]

**Files:**
- Create: `bunfig.toml`
- Modify: `package.json`

- [ ] **Step 1: Create bunfig.toml**

```toml
# bunfig.toml
[test]
preload = ["./test-setup.ts"]
```

- [ ] **Step 2: Create test-setup.ts**

```typescript
// test-setup.ts
import { cleanup } from '@testing-library/react';
import { afterEach } from 'bun:test';

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 3: Add test script to package.json**

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

- [ ] **Step 4: Install testing dependencies**

Run: `bun add -d @testing-library/react @testing-library/jest-dom`
Expected: Success

- [ ] **Step 5: Run all tests**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add bunfig.toml test-setup.ts package.json
git commit -m "chore: add Bun test configuration and dependencies"
```

---

## Task 12: Final Verification

**Covers:** [S1, S2, S3, S4, S5, S6]

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run all tests**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Start dev server and manual test**

Run: `npm run dev`
Verify:
- Board renders with pieces
- Click to select piece shows legal moves
- Click to move works
- Engine calculates and shows best move
- Arabic explanation appears
- Move history updates
- Step Back button works
- New Game modal opens
- PGN/FEN loading works
- Chess.com integration works
- Opening browser works

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete chess app restructure — modular components, TypeScript, no jQuery"
```
