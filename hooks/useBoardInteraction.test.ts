import { describe, it, expect } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useBoardInteraction } from './useBoardInteraction';

describe('useBoardInteraction', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toHaveLength(0);
    expect(result.current.lastMove).toBeNull();
    expect(result.current.highlightedSquares).toHaveLength(0);
  });

  it('should select a square', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
    });
    
    expect(result.current.selectedSquare).toBe('e2');
  });

  it('should clear selection', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
    });
    
    act(() => {
      result.current.clearSelection();
    });
    
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalMoves).toHaveLength(0);
  });

  it('should set legal moves for selected square', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
      result.current.setLegalMoves(['e3', 'e4']);
    });
    
    expect(result.current.legalMoves).toEqual(['e3', 'e4']);
  });

  it('should set last move', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.setLastMove({ from: 'e2', to: 'e4' });
    });
    
    expect(result.current.lastMove).toEqual({ from: 'e2', to: 'e4' });
  });

  it('should compute highlighted squares', () => {
    const { result } = renderHook(() => useBoardInteraction());
    
    act(() => {
      result.current.selectSquare('e2');
      result.current.setLegalMoves(['e3', 'e4']);
      result.current.setLastMove({ from: 'd2', to: 'd4' });
    });
    
    expect(result.current.highlightedSquares).toContain('e2');
    expect(result.current.highlightedSquares).toContain('e3');
    expect(result.current.highlightedSquares).toContain('e4');
    expect(result.current.highlightedSquares).toContain('d2');
    expect(result.current.highlightedSquares).toContain('d4');
  });
});