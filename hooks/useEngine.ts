import { useState, useCallback } from 'react';
import type { EngineResult } from '@/lib/types';

interface EngineState {
  loading: boolean;
  error: string | null;
  lastResult: EngineResult | null;
}

interface UseEngineReturn extends EngineState {
  calculateBestMove: (fen: string, depth: number) => Promise<void>;
}

export function useEngine(): UseEngineReturn {
  const [state, setState] = useState<EngineState>({
    loading: false,
    error: null,
    lastResult: null,
  });

  const calculateBestMove = useCallback(async (fen: string, depth: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, depth }),
      });

      if (!response.ok) {
        const data = await response.json();
        setState((prev) => ({ ...prev, loading: false, error: data.error || 'Engine error' }));
        return;
      }

      const result: EngineResult = await response.json();
      setState((prev) => ({ ...prev, loading: false, lastResult: result }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  return { ...state, calculateBestMove };
}
