'use client';

import React from 'react';

interface NewGameTabProps {
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
  onStartGame: () => void;
}

export function NewGameTab({
  playerSide,
  onPlayerSideChange,
  onStartGame,
}: NewGameTabProps) {
  return (
    <div>
      <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '12px' }}>
        Choose your side:
      </p>
      <div className="side-picker">
        <div
          className={`side-option ${playerSide === 'white' ? 'selected' : ''}`}
          onClick={() => onPlayerSideChange('white')}
        >
          <div className="piece">♙</div>
          <div className="label">White</div>
          <div className="desc">Attack First</div>
        </div>
        <div
          className={`side-option ${playerSide === 'black' ? 'selected' : ''}`}
          onClick={() => onPlayerSideChange('black')}
        >
          <div className="piece">♟</div>
          <div className="label">Black</div>
          <div className="desc">Counter Attack</div>
        </div>
      </div>
      <button className="btn-modal-primary" onClick={onStartGame}>
        Start Battle
      </button>
    </div>
  );
}
