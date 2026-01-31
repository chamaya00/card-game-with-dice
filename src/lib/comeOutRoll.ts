// ============================================
// Come-Out Roll Evaluation
// ============================================

import type { ComeOutResult } from "@/types/game";
import { isNatural, isCraps, isPoint } from "./dice";

/**
 * Evaluates the result of a come-out roll.
 *
 * In the come-out phase:
 * - Natural (7 or 11): Instant win - player defeats the monster immediately
 * - Craps (2, 3, or 12): Loss - turn ends with no damage to monster
 * - Point (4, 5, 6, 8, 9, 10): Establishes the point for the point phase
 *
 * @param sum - The sum of the dice roll
 * @returns ComeOutResult indicating natural, craps, or point establishment
 * @throws Error if sum is outside valid 2d6 range (2-12)
 */
export function evaluateComeOutRoll(sum: number): ComeOutResult {
  // Validate input
  if (sum < 2 || sum > 12) {
    throw new Error(
      `Invalid dice sum: ${sum}. Sum must be between 2 and 12.`
    );
  }

  // Check for natural (instant win)
  if (isNatural(sum)) {
    return {
      type: "natural",
      sum,
    };
  }

  // Check for craps (loss)
  if (isCraps(sum)) {
    return {
      type: "craps",
      sum,
    };
  }

  // Must be a point number - establish the point
  if (isPoint(sum)) {
    return {
      type: "point",
      pointValue: sum,
    };
  }

  // This should never happen with valid 2d6 input
  throw new Error(`Unexpected dice sum: ${sum}`);
}

/**
 * Describes the come-out roll result in human-readable format.
 * Useful for UI display and logging.
 * @param result - The ComeOutResult to describe
 * @returns Human-readable description
 */
export function describeComeOutResult(result: ComeOutResult): string {
  switch (result.type) {
    case "natural":
      return `Natural ${result.sum}! Instant win!`;
    case "craps":
      return `Craps ${result.sum}! Turn ends.`;
    case "point":
      return `Point established: ${result.pointValue}`;
  }
}
