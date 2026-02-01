"use client";

import { useState, useCallback } from "react";
import { rollDice, sumDice } from "@/lib/dice";
import { evaluateComeOutRoll, describeComeOutResult } from "@/lib/comeOutRoll";
import type { ComeOutResult } from "@/types/game";

// ============================================
// Types
// ============================================

export interface DiceRollState {
  /** Current dice values */
  diceValues: number[];
  /** Sum of current dice */
  sum: number;
  /** Whether dice are currently rolling (animation) */
  isRolling: boolean;
  /** Last roll result (for come-out phase) */
  comeOutResult: ComeOutResult | null;
  /** Human-readable description of the result */
  resultDescription: string;
  /** Number of rolls made */
  rollCount: number;
}

export interface UseDiceRollReturn extends DiceRollState {
  /** Roll the dice */
  roll: (diceCount?: number) => Promise<{ diceValues: number[]; sum: number; comeOutResult: ComeOutResult }>;
  /** Reset the dice state */
  reset: () => void;
}

// ============================================
// Constants
// ============================================

const ROLL_ANIMATION_DURATION = 800; // milliseconds

const initialState: DiceRollState = {
  diceValues: [],
  sum: 0,
  isRolling: false,
  comeOutResult: null,
  resultDescription: "",
  rollCount: 0,
};

// ============================================
// Hook Implementation
// ============================================

/**
 * Custom hook for managing dice rolling with animation and come-out roll evaluation
 */
export function useDiceRoll(): UseDiceRollReturn {
  const [state, setState] = useState<DiceRollState>(initialState);

  /**
   * Roll the dice with optional animation
   */
  const roll = useCallback(
    async (diceCount: number = 2): Promise<{ diceValues: number[]; sum: number; comeOutResult: ComeOutResult }> => {
      // Start rolling animation
      setState((prev) => ({
        ...prev,
        isRolling: true,
      }));

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, ROLL_ANIMATION_DURATION));

      // Generate dice values
      const diceValues = rollDice(diceCount);
      const sum = sumDice(diceValues);
      const comeOutResult = evaluateComeOutRoll(sum);
      const resultDescription = describeComeOutResult(comeOutResult);

      // Update state with results
      setState((prev) => ({
        diceValues,
        sum,
        isRolling: false,
        comeOutResult,
        resultDescription,
        rollCount: prev.rollCount + 1,
      }));

      return { diceValues, sum, comeOutResult };
    },
    []
  );

  /**
   * Reset the dice state
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    roll,
    reset,
  };
}

export default useDiceRoll;
