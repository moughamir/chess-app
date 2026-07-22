import React from 'react';

interface ExplanationProps {
  text: string;
}

export function Explanation({ text }: ExplanationProps) {
  return (
    <div className="explanation">{text}</div>
  );
}
