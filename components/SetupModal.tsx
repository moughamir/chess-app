'use client';

import React from 'react';
import { NewGameTab } from './NewGameTab';
import { LoadGameTab } from './LoadGameTab';
import { OpeningsTab } from './OpeningsTab';
import { PositionEditor } from './PositionEditor';
import type { TimeControl } from '@/lib/types';

interface SetupModalProps {
  isOpen: boolean;
  activeTab: 'new' | 'load' | 'openings' | 'setup';
  onTabChange: (tab: 'new' | 'load' | 'openings' | 'setup') => void;
  onClose: () => void;
  onStartGame: () => void;
  playerSide: 'white' | 'black';
  onPlayerSideChange: (side: 'white' | 'black') => void;
  engineStyle: 'balanced' | 'aggressive';
  onEngineStyleChange: (style: 'balanced' | 'aggressive') => void;
  timeControl: TimeControl | null;
  onTimeControlChange: (control: TimeControl | null) => void;
  onLoadPGN?: (game: import('@/lib/pgn-parser').ParsedGame) => void;
  onLoadFEN?: (fen: string) => void;
  onLoadChessCom?: (game: import('@/lib/chesscom-api').ChessComGame) => void;
  onSelectOpening?: (opening: import('@/lib/openings').Opening, mode: 'replay' | 'force') => void;
  onPositionReady?: (fen: string, playerSide: 'white' | 'black') => void;
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
  timeControl,
  onTimeControlChange,
  onLoadPGN,
  onLoadFEN,
  onLoadChessCom,
  onSelectOpening,
  onPositionReady,
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
          <button
            className={`modal-tab ${activeTab === 'setup' ? 'active' : ''}`}
            onClick={() => onTabChange('setup')}
          >
            🎯 Setup
          </button>
        </div>

        {activeTab === 'new' && (
          <NewGameTab
            playerSide={playerSide}
            onPlayerSideChange={onPlayerSideChange}
            onStartGame={onStartGame}
            engineStyle={engineStyle}
            onEngineStyleChange={onEngineStyleChange}
            timeControl={timeControl}
            onTimeControlChange={onTimeControlChange}
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

        {activeTab === 'setup' && (
          <PositionEditor onPositionReady={onPositionReady} />
        )}
      </div>
    </div>
  );
}
