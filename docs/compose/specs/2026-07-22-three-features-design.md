# Three Features Design Spec

**Date:** 2026-07-22
**Status:** Approved

---

## [S1] Opening-Aware Engine

**Goal:** Engine checks opening book first, falls back to minimax if position is unknown.

**How it works:**
1. Before engine calculates, check if current FEN matches a known opening position
2. If match found: return the next move from the opening book
3. If no match: use existing minimax engine

**Files to modify:**
- `lib/engine.ts` — Add `getBookMove(fen)` function
- `lib/openings.ts` — Add FEN-to-position lookup
- `app/api/engine/route.ts` — Check book before calling minimax

**Implementation:**
```typescript
// lib/engine.ts
export function getBookMove(fen: string): string | null {
  // Parse FEN, match against opening positions
  // Return next move if found, null otherwise
}
```

**Data flow:**
```
POST /api/engine { fen, depth }
  → getBookMove(fen)
  → if book move: return { bestMove, san, explanation: "Opening theory", engine: 'book' }
  → else: use minimax (existing)
```

---

## [S2] Aggressive Engine Style

**Goal:** Engine plays more aggressively when style is set to "Aggressive".

**How it works:**
1. Add `engineStyle` parameter to API: `'balanced' | 'aggressive'`
2. Modify evaluation function to prioritize attacks
3. Aggressive mode: increase value of piece attacks, center control, king safety threats

**Files to modify:**
- `lib/engine.ts` — Modify `evaluateBoard()` to accept style parameter
- `app/api/engine/route.ts` — Accept `style` parameter
- `components/SetupModal.tsx` — Add style selector in NewGameTab

**Evaluation changes for aggressive mode:**
```typescript
// Aggressive: prioritize attacks
if (style === 'aggressive') {
  // Increase value of captures
  // Increase value of center control
  // Increase value of king attacks
  // Decrease value of passive moves
}
```

**UI:**
- NewGameTab gets a style selector: Balanced / Aggressive
- Style persists for the game session

---

## [S3] Custom Position Editor

**Goal:** Allow users to set up custom positions by dragging/clicking pieces, then choose which color plays next.

**How it works:**
1. New "Setup" tab in SetupModal
2. Empty board with piece palette on the side
3. Drag pieces from palette to board, or click to place/remove
4. After position is set, choose which color plays next
5. Convert position to FEN and start game

**Files to create:**
- `components/PositionEditor.tsx` — New component

**Files to modify:**
- `components/SetupModal.tsx` — Add "Setup" tab
- `app/page.tsx` — Handle position editor flow

**UI Layout:**
```
┌─────────────────────────────────────┐
│ [New Game] [Load] [Openings] [Setup]│
├─────────────────────────────────────┤
│                                     │
│   ┌─────────┐  ┌─────────────────┐  │
│   │  ♙ ♙ ♙  │  │                 │  │
│   │  ♙ ♙ ♙  │  │   Chess Board   │  │
│   │  ♙ ♙ ♙  │  │   (empty)       │  │
│   │         │  │                 │  │
│   │  ♟ ♟ ♟  │  │                 │  │
│   │  ♟ ♟ ♟  │  │                 │  │
│   └─────────┘  └─────────────────┘  │
│   Piece Palette                     │
│                                     │
│   Who plays next?                   │
│   [White] [Black]                   │
│                                     │
│   [Start Game]                      │
└─────────────────────────────────────┘
```

**Interaction:**
- Click palette piece → click board square to place
- Click placed piece → remove it
- Drag palette piece → drop on board
- Drag placed piece → move it
- Right-click → remove piece
