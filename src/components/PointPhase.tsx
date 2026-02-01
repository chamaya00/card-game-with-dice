"use client";

import React, { useState, useCallback } from "react";
import { Dice, DiceResult } from "./Dice";
import { rollDice, sumDice } from "@/lib/dice";
import { evaluatePointPhaseRoll, describePointPhaseResult } from "@/lib/pointPhaseRoll";
import { calculateCrapOutLoss } from "@/lib/gold";
import type {
  Player,
  Monster,
  Bet,
  Card,
  PointPhaseResult,
} from "@/types/game";
import type { BetResolutionResult } from "@/lib/betting";

// ============================================
// Constants
// ============================================

const ROLL_ANIMATION_DURATION = 800; // milliseconds

// ============================================
// Types
// ============================================

export interface PointPhaseProps {
  /** Current active player (shooter) */
  player: Player;
  /** Current monster being faced */
  monster: Monster;
  /** Established point value */
  point: number;
  /** All current bets */
  bets: Bet[];
  /** All players for bet resolution display */
  players: Player[];
  /** Current turn damage accumulated */
  turnDamage: number;
  /** Whether revive has been used this monster */
  hasUsedRevive: boolean;
  /** Callback when a monster number is hit */
  onMonsterHit?: (hitNumber: number) => BetResolutionResult[];
  /** Callback when the point is hit (returns available numbers to choose from) */
  onPointHit?: () => { remainingNumbers: number[] };
  /** Callback when player selects a number to remove after point hit */
  onNumberSelected?: (number: number) => void;
  /** Callback when monster is defeated */
  onMonsterDefeated?: () => {
    betResults: BetResolutionResult[];
    cardDrawn: Card | null;
    shooterWinnings: number;
  };
  /** Callback when player escapes */
  onEscape?: () => { betResults: BetResolutionResult[] };
  /** Callback when player craps out */
  onCrapOut?: () => {
    betResults: BetResolutionResult[];
    goldLost: number;
  };
  /** Callback when player revives (discards hand) */
  onRevive?: () => void;
  /** Callback when turn ends (for any reason) */
  onTurnEnd?: (result: "defeated" | "escaped" | "crapped_out") => void;
  /** Whether rolling is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

type PhaseState =
  | { type: "rolling" }
  | { type: "awaiting_roll" }
  | { type: "showing_result"; result: PointPhaseResult; diceValues: number[] }
  | { type: "selecting_number"; remainingNumbers: number[] }
  | { type: "escape_dialog" }
  | { type: "crap_out"; goldLost: number; canRevive: boolean }
  | { type: "revive_dialog" }
  | { type: "monster_defeated"; cardDrawn: Card | null; shooterWinnings: number }
  | { type: "escaped" }
  | { type: "turn_ended"; reason: "defeated" | "escaped" | "crapped_out" };

// ============================================
// Result Display Components
// ============================================

interface HitResultProps {
  hitNumber: number;
  turnDamage: number;
  betResults: BetResolutionResult[];
  players: Player[];
  onContinue: () => void;
}

function HitResult({ hitNumber, turnDamage, betResults, players, onContinue }: HitResultProps) {
  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  return (
    <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">💥</div>
      <h3 className="text-2xl font-bold text-green-700 mb-2">HIT!</h3>
      <p className="text-green-600 mb-3">
        Rolled <span className="text-2xl font-bold">{hitNumber}</span> - Monster damaged!
      </p>

      <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
        <p className="text-gray-700">
          Turn Damage: <span className="font-bold text-purple-600">{turnDamage}</span>
        </p>
      </div>

      {/* FOR Bettor Payouts */}
      {betResults.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
          <p className="text-sm text-gray-500 mb-2">FOR Bettors Gain +1 Gold</p>
          <div className="space-y-1">
            {betResults.map((result) => (
              <div
                key={result.playerId}
                className="flex items-center justify-between text-sm text-green-600"
              >
                <span>{getPlayerName(result.playerId)}</span>
                <span className="font-medium">+{result.goldChange} 🪙</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-bold text-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
      >
        Continue Rolling
      </button>
    </div>
  );
}

interface MissResultProps {
  sum: number;
  point: number;
  onContinue: () => void;
}

function MissResult({ sum, point, onContinue }: MissResultProps) {
  return (
    <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">🎯</div>
      <h3 className="text-xl font-bold text-gray-600 mb-2">Miss</h3>
      <p className="text-gray-500 mb-3">
        Rolled {sum} - No effect. Keep aiming for the monster or your point ({point})!
      </p>

      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-bold text-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
      >
        Continue Rolling
      </button>
    </div>
  );
}

interface NumberSelectionProps {
  remainingNumbers: number[];
  point: number;
  onSelect: (number: number) => void;
}

function NumberSelection({ remainingNumbers, point, onSelect }: NumberSelectionProps) {
  return (
    <div className="bg-purple-50 border-2 border-purple-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">🎯</div>
      <h3 className="text-2xl font-bold text-purple-700 mb-2">POINT HIT!</h3>
      <p className="text-purple-600 mb-4">
        You rolled your point ({point})! Choose a number to remove from the monster:
      </p>

      <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
        {remainingNumbers.map((num) => (
          <button
            key={num}
            onClick={() => onSelect(num)}
            className="py-4 px-6 rounded-xl font-bold text-2xl bg-purple-500 hover:bg-purple-600 text-white transition-all transform hover:scale-105 shadow-lg"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
}

interface EscapeDialogProps {
  player: Player;
  turnDamage: number;
  onEscape: () => void;
  onContinue: () => void;
}

function EscapeDialog({ player, turnDamage, onEscape, onContinue }: EscapeDialogProps) {
  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">🐍</div>
      <h3 className="text-2xl font-bold text-yellow-700 mb-2">SNAKE EYES!</h3>
      <p className="text-yellow-600 mb-4">
        You rolled a 2! You may escape now and keep your resources.
      </p>

      <div className="bg-white rounded-lg p-3 mb-4 border border-yellow-200">
        <p className="text-sm text-gray-500 mb-2">Current Status:</p>
        <div className="flex justify-around text-sm">
          <span className="flex items-center gap-1">
            <span className="text-yellow-600 font-bold">{player.gold}</span>
            <span>🪙</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-purple-600 font-bold">{turnDamage}</span>
            <span className="text-gray-500">damage this turn</span>
          </span>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <p><span className="font-medium text-yellow-700">Escape:</span> End turn safely, keep gold, but lose turn damage.</p>
        <p><span className="font-medium text-green-700">Continue:</span> Keep rolling for more damage!</p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onEscape}
          className="flex-1 py-3 rounded-xl font-bold text-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
        >
          🏃 Escape
        </button>
        <button
          onClick={onContinue}
          className="flex-1 py-3 rounded-xl font-bold text-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
        >
          🎲 Continue
        </button>
      </div>
    </div>
  );
}

interface CrapOutResultProps {
  goldLost: number;
  canRevive: boolean;
  player: Player;
  betResults: BetResolutionResult[];
  players: Player[];
  onRevive: () => void;
  onEndTurn: () => void;
}

function CrapOutResult({
  goldLost,
  canRevive,
  player,
  betResults,
  players,
  onRevive,
  onEndTurn,
}: CrapOutResultProps) {
  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  const hasCards = player.permanentCards.length > 0 || player.singleUseCards.length > 0;
  const canActuallyRevive = canRevive && hasCards;

  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">💀</div>
      <h3 className="text-2xl font-bold text-red-700 mb-2">CRAP OUT!</h3>
      <p className="text-red-600 mb-3">
        Rolled 7 - Your turn ends with a penalty!
      </p>

      {/* Gold Lost */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-red-200">
        <p className="text-red-600">
          Lost <span className="font-bold">{goldLost} 🪙</span> (50% penalty)
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Monster damage this turn is reset.
        </p>
      </div>

      {/* Bet Resolution */}
      {betResults.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
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

      {/* Revive Option */}
      {canActuallyRevive && (
        <div className="bg-purple-50 rounded-lg p-3 mb-3 border border-purple-200">
          <p className="text-sm text-purple-700 font-medium mb-2">💫 Revive Option</p>
          <p className="text-sm text-gray-600 mb-2">
            Discard all your cards ({player.permanentCards.length} permanent, {player.singleUseCards.length} single-use) to continue fighting!
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {canActuallyRevive && (
          <button
            onClick={onRevive}
            className="flex-1 py-3 rounded-xl font-bold text-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          >
            💫 Revive
          </button>
        )}
        <button
          onClick={onEndTurn}
          className={`flex-1 py-3 rounded-xl font-bold text-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors ${!canActuallyRevive ? "w-full" : ""}`}
        >
          End Turn
        </button>
      </div>

      {!canActuallyRevive && !hasCards && canRevive && (
        <p className="text-sm text-gray-500 mt-3">
          You have no cards to discard for revive.
        </p>
      )}
      {!canRevive && (
        <p className="text-sm text-gray-500 mt-3">
          Revive already used this monster.
        </p>
      )}
    </div>
  );
}

interface MonsterDefeatedProps {
  monster: Monster;
  player: Player;
  turnDamage: number;
  cardDrawn: Card | null;
  shooterWinnings: number;
  betResults: BetResolutionResult[];
  players: Player[];
  onContinue: () => void;
}

function MonsterDefeatedResult({
  monster,
  player,
  turnDamage,
  cardDrawn,
  shooterWinnings,
  betResults,
  players,
  onContinue,
}: MonsterDefeatedProps) {
  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  return (
    <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">🎉</div>
      <h3 className="text-2xl font-bold text-green-700 mb-2">MONSTER DEFEATED!</h3>
      <p className="text-green-600 mb-3">
        You defeated <span className="font-bold">{monster.name}</span>!
      </p>

      {/* Rewards */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
        <p className="text-gray-700 font-medium mb-2">Rewards:</p>
        <div className="flex items-center justify-center gap-6 text-lg">
          <span className="flex items-center gap-1">
            <span className="text-purple-600 font-bold">+{monster.points}</span>
            <span className="text-gray-500">VP</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-yellow-600 font-bold">+{monster.goldReward}</span>
            <span>🪙</span>
          </span>
        </div>
        {shooterWinnings > 0 && (
          <p className="text-sm text-yellow-600 mt-2">
            +{shooterWinnings} 🪙 from AGAINST bets
          </p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Damage dealt: <span className="font-bold text-purple-600">{turnDamage}</span> (added to your total)
        </p>
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
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
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
                  {result.originalBet.type === "FOR" && " (returned)"}
                  {result.originalBet.type === "AGAINST" && result.goldChange === 0 && " (lost to shooter)"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-bold text-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

interface EscapedResultProps {
  betResults: BetResolutionResult[];
  players: Player[];
  onContinue: () => void;
}

function EscapedResult({ betResults, players, onContinue }: EscapedResultProps) {
  const getPlayerName = (playerId: string) =>
    players.find((p) => p.id === playerId)?.name || "Unknown";

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 mt-4 text-center animate-fade-in">
      <div className="text-4xl mb-2">🏃</div>
      <h3 className="text-2xl font-bold text-yellow-700 mb-2">ESCAPED!</h3>
      <p className="text-yellow-600 mb-3">
        You escaped safely. Turn damage is not counted, but you keep your gold.
      </p>

      {/* Bet Resolution */}
      {betResults.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
          <p className="text-sm text-gray-500 mb-2">Bets Returned</p>
          <div className="space-y-1">
            {betResults.map((result) => (
              <div
                key={result.playerId}
                className="flex items-center justify-between text-sm text-gray-600"
              >
                <span>{getPlayerName(result.playerId)}</span>
                <span className="font-medium">
                  +{result.goldChange} 🪙 (returned)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl font-bold text-lg bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

// ============================================
// Main PointPhase Component
// ============================================

export function PointPhase({
  player,
  monster,
  point,
  bets,
  players,
  turnDamage,
  hasUsedRevive,
  onMonsterHit,
  onPointHit,
  onNumberSelected,
  onMonsterDefeated,
  onEscape,
  onCrapOut,
  onRevive,
  onTurnEnd,
  disabled = false,
  className = "",
}: PointPhaseProps) {
  const [phaseState, setPhaseState] = useState<PhaseState>({ type: "awaiting_roll" });
  const [diceValues, setDiceValues] = useState<number[]>([]);
  const [rollCount, setRollCount] = useState(0);
  const [lastBetResults, setLastBetResults] = useState<BetResolutionResult[]>([]);
  const [accumulatedTurnDamage, setAccumulatedTurnDamage] = useState(turnDamage);

  const handleRoll = useCallback(async () => {
    if (disabled || phaseState.type === "rolling") return;

    // Start rolling animation
    setPhaseState({ type: "rolling" });

    // Wait for animation
    await new Promise((resolve) => setTimeout(resolve, ROLL_ANIMATION_DURATION));

    // Generate dice values
    const newDiceValues = rollDice(2);
    const sum = sumDice(newDiceValues);
    setDiceValues(newDiceValues);
    setRollCount((prev) => prev + 1);

    // Evaluate the result
    const result = evaluatePointPhaseRoll(sum, point, monster.remainingNumbers);

    // Handle based on result type
    switch (result.type) {
      case "hit": {
        const betResults = onMonsterHit?.(result.hitNumber) || [];
        setLastBetResults(betResults);
        setAccumulatedTurnDamage((prev) => prev + 1);
        setPhaseState({ type: "showing_result", result, diceValues: newDiceValues });
        break;
      }
      case "point_hit": {
        const hitResult = onPointHit?.();
        if (hitResult && hitResult.remainingNumbers.length > 0) {
          setPhaseState({ type: "selecting_number", remainingNumbers: hitResult.remainingNumbers });
        } else {
          // Monster is defeated (no remaining numbers)
          handleMonsterDefeat();
        }
        break;
      }
      case "escape_offered": {
        setPhaseState({ type: "escape_dialog" });
        break;
      }
      case "crap_out": {
        const crapOutResult = onCrapOut?.();
        const goldLost = crapOutResult?.goldLost || calculateCrapOutLoss(player.gold);
        const betResults = crapOutResult?.betResults || [];
        setLastBetResults(betResults);
        setPhaseState({
          type: "crap_out",
          goldLost,
          canRevive: !hasUsedRevive,
        });
        break;
      }
      case "miss": {
        setPhaseState({ type: "showing_result", result, diceValues: newDiceValues });
        break;
      }
    }
  }, [disabled, phaseState.type, point, monster.remainingNumbers, player.gold, hasUsedRevive, onMonsterHit, onPointHit, onCrapOut]);

  const handleMonsterDefeat = useCallback(() => {
    const defeatResult = onMonsterDefeated?.();
    const betResults = defeatResult?.betResults || [];
    setLastBetResults(betResults);
    setPhaseState({
      type: "monster_defeated",
      cardDrawn: defeatResult?.cardDrawn || null,
      shooterWinnings: defeatResult?.shooterWinnings || 0,
    });
  }, [onMonsterDefeated]);

  const handleNumberSelect = useCallback((number: number) => {
    onNumberSelected?.(number);
    setAccumulatedTurnDamage((prev) => prev + 1);
    // Check if monster is defeated after removing this number
    const updatedRemainingNumbers = monster.remainingNumbers.filter((n) => n !== number);
    if (updatedRemainingNumbers.length === 0) {
      handleMonsterDefeat();
    } else {
      // Continue rolling - monster not yet defeated
      setPhaseState({ type: "awaiting_roll" });
    }
  }, [monster.remainingNumbers, onNumberSelected, handleMonsterDefeat]);

  const handleEscapeChoice = useCallback((escape: boolean) => {
    if (escape) {
      const escapeResult = onEscape?.();
      const betResults = escapeResult?.betResults || [];
      setLastBetResults(betResults);
      setPhaseState({ type: "escaped" });
    } else {
      // Continue rolling
      setPhaseState({ type: "awaiting_roll" });
    }
  }, [onEscape]);

  const handleReviveChoice = useCallback((revive: boolean) => {
    if (revive) {
      onRevive?.();
      // Continue rolling after revive
      setPhaseState({ type: "awaiting_roll" });
    } else {
      setPhaseState({ type: "turn_ended", reason: "crapped_out" });
      onTurnEnd?.("crapped_out");
    }
  }, [onRevive, onTurnEnd]);

  const handleContinueFromHit = useCallback(() => {
    // Check if monster is defeated
    if (monster.remainingNumbers.length === 0) {
      handleMonsterDefeat();
    } else {
      setPhaseState({ type: "awaiting_roll" });
    }
  }, [monster.remainingNumbers.length, handleMonsterDefeat]);

  const handleContinueFromMiss = useCallback(() => {
    setPhaseState({ type: "awaiting_roll" });
  }, []);

  const handleTurnEndFromDefeat = useCallback(() => {
    setPhaseState({ type: "turn_ended", reason: "defeated" });
    onTurnEnd?.("defeated");
  }, [onTurnEnd]);

  const handleTurnEndFromEscape = useCallback(() => {
    setPhaseState({ type: "turn_ended", reason: "escaped" });
    onTurnEnd?.("escaped");
  }, [onTurnEnd]);

  const isRolling = phaseState.type === "rolling";

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <h2 className="font-bold text-gray-800 text-xl">Point Phase</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500">Point:</span>
            <span className="font-bold text-blue-600 text-lg">{point}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-500">Rolls:</span>
            <span className="font-bold text-gray-800">{rollCount}</span>
          </div>
        </div>
      </div>

      {/* Shooter Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>Shooter: <span className="font-bold text-gray-800">{player.name}</span></span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-600 font-bold">{player.gold}</span>
          <span>🪙</span>
        </span>
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
        <div className="mt-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="text-gray-500">Remaining: </span>
            <span className="font-medium">
              {monster.remainingNumbers.length > 0
                ? monster.remainingNumbers.join(", ")
                : "None!"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-purple-600 font-bold">{accumulatedTurnDamage}</span>
            <span className="text-gray-500"> damage this turn</span>
          </div>
        </div>
      </div>

      {/* Roll Instructions */}
      {phaseState.type === "awaiting_roll" && (
        <div className="bg-blue-50 rounded-lg px-4 py-3 mb-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Point Phase Outcomes:</p>
          <ul className="space-y-1 text-blue-600">
            <li>
              <span className="font-medium text-green-600">Monster Number ({monster.remainingNumbers.join(", ")}):</span>{" "}
              Hit the monster!
            </li>
            <li>
              <span className="font-medium text-purple-600">Point ({point}):</span>{" "}
              Choose a number to remove!
            </li>
            <li>
              <span className="font-medium text-red-600">7 (Crap Out):</span>{" "}
              Lose 50% gold, turn ends
            </li>
            <li>
              <span className="font-medium text-yellow-600">2 (Snake Eyes):</span>{" "}
              Escape opportunity
            </li>
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
      {phaseState.type === "awaiting_roll" && (
        <button
          onClick={handleRoll}
          disabled={disabled || isRolling}
          className={`
            w-full py-4 rounded-xl font-bold text-xl
            transition-all duration-200
            ${
              disabled || isRolling
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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

      {/* Result Displays */}
      {phaseState.type === "showing_result" && phaseState.result.type === "hit" && (
        <HitResult
          hitNumber={phaseState.result.hitNumber}
          turnDamage={accumulatedTurnDamage}
          betResults={lastBetResults}
          players={players}
          onContinue={handleContinueFromHit}
        />
      )}

      {phaseState.type === "showing_result" && phaseState.result.type === "miss" && (
        <MissResult
          sum={phaseState.result.sum}
          point={point}
          onContinue={handleContinueFromMiss}
        />
      )}

      {phaseState.type === "selecting_number" && (
        <NumberSelection
          remainingNumbers={phaseState.remainingNumbers}
          point={point}
          onSelect={handleNumberSelect}
        />
      )}

      {phaseState.type === "escape_dialog" && (
        <EscapeDialog
          player={player}
          turnDamage={accumulatedTurnDamage}
          onEscape={() => handleEscapeChoice(true)}
          onContinue={() => handleEscapeChoice(false)}
        />
      )}

      {phaseState.type === "crap_out" && (
        <CrapOutResult
          goldLost={phaseState.goldLost}
          canRevive={phaseState.canRevive}
          player={player}
          betResults={lastBetResults}
          players={players}
          onRevive={() => handleReviveChoice(true)}
          onEndTurn={() => handleReviveChoice(false)}
        />
      )}

      {phaseState.type === "monster_defeated" && (
        <MonsterDefeatedResult
          monster={monster}
          player={player}
          turnDamage={accumulatedTurnDamage}
          cardDrawn={phaseState.cardDrawn}
          shooterWinnings={phaseState.shooterWinnings}
          betResults={lastBetResults}
          players={players}
          onContinue={handleTurnEndFromDefeat}
        />
      )}

      {phaseState.type === "escaped" && (
        <EscapedResult
          betResults={lastBetResults}
          players={players}
          onContinue={handleTurnEndFromEscape}
        />
      )}

      {/* Bets Summary */}
      {bets.length > 0 && phaseState.type === "awaiting_roll" && (
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

export default PointPhase;
