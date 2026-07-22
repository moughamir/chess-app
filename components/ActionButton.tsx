import React from 'react';

interface ActionButtonProps {
  text: string;
  onClick: () => void;
}

export function ActionButton({ text, onClick }: ActionButtonProps) {
  return (
    <button className="action-button" onClick={onClick}>
      {text}
    </button>
  );
}
