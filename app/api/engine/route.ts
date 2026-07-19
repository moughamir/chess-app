import { NextRequest, NextResponse } from 'next/server';
import { Chess } from 'chess.js';
import { getBestMove } from '@/lib/engine';
import { generateExplanation } from '@/lib/explanations';

export async function POST(request: NextRequest) {
  try {
    const { fen, depth = 3 } = await request.json();

    if (!fen) {
      return NextResponse.json({ error: 'FEN is required' }, { status: 400 });
    }

    const game = new Chess(fen);
    if (game.game_over()) {
      return NextResponse.json({ error: 'Game is over' }, { status: 400 });
    }

    const { bestMove, evaluation } = getBestMove(fen, depth);
    if (!bestMove) {
      return NextResponse.json({ error: 'No moves available' }, { status: 400 });
    }

    const explanation = generateExplanation(bestMove);

    return NextResponse.json({
      bestMove: bestMove.from + bestMove.to,
      san: bestMove.san,
      explanation,
      evaluation: Math.round(evaluation)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
