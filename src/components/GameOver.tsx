"use client";

import React from "react";
import type { Player } from "@/types/game";
import { getPlayerRankings, getEffectiveVictoryPoints } from "@/lib/victory";
import { DAMAGE_LEADER_BONUS, VICTORY_POINTS_TO_WIN } from "@/lib/constants";

// ============================================
// Types
// ============================================

export interface GameStats {
  totalTurns: number;
  monstersDefeated: number;
  totalRolls: number;
  totalGoldEarned: number;
  totalDamageDealt: number;
}

export interface PlayerStats {
  playerId: string;
  monstersDefeated: number;
  naturalRolls: number;
  crapsRolls: number;
  damageDealt: number;
  goldEarned: number;
  cardsUsed: number;
}

export interface GameOverProps {
  /** The winning player (or players in case of tie) */
  winner: Player | Player[];
  /** All players in the game */
  players: Player[];
  /** ID of the damage leader */
  damageLeaderId: string | null;
  /** Overall game statistics */
  gameStats?: GameStats;
  /** Per-player statistics */
  playerStats?: PlayerStats[];
  /** Callback to start a new game */
  onPlayAgain?: () => void;
  /** Custom className */
  className?: string;
}

// ============================================
// Rank Badge Component
// ============================================

interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  const configs = {
    1: { bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", label: "1st" },
    2: { bg: "bg-gradient-to-r from-gray-300 to-gray-400", text: "text-gray-700", label: "2nd" },
    3: { bg: "bg-gradient-to-r from-orange-300 to-orange-400", text: "text-orange-800", label: "3rd" },
  };

  const config = configs[rank as keyof typeof configs] || {
    bg: "bg-gray-200",
    text: "text-gray-600",
    label: `${rank}th`,
  };

  return (
    <span
      className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-bold`}
    >
      {config.label}
    </span>
  );
}

// ============================================
// Player Result Card Component
// ============================================

interface PlayerResultCardProps {
  player: Player;
  rank: number;
  isWinner: boolean;
  isDamageLeader: boolean;
  stats?: PlayerStats;
}

function PlayerResultCard({
  player,
  rank,
  isWinner,
  isDamageLeader,
  stats,
}: PlayerResultCardProps) {
  const effectiveVP = getEffectiveVictoryPoints(player, isDamageLeader);

  return (
    <div
      className={`
        relative p-4 rounded-xl border-2 transition-all
        ${isWinner
          ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-400 shadow-lg"
          : "bg-white border-gray-200"
        }
      `}
    >
      {/* Winner Crown */}
      {isWinner && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="text-4xl animate-bounce">👑</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <RankBadge rank={rank} />
          <div>
            <h3 className={`font-bold ${isWinner ? "text-amber-800 text-lg" : "text-gray-800"}`}>
              {player.name}
            </h3>
            {isDamageLeader && (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <span>👑</span> Damage Leader
              </span>
            )}
          </div>
        </div>
        {isWinner && (
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            WINNER!
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{effectiveVP}</p>
          <p className="text-xs text-purple-400">Victory Points</p>
          {isDamageLeader && (
            <p className="text-xs text-purple-500">
              ({player.victoryPoints}+{DAMAGE_LEADER_BONUS})
            </p>
          )}
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">{player.gold}</p>
          <p className="text-xs text-yellow-500">Gold</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{player.damageCount}</p>
          <p className="text-xs text-red-400">Total Damage</p>
        </div>
      </div>

      {/* Card Counts */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span>{player.permanentCards.length} permanent cards</span>
        <span>{player.singleUseCards.length} single-use cards</span>
      </div>

      {/* Detailed Stats (if available) */}
      {stats && (
        <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <span>Monsters defeated: {stats.monstersDefeated}</span>
          <span>Natural rolls: {stats.naturalRolls}</span>
          <span>Cards used: {stats.cardsUsed}</span>
          <span>Gold earned: {stats.goldEarned}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Game Stats Summary Component
// ============================================

interface GameStatsSummaryProps {
  stats: GameStats;
}

function GameStatsSummary({ stats }: GameStatsSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 mt-6">
      <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className="text-lg">📊</span>
        Game Summary
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalTurns}</p>
          <p className="text-xs text-gray-500">Total Turns</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{stats.monstersDefeated}</p>
          <p className="text-xs text-gray-500">Monsters Defeated</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-600">{stats.totalRolls}</p>
          <p className="text-xs text-gray-500">Total Rolls</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-yellow-600">{stats.totalGoldEarned}</p>
          <p className="text-xs text-gray-500">Gold Earned</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">{stats.totalDamageDealt}</p>
          <p className="text-xs text-gray-500">Damage Dealt</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main GameOver Component
// ============================================

/**
 * GameOver displays the end-game screen with winner announcement,
 * player rankings, and game statistics.
 *
 * NOTE: This is a Phase 12 stub component. Full implementation includes:
 * - Victory condition checking
 * - Tie-breaker resolution
 * - Team wipe detection
 * - Animated victory sequence
 */
export function GameOver({
  winner,
  players,
  damageLeaderId,
  gameStats,
  playerStats,
  onPlayAgain,
  className = "",
}: GameOverProps) {
  const winners = Array.isArray(winner) ? winner : [winner];
  const isSharedVictory = winners.length > 1;

  // Get player rankings
  const rankings = getPlayerRankings(players, damageLeaderId);
  const winnerIds = winners.map((w) => w.id);

  return (
    <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h1 className="text-3xl font-bold mb-2">
          {isSharedVictory ? "Shared Victory!" : "Victory!"}
        </h1>
        <p className="text-xl opacity-90">
          {isSharedVictory
            ? `${winners.map((w) => w.name).join(" & ")} win the game!`
            : `${winners[0].name} wins the game!`
          }
        </p>
        <p className="text-sm opacity-75 mt-2">
          First to {VICTORY_POINTS_TO_WIN} Victory Points
        </p>
      </div>

      {/* Player Rankings */}
      <div className="p-6">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="text-lg">🏆</span>
          Final Rankings
        </h2>

        <div className="space-y-4">
          {rankings.map((player, index) => {
            const isWinner = winnerIds.includes(player.id);
            const isDamageLeader = player.id === damageLeaderId;
            const playerStat = playerStats?.find((s) => s.playerId === player.id);

            return (
              <PlayerResultCard
                key={player.id}
                player={player}
                rank={index + 1}
                isWinner={isWinner}
                isDamageLeader={isDamageLeader}
                stats={playerStat}
              />
            );
          })}
        </div>

        {/* Game Stats */}
        {gameStats && <GameStatsSummary stats={gameStats} />}

        {/* Play Again Button */}
        {onPlayAgain && (
          <button
            onClick={onPlayAgain}
            className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            Play Again
          </button>
        )}
      </div>

      {/* Stub Notice */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center italic">
          Phase 12 stub - full victory & tie-breaker system coming soon
        </p>
      </div>
    </div>
  );
}

// ============================================
// Victory Check Hook (Phase 12 Stub)
// ============================================

export interface UseVictoryCheckReturn {
  checkForWinner: () => Player | Player[] | null;
  isGameOver: boolean;
}

/**
 * Hook for checking victory conditions.
 * NOTE: Stub implementation - full version handles all victory conditions
 */
export function useVictoryCheck(
  players: Player[],
  damageLeaderId: string | null
): UseVictoryCheckReturn {
  const checkForWinner = (): Player | Player[] | null => {
    // Check if any player has reached victory points threshold
    const potentialWinners = players.filter((p) => {
      const isDamageLeader = p.id === damageLeaderId;
      const effectiveVP = getEffectiveVictoryPoints(p, isDamageLeader);
      return effectiveVP >= VICTORY_POINTS_TO_WIN;
    });

    if (potentialWinners.length === 0) return null;
    if (potentialWinners.length === 1) return potentialWinners[0];

    // Multiple potential winners - apply tie-breakers
    // 1. Compare effective VP
    // 2. Compare gold
    // 3. Compare permanent card count
    // 4. Shared victory

    const sorted = [...potentialWinners].sort((a, b) => {
      const aVP = getEffectiveVictoryPoints(a, a.id === damageLeaderId);
      const bVP = getEffectiveVictoryPoints(b, b.id === damageLeaderId);
      if (aVP !== bVP) return bVP - aVP;

      if (a.gold !== b.gold) return b.gold - a.gold;

      return b.permanentCards.length - a.permanentCards.length;
    });

    // Check if top players are truly tied
    const first = sorted[0];
    const firstVP = getEffectiveVictoryPoints(first, first.id === damageLeaderId);

    const tied = sorted.filter((p) => {
      const vp = getEffectiveVictoryPoints(p, p.id === damageLeaderId);
      return (
        vp === firstVP &&
        p.gold === first.gold &&
        p.permanentCards.length === first.permanentCards.length
      );
    });

    return tied.length > 1 ? tied : first;
  };

  const isGameOver = checkForWinner() !== null;

  return { checkForWinner, isGameOver };
}

// ============================================
// Exports
// ============================================

export default GameOver;
