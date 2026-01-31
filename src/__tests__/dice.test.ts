import {
  rollDice,
  sumDice,
  isNatural,
  isCraps,
  isPoint,
  isCrapOut,
  isEscapeRoll,
  isPointHit,
  isMonsterHit,
  getPossibleSums,
  getProbability,
  getCombinations,
} from "@/lib/dice";
import { DICE_SIDES } from "@/lib/constants";

describe("dice utility functions", () => {
  describe("rollDice", () => {
    it("should return the correct number of dice", () => {
      expect(rollDice(1)).toHaveLength(1);
      expect(rollDice(2)).toHaveLength(2);
      expect(rollDice(3)).toHaveLength(3);
      expect(rollDice(5)).toHaveLength(5);
    });

    it("should return 2 dice by default", () => {
      expect(rollDice()).toHaveLength(2);
    });

    it("should return values between 1 and 6", () => {
      // Roll many times to ensure all values are valid
      for (let i = 0; i < 100; i++) {
        const dice = rollDice(2);
        dice.forEach((value) => {
          expect(value).toBeGreaterThanOrEqual(1);
          expect(value).toBeLessThanOrEqual(DICE_SIDES);
        });
      }
    });

    it("should return whole numbers", () => {
      const dice = rollDice(10);
      dice.forEach((value) => {
        expect(Number.isInteger(value)).toBe(true);
      });
    });
  });

  describe("sumDice", () => {
    it("should correctly sum dice values", () => {
      expect(sumDice([1, 1])).toBe(2);
      expect(sumDice([6, 6])).toBe(12);
      expect(sumDice([3, 4])).toBe(7);
      expect(sumDice([1, 2, 3])).toBe(6);
    });

    it("should return 0 for empty array", () => {
      expect(sumDice([])).toBe(0);
    });

    it("should handle single die", () => {
      expect(sumDice([5])).toBe(5);
    });
  });

  describe("isNatural", () => {
    it("should return true for 7", () => {
      expect(isNatural(7)).toBe(true);
    });

    it("should return true for 11", () => {
      expect(isNatural(11)).toBe(true);
    });

    it("should return false for non-naturals", () => {
      expect(isNatural(2)).toBe(false);
      expect(isNatural(3)).toBe(false);
      expect(isNatural(4)).toBe(false);
      expect(isNatural(5)).toBe(false);
      expect(isNatural(6)).toBe(false);
      expect(isNatural(8)).toBe(false);
      expect(isNatural(9)).toBe(false);
      expect(isNatural(10)).toBe(false);
      expect(isNatural(12)).toBe(false);
    });
  });

  describe("isCraps", () => {
    it("should return true for 2", () => {
      expect(isCraps(2)).toBe(true);
    });

    it("should return true for 3", () => {
      expect(isCraps(3)).toBe(true);
    });

    it("should return true for 12", () => {
      expect(isCraps(12)).toBe(true);
    });

    it("should return false for non-craps", () => {
      expect(isCraps(4)).toBe(false);
      expect(isCraps(5)).toBe(false);
      expect(isCraps(6)).toBe(false);
      expect(isCraps(7)).toBe(false);
      expect(isCraps(8)).toBe(false);
      expect(isCraps(9)).toBe(false);
      expect(isCraps(10)).toBe(false);
      expect(isCraps(11)).toBe(false);
    });
  });

  describe("isPoint", () => {
    it("should return true for point numbers", () => {
      expect(isPoint(4)).toBe(true);
      expect(isPoint(5)).toBe(true);
      expect(isPoint(6)).toBe(true);
      expect(isPoint(8)).toBe(true);
      expect(isPoint(9)).toBe(true);
      expect(isPoint(10)).toBe(true);
    });

    it("should return false for non-point numbers", () => {
      expect(isPoint(2)).toBe(false);
      expect(isPoint(3)).toBe(false);
      expect(isPoint(7)).toBe(false);
      expect(isPoint(11)).toBe(false);
      expect(isPoint(12)).toBe(false);
    });
  });

  describe("isCrapOut", () => {
    it("should return true for 7", () => {
      expect(isCrapOut(7)).toBe(true);
    });

    it("should return false for non-7", () => {
      expect(isCrapOut(2)).toBe(false);
      expect(isCrapOut(6)).toBe(false);
      expect(isCrapOut(8)).toBe(false);
      expect(isCrapOut(12)).toBe(false);
    });
  });

  describe("isEscapeRoll", () => {
    it("should return true for 2", () => {
      expect(isEscapeRoll(2)).toBe(true);
    });

    it("should return false for non-2", () => {
      expect(isEscapeRoll(3)).toBe(false);
      expect(isEscapeRoll(7)).toBe(false);
      expect(isEscapeRoll(12)).toBe(false);
    });
  });

  describe("isPointHit", () => {
    it("should return true when sum matches point", () => {
      expect(isPointHit(4, 4)).toBe(true);
      expect(isPointHit(10, 10)).toBe(true);
    });

    it("should return false when sum does not match point", () => {
      expect(isPointHit(5, 4)).toBe(false);
      expect(isPointHit(7, 10)).toBe(false);
    });
  });

  describe("isMonsterHit", () => {
    it("should return true when sum is in monster numbers", () => {
      expect(isMonsterHit(4, [4, 5, 6])).toBe(true);
      expect(isMonsterHit(6, [4, 5, 6])).toBe(true);
    });

    it("should return false when sum is not in monster numbers", () => {
      expect(isMonsterHit(7, [4, 5, 6])).toBe(false);
      expect(isMonsterHit(8, [4, 5, 6])).toBe(false);
    });

    it("should return false for empty monster numbers", () => {
      expect(isMonsterHit(4, [])).toBe(false);
    });
  });

  describe("getPossibleSums", () => {
    it("should return correct sums for 1 die", () => {
      expect(getPossibleSums(1)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should return correct sums for 2 dice", () => {
      const sums = getPossibleSums(2);
      expect(sums).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it("should return correct sums for 3 dice", () => {
      const sums = getPossibleSums(3);
      expect(sums[0]).toBe(3);
      expect(sums[sums.length - 1]).toBe(18);
    });
  });

  describe("getProbability", () => {
    it("should return correct probability for 7", () => {
      expect(getProbability(7)).toBeCloseTo(6 / 36);
    });

    it("should return correct probability for 2", () => {
      expect(getProbability(2)).toBeCloseTo(1 / 36);
    });

    it("should return correct probability for 12", () => {
      expect(getProbability(12)).toBeCloseTo(1 / 36);
    });

    it("should return 0 for invalid sums", () => {
      expect(getProbability(1)).toBe(0);
      expect(getProbability(13)).toBe(0);
    });

    it("should have all probabilities sum to 1", () => {
      let total = 0;
      for (let i = 2; i <= 12; i++) {
        total += getProbability(i);
      }
      expect(total).toBeCloseTo(1);
    });
  });

  describe("getCombinations", () => {
    it("should return correct combinations", () => {
      expect(getCombinations(2)).toBe(1);
      expect(getCombinations(3)).toBe(2);
      expect(getCombinations(4)).toBe(3);
      expect(getCombinations(5)).toBe(4);
      expect(getCombinations(6)).toBe(5);
      expect(getCombinations(7)).toBe(6);
      expect(getCombinations(8)).toBe(5);
      expect(getCombinations(9)).toBe(4);
      expect(getCombinations(10)).toBe(3);
      expect(getCombinations(11)).toBe(2);
      expect(getCombinations(12)).toBe(1);
    });

    it("should return 0 for invalid sums", () => {
      expect(getCombinations(1)).toBe(0);
      expect(getCombinations(13)).toBe(0);
    });

    it("should total 36 combinations", () => {
      let total = 0;
      for (let i = 2; i <= 12; i++) {
        total += getCombinations(i);
      }
      expect(total).toBe(36);
    });
  });
});
