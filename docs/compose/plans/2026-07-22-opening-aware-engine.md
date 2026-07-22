# Opening-Aware Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Engine checks opening book first, falls back to minimax if position is unknown.

**Architecture:** Add `getBookMove(fen)` function to `lib/engine.ts` that matches FEN positions against known openings. API route checks book before calling minimax.

**Tech Stack:** TypeScript, chess.js, existing minimax engine

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/openings.ts` | Modify | Add FEN-to-position lookup |
| `lib/engine.ts` | Modify | Add `getBookMove(fen)` function |
| `app/api/engine/route.ts` | Modify | Check book before minimax |

---

### Task 1: Add FEN Lookup to Openings

**Covers:** [S1]

**Files:**
- Modify: `lib/openings.ts`

- [ ] **Step 1: Add positionToFen function**

```typescript
// Add to lib/openings.ts

export function positionToFen(moves: string[]): string {
  // Convert move list to FEN position
  // This is a simplified version - full implementation in commit
  return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
}
```

- [ ] **Step 2: Add getBookMove function**

```typescript
// Add to lib/openings.ts

export function getBookMove(fen: string): { move: string; opening: string } | null {
  // Match FEN against known opening positions
  // Return next move if found, null otherwise
  for (const opening of OPENINGS) {
    const openingFen = positionToFen(opening.moves);
    if (normalizeFen(fen) === normalizeFen(openingFen)) {
      const nextMoveIndex = opening.moves.length;
      if (nextMoveIndex < opening.moves.length) {
        return { move: opening.moves[nextMoveIndex], opening: opening.name };
      }
    }
  }
  return null;
}
```

- [ ] **Step 3: Add normalizeFen helper**

```typescript
// Add to lib/openings.ts

function normalizeFen(fen: string): string {
  // Remove move numbers and normalize whitespace
  return fen.replace(/\s+\d+\s+\d+\s*$/, '').trim();
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add lib/openings.ts
git commit -m "feat: add FEN lookup to openings"
```

---

### Task 2: Add getBookMove to Engine

**Covers:** [S1]

**Files:**
- Modify: `lib/engine.ts`

- [ ] **Step 1: Import getBookMove from openings**

```typescript
// Add to imports in lib/engine.ts
import { getBookMove } from './openings';
```

- [ ] **Step 2: Export getBookMove from engine**

```typescript
// Add to lib/engine.ts exports
export { getBookMove } from './openings';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add lib/engine.ts
git commit -m "feat: export getBookMove from engine"
```

---

### Task 3: Update API Route to Use Book

**Covers:** [S1]

**Files:**
- Modify: `app/api/engine/route.ts`

- [ ] **Step 1: Import getBookMove**

```typescript
// Add to imports in app/api/engine/route.ts
import { getBookMove } from '@/lib/engine';
```

- [ ] **Step 2: Check book before minimax**

```typescript
// In POST handler, before calling minimax
const bookResult = getBookMove(fen);
if (bookResult) {
  return Response.json({
    bestMove: bookResult.move,
    san: bookResult.move,
    explanation: `Opening theory: ${bookResult.opening}`,
    evaluation: 0,
    depth: 0,
    nodes: 0,
    timeMs: 0,
    engine: 'book',
  });
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/api/engine/route.ts
git commit -m "feat: use opening book in API route"
```

---

### Task 4: Test Opening Book

**Covers:** [S1]

**Files:**
- None (verification only)

- [ ] **Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 2: Start dev server and test manually**

Run: `npm run dev`
Manual test:
1. Start a new game
2. Play 1. e4 e5 2. Nf3
3. Click "Let AI Calculate"
4. Verify engine suggests opening book move (e.g., Nc6 for Ruy Lopez)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: opening-aware engine complete"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add FEN lookup to openings | `lib/openings.ts` |
| 2 | Add getBookMove to engine | `lib/engine.ts` |
| 3 | Update API route | `app/api/engine/route.ts` |
| 4 | Test opening book | All |
