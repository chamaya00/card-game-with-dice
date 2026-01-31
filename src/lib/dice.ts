// ============================================
// Core Dice Utility Functions
// ============================================

import {
  DICE_SIDES,
  NATURAL_NUMBERS,
  CRAPS_NUMBERS,
  POINT_NUMBERS,
  CRAP_OUT_NUMBER,
  ESCAPE_NUMBER,
} from "./constants";

/**
 * Rolls a specified number of dice, each with DICE_SIDES faces.
 * @param count - Number of dice to roll (default 2)
 * @returns Array of dice values
 */
export function rollDice(count: number = 2): number[] {
  const results: number[] = [];
  for (let i = 0; i < count; i++) {
    // Generate random number between 1 and DICE_SIDES (inclusive)
    results.push(Math.floor(Math.random() * DICE_SIDES) + 1);
  }
  return results;
}

/**
 * Sums the values of the given dice.
 * @param dice - Array of dice values
 * @returns Sum of all dice values
 */
export function sumDice(dice: number[]): number {
  return dice.reduce((sum, value) => sum + value, 0);
}

/**
 * Checks if a roll sum is a natural (7 or 11).
 * In craps, naturals are instant wins on the come-out roll.
 * @param sum - Sum of dice values
 * @returns True if the sum is a natural
 */
export function isNatural(sum: number): boolean {
  return (NATURAL_NUMBERS as readonly number[]).includes(sum);
}

/**
 * Checks if a roll sum is craps (2, 3, or 12).
 * In craps, these are losses on the come-out roll.
 * @param sum - Sum of dice values
 * @returns True if the sum is craps
 */
export function isCraps(sum: number): boolean {
  return (CRAPS_NUMBERS as readonly number[]).includes(sum);
}

/**
 * Checks if a roll sum is a point number (4, 5, 6, 8, 9, or 10).
 * These establish the point on the come-out roll.
 * @param sum - Sum of dice values
 * @returns True if the sum is a point number
 */
export function isPoint(sum: number): boolean {
  return (POINT_NUMBERS as readonly number[]).includes(sum);
}

/**
 * Checks if a roll results in a crap-out during the point phase.
 * Rolling a 7 during the point phase is a crap-out (loss).
 * @param sum - Sum of dice values
 * @returns True if the roll is a crap-out (7)
 */
export function isCrapOut(sum: number): boolean {
  return sum === CRAP_OUT_NUMBER;
}

/**
 * Checks if a roll is an escape roll (2) during the point phase.
 * Rolling a 2 offers the player a chance to escape.
 * @param sum - Sum of dice values
 * @returns True if the roll is an escape roll
 */
export function isEscapeRoll(sum: number): boolean {
  return sum === ESCAPE_NUMBER;
}

/**
 * Checks if a roll hits the established point during point phase.
 * @param sum - Sum of dice values
 * @param point - The established point value
 * @returns True if the roll hits the point
 */
export function isPointHit(sum: number, point: number): boolean {
  return sum === point;
}

/**
 * Checks if a roll hits one of the monster's remaining numbers.
 * @param sum - Sum of dice values
 * @param monsterNumbers - Array of remaining numbers to hit on the monster
 * @returns True if the roll hits a monster number
 */
export function isMonsterHit(sum: number, monsterNumbers: number[]): boolean {
  return monsterNumbers.includes(sum);
}

/**
 * Gets all possible sums from rolling a given number of dice.
 * Useful for probability calculations and testing.
 * @param diceCount - Number of dice
 * @returns Array of possible sums
 */
export function getPossibleSums(diceCount: number): number[] {
  return Array.from(
    { length: diceCount * DICE_SIDES - diceCount + 1 },
    (_, i) => i + diceCount
  );
}

/**
 * Calculates the probability of rolling a specific sum with 2d6.
 * @param sum - Target sum
 * @returns Probability as a number between 0 and 1
 */
export function getProbability(sum: number): number {
  // Probability distribution for 2d6
  const probabilities: Record<number, number> = {
    2: 1 / 36,
    3: 2 / 36,
    4: 3 / 36,
    5: 4 / 36,
    6: 5 / 36,
    7: 6 / 36,
    8: 5 / 36,
    9: 4 / 36,
    10: 3 / 36,
    11: 2 / 36,
    12: 1 / 36,
  };
  return probabilities[sum] ?? 0;
}

/**
 * Gets the number of ways to roll a specific sum with 2d6.
 * @param sum - Target sum
 * @returns Number of combinations
 */
export function getCombinations(sum: number): number {
  const combinations: Record<number, number> = {
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
  };
  return combinations[sum] ?? 0;
}
