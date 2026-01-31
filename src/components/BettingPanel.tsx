"use client";

import React, { useState, useMemo } from "react";
import type { Bet, BetType, Player } from "@/types/game";
import { MAX_BET_AMOUNT } from "@/lib/constants";
import {
  validateBet,
  createBet,
  getBetSummary,
  getPlayerBet,
  hasPlayerBet,
  getBetTypeColor,
  getBetTypeLabel,
} from "@/lib/betting";

// ============================================
// Bet Amount Selector
// ============================================

interface BetAmountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  maxAmount: number;
  disabled?: boolean;
}

function BetAmountSelector({
  value,
  onChange,
  maxAmount,
  disabled = false,
}: BetAmountSelectorProps) {
  const quickAmounts = [1, 2, 3, 5].filter((a) => a <= maxAmount);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-600 font-medium">Amount:</label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChange(Math.max(1, value - 1))}
            disabled={disabled || value <= 1}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-600 transition-colors"
            aria-label="Decrease amount"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={maxAmount}
            value={value}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              if (!isNaN(num) && num >= 1 && num <= maxAmount) {
                onChange(num);
              }
            }}
            disabled={disabled}
            className="w-16 h-8 text-center border border-gray-300 rounded-lg font-bold text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label="Bet amount"
          />
          <button
            onClick={() => onChange(Math.min(maxAmount, value + 1))}
            disabled={disabled || value >= maxAmount}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-gray-600 transition-colors"
            aria-label="Increase amount"
          >
            +
          </button>
        </div>
        <span className="text-yellow-600 text-lg">🪙</span>
      </div>

      {/* Quick amount buttons */}
      <div className="flex gap-1">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => onChange(amount)}
            disabled={disabled || amount > maxAmount}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-colors
              ${
                value === amount
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {amount}
          </button>
        ))}
        {maxAmount > 0 && (
          <button
            onClick={() => onChange(maxAmount)}
            disabled={disabled}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-colors
              ${
                value === maxAmount
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            Max ({maxAmount})
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Bet Type Selector
// ============================================

interface BetTypeSelectorProps {
  value: BetType;
  onChange: (value: BetType) => void;
  disabled?: boolean;
}

function BetTypeSelector({
  value,
  onChange,
  disabled = false,
}: BetTypeSelectorProps) {
  const forColors = getBetTypeColor("FOR");
  const againstColors = getBetTypeColor("AGAINST");

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange("FOR")}
        disabled={disabled}
        className={`
          flex-1 py-3 px-4 rounded-lg border-2 font-medium text-sm
          transition-all duration-200
          ${
            value === "FOR"
              ? `${forColors.bg} ${forColors.border} ${forColors.text} ring-2 ring-green-400 ring-offset-1`
              : "bg-white border-gray-200 text-gray-500 hover:border-green-300"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-pressed={value === "FOR"}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">👍</span>
          <span>FOR</span>
          <span className="text-xs font-normal opacity-75">
            Win when shooter succeeds
          </span>
        </div>
      </button>

      <button
        onClick={() => onChange("AGAINST")}
        disabled={disabled}
        className={`
          flex-1 py-3 px-4 rounded-lg border-2 font-medium text-sm
          transition-all duration-200
          ${
            value === "AGAINST"
              ? `${againstColors.bg} ${againstColors.border} ${againstColors.text} ring-2 ring-red-400 ring-offset-1`
              : "bg-white border-gray-200 text-gray-500 hover:border-red-300"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-pressed={value === "AGAINST"}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl">👎</span>
          <span>AGAINST</span>
          <span className="text-xs font-normal opacity-75">
            Win when shooter fails
          </span>
        </div>
      </button>
    </div>
  );
}

// ============================================
// Active Bets Display
// ============================================

interface ActiveBetsDisplayProps {
  bets: Bet[];
  players: Player[];
  className?: string;
}

function ActiveBetsDisplay({
  bets,
  players,
  className = "",
}: ActiveBetsDisplayProps) {
  const summary = getBetSummary(bets);

  const getPlayerName = (playerId: string): string => {
    const player = players.find((p) => p.id === playerId);
    return player?.name || "Unknown";
  };

  if (bets.length === 0) {
    return (
      <div
        className={`text-center text-gray-400 text-sm py-4 ${className}`}
      >
        No bets placed yet
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-gray-500">
            {summary.totalBettors} bettor{summary.totalBettors !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-green-600">
            <span>👍</span>
            <span className="font-medium">{summary.totalFor}</span>
            <span className="text-yellow-600">🪙</span>
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span>👎</span>
            <span className="font-medium">{summary.totalAgainst}</span>
            <span className="text-yellow-600">🪙</span>
          </span>
        </div>
      </div>

      {/* Individual Bets */}
      <div className="space-y-2">
        {bets.map((bet) => {
          const colors = getBetTypeColor(bet.type);
          return (
            <div
              key={bet.playerId}
              className={`
                flex items-center justify-between
                px-3 py-2 rounded-lg border
                ${colors.bg} ${colors.border}
              `}
            >
              <span className={`font-medium ${colors.text}`}>
                {getPlayerName(bet.playerId)}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${colors.text}`}>
                  {bet.type === "FOR" ? "👍" : "👎"}
                </span>
                <span className={`font-bold ${colors.text}`}>
                  {bet.amount} 🪙
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Main BettingPanel Component
// ============================================

export interface BettingPanelProps {
  /** Current player viewing the panel */
  player: Player;
  /** ID of the active player (shooter) */
  activePlayerId: string;
  /** All current bets */
  bets: Bet[];
  /** All players in the game */
  players: Player[];
  /** Whether betting is currently open */
  isBettingPhase: boolean;
  /** Callback when a bet is placed */
  onPlaceBet?: (bet: Bet) => void;
  /** Whether bets are locked (after rolling starts) */
  isLocked?: boolean;
  /** Custom className */
  className?: string;
}

export function BettingPanel({
  player,
  activePlayerId,
  bets,
  players,
  isBettingPhase,
  onPlaceBet,
  isLocked = false,
  className = "",
}: BettingPanelProps) {
  const [betType, setBetType] = useState<BetType>("FOR");
  const [betAmount, setBetAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Check if this player is the active player (can't bet on yourself)
  const isActivePlayer = player.id === activePlayerId;

  // Check if player has already bet
  const existingBet = getPlayerBet(bets, player.id);
  const hasBet = hasPlayerBet(bets, player.id);

  // Calculate max bet amount
  const maxBetAmount = Math.min(player.gold, MAX_BET_AMOUNT);

  // Check if betting is disabled
  const bettingDisabled =
    !isBettingPhase || isLocked || isActivePlayer || hasBet || maxBetAmount < 1;

  // Get the active player name
  const activePlayer = players.find((p) => p.id === activePlayerId);
  const activePlayerName = activePlayer?.name || "Unknown";

  const handlePlaceBet = () => {
    setError(null);

    // Validate the bet
    const validation = validateBet(
      player,
      betType,
      betAmount,
      activePlayerId,
      bets
    );

    if (!validation.success) {
      setError(validation.error || "Invalid bet");
      return;
    }

    // Create and place the bet
    const bet = createBet(player.id, betType, betAmount);
    onPlaceBet?.(bet);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎰</span>
          <h2 className="font-bold text-gray-800 text-lg">Betting</h2>
        </div>
        <div className="flex items-center gap-2">
          {isLocked && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">
              <span>🔒</span>
              Locked
            </span>
          )}
          {isBettingPhase && !isLocked && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Open
            </span>
          )}
        </div>
      </div>

      {/* Shooter Info */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4 text-center">
        <span className="text-sm text-gray-500">Current Shooter: </span>
        <span className="font-bold text-gray-800">{activePlayerName}</span>
      </div>

      {/* Bet Placement Form */}
      {isActivePlayer ? (
        <div className="text-center py-6 text-gray-500">
          <span className="text-3xl mb-2 block">🎲</span>
          <p className="font-medium">{"You're the shooter!"}</p>
          <p className="text-sm">You cannot bet on your own turn.</p>
        </div>
      ) : hasBet && existingBet ? (
        <div className="text-center py-4">
          <p className="text-gray-500 mb-2">Your bet:</p>
          <div
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              ${getBetTypeColor(existingBet.type).bg}
              ${getBetTypeColor(existingBet.type).border}
              border-2
            `}
          >
            <span>{existingBet.type === "FOR" ? "👍" : "👎"}</span>
            <span
              className={`font-bold ${getBetTypeColor(existingBet.type).text}`}
            >
              {existingBet.amount} 🪙 {existingBet.type}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Wait for the roll to resolve
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bet Type Selection */}
          <BetTypeSelector
            value={betType}
            onChange={setBetType}
            disabled={bettingDisabled}
          />

          {/* Amount Selection */}
          <BetAmountSelector
            value={betAmount}
            onChange={setBetAmount}
            maxAmount={maxBetAmount}
            disabled={bettingDisabled}
          />

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Place Bet Button */}
          <button
            onClick={handlePlaceBet}
            disabled={bettingDisabled}
            className={`
              w-full py-3 rounded-lg font-bold text-lg
              transition-all duration-200
              ${
                bettingDisabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : betType === "FOR"
                    ? "bg-green-500 hover:bg-green-600 text-white hover:shadow-lg"
                    : "bg-red-500 hover:bg-red-600 text-white hover:shadow-lg"
              }
            `}
          >
            {bettingDisabled ? (
              maxBetAmount < 1 ? (
                "No gold to bet"
              ) : (
                "Betting Closed"
              )
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Place Bet</span>
                <span>
                  ({betAmount} 🪙 {betType})
                </span>
              </span>
            )}
          </button>

          {/* Player Gold Display */}
          <div className="text-center text-sm text-gray-500">
            Your gold: <span className="font-bold text-yellow-600">{player.gold} 🪙</span>
            {MAX_BET_AMOUNT && (
              <span className="text-gray-400 ml-2">
                (Max bet: {MAX_BET_AMOUNT})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Active Bets Section */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h3 className="font-medium text-gray-700 mb-2 text-sm">Active Bets</h3>
        <ActiveBetsDisplay bets={bets} players={players} />
      </div>
    </div>
  );
}

// ============================================
// Compact Betting Display (for sidebar)
// ============================================

export interface CompactBettingDisplayProps {
  bets: Bet[];
  players: Player[];
  isOpen?: boolean;
  className?: string;
}

export function CompactBettingDisplay({
  bets,
  players,
  isOpen = false,
  className = "",
}: CompactBettingDisplayProps) {
  const summary = getBetSummary(bets);

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-3
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎰</span>
          <span className="font-medium text-gray-700">Bets</span>
          {isOpen && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-sm text-gray-500">{bets.length} placed</span>
      </div>

      {bets.length > 0 && (
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <span>👍</span>
            <span className="font-medium">{summary.totalFor}</span>
            <span className="text-yellow-600">🪙</span>
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span>👎</span>
            <span className="font-medium">{summary.totalAgainst}</span>
            <span className="text-yellow-600">🪙</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default BettingPanel;
