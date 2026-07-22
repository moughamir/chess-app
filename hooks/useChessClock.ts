import { useState, useCallback, useRef, useEffect } from 'react';
import { TimeControl, TIME_CONTROL_PRESETS } from '@/lib/types';

interface UseChessClockReturn {
  whiteTime: number;
  blackTime: number;
  activeSide: 'w' | 'b';
  isRunning: boolean;
  timeControl: TimeControl | null;
  startClock: (side: 'w' | 'b', control: TimeControl) => void;
  stopClock: () => void;
  switchTurn: () => void;
  resetClock: () => void;
  formatTime: (ms: number) => string;
}

export function useChessClock(): UseChessClockReturn {
  const [whiteTime, setWhiteTime] = useState<number>(0);
  const [blackTime, setBlackTime] = useState<number>(0);
  const [activeSide, setActiveSide] = useState<'w' | 'b'>('w');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timeControl, setTimeControl] = useState<TimeControl | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeOutRef = useRef<((side: 'w' | 'b') => void) | null>(null);

  // Timer tick
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (activeSide === 'w') {
        setWhiteTime(prev => {
          if (prev <= 100) {
            // Time out for white
            stopClock();
            onTimeOutRef.current?.('w');
            return 0;
          }
          return prev - 100;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 100) {
            // Time out for black
            stopClock();
            onTimeOutRef.current?.('b');
            return 0;
          }
          return prev - 100;
        });
      }
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, activeSide]);

  const startClock = useCallback((side: 'w' | 'b', control: TimeControl) => {
    const time = TIME_CONTROL_PRESETS[control];
    setWhiteTime(time);
    setBlackTime(time);
    setActiveSide(side);
    setTimeControl(control);
    setIsRunning(true);
  }, []);

  const stopClock = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const switchTurn = useCallback(() => {
    setActiveSide(prev => prev === 'w' ? 'b' : 'w');
  }, []);

  const resetClock = useCallback(() => {
    stopClock();
    setWhiteTime(0);
    setBlackTime(0);
    setActiveSide('w');
    setTimeControl(null);
  }, [stopClock]);

  const formatTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    whiteTime,
    blackTime,
    activeSide,
    isRunning,
    timeControl,
    startClock,
    stopClock,
    switchTurn,
    resetClock,
    formatTime,
  };
}
