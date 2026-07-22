export interface Opening {
  name: string;
  moves: string[];
  eco: string;
  category: string;
}

export const OPENINGS: Opening[] = [
  // 1. e4 Openings
  { name: "Italian Game", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"], eco: "C50", category: "e4" },
  { name: "Ruy López", moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"], eco: "C60", category: "e4" },
  { name: "Scotch Game", moves: ["e4", "e5", "Nf3", "Nc6", "d4"], eco: "C44", category: "e4" },
  { name: "King's Gambit", moves: ["e4", "e5", "f4"], eco: "C30", category: "e4" },
  { name: "Vienna Game", moves: ["e4", "e5", "Nc3"], eco: "C25", category: "e4" },
  { name: "Four Knights Game", moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"], eco: "C47", category: "e4" },
  { name: "Petrov's Defense", moves: ["e4", "e5", "Nf3", "Nf6"], eco: "C42", category: "e4" },
  { name: "Philidor Defense", moves: ["e4", "e5", "Nf3", "d6"], eco: "C41", category: "e4" },
  { name: "Center Game", moves: ["e4", "e5", "d4", "exd4", "Qxd4"], eco: "C22", category: "e4" },
  { name: "Bishop's Opening", moves: ["e4", "e5", "Bc4"], eco: "C23", category: "e4" },
  // Sicilian
  { name: "Sicilian Defense", moves: ["e4", "c5"], eco: "B20", category: "e4" },
  { name: "Sicilian Najdorf", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], eco: "B90", category: "e4" },
  { name: "Sicilian Dragon", moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"], eco: "B70", category: "e4" },
  { name: "Sicilian Sveshnikov", moves: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5"], eco: "B33", category: "e4" },
  // French
  { name: "French Defense", moves: ["e4", "e6"], eco: "C00", category: "e4" },
  { name: "French Winawer", moves: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"], eco: "C15", category: "e4" },
  { name: "French Classical", moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7"], eco: "C11", category: "e4" },
  // Caro-Kann
  { name: "Caro-Kann Defense", moves: ["e4", "c6"], eco: "B10", category: "e4" },
  { name: "Caro-Kann Advance", moves: ["e4", "c6", "d4", "d5", "e5"], eco: "B12", category: "e4" },
  // 1. d4 Openings
  { name: "Queen's Gambit", moves: ["d4", "d5", "c4"], eco: "D06", category: "d4" },
  { name: "Queen's Gambit Declined", moves: ["d4", "d5", "c4", "e6"], eco: "D30", category: "d4" },
  { name: "Queen's Gambit Accepted", moves: ["d4", "d5", "c4", "dxc4"], eco: "D20", category: "d4" },
  { name: "Slav Defense", moves: ["d4", "d5", "c4", "c6"], eco: "D10", category: "d4" },
  { name: "King's Indian Defense", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"], eco: "E60", category: "d4" },
  { name: "Nimzo-Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"], eco: "E20", category: "d4" },
  { name: "Queen's Indian Defense", moves: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"], eco: "E15", category: "d4" },
  { name: "Grünfeld Defense", moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"], eco: "D80", category: "d4" },
  { name: "Benoni Defense", moves: ["d4", "Nf6", "c4", "c5"], eco: "A56", category: "d4" },
  { name: "Dutch Defense", moves: ["d4", "f5"], eco: "A80", category: "d4" },
  { name: "London System", moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"], eco: "D00", category: "d4" },
  { name: "Colle System", moves: ["d4", "d5", "Nf3", "Nf6", "e3"], eco: "D05", category: "d4" },
  // 1. c4 Openings
  { name: "English Opening", moves: ["c4", "e5"], eco: "A20", category: "c4" },
  { name: "English Symmetrical", moves: ["c4", "c5"], eco: "A30", category: "c4" },
  // 1. Nf3 Openings
  { name: "Réti Opening", moves: ["Nf3", "d5", "c4"], eco: "A09", category: "Nf3" },
  { name: "King's Indian Attack", moves: ["Nf3", "d6", "g3", "Bg7", "Bg2"], eco: "A05", category: "Nf3" },
];

export function searchOpenings(query: string): Opening[] {
  const q = query.toLowerCase();
  return OPENINGS.filter(o => o.name.toLowerCase().includes(q));
}

export function filterByFirstMove(move: string): Opening[] {
  return OPENINGS.filter(o => o.moves[0].toLowerCase() === move.toLowerCase());
}

import { Chess } from 'chess.js';

export function positionToFen(moves: string[]): string {
  const chess = new Chess();
  for (const move of moves) {
    const result = chess.move(move);
    if (!result) break;
  }
  return chess.fen();
}

function normalizeFen(fen: string): string {
  return fen.replace(/\s+\d+\s+\d+\s*$/, '').trim();
}

export function getBookMove(fen: string): { move: string; opening: string } | null {
  const normalizedInput = normalizeFen(fen);
  for (const opening of OPENINGS) {
    const chess = new Chess();
    for (let i = 0; i < opening.moves.length; i++) {
      const result = chess.move(opening.moves[i]);
      if (!result) break;
      const currentFen = normalizeFen(chess.fen());
      if (currentFen === normalizedInput && i + 1 < opening.moves.length) {
        return { move: opening.moves[i + 1], opening: opening.name };
      }
    }
  }
  return null;
}
