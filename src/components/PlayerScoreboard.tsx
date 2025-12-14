'use client';

import { Player, WINNING_SCORE } from '@/types/game';

interface PlayerScoreboardProps {
  players: Player[];
  currentPlayerIndex: number;
  selectingPlayerIndex: number;
  shoppingPlayerIndex: number;
  phase: string;
}

export function PlayerScoreboard({
  players,
  currentPlayerIndex,
  selectingPlayerIndex,
  shoppingPlayerIndex,
  phase,
}: PlayerScoreboardProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {players.map((player, index) => {
        const isCurrentTurn = index === currentPlayerIndex;
        const isSelecting = index === selectingPlayerIndex && phase === 'selecting';
        const isShopping = index === shoppingPlayerIndex && phase === 'shopping';
        const progressPercent = Math.min((player.points / WINNING_SCORE) * 100, 100);

        return (
          <div
            key={player.id}
            className={`
              relative px-4 py-3 rounded-xl shadow-lg min-w-[160px]
              transition-all duration-300
              ${isSelecting
                ? 'ring-4 ring-yellow-400 scale-105 shadow-yellow-400/50'
                : isShopping
                  ? 'ring-4 ring-green-400 scale-105 shadow-green-400/50'
                  : isCurrentTurn
                    ? 'ring-2 ring-white/50'
                    : ''
              }
            `}
            style={{ backgroundColor: player.color }}
          >
            {isSelecting && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                Picking
              </div>
            )}
            {isShopping && (
              <div className="absolute -top-2 -right-2 bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                Shopping
              </div>
            )}
            {isCurrentTurn && !isSelecting && !isShopping && (
              <div className="absolute -top-2 -right-2 bg-white text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                Turn
              </div>
            )}
            {player.skipNextTurn && (
              <div className="absolute -top-2 -left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                Skip
              </div>
            )}

            <div className="text-white font-bold text-sm truncate mb-1">
              {player.name}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-white">
                {player.points}
              </div>
              <div className="text-white/70 text-xs">
                / {WINNING_SCORE}
              </div>
            </div>

            {/* Player combat stats */}
            <div className="flex gap-2 mt-2">
              <div className="bg-red-600/60 text-white px-2 py-1 rounded text-xs font-bold">
                ⚔️ {player.strength}
              </div>
              <div className="bg-blue-600/60 text-white px-2 py-1 rounded text-xs font-bold">
                🛡️ {player.defense}
              </div>
            </div>

            {/* Equipment count */}
            {player.equipment.length > 0 && (
              <div className="mt-1">
                <div className="bg-yellow-600/60 text-white px-2 py-1 rounded text-xs font-bold inline-block">
                  ⚒️ {player.equipment.length} equipment
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-2 h-2 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex gap-2 text-white/60 text-xs mt-1">
              <span>{player.hand.length} cards</span>
              <span>•</span>
              <span>💰 {player.inventory.length} monsters</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
