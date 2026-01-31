import {
  addGold,
  removeGold,
  calculateCrapOutLoss,
  canAfford,
  applyCrapOutPenalty,
  transferGold,
  formatGoldChange,
  isValidGoldAmount,
} from "@/lib/gold";
import type { Player } from "@/types/game";

// Helper to create a mock player
function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "test-player-1",
    name: "Test Player",
    gold: 10,
    victoryPoints: 0,
    damageCount: 0,
    permanentCards: [],
    singleUseCards: [],
    ...overrides,
  };
}

describe("gold utility functions", () => {
  describe("addGold", () => {
    it("should add gold to a player", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = addGold(player, 5);

      expect(result.success).toBe(true);
      expect(result.newGold).toBe(15);
      expect(result.amountChanged).toBe(5);
    });

    it("should handle adding zero gold", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = addGold(player, 0);

      expect(result.success).toBe(true);
      expect(result.newGold).toBe(10);
      expect(result.amountChanged).toBe(0);
    });

    it("should fail when adding negative gold", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = addGold(player, -5);

      expect(result.success).toBe(false);
      expect(result.newGold).toBe(10);
      expect(result.error).toBeDefined();
    });

    it("should handle large amounts", () => {
      const player = createMockPlayer({ gold: 0 });
      const result = addGold(player, 100);

      expect(result.success).toBe(true);
      expect(result.newGold).toBe(100);
    });
  });

  describe("removeGold", () => {
    it("should remove gold from a player", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = removeGold(player, 5);

      expect(result.success).toBe(true);
      expect(result.newGold).toBe(5);
      expect(result.amountChanged).toBe(5);
    });

    it("should allow removing all gold", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = removeGold(player, 10);

      expect(result.success).toBe(true);
      expect(result.newGold).toBe(0);
    });

    it("should fail when removing more gold than available", () => {
      const player = createMockPlayer({ gold: 5 });
      const result = removeGold(player, 10);

      expect(result.success).toBe(false);
      expect(result.newGold).toBe(5);
      expect(result.error).toContain("Insufficient gold");
    });

    it("should fail when removing negative gold", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = removeGold(player, -5);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle removing zero gold", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = removeGold(player, 0);

      expect(result.success).toBe(true);
      expect(result.newGold).toBe(10);
    });
  });

  describe("calculateCrapOutLoss", () => {
    it("should calculate 50% loss rounded down", () => {
      expect(calculateCrapOutLoss(10)).toBe(5);
      expect(calculateCrapOutLoss(11)).toBe(5);
      expect(calculateCrapOutLoss(9)).toBe(4);
      expect(calculateCrapOutLoss(1)).toBe(0);
    });

    it("should return 0 for 0 gold", () => {
      expect(calculateCrapOutLoss(0)).toBe(0);
    });

    it("should handle large amounts", () => {
      expect(calculateCrapOutLoss(100)).toBe(50);
      expect(calculateCrapOutLoss(101)).toBe(50);
    });
  });

  describe("canAfford", () => {
    it("should return true when player has enough gold", () => {
      const player = createMockPlayer({ gold: 10 });
      expect(canAfford(player, 5)).toBe(true);
      expect(canAfford(player, 10)).toBe(true);
    });

    it("should return false when player cannot afford", () => {
      const player = createMockPlayer({ gold: 5 });
      expect(canAfford(player, 10)).toBe(false);
    });

    it("should return true for zero cost", () => {
      const player = createMockPlayer({ gold: 0 });
      expect(canAfford(player, 0)).toBe(true);
    });
  });

  describe("applyCrapOutPenalty", () => {
    it("should apply 50% penalty rounded down", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = applyCrapOutPenalty(player);

      expect(result.success).toBe(true);
      expect(result.newGold).toBe(5);
      expect(result.amountChanged).toBe(5);
    });

    it("should handle odd gold amounts", () => {
      const player = createMockPlayer({ gold: 7 });
      const result = applyCrapOutPenalty(player);

      expect(result.newGold).toBe(4);
      expect(result.amountChanged).toBe(3);
    });

    it("should handle zero gold", () => {
      const player = createMockPlayer({ gold: 0 });
      const result = applyCrapOutPenalty(player);

      expect(result.newGold).toBe(0);
      expect(result.amountChanged).toBe(0);
    });
  });

  describe("transferGold", () => {
    it("should transfer gold between players", () => {
      const from = createMockPlayer({ id: "from", gold: 10 });
      const to = createMockPlayer({ id: "to", gold: 5 });
      const result = transferGold(from, to, 3);

      expect(result.success).toBe(true);
      expect(result.fromResult.newGold).toBe(7);
      expect(result.toResult.newGold).toBe(8);
    });

    it("should fail if sender has insufficient gold", () => {
      const from = createMockPlayer({ id: "from", gold: 2 });
      const to = createMockPlayer({ id: "to", gold: 5 });
      const result = transferGold(from, to, 5);

      expect(result.success).toBe(false);
      expect(result.fromResult.success).toBe(false);
    });
  });

  describe("formatGoldChange", () => {
    it("should format positive amounts with plus sign", () => {
      expect(formatGoldChange(5)).toBe("+5");
      expect(formatGoldChange(0)).toBe("+0");
    });

    it("should format negative amounts correctly", () => {
      expect(formatGoldChange(-5)).toBe("-5");
    });
  });

  describe("isValidGoldAmount", () => {
    it("should return true for valid amounts", () => {
      expect(isValidGoldAmount(0)).toBe(true);
      expect(isValidGoldAmount(5)).toBe(true);
      expect(isValidGoldAmount(100)).toBe(true);
    });

    it("should return false for negative amounts", () => {
      expect(isValidGoldAmount(-1)).toBe(false);
    });

    it("should return false for non-integers", () => {
      expect(isValidGoldAmount(5.5)).toBe(false);
      expect(isValidGoldAmount(0.1)).toBe(false);
    });
  });
});
