import { Chess } from 'chess.js';

interface LichessCloudEval {
  fen: string;
  knodes: number;
  depth: number;
  pvs: Array<{
    moves: string;
    cp?: number;
    mate?: number;
  }>;
}

export async function getLichessEval(fen: string): Promise<{
  bestMove: string;
  san: string;
  evaluation: number;
  depth: number;
  pvs: string[];
} | null> {
  try {
    const encodedFen = encodeURIComponent(fen);
    const url = `https://lichess.org/api/cloud-eval?fen=${encodedFen}&multiPv=3`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: LichessCloudEval = await response.json();

    if (!data.pvs || data.pvs.length === 0) {
      return null;
    }

    const bestPv = data.pvs[0];
    const uciMoves = bestPv.moves.split(' ');
    const bestUci = uciMoves[0];

    const game = new Chess(fen);
    const legalMoves = game.moves({ verbose: true });

    let moveObj = legalMoves.find(m =>
      m.from === bestUci.substring(0, 2) &&
      m.to === bestUci.substring(2, 4)
    );

    if (!moveObj && bestUci.length > 4) {
      const promoMap: Record<string, string> = { q: 'q', r: 'r', b: 'b', n: 'n' };
      moveObj = legalMoves.find(m =>
        m.from === bestUci.substring(0, 2) &&
        m.to === bestUci.substring(2, 4) &&
        m.promotion === promoMap[bestUci[4]]
      );
    }

    if (!moveObj) {
      return null;
    }

    const evalScore = bestPv.mate !== undefined
      ? (bestPv.mate > 0 ? 10000 - bestPv.mate : -10000 + Math.abs(bestPv.mate))
      : (bestPv.cp || 0);

    const pvs = data.pvs.map(pv => pv.moves.split(' ').slice(0, 6).join(' '));

    return {
      bestMove: bestUci,
      san: moveObj.san,
      evaluation: evalScore,
      depth: data.depth,
      pvs,
    };
  } catch (error) {
    console.error('Lichess cloud eval error:', error);
    return null;
  }
}
