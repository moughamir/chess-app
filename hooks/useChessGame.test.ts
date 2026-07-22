import { describe, it, expect } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useChessGame } from './useChessGame';

describe('useChessGame', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChessGame());
    
    expect(result.current.gameStarted).toBe(false);
    expect(result.current.playerSide).toBe('white');
    expect(result.current.myColor).toBe('w');
    expect(result.current.oppColor).toBe('b');
  });

  it('should start game with correct orientation', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.playerSide).toBe('white');
    expect(result.current.myColor).toBe('w');
    expect(result.current.oppColor).toBe('b');
  });

  it('should start game with black orientation', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('black');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.playerSide).toBe('black');
    expect(result.current.myColor).toBe('b');
    expect(result.current.oppColor).toBe('w');
  });

  it('should make a valid move', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    const move = result.current.makeMove('e2', 'e4');
    expect(move).not.toBeNull();
    expect(move?.san).toBe('e4');
  });

  it('should reject invalid move', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    const move = result.current.makeMove('e2', 'e5');
    expect(move).toBeNull();
  });

  it('should undo last move', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    act(() => {
      result.current.makeMove('e2', 'e4');
    });
    
    act(() => {
      result.current.undoMove();
    });
    
    expect(result.current.chess?.history()).toHaveLength(0);
  });

  it('should load PGN', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.loadFromPGN('1. e4 e5 2. Nf3');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.chess?.history()).toHaveLength(3);
  });

  it('should load FEN', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.loadFromFEN('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
    });
    
    expect(result.current.gameStarted).toBe(true);
    expect(result.current.myColor).toBe('b');
  });

  it('should detect game over', () => {
    const { result } = renderHook(() => useChessGame());
    
    act(() => {
      result.current.startGame('white');
    });
    
    // Scholar's mate
    act(() => { result.current.makeMove('e2', 'e4'); });
    act(() => { result.current.makeMove('e7', 'e5'); });
    act(() => { result.current.makeMove('f1', 'c4'); });
    act(() => { result.current.makeMove('b8', 'c6'); });
    act(() => { result.current.makeMove('d1', 'h5'); });
    act(() => { result.current.makeMove('g8', 'f6'); });
    act(() => { result.current.makeMove('h5', 'f7'); });
    
    expect(result.current.isGameOver()).toBe(true);
    expect(result.current.isCheckmate()).toBe(true);
  });
});