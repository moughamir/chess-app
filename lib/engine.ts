import { Chess, ChessInstance } from 'chess.js';
import { PIECE_VALUES, ZOBRIST_KEYS } from './constants';

const TT_SIZE = 1 << 20;
const TT_MASK = TT_SIZE - 1;

enum TTFlag { EXACT, LOWER, UPPER }

interface TTEntry {
  key: number;
  depth: number;
  value: number;
  flag: TTFlag;
  bestMove: string | null;
}

const tt: TTEntry[] = new Array(TT_SIZE);

export function clearTT(): void {
  tt.fill(undefined as any);
}

const CENTER_MASK = (1 << 27) | (1 << 28) | (1 << 35) | (1 << 36);

function computeHash(game: ChessInstance): bigint {
  let hash = BigInt(0);
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const pIdx = 'pnbrqk'.indexOf(piece.type);
        const cIdx = piece.color === 'w' ? 0 : 1;
        const sq = r * 8 + c;
        hash ^= ZOBRIST_KEYS[cIdx][pIdx][sq];
      }
    }
  }

  if (game.turn() === 'b') hash ^= BigInt(1) << BigInt(640);
  return hash;
}

function ttIndex(hash: bigint): number {
  return Number(hash & BigInt(TT_MASK));
}

export function evaluateBoard(game: ChessInstance, myColor: string): number {
  let totalEvaluation = 0;
  const b = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (b[i][j]) {
        const piece = b[i][j]!;
        let val = PIECE_VALUES[piece.type];
        if (CENTER_MASK & (1 << (i * 8 + j))) val += 30;
        totalEvaluation += piece.color === myColor ? val : -val;
      }
    }
  }

  const availableMoves = game.moves().length;
  const oppColor = myColor === 'w' ? 'b' : 'w';
  if (game.turn() === oppColor) {
    totalEvaluation += (100 - availableMoves) * 0.5;
  } else {
    totalEvaluation -= (100 - availableMoves) * 0.5;
  }

  if (game.in_checkmate()) {
    return game.turn() === oppColor ? 10000 : -10000;
  } else if (game.in_check()) {
    totalEvaluation += game.turn() === oppColor ? 50 : -50;
  }

  return totalEvaluation;
}

interface MoveScore {
  killers: (string | null)[][];
  historyTable: Record<string, number>;
}

export function createMoveScore(maxDepth: number = 8): MoveScore {
  const killers: (string | null)[][] = [];
  for (let i = 0; i < maxDepth; i++) killers.push([null, null]);
  return { killers, historyTable: {} };
}

function isCheck(move: any, game: ChessInstance): boolean {
  const CHECK_FLAGS = 'pnbrqk'.includes(move.piece) && (move.san.includes('+') || move.san.includes('#'));
  return move.san.endsWith('+') || move.san.endsWith('#');
}

function isMate(move: any): boolean {
  return move.san.endsWith('#');
}

export function scoreMove(
  move: any,
  depth: number,
  state: MoveScore
): number {
  let score = 0;

  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured];
    const attackerVal = PIECE_VALUES[move.piece];
    score = 10000 + victimVal - attackerVal / 10;
  }

  if (move.san.endsWith('#')) score += 20000;
  else if (move.san.endsWith('+')) score += 5000;

  if (move.promotion) score += 8000;

  const killerKey = move.from + move.to;
  if (state.killers[depth]) {
    if (state.killers[depth][0] === killerKey) score += 9000;
    else if (state.killers[depth][1] === killerKey) score += 8500;
  }

  if (state.historyTable[killerKey]) {
    score += Math.min(state.historyTable[killerKey], 8000);
  }

  return score;
}

export function orderMoves(
  game: ChessInstance,
  moves: any[],
  depth: number,
  state: MoveScore
): any[] {
  return [...moves].sort((a, b) => scoreMove(b, depth, state) - scoreMove(a, depth, state));
}

export function minimax(
  game: ChessInstance,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  myColor: string,
  maxDepth: number,
  state: MoveScore
): number {
  if (depth === 0 || game.game_over()) return evaluateBoard(game, myColor);

  const hash = computeHash(game);
  const idx = ttIndex(hash);
  const entry = tt[idx];

  if (entry && entry.key === Number(hash & BigInt(0xFFFFFFFF)) && entry.depth >= depth) {
    if (entry.flag === TTFlag.EXACT) return entry.value;
    if (entry.flag === TTFlag.LOWER && entry.value > alpha) alpha = entry.value;
    if (entry.flag === TTFlag.UPPER && entry.value < beta) beta = entry.value;
    if (alpha >= beta) return entry.value;
  }

  const inCheck = game.in_check();
  const moves = orderMoves(game, game.moves({ verbose: true }), maxDepth - depth, state);
  let bestMove = moves[0]?.san ?? null;
  const origAlpha = alpha;
  const origBeta = beta;
  const extension = inCheck ? 1 : 0;

  for (let i = 0; i < moves.length; i++) {
    game.move(moves[i].san);
    const val = isMaximizing
      ? minimax(game, depth - 1 + extension, alpha, beta, false, myColor, maxDepth, state)
      : minimax(game, depth - 1 + extension, alpha, beta, true, myColor, maxDepth, state);
    game.undo();

    if (isMaximizing) {
      if (val > alpha) {
        alpha = val;
        bestMove = moves[i].san;
      }
    } else {
      if (val < beta) {
        beta = val;
        bestMove = moves[i].san;
      }
    }

    if (beta <= alpha) {
      if (!moves[i].captured) {
        const d = maxDepth - depth;
        if (d < state.killers.length) {
          const key = moves[i].from + moves[i].to;
          if (state.killers[d][0] !== key) {
            state.killers[d][1] = state.killers[d][0];
            state.killers[d][0] = key;
          }
        }
        const hKey = moves[i].from + moves[i].to;
        state.historyTable[hKey] = (state.historyTable[hKey] || 0) + depth * depth;
      }
      break;
    }
  }

  const value = isMaximizing ? alpha : beta;
  let flag: TTFlag;
  if (value <= origAlpha) flag = TTFlag.UPPER;
  else if (value >= origBeta) flag = TTFlag.LOWER;
  else flag = TTFlag.EXACT;

  const storedEntry: TTEntry = {
    key: Number(hash & BigInt(0xFFFFFFFF)),
    depth,
    value,
    flag,
    bestMove,
  };

  if (!entry || depth >= entry.depth) {
    tt[idx] = storedEntry;
  }

  return value;
}

export function getBestMove(fen: string, maxDepth: number, timeMs: number = 5000): { bestMove: any; evaluation: number; depth: number } {
  const game = new Chess(fen);
  const myColor = game.turn();
  const state = createMoveScore(maxDepth);
  clearTT();

  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return { bestMove: null, evaluation: 0, depth: 0 };

  let bestMove = moves[0];
  let bestValue = -Infinity;
  let completedDepth = 0;
  const startTime = Date.now();

  for (let d = 1; d <= maxDepth; d++) {
    if (Date.now() - startTime > timeMs * 0.75) break;

    const ordered = d === 1 ? orderMoves(game, moves, 0, state) : orderMoves(game, game.moves({ verbose: true }), 0, state);
    let iterationBest = null;
    let iterationValue = -Infinity;
    let iterationComplete = true;

    for (let i = 0; i < ordered.length; i++) {
      if (Date.now() - startTime > timeMs * 0.9) { iterationComplete = false; break; }

      game.move(ordered[i].san);
      const val = minimax(game, d - 1, -Infinity, Infinity, false, myColor, d, state);
      game.undo();

      if (val > iterationValue) {
        iterationValue = val;
        iterationBest = ordered[i];
      }
    }

    if (iterationComplete && iterationBest) {
      bestMove = iterationBest;
      bestValue = iterationValue;
      completedDepth = d;
    }

    if (iterationValue > 9000 || iterationValue < -9000) break;
  }

  return { bestMove, evaluation: bestValue, depth: completedDepth };
}
