// ============================================
// Gold Transaction Functions
// ============================================

import { Player } from "@/types/game";
import { CRAP_OUT_GOLD_PENALTY_PERCENT } from "./constants";

/**
 * Result of a gold transaction
 */
export interface GoldTransactionResult {
  success: boolean;
  newGold: number;
  amountChanged: number;
  error?: string;
}

/**
 * Add gold to a player
 * @param player - The player receiving gold
 * @param amount - Amount of gold to add (must be positive)
 * @returns Transaction result with new gold amount
 */
export function addGold(player: Player, amount: number): GoldTransactionResult {
  if (amount < 0) {
    return {
      success: false,
      newGold: player.gold,
      amountChanged: 0,
      error: "Cannot add negative gold. Use removeGold instead.",
    };
  }

  const newGold = player.gold + amount;
  return {
    success: true,
    newGold,
    amountChanged: amount,
  };
}

/**
 * Remove gold from a player
 * @param player - The player losing gold
 * @param amount - Amount of gold to remove (must be positive)
 * @returns Transaction result with new gold amount
 */
export function removeGold(
  player: Player,
  amount: number
): GoldTransactionResult {
  if (amount < 0) {
    return {
      success: false,
      newGold: player.gold,
      amountChanged: 0,
      error: "Cannot remove negative gold. Use addGold instead.",
    };
  }

  if (player.gold < amount) {
    return {
      success: false,
      newGold: player.gold,
      amountChanged: 0,
      error: `Insufficient gold. Player has ${player.gold} but needs ${amount}.`,
    };
  }

  const newGold = player.gold - amount;
  return {
    success: true,
    newGold,
    amountChanged: amount,
  };
}

/**
 * Calculate gold loss on crap-out (50% rounded down)
 * @param currentGold - Player's current gold
 * @returns Amount of gold to lose
 */
export function calculateCrapOutLoss(currentGold: number): number {
  return Math.floor(currentGold * CRAP_OUT_GOLD_PENALTY_PERCENT);
}

/**
 * Check if a player can afford a purchase
 * @param player - The player attempting purchase
 * @param cost - Cost of the item
 * @returns True if player has enough gold
 */
export function canAfford(player: Player, cost: number): boolean {
  return player.gold >= cost;
}

/**
 * Apply crap-out penalty to a player
 * @param player - The player who crapped out
 * @returns Transaction result with new gold amount and amount lost
 */
export function applyCrapOutPenalty(player: Player): GoldTransactionResult {
  const lossAmount = calculateCrapOutLoss(player.gold);
  const newGold = player.gold - lossAmount;

  return {
    success: true,
    newGold,
    amountChanged: lossAmount,
  };
}

/**
 * Transfer gold from one player to another
 * @param from - Player giving gold
 * @param to - Player receiving gold
 * @param amount - Amount to transfer
 * @returns Object containing both transaction results
 */
export function transferGold(
  from: Player,
  to: Player,
  amount: number
): {
  fromResult: GoldTransactionResult;
  toResult: GoldTransactionResult;
  success: boolean;
} {
  const fromResult = removeGold(from, amount);

  if (!fromResult.success) {
    return {
      fromResult,
      toResult: {
        success: false,
        newGold: to.gold,
        amountChanged: 0,
        error: "Transfer failed due to insufficient sender gold.",
      },
      success: false,
    };
  }

  const toResult = addGold(to, amount);

  return {
    fromResult,
    toResult,
    success: true,
  };
}

/**
 * Get display string for gold amount with sign
 * @param amount - Gold amount (positive or negative)
 * @returns Formatted string like "+5" or "-3"
 */
export function formatGoldChange(amount: number): string {
  if (amount >= 0) {
    return `+${amount}`;
  }
  return `${amount}`;
}

/**
 * Validate that a gold amount is valid (non-negative integer)
 * @param amount - Amount to validate
 * @returns True if valid
 */
export function isValidGoldAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0;
}
