import {
  validateBet,
  createBet,
  getBetSummary,
  getBetsByType,
  getPlayerBet,
  hasPlayerBet,
  processComeOutNatural,
  processComeOutCraps,
  processPointPhaseHit,
  processMonsterDefeated,
  calculateShooterWinnings,
  processCrapOut,
  processEscape,
  formatBetDisplay,
  getBetTypeColor,
  getBetTypeLabel,
} from "@/lib/betting";
import type { Player, Bet } from "@/types/game";
import { MAX_BET_AMOUNT } from "@/lib/constants";

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

// Helper to create mock bets
function createMockBet(overrides: Partial<Bet> = {}): Bet {
  return {
    playerId: "bettor-1",
    type: "FOR",
    amount: 3,
    ...overrides,
  };
}

describe("betting utility functions", () => {
  describe("validateBet", () => {
    it("should validate a valid FOR bet", () => {
      const player = createMockPlayer({ id: "bettor", gold: 10 });
      const result = validateBet(player, "FOR", 3, "shooter-id", []);

      expect(result.success).toBe(true);
    });

    it("should validate a valid AGAINST bet", () => {
      const player = createMockPlayer({ id: "bettor", gold: 10 });
      const result = validateBet(player, "AGAINST", 5, "shooter-id", []);

      expect(result.success).toBe(true);
    });

    it("should reject betting on yourself", () => {
      const player = createMockPlayer({ id: "shooter" });
      const result = validateBet(player, "FOR", 3, "shooter", []);

      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot bet on your own");
    });

    it("should reject zero amount", () => {
      const player = createMockPlayer({ id: "bettor", gold: 10 });
      const result = validateBet(player, "FOR", 0, "shooter", []);

      expect(result.success).toBe(false);
      expect(result.error).toContain("greater than 0");
    });

    it("should reject negative amount", () => {
      const player = createMockPlayer({ id: "bettor", gold: 10 });
      const result = validateBet(player, "FOR", -1, "shooter", []);

      expect(result.success).toBe(false);
      expect(result.error).toContain("greater than 0");
    });

    it("should reject non-integer amounts", () => {
      const player = createMockPlayer({ id: "bettor", gold: 10 });
      const result = validateBet(player, "FOR", 2.5, "shooter", []);

      expect(result.success).toBe(false);
      expect(result.error).toContain("whole number");
    });

    it("should reject amounts over max bet", () => {
      const player = createMockPlayer({ id: "bettor", gold: 100 });
      const result = validateBet(player, "FOR", MAX_BET_AMOUNT + 1, "shooter", []);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Maximum bet");
    });

    it("should reject when player cannot afford", () => {
      const player = createMockPlayer({ id: "bettor", gold: 2 });
      const result = validateBet(player, "FOR", 5, "shooter", []);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Not enough gold");
    });

    it("should reject duplicate bets", () => {
      const player = createMockPlayer({ id: "bettor", gold: 10 });
      const existingBets = [createMockBet({ playerId: "bettor" })];
      const result = validateBet(player, "AGAINST", 3, "shooter", existingBets);

      expect(result.success).toBe(false);
      expect(result.error).toContain("already placed");
    });

    it("should allow bet when other players have bet", () => {
      const player = createMockPlayer({ id: "bettor", gold: 10 });
      const existingBets = [createMockBet({ playerId: "other-player" })];
      const result = validateBet(player, "FOR", 3, "shooter", existingBets);

      expect(result.success).toBe(true);
    });
  });

  describe("createBet", () => {
    it("should create a FOR bet", () => {
      const bet = createBet("player-1", "FOR", 5);

      expect(bet.playerId).toBe("player-1");
      expect(bet.type).toBe("FOR");
      expect(bet.amount).toBe(5);
    });

    it("should create an AGAINST bet", () => {
      const bet = createBet("player-2", "AGAINST", 3);

      expect(bet.type).toBe("AGAINST");
    });
  });

  describe("getBetSummary", () => {
    it("should summarize empty bets", () => {
      const summary = getBetSummary([]);

      expect(summary.forBets).toHaveLength(0);
      expect(summary.againstBets).toHaveLength(0);
      expect(summary.totalFor).toBe(0);
      expect(summary.totalAgainst).toBe(0);
      expect(summary.totalBettors).toBe(0);
    });

    it("should summarize mixed bets", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "FOR", amount: 5 },
        { playerId: "p3", type: "AGAINST", amount: 4 },
      ];

      const summary = getBetSummary(bets);

      expect(summary.forBets).toHaveLength(2);
      expect(summary.againstBets).toHaveLength(1);
      expect(summary.totalFor).toBe(8);
      expect(summary.totalAgainst).toBe(4);
      expect(summary.totalBettors).toBe(3);
    });
  });

  describe("getBetsByType", () => {
    it("should filter FOR bets", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
        { playerId: "p3", type: "FOR", amount: 2 },
      ];

      const forBets = getBetsByType(bets, "FOR");

      expect(forBets).toHaveLength(2);
      expect(forBets.every((b) => b.type === "FOR")).toBe(true);
    });

    it("should filter AGAINST bets", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
      ];

      const againstBets = getBetsByType(bets, "AGAINST");

      expect(againstBets).toHaveLength(1);
    });
  });

  describe("getPlayerBet", () => {
    it("should find player bet", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
      ];

      const bet = getPlayerBet(bets, "p1");

      expect(bet).toBeDefined();
      expect(bet?.playerId).toBe("p1");
    });

    it("should return undefined for nonexistent player", () => {
      const bets: Bet[] = [{ playerId: "p1", type: "FOR", amount: 3 }];

      const bet = getPlayerBet(bets, "nonexistent");

      expect(bet).toBeUndefined();
    });
  });

  describe("hasPlayerBet", () => {
    it("should return true when player has bet", () => {
      const bets: Bet[] = [{ playerId: "p1", type: "FOR", amount: 3 }];

      expect(hasPlayerBet(bets, "p1")).toBe(true);
    });

    it("should return false when player has not bet", () => {
      const bets: Bet[] = [{ playerId: "p1", type: "FOR", amount: 3 }];

      expect(hasPlayerBet(bets, "other")).toBe(false);
    });
  });

  describe("processComeOutNatural", () => {
    it("should return all bets (bets returned)", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
      ];

      const results = processComeOutNatural(bets);

      expect(results).toHaveLength(2);
      expect(results[0].goldChange).toBe(3); // Bet returned
      expect(results[1].goldChange).toBe(5); // Bet returned
      expect(results[0].reason).toContain("returned");
    });
  });

  describe("processComeOutCraps", () => {
    it("should make FOR bets lose and AGAINST bets double", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
      ];

      const results = processComeOutCraps(bets);

      const forResult = results.find((r) => r.playerId === "p1");
      const againstResult = results.find((r) => r.playerId === "p2");

      expect(forResult?.goldChange).toBe(0); // Lost bet
      expect(againstResult?.goldChange).toBe(10); // Doubled
    });
  });

  describe("processPointPhaseHit", () => {
    it("should give +1 gold to FOR bettors", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "FOR", amount: 5 },
        { playerId: "p3", type: "AGAINST", amount: 4 },
      ];

      const results = processPointPhaseHit(bets);

      // Only FOR bettors get results
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.goldChange === 1)).toBe(true);
    });

    it("should return empty array when no FOR bets", () => {
      const bets: Bet[] = [{ playerId: "p1", type: "AGAINST", amount: 3 }];

      const results = processPointPhaseHit(bets);

      expect(results).toHaveLength(0);
    });
  });

  describe("processMonsterDefeated", () => {
    it("should return FOR bets and take AGAINST bets", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
      ];

      const results = processMonsterDefeated(bets, 2);

      const forResult = results.find((r) => r.playerId === "p1");
      const againstResult = results.find((r) => r.playerId === "p2");

      expect(forResult?.goldChange).toBe(3); // Original bet returned
      expect(againstResult?.goldChange).toBe(0); // Lost to shooter
    });
  });

  describe("calculateShooterWinnings", () => {
    it("should sum all AGAINST bets", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
        { playerId: "p3", type: "AGAINST", amount: 4 },
      ];

      const winnings = calculateShooterWinnings(bets);

      expect(winnings).toBe(9); // 5 + 4
    });

    it("should return 0 when no AGAINST bets", () => {
      const bets: Bet[] = [{ playerId: "p1", type: "FOR", amount: 3 }];

      const winnings = calculateShooterWinnings(bets);

      expect(winnings).toBe(0);
    });
  });

  describe("processCrapOut", () => {
    it("should make FOR bets lose and AGAINST bets double", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
      ];

      const results = processCrapOut(bets);

      const forResult = results.find((r) => r.playerId === "p1");
      const againstResult = results.find((r) => r.playerId === "p2");

      expect(forResult?.goldChange).toBe(0);
      expect(againstResult?.goldChange).toBe(10);
      expect(forResult?.reason).toContain("crapped out");
    });
  });

  describe("processEscape", () => {
    it("should return all bets", () => {
      const bets: Bet[] = [
        { playerId: "p1", type: "FOR", amount: 3 },
        { playerId: "p2", type: "AGAINST", amount: 5 },
      ];

      const results = processEscape(bets);

      expect(results[0].goldChange).toBe(3);
      expect(results[1].goldChange).toBe(5);
      expect(results[0].reason).toContain("escaped");
    });
  });

  describe("formatBetDisplay", () => {
    it("should format bet display string", () => {
      const bet: Bet = { playerId: "p1", type: "FOR", amount: 5 };
      const display = formatBetDisplay(bet, "Player One");

      expect(display).toBe("Player One bets 5g FOR");
    });

    it("should format AGAINST bet", () => {
      const bet: Bet = { playerId: "p1", type: "AGAINST", amount: 3 };
      const display = formatBetDisplay(bet, "Test");

      expect(display).toContain("AGAINST");
    });
  });

  describe("getBetTypeColor", () => {
    it("should return green colors for FOR", () => {
      const colors = getBetTypeColor("FOR");

      expect(colors.bg).toContain("green");
      expect(colors.text).toContain("green");
    });

    it("should return red colors for AGAINST", () => {
      const colors = getBetTypeColor("AGAINST");

      expect(colors.bg).toContain("red");
      expect(colors.text).toContain("red");
    });
  });

  describe("getBetTypeLabel", () => {
    it("should return label with icon for FOR", () => {
      const label = getBetTypeLabel("FOR");

      expect(label).toContain("FOR");
      expect(label).toContain("👍");
    });

    it("should return label with icon for AGAINST", () => {
      const label = getBetTypeLabel("AGAINST");

      expect(label).toContain("AGAINST");
      expect(label).toContain("👎");
    });
  });
});
