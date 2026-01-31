// ============================================
// Card Hand Management Functions
// ============================================

import { Player, PermanentCard, SingleUseCard } from "@/types/game";
import { MAX_PERMANENT_CARDS, MAX_SINGLE_USE_CARDS } from "./constants";

/**
 * Result of a card operation
 */
export interface CardOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Result of adding a card to hand
 */
export interface AddCardResult extends CardOperationResult {
  permanentCards?: PermanentCard[];
  singleUseCards?: SingleUseCard[];
}

/**
 * Result of using/discarding a card
 */
export interface UseCardResult extends CardOperationResult {
  card?: SingleUseCard;
  singleUseCards?: SingleUseCard[];
}

/**
 * Result of discarding entire hand
 */
export interface DiscardHandResult {
  permanentCards: PermanentCard[];
  singleUseCards: SingleUseCard[];
  discardedPermanent: PermanentCard[];
  discardedSingleUse: SingleUseCard[];
}

// ============================================
// Capacity Checks
// ============================================

/**
 * Check if player can hold another permanent card
 * @param player - The player to check
 * @returns True if under the max limit (6)
 */
export function canHoldPermanent(player: Player): boolean {
  return player.permanentCards.length < MAX_PERMANENT_CARDS;
}

/**
 * Check if player can hold another single-use card
 * @param player - The player to check
 * @returns True if under the max limit (8)
 */
export function canHoldSingleUse(player: Player): boolean {
  return player.singleUseCards.length < MAX_SINGLE_USE_CARDS;
}

/**
 * Get remaining permanent card slots
 * @param player - The player to check
 * @returns Number of available slots
 */
export function getRemainingPermanentSlots(player: Player): number {
  return MAX_PERMANENT_CARDS - player.permanentCards.length;
}

/**
 * Get remaining single-use card slots
 * @param player - The player to check
 * @returns Number of available slots
 */
export function getRemainingSingleUseSlots(player: Player): number {
  return MAX_SINGLE_USE_CARDS - player.singleUseCards.length;
}

// ============================================
// Add Cards
// ============================================

/**
 * Add a permanent card to player's hand
 * @param player - The player receiving the card
 * @param card - The permanent card to add
 * @returns Result with new hand array or error
 */
export function addPermanentCard(
  player: Player,
  card: PermanentCard
): AddCardResult {
  if (!canHoldPermanent(player)) {
    return {
      success: false,
      error: `Cannot add permanent card. Player already has maximum (${MAX_PERMANENT_CARDS}).`,
    };
  }

  // Check for duplicate card by ID
  if (player.permanentCards.some((c) => c.id === card.id)) {
    return {
      success: false,
      error: "Cannot add duplicate card (same ID already in hand).",
    };
  }

  return {
    success: true,
    permanentCards: [...player.permanentCards, card],
  };
}

/**
 * Add a single-use card to player's hand
 * @param player - The player receiving the card
 * @param card - The single-use card to add
 * @returns Result with new hand array or error
 */
export function addSingleUseCard(
  player: Player,
  card: SingleUseCard
): AddCardResult {
  if (!canHoldSingleUse(player)) {
    return {
      success: false,
      error: `Cannot add single-use card. Player already has maximum (${MAX_SINGLE_USE_CARDS}).`,
    };
  }

  // Check for duplicate card by ID
  if (player.singleUseCards.some((c) => c.id === card.id)) {
    return {
      success: false,
      error: "Cannot add duplicate card (same ID already in hand).",
    };
  }

  return {
    success: true,
    singleUseCards: [...player.singleUseCards, card],
  };
}

// ============================================
// Use/Remove Cards
// ============================================

/**
 * Use (consume) a single-use card from player's hand
 * @param player - The player using the card
 * @param cardId - ID of the card to use
 * @returns Result with the used card and new hand array
 */
export function useSingleUseCard(
  player: Player,
  cardId: string
): UseCardResult {
  const cardIndex = player.singleUseCards.findIndex((c) => c.id === cardId);

  if (cardIndex === -1) {
    return {
      success: false,
      error: `Card with ID "${cardId}" not found in player's hand.`,
    };
  }

  const card = player.singleUseCards[cardIndex];
  const newHand = player.singleUseCards.filter((c) => c.id !== cardId);

  return {
    success: true,
    card,
    singleUseCards: newHand,
  };
}

/**
 * Remove a permanent card from player's hand
 * Used for special mechanics that remove permanent cards
 * @param player - The player
 * @param cardId - ID of the card to remove
 * @returns Result with new hand array
 */
export function removePermanentCard(
  player: Player,
  cardId: string
): AddCardResult {
  const cardIndex = player.permanentCards.findIndex((c) => c.id === cardId);

  if (cardIndex === -1) {
    return {
      success: false,
      error: `Permanent card with ID "${cardId}" not found in player's hand.`,
    };
  }

  const newHand = player.permanentCards.filter((c) => c.id !== cardId);

  return {
    success: true,
    permanentCards: newHand,
  };
}

// ============================================
// Discard Operations
// ============================================

/**
 * Discard all cards from player's hand (used for revive mechanic)
 * @param player - The player discarding their hand
 * @returns Result with empty hands and discarded cards
 */
export function discardHand(player: Player): DiscardHandResult {
  return {
    permanentCards: [],
    singleUseCards: [],
    discardedPermanent: [...player.permanentCards],
    discardedSingleUse: [...player.singleUseCards],
  };
}

/**
 * Discard only single-use cards (keep permanent cards)
 * @param player - The player
 * @returns New single-use cards array (empty) and discarded cards
 */
export function discardSingleUseCards(player: Player): {
  singleUseCards: SingleUseCard[];
  discarded: SingleUseCard[];
} {
  return {
    singleUseCards: [],
    discarded: [...player.singleUseCards],
  };
}

// ============================================
// Card Queries
// ============================================

/**
 * Find a permanent card in player's hand by ID
 * @param player - The player
 * @param cardId - ID to search for
 * @returns The card or undefined
 */
export function findPermanentCard(
  player: Player,
  cardId: string
): PermanentCard | undefined {
  return player.permanentCards.find((c) => c.id === cardId);
}

/**
 * Find a single-use card in player's hand by ID
 * @param player - The player
 * @param cardId - ID to search for
 * @returns The card or undefined
 */
export function findSingleUseCard(
  player: Player,
  cardId: string
): SingleUseCard | undefined {
  return player.singleUseCards.find((c) => c.id === cardId);
}

/**
 * Check if player has a specific permanent card effect
 * @param player - The player
 * @param effect - The effect to check for
 * @returns True if player has at least one card with this effect
 */
export function hasPermanentEffect(
  player: Player,
  effect: PermanentCard["effect"]
): boolean {
  return player.permanentCards.some((c) => c.effect === effect);
}

/**
 * Check if player has a specific single-use card effect
 * @param player - The player
 * @param effect - The effect to check for
 * @returns True if player has at least one card with this effect
 */
export function hasSingleUseEffect(
  player: Player,
  effect: SingleUseCard["effect"]
): boolean {
  return player.singleUseCards.some((c) => c.effect === effect);
}

/**
 * Get all permanent cards with a specific effect
 * @param player - The player
 * @param effect - The effect to filter by
 * @returns Array of matching cards
 */
export function getPermanentCardsWithEffect(
  player: Player,
  effect: PermanentCard["effect"]
): PermanentCard[] {
  return player.permanentCards.filter((c) => c.effect === effect);
}

/**
 * Get all single-use cards with a specific effect
 * @param player - The player
 * @param effect - The effect to filter by
 * @returns Array of matching cards
 */
export function getSingleUseCardsWithEffect(
  player: Player,
  effect: SingleUseCard["effect"]
): SingleUseCard[] {
  return player.singleUseCards.filter((c) => c.effect === effect);
}

/**
 * Get total count of all cards in hand
 * @param player - The player
 * @returns Total card count
 */
export function getTotalCardCount(player: Player): number {
  return player.permanentCards.length + player.singleUseCards.length;
}

/**
 * Check if player's hand is empty
 * @param player - The player
 * @returns True if no cards in hand
 */
export function isHandEmpty(player: Player): boolean {
  return getTotalCardCount(player) === 0;
}
