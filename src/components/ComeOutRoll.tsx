"use client";

import React, { useState, useCallback } from "react";
import { Dice, DiceResult } from "./Dice";
import { useDiceRoll } from "@/hooks/useDiceRoll";
import { describeComeOutResult } from "@/lib/comeOutRoll";
import type { ComeOutResult, Player, Monster, Card, Bet } from "@/types/game";
import type { BetResolutionResult } from "@/lib/betting";

// ============================================
// Types
// ============================================

export interface ComeOutRollProps {
  /** Current active player (shooter) */
  player: Player;
  /** Current monster being faced */
  monster: Monster;
  /** All current bets */
  bets: Bet[];
  /** All players for bet resolution display */
  players: Player[];
  /** Callback when natural is rolled (7 or 11) */
  onNatural?: () => { betResults: BetResolutionResult[]; cardDrawn: Card | null };
  /** Callback when craps is rolled (2, 3, 12) */
  onCraps?: () => { betResults: BetResolutionResult[]; goldLost: number };
  /** Callback when point is established (4, 5, 6, 8, 9, 10) */
  onPointEstablished?: (point: number) => void;
  /** Callback after roll completes */
  onRollComplete?: (result: ComeOutResult, diceValues: number[]) => void;
  /** Whether rolling is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

type RollOutcome = {
  type: "natural" | "craps" | "point";
  result: ComeOutResult;
  diceValues: number[];
  betResults?: BetResolutionResult[];
  cardDrawn?: Card | null;
  goldLost?: number;
} | null;

// ============================================
// Result Display Components
// ============================================

interface NaturalResultProps {
  sum: number;
  monster: Monster;
  cardDrawn: Card | null;
  betResults: BetResolutionResult[];
  players: Player[];
}

function NaturalResult({
  sum,
  monster,
  cardDrawn,
  betResults,
  players,
}: NaturalResultProps) {
  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  return (
    <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">🎉</div>
      <h3 className="text-2xl font-bold text-green-700 mb-2">NATURAL!</h3>
      <p className="text-green-600 mb-3">
        Rolled {sum} - Instant Victory!
      </p>

      {/* Monster Defeat */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
        <p className="text-gray-700">
          <span className="font-bold">{monster.name}</span> defeated!
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1">
            <span className="text-purple-600 font-bold">+{monster.points}</span>
            <span className="text-gray-500">VP</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-600 font-bold">+{monster.goldReward}</span>
            <span>🪙</span>
          </span>
        </div>
      </div>

      {/* Card Drawn */}
      {cardDrawn && (
        <div className="bg-white rounded-lg p-3 mb-3 border border-blue-200">
          <p className="text-sm text-gray-500 mb-1">Card Drawn:</p>
          <p className="font-bold text-blue-700">{cardDrawn.name}</p>
          {"description" in cardDrawn && (
            <p className="text-xs text-gray-500 mt-1">{cardDrawn.description}</p>
          )}
          {"points" in cardDrawn && (
            <p className="text-sm text-purple-600 mt-1">+{cardDrawn.points} VP</p>
          )}
        </div>
      )}

      {/* Bet Resolution */}
      {betResults.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Bets Returned (No Winners/Losers)</p>
          <div className="space-y-1">
            {betResults.map((result) => (
              <div
                key={result.playerId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{getPlayerName(result.playerId)}</span>
                <span className="text-gray-500">
                  {result.goldChange >= 0 ? "+" : ""}{result.goldChange} 🪙
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface CrapsResultProps {
  sum: number;
  goldLost: number;
  betResults: BetResolutionResult[];
  players: Player[];
}

function CrapsResult({
  sum,
  goldLost,
  betResults,
  players,
}: CrapsResultProps) {
  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">💀</div>
      <h3 className="text-2xl font-bold text-red-700 mb-2">CRAPS!</h3>
      <p className="text-red-600 mb-3">
        Rolled {sum} - Turn Ends
      </p>

      {/* Gold Lost */}
      {goldLost > 0 && (
        <div className="bg-white rounded-lg p-3 mb-3 border border-red-200">
          <p className="text-red-600">
            Lost <span className="font-bold">{goldLost} 🪙</span> (50% penalty)
          </p>
        </div>
      )}

      {/* Bet Resolution */}
      {betResults.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Bet Resolution</p>
          <div className="space-y-1">
            {betResults.map((result) => (
              <div
                key={result.playerId}
                className={`flex items-center justify-between text-sm ${
                  result.goldChange > 0
                    ? "text-green-600"
                    : result.goldChange < 0
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                <span>{getPlayerName(result.playerId)}</span>
                <span className="font-medium">
                  {result.goldChange >= 0 ? "+" : ""}{result.goldChange} 🪙
                  {result.originalBet.type === "AGAINST" && result.goldChange > result.originalBet.amount && " (doubled!)"}
                  {result.goldChange === 0 && " (lost)"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mt-3">
        Next player will face the same monster.
      </p>
    </div>
  );
}

interface PointEstablishedResultProps {
  pointValue: number;
  monster: Monster;
}

function PointEstablishedResult({
  pointValue,
  monster,
}: PointEstablishedResultProps) {
  return (
    <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">🎯</div>
      <h3 className="text-2xl font-bold text-blue-700 mb-2">POINT ESTABLISHED!</h3>
      <p className="text-blue-600 mb-3">
        Your point is <span className="text-3xl font-bold">{pointValue}</span>
      </p>

      <div className="bg-white rounded-lg p-3 border border-blue-200">
        <p className="text-sm text-gray-500 mb-2">During Point Phase:</p>
        <ul className="text-sm text-gray-600 text-left space-y-1 pl-4">
          <li>
            Roll your point ({pointValue}) to choose a number to remove from{" "}
            <span className="font-medium">{monster.name}</span>
          </li>
          <li>
            Roll a monster number ({monster.remainingNumbers.join(", ")}) to hit it
          </li>
          <li>Roll a 7 to crap out (lose 50% gold, turn ends)</li>
          <li>Roll a 2 to get an escape opportunity</li>
        </ul>
      </div>
    </div>
  );
}

// ============================================
// Main ComeOutRoll Component
// ============================================

export function ComeOutRoll({
  player,
  monster,
  bets,
  players,
  onNatural,
  onCraps,
  onPointEstablished,
  onRollComplete,
  disabled = false,
  className = "",
}: ComeOutRollProps) {
  const { diceValues, isRolling, roll, reset } = useDiceRoll();
  const [outcome, setOutcome] = useState<RollOutcome>(null);
  const [hasRolled, setHasRolled] = useState(false);

  const handleRoll = useCallback(async () => {
    if (disabled || isRolling) return;

    // Reset any previous outcome
    setOutcome(null);

    // Perform the roll
    const { diceValues: newDiceValues, sum, comeOutResult } = await roll();
    setHasRolled(true);

    // Handle the result
    let rollOutcome: RollOutcome = null;

    if (comeOutResult.type === "natural") {
      // Natural - instant win!
      const result = onNatural?.();
      rollOutcome = {
        type: "natural",
        result: comeOutResult,
        diceValues: newDiceValues,
        betResults: result?.betResults || [],
        cardDrawn: result?.cardDrawn || null,
      };
    } else if (comeOutResult.type === "craps") {
      // Craps - turn ends
      const result = onCraps?.();
      rollOutcome = {
        type: "craps",
        result: comeOutResult,
        diceValues: newDiceValues,
        betResults: result?.betResults || [],
        goldLost: result?.goldLost || 0,
      };
    } else if (comeOutResult.type === "point") {
      // Point established
      onPointEstablished?.(comeOutResult.pointValue);
      rollOutcome = {
        type: "point",
        result: comeOutResult,
        diceValues: newDiceValues,
      };
    }

    setOutcome(rollOutcome);
    onRollComplete?.(comeOutResult, newDiceValues);
  }, [disabled, isRolling, roll, onNatural, onCraps, onPointEstablished, onRollComplete]);

  const handleContinue = useCallback(() => {
    setOutcome(null);
    setHasRolled(false);
    reset();
  }, [reset]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎲</span>
          <h2 className="font-bold text-gray-800 text-xl">Come-Out Roll</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Shooter:</span>
          <span className="font-bold text-gray-800">{player.name}</span>
        </div>
      </div>

      {/* Monster Info */}
      <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Facing: </span>
            <span className="font-bold text-gray-800">{monster.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="text-purple-600 font-bold">{monster.points}</span>
              <span className="text-gray-500">VP</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-600 font-bold">{monster.goldReward}</span>
              <span>🪙</span>
            </span>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <span className="text-gray-500">Numbers to hit: </span>
          <span className="font-medium">{monster.remainingNumbers.join(", ")}</span>
        </div>
      </div>

      {/* Roll Instructions */}
      {!hasRolled && (
        <div className="bg-blue-50 rounded-lg px-4 py-3 mb-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Come-Out Roll Outcomes:</p>
          <ul className="space-y-1 text-blue-600">
            <li><span className="font-medium text-green-600">7 or 11 (Natural):</span> Instant monster defeat!</li>
            <li><span className="font-medium text-red-600">2, 3, or 12 (Craps):</span> Lose 50% gold, turn ends</li>
            <li><span className="font-medium text-blue-600">4, 5, 6, 8, 9, 10:</span> Establishes your point</li>
          </ul>
        </div>
      )}

      {/* Dice Display */}
      <div className="flex flex-col items-center justify-center py-6">
        {isRolling ? (
          <div className="flex items-center gap-4">
            <Dice values={[1, 1]} rolling={true} size={80} />
          </div>
        ) : diceValues.length > 0 ? (
          <DiceResult values={diceValues} size={80} showSum={true} />
        ) : (
          <div className="flex items-center gap-4 opacity-50">
            <Dice values={[1, 1]} size={80} />
          </div>
        )}
      </div>

      {/* Roll Button */}
      {!outcome && (
        <button
          onClick={handleRoll}
          disabled={disabled || isRolling}
          className={`
            w-full py-4 rounded-xl font-bold text-xl
            transition-all duration-200
            ${
              disabled || isRolling
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            }
          `}
        >
          {isRolling ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">🎲</span>
              Rolling...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🎲</span>
              Roll the Dice!
            </span>
          )}
        </button>
      )}

      {/* Outcome Display */}
      {outcome?.type === "natural" && (
        <NaturalResult
          sum={outcome.result.type === "natural" ? outcome.result.sum : 0}
          monster={monster}
          cardDrawn={outcome.cardDrawn || null}
          betResults={outcome.betResults || []}
          players={players}
        />
      )}

      {outcome?.type === "craps" && (
        <CrapsResult
          sum={outcome.result.type === "craps" ? outcome.result.sum : 0}
          goldLost={outcome.goldLost || 0}
          betResults={outcome.betResults || []}
          players={players}
        />
      )}

      {outcome?.type === "point" && outcome.result.type === "point" && (
        <PointEstablishedResult
          pointValue={outcome.result.pointValue}
          monster={monster}
        />
      )}

      {/* Continue Button (after outcome) */}
      {outcome && (
        <button
          onClick={handleContinue}
          className="w-full mt-4 py-3 rounded-xl font-bold text-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          {outcome.type === "point" ? "Continue to Point Phase" : "Continue"}
        </button>
      )}

      {/* Bets Summary */}
      {bets.length > 0 && !outcome && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Active bets:</span>
            <div className="flex items-center gap-3">
              <span className="text-green-600">
                👍 {bets.filter((b) => b.type === "FOR").reduce((sum, b) => sum + b.amount, 0)} 🪙
              </span>
              <span className="text-red-600">
                👎 {bets.filter((b) => b.type === "AGAINST").reduce((sum, b) => sum + b.amount, 0)} 🪙
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default ComeOutRoll;
