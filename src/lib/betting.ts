// ============================================
// Betting System Functions
// ============================================

import type { Bet, BetType, Player } from "@/types/game";
import { canAfford } from "./gold";
import { MAX_BET_AMOUNT } from "./constants";

/**
 * Result of a bet validation
 */
export interface BetValidationResult {
  success: boolean;
  error?: string;
}

/**
 * Result of bet resolution (payouts)
 */
export interface BetResolutionResult {
  playerId: string;
  originalBet: Bet;
  goldChange: number;
  reason: string;
}

/**
 * Summary of all bets for display
 */
export interface BetSummary {
  forBets: { playerId: string; amount: number }[];
  againstBets: { playerId: string; amount: number }[];
  totalFor: number;
  totalAgainst: number;
  totalBettors: number;
}

// ============================================
// Bet Validation
// ============================================

/**
 * Validate if a player can place a bet
 * @param player - The player attempting to bet
 * @param betType - FOR or AGAINST
 * @param amount - Amount to bet
 * @param activePlayerId - ID of the active player (can't bet on yourself)
 * @param existingBets - Current bets to check for duplicates
 * @returns Validation result
 */
export function validateBet(
  player: Player,
  betType: BetType,
  amount: number,
  activePlayerId: string,
  existingBets: Bet[]
): BetValidationResult {
  // Can't bet on yourself
  if (player.id === activePlayerId) {
    return {
      success: false,
      error: "You cannot bet on your own turn.",
    };
  }

  // Check amount is positive
  if (amount <= 0) {
    return {
      success: false,
      error: "Bet amount must be greater than 0.",
    };
  }

  // Check amount is an integer
  if (!Number.isInteger(amount)) {
    return {
      success: false,
      error: "Bet amount must be a whole number.",
    };
  }

  // Check max bet limit
  if (amount > MAX_BET_AMOUNT) {
    return {
      success: false,
      error: `Maximum bet is ${MAX_BET_AMOUNT} gold.`,
    };
  }

  // Check if player can afford the bet
  if (!canAfford(player, amount)) {
    return {
      success: false,
      error: `Not enough gold. You have ${player.gold}, trying to bet ${amount}.`,
    };
  }

  // Check if player already has a bet
  const existingBet = existingBets.find((b) => b.playerId === player.id);
  if (existingBet) {
    return {
      success: false,
      error: "You have already placed a bet this turn.",
    };
  }

  return { success: true };
}

/**
 * Create a bet object
 * @param playerId - ID of the betting player
 * @param betType - FOR or AGAINST
 * @param amount - Amount to bet
 * @returns Bet object
 */
export function createBet(
  playerId: string,
  betType: BetType,
  amount: number
): Bet {
  return {
    playerId,
    type: betType,
    amount,
  };
}

// ============================================
// Bet Queries
// ============================================

/**
 * Get summary of all bets
 * @param bets - Array of current bets
 * @returns Summary object with totals
 */
export function getBetSummary(bets: Bet[]): BetSummary {
  const forBets: { playerId: string; amount: number }[] = [];
  const againstBets: { playerId: string; amount: number }[] = [];
  let totalFor = 0;
  let totalAgainst = 0;

  for (const bet of bets) {
    if (bet.type === "FOR") {
      forBets.push({ playerId: bet.playerId, amount: bet.amount });
      totalFor += bet.amount;
    } else {
      againstBets.push({ playerId: bet.playerId, amount: bet.amount });
      totalAgainst += bet.amount;
    }
  }

  return {
    forBets,
    againstBets,
    totalFor,
    totalAgainst,
    totalBettors: bets.length,
  };
}

/**
 * Get bets by type
 * @param bets - All bets
 * @param betType - Type to filter by
 * @returns Filtered bets
 */
export function getBetsByType(bets: Bet[], betType: BetType): Bet[] {
  return bets.filter((b) => b.type === betType);
}

/**
 * Get a player's bet
 * @param bets - All bets
 * @param playerId - Player ID to find
 * @returns The player's bet or undefined
 */
export function getPlayerBet(bets: Bet[], playerId: string): Bet | undefined {
  return bets.find((b) => b.playerId === playerId);
}

/**
 * Check if a player has already bet
 * @param bets - All bets
 * @param playerId - Player ID to check
 * @returns True if player has placed a bet
 */
export function hasPlayerBet(bets: Bet[], playerId: string): boolean {
  return bets.some((b) => b.playerId === playerId);
}

// ============================================
// Bet Resolution - Come-Out Roll
// ============================================

/**
 * Process bets on a come-out natural (7 or 11)
 * All bets disappear - no one wins or loses
 * @param bets - Current bets
 * @returns Array of resolution results (bets returned)
 */
export function processComeOutNatural(bets: Bet[]): BetResolutionResult[] {
  return bets.map((bet) => ({
    playerId: bet.playerId,
    originalBet: bet,
    goldChange: bet.amount, // Return the bet
    reason: "Natural rolled - bet returned",
  }));
}

/**
 * Process bets on a come-out craps (2, 3, or 12)
 * FOR bets lose, AGAINST bets win (doubled)
 * @param bets - Current bets
 * @returns Array of resolution results
 */
export function processComeOutCraps(bets: Bet[]): BetResolutionResult[] {
  return bets.map((bet) => {
    if (bet.type === "FOR") {
      return {
        playerId: bet.playerId,
        originalBet: bet,
        goldChange: 0, // Lose the bet
        reason: "Craps rolled - FOR bet lost",
      };
    } else {
      return {
        playerId: bet.playerId,
        originalBet: bet,
        goldChange: bet.amount * 2, // Double the bet
        reason: "Craps rolled - AGAINST bet doubled",
      };
    }
  });
}

// ============================================
// Bet Resolution - Point Phase
// ============================================

/**
 * Process bet payouts when shooter hits a monster number or point
 * FOR bettors gain +1 gold each (per hit)
 * @param bets - Current bets
 * @returns Array of resolution results
 */
export function processPointPhaseHit(bets: Bet[]): BetResolutionResult[] {
  const forBets = getBetsByType(bets, "FOR");

  return forBets.map((bet) => ({
    playerId: bet.playerId,
    originalBet: bet,
    goldChange: 1, // +1 gold per hit
    reason: "Monster hit - FOR bettor gains +1",
  }));
}

/**
 * Process bets when monster is defeated
 * FOR bets win (return + winnings from hits)
 * AGAINST bets lose (shooter collects)
 * @param bets - Current bets
 * @param hitsCount - Number of hits during the turn
 * @returns Array of resolution results
 */
export function processMonsterDefeated(
  bets: Bet[],
  hitsCount: number
): BetResolutionResult[] {
  return bets.map((bet) => {
    if (bet.type === "FOR") {
      // FOR bettors get their bet back + hits bonus (already given per hit)
      return {
        playerId: bet.playerId,
        originalBet: bet,
        goldChange: bet.amount, // Return original bet
        reason: `Monster defeated - FOR bet returned (already earned ${hitsCount} from hits)`,
      };
    } else {
      // AGAINST bets go to shooter - bettor loses
      return {
        playerId: bet.playerId,
        originalBet: bet,
        goldChange: 0, // Lose the bet
        reason: "Monster defeated - AGAINST bet lost to shooter",
      };
    }
  });
}

/**
 * Calculate total AGAINST bet pool that goes to shooter
 * @param bets - Current bets
 * @returns Total gold from AGAINST bets
 */
export function calculateShooterWinnings(bets: Bet[]): number {
  const againstBets = getBetsByType(bets, "AGAINST");
  return againstBets.reduce((sum, bet) => sum + bet.amount, 0);
}

/**
 * Process bets when shooter craps out (rolls 7 in point phase)
 * FOR bets lose, AGAINST bets win (doubled)
 * @param bets - Current bets
 * @returns Array of resolution results
 */
export function processCrapOut(bets: Bet[]): BetResolutionResult[] {
  return bets.map((bet) => {
    if (bet.type === "FOR") {
      return {
        playerId: bet.playerId,
        originalBet: bet,
        goldChange: 0, // Lose the bet
        reason: "Shooter crapped out - FOR bet lost",
      };
    } else {
      return {
        playerId: bet.playerId,
        originalBet: bet,
        goldChange: bet.amount * 2, // Double the bet
        reason: "Shooter crapped out - AGAINST bet doubled",
      };
    }
  });
}

// ============================================
// Bet Resolution - Escape
// ============================================

/**
 * Process bets when shooter takes escape offer
 * All bets are returned (no resolution)
 * @param bets - Current bets
 * @returns Array of resolution results
 */
export function processEscape(bets: Bet[]): BetResolutionResult[] {
  return bets.map((bet) => ({
    playerId: bet.playerId,
    originalBet: bet,
    goldChange: bet.amount, // Return the bet
    reason: "Shooter escaped - bet returned",
  }));
}

// ============================================
// Display Helpers
// ============================================

/**
 * Format bet for display
 * @param bet - The bet to format
 * @param playerName - Name of the betting player
 * @returns Formatted string
 */
export function formatBetDisplay(bet: Bet, playerName: string): string {
  return `${playerName} bets ${bet.amount}g ${bet.type}`;
}

/**
 * Get bet type color class
 * @param betType - FOR or AGAINST
 * @returns Tailwind color class
 */
export function getBetTypeColor(betType: BetType): {
  bg: string;
  text: string;
  border: string;
} {
  if (betType === "FOR") {
    return {
      bg: "bg-green-100",
      text: "text-green-700",
      border: "border-green-400",
    };
  }
  return {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-400",
  };
}

/**
 * Get bet type label with icon
 * @param betType - FOR or AGAINST
 * @returns Label string with icon
 */
export function getBetTypeLabel(betType: BetType): string {
  return betType === "FOR" ? "👍 FOR" : "👎 AGAINST";
}
