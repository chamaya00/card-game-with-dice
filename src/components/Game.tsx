'use client';

import { useGame } from '@/context/GameContext';
import { PlayerSetup } from './PlayerSetup';
import { GameBoard } from './GameBoard';

export function Game() {
  const { gameState, startGame } = useGame();

  if (!gameState) {
    return <PlayerSetup onStartGame={startGame} />;
  }

  return <GameBoard />;
}
