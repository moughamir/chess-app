import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { getSavedGames, saveGame, deleteGame, autoSave } from './storage';
import type { SavedGame } from './types';

// Polyfill localStorage for Bun test environment
const store: Record<string, string> = {};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    },
    writable: true,
    configurable: true,
  });
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no games saved', () => {
    expect(getSavedGames()).toEqual([]);
  });

  it('saves and retrieves a game', () => {
    const game: SavedGame = { name: 'Test Game', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', timestamp: 1234567890 };
    saveGame(game);
    const games = getSavedGames();
    expect(games).toHaveLength(1);
    expect(games[0].name).toBe('Test Game');
  });

  it('deletes a game by timestamp', () => {
    const game: SavedGame = { name: 'Test', fen: 'fen', timestamp: 123 };
    saveGame(game);
    deleteGame(123);
    expect(getSavedGames()).toEqual([]);
  });

  it('auto-saves with Auto-save name', () => {
    autoSave('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const games = getSavedGames();
    expect(games).toHaveLength(1);
    expect(games[0].name).toBe('Auto-save');
  });

  it('limits to 50 saved games', () => {
    for (let i = 0; i < 55; i++) {
      saveGame({ name: `Game ${i}`, fen: 'fen', timestamp: i });
    }
    expect(getSavedGames()).toHaveLength(50);
  });
});