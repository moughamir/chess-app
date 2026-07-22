'use client';

import React from 'react';
import { StatusBox } from './StatusBox';
import { MoveHistory } from './MoveHistory';
import type { GameState, EngineResult } from '@/lib/types';

interface GamePanelProps {
  gameStarted: boolean;
  gameState: GameState;
  engineResult: EngineResult | null;
  isEngineLoading: boolean;
  statusText: string;
  isThinking: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
  onNewGame: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export function GamePanel({
  gameStarted,
  gameState,
  engineResult,
  isEngineLoading,
  statusText,
  isThinking,
  explanation,
  showExplanation,
  actionButtonText,
  showActionButton,
  onAction,
  onNewGame,
  onSave,
  showSaveButton,
}: GamePanelProps) {
  if (!gameStarted) {
    return null;
  }

  return (
    <div id="game-section">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button className="btn-new-game" onClick={onNewGame}>
          ♟ New Game
        </button>
      </div>
      
      <StatusBox
        statusText={statusText}
        isThinking={isThinking}
        explanation={explanation}
        showExplanation={showExplanation}
        actionButtonText={actionButtonText}
        showActionButton={showActionButton}
        onAction={onAction}
        onSave={onSave}
        showSaveButton={showSaveButton}
      />

      <div className="history-header">
        <h4>Move History</h4>
        {gameState.chess && gameState.chess.history().length > 0 && (
          <button className="btn-small" onClick={onAction} title="Undo Error">
            ⏪ Step Back
          </button>
        )}
      </div>

      <div id="history-wrapper">
        <MoveHistory moves={gameState.chess?.history() ?? []} />
      </div>
    </div>
  );
}
