import { renderHook, act, waitFor } from "@testing-library/react";
import { useDiceRoll } from "@/hooks/useDiceRoll";

// Mock the dice module to control random values
jest.mock("@/lib/dice", () => ({
  rollDice: jest.fn(),
  sumDice: jest.fn(),
}));

// Mock the comeOutRoll module
jest.mock("@/lib/comeOutRoll", () => ({
  evaluateComeOutRoll: jest.fn(),
  describeComeOutResult: jest.fn(),
}));

import { rollDice, sumDice } from "@/lib/dice";
import { evaluateComeOutRoll, describeComeOutResult } from "@/lib/comeOutRoll";

const mockRollDice = rollDice as jest.Mock;
const mockSumDice = sumDice as jest.Mock;
const mockEvaluateComeOutRoll = evaluateComeOutRoll as jest.Mock;
const mockDescribeComeOutResult = describeComeOutResult as jest.Mock;

describe("useDiceRoll hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("should start with empty dice values", () => {
      const { result } = renderHook(() => useDiceRoll());

      expect(result.current.diceValues).toEqual([]);
      expect(result.current.sum).toBe(0);
      expect(result.current.isRolling).toBe(false);
      expect(result.current.comeOutResult).toBeNull();
      expect(result.current.resultDescription).toBe("");
      expect(result.current.rollCount).toBe(0);
    });
  });

  describe("roll function", () => {
    it("should set isRolling to true during roll animation", async () => {
      mockRollDice.mockReturnValue([3, 4]);
      mockSumDice.mockReturnValue(7);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "natural", sum: 7 });
      mockDescribeComeOutResult.mockReturnValue("Natural! (7)");

      const { result } = renderHook(() => useDiceRoll());

      // Start the roll
      let rollPromise: Promise<unknown>;
      act(() => {
        rollPromise = result.current.roll();
      });

      // Should be rolling during animation
      expect(result.current.isRolling).toBe(true);

      // Advance timers to complete animation
      await act(async () => {
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      // Should no longer be rolling after animation
      expect(result.current.isRolling).toBe(false);
    });

    it("should update state with roll results", async () => {
      mockRollDice.mockReturnValue([5, 6]);
      mockSumDice.mockReturnValue(11);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "natural", sum: 11 });
      mockDescribeComeOutResult.mockReturnValue("Natural! (11)");

      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(result.current.diceValues).toEqual([5, 6]);
      expect(result.current.sum).toBe(11);
      expect(result.current.comeOutResult).toEqual({ type: "natural", sum: 11 });
      expect(result.current.resultDescription).toBe("Natural! (11)");
      expect(result.current.rollCount).toBe(1);
    });

    it("should return roll results from the function", async () => {
      mockRollDice.mockReturnValue([1, 1]);
      mockSumDice.mockReturnValue(2);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "craps", sum: 2 });
      mockDescribeComeOutResult.mockReturnValue("Craps! (2)");

      const { result } = renderHook(() => useDiceRoll());

      let rollResult: { diceValues: number[]; sum: number; comeOutResult: { type: string; sum?: number } };
      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        rollResult = await rollPromise;
      });

      expect(rollResult!.diceValues).toEqual([1, 1]);
      expect(rollResult!.sum).toBe(2);
      expect(rollResult!.comeOutResult).toEqual({ type: "craps", sum: 2 });
    });

    it("should increment roll count with each roll", async () => {
      mockRollDice.mockReturnValue([3, 3]);
      mockSumDice.mockReturnValue(6);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "point", pointValue: 6 });
      mockDescribeComeOutResult.mockReturnValue("Point established: 6");

      const { result } = renderHook(() => useDiceRoll());

      expect(result.current.rollCount).toBe(0);

      // First roll
      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(result.current.rollCount).toBe(1);

      // Second roll
      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(result.current.rollCount).toBe(2);
    });

    it("should handle custom dice count", async () => {
      mockRollDice.mockReturnValue([2, 3, 4]);
      mockSumDice.mockReturnValue(9);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "point", pointValue: 9 });
      mockDescribeComeOutResult.mockReturnValue("Point established: 9");

      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        const rollPromise = result.current.roll(3);
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(mockRollDice).toHaveBeenCalledWith(3);
    });
  });

  describe("reset function", () => {
    it("should reset state to initial values", async () => {
      mockRollDice.mockReturnValue([4, 4]);
      mockSumDice.mockReturnValue(8);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "point", pointValue: 8 });
      mockDescribeComeOutResult.mockReturnValue("Point established: 8");

      const { result } = renderHook(() => useDiceRoll());

      // First, perform a roll
      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(result.current.diceValues).toHaveLength(2);
      expect(result.current.rollCount).toBe(1);

      // Then reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.diceValues).toEqual([]);
      expect(result.current.sum).toBe(0);
      expect(result.current.isRolling).toBe(false);
      expect(result.current.comeOutResult).toBeNull();
      expect(result.current.resultDescription).toBe("");
      expect(result.current.rollCount).toBe(0);
    });
  });

  describe("come-out roll results", () => {
    it("should correctly identify natural (7)", async () => {
      mockRollDice.mockReturnValue([3, 4]);
      mockSumDice.mockReturnValue(7);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "natural", sum: 7 });
      mockDescribeComeOutResult.mockReturnValue("Natural! (7)");

      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(result.current.comeOutResult?.type).toBe("natural");
    });

    it("should correctly identify craps (2, 3, 12)", async () => {
      mockRollDice.mockReturnValue([1, 2]);
      mockSumDice.mockReturnValue(3);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "craps", sum: 3 });
      mockDescribeComeOutResult.mockReturnValue("Craps! (3)");

      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(result.current.comeOutResult?.type).toBe("craps");
    });

    it("should correctly identify point (4, 5, 6, 8, 9, 10)", async () => {
      mockRollDice.mockReturnValue([5, 5]);
      mockSumDice.mockReturnValue(10);
      mockEvaluateComeOutRoll.mockReturnValue({ type: "point", pointValue: 10 });
      mockDescribeComeOutResult.mockReturnValue("Point established: 10");

      const { result } = renderHook(() => useDiceRoll());

      await act(async () => {
        const rollPromise = result.current.roll();
        jest.advanceTimersByTime(800);
        await rollPromise;
      });

      expect(result.current.comeOutResult?.type).toBe("point");
      if (result.current.comeOutResult?.type === "point") {
        expect(result.current.comeOutResult.pointValue).toBe(10);
      }
    });
  });
});
