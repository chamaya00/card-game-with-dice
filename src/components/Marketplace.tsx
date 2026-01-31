"use client";

import React, { useState } from "react";
import type {
  Card,
  Player,
  Marketplace as MarketplaceType,
  PermanentCard,
  SingleUseCard,
  PointCard,
} from "@/types/game";
import {
  MARKETPLACE_REFRESH_COST,
  MARKETPLACE_SIZE,
  MAX_PERMANENT_CARDS,
  MAX_SINGLE_USE_CARDS,
} from "@/lib/constants";
import {
  canRefreshMarketplace,
  validateCardPurchase,
  getCardDisplayInfo,
  sortCardsByTypeAndCost,
} from "@/lib/marketplace";
import { isPermanentCard, isSingleUseCard, isPointCard } from "@/lib/cardDeck";
import { canHoldPermanent, canHoldSingleUse } from "@/lib/cardHand";

// ============================================
// Card Display Components
// ============================================

interface MarketplaceCardProps {
  card: Card;
  canAfford: boolean;
  canHold: boolean;
  onPurchase?: () => void;
  disabled?: boolean;
}

function MarketplaceCard({
  card,
  canAfford,
  canHold,
  onPurchase,
  disabled = false,
}: MarketplaceCardProps) {
  const info = getCardDisplayInfo(card);
  const canBuy = canAfford && canHold && !disabled;

  // Get card type styling
  const getTypeStyles = () => {
    if (isPermanentCard(card)) {
      return {
        bg: "bg-blue-50",
        border: "border-blue-300",
        badge: "bg-blue-500",
        badgeText: "PERM",
      };
    } else if (isSingleUseCard(card)) {
      return {
        bg: "bg-amber-50",
        border: "border-amber-300",
        badge: "bg-amber-500",
        badgeText: "USE",
      };
    } else {
      return {
        bg: "bg-purple-50",
        border: "border-purple-300",
        badge: "bg-purple-500",
        badgeText: "VP",
      };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`
        relative flex flex-col rounded-lg border-2 overflow-hidden
        transition-all duration-200
        ${styles.bg} ${styles.border}
        ${canBuy ? "hover:shadow-lg hover:scale-[1.02] cursor-pointer" : "opacity-60"}
        ${!canAfford ? "grayscale" : ""}
      `}
      onClick={canBuy ? onPurchase : undefined}
      role={canBuy ? "button" : undefined}
      tabIndex={canBuy ? 0 : undefined}
      onKeyDown={(e) => {
        if (canBuy && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onPurchase?.();
        }
      }}
      aria-label={`${card.name} - ${info.cost} gold${!canBuy ? " (cannot purchase)" : ""}`}
    >
      {/* Type Badge */}
      <div
        className={`
          absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-white
          ${styles.badge}
        `}
      >
        {styles.badgeText}
      </div>

      {/* Card Content */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Icon and Name */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info.icon}</span>
          <span className="font-semibold text-gray-800 text-sm leading-tight">
            {card.name}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-snug flex-1">
          {info.description}
        </p>

        {/* Cost and Status */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <span className="text-base">🪙</span>
            <span
              className={`font-bold ${canAfford ? "text-yellow-600" : "text-red-500"}`}
            >
              {info.cost}
            </span>
          </div>

          {!canHold && (
            <span className="text-[10px] text-red-500 font-medium">
              Hand Full
            </span>
          )}
        </div>
      </div>

      {/* Purchase Button */}
      {canBuy && (
        <div className="bg-green-500 hover:bg-green-600 text-white text-center py-1.5 text-xs font-semibold transition-colors">
          Purchase
        </div>
      )}
    </div>
  );
}

// ============================================
// Empty Slot Component
// ============================================

function EmptySlot() {
  return (
    <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 min-h-[140px]">
      <span className="text-gray-400 text-sm">Sold</span>
    </div>
  );
}

// ============================================
// Main Marketplace Component
// ============================================

export interface MarketplaceProps {
  /** The current marketplace state */
  marketplace: MarketplaceType;
  /** The active player (who can purchase) */
  player: Player;
  /** Whether it's currently the shopping phase */
  isShoppingPhase: boolean;
  /** Callback when a card is purchased */
  onPurchaseCard?: (cardId: string) => void;
  /** Callback when marketplace is refreshed */
  onRefresh?: () => void;
  /** Custom className */
  className?: string;
}

export function Marketplace({
  marketplace,
  player,
  isShoppingPhase,
  onPurchaseCard,
  onRefresh,
  className = "",
}: MarketplaceProps) {
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const refreshValidation = canRefreshMarketplace(player);
  const sortedCards = sortCardsByTypeAndCost(marketplace.cards);

  const handleRefresh = () => {
    if (confirmRefresh) {
      onRefresh?.();
      setConfirmRefresh(false);
    } else {
      setConfirmRefresh(true);
    }
  };

  const handleCancelRefresh = () => {
    setConfirmRefresh(false);
  };

  // Create array of size MARKETPLACE_SIZE with cards or empty slots
  const slots: (Card | null)[] = Array(MARKETPLACE_SIZE).fill(null);
  sortedCards.forEach((card, index) => {
    slots[index] = card;
  });

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏪</span>
          <h2 className="font-bold text-gray-800 text-lg">Marketplace</h2>
          <span className="text-sm text-gray-500">
            ({marketplace.cards.length}/{MARKETPLACE_SIZE})
          </span>
        </div>

        {/* Refresh Button */}
        {isShoppingPhase && (
          <div className="flex items-center gap-2">
            {confirmRefresh ? (
              <>
                <span className="text-sm text-gray-600">
                  Spend {MARKETPLACE_REFRESH_COST}🪙 to refresh?
                </span>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={handleCancelRefresh}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleRefresh}
                disabled={!refreshValidation.success}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${
                    refreshValidation.success
                      ? "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }
                `}
                title={
                  refreshValidation.success
                    ? `Refresh marketplace for ${MARKETPLACE_REFRESH_COST} gold`
                    : refreshValidation.error
                }
              >
                <span>🔄</span>
                <span>Refresh</span>
                <span className="flex items-center gap-0.5">
                  (<span className="text-yellow-600">🪙</span>
                  {MARKETPLACE_REFRESH_COST})
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Player Gold & Capacity Info */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-1">
          <span>🪙</span>
          <span className="font-medium text-yellow-600">{player.gold}</span>
          <span>gold</span>
        </div>
        <div className="flex items-center gap-1">
          <span>📦</span>
          <span
            className={
              player.permanentCards.length >= MAX_PERMANENT_CARDS
                ? "text-red-500 font-medium"
                : ""
            }
          >
            {player.permanentCards.length}/{MAX_PERMANENT_CARDS}
          </span>
          <span>perm</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⚡</span>
          <span
            className={
              player.singleUseCards.length >= MAX_SINGLE_USE_CARDS
                ? "text-red-500 font-medium"
                : ""
            }
          >
            {player.singleUseCards.length}/{MAX_SINGLE_USE_CARDS}
          </span>
          <span>use</span>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {slots.map((card, index) =>
          card ? (
            <MarketplaceCard
              key={card.id}
              card={card}
              canAfford={player.gold >= card.cost}
              canHold={
                isPermanentCard(card)
                  ? canHoldPermanent(player)
                  : isSingleUseCard(card)
                    ? canHoldSingleUse(player)
                    : true // Point cards always "holdable" (consumed immediately)
              }
              onPurchase={
                isShoppingPhase ? () => onPurchaseCard?.(card.id) : undefined
              }
              disabled={!isShoppingPhase}
            />
          ) : (
            <EmptySlot key={`empty-${index}`} />
          )
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-blue-500" />
          <span>Permanent</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-amber-500" />
          <span>Single Use</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-3 h-3 rounded bg-purple-500" />
          <span>Victory Points</span>
        </div>
      </div>

      {/* Phase Indicator */}
      {!isShoppingPhase && (
        <div className="mt-3 text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-2">
          Marketplace is closed during this phase
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact Marketplace (for sidebar)
// ============================================

export interface CompactMarketplaceProps {
  marketplace: MarketplaceType;
  onExpand?: () => void;
  className?: string;
}

export function CompactMarketplace({
  marketplace,
  onExpand,
  className = "",
}: CompactMarketplaceProps) {
  const { cards } = marketplace;

  // Count by type
  const permanentCount = cards.filter(isPermanentCard).length;
  const singleUseCount = cards.filter(isSingleUseCard).length;
  const pointCount = cards.filter(isPointCard).length;

  // Price range
  const prices = cards.map((c) => c.cost);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-3
        ${onExpand ? "cursor-pointer hover:shadow-md transition-shadow" : ""}
        ${className}
      `}
      onClick={onExpand}
      role={onExpand ? "button" : undefined}
      tabIndex={onExpand ? 0 : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏪</span>
          <span className="font-medium text-gray-700">Marketplace</span>
        </div>
        <span className="text-sm text-gray-500">
          {cards.length}/{MARKETPLACE_SIZE}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-blue-500" />
          {permanentCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-amber-500" />
          {singleUseCount}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-purple-500" />
          {pointCount}
        </span>
        {prices.length > 0 && (
          <span className="text-yellow-600">
            🪙 {minPrice}-{maxPrice}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default Marketplace;
