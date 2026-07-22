import { NextRequest, NextResponse } from 'next/server';
import { Chess } from 'chess.js';
import { getBestMove, getBookMove, getNodeCount, resetNodeCount } from '@/lib/engine';
import { generateExplanation } from '@/lib/explanations';
import { getLichessEval } from '@/lib/lichess';

export const maxDuration = 30;

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

    const start = Date.now();
    let result: any = null;
    let engine = 'custom';

    const bookResult = getBookMove(fen);
    if (bookResult) {
      return Response.json({
        bestMove: bookResult.move,
        san: bookResult.move,
        explanation: `Opening theory: ${bookResult.opening}`,
        evaluation: 0,
        depth: 0,
        nodes: 0,
        timeMs: 0,
        engine: 'book',
      });
    }

    result = await getLichessEval(fen);

    if (result) {
      engine = 'stockfish-cloud';
    } else {
      const rawDepth = Number(depth) || 5;
      const clampedDepth = Math.min(Math.max(1, rawDepth), 8);
      resetNodeCount();
      const customResult = getBestMove(fen, clampedDepth, Number(timeMs) || 5000);
      result = {
        bestMove: customResult.bestMove?.from + customResult.bestMove?.to,
        san: customResult.bestMove?.san,
        evaluation: customResult.evaluation,
        depth: customResult.depth,
        nodes: getNodeCount(),
      };
      engine = 'custom-minimax';
    }

    const elapsed = Date.now() - start;

    if (!result.san) {
      return NextResponse.json({ error: 'No moves available' }, { status: 400 });
    }

    const moveObj = game.move(result.san);
    if (!moveObj) {
      return NextResponse.json({ error: 'Invalid move' }, { status: 400 });
    }

    const explanation = generateExplanation(moveObj);

    return NextResponse.json({
      bestMove: result.bestMove,
      san: result.san,
      explanation,
      evaluation: Math.round(result.evaluation || 0),
      depth: result.depth,
      nodes: result.nodes,
      timeMs: elapsed,
      engine,
    });
  } catch (error) {
    console.error('Engine error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
