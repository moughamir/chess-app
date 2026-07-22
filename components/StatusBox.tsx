import React from 'react';

interface StatusBoxProps {
  statusText: string;
  isThinking: boolean;
  explanation: string | null;
  showExplanation: boolean;
  actionButtonText: string | null;
  showActionButton: boolean;
  onAction: () => void;
}

export function StatusBox({
  statusText,
  isThinking,
  explanation,
  showExplanation,
  actionButtonText,
  showActionButton,
  onAction,
}: StatusBoxProps) {
  return (
    <div className="status-box">
      <div className={isThinking ? 'thinking' : ''}>
        {statusText}
      </div>
      {showExplanation && explanation && (
        <div className="explanation">{explanation}</div>
      )}
      {showActionButton && actionButtonText && (
        <button className="action-button" onClick={onAction}>
          {actionButtonText}
        </button>
      )}
    </div>
  );
}
