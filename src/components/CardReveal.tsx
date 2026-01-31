"use client";

import React from "react";
import type { Player, PermanentCard, SingleUseCard } from "@/types/game";
import {
  MAX_PERMANENT_CARDS,
  MAX_SINGLE_USE_CARDS,
} from "@/lib/constants";

// ============================================
// Card Effect Icons and Colors
// ============================================

const PERMANENT_CARD_ICONS: Record<PermanentCard["effect"], string> = {
  PLUS_ONE_DIE: "🎲",
  REROLL: "🔄",
  SHIELD: "🛡️",
  LUCKY: "🍀",
  ARMOR: "🛡️",
  POINT_BONUS: "✨",
  DOUBLE: "⚔️",
};

const SINGLE_USE_CARD_ICONS: Record<SingleUseCard["effect"], string> = {
  STUN: "💫",
  RAPID_FIRE: "⚡",
  MOMENTUM: "🔥",
  CHARM: "💫",
  CURSE: "💀",
  HEAL: "💚",
};

const PERMANENT_CARD_COLORS: Record<
  PermanentCard["effect"],
  { bg: string; border: string; text: string }
> = {
  PLUS_ONE_DIE: {
    bg: "bg-blue-50",
    border: "border-blue-300",
    text: "text-blue-700",
  },
  REROLL: {
    bg: "bg-cyan-50",
    border: "border-cyan-300",
    text: "text-cyan-700",
  },
  SHIELD: {
    bg: "bg-gray-50",
    border: "border-gray-400",
    text: "text-gray-700",
  },
  LUCKY: {
    bg: "bg-green-50",
    border: "border-green-300",
    text: "text-green-700",
  },
  ARMOR: {
    bg: "bg-stone-50",
    border: "border-stone-400",
    text: "text-stone-700",
  },
  POINT_BONUS: {
    bg: "bg-purple-50",
    border: "border-purple-300",
    text: "text-purple-700",
  },
  DOUBLE: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-700",
  },
};

const SINGLE_USE_CARD_COLORS: Record<
  SingleUseCard["effect"],
  { bg: string; border: string; text: string }
> = {
  STUN: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700" },
  RAPID_FIRE: { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700" },
  MOMENTUM: { bg: "bg-amber-50", border: "border-amber-400", text: "text-amber-700" },
  CHARM: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700" },
  CURSE: { bg: "bg-violet-50", border: "border-violet-400", text: "text-violet-700" },
  HEAL: { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700" },
};

// ============================================
// Revealed Card Components
// ============================================

interface RevealedPermanentCardProps {
  card: PermanentCard;
  highlighted?: boolean;
}

function RevealedPermanentCard({
  card,
  highlighted = false,
}: RevealedPermanentCardProps) {
  const colors = PERMANENT_CARD_COLORS[card.effect];
  const icon = PERMANENT_CARD_ICONS[card.effect];

  return (
    <div
      className={`
        p-3 rounded-lg border-2 min-w-[120px]
        ${colors.bg} ${colors.border}
        ${highlighted ? "ring-2 ring-blue-500 ring-offset-2 animate-pulse" : ""}
        transition-all duration-300
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className={`font-semibold text-sm ${colors.text}`}>
          {card.name}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-snug">{card.description}</p>
      <div className="mt-2 flex items-center gap-1">
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-500 text-white rounded font-medium">
          PERMANENT
        </span>
      </div>
    </div>
  );
}

interface RevealedSingleUseCardProps {
  card: SingleUseCard;
  highlighted?: boolean;
}

function RevealedSingleUseCard({
  card,
  highlighted = false,
}: RevealedSingleUseCardProps) {
  const colors = SINGLE_USE_CARD_COLORS[card.effect];
  const icon = SINGLE_USE_CARD_ICONS[card.effect];

  return (
    <div
      className={`
        p-3 rounded-lg border-2 border-dashed min-w-[120px]
        ${colors.bg} ${colors.border}
        ${highlighted ? "ring-2 ring-amber-500 ring-offset-2 animate-pulse" : ""}
        transition-all duration-300
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className={`font-semibold text-sm ${colors.text}`}>
          {card.name}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-snug">{card.description}</p>
      <div className="mt-2 flex items-center gap-1">
        <span className="text-[10px] px-1.5 py-0.5 bg-amber-500 text-white rounded font-medium">
          SINGLE USE
        </span>
      </div>
    </div>
  );
}

// ============================================
// Empty Hand Message
// ============================================

interface EmptyHandMessageProps {
  type: "permanent" | "single_use" | "all";
}

function EmptyHandMessage({ type }: EmptyHandMessageProps) {
  const messages = {
    permanent: "No permanent cards",
    single_use: "No single-use cards",
    all: "No cards in hand",
  };

  return (
    <div className="text-gray-400 text-sm italic py-4 text-center">
      {messages[type]}
    </div>
  );
}

// ============================================
// Card Section Component
// ============================================

interface CardSectionProps {
  title: string;
  icon: string;
  count: number;
  maxCount: number;
  typeLabel: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

function CardSection({
  title,
  icon,
  count,
  maxCount,
  typeLabel,
  children,
  isEmpty = false,
}: CardSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-semibold text-gray-700">{title}</h3>
        </div>
        <span
          className={`
            text-sm px-2 py-0.5 rounded
            ${count >= maxCount ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}
          `}
        >
          {count}/{maxCount}
        </span>
      </div>
      {isEmpty ? (
        <EmptyHandMessage type={typeLabel as "permanent" | "single_use"} />
      ) : (
        <div className="flex flex-wrap gap-2">{children}</div>
      )}
    </div>
  );
}

// ============================================
// Main CardReveal Component
// ============================================

export interface CardRevealProps {
  /** The player whose cards are being revealed */
  player: Player;
  /** Whether to show an animation (e.g., for phase transition) */
  showAnimation?: boolean;
  /** Card IDs to highlight (e.g., cards that might be used) */
  highlightedCardIds?: string[];
  /** Whether this is a compact view */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export function CardReveal({
  player,
  showAnimation = false,
  highlightedCardIds = [],
  compact = false,
  className = "",
}: CardRevealProps) {
  const hasPermanentCards = player.permanentCards.length > 0;
  const hasSingleUseCards = player.singleUseCards.length > 0;
  const hasAnyCards = hasPermanentCards || hasSingleUseCards;

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-4
        ${showAnimation ? "animate-fade-in" : ""}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Player Avatar */}
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-800">{player.name}{"'s"} Cards</h2>
            <p className="text-sm text-gray-500">
              All players can see these cards
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>📜</span>
          <span>
            {player.permanentCards.length + player.singleUseCards.length} cards
          </span>
        </div>
      </div>

      {/* No Cards State */}
      {!hasAnyCards && (
        <div className="text-center py-8">
          <span className="text-4xl mb-2 block">🃏</span>
          <p className="text-gray-500 font-medium">No cards in hand</p>
          <p className="text-sm text-gray-400">
            Purchase cards from the marketplace to build your arsenal
          </p>
        </div>
      )}

      {/* Card Sections */}
      {hasAnyCards && (
        <div className={`space-y-4 ${compact ? "" : "space-y-6"}`}>
          {/* Permanent Cards */}
          <CardSection
            title="Permanent Cards"
            icon="🔷"
            count={player.permanentCards.length}
            maxCount={MAX_PERMANENT_CARDS}
            typeLabel="permanent"
            isEmpty={!hasPermanentCards}
          >
            {player.permanentCards.map((card) => (
              <RevealedPermanentCard
                key={card.id}
                card={card}
                highlighted={highlightedCardIds.includes(card.id)}
              />
            ))}
          </CardSection>

          {/* Single-Use Cards */}
          <CardSection
            title="Single-Use Cards"
            icon="⚡"
            count={player.singleUseCards.length}
            maxCount={MAX_SINGLE_USE_CARDS}
            typeLabel="single_use"
            isEmpty={!hasSingleUseCards}
          >
            {player.singleUseCards.map((card) => (
              <RevealedSingleUseCard
                key={card.id}
                card={card}
                highlighted={highlightedCardIds.includes(card.id)}
              />
            ))}
          </CardSection>
        </div>
      )}

      {/* Strategic Note */}
      {hasAnyCards && (
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Consider these cards when placing your bets!
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact Card Reveal (for sidebar/minimal views)
// ============================================

export interface CompactCardRevealProps {
  player: Player;
  onExpand?: () => void;
  className?: string;
}

export function CompactCardReveal({
  player,
  onExpand,
  className = "",
}: CompactCardRevealProps) {
  const permanentCount = player.permanentCards.length;
  const singleUseCount = player.singleUseCards.length;
  const totalCards = permanentCount + singleUseCount;

  // Get unique effects for preview
  const uniquePermanentEffects = new Set(
    player.permanentCards.map((c) => c.effect)
  );
  const uniqueSingleUseEffects = new Set(
    player.singleUseCards.map((c) => c.effect)
  );

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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-700 text-sm">
            {player.name}{"'s"} Cards
          </span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {totalCards}
        </span>
      </div>

      {/* Card Preview Icons */}
      {totalCards > 0 ? (
        <div className="flex items-center gap-3">
          {permanentCount > 0 && (
            <div className="flex items-center gap-1">
              {Array.from(uniquePermanentEffects)
                .slice(0, 4)
                .map((effect) => (
                  <span
                    key={effect}
                    className="text-sm"
                    title={effect}
                  >
                    {PERMANENT_CARD_ICONS[effect]}
                  </span>
                ))}
              {uniquePermanentEffects.size > 4 && (
                <span className="text-xs text-gray-400">
                  +{uniquePermanentEffects.size - 4}
                </span>
              )}
            </div>
          )}
          {singleUseCount > 0 && (
            <div className="flex items-center gap-1 border-l border-gray-200 pl-3">
              {Array.from(uniqueSingleUseEffects)
                .slice(0, 4)
                .map((effect) => (
                  <span
                    key={effect}
                    className="text-sm"
                    title={effect}
                  >
                    {SINGLE_USE_CARD_ICONS[effect]}
                  </span>
                ))}
              {uniqueSingleUseEffects.size > 4 && (
                <span className="text-xs text-gray-400">
                  +{uniqueSingleUseEffects.size - 4}
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No cards</p>
      )}
    </div>
  );
}

// ============================================
// Phase Header Component
// ============================================

export interface CardRevealPhaseHeaderProps {
  playerName: string;
  onContinue?: () => void;
  className?: string;
}

export function CardRevealPhaseHeader({
  playerName,
  onContinue,
  className = "",
}: CardRevealPhaseHeaderProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-blue-500 to-indigo-600
        text-white rounded-lg p-4 text-center
        ${className}
      `}
    >
      <h2 className="text-xl font-bold mb-1">Card Reveal Phase</h2>
      <p className="text-blue-100 mb-3">
        Review {playerName}{"'s"} cards before placing your bets
      </p>
      {onContinue && (
        <button
          onClick={onContinue}
          className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Continue to Betting
        </button>
      )}
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default CardReveal;
