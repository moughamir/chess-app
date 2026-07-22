import { useMemo } from 'react';

const PIECES: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function parseFen(fen: string): Map<string, string> {
  const pieces = new Map<string, string>();
  const boardPart = fen.split(' ')[0];
  const rows = boardPart.split('/');

  rows.forEach((row, rankIdx) => {
    let fileIdx = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        fileIdx += parseInt(ch);
      } else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type = ch.toUpperCase();
        const square = FILES[fileIdx] + RANKS[rankIdx];
        pieces.set(square, color + type);
        fileIdx++;
      }
    }
  });

  return pieces;
}

interface BoardProps {
  fen: string;
  orientation: 'white' | 'black';
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  onSquareClick: (square: string) => void;
}

export function Board({
  fen,
  orientation,
  selectedSquare,
  legalMoves,
  lastMove,
  onSquareClick,
}: BoardProps) {
  const pieces = useMemo(() => parseFen(fen), [fen]);

  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  const ranks = orientation === 'white' ? RANKS : [...RANKS].reverse();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(8, 1fr)`,
        gridTemplateRows: `repeat(8, 1fr)`,
        width: '100%',
        aspectRatio: '1',
      }}
    >
      {ranks.map((rank, ri) =>
        files.map((file, fi) => {
          const square = file + rank;
          const piece = pieces.get(square);
          const isLight = (ri + fi) % 2 === 0;
          const isSelected = square === selectedSquare;
          const isLegalMove = legalMoves.includes(square);
          const isLastMove = lastMove?.from === square || lastMove?.to === square;

          const classNames = [
            isLight ? 'light' : 'dark',
            isSelected ? 'selected' : '',
            isLegalMove ? 'legal-move' : '',
            isLastMove ? 'last-move' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={square}
              data-testid={`square-${square}`}
              className={classNames}
              onClick={() => onSquareClick(square)}
              style={{
                gridRow: ri + 1,
                gridColumn: fi + 1,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontSize: 'clamp(20px, 5vw, 48px)',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isLight ? '#f0d9b5' : '#b58863',
                color: piece?.startsWith('w') ? '#fff' : '#000',
                textShadow: piece?.startsWith('w')
                  ? '0 0 2px #000, 0 0 2px #000'
                  : '0 0 2px #fff, 0 0 2px #fff',
              }}
            >
              {piece ? PIECES[piece] : ''}
            </button>
          );
        })
      )}
    </div>
  );
}
