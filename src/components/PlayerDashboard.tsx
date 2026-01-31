"use client";

import React from "react";
import type { Player, PermanentCard, SingleUseCard } from "@/types/game";
import {
  MAX_PERMANENT_CARDS,
  MAX_SINGLE_USE_CARDS,
  DAMAGE_LEADER_BONUS,
  VICTORY_POINTS_TO_WIN,
} from "@/lib/constants";
import { getEffectiveVictoryPoints, pointsToWin } from "@/lib/victory";

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
// Card Components
// ============================================

interface PermanentCardDisplayProps {
  card: PermanentCard;
  onClick?: () => void;
  size?: "small" | "medium";
  className?: string;
}

function PermanentCardDisplay({
  card,
  onClick,
  size = "medium",
  className = "",
}: PermanentCardDisplayProps) {
  const colors = PERMANENT_CARD_COLORS[card.effect];
  const icon = PERMANENT_CARD_ICONS[card.effect];

  const sizeClasses = {
    small: "p-1.5 min-w-[60px]",
    medium: "p-2 min-w-[80px]",
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        ${sizeClasses[size]}
        ${colors.bg}
        ${colors.border}
        border-2 rounded-lg
        flex flex-col items-center gap-1
        transition-all duration-200
        ${onClick ? "cursor-pointer hover:shadow-md hover:scale-105" : ""}
        ${className}
      `}
      aria-label={card.name}
    >
      <span className={size === "small" ? "text-lg" : "text-xl"}>{icon}</span>
      <span
        className={`
          ${colors.text} font-medium text-center leading-tight
          ${size === "small" ? "text-[10px]" : "text-xs"}
        `}
      >
        {card.name}
      </span>
    </div>
  );
}

interface SingleUseCardDisplayProps {
  card: SingleUseCard;
  onClick?: () => void;
  disabled?: boolean;
  size?: "small" | "medium";
  className?: string;
}

function SingleUseCardDisplay({
  card,
  onClick,
  disabled = false,
  size = "medium",
  className = "",
}: SingleUseCardDisplayProps) {
  const colors = SINGLE_USE_CARD_COLORS[card.effect];
  const icon = SINGLE_USE_CARD_ICONS[card.effect];

  const sizeClasses = {
    small: "p-1.5 min-w-[60px]",
    medium: "p-2 min-w-[80px]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`
        ${sizeClasses[size]}
        ${colors.bg}
        ${colors.border}
        border-2 rounded-lg border-dashed
        flex flex-col items-center gap-1
        transition-all duration-200
        ${onClick && !disabled ? "cursor-pointer hover:shadow-md hover:scale-105 hover:border-solid" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      aria-label={card.name}
    >
      <span className={size === "small" ? "text-lg" : "text-xl"}>{icon}</span>
      <span
        className={`
          ${colors.text} font-medium text-center leading-tight
          ${size === "small" ? "text-[10px]" : "text-xs"}
        `}
      >
        {card.name}
      </span>
    </button>
  );
}

// ============================================
// Stats Components
// ============================================

interface StatBadgeProps {
  icon: string;
  value: number | string;
  label: string;
  color?: string;
  highlight?: boolean;
}

function StatBadge({
  icon,
  value,
  label,
  color = "text-gray-700",
  highlight = false,
}: StatBadgeProps) {
  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-lg
        ${highlight ? "bg-yellow-100 ring-2 ring-yellow-400" : "bg-gray-100"}
      `}
      title={label}
    >
      <span className="text-base">{icon}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ============================================
// Card Section Component
// ============================================

interface CardSectionProps {
  title: string;
  count: number;
  maxCount: number;
  children: React.ReactNode;
  emptyMessage?: string;
}

function CardSection({
  title,
  count,
  maxCount,
  children,
  emptyMessage = "No cards",
}: CardSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>{title}</span>
        <span
          className={`
            ${count >= maxCount ? "text-red-500 font-bold" : ""}
          `}
        >
          {count}/{maxCount}
        </span>
      </div>
      {count > 0 ? (
        <div className="flex flex-wrap gap-1.5">{children}</div>
      ) : (
        <div className="text-xs text-gray-400 italic py-2 text-center">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main PlayerDashboard Component
// ============================================

export interface PlayerDashboardProps {
  /** The player to display */
  player: Player;
  /** Whether this player is currently active (their turn) */
  isActive?: boolean;
  /** Whether this player is the damage leader */
  isDamageLeader?: boolean;
  /** Callback when a single-use card is clicked */
  onUseSingleUseCard?: (cardId: string) => void;
  /** Whether the player can use cards (their turn + correct phase) */
  canUseCards?: boolean;
  /** Size variant */
  size?: "compact" | "full";
  /** Custom className */
  className?: string;
}

export function PlayerDashboard({
  player,
  isActive = false,
  isDamageLeader = false,
  onUseSingleUseCard,
  canUseCards = false,
  size = "full",
  className = "",
}: PlayerDashboardProps) {
  const effectiveVP = getEffectiveVictoryPoints(player, isDamageLeader);
  const toWin = pointsToWin(player, isDamageLeader);
  const isWinning = effectiveVP >= VICTORY_POINTS_TO_WIN;

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm
        transition-all duration-300
        ${isActive ? "ring-2 ring-blue-500 shadow-lg" : "border border-gray-200"}
        ${isWinning ? "ring-2 ring-yellow-500 ring-offset-2" : ""}
        ${size === "compact" ? "p-3" : "p-4"}
        ${className}
      `}
      role="article"
      aria-label={`Player dashboard for ${player.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Player Avatar/Initial */}
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
              ${isActive ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"}
            `}
          >
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{player.name}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {isActive && (
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Active Turn
                </span>
              )}
              {isDamageLeader && (
                <span className="flex items-center gap-0.5 text-amber-600 font-medium ml-1">
                  <span>👑</span>
                  Damage Leader
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Win indicator */}
        {isWinning && (
          <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
            WINNER!
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <StatBadge
          icon="🪙"
          value={player.gold}
          label="Gold"
          color="text-yellow-600"
        />
        <StatBadge
          icon="⭐"
          value={isDamageLeader ? `${player.victoryPoints}+${DAMAGE_LEADER_BONUS}` : player.victoryPoints}
          label={`Victory Points${isDamageLeader ? " (includes damage leader bonus)" : ""}`}
          color="text-purple-600"
          highlight={isWinning}
        />
        <StatBadge
          icon="⚔️"
          value={player.damageCount}
          label="Total Damage Dealt"
          color="text-red-600"
          highlight={isDamageLeader}
        />
        {toWin > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-gray-50 rounded-lg">
            <span>{toWin} VP to win</span>
          </div>
        )}
      </div>

      {/* Cards Section */}
      {size === "full" && (
        <div className="space-y-3">
          {/* Permanent Cards */}
          <CardSection
            title="Permanent Cards"
            count={player.permanentCards.length}
            maxCount={MAX_PERMANENT_CARDS}
            emptyMessage="No permanent cards"
          >
            {player.permanentCards.map((card) => (
              <PermanentCardDisplay
                key={card.id}
                card={card}
                size="small"
              />
            ))}
          </CardSection>

          {/* Single-Use Cards */}
          <CardSection
            title="Single-Use Cards"
            count={player.singleUseCards.length}
            maxCount={MAX_SINGLE_USE_CARDS}
            emptyMessage="No single-use cards"
          >
            {player.singleUseCards.map((card) => (
              <SingleUseCardDisplay
                key={card.id}
                card={card}
                onClick={
                  canUseCards && onUseSingleUseCard
                    ? () => onUseSingleUseCard(card.id)
                    : undefined
                }
                disabled={!canUseCards}
                size="small"
              />
            ))}
          </CardSection>
        </div>
      )}

      {/* Compact card counts */}
      {size === "compact" && (
        <div className="flex gap-3 text-xs text-gray-500">
          <span>
            Cards: {player.permanentCards.length}/{MAX_PERMANENT_CARDS} perm,{" "}
            {player.singleUseCards.length}/{MAX_SINGLE_USE_CARDS} use
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Player List Component
// ============================================

export interface PlayerListProps {
  /** All players in the game */
  players: Player[];
  /** ID of the currently active player */
  activePlayerId?: string;
  /** ID of the damage leader */
  damageLeaderId?: string | null;
  /** Callback when a single-use card is clicked */
  onUseSingleUseCard?: (playerId: string, cardId: string) => void;
  /** Whether cards can be used (correct phase) */
  canUseCards?: boolean;
  /** Layout direction */
  layout?: "horizontal" | "vertical";
  /** Custom className */
  className?: string;
}

export function PlayerList({
  players,
  activePlayerId,
  damageLeaderId,
  onUseSingleUseCard,
  canUseCards = false,
  layout = "vertical",
  className = "",
}: PlayerListProps) {
  return (
    <div
      className={`
        ${layout === "horizontal" ? "flex flex-wrap gap-4" : "flex flex-col gap-4"}
        ${className}
      `}
    >
      {players.map((player) => (
        <PlayerDashboard
          key={player.id}
          player={player}
          isActive={player.id === activePlayerId}
          isDamageLeader={player.id === damageLeaderId}
          onUseSingleUseCard={
            onUseSingleUseCard
              ? (cardId) => onUseSingleUseCard(player.id, cardId)
              : undefined
          }
          canUseCards={canUseCards && player.id === activePlayerId}
          size={layout === "horizontal" ? "compact" : "full"}
        />
      ))}
    </div>
  );
}

// ============================================
// Mini Player Badge (for compact displays)
// ============================================

export interface MiniPlayerBadgeProps {
  player: Player;
  isActive?: boolean;
  isDamageLeader?: boolean;
  className?: string;
}

export function MiniPlayerBadge({
  player,
  isActive = false,
  isDamageLeader = false,
  className = "",
}: MiniPlayerBadgeProps) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        ${isActive ? "bg-blue-100 border-2 border-blue-400" : "bg-gray-100 border border-gray-200"}
        ${className}
      `}
    >
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${isActive ? "bg-blue-500 text-white" : "bg-gray-300 text-gray-600"}
        `}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
          {player.name}
          {isDamageLeader && <span className="text-xs">👑</span>}
        </span>
        <span className="text-xs text-gray-500 flex items-center gap-2">
          <span>🪙 {player.gold}</span>
          <span>⭐ {player.victoryPoints}</span>
        </span>
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export { PermanentCardDisplay, SingleUseCardDisplay };
export default PlayerDashboard;
