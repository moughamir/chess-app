import React, { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  moves: string[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  if (moves.length === 0) {
    return (
      <div className="move-history">
        <div className="ready-message">Ready for war...</div>
      </div>
    );
  }

  const movePairs: { num: number; white: string; black: string | null }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  return (
    <div className="move-history" ref={scrollRef}>
      {movePairs.map(({ num, white, black }) => (
        <div key={num} className="move-row">
          <span className="move-number">{num}.</span>
          <span className="move-white">{white}</span>
          {black && <span className="move-black">{black}</span>}
        </div>
      ))}
    </div>
  );
}
