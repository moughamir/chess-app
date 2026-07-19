const { Chess } = require('chess.js');

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const CENTER_MASK = (1 << 27) | (1 << 28) | (1 << 35) | (1 << 36);

let nodeCount = 0;

function evaluateBoard(game, myColor) {
  let total = 0;
  const b = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (b[i][j]) {
        const piece = b[i][j];
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

function minimax(game, depth, alpha, beta, isMax, myColor) {
  if (depth === 0 || game.game_over()) return evaluateBoard(game, myColor);
  nodeCount++;
  const moves = game.moves({ verbose: true });
  let best = isMax ? -Infinity : Infinity;
  for (const move of moves) {
    game.move(move.san);
    const val = minimax(game, depth - 1, alpha, beta, !isMax, myColor);
    game.undo();
    if (isMax) { if (val > best) best = val; if (val > alpha) alpha = val; }
    else { if (val < best) best = val; if (val < beta) beta = val; }
    if (beta <= alpha) break;
  }
  return best;
}

function benchmark(fen, depth) {
  const game = new Chess(fen);
  const myColor = game.turn();
  nodeCount = 0;
  const start = Date.now();
  const moves = game.moves({ verbose: true });
  let bestMove = null, bestVal = -Infinity;
  for (const move of moves) {
    game.move(move.san);
    const val = minimax(game, depth - 1, -Infinity, Infinity, false, myColor);
    game.undo();
    if (val > bestVal) { bestVal = val; bestMove = move.san; }
  }
  const elapsed = Date.now() - start;
  return { bestMove, evaluation: bestVal, nodes: nodeCount, timeMs: elapsed, nps: Math.round(nodeCount / (elapsed / 1000)) };
}

const positions = [
  { name: 'Starting position', fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1' },
  { name: 'Sicilian midgame', fen: 'rnbqkb1r/pp2pppp/3p1n2/2p5/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 0 5' },
  { name: 'Tactical position', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 4' },
];

console.log('=== BARE MINIMAX BASELINE (depth 3) ===\n');
for (const pos of positions) {
  const result = benchmark(pos.fen, 3);
  console.log(`${pos.name}:`);
  console.log(`  Best: ${result.bestMove} (eval: ${result.evaluation})`);
  console.log(`  Nodes: ${result.nodes.toLocaleString()}`);
  console.log(`  Time: ${result.timeMs}ms`);
  console.log(`  NPS: ${result.nps.toLocaleString()}\n`);
}
