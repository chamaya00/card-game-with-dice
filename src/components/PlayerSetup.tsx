"use client";

import React, { useState, useCallback } from "react";
import { MIN_PLAYERS, MAX_PLAYERS, STARTING_GOLD, VICTORY_POINTS_TO_WIN } from "@/lib/constants";
import { validatePlayerNames, ValidationResult } from "@/lib/gameInit";

// ============================================
// Types
// ============================================

export interface PlayerSetupProps {
  /** Callback when game is started with valid player names */
  onStartGame: (playerNames: string[]) => void;
  /** Optional initial player names */
  initialNames?: string[];
  /** Custom className */
  className?: string;
}

interface PlayerInput {
  id: string;
  name: string;
  error?: string;
}

// ============================================
// Helper Functions
// ============================================

function generateInputId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyInput(): PlayerInput {
  return { id: generateInputId(), name: "" };
}

// ============================================
// Player Input Row Component
// ============================================

interface PlayerInputRowProps {
  index: number;
  input: PlayerInput;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  autoFocus?: boolean;
}

function PlayerInputRow({
  index,
  input,
  onChange,
  onRemove,
  canRemove,
  autoFocus = false,
}: PlayerInputRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Player number badge */}
      <div
        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0"
        aria-hidden="true"
      >
        {index + 1}
      </div>

      {/* Input field */}
      <div className="flex-1">
        <input
          type="text"
          value={input.name}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Player ${index + 1} name`}
          maxLength={20}
          autoFocus={autoFocus}
          className={`
            w-full px-3 py-2 rounded-lg border-2 transition-all
            focus:outline-none focus:ring-2 focus:ring-blue-300
            ${input.error
              ? "border-red-400 bg-red-50 focus:border-red-500"
              : "border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500"
            }
          `}
          aria-label={`Player ${index + 1} name`}
          aria-invalid={!!input.error}
          aria-describedby={input.error ? `${input.id}-error` : undefined}
        />
        {input.error && (
          <p
            id={`${input.id}-error`}
            className="text-red-500 text-xs mt-1"
            role="alert"
          >
            {input.error}
          </p>
        )}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center
          transition-all text-lg
          ${canRemove
            ? "bg-red-100 text-red-600 hover:bg-red-200 hover:scale-110"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }
        `}
        aria-label={`Remove player ${index + 1}`}
        title={canRemove ? "Remove player" : `Minimum ${MIN_PLAYERS} players required`}
      >
        &times;
      </button>
    </div>
  );
}

// ============================================
// Game Info Component
// ============================================

function GameInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
        <span>🎲</span>
        How to Play
      </h3>
      <ul className="text-sm text-blue-700 space-y-1">
        <li className="flex items-start gap-2">
          <span className="text-blue-400">•</span>
          <span>Roll dice to defeat monsters and earn Victory Points</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-400">•</span>
          <span>First player to reach <strong>{VICTORY_POINTS_TO_WIN} VP</strong> wins!</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-400">•</span>
          <span>Each player starts with <strong>{STARTING_GOLD} gold</strong></span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-400">•</span>
          <span>Buy cards from the marketplace to gain advantages</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-blue-400">•</span>
          <span>Bet on other players&apos; turns to earn more gold</span>
        </li>
      </ul>
    </div>
  );
}

// ============================================
// Main PlayerSetup Component
// ============================================

export function PlayerSetup({
  onStartGame,
  initialNames = [],
  className = "",
}: PlayerSetupProps) {
  // Initialize player inputs
  const [playerInputs, setPlayerInputs] = useState<PlayerInput[]>(() => {
    if (initialNames.length >= MIN_PLAYERS) {
      return initialNames.map((name) => ({ id: generateInputId(), name }));
    }
    // Start with minimum number of empty inputs
    const inputs: PlayerInput[] = [];
    for (let i = 0; i < Math.max(MIN_PLAYERS, initialNames.length); i++) {
      inputs.push({
        id: generateInputId(),
        name: initialNames[i] || "",
      });
    }
    return inputs;
  });

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change
  const handleInputChange = useCallback((index: number, value: string) => {
    setPlayerInputs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value, error: undefined };
      return updated;
    });
    setGlobalError(null);
  }, []);

  // Handle remove player
  const handleRemovePlayer = useCallback((index: number) => {
    if (playerInputs.length <= MIN_PLAYERS) return;
    setPlayerInputs((prev) => prev.filter((_, i) => i !== index));
    setGlobalError(null);
  }, [playerInputs.length]);

  // Handle add player
  const handleAddPlayer = useCallback(() => {
    if (playerInputs.length >= MAX_PLAYERS) return;
    setPlayerInputs((prev) => [...prev, createEmptyInput()]);
    setGlobalError(null);
  }, [playerInputs.length]);

  // Validate and start game
  const handleStartGame = useCallback(() => {
    setIsSubmitting(true);
    setGlobalError(null);

    // Extract names (filter empty)
    const names = playerInputs.map((input) => input.name.trim());
    const nonEmptyNames = names.filter((name) => name.length > 0);

    // Use the validation from gameInit
    const validation: ValidationResult = validatePlayerNames(nonEmptyNames);

    if (!validation.isValid) {
      // Map errors back to inputs
      setPlayerInputs((prev) => {
        const updated = [...prev];
        validation.errors.forEach((error) => {
          if (error.playerIndex !== undefined && error.playerIndex < updated.length) {
            updated[error.playerIndex] = {
              ...updated[error.playerIndex],
              error: error.message,
            };
          }
        });
        return updated;
      });

      // Set global error for non-player-specific errors
      const globalErrors = validation.errors
        .filter((e) => e.playerIndex === undefined)
        .map((e) => e.message);
      if (globalErrors.length > 0) {
        setGlobalError(globalErrors.join(". "));
      }

      setIsSubmitting(false);
      return;
    }

    // All valid - start the game
    onStartGame(nonEmptyNames);
    setIsSubmitting(false);
  }, [playerInputs, onStartGame]);

  // Handle Enter key to add player or submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const nonEmptyCount = playerInputs.filter((p) => p.name.trim()).length;
        if (nonEmptyCount >= MIN_PLAYERS) {
          handleStartGame();
        } else if (playerInputs.length < MAX_PLAYERS) {
          handleAddPlayer();
        }
      }
    },
    [playerInputs, handleStartGame, handleAddPlayer]
  );

  const canAddMore = playerInputs.length < MAX_PLAYERS;
  const canRemove = playerInputs.length > MIN_PLAYERS;
  const filledCount = playerInputs.filter((p) => p.name.trim()).length;
  const canStart = filledCount >= MIN_PLAYERS;

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Craps RPG
        </h1>
        <p className="text-gray-500">
          Enter player names to begin
        </p>
      </div>

      {/* Game Info */}
      <GameInfo />

      {/* Player Inputs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Players</h2>
          <span className="text-sm text-gray-500">
            {filledCount} of {MIN_PLAYERS}-{MAX_PLAYERS}
          </span>
        </div>

        <div className="space-y-3" onKeyDown={handleKeyDown}>
          {playerInputs.map((input, index) => (
            <PlayerInputRow
              key={input.id}
              index={index}
              input={input}
              onChange={(value) => handleInputChange(index, value)}
              onRemove={() => handleRemovePlayer(index)}
              canRemove={canRemove}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Add Player Button */}
        {canAddMore && (
          <button
            type="button"
            onClick={handleAddPlayer}
            className="
              mt-4 w-full py-2 px-4 rounded-lg
              border-2 border-dashed border-gray-300
              text-gray-500 hover:text-gray-700 hover:border-gray-400
              transition-all flex items-center justify-center gap-2
            "
          >
            <span className="text-xl">+</span>
            <span>Add Player ({playerInputs.length}/{MAX_PLAYERS})</span>
          </button>
        )}

        {/* Global Error */}
        {globalError && (
          <div
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            role="alert"
          >
            {globalError}
          </div>
        )}
      </div>

      {/* Start Game Button */}
      <button
        type="button"
        onClick={handleStartGame}
        disabled={!canStart || isSubmitting}
        className={`
          w-full py-3 px-6 rounded-xl font-bold text-lg
          transition-all duration-200
          ${canStart && !isSubmitting
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg active:scale-[0.98]"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Starting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🎲</span>
            Start Game
          </span>
        )}
      </button>

      {/* Helper text */}
      {!canStart && (
        <p className="text-center text-sm text-gray-500 mt-2">
          Enter at least {MIN_PLAYERS} player names to start
        </p>
      )}
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default PlayerSetup;
