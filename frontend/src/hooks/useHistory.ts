import { useState, useCallback } from 'react';
import { DashboardState } from '../types/dashboard';

export function useHistory(initialState: DashboardState) {
  const [history, setHistory] = useState<DashboardState[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const currentState = history[currentIndex] || initialState;

  const pushState = useCallback((newState: DashboardState) => {
    setHistory((prevHistory) => {
      // Slice history up to current index and append new state
      const nextHistory = prevHistory.slice(0, currentIndex + 1);
      nextHistory.push(newState);

      // Keep max 50 entries
      if (nextHistory.length > 50) {
        nextHistory.shift();
      }
      return nextHistory;
    });

    setCurrentIndex((prevIndex) => {
      const newLen = Math.min(currentIndex + 2, 50);
      return newLen - 1;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, history.length]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    historyCount: history.length,
    currentIndex,
  };
}
