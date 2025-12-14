'use client';

import { useState } from 'react';
import { MIN_PLAYERS, MAX_PLAYERS } from '@/types/game';

interface PlayerSetupProps {
  onStartGame: (playerNames: string[]) => void;
}

export function PlayerSetup({ onStartGame }: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array(MAX_PLAYERS).fill('').map((_, i) => `Player ${i + 1}`)
  );

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, count)));
  };

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    const names = playerNames.slice(0, playerCount).map((name, i) =>
      name.trim() || `Player ${i + 1}`
    );
    onStartGame(names);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-800 to-emerald-950 p-4">
      <div className="bg-white/95 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-emerald-800 mb-2">
          Card Game
        </h1>
        <p className="text-gray-600 text-center mb-6">
          First to 10 points wins!
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Players
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handlePlayerCountChange(playerCount - 1)}
              disabled={playerCount <= MIN_PLAYERS}
              className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold
                disabled:bg-gray-300 disabled:cursor-not-allowed
                hover:bg-emerald-700 transition-colors"
            >
              -
            </button>
            <span className="text-2xl font-bold text-emerald-800 w-8 text-center">
              {playerCount}
            </span>
            <button
              onClick={() => handlePlayerCountChange(playerCount + 1)}
              disabled={playerCount >= MAX_PLAYERS}
              className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold
                disabled:bg-gray-300 disabled:cursor-not-allowed
                hover:bg-emerald-700 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Player Names
          </label>
          {Array.from({ length: playerCount }).map((_, index) => (
            <input
              key={index}
              type="text"
              value={playerNames[index]}
              onChange={(e) => handleNameChange(index, e.target.value)}
              placeholder={`Player ${index + 1}`}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg
                focus:border-emerald-500 focus:outline-none transition-colors
                text-gray-800"
            />
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg
            hover:bg-emerald-700 transition-colors text-lg shadow-lg"
        >
          Start Game
        </button>

        <div className="mt-6 text-sm text-gray-500 space-y-1">
          <p className="font-medium">How to play:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Each turn, {playerCount + 1} cards are drawn</li>
            <li>Players take turns picking a card</li>
            <li>Card values add to your score</li>
            <li>First to 10 points wins!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
