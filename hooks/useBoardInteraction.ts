import { useState, useMemo, useCallback } from 'react';

export interface BoardState {
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  highlightedSquares: string[];
}

export interface UseBoardInteractionReturn extends BoardState {
  selectSquare: (square: string) => void;
  clearSelection: () => void;
  setLegalMoves: (moves: string[]) => void;
  setLastMove: (move: { from: string; to: string } | null) => void;
}

export function useBoardInteraction(): UseBoardInteractionReturn {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const selectSquare = useCallback((square: string) => {
    setSelectedSquare(square);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, []);

  const highlightedSquares = useMemo(() => {
    const squares: string[] = [];
    if (selectedSquare) squares.push(selectedSquare);
    if (legalMoves) squares.push(...legalMoves);
    if (lastMove) {
      squares.push(lastMove.from, lastMove.to);
    }
    return [...new Set(squares)]; // deduplicate
  }, [selectedSquare, legalMoves, lastMove]);

  return {
    selectedSquare,
    legalMoves,
    lastMove,
    highlightedSquares,
    selectSquare,
    clearSelection,
    setLegalMoves,
    setLastMove,
  };
}