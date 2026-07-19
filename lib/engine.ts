import { Chess } from 'chess.js';
import { PIECE_VALUES } from './constants';

let nodeCount = 0;
export function getNodeCount(): number { return nodeCount; }
export function resetNodeCount(): void { nodeCount = 0; }

const TT_SIZE = 1 << 20;
const TT_MASK = TT_SIZE - 1;

const ttKey: Uint32Array = new Uint32Array(TT_SIZE);
const ttDepth: Int8Array = new Int8Array(TT_SIZE);
const ttValue: Int32Array = new Int32Array(TT_SIZE);
const ttFlag: Uint8Array = new Uint8Array(TT_SIZE);
const ttBestMove: Uint16Array = new Uint16Array(TT_SIZE);

export function clearTT(): void {
  ttKey.fill(0);
  ttDepth.fill(0);
  ttValue.fill(0);
  ttFlag.fill(0);
  ttBestMove.fill(0);
}

const CENTER_MASK = (1 << 27) | (1 << 28) | (1 << 35) | (1 << 36);

function hashToIndex(hash: string): number {
  let h = 0;
  for (let i = 0; i < hash.length; i++) {
    h = ((h << 5) - h + hash.charCodeAt(i)) | 0;
  }
  return (h & 0x7FFFFFFF) & TT_MASK;
}

function hashToKey(hash: string): number {
  let h = 0;
  for (let i = 0; i < hash.length; i++) {
    h = ((h << 5) - h + hash.charCodeAt(i)) | 0;
  }
  return h;
}

export function evaluateBoard(game: Chess, myColor: string): number {
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
  if (game.isCheckmate()) return game.turn() === myColor ? -10000 : 10000;
  if (game.isCheck()) total += game.turn() === myColor ? -50 : 50;
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

function sanToKey(san: string): number {
  let h = 0;
  for (let i = 0; i < san.length; i++) {
    h = ((h << 5) - h + san.charCodeAt(i)) | 0;
  }
  return h;
}

function scoreSan(san: string, depth: number, state: MoveScore, ttBest: number): number {
  if (ttBest && sanToKey(san) === ttBest) return 100000;

  let score = 0;
  const last = san.charCodeAt(san.length - 1);
  if (last === 35) score += 20000;
  else if (last === 43) score += 5000;
  if (san.includes('=')) score += 8000;

  const key = sanToKey(san);
  if (state.killers[depth]) {
    if (state.killers[depth][0] === san) score += 9000;
    else if (state.killers[depth][1] === san) score += 8500;
  }
  if (state.historyTable[key]) {
    score += Math.min(state.historyTable[key], 8000);
  }
  return score;
}

export function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  myColor: string,
  maxDepth: number,
  state: MoveScore
): number {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game, myColor);
  nodeCount++;

  const hash = game.hash();
  const idx = hashToIndex(hash);
  const key = hashToKey(hash);
  const ttHit = ttKey[idx] === key;

  if (ttHit && ttDepth[idx] >= depth) {
    const ttVal = ttValue[idx];
    const ttFl = ttFlag[idx];
    if (ttFl === 2) return ttVal;
    if (ttFl === 1 && ttVal > alpha) alpha = ttVal;
    if (ttFl === 0 && ttVal < beta) beta = ttVal;
    if (alpha >= beta) return ttVal;
  }

  const ttBest = ttHit ? ttBestMove[idx] : 0;
  const inCheck = game.isCheck();
  const moves = game.moves();
  const extension = inCheck ? 1 : 0;
  const origAlpha = alpha;
  const origBeta = beta;

  moves.sort((a, b) => scoreSan(b, maxDepth - depth, state, ttBest) - scoreSan(a, maxDepth - depth, state, ttBest));

  let bestMoveIdx = 0;

  for (let i = 0; i < moves.length; i++) {
    game.move(moves[i]);
    const val = isMaximizing
      ? minimax(game, depth - 1 + extension, alpha, beta, false, myColor, maxDepth, state)
      : minimax(game, depth - 1 + extension, alpha, beta, true, myColor, maxDepth, state);
    game.undo();

    if (isMaximizing) {
      if (val > alpha) { alpha = val; bestMoveIdx = i; }
    } else {
      if (val < beta) { beta = val; bestMoveIdx = i; }
    }

    if (beta <= alpha) {
      const san = moves[i];
      if (!san.includes('x')) {
        const d = maxDepth - depth;
        if (d < state.killers.length) {
          if (state.killers[d][0] !== san) {
            state.killers[d][1] = state.killers[d][0];
            state.killers[d][0] = san;
          }
        }
        const hKey = sanToKey(san);
        state.historyTable[hKey] = (state.historyTable[hKey] || 0) + depth * depth;
      }
      break;
    }
  }

  const value = isMaximizing ? alpha : beta;
  let flag: number;
  if (value <= origAlpha) flag = 0;
  else if (value >= origBeta) flag = 1;
  else flag = 2;

  if (!ttKey[idx] || depth >= ttDepth[idx]) {
    ttKey[idx] = key;
    ttDepth[idx] = depth;
    ttValue[idx] = value;
    ttFlag[idx] = flag;
    ttBestMove[idx] = sanToKey(moves[bestMoveIdx]);
  }

  return value;
}

export function getBestMove(fen: string, maxDepth: number, timeMs: number = 5000): { bestMove: any; evaluation: number; depth: number } {
  const game = new Chess(fen);
  const myColor = game.turn();
  const state = createMoveScore(maxDepth);
  clearTT();

  const verboseMoves = game.moves({ verbose: true });
  if (verboseMoves.length === 0) return { bestMove: null, evaluation: 0, depth: 0 };

  const sans = verboseMoves.map(m => m.san);
  let bestMove = verboseMoves[0];
  let bestValue = -Infinity;
  let completedDepth = 0;
  const startTime = Date.now();
  let prevScore = 0;

  for (let d = 1; d <= maxDepth; d++) {
    if (Date.now() - startTime > timeMs * 0.75) break;

    let iterationBestIdx = 0;
    let iterationValue = -Infinity;
    let iterationComplete = true;

    for (let i = 0; i < sans.length; i++) {
      if (Date.now() - startTime > timeMs * 0.9) { iterationComplete = false; break; }

      game.move(sans[i]);

      let val: number;
      if (d >= 3 && i > 0) {
        const margin = 50;
        val = minimax(game, d - 1, prevScore - margin, prevScore + margin, false, myColor, d, state);
        if (val <= prevScore - margin || val >= prevScore + margin) {
          val = minimax(game, d - 1, -Infinity, Infinity, false, myColor, d, state);
        }
      } else {
        val = minimax(game, d - 1, -Infinity, Infinity, false, myColor, d, state);
      }

      game.undo();

      if (val > iterationValue) {
        iterationValue = val;
        iterationBestIdx = i;
      }
    }

    if (iterationComplete) {
      bestMove = verboseMoves[iterationBestIdx];
      bestValue = iterationValue;
      completedDepth = d;
      prevScore = iterationValue;
    }

    if (iterationValue > 9000 || iterationValue < -9000) break;
  }

  return { bestMove, evaluation: bestValue, depth: completedDepth };
}
