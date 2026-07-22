import React from 'react';

interface StatusBoxProps {
  statusText: string;
  isThinking: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export function StatusBox({
  statusText,
  isThinking,
  explanation,
  showExplanation,
  actionButtonText,
  showActionButton,
  onAction,
  onSave,
  showSaveButton,
}: StatusBoxProps) {
  return (
    <div className="status-box">
      <div className={isThinking ? 'thinking' : ''}>
        {statusText}
      </div>
      {showExplanation && explanation && (
        <div className="explanation">{explanation}</div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {showActionButton && actionButtonText && (
          <button className="action-button" onClick={onAction}>
            {actionButtonText}
          </button>
        )}
        {showSaveButton && onSave && (
          <button className="action-button" onClick={onSave}>
            💾 Save Game
          </button>
        )}
      </div>
    </div>
  );
}
