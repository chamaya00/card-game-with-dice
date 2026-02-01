"use client";

import React, { useState } from "react";
import type { Player, PermanentCard, SingleUseCard } from "@/types/game";

// ============================================
// Types
// ============================================

export type CardEffectTiming =
  | "before_roll"
  | "after_roll"
  | "on_crap_out"
  | "on_hit"
  | "anytime"
  | "turn_start";

export interface ActiveEffect {
  cardId: string;
  cardName: string;
  effect: PermanentCard["effect"] | SingleUseCard["effect"];
  remainingUses?: number;
  expiresAtEndOfTurn?: boolean;
}

export interface CardEffectUIProps {
  /** Current player */
  player: Player;
  /** Currently active effects */
  activeEffects: ActiveEffect[];
  /** Available single-use cards that can be played */
  usableCards: SingleUseCard[];
  /** Current timing phase for card usage */
  currentTiming: CardEffectTiming;
  /** Callback when a single-use card is activated */
  onUseCard?: (cardId: string, targetPlayerId?: string) => void;
  /** All players (for targeting) */
  allPlayers?: Player[];
  /** Whether card usage is allowed right now */
  canUseCards?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================
// Effect Descriptions
// ============================================

const PERMANENT_EFFECT_DESCRIPTIONS: Record<PermanentCard["effect"], string> = {
  PLUS_ONE_DIE: "Roll 3 dice, pick best 2",
  REROLL: "Reroll one die after seeing result",
  SHIELD: "Block one crap-out (7) once per turn",
  LUCKY: "Guarantee non-7 on next roll",
  ARMOR: "Next crap-out doesn't lose gold",
  POINT_BONUS: "Point hit removes 2 numbers instead of 1",
  DOUBLE: "Next monster hit counts as 2 hits",
};

const SINGLE_USE_EFFECT_DESCRIPTIONS: Record<SingleUseCard["effect"], string> = {
  STUN: "Skip your turn (avoid rolling)",
  RAPID_FIRE: "Roll twice this turn",
  MOMENTUM: "After 2 hits, gain +1 die for next roll",
  CHARM: "Get 2 consecutive turns",
  CURSE: "Target's next roll treated as 7",
  HEAL: "Un-cross one number from monster",
};

const SINGLE_USE_ICONS: Record<SingleUseCard["effect"], string> = {
  STUN: "💫",
  RAPID_FIRE: "⚡",
  MOMENTUM: "🔥",
  CHARM: "✨",
  CURSE: "💀",
  HEAL: "💚",
};

const PERMANENT_ICONS: Record<PermanentCard["effect"], string> = {
  PLUS_ONE_DIE: "🎲",
  REROLL: "🔄",
  SHIELD: "🛡️",
  LUCKY: "🍀",
  ARMOR: "🛡️",
  POINT_BONUS: "⭐",
  DOUBLE: "⚔️",
};

// ============================================
// Active Effect Badge Component
// ============================================

interface ActiveEffectBadgeProps {
  effect: ActiveEffect;
}

function ActiveEffectBadge({ effect }: ActiveEffectBadgeProps) {
  const isPermanent = effect.effect in PERMANENT_EFFECT_DESCRIPTIONS;
  const icon = isPermanent
    ? PERMANENT_ICONS[effect.effect as PermanentCard["effect"]]
    : SINGLE_USE_ICONS[effect.effect as SingleUseCard["effect"]];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 border border-purple-200 rounded-full">
      <span className="text-sm">{icon}</span>
      <span className="text-xs font-medium text-purple-700">{effect.cardName}</span>
      {effect.remainingUses !== undefined && (
        <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
          {effect.remainingUses}x
        </span>
      )}
      {effect.expiresAtEndOfTurn && (
        <span className="text-xs text-purple-400">(this turn)</span>
      )}
    </div>
  );
}

// ============================================
// Usable Card Button Component
// ============================================

interface UsableCardButtonProps {
  card: SingleUseCard;
  onUse: () => void;
  requiresTarget: boolean;
  disabled: boolean;
}

function UsableCardButton({ card, onUse, requiresTarget, disabled }: UsableCardButtonProps) {
  const icon = SINGLE_USE_ICONS[card.effect];
  const description = SINGLE_USE_EFFECT_DESCRIPTIONS[card.effect];

  return (
    <button
      onClick={onUse}
      disabled={disabled}
      className={`
        flex items-center gap-3 w-full p-3 rounded-lg border-2 border-dashed
        transition-all duration-200
        ${disabled
          ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60"
          : "bg-white border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer"
        }
      `}
      title={description}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 text-left">
        <p className={`font-medium ${disabled ? "text-gray-400" : "text-gray-800"}`}>
          {card.name}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {requiresTarget && (
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          Target
        </span>
      )}
    </button>
  );
}

// ============================================
// Main CardEffectUI Component
// ============================================

/**
 * CardEffectUI displays active card effects and allows using single-use cards.
 *
 * NOTE: This is a Phase 11 stub component. Full implementation includes:
 * - Complete effect registry and timing system
 * - Automatic effect triggers
 * - Animation for effect activation
 * - Target selection modal
 */
export function CardEffectUI({
  player,
  activeEffects,
  usableCards,
  currentTiming,
  onUseCard,
  allPlayers = [],
  canUseCards = false,
  className = "",
}: CardEffectUIProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  // Determine which cards require targets
  const cardRequiresTarget = (card: SingleUseCard): boolean => {
    return card.effect === "CURSE" || card.effect === "CHARM";
  };

  // Handle card use
  const handleUseCard = (card: SingleUseCard) => {
    if (!canUseCards || !onUseCard) return;

    if (cardRequiresTarget(card)) {
      setPendingCardId(card.id);
    } else {
      onUseCard(card.id);
    }
  };

  // Handle target selection
  const handleSelectTarget = (targetId: string) => {
    if (pendingCardId && onUseCard) {
      onUseCard(pendingCardId, targetId);
      setPendingCardId(null);
      setSelectedTarget(null);
    }
  };

  // Cancel target selection
  const handleCancelTarget = () => {
    setPendingCardId(null);
    setSelectedTarget(null);
  };

  // Get timing description
  const getTimingDescription = (timing: CardEffectTiming): string => {
    switch (timing) {
      case "before_roll": return "Before you roll";
      case "after_roll": return "After seeing roll result";
      case "on_crap_out": return "When you crap out";
      case "on_hit": return "When you hit a number";
      case "anytime": return "Anytime during your turn";
      case "turn_start": return "At the start of your turn";
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold text-gray-800">Card Effects</h3>
        </div>
        <span className="text-xs text-gray-400">
          {getTimingDescription(currentTiming)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Effects */}
        {activeEffects.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Active Effects
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeEffects.map((effect) => (
                <ActiveEffectBadge key={effect.cardId} effect={effect} />
              ))}
            </div>
          </div>
        )}

        {/* Usable Cards */}
        {usableCards.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Available Cards {!canUseCards && "(Not your turn)"}
            </h4>
            <div className="space-y-2">
              {usableCards.map((card) => (
                <UsableCardButton
                  key={card.id}
                  card={card}
                  onUse={() => handleUseCard(card)}
                  requiresTarget={cardRequiresTarget(card)}
                  disabled={!canUseCards}
                />
              ))}
            </div>
          </div>
        )}

        {/* Target Selection Modal */}
        {pendingCardId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="font-bold text-gray-800 mb-4">Select Target</h3>
              <div className="space-y-2 mb-4">
                {allPlayers
                  .filter((p) => p.id !== player.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectTarget(p.id)}
                      className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-lg transition-colors"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({p.gold} gold, {p.victoryPoints} VP)
                      </span>
                    </button>
                  ))}
              </div>
              <button
                onClick={handleCancelTarget}
                className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeEffects.length === 0 && usableCards.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-4">
            No active effects or usable cards
          </div>
        )}
      </div>

      {/* Stub Notice */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <p className="text-xs text-gray-400 text-center italic">
          Phase 11 stub - full card effect system coming soon
        </p>
      </div>
    </div>
  );
}

// ============================================
// Card Effect Hook (Phase 11 Stub)
// ============================================

export interface UseCardEffectsReturn {
  activeEffects: ActiveEffect[];
  activateEffect: (cardId: string, effect: ActiveEffect) => void;
  removeEffect: (cardId: string) => void;
  clearTurnEffects: () => void;
  hasEffect: (effect: PermanentCard["effect"] | SingleUseCard["effect"]) => boolean;
}

/**
 * Hook for managing active card effects.
 * NOTE: Stub implementation - full version integrates with game state
 */
export function useCardEffects(): UseCardEffectsReturn {
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);

  const activateEffect = (cardId: string, effect: ActiveEffect) => {
    setActiveEffects((prev) => [...prev, effect]);
  };

  const removeEffect = (cardId: string) => {
    setActiveEffects((prev) => prev.filter((e) => e.cardId !== cardId));
  };

  const clearTurnEffects = () => {
    setActiveEffects((prev) => prev.filter((e) => !e.expiresAtEndOfTurn));
  };

  const hasEffect = (effect: PermanentCard["effect"] | SingleUseCard["effect"]) => {
    return activeEffects.some((e) => e.effect === effect);
  };

  return { activeEffects, activateEffect, removeEffect, clearTurnEffects, hasEffect };
}

// ============================================
// Exports
// ============================================

export default CardEffectUI;
