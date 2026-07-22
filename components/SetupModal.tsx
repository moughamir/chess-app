'use client';

import React from 'react';
import { NewGameTab } from './NewGameTab';
import { LoadGameTab } from './LoadGameTab';
import { OpeningsTab } from './OpeningsTab';

interface SetupModalProps {
  isOpen: boolean;
  activeTab: 'new' | 'load' | 'openings';
  onTabChange: (tab: 'new' | 'load' | 'openings') => void;
  onClose: () => void;
  onStartGame: () => void;
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
  engineStyle: 'balanced' | 'aggressive';
  onEngineStyleChange: (style: 'balanced' | 'aggressive') => void;
  onLoadPGN?: (game: import('@/lib/pgn-parser').ParsedGame) => void;
  onLoadFEN?: (fen: string) => void;
  onLoadChessCom?: (game: import('@/lib/chesscom-api').ChessComGame) => void;
  onSelectOpening?: (opening: import('@/lib/openings').Opening, mode: 'replay' | 'force') => void;
}

export function SetupModal({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  onStartGame,
  playerSide,
  onPlayerSideChange,
  engineStyle,
  onEngineStyleChange,
  onLoadPGN,
  onLoadFEN,
  onLoadChessCom,
  onSelectOpening,
}: SetupModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => onTabChange('new')}
          >
            ♟ New Game
          </button>
          <button
            className={`modal-tab ${activeTab === 'load' ? 'active' : ''}`}
            onClick={() => onTabChange('load')}
          >
            📂 Load Game
          </button>
          <button
            className={`modal-tab ${activeTab === 'openings' ? 'active' : ''}`}
            onClick={() => onTabChange('openings')}
          >
            📖 Openings
          </button>
        </div>

        {activeTab === 'new' && (
          <NewGameTab
            playerSide={playerSide}
            onPlayerSideChange={onPlayerSideChange}
            onStartGame={onStartGame}
            engineStyle={engineStyle}
            onEngineStyleChange={onEngineStyleChange}
          />
        )}

        {activeTab === 'load' && (
          <LoadGameTab
            onLoadPGN={onLoadPGN}
            onLoadFEN={onLoadFEN}
            onLoadChessCom={onLoadChessCom}
          />
        )}

        {activeTab === 'openings' && (
          <OpeningsTab onSelectOpening={onSelectOpening} />
        )}
      </div>
    </div>
  );
}
