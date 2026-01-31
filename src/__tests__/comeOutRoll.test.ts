import {
  evaluateComeOutRoll,
  describeComeOutResult,
} from "@/lib/comeOutRoll";
import type { ComeOutResult } from "@/types/game";

describe("evaluateComeOutRoll", () => {
  describe("natural rolls", () => {
    it("should return natural for 7", () => {
      const result = evaluateComeOutRoll(7);
      expect(result.type).toBe("natural");
      if (result.type === "natural") {
        expect(result.sum).toBe(7);
      }
    });

    it("should return natural for 11", () => {
      const result = evaluateComeOutRoll(11);
      expect(result.type).toBe("natural");
      if (result.type === "natural") {
        expect(result.sum).toBe(11);
      }
    });
  });

  describe("craps rolls", () => {
    it("should return craps for 2", () => {
      const result = evaluateComeOutRoll(2);
      expect(result.type).toBe("craps");
      if (result.type === "craps") {
        expect(result.sum).toBe(2);
      }
    });

    it("should return craps for 3", () => {
      const result = evaluateComeOutRoll(3);
      expect(result.type).toBe("craps");
      if (result.type === "craps") {
        expect(result.sum).toBe(3);
      }
    });

    it("should return craps for 12", () => {
      const result = evaluateComeOutRoll(12);
      expect(result.type).toBe("craps");
      if (result.type === "craps") {
        expect(result.sum).toBe(12);
      }
    });
  });

  describe("point establishment", () => {
    it("should establish point for 4", () => {
      const result = evaluateComeOutRoll(4);
      expect(result.type).toBe("point");
      if (result.type === "point") {
        expect(result.pointValue).toBe(4);
      }
    });

    it("should establish point for 5", () => {
      const result = evaluateComeOutRoll(5);
      expect(result.type).toBe("point");
      if (result.type === "point") {
        expect(result.pointValue).toBe(5);
      }
    });

    it("should establish point for 6", () => {
      const result = evaluateComeOutRoll(6);
      expect(result.type).toBe("point");
      if (result.type === "point") {
        expect(result.pointValue).toBe(6);
      }
    });

    it("should establish point for 8", () => {
      const result = evaluateComeOutRoll(8);
      expect(result.type).toBe("point");
      if (result.type === "point") {
        expect(result.pointValue).toBe(8);
      }
    });

    it("should establish point for 9", () => {
      const result = evaluateComeOutRoll(9);
      expect(result.type).toBe("point");
      if (result.type === "point") {
        expect(result.pointValue).toBe(9);
      }
    });

    it("should establish point for 10", () => {
      const result = evaluateComeOutRoll(10);
      expect(result.type).toBe("point");
      if (result.type === "point") {
        expect(result.pointValue).toBe(10);
      }
    });
  });

  describe("error handling", () => {
    it("should throw for sum less than 2", () => {
      expect(() => evaluateComeOutRoll(1)).toThrow();
      expect(() => evaluateComeOutRoll(0)).toThrow();
      expect(() => evaluateComeOutRoll(-1)).toThrow();
    });

    it("should throw for sum greater than 12", () => {
      expect(() => evaluateComeOutRoll(13)).toThrow();
      expect(() => evaluateComeOutRoll(100)).toThrow();
    });
  });

  describe("complete coverage of all sums", () => {
    it("should handle all possible 2d6 sums", () => {
      const results: Record<number, ComeOutResult["type"]> = {};
      for (let i = 2; i <= 12; i++) {
        const result = evaluateComeOutRoll(i);
        results[i] = result.type;
      }

      // Verify the expected distribution
      expect(results[2]).toBe("craps");
      expect(results[3]).toBe("craps");
      expect(results[4]).toBe("point");
      expect(results[5]).toBe("point");
      expect(results[6]).toBe("point");
      expect(results[7]).toBe("natural");
      expect(results[8]).toBe("point");
      expect(results[9]).toBe("point");
      expect(results[10]).toBe("point");
      expect(results[11]).toBe("natural");
      expect(results[12]).toBe("craps");
    });
  });
});

describe("describeComeOutResult", () => {
  it("should describe natural result", () => {
    const result: ComeOutResult = { type: "natural", sum: 7 };
    const description = describeComeOutResult(result);
    expect(description).toContain("Natural");
    expect(description).toContain("7");
  });

  it("should describe craps result", () => {
    const result: ComeOutResult = { type: "craps", sum: 2 };
    const description = describeComeOutResult(result);
    expect(description).toContain("Craps");
    expect(description).toContain("2");
  });

  it("should describe point result", () => {
    const result: ComeOutResult = { type: "point", pointValue: 8 };
    const description = describeComeOutResult(result);
    expect(description).toContain("Point");
    expect(description).toContain("8");
  });
});
