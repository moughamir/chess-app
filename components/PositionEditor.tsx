'use client';

import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

interface PositionEditorProps {
  onPositionReady: (fen: string, playerSide: 'white' | 'black') => void;
}

type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p';
type PieceColor = 'w' | 'b';

interface PlacedPiece {
  type: PieceType;
  color: PieceColor;
}

const PIECES: { type: PieceType; color: PieceColor; symbol: string }[] = [
  // White pieces
  { type: 'k', color: 'w', symbol: '♔' },
  { type: 'q', color: 'w', symbol: '♕' },
  { type: 'r', color: 'w', symbol: '♖' },
  { type: 'b', color: 'w', symbol: '♗' },
  { type: 'n', color: 'w', symbol: '♘' },
  { type: 'p', color: 'w', symbol: '♙' },
  // Black pieces
  { type: 'k', color: 'b', symbol: '♚' },
  { type: 'q', color: 'b', symbol: '♛' },
  { type: 'r', color: 'b', symbol: '♜' },
  { type: 'b', color: 'b', symbol: '♝' },
  { type: 'n', color: 'b', symbol: '♞' },
  { type: 'p', color: 'b', symbol: '♟' },
];

export function PositionEditor({ onPositionReady }: PositionEditorProps) {
  const [board, setBoard] = useState<(PlacedPiece | null)[][]>(() => {
    // Initialize empty 8x8 board
    return Array(8).fill(null).map(() => Array(8).fill(null));
  });
  const [selectedPiece, setSelectedPiece] = useState<PlacedPiece | null>(null);
  const [playerSide, setPlayerSide] = useState<'white' | 'black'>('white');

  // Handle square click
  const handleSquareClick = useCallback((row: number, col: number) => {
    if (selectedPiece) {
      // Place piece
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = selectedPiece;
      setBoard(newBoard);
      setSelectedPiece(null);
    } else if (board[row][col]) {
      // Remove piece
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = null;
      setBoard(newBoard);
    }
  }, [selectedPiece, board]);

  // Handle palette click
  const handlePaletteClick = useCallback((piece: PlacedPiece) => {
    setSelectedPiece(selectedPiece?.type === piece.type && selectedPiece?.color === piece.color ? null : piece);
  }, [selectedPiece]);

  // Generate FEN from board
  const generateFen = useCallback((): string => {
    let fen = '';
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
          fen += symbol;
        } else {
          empty++;
        }
      }
      if (empty > 0) fen += empty;
      if (row < 7) fen += '/';
    }
    // Add active color, castling, en passant, halfmove, fullmove
    fen += ` ${playerSide === 'white' ? 'w' : 'b'} - - 0 1`;
    return fen;
  }, [board, playerSide]);

  // Start game with current position
  const handleStart = useCallback(() => {
    const fen = generateFen();
    onPositionReady(fen, playerSide);
  }, [generateFen, playerSide, onPositionReady]);

  // Clear board
  const handleClear = useCallback(() => {
    setBoard(Array(8).fill(null).map(() => Array(8).fill(null)));
    setSelectedPiece(null);
  }, []);

  // Set up standard position
  const handleSetupStandard = useCallback(() => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    // Set up standard position
    const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let col = 0; col < 8; col++) {
      newBoard[0][col] = { type: backRank[col], color: 'b' };
      newBoard[1][col] = { type: 'p', color: 'b' };
      newBoard[6][col] = { type: 'p', color: 'w' };
      newBoard[7][col] = { type: backRank[col], color: 'w' };
    }
    setBoard(newBoard);
  }, []);

  return (
    <div className="position-editor">
      <div className="editor-layout">
        {/* Piece palette */}
        <div className="piece-palette">
          <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '8px' }}>
            Select piece:
          </p>
          <div className="palette-pieces">
            {PIECES.map((piece, i) => (
              <div
                key={i}
                className={`palette-piece ${selectedPiece?.type === piece.type && selectedPiece?.color === piece.color ? 'selected' : ''}`}
                onClick={() => handlePaletteClick(piece)}
              >
                {piece.symbol}
              </div>
            ))}
          </div>
        </div>

        {/* Board */}
        <div className="editor-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="editor-row">
              {row.map((piece, colIndex) => (
                <div
                  key={colIndex}
                  className={`editor-square ${(rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark'}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {piece && (
                    <span className="piece-symbol">
                      {PIECES.find(p => p.type === piece.type && p.color === piece.color)?.symbol}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="editor-controls">
        <div className="side-picker">
          <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '8px' }}>
            Who plays next?
          </p>
          <div className="side-options">
            <div
              className={`side-option ${playerSide === 'white' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('white')}
            >
              <div className="piece">♙</div>
              <div className="label">White</div>
            </div>
            <div
              className={`side-option ${playerSide === 'black' ? 'selected' : ''}`}
              onClick={() => setPlayerSide('black')}
            >
              <div className="piece">♟</div>
              <div className="label">Black</div>
            </div>
          </div>
        </div>

        <div className="editor-actions">
          <button className="btn-modal-secondary" onClick={handleClear}>
            Clear Board
          </button>
          <button className="btn-modal-secondary" onClick={handleSetupStandard}>
            Standard Position
          </button>
          <button className="btn-modal-primary" onClick={handleStart}>
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}