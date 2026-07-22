import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { renderHook, act } from '@testing-library/react';
import { useEngine } from './useEngine';

// Mock fetch
const mockFetch = mock(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({
    bestMove: 'e2e4',
    san: 'e4',
    explanation: '测试解释',
    evaluation: 50,
    depth: 5,
    nodes: 1000,
    timeMs: 100,
    engine: 'custom-minimax',
  }),
}));

global.fetch = mockFetch;

describe('useEngine', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEngine());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResult).toBeNull();
  });

  it('should calculate best move', async () => {
    const { result } = renderHook(() => useEngine());
    
    await act(async () => {
      await result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.lastResult).not.toBeNull();
    expect(result.current.lastResult?.san).toBe('e4');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Engine error' }),
    });
    
    const { result } = renderHook(() => useEngine());
    
    await act(async () => {
      await result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Engine error');
    expect(result.current.lastResult).toBeNull();
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useEngine());
    
    await act(async () => {
      await result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should set loading state during calculation', async () => {
    let resolvePromise: (value: Response) => void;
    mockFetch.mockReturnValueOnce(new Promise((resolve) => {
      resolvePromise = resolve;
    }));
    
    const { result } = renderHook(() => useEngine());
    
    act(() => {
      result.current.calculateBestMove('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 3);
    });
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      resolvePromise({
        ok: true,
        json: () => Promise.resolve({
          bestMove: 'e7e5',
          san: 'e5',
          explanation: '测试',
          evaluation: -30,
          depth: 3,
          nodes: 500,
          timeMs: 50,
          engine: 'custom-minimax',
        }),
      });
    });
    
    expect(result.current.loading).toBe(false);
  });
});
