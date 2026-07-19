import { Chess, ChessInstance } from 'chess.js';
import { PIECE_VALUES, ZOBRIST_KEYS } from './constants';

let nodeCount = 0;
export function getNodeCount(): number { return nodeCount; }
export function resetNodeCount(): void { nodeCount = 0; }

const TT_SIZE = 1 << 20;
const TT_MASK = TT_SIZE - 1;

enum TTFlag { EXACT, LOWER, UPPER }

const ttKeyLow: Int32Array = new Int32Array(TT_SIZE);
const ttKeyHigh: Int32Array = new Int32Array(TT_SIZE);
const ttDepth: Int8Array = new Int8Array(TT_SIZE);
const ttValue: Int32Array = new Int32Array(TT_SIZE);
const ttFlag: Uint8Array = new Uint8Array(TT_SIZE);
const ttBestMoveArr: Int32Array = new Int32Array(TT_SIZE);

export function clearTT(): void {
  ttKeyLow.fill(0);
  ttKeyHigh.fill(0);
  ttDepth.fill(0);
  ttValue.fill(0);
  ttFlag.fill(0);
  ttBestMoveArr.fill(0);
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
        hash ^= ZOBRIST_KEYS[cIdx][pIdx][r * 8 + c];
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
  return [
    Number(hash & BigInt(0xFFFFFFFF)),
    Number((hash >> BigInt(32)) & BigInt(0xFFFFFFFF))
  ];
}

function applyIncrementalHash(hash: bigint, move: any): bigint {
  const colorIdx = move.color === 'w' ? 0 : 1;
  const pieceIdx = 'pnbrqk'.indexOf(move.piece);
  const fromSq = 'abcdefgh'.indexOf(move.from[0]) + (8 - parseInt(move.from[1])) * 8;
  const toSq = 'abcdefgh'.indexOf(move.to[0]) + (8 - parseInt(move.to[1])) * 8;

  hash ^= ZOBRIST_KEYS[colorIdx][pieceIdx][fromSq];
  hash ^= ZOBRIST_KEYS[colorIdx][pieceIdx][toSq];

  if (move.captured) {
    hash ^= ZOBRIST_KEYS[1 - colorIdx]['pnbrqk'.indexOf(move.captured)][toSq];
  }

  if (move.promotion) {
    hash ^= ZOBRIST_KEYS[colorIdx][0][toSq];
    hash ^= ZOBRIST_KEYS[colorIdx]['pnbrqk'.indexOf(move.promotion)][toSq];
  }

  if (move.flags.includes('e')) {
    hash ^= ZOBRIST_KEYS[1 - colorIdx][0][toSq + (move.color === 'w' ? 8 : -8)];
  }

  if (move.flags.includes('k')) {
    const rFrom = move.color === 'w' ? 63 : 61;
    const rTo = move.color === 'w' ? 61 : 63;
    hash ^= ZOBRIST_KEYS[colorIdx][3][rFrom] ^ ZOBRIST_KEYS[colorIdx][3][rTo];
  }

  if (move.flags.includes('q')) {
    const rFrom = move.color === 'w' ? 56 : 59;
    const rTo = move.color === 'w' ? 59 : 56;
    hash ^= ZOBRIST_KEYS[colorIdx][3][rFrom] ^ ZOBRIST_KEYS[colorIdx][3][rTo];
  }

  hash ^= ZOBRIST_SIDE;
  return hash;
}

export function evaluateBoard(game: ChessInstance, myColor: string): number {
  let total = 0;
  const b = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = b[i][j];
      if (piece) {
        let val = PIECE_VALUES[piece.type];
        if (CENTER_MASK & (1 << (i * 8 + j))) val += 30;
        total += piece.color === myColor ? val : -val;
      }
    }
  }
  if (game.in_checkmate()) return game.turn() === myColor ? -10000 : 10000;
  if (game.in_check()) total += game.turn() === myColor ? -50 : 50;
  return total;
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

function scoreMove(move: any, depth: number, state: MoveScore, ttBest: number): number {
  const key = move.from + move.to;
  if (ttBest && key === ttBest) return 100000;

  let score = 0;
  if (move.captured) {
    score = 10000 + PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece] / 10;
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

function moveKey(move: any): number {
  return move.from.charCodeAt(0) * 8 + move.from.charCodeAt(1) * 31 + move.to.charCodeAt(0) * 17 + move.to.charCodeAt(1) * 53;
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
  nodeCount++;

  const [lo, hi] = ttSplitHash(hash);
  const idx = ttIndex(hash);
  const ttHit = ttKeyLow[idx] === lo && ttKeyHigh[idx] === hi;

  if (ttHit && ttDepth[idx] >= depth) {
    const ttVal = ttValue[idx];
    const ttFl = ttFlag[idx];
    if (ttFl === 2) return ttVal;
    if (ttFl === 1 && ttVal > alpha) alpha = ttVal;
    if (ttFl === 0 && ttVal < beta) beta = ttVal;
    if (alpha >= beta) return ttVal;
  }

  const ttBest = ttHit ? ttBestMoveArr[idx] : 0;
  const inCheck = game.in_check();
  const moves = game.moves({ verbose: true });
  const extension = inCheck ? 1 : 0;
  const origAlpha = alpha;
  const origBeta = beta;

  moves.sort((a, b) => scoreMove(b, maxDepth - depth, state, ttBest) - scoreMove(a, maxDepth - depth, state, ttBest));

  let bestMoveKey = moves.length > 0 ? moveKey(moves[0]) : 0;

  for (let i = 0; i < moves.length; i++) {
    const moveHash = applyIncrementalHash(hash, moves[i]);
    game.move(moves[i].san);
    const val = isMaximizing
      ? minimax(game, depth - 1 + extension, alpha, beta, false, myColor, maxDepth, state, moveHash)
      : minimax(game, depth - 1 + extension, alpha, beta, true, myColor, maxDepth, state, moveHash);
    game.undo();

    if (isMaximizing) {
      if (val > alpha) { alpha = val; bestMoveKey = moveKey(moves[i]); }
    } else {
      if (val < beta) { beta = val; bestMoveKey = moveKey(moves[i]); }
    }

    if (beta <= alpha) {
      if (!moves[i].captured) {
        const d = maxDepth - depth;
        const key = moves[i].from + moves[i].to;
        if (d < state.killers.length) {
          if (state.killers[d][0] !== key) {
            state.killers[d][1] = state.killers[d][0];
            state.killers[d][0] = key;
          }
        }
        state.historyTable[key] = (state.historyTable[key] || 0) + depth * depth;
      }
      break;
    }
  }

  const value = isMaximizing ? alpha : beta;
  let flag: number;
  if (value <= origAlpha) flag = 0;
  else if (value >= origBeta) flag = 1;
  else flag = 2;

  if (!ttKeyLow[idx] || depth >= ttDepth[idx]) {
    ttKeyLow[idx] = lo;
    ttKeyHigh[idx] = hi;
    ttDepth[idx] = depth;
    ttValue[idx] = value;
    ttFlag[idx] = flag;
    ttBestMoveArr[idx] = bestMoveKey;
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
  let prevScore = 0;
  const rootHash = computeHash(game);

  for (let d = 1; d <= maxDepth; d++) {
    if (Date.now() - startTime > timeMs * 0.75) break;

    let iterationBest = null;
    let iterationValue = -Infinity;
    let iterationComplete = true;

    for (let i = 0; i < moves.length; i++) {
      if (Date.now() - startTime > timeMs * 0.9) { iterationComplete = false; break; }

      const moveHash = applyIncrementalHash(rootHash, moves[i]);
      game.move(moves[i].san);

      let val: number;
      if (d >= 3 && i > 0) {
        const margin = 50;
        val = minimax(game, d - 1, prevScore - margin, prevScore + margin, false, myColor, d, state, moveHash);
        if (val <= prevScore - margin || val >= prevScore + margin) {
          val = minimax(game, d - 1, -Infinity, Infinity, false, myColor, d, state, moveHash);
        }
      } else {
        val = minimax(game, d - 1, -Infinity, Infinity, false, myColor, d, state, moveHash);
      }

      game.undo();

      if (val > iterationValue) {
        iterationValue = val;
        iterationBest = moves[i];
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
