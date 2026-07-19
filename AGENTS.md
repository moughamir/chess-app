<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-19
**Commit:** 7791ee4
**Branch:** master

## OVERVIEW

Chess Assistant Pro — AI-powered chess app with Arabic move explanations, built on Next.js 16 + React 19 + chess.js 0.10.3. Server-side minimax engine with alpha-beta pruning, transposition table, iterative deepening, and killer move heuristic.

## STRUCTURE

```
./
├── app/               # Next.js App Router (layout, page, API route)
├── app/api/engine/    # POST endpoint: FEN → best move + explanation
├── lib/               # Chess engine + constants + explanation generator
└── public/            # Static assets (SVGs, favicon)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| App UI & board interaction | `app/page.tsx` | 425-line client component; relies on global jQuery/chessboard.js |
| Root layout & CDN deps | `app/layout.tsx` | Loads jQuery, chessboard.js, chess.js from CDN |
| API endpoint | `app/api/engine/route.ts` | POST accepts `fen`, `depth`, `timeMs` |
| Chess AI engine | `lib/engine.ts` | Minimax + alpha-beta + TT + killer moves + history heuristic |
| Constants & Zobrist keys | `lib/constants.ts` | Piece values (p=100..k=20000), center squares, Zobrist init |
| Move explanations (Arabic) | `lib/explanations.ts` | Generate Arabic-language philosophy for each move type |
| CSS | `app/globals.css` | Dark theme, responsive, custom scrollbars, animations |

## CONVENTIONS

- **TypeScript strict mode** enabled (`tsconfig.json`, `strict: true`)
- **Path alias**: `@/*` maps to project root
- **Imports**: No barrel files — direct imports from `'@/lib/...'`
- **CSS**: Global stylesheet only (no CSS modules, no Tailwind)
- **No linting/formatting config** — ESLint, Prettier not set up
- **No test framework** — zero tests exist

## ANTI-PATTERNS (THIS PROJECT)

- **Pervasive `any` types**: `page.tsx` declares global `Window` extensions with `any`; refs typed `any`; engine has `any` parameters. Avoid adding more — prefer proper types.
- **`dangerouslySetInnerHTML` x4**: Used in `page.tsx` for status text, explanations, action buttons, history. XSS vector if any content becomes user-influenced.
- **CDN dependencies**: jQuery 3.5.1, chessboard.js, chess.js 0.10.3 loaded via `<Script>` tags in layout. No SRI hashes. CDN availability is a runtime dependency.
- **No test coverage**: No tests for engine (minimax, TT, evaluation heuristics), API route, or UI interactions.
- **Zobrist keys non-deterministic**: `initZobristKeys()` uses `Math.random()` at module load — transposition table differs per cold start.
- **Dual chess.js**: npm dependency (server-side engine + API) + CDN script (client-side board). Potential version drift.
- **Engine on serverless**: CPU-intensive minimax runs in Vercel serverless function (10s timeout on hobby plan). Time budget (`timeMs`, default 5000ms) respects this but depth may be limited.

## UNIQUE STYLES

- **Arabic explanations**: Move analysis rendered in Darija (Moroccan Arabic) with chess idiom translations (♔ = الملك, ♜ = القلعة/الرخ, ♞ = الحصان, ♝ = الفيل)
- **Hybrid interaction**: User clicks squares (not drag-drop) to move. Opponent moves simulated by clicking matching piece after AI shows target.
- **Chessboard.js + jQuery**: Board rendering relies on `@chrisoakman/chessboardjs` with jQuery event delegation. Not React-controlled — jQuery handles click events on `.square-55d63` elements.

## COMMANDS

```bash
npm run dev     # Start dev server (Turbopack)
npm run build   # Production build
npm run start   # Start production server
```

## NOTES

- **Next.js 16 breaking changes**: Read `node_modules/next/dist/docs/` before editing any config or app files.
- API route expects: `{ fen: string, depth?: number, timeMs?: number }` — returns `{ bestMove, san, explanation, evaluation, depth }`.
- Board orientation flips based on player side selection (White attacks first / Black counter-attacks).
- Step Back button undoes last move pair. "Let AI Calculate" re-engages engine on user's turn.
