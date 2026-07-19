import { NextRequest, NextResponse } from 'next/server';
import { Chess } from 'chess.js';
import { getBestMove, getNodeCount, resetNodeCount } from '@/lib/engine';
import { generateExplanation } from '@/lib/explanations';

export async function POST(request: NextRequest) {
  try {
    const { fen, depth = 5, timeMs = 5000 } = await request.json();

    if (!fen) {
      return NextResponse.json({ error: 'FEN is required' }, { status: 400 });
    }

    const game = new Chess(fen);
    if (game.isGameOver()) {
      return NextResponse.json({ error: 'Game is over' }, { status: 400 });
    }

    const rawDepth = Number(depth) || 5;
    const clampedDepth = Math.min(Math.max(1, rawDepth), 8);
    resetNodeCount();
    const start = Date.now();
    const { bestMove, evaluation, depth: searchDepth } = getBestMove(fen, clampedDepth, Number(timeMs) || 5000);
    const elapsed = Date.now() - start;
    const nodes = getNodeCount();
    if (!bestMove) {
      return NextResponse.json({ error: 'No moves available' }, { status: 400 });
    }

    const explanation = generateExplanation(bestMove);

    return NextResponse.json({
      bestMove: bestMove.from + bestMove.to,
      san: bestMove.san,
      explanation,
      evaluation: Math.round(evaluation),
      depth: searchDepth,
      nodes,
      timeMs: elapsed,
      nps: Math.round(nodes / (elapsed / 1000))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
