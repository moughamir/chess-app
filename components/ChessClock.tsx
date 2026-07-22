'use client';

import React from 'react';

interface ChessClockProps {
  whiteTime: number;
  blackTime: number;
  activeSide: 'w' | 'b';
  playerSide: 'white' | 'black';
  formatTime: (ms: number) => string;
  isRunning: boolean;
}

export function ChessClock({
  whiteTime,
  blackTime,
  activeSide,
  playerSide,
  formatTime,
  isRunning,
}: ChessClockProps) {
  const getClockClassName = (side: 'w' | 'b'): string => {
    const isActive = activeSide === side && isRunning;
    const time = side === 'w' ? whiteTime : blackTime;
    const isLow = time <= 30000; // 30 seconds
    const isCritical = time <= 10000; // 10 seconds
    
    return [
      'chess-clock',
      isActive ? 'active' : '',
      isLow ? 'low-time' : '',
      isCritical ? 'critical-time' : '',
    ].filter(Boolean).join(' ');
  };

  const opponentSide = playerSide === 'white' ? 'b' : 'w';
  const playerTime = playerSide === 'white' ? whiteTime : blackTime;
  const opponentTime = playerSide === 'white' ? blackTime : whiteTime;

  return (
    <div className="chess-clock-container">
      {/* Opponent clock (top) */}
      <div className={getClockClassName(opponentSide)}>
        <span className="clock-icon">
          {opponentSide === 'w' ? '♙' : '♟'}
        </span>
        <span className="clock-side">
          {opponentSide === 'w' ? 'White' : 'Black'}
        </span>
        <span className="clock-time">
          {formatTime(opponentTime)}
        </span>
      </div>

      {/* Player clock (bottom) */}
      <div className={getClockClassName(playerSide === 'white' ? 'w' : 'b')}>
        <span className="clock-icon">
          {playerSide === 'white' ? '♙' : '♟'}
        </span>
        <span className="clock-side">
          {playerSide === 'white' ? 'White' : 'Black'}
        </span>
        <span className="clock-time">
          {formatTime(playerTime)}
        </span>
      </div>
    </div>
  );
}