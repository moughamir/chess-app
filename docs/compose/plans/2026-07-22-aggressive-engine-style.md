# Aggressive Engine Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Engine plays more aggressively when style is set to "Aggressive".

**Architecture:** Add `engineStyle` parameter to API, modify evaluation function to prioritize attacks in aggressive mode.

**Tech Stack:** TypeScript, chess.js, existing minimax engine

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/engine.ts` | Modify | Add style parameter to evaluateBoard |
| `app/api/engine/route.ts` | Modify | Accept style parameter |
| `components/NewGameTab.tsx` | Modify | Add style selector UI |
| `app/page.tsx` | Modify | Pass style to engine |

---

### Task 1: Add Style Parameter to Engine

**Covers:** [S2]

**Files:**
- Modify: `lib/engine.ts`

- [ ] **Step 1: Add EngineStyle type**

```typescript
// Add to lib/engine.ts
export type EngineStyle = 'balanced' | 'aggressive';
```

- [ ] **Step 2: Add style parameter to evaluateBoard**

```typescript
// Update evaluateBoard signature
function evaluateBoard(board: any, style: EngineStyle = 'balanced'): number {
  let score = 0;
  
  // Base piece values
  const pieceValues: Record<string, number> = {
    p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000
  };
  
  // Count material
  for (const square of board.squares()) {
    const piece = board.get(square);
    if (piece) {
      const value = pieceValues[piece.type] || 0;
      score += piece.color === 'w' ? value : -value;
    }
  }
  
  // Aggressive style bonuses
  if (style === 'aggressive') {
    // Increase value of center control
    // Increase value of piece activity
    // Increase value of king attacks
    score = applyAggressiveBonuses(board, score);
  }
  
  return score;
}
```

- [ ] **Step 3: Add applyAggressiveBonuses function**

```typescript
// Add to lib/engine.ts
function applyAggressiveBonuses(board: any, baseScore: number): number {
  let bonus = 0;
  
  // Center control bonus (d4, d5, e4, e5)
  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  for (const square of centerSquares) {
    const piece = board.get(square);
    if (piece) {
      bonus += piece.color === 'w' ? 15 : -15;
    }
  }
  
  // Piece activity bonus (more pieces developed = more bonus)
  // King safety threats bonus
  
  return baseScore + bonus;
}
```

- [ ] **Step 4: Update getBestMove to accept style**

```typescript
// Update getBestMove signature
export function getBestMove(fen: string, depth: number, style: EngineStyle = 'balanced'): { bestMove: string; san: string; evaluation: number; depth: number; nodes: number; timeMs: number } {
  // Pass style to evaluateBoard
}
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add lib/engine.ts
git commit -m "feat: add engine style parameter"
```

---

### Task 2: Update API Route

**Covers:** [S2]

**Files:**
- Modify: `app/api/engine/route.ts`

- [ ] **Step 1: Accept style parameter**

```typescript
// In POST handler
const { fen, depth = 3, timeMs = 5000, style = 'balanced' } = await request.json();
```

- [ ] **Step 2: Pass style to getBestMove**

```typescript
// Update getBestMove call
const result = getBestMove(fen, depth, style);
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add app/api/engine/route.ts
git commit -m "feat: pass style to engine API"
```

---

### Task 3: Add Style Selector UI

**Covers:** [S2]

**Files:**
- Modify: `components/NewGameTab.tsx`

- [ ] **Step 1: Add style state**

```typescript
// Add to NewGameTabProps
interface NewGameTabProps {
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
  onStartGame: () => void;
  engineStyle: 'balanced' | 'aggressive';
  onEngineStyleChange: (style: 'balanced' | 'aggressive') => void;
}
```

- [ ] **Step 2: Add style selector UI**

```tsx
// Add after side picker
<div className="style-picker">
  <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '12px' }}>
    Engine style:
  </p>
  <div className="style-options">
    <div
      className={`style-option ${engineStyle === 'balanced' ? 'selected' : ''}`}
      onClick={() => onEngineStyleChange('balanced')}
    >
      <div className="label">Balanced</div>
      <div className="desc">Standard play</div>
    </div>
    <div
      className={`style-option ${engineStyle === 'aggressive' ? 'selected' : ''}`}
      onClick={() => onEngineStyleChange('aggressive')}
    >
      <div className="label">Aggressive</div>
      <div className="desc">Attack-focused</div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add CSS for style picker**

```css
/* Add to app/globals.css */
.style-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.style-option {
  flex: 1;
  padding: 12px;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.style-option:hover {
  border-color: #666;
}

.style-option.selected {
  border-color: #e11d48;
  background: rgba(225, 29, 72, 0.1);
}

.style-option .label {
  font-weight: bold;
  margin-bottom: 4px;
}

.style-option .desc {
  color: #a1a1aa;
  font-size: 0.8em;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add components/NewGameTab.tsx app/globals.css
git commit -m "feat: add engine style selector UI"
```

---

### Task 4: Wire Up Style to Engine

**Covers:** [S2]

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add engineStyle state**

```typescript
// Add to page.tsx state
const [engineStyle, setEngineStyle] = useState<'balanced' | 'aggressive'>('balanced');
```

- [ ] **Step 2: Pass style to engine calculation**

```typescript
// Update startEngineCalculation
const startEngineCalculation = useCallback(async () => {
  const chess = game.chess;
  if (!chess) return;

  setStatusText('🧠 Calculating lethal move...');
  setExplanation(null);
  setActionButtonText(null);
  expectingEngineResult.current = true;

  await engine.calculateBestMove(chess.fen(), 3, engineStyle);
}, [game.chess, engine.calculateBestMove, engineStyle]);
```

- [ ] **Step 3: Pass style to SetupModal**

```typescript
// Update SetupModal usage
<SetupModal
  // ... existing props
  engineStyle={engineStyle}
  onEngineStyleChange={setEngineStyle}
/>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire engine style to page"
```

---

### Task 5: Test Aggressive Mode

**Covers:** [S2]

**Files:**
- None (verification only)

- [ ] **Step 1: Run all tests**

Run: `bun test`
Expected: All tests pass

- [ ] **Step 2: Start dev server and test manually**

Run: `npm run dev`
Manual test:
1. Start a new game with "Aggressive" style
2. Play a few moves
3. Click "Let AI Calculate"
4. Verify engine makes aggressive moves (prioritizes attacks)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: aggressive engine style complete"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add style parameter to engine | `lib/engine.ts` |
| 2 | Update API route | `app/api/engine/route.ts` |
| 3 | Add style selector UI | `components/NewGameTab.tsx` |
| 4 | Wire up style to engine | `app/page.tsx` |
| 5 | Test aggressive mode | All |
