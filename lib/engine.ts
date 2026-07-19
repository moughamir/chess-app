import { Chess, ChessInstance } from 'chess.js';
import { PIECE_VALUES, CENTER_SQUARES } from './constants';

export function evaluateBoard(game: ChessInstance, myColor: string): number {
  let totalEvaluation = 0;
  const b = game.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (b[i][j]) {
        const piece = b[i][j]!;
        let val = PIECE_VALUES[piece.type];
        if (CENTER_SQUARES.some(([r, c]) => r === i && c === j)) val += 30;
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

export function createMoveScore(): MoveScore {
  return {
    killers: [[null, null], [null, null], [null, null], [null, null], [null, null]],
    historyTable: {}
  };
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

  if (move.san.includes('#')) score += 20000;
  else if (move.san.includes('+')) score += 5000;

  if (move.promotion) score += 8000;

  const killerKey = move.from + move.to;
  if (state.killers[depth]?.[0] === killerKey) score += 9000;
  else if (state.killers[depth]?.[1] === killerKey) score += 8500;

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

  const moves = orderMoves(game, game.moves({ verbose: true }), maxDepth - depth, state);

  for (let i = 0; i < moves.length; i++) {
    game.move(moves[i].san);
    const val = isMaximizing
      ? minimax(game, depth - 1, alpha, beta, false, myColor, maxDepth, state)
      : minimax(game, depth - 1, alpha, beta, true, myColor, maxDepth, state);
    game.undo();

    if (isMaximizing) {
      if (val > alpha) alpha = val;
    } else {
      if (val < beta) beta = val;
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
  return isMaximizing ? alpha : beta;
}

export function getBestMove(fen: string, depth: number): { bestMove: any; evaluation: number } {
  const game = new Chess(fen);
  const myColor = game.turn();
  const state = createMoveScore();

  const moves = orderMoves(game, game.moves({ verbose: true }), 0, state);

  let bestMove = null;
  let bestValue = -Infinity;

  for (let i = 0; i < moves.length; i++) {
    game.move(moves[i].san);
    const boardValue = minimax(game, depth - 1, -Infinity, Infinity, false, myColor, depth, state);
    game.undo();

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = moves[i];
    }
  }

  return { bestMove, evaluation: bestValue };
}
