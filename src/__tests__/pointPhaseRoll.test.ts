import {
  evaluatePointPhaseRoll,
  describePointPhaseResult,
  isTurnEnding,
  isPositiveOutcome,
} from "@/lib/pointPhaseRoll";
import type { PointPhaseResult } from "@/types/game";

describe("evaluatePointPhaseRoll", () => {
  const point = 6;
  const monsterNumbers = [4, 5, 8, 9, 10];

  describe("crap out (7)", () => {
    it("should return crap_out for 7", () => {
      const result = evaluatePointPhaseRoll(7, point, monsterNumbers);
      expect(result.type).toBe("crap_out");
    });

    it("should prioritize crap_out over everything else", () => {
      // Even if 7 were somehow in monster numbers, crap_out takes priority
      const result = evaluatePointPhaseRoll(7, point, [7, 4, 5]);
      expect(result.type).toBe("crap_out");
    });
  });

  describe("point hit", () => {
    it("should return point_hit when rolling the point", () => {
      const result = evaluatePointPhaseRoll(6, 6, monsterNumbers);
      expect(result.type).toBe("point_hit");
      if (result.type === "point_hit") {
        expect(result.pointValue).toBe(6);
      }
    });

    it("should work with different point values", () => {
      const points = [4, 5, 6, 8, 9, 10];
      points.forEach((p) => {
        const result = evaluatePointPhaseRoll(p, p, []);
        expect(result.type).toBe("point_hit");
        if (result.type === "point_hit") {
          expect(result.pointValue).toBe(p);
        }
      });
    });

    it("should prioritize point_hit over monster hit", () => {
      // Point is 8, and 8 is also in monster numbers
      const result = evaluatePointPhaseRoll(8, 8, [8, 9, 10]);
      expect(result.type).toBe("point_hit");
    });
  });

  describe("monster hit", () => {
    it("should return hit when rolling a monster number", () => {
      const result = evaluatePointPhaseRoll(4, point, monsterNumbers);
      expect(result.type).toBe("hit");
      if (result.type === "hit") {
        expect(result.hitNumber).toBe(4);
      }
    });

    it("should work with any monster number", () => {
      monsterNumbers.forEach((num) => {
        // Skip if num equals point
        if (num !== point) {
          const result = evaluatePointPhaseRoll(num, point, monsterNumbers);
          expect(result.type).toBe("hit");
          if (result.type === "hit") {
            expect(result.hitNumber).toBe(num);
          }
        }
      });
    });
  });

  describe("escape offered (2)", () => {
    it("should return escape_offered for 2 when not a monster number", () => {
      const result = evaluatePointPhaseRoll(2, point, monsterNumbers);
      expect(result.type).toBe("escape_offered");
    });

    it("should prioritize monster hit over escape when 2 is a monster number", () => {
      const numbersWithTwo = [2, 4, 5];
      const result = evaluatePointPhaseRoll(2, point, numbersWithTwo);
      expect(result.type).toBe("hit");
      if (result.type === "hit") {
        expect(result.hitNumber).toBe(2);
      }
    });
  });

  describe("miss", () => {
    it("should return miss for non-matching rolls", () => {
      // 3, 11, 12 should be misses with our test setup
      const result = evaluatePointPhaseRoll(3, point, monsterNumbers);
      expect(result.type).toBe("miss");
      if (result.type === "miss") {
        expect(result.sum).toBe(3);
      }
    });

    it("should return miss for 11 and 12", () => {
      const result11 = evaluatePointPhaseRoll(11, point, monsterNumbers);
      expect(result11.type).toBe("miss");

      const result12 = evaluatePointPhaseRoll(12, point, monsterNumbers);
      expect(result12.type).toBe("miss");
    });
  });

  describe("error handling", () => {
    it("should throw for invalid sum", () => {
      expect(() => evaluatePointPhaseRoll(1, point, monsterNumbers)).toThrow();
      expect(() => evaluatePointPhaseRoll(13, point, monsterNumbers)).toThrow();
    });

    it("should throw for invalid point value", () => {
      expect(() => evaluatePointPhaseRoll(5, 7, monsterNumbers)).toThrow();
      expect(() => evaluatePointPhaseRoll(5, 2, monsterNumbers)).toThrow();
      expect(() => evaluatePointPhaseRoll(5, 11, monsterNumbers)).toThrow();
    });
  });

  describe("priority order verification", () => {
    it("should follow correct priority: crap_out > point_hit > hit > escape > miss", () => {
      // 7 is crap_out regardless
      expect(evaluatePointPhaseRoll(7, 4, [7]).type).toBe("crap_out");

      // Point hit takes priority over monster hit
      expect(evaluatePointPhaseRoll(8, 8, [8]).type).toBe("point_hit");

      // Monster hit takes priority over escape
      expect(evaluatePointPhaseRoll(2, 4, [2]).type).toBe("hit");

      // Escape when 2 is not a monster number
      expect(evaluatePointPhaseRoll(2, 4, [4, 5]).type).toBe("escape_offered");

      // Miss for everything else
      expect(evaluatePointPhaseRoll(3, 4, [5, 6]).type).toBe("miss");
    });
  });
});

describe("describePointPhaseResult", () => {
  it("should describe crap_out", () => {
    const result: PointPhaseResult = { type: "crap_out" };
    const description = describePointPhaseResult(result);
    expect(description.toLowerCase()).toContain("crap");
    expect(description.toLowerCase()).toContain("seven");
  });

  it("should describe point_hit", () => {
    const result: PointPhaseResult = { type: "point_hit", pointValue: 8 };
    const description = describePointPhaseResult(result);
    expect(description).toContain("8");
    expect(description.toLowerCase()).toContain("point");
  });

  it("should describe hit", () => {
    const result: PointPhaseResult = { type: "hit", hitNumber: 5 };
    const description = describePointPhaseResult(result);
    expect(description).toContain("5");
    expect(description.toLowerCase()).toContain("hit");
  });

  it("should describe escape_offered", () => {
    const result: PointPhaseResult = { type: "escape_offered" };
    const description = describePointPhaseResult(result);
    expect(description.toLowerCase()).toContain("escape");
  });

  it("should describe miss", () => {
    const result: PointPhaseResult = { type: "miss", sum: 3 };
    const description = describePointPhaseResult(result);
    expect(description).toContain("3");
  });
});

describe("isTurnEnding", () => {
  it("should return true for crap_out", () => {
    expect(isTurnEnding({ type: "crap_out" })).toBe(true);
  });

  it("should return true for point_hit", () => {
    expect(isTurnEnding({ type: "point_hit", pointValue: 8 })).toBe(true);
  });

  it("should return false for hit", () => {
    expect(isTurnEnding({ type: "hit", hitNumber: 5 })).toBe(false);
  });

  it("should return false for escape_offered", () => {
    expect(isTurnEnding({ type: "escape_offered" })).toBe(false);
  });

  it("should return false for miss", () => {
    expect(isTurnEnding({ type: "miss", sum: 3 })).toBe(false);
  });
});

describe("isPositiveOutcome", () => {
  it("should return true for point_hit", () => {
    expect(isPositiveOutcome({ type: "point_hit", pointValue: 8 })).toBe(true);
  });

  it("should return true for hit", () => {
    expect(isPositiveOutcome({ type: "hit", hitNumber: 5 })).toBe(true);
  });

  it("should return false for crap_out", () => {
    expect(isPositiveOutcome({ type: "crap_out" })).toBe(false);
  });

  it("should return false for escape_offered", () => {
    expect(isPositiveOutcome({ type: "escape_offered" })).toBe(false);
  });

  it("should return false for miss", () => {
    expect(isPositiveOutcome({ type: "miss", sum: 3 })).toBe(false);
  });
});
