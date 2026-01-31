// ============================================
// Marketplace Functions
// ============================================

import type { Card, Player, Marketplace } from "@/types/game";
import { MARKETPLACE_REFRESH_COST, MARKETPLACE_SIZE } from "./constants";
import { canAfford } from "./gold";
import { canHoldPermanent, canHoldSingleUse } from "./cardHand";
import { isPermanentCard, isSingleUseCard, isPointCard } from "./cardDeck";

/**
 * Result of a marketplace operation
 */
export interface MarketplaceOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Result of a card purchase validation
 */
export interface PurchaseValidationResult extends MarketplaceOperationResult {
  card?: Card;
  canHold?: boolean;
  canAffordCard?: boolean;
}

/**
 * Result of a marketplace refresh validation
 */
export interface RefreshValidationResult extends MarketplaceOperationResult {
  cost: number;
  currentGold: number;
}

// ============================================
// Validation Functions
// ============================================

/**
 * Check if a player can afford to refresh the marketplace
 * @param player - The player attempting to refresh
 * @returns Validation result with cost and current gold
 */
export function canRefreshMarketplace(player: Player): RefreshValidationResult {
  const hasEnoughGold = canAfford(player, MARKETPLACE_REFRESH_COST);

  if (!hasEnoughGold) {
    return {
      success: false,
      error: `Not enough gold. Refresh costs ${MARKETPLACE_REFRESH_COST}, you have ${player.gold}.`,
      cost: MARKETPLACE_REFRESH_COST,
      currentGold: player.gold,
    };
  }

  return {
    success: true,
    cost: MARKETPLACE_REFRESH_COST,
    currentGold: player.gold,
  };
}

/**
 * Validate if a player can purchase a specific card
 * @param player - The player attempting to purchase
 * @param marketplace - The current marketplace
 * @param cardId - ID of the card to purchase
 * @returns Validation result with card info
 */
export function validateCardPurchase(
  player: Player,
  marketplace: Marketplace,
  cardId: string
): PurchaseValidationResult {
  // Find the card in the marketplace
  const card = marketplace.cards.find((c) => c.id === cardId);

  if (!card) {
    return {
      success: false,
      error: "Card not found in marketplace.",
    };
  }

  // Check if player can afford the card
  const canAffordCard = canAfford(player, card.cost);

  if (!canAffordCard) {
    return {
      success: false,
      error: `Not enough gold. Card costs ${card.cost}, you have ${player.gold}.`,
      card,
      canHold: true,
      canAffordCard: false,
    };
  }

  // Check hand limits based on card type
  if (isPermanentCard(card)) {
    if (!canHoldPermanent(player)) {
      return {
        success: false,
        error: "Cannot hold more permanent cards. Max limit reached.",
        card,
        canHold: false,
        canAffordCard: true,
      };
    }
  } else if (isSingleUseCard(card)) {
    if (!canHoldSingleUse(player)) {
      return {
        success: false,
        error: "Cannot hold more single-use cards. Max limit reached.",
        card,
        canHold: false,
        canAffordCard: true,
      };
    }
  }
  // Point cards are consumed immediately, no hand limit check needed

  return {
    success: true,
    card,
    canHold: true,
    canAffordCard: true,
  };
}

// ============================================
// Marketplace Queries
// ============================================

/**
 * Get all purchasable cards for a player
 * @param player - The player checking
 * @param marketplace - The current marketplace
 * @returns Array of cards the player can afford and hold
 */
export function getAffordableCards(
  player: Player,
  marketplace: Marketplace
): Card[] {
  return marketplace.cards.filter((card) => {
    const validation = validateCardPurchase(player, marketplace, card.id);
    return validation.success;
  });
}

/**
 * Get cards grouped by type from marketplace
 * @param marketplace - The marketplace to analyze
 * @returns Object with arrays for each card type
 */
export function getMarketplaceByType(marketplace: Marketplace): {
  permanent: Card[];
  singleUse: Card[];
  point: Card[];
} {
  const permanent: Card[] = [];
  const singleUse: Card[] = [];
  const point: Card[] = [];

  for (const card of marketplace.cards) {
    if (isPermanentCard(card)) {
      permanent.push(card);
    } else if (isSingleUseCard(card)) {
      singleUse.push(card);
    } else if (isPointCard(card)) {
      point.push(card);
    }
  }

  return { permanent, singleUse, point };
}

/**
 * Check if the marketplace is empty or nearly empty
 * @param marketplace - The marketplace to check
 * @returns True if less than minimum threshold cards remain
 */
export function isMarketplaceLow(
  marketplace: Marketplace,
  threshold: number = 3
): boolean {
  return marketplace.cards.length < threshold;
}

/**
 * Get marketplace card count
 * @param marketplace - The marketplace
 * @returns Number of cards in marketplace
 */
export function getMarketplaceCardCount(marketplace: Marketplace): number {
  return marketplace.cards.length;
}

/**
 * Check if marketplace is full
 * @param marketplace - The marketplace
 * @returns True if at maximum size
 */
export function isMarketplaceFull(marketplace: Marketplace): boolean {
  return marketplace.cards.length >= MARKETPLACE_SIZE;
}

/**
 * Get card by ID from marketplace
 * @param marketplace - The marketplace
 * @param cardId - ID of card to find
 * @returns The card or undefined
 */
export function getMarketplaceCard(
  marketplace: Marketplace,
  cardId: string
): Card | undefined {
  return marketplace.cards.find((c) => c.id === cardId);
}

// ============================================
// Card Display Helpers
// ============================================

/**
 * Get a short description of a card for display
 * @param card - The card to describe
 * @returns Short description string
 */
export function getCardDisplayInfo(card: Card): {
  name: string;
  cost: number;
  type: string;
  description: string;
  icon: string;
} {
  const typeLabels = {
    permanent: "Permanent",
    single_use: "Single Use",
    point: "Victory Points",
  };

  let description = "";
  let icon = "";

  if (isPermanentCard(card)) {
    description = card.description;
    icon = getPermanentCardIcon(card.effect);
  } else if (isSingleUseCard(card)) {
    description = card.description;
    icon = getSingleUseCardIcon(card.effect);
  } else if (isPointCard(card)) {
    description = `Gain ${card.points} victory point${card.points > 1 ? "s" : ""}`;
    icon = "⭐";
  }

  return {
    name: card.name,
    cost: card.cost,
    type: typeLabels[card.type],
    description,
    icon,
  };
}

/**
 * Get icon for permanent card effect
 */
function getPermanentCardIcon(
  effect: import("@/types/game").PermanentCardEffect
): string {
  const icons: Record<import("@/types/game").PermanentCardEffect, string> = {
    PLUS_ONE_DIE: "🎲",
    REROLL: "🔄",
    SHIELD: "🛡️",
    LUCKY: "🍀",
    ARMOR: "🛡️",
    POINT_BONUS: "✨",
    DOUBLE: "⚔️",
  };
  return icons[effect] || "📜";
}

/**
 * Get icon for single-use card effect
 */
function getSingleUseCardIcon(
  effect: import("@/types/game").SingleUseCardEffect
): string {
  const icons: Record<import("@/types/game").SingleUseCardEffect, string> = {
    STUN: "💫",
    RAPID_FIRE: "⚡",
    MOMENTUM: "🔥",
    CHARM: "💫",
    CURSE: "💀",
    HEAL: "💚",
  };
  return icons[effect] || "📜";
}

/**
 * Sort marketplace cards by cost
 * @param cards - Array of cards to sort
 * @param ascending - Sort direction (default: ascending)
 * @returns Sorted array of cards
 */
export function sortCardsByCost(
  cards: Card[],
  ascending: boolean = true
): Card[] {
  return [...cards].sort((a, b) =>
    ascending ? a.cost - b.cost : b.cost - a.cost
  );
}

/**
 * Sort marketplace cards by type then cost
 * @param cards - Array of cards to sort
 * @returns Sorted array (permanent, single-use, point, then by cost)
 */
export function sortCardsByTypeAndCost(cards: Card[]): Card[] {
  const typeOrder = { permanent: 0, single_use: 1, point: 2 };

  return [...cards].sort((a, b) => {
    const typeCompare = typeOrder[a.type] - typeOrder[b.type];
    if (typeCompare !== 0) return typeCompare;
    return a.cost - b.cost;
  });
}
