import { Chess, ChessInstance } from 'chess.js';
import { PIECE_VALUES, ZOBRIST_KEYS } from './constants';

const TT_SIZE = 1 << 20;
const TT_MASK = TT_SIZE - 1;

enum TTFlag { EXACT, LOWER, UPPER }

interface TTEntry {
  keyLow: number;
  keyHigh: number;
  depth: number;
  value: number;
  flag: TTFlag;
  bestMove: string | null;
}

const tt: TTEntry[] = new Array(TT_SIZE);
const ttKeyLow: Int32Array = new Int32Array(TT_SIZE);
const ttKeyHigh: Int32Array = new Int32Array(TT_SIZE);
const ttDepth: Int8Array = new Int8Array(TT_SIZE);
const ttValue: Int32Array = new Int32Array(TT_SIZE);
const ttFlag: Uint8Array = new Uint8Array(TT_SIZE);
const ttBestMoveArr: (string | null)[] = new Array(TT_SIZE);

export function clearTT(): void {
  ttKeyLow.fill(0);
  ttKeyHigh.fill(0);
  ttDepth.fill(0);
  ttValue.fill(0);
  ttFlag.fill(0);
  ttBestMoveArr.fill(null);
}

const CENTER_MASK = (1 << 27) | (1 << 28) | (1 << 35) | (1 << 36);
const ZOBRIST_SIDE = BigInt(1) << BigInt(640);

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

  if (game.turn() === 'b') hash ^= ZOBRIST_SIDE;
  return hash;
}

function ttIndex(hash: bigint): number {
  return Number(hash & BigInt(TT_MASK));
}

function ttSplitHash(hash: bigint): [number, number] {
  const lo = Number(hash & BigInt(0xFFFFFFFF));
  const hi = Number((hash >> BigInt(32)) & BigInt(0xFFFFFFFF));
  return [lo, hi];
}

function ttRead(hash: bigint): { found: boolean; depth: number; value: number; flag: TTFlag; bestMove: string | null } {
  const idx = ttIndex(hash);
  const [lo, hi] = ttSplitHash(hash);
  if (ttKeyLow[idx] === lo && ttKeyHigh[idx] === hi) {
    return {
      found: true,
      depth: ttDepth[idx],
      value: ttValue[idx],
      flag: ttFlag[idx] as TTFlag,
      bestMove: ttBestMoveArr[idx],
    };
  }
  return { found: false, depth: 0, value: 0, flag: TTFlag.EXACT, bestMove: null };
}

function ttWrite(hash: bigint, depth: number, value: number, flag: TTFlag, bestMove: string | null): void {
  const idx = ttIndex(hash);
  const [lo, hi] = ttSplitHash(hash);
  if (!ttKeyLow[idx] || depth >= ttDepth[idx]) {
    ttKeyLow[idx] = lo;
    ttKeyHigh[idx] = hi;
    ttDepth[idx] = depth;
    ttValue[idx] = value;
    ttFlag[idx] = flag;
    ttBestMoveArr[idx] = bestMove;
  }
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

  if (game.in_checkmate()) {
    return game.turn() === myColor ? -10000 : 10000;
  } else if (game.in_check()) {
    totalEvaluation += game.turn() === myColor ? -50 : 50;
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

function scoreMove(
  move: any,
  depth: number,
  state: MoveScore,
  ttBestMove: string | null
): number {
  const key = move.from + move.to;

  if (ttBestMove && key === ttBestMove) return 100000;

  let score = 0;

  if (move.captured) {
    const victimVal = PIECE_VALUES[move.captured];
    const attackerVal = PIECE_VALUES[move.piece];
    score = 10000 + victimVal - attackerVal / 10;
  }

  if (move.san.endsWith('#')) score += 20000;
  else if (move.san.endsWith('+')) score += 5000;

  if (move.promotion) score += 8000;

  if (state.killers[depth]) {
    if (state.killers[depth][0] === key) score += 9000;
    else if (state.killers[depth][1] === key) score += 8500;
  }

  if (state.historyTable[key]) {
    score += Math.min(state.historyTable[key], 8000);
  }

  return score;
}

function orderMoves(
  moves: any[],
  depth: number,
  state: MoveScore,
  ttBestMove: string | null
): any[] {
  return [...moves].sort((a, b) => scoreMove(b, depth, state, ttBestMove) - scoreMove(a, depth, state, ttBestMove));
}

function applyIncrementalHash(hash: bigint, move: any, game: ChessInstance): bigint {
  const colorIdx = move.color === 'w' ? 0 : 1;
  const pieceIdx = 'pnbrqk'.indexOf(move.piece);
  const fromSq = 'abcdefgh'.indexOf(move.from[0]) + (8 - parseInt(move.from[1])) * 8;
  const toSq = 'abcdefgh'.indexOf(move.to[0]) + (8 - parseInt(move.to[1])) * 8;

  hash ^= ZOBRIST_KEYS[colorIdx][pieceIdx][fromSq];
  hash ^= ZOBRIST_KEYS[colorIdx][pieceIdx][toSq];

  if (move.captured) {
    const capIdx = 'pnbrqk'.indexOf(move.captured);
    hash ^= ZOBRIST_KEYS[1 - colorIdx][capIdx][toSq];
  }

  if (move.promotion) {
    const promoIdx = 'pnbrqk'.indexOf(move.promotion);
    hash ^= ZOBRIST_KEYS[colorIdx]['p'.charCodeAt(0) - 'p'.charCodeAt(0)][toSq];
    hash ^= ZOBRIST_KEYS[colorIdx][promoIdx][toSq];
  }

  if (move.flags.includes('e')) {
    const epSq = toSq + (move.color === 'w' ? 8 : -8);
    hash ^= ZOBRIST_KEYS[1 - colorIdx][0][epSq];
  }

  if (move.flags.includes('k')) {
    const rookFrom = move.color === 'w' ? 63 : 61;
    const rookTo = move.color === 'w' ? 61 : 63;
    const rookIdx = 'r'.charCodeAt(0) - 'p'.charCodeAt(0);
    hash ^= ZOBRIST_KEYS[colorIdx][rookIdx][rookFrom];
    hash ^= ZOBRIST_KEYS[colorIdx][rookIdx][rookTo];
  }

  if (move.flags.includes('q')) {
    const rookFrom = move.color === 'w' ? 56 : 59;
    const rookTo = move.color === 'w' ? 59 : 56;
    const rookIdx = 'r'.charCodeAt(0) - 'p'.charCodeAt(0);
    hash ^= ZOBRIST_KEYS[colorIdx][rookIdx][rookFrom];
    hash ^= ZOBRIST_KEYS[colorIdx][rookIdx][rookTo];
  }

  hash ^= ZOBRIST_SIDE;
  return hash;
}

export function minimax(
  game: ChessInstance,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  myColor: string,
  maxDepth: number,
  state: MoveScore,
  hash: bigint
): number {
  if (depth === 0 || game.game_over()) return evaluateBoard(game, myColor);

  const ttHit = ttRead(hash);

  if (ttHit.found && ttHit.depth >= depth) {
    if (ttHit.flag === TTFlag.EXACT) return ttHit.value;
    if (ttHit.flag === TTFlag.LOWER && ttHit.value > alpha) alpha = ttHit.value;
    if (ttHit.flag === TTFlag.UPPER && ttHit.value < beta) beta = ttHit.value;
    if (alpha >= beta) return ttHit.value;
  }

  const inCheck = game.in_check();
  const moves = game.moves({ verbose: true });
  const ordered = orderMoves(moves, maxDepth - depth, state, ttHit.bestMove);
  let bestMove = ordered[0]?.san ?? null;
  const origAlpha = alpha;
  const origBeta = beta;
  const extension = inCheck ? 1 : 0;

  for (let i = 0; i < ordered.length; i++) {
    const moveHash = applyIncrementalHash(hash, ordered[i], game);
    game.move(ordered[i].san);
    const val = isMaximizing
      ? minimax(game, depth - 1 + extension, alpha, beta, false, myColor, maxDepth, state, moveHash)
      : minimax(game, depth - 1 + extension, alpha, beta, true, myColor, maxDepth, state, moveHash);
    game.undo();

    if (isMaximizing) {
      if (val > alpha) {
        alpha = val;
        bestMove = ordered[i].san;
      }
    } else {
      if (val < beta) {
        beta = val;
        bestMove = ordered[i].san;
      }
    }

    if (beta <= alpha) {
      if (!ordered[i].captured) {
        const d = maxDepth - depth;
        if (d < state.killers.length) {
          const key = ordered[i].from + ordered[i].to;
          if (state.killers[d][0] !== key) {
            state.killers[d][1] = state.killers[d][0];
            state.killers[d][0] = key;
          }
        }
        const hKey = ordered[i].from + ordered[i].to;
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

  ttWrite(hash, depth, value, flag, bestMove);

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
  let prevScore = 0;

  for (let d = 1; d <= maxDepth; d++) {
    if (Date.now() - startTime > timeMs * 0.75) break;

    const ordered = d === 1 ? orderMoves(moves, 0, state, null) : orderMoves(game.moves({ verbose: true }), 0, state, getTTBestMove(computeHash(game)));
    let iterationBest = null;
    let iterationValue = -Infinity;
    let iterationComplete = true;

    for (let i = 0; i < ordered.length; i++) {
      if (Date.now() - startTime > timeMs * 0.9) { iterationComplete = false; break; }

      const moveHash = applyIncrementalHash(computeHash(game), ordered[i], game);
      game.move(ordered[i].san);

      let val: number;
      if (d >= 3 && i > 0) {
        const aspirationMargin = 50;
        val = minimax(game, d - 1, prevScore - aspirationMargin, prevScore + aspirationMargin, false, myColor, d, state, moveHash);
        if (val <= prevScore - aspirationMargin || val >= prevScore + aspirationMargin) {
          val = minimax(game, d - 1, -Infinity, Infinity, false, myColor, d, state, moveHash);
        }
      } else {
        val = minimax(game, d - 1, -Infinity, Infinity, false, myColor, d, state, moveHash);
      }

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
      prevScore = iterationValue;
    }

    if (iterationValue > 9000 || iterationValue < -9000) break;
  }

  return { bestMove, evaluation: bestValue, depth: completedDepth };
}

function getTTBestMove(hash: bigint): string | null {
  const idx = ttIndex(hash);
  const [lo, hi] = ttSplitHash(hash);
  if (ttKeyLow[idx] === lo && ttKeyHigh[idx] === hi) {
    return ttBestMoveArr[idx];
  }
  return null;
}
