import type { SavedGame } from './types';

const STORAGE_KEY = 'chess-saved-games';
const MAX_GAMES = 50;

export function getSavedGames(): SavedGame[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveGame(game: SavedGame): void {
  if (typeof window === 'undefined') return;
  const games = getSavedGames();
  games.unshift(game);
  if (games.length > MAX_GAMES) {
    games.pop();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function deleteGame(timestamp: number): void {
  if (typeof window === 'undefined') return;
  const games = getSavedGames().filter(g => g.timestamp !== timestamp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function autoSave(fen: string): void {
  if (typeof window === 'undefined') return;
  const games = getSavedGames().filter(g => g.name !== 'Auto-save');
  games.unshift({ name: 'Auto-save', fen, timestamp: Date.now() });
  if (games.length > MAX_GAMES) {
    games.pop();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}