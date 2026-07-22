'use client';

import React from 'react';

interface NewGameTabProps {
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
  onStartGame: () => void;
  engineStyle: 'balanced' | 'aggressive';
  onEngineStyleChange: (style: 'balanced' | 'aggressive') => void;
}

export function NewGameTab({
  playerSide,
  onPlayerSideChange,
  onStartGame,
  engineStyle,
  onEngineStyleChange,
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
      <div className="style-picker">
        <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '12px' }}>
          Engine style:
        </p>
        <div className="style-options">
          <div
            className={`style-option ${engineStyle === 'balanced' ? 'selected' : ''}`}
            onClick={() => onEngineStyleChange('balanced')}
          >
            <div className="label">Balanced</div>
            <div className="desc">Standard play</div>
          </div>
          <div
            className={`style-option ${engineStyle === 'aggressive' ? 'selected' : ''}`}
            onClick={() => onEngineStyleChange('aggressive')}
          >
            <div className="label">Aggressive</div>
            <div className="desc">Attack-focused</div>
          </div>
        </div>
      </div>
      <button className="btn-modal-primary" onClick={onStartGame}>
        Start Battle
      </button>
    </div>
  );
}
