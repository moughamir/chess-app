'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    Chessboard: any;
    jQuery: any;
    $: any;
  }
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
  const boardRef = useRef<HTMLDivElement>(null);
  const boardInstance = useRef<any>(null);
  const onSquareClickRef = useRef(onSquareClick);

  // Keep ref updated
  useEffect(() => {
    onSquareClickRef.current = onSquareClick;
  }, [onSquareClick]);

  // Initialize board
  useEffect(() => {
    if (typeof window === 'undefined' || !boardRef.current) return;

    const Chessboard = window.Chessboard;
    const $ = window.jQuery;
    if (!Chessboard || !$) return;

    // Wait for chessboard.js to be ready
    const timer = setTimeout(() => {
      if (!boardRef.current) return;

      const config = {
        draggable: false,
        position: fen,
        orientation: orientation === 'white' ? 'white' : 'black',
        moveSpeed: 0,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
      };

      // Destroy existing board
      if (boardInstance.current) {
        boardInstance.current.destroy();
      }

      boardInstance.current = Chessboard(boardRef.current, config);

      // Handle resize
      $(window).off('resize.chessboard').on('resize.chessboard', () => {
        boardInstance.current?.resize();
      });

      // Handle click events
      $(boardRef.current).off('click.chess touchend.chess', '.square-55d63');
      $(boardRef.current).on('click.chess touchend.chess', '.square-55d63', function(this: HTMLElement, e: any) {
        e.preventDefault();
        const square = $(this).attr('data-square');
        if (square) {
          onSquareClickRef.current(square);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (boardRef.current) {
        $(boardRef.current).off('click.chess touchend.chess', '.square-55d63');
      }
      $(window).off('resize.chessboard');
    };
  }, [fen, orientation]);

  // Update position when FEN changes
  useEffect(() => {
    if (boardInstance.current && fen) {
      boardInstance.current.position(fen, false);
    }
  }, [fen]);

  // Highlight squares
  useEffect(() => {
    if (!boardRef.current || !window.jQuery) return;
    const $ = window.jQuery;

    // Clear all highlights
    const squares = $(boardRef.current).find('.square-55d63');
    squares.removeClass('highlight-square selected-square last-move-square');

    // Highlight selected square
    if (selectedSquare) {
      const selSq = $(boardRef.current).find('.square-' + selectedSquare);
      selSq.addClass('selected-square');
    }

    // Highlight legal moves
    legalMoves.forEach(sq => {
      const moveSq = $(boardRef.current).find('.square-' + sq);
      moveSq.addClass('highlight-square');
    });

    // Highlight last move
    if (lastMove) {
      const fromSq = $(boardRef.current).find('.square-' + lastMove.from);
      const toSq = $(boardRef.current).find('.square-' + lastMove.to);
      fromSq.addClass('last-move-square');
      toSq.addClass('last-move-square');
    }
  }, [selectedSquare, legalMoves, lastMove]);

  return (
    <div id="myBoard" ref={boardRef} style={{ width: '100%' }}></div>
  );
}
