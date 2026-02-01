"use client";

import React from "react";
import type { Player } from "@/types/game";
import { DAMAGE_LEADER_BONUS } from "@/lib/constants";

// ============================================
// Types
// ============================================

export interface DamageTrackerProps {
  /** All players in the game */
  players: Player[];
  /** ID of the current damage leader (or null if none) */
  damageLeaderId: string | null;
  /** Whether to show compact view */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================
// Damage Tracker Component
// ============================================

/**
 * DamageTracker displays a leaderboard of all players' cumulative damage.
 * The damage leader gets a +3 VP bonus shown next to their entry.
 *
 * NOTE: This is a Phase 10 stub component. Full implementation includes:
 * - Animation when the damage leader changes
 * - Detailed damage breakdown per monster
 * - Turn damage preview
 */
export function DamageTracker({
  players,
  damageLeaderId,
  compact = false,
  className = "",
}: DamageTrackerProps) {
  // Sort players by damage count (descending)
  const sortedPlayers = [...players].sort((a, b) => b.damageCount - a.damageCount);

  // Find the damage leader
  const damageLeader = damageLeaderId
    ? players.find((p) => p.id === damageLeaderId)
    : null;

  if (compact) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">👑</span>
            <span className="text-sm font-medium text-gray-700">Damage Leader</span>
          </div>
          {damageLeader ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-700">{damageLeader.name}</span>
              <span className="text-sm text-gray-500">({damageLeader.damageCount} dmg)</span>
              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                +{DAMAGE_LEADER_BONUS} VP
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">No damage dealt yet</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <h3 className="font-semibold text-gray-800">Damage Leaderboard</h3>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
          Leader gets +{DAMAGE_LEADER_BONUS} VP
        </span>
      </div>

      {/* Leaderboard */}
      <div className="p-4">
        {sortedPlayers.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-4">
            No players yet
          </div>
        ) : (
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const isLeader = player.id === damageLeaderId;
              const rank = index + 1;

              return (
                <div
                  key={player.id}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg
                    transition-all duration-300
                    ${isLeader
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-sm"
                      : "bg-gray-50 border border-gray-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <span
                      className={`
                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                        ${rank === 1
                          ? "bg-amber-400 text-white"
                          : rank === 2
                            ? "bg-gray-300 text-gray-700"
                            : rank === 3
                              ? "bg-orange-300 text-orange-800"
                              : "bg-gray-200 text-gray-500"
                        }
                      `}
                    >
                      {rank}
                    </span>

                    {/* Player Name */}
                    <span className={`font-medium ${isLeader ? "text-amber-800" : "text-gray-700"}`}>
                      {player.name}
                    </span>

                    {/* Crown for leader */}
                    {isLeader && <span className="text-lg animate-bounce">👑</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Damage Count */}
                    <span className={`font-bold text-lg ${isLeader ? "text-amber-700" : "text-gray-600"}`}>
                      {player.damageCount}
                    </span>
                    <span className="text-xs text-gray-400">damage</span>

                    {/* VP Bonus indicator for leader */}
                    {isLeader && (
                      <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-medium">
                        +{DAMAGE_LEADER_BONUS} VP
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stub Notice */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <p className="text-xs text-gray-400 text-center italic">
          Phase 10 stub - full damage leader mechanics coming soon
        </p>
      </div>
    </div>
  );
}

// ============================================
// Utility Functions (Phase 10 Stubs)
// ============================================

/**
 * Calculate the damage leader from all players.
 * Returns the player ID with the most damage, or null if no damage dealt.
 * In case of ties, returns the first player who reached that damage count.
 *
 * NOTE: Stub implementation - full version tracks damage history
 */
export function calculateDamageLeader(players: Player[]): string | null {
  if (players.length === 0) return null;

  let maxDamage = 0;
  let leaderId: string | null = null;

  for (const player of players) {
    if (player.damageCount > maxDamage) {
      maxDamage = player.damageCount;
      leaderId = player.id;
    }
  }

  return maxDamage > 0 ? leaderId : null;
}

/**
 * Check if a player would become the new damage leader.
 * Returns true only if they SURPASS (not tie) the current leader.
 *
 * NOTE: Stub implementation - full version handles edge cases
 */
export function wouldBecomeDamageLeader(
  players: Player[],
  playerId: string,
  additionalDamage: number,
  currentLeaderId: string | null
): boolean {
  const player = players.find((p) => p.id === playerId);
  if (!player) return false;

  const newDamage = player.damageCount + additionalDamage;

  if (!currentLeaderId) {
    return newDamage > 0;
  }

  const currentLeader = players.find((p) => p.id === currentLeaderId);
  if (!currentLeader) return newDamage > 0;

  // Must SURPASS, not just tie
  return newDamage > currentLeader.damageCount;
}

// ============================================
// Exports
// ============================================

export default DamageTracker;
