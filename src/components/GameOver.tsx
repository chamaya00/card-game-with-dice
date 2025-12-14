'use client';

import { Player } from '@/types/game';

interface GameOverProps {
  winner: Player | null;
  players: Player[];
  onPlayAgain: () => void;
}

export function GameOver({ winner, players, onPlayAgain }: GameOverProps) {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Winner/Game Over Banner */}
        {winner ? (
          <div
            className="py-8 px-6 text-center"
            style={{ backgroundColor: winner.color }}
          >
            <div className="text-6xl mb-4">&#127942;</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {winner.name} Wins!
            </h2>
            <p className="text-white/80 text-lg">
              with {winner.points} points
            </p>
          </div>
        ) : (
          <div className="py-8 px-6 text-center bg-red-600">
            <div className="text-6xl mb-4">&#128128;</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Game Over!
            </h2>
            <p className="text-white/80 text-lg">
              The boss was not defeated
            </p>
          </div>
        )}

        {/* Scoreboard */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Final Scores</h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: `${player.color}20` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {index === 0 ? '&#129351;' : index === 1 ? '&#129352;' : index === 2 ? '&#129353;' : `${index + 1}.`}
                  </span>
                  <span className="font-medium" style={{ color: player.color }}>
                    {player.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg" style={{ color: player.color }}>
                    {player.points}
                  </span>
                  <span className="text-gray-400 text-sm">pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play Again Button */}
        <div className="p-6 pt-0">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg
              hover:bg-emerald-700 transition-colors text-lg shadow-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
