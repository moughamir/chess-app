import { Chess } from 'chess.js';

// Chess piece types
export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Move {
  from: string;
  to: string;
  san: string;
  color: PieceColor;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
}

// Game state
export interface GameState {
  chess: Chess | null;
  playerSide: 'white' | 'black';
  myColor: PieceColor;
  oppColor: PieceColor;
  gameStarted: boolean;
  sourceSquare: string | null;
  openingMode: 'replay' | 'force' | null;
  selectedOpening: Opening | null;
  forceMoveIndex: number;
}

// Engine
export interface EngineResult {
  bestMove: string;
  san: string;
  explanation: string;
  evaluation: number;
  depth: number;
  nodes: number;
  timeMs: number;
  engine: 'custom-minimax' | 'stockfish-cloud';
}

// Openings
export interface Opening {
  name: string;
  moves: string[];
  eco: string;
  category: string;
}

// Chess.com API
export interface Archive {
  url: string;
  year: number;
  month: number;
}

export interface ChessComGame {
  pgn: string;
  opponent: string;
  date: string;
  result: string;
}

// PGN Parser
export interface ParsedGame {
  headers: Record<string, string>;
  moves: string[];
  fen: string;
  moveCount: number;
}

// Board
export interface BoardProps {
  fen: string;
  orientation: 'white' | 'black';
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  onSquareClick: (square: string) => void;
  moveSpeed?: number;
}

// Status
export interface StatusBoxProps {
  statusText: string;
  isThinking: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
}

// Move History
export interface MoveHistoryProps {
  moves: string[];
}

// Toast
export interface ToastProps {
  message: string;
  type: 'warning' | 'error' | '';
  onDismiss?: () => void;
}

// Saved Games
export interface SavedGame {
  name: string;
  fen: string;
  timestamp: number;
}
