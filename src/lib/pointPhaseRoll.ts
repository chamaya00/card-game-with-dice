// ============================================
// Point Phase Roll Evaluation
// ============================================

import type { PointPhaseResult } from "@/types/game";
import { isCrapOut, isEscapeRoll, isPointHit, isMonsterHit } from "./dice";

/**
 * Evaluates the result of a roll during the point phase.
 *
 * In the point phase, there are several possible outcomes (in priority order):
 * 1. Crap-out (7): Turn ends, player loses 50% gold, turn damage resets
 * 2. Point hit: Roll matches the established point - defeats monster
 * 3. Monster hit: Roll matches one of monster's remaining numbers - deals damage
 * 4. Escape offered (2): Player can choose to escape or continue
 * 5. Miss: No effect, continue rolling
 *
 * @param sum - The sum of the dice roll
 * @param point - The established point value from come-out roll
 * @param monsterNumbers - Array of remaining numbers to hit on the monster
 * @returns PointPhaseResult indicating the outcome
 * @throws Error if sum is outside valid 2d6 range or point is invalid
 */
export function evaluatePointPhaseRoll(
  sum: number,
  point: number,
  monsterNumbers: number[]
): PointPhaseResult {
  // Validate input
  if (sum < 2 || sum > 12) {
    throw new Error(
      `Invalid dice sum: ${sum}. Sum must be between 2 and 12.`
    );
  }

  if (![4, 5, 6, 8, 9, 10].includes(point)) {
    throw new Error(
      `Invalid point value: ${point}. Point must be 4, 5, 6, 8, 9, or 10.`
    );
  }

  // Priority 1: Check for crap-out (7)
  // This is the worst outcome - player loses progress
  if (isCrapOut(sum)) {
    return {
      type: "crap_out",
    };
  }

  // Priority 2: Check for point hit
  // Rolling the point defeats the monster
  if (isPointHit(sum, point)) {
    return {
      type: "point_hit",
      pointValue: point,
    };
  }

  // Priority 3: Check for monster hit
  // Rolling a number on the monster deals damage
  if (isMonsterHit(sum, monsterNumbers)) {
    return {
      type: "hit",
      hitNumber: sum,
    };
  }

  // Priority 4: Check for escape roll (2)
  // Note: We check this AFTER monster hit because if 2 is on the monster,
  // it should count as a hit, not an escape opportunity
  if (isEscapeRoll(sum)) {
    return {
      type: "escape_offered",
    };
  }

  // Priority 5: Miss - no effect
  return {
    type: "miss",
    sum,
  };
}

/**
 * Describes the point phase roll result in human-readable format.
 * Useful for UI display and logging.
 * @param result - The PointPhaseResult to describe
 * @returns Human-readable description
 */
export function describePointPhaseResult(result: PointPhaseResult): string {
  switch (result.type) {
    case "crap_out":
      return "Crap out! Seven rolled - turn ends with penalty.";
    case "point_hit":
      return `Point ${result.pointValue} hit! Monster defeated!`;
    case "hit":
      return `Hit! Rolled ${result.hitNumber} - damage dealt to monster.`;
    case "escape_offered":
      return "Snake eyes! You may escape or continue.";
    case "miss":
      return `Rolled ${result.sum} - no effect. Continue rolling.`;
  }
}

/**
 * Determines if the roll ends the turn (positively or negatively).
 * @param result - The PointPhaseResult to check
 * @returns True if the turn should end
 */
export function isTurnEnding(result: PointPhaseResult): boolean {
  return result.type === "crap_out" || result.type === "point_hit";
}

/**
 * Determines if the roll is beneficial to the player.
 * @param result - The PointPhaseResult to check
 * @returns True if the result is positive for the player
 */
export function isPositiveOutcome(result: PointPhaseResult): boolean {
  return result.type === "point_hit" || result.type === "hit";
}
