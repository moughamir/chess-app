'use client';

import React from 'react';
import type { TimeControl } from '@/lib/types';

interface NewGameTabProps {
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
  onStartGame: () => void;
  engineStyle: 'balanced' | 'aggressive';
  onEngineStyleChange: (style: 'balanced' | 'aggressive') => void;
  timeControl: TimeControl | null;
  onTimeControlChange: (control: TimeControl | null) => void;
}

export function NewGameTab({
  playerSide,
  onPlayerSideChange,
  onStartGame,
  engineStyle,
  onEngineStyleChange,
  timeControl,
  onTimeControlChange,
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
      <div className="time-control-picker">
        <p style={{ color: '#a1a1aa', fontSize: '0.9em', marginBottom: '8px' }}>
          Time control:
        </p>
        <div className="time-control-options">
          {[
            { value: null, label: 'No clock' },
            { value: 'bullet', label: '⚡ Bullet' },
            { value: 'blitz', label: '🔥 Blitz' },
            { value: 'rapid', label: '⏱️ Rapid' },
            { value: 'classical', label: '🏛️ Classical' },
          ].map(option => (
            <div
              key={option.value ?? 'none'}
              className={`time-control-option ${timeControl === option.value ? 'selected' : ''}`}
              onClick={() => onTimeControlChange(option.value as TimeControl | null)}
            >
              {option.label}
            </div>
          ))}
        </div>
      </div>
      <button className="btn-modal-primary" onClick={onStartGame}>
        Start Battle
      </button>
    </div>
  );
}
