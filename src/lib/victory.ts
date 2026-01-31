// ============================================
// Victory Point Tracking Functions
// ============================================

import { Player } from "@/types/game";
import { VICTORY_POINTS_TO_WIN, DAMAGE_LEADER_BONUS } from "./constants";

/**
 * Result of adding victory points
 */
export interface VictoryPointResult {
  newPoints: number;
  pointsAdded: number;
  hasWon: boolean;
}

/**
 * Add victory points to a player
 * @param player - The player receiving points
 * @param points - Points to add (must be non-negative)
 * @returns Result with new point total and win status
 */
export function addVictoryPoints(
  player: Player,
  points: number
): VictoryPointResult {
  if (points < 0) {
    return {
      newPoints: player.victoryPoints,
      pointsAdded: 0,
      hasWon: checkVictory(player),
    };
  }

  const newPoints = player.victoryPoints + points;
  return {
    newPoints,
    pointsAdded: points,
    hasWon: newPoints >= VICTORY_POINTS_TO_WIN,
  };
}

/**
 * Check if a player has reached the victory point threshold
 * Does NOT include damage leader bonus - use checkVictoryWithBonus for that
 * @param player - The player to check
 * @returns True if player has 10+ victory points (base only)
 */
export function checkVictory(player: Player): boolean {
  return player.victoryPoints >= VICTORY_POINTS_TO_WIN;
}

/**
 * Check if a player has won including damage leader bonus
 * @param player - The player to check
 * @param isDamageLeader - Whether this player is the damage leader
 * @returns True if player's effective points >= 10
 */
export function checkVictoryWithBonus(
  player: Player,
  isDamageLeader: boolean
): boolean {
  const effectivePoints = getEffectiveVictoryPoints(player, isDamageLeader);
  return effectivePoints >= VICTORY_POINTS_TO_WIN;
}

/**
 * Get player's effective victory points including damage leader bonus
 * @param player - The player
 * @param isDamageLeader - Whether this player is the damage leader
 * @returns Total victory points including bonus
 */
export function getEffectiveVictoryPoints(
  player: Player,
  isDamageLeader: boolean
): number {
  const bonus = isDamageLeader ? DAMAGE_LEADER_BONUS : 0;
  return player.victoryPoints + bonus;
}

/**
 * Get the winner from a list of players
 * Returns null if no winner yet
 * @param players - Array of players to check
 * @param damageLeaderId - ID of current damage leader (for bonus calculation)
 * @returns The winning player or null
 */
export function getWinner(
  players: Player[],
  damageLeaderId: string | null
): Player | null {
  for (const player of players) {
    const isDamageLeader = player.id === damageLeaderId;
    if (checkVictoryWithBonus(player, isDamageLeader)) {
      return player;
    }
  }
  return null;
}

/**
 * Get all players who have reached the victory threshold
 * Used for tie-breaker scenarios
 * @param players - Array of players to check
 * @param damageLeaderId - ID of current damage leader
 * @returns Array of winning players
 */
export function getWinners(
  players: Player[],
  damageLeaderId: string | null
): Player[] {
  return players.filter((player) => {
    const isDamageLeader = player.id === damageLeaderId;
    return checkVictoryWithBonus(player, isDamageLeader);
  });
}

/**
 * Resolve tie-breaker between multiple winners
 * Tie-breaker order: 1) Total VP, 2) Gold, 3) Permanent card count
 * @param winners - Array of players who reached victory threshold
 * @param damageLeaderId - ID of current damage leader
 * @returns Single winner or null if true tie
 */
export function resolveTieBreaker(
  winners: Player[],
  damageLeaderId: string | null
): Player | null {
  if (winners.length === 0) return null;
  if (winners.length === 1) return winners[0];

  // Sort by: effective VP (desc), gold (desc), permanent cards (desc)
  const sorted = [...winners].sort((a, b) => {
    // First: compare effective victory points
    const aPoints = getEffectiveVictoryPoints(a, a.id === damageLeaderId);
    const bPoints = getEffectiveVictoryPoints(b, b.id === damageLeaderId);
    if (bPoints !== aPoints) return bPoints - aPoints;

    // Second: compare gold
    if (b.gold !== a.gold) return b.gold - a.gold;

    // Third: compare permanent card count
    return b.permanentCards.length - a.permanentCards.length;
  });

  // Check if there's still a tie after all criteria
  const first = sorted[0];
  const second = sorted[1];
  const firstPoints = getEffectiveVictoryPoints(
    first,
    first.id === damageLeaderId
  );
  const secondPoints = getEffectiveVictoryPoints(
    second,
    second.id === damageLeaderId
  );

  if (
    firstPoints === secondPoints &&
    first.gold === second.gold &&
    first.permanentCards.length === second.permanentCards.length
  ) {
    // True tie - return null to indicate shared victory
    return null;
  }

  return sorted[0];
}

/**
 * Get player ranking by victory points
 * @param players - Array of players
 * @param damageLeaderId - ID of current damage leader
 * @returns Players sorted by effective victory points (descending)
 */
export function getPlayerRankings(
  players: Player[],
  damageLeaderId: string | null
): Player[] {
  return [...players].sort((a, b) => {
    const aPoints = getEffectiveVictoryPoints(a, a.id === damageLeaderId);
    const bPoints = getEffectiveVictoryPoints(b, b.id === damageLeaderId);
    return bPoints - aPoints;
  });
}

/**
 * Calculate points needed to win for a player
 * @param player - The player
 * @param isDamageLeader - Whether this player is the damage leader
 * @returns Points needed to reach victory (0 if already won)
 */
export function pointsToWin(player: Player, isDamageLeader: boolean): number {
  const effectivePoints = getEffectiveVictoryPoints(player, isDamageLeader);
  const needed = VICTORY_POINTS_TO_WIN - effectivePoints;
  return Math.max(0, needed);
}

/**
 * Format victory points display with optional damage leader indicator
 * @param player - The player
 * @param isDamageLeader - Whether this player is the damage leader
 * @returns Formatted string like "7 VP" or "7 VP (+3)"
 */
export function formatVictoryPoints(
  player: Player,
  isDamageLeader: boolean
): string {
  if (isDamageLeader) {
    return `${player.victoryPoints} VP (+${DAMAGE_LEADER_BONUS})`;
  }
  return `${player.victoryPoints} VP`;
}
