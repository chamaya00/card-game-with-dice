'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GameState } from '@/types/game';
import {
  initializeGame,
  drawCards,
  selectCard,
  discardRemainingCards,
} from '@/lib/gameUtils';

interface GameContextType {
  gameState: GameState | null;
  startGame: (playerNames: string[]) => void;
  handleDrawCards: () => void;
  handleSelectCard: (cardId: string) => void;
  handleDiscard: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const startGame = useCallback((playerNames: string[]) => {
    const newGame = initializeGame(playerNames);
    setGameState(newGame);
  }, []);

  const handleDrawCards = useCallback(() => {
    if (!gameState || gameState.phase !== 'drawing') return;
    setGameState(drawCards(gameState));
  }, [gameState]);

  const handleSelectCard = useCallback((cardId: string) => {
    if (!gameState || gameState.phase !== 'selecting') return;
    setGameState(selectCard(gameState, cardId));
  }, [gameState]);

  const handleDiscard = useCallback(() => {
    if (!gameState || gameState.phase !== 'discarding') return;
    setGameState(discardRemainingCards(gameState));
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        startGame,
        handleDrawCards,
        handleSelectCard,
        handleDiscard,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
