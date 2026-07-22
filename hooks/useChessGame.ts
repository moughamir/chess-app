import { useState, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import type { GameState, Opening } from '@/lib/types';

interface UseChessGameReturn {
  chess: Chess | null;
  playerSide: 'white' | 'black';
  myColor: 'w' | 'b';
  oppColor: 'w' | 'b';
  gameStarted: boolean;
  sourceSquare: string | null;
  openingMode: 'replay' | 'force' | null;
  selectedOpening: Opening | null;
  forceMoveIndex: number;
  startGame: (side: 'white' | 'black') => void;
  makeMove: (from: string, to: string) => Move | null;
  undoMove: () => void;
  loadFromPGN: (pgn: string) => void;
  loadFromFEN: (fen: string) => void;
  isGameOver: () => boolean;
  isCheckmate: () => boolean;
  setSourceSquare: (square: string | null) => void;
  setOpening: (opts: { mode?: 'replay' | 'force' | null; opening?: Opening | null; forceMoveIndex?: number }) => void;
}

export function useChessGame(): UseChessGameReturn {
  const [chess, setChess] = useState<Chess | null>(null);
  const [playerSide, setPlayerSide] = useState<'white' | 'black'>('white');
  const [myColor, setMyColor] = useState<'w' | 'b'>('w');
  const [oppColor, setOppColor] = useState<'w' | 'b'>('b');
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [sourceSquare, setSourceSquare] = useState<string | null>(null);
  const [openingMode, setOpeningMode] = useState<'replay' | 'force' | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [forceMoveIndex, setForceMoveIndex] = useState<number>(0);

  const startGame = useCallback((side: 'white' | 'black') => {
    const newChess = new Chess();
    setChess(newChess);
    setPlayerSide(side);
    setMyColor(side === 'white' ? 'w' : 'b');
    setOppColor(side === 'white' ? 'b' : 'w');
    setGameStarted(true);
    setSourceSquare(null);
    setOpeningMode(null);
    setSelectedOpening(null);
    setForceMoveIndex(0);
  }, []);

  const makeMove = useCallback((from: string, to: string): Move | null => {
    if (!chess) return null;
    try {
      const move = chess.move({ from, to, promotion: 'q' });
      if (move) {
        setChess(new Chess(chess.fen()));
      }
      return move;
    } catch {
      return null;
    }
  }, [chess]);

  const undoMove = useCallback(() => {
    if (!chess) return;
    chess.undo();
    setChess(new Chess(chess.fen()));
  }, [chess]);

  const loadFromPGN = useCallback((pgn: string) => {
    const newChess = new Chess();
    newChess.loadPgn(pgn);
    setChess(newChess);
    setGameStarted(true);
    setSourceSquare(null);
  }, []);

  const loadFromFEN = useCallback((fen: string) => {
    const newChess = new Chess(fen);
    setChess(newChess);
    setGameStarted(true);
    setMyColor(newChess.turn());
    setOppColor(newChess.turn() === 'w' ? 'b' : 'w');
    setSourceSquare(null);
  }, []);

  const isGameOver = useCallback(() => {
    return chess?.isGameOver() ?? false;
  }, [chess]);

  const isCheckmate = useCallback(() => {
    return chess?.isCheckmate() ?? false;
  }, [chess]);

  const setOpening = useCallback((opts: { mode?: 'replay' | 'force' | null; opening?: Opening | null; forceMoveIndex?: number }) => {
    if (opts.mode !== undefined) setOpeningMode(opts.mode);
    if (opts.opening !== undefined) setSelectedOpening(opts.opening);
    if (opts.forceMoveIndex !== undefined) setForceMoveIndex(opts.forceMoveIndex);
  }, []);

  return {
    chess,
    playerSide,
    myColor,
    oppColor,
    gameStarted,
    sourceSquare,
    openingMode,
    selectedOpening,
    forceMoveIndex,
    startGame,
    makeMove,
    undoMove,
    loadFromPGN,
    loadFromFEN,
    isGameOver,
    isCheckmate,
    setSourceSquare,
    setOpening,
  };
}