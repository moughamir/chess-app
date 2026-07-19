const PIECE_VALUES: Record<string, number> = { 'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000 };

export function evaluateBoard(game: any, myColor: string, oppColor: string): number {
  let totalEvaluation = 0;
  const b = game.board();
  let oppKingPos: { r: number; c: number } | null = null;

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (b[i][j] && b[i][j].type === 'k' && b[i][j].color === oppColor) {
        oppKingPos = { r: i, c: j };
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (b[i][j]) {
        const piece = b[i][j];
        let val = PIECE_VALUES[piece.type];

        if (piece.color === myColor) {
          if ((i === 3 || i === 4) && (j === 3 || j === 4)) val += 30;

          if (piece.type === 'n' || piece.type === 'b') {
            if (myColor === 'w' && i === 7) val -= 40;
            if (myColor === 'b' && i === 0) val -= 40;
          }

          if (oppKingPos && piece.type !== 'p' && piece.type !== 'k') {
            const distance = Math.abs(i - oppKingPos.r) + Math.abs(j - oppKingPos.c);
            val += (14 - distance) * 10;
          }

          totalEvaluation += val;
        } else {
          totalEvaluation -= val;
        }
      }
    }
  }

  if (game.in_check()) {
    totalEvaluation += game.turn() === oppColor ? 50 : -50;
  }

  if (game.in_checkmate()) {
    return game.turn() === oppColor ? 10000 : -10000;
  }

  return totalEvaluation;
}

export function minimax(
  game: any,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean,
  myColor: string,
  oppColor: string
): number {
  if (depth === 0 || game.game_over()) return evaluateBoard(game, myColor, oppColor);
  const moves = game.moves();
  if (isMaximizingPlayer) {
    let bestVal = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      game.move(moves[i]);
      bestVal = Math.max(bestVal, minimax(game, depth - 1, alpha, beta, false, myColor, oppColor));
      game.undo();
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (let i = 0; i < moves.length; i++) {
      game.move(moves[i]);
      bestVal = Math.min(bestVal, minimax(game, depth - 1, alpha, beta, true, myColor, oppColor));
      game.undo();
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  }
}

export function getBestMoveLocal(game: any, myColor: string, oppColor: string): any {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0 || game.game_over()) return null;

  const checkmateMove = moves.find((m: any) => m.san.includes('#'));
  if (checkmateMove) return checkmateMove;

  moves.sort((a: any, b: any) => {
    const scoreA = (a.flags.includes('c') ? 100 : 0) + (a.san.includes('+') ? 50 : 0);
    const scoreB = (b.flags.includes('c') ? 100 : 0) + (b.san.includes('+') ? 50 : 0);
    return scoreB - scoreA;
  });

  const topMoves = moves.slice(0, 8);
  let bestMove: any = null;
  let bestValue = -Infinity;

  for (let i = 0; i < topMoves.length; i++) {
    game.move(topMoves[i].san);
    const isRepetition = game.in_threefold_repetition();
    let boardValue = minimax(game, 2, -Infinity, Infinity, false, myColor, oppColor);

    if (isRepetition) {
      boardValue -= 5000;
    }

    game.undo();

    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = topMoves[i];
    }
  }

  if (!bestMove) bestMove = topMoves[0];
  return bestMove;
}
