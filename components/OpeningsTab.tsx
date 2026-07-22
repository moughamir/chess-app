'use client';

import React, { useState, useCallback } from 'react';
import { searchOpenings, filterByFirstMove, OPENINGS, Opening } from '@/lib/openings';

interface OpeningsTabProps {
  onSelectOpening?: (opening: Opening, mode: 'replay' | 'force') => void;
}

export function OpeningsTab({ onSelectOpening }: OpeningsTabProps) {
  const [openingSearch, setOpeningSearch] = useState('');
  const [openingFilter, setOpeningFilter] = useState('');
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);

  const getFilteredOpenings = useCallback((): Opening[] => {
    if (openingSearch) return searchOpenings(openingSearch);
    if (openingFilter) return filterByFirstMove(openingFilter);
    return OPENINGS;
  }, [openingSearch, openingFilter]);

  return (
    <div>
      <input
        className="opening-search"
        placeholder="Search openings..."
        value={openingSearch}
        onChange={(e) => {
          setOpeningSearch(e.target.value);
          setOpeningFilter('');
        }}
      />
      <div className="opening-filters">
        {['e4', 'd4', 'c4', 'Nf3'].map(move => (
          <button
            key={move}
            className={`opening-filter-btn ${openingFilter === move ? 'active' : ''}`}
            onClick={() => {
              setOpeningFilter(openingFilter === move ? '' : move);
              setOpeningSearch('');
            }}
          >
            1. {move}
          </button>
        ))}
      </div>
      <div className="opening-list">
        {getFilteredOpenings().map((opening, i) => (
          <div
            key={i}
            className={`opening-item ${selectedOpening?.name === opening.name ? 'selected' : ''}`}
            onClick={() => setSelectedOpening(opening)}
          >
            <div className="name">{opening.name}</div>
            <div className="moves">{opening.moves.join(' ')}</div>
          </div>
        ))}
        {getFilteredOpenings().length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#71717a' }}>
            No openings found
          </div>
        )}
      </div>
      {selectedOpening && (
        <div className="mode-buttons">
          <button
            className="mode-btn replay"
            onClick={() => onSelectOpening?.(selectedOpening, 'replay')}
          >
            🔄 Replay (Demo)
          </button>
          <button
            className="mode-btn force"
            onClick={() => onSelectOpening?.(selectedOpening, 'force')}
          >
            🔒 Force (Practice)
          </button>
        </div>
      )}
    </div>
  );
}
