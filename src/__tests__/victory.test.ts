import {
  addVictoryPoints,
  checkVictory,
  checkVictoryWithBonus,
  getEffectiveVictoryPoints,
  getWinner,
  getWinners,
  resolveTieBreaker,
  getPlayerRankings,
  pointsToWin,
  formatVictoryPoints,
} from "@/lib/victory";
import { VICTORY_POINTS_TO_WIN, DAMAGE_LEADER_BONUS } from "@/lib/constants";
import type { Player, PermanentCard } from "@/types/game";

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

// Helper to create a mock permanent card
function createMockPermanentCard(): PermanentCard {
  return {
    type: "permanent",
    id: "test-card-1",
    name: "Test Card",
    cost: 3,
    effect: "REROLL",
    description: "Test description",
  };
}

describe("victory utility functions", () => {
  describe("addVictoryPoints", () => {
    it("should add victory points to a player", () => {
      const player = createMockPlayer({ victoryPoints: 5 });
      const result = addVictoryPoints(player, 3);

      expect(result.newPoints).toBe(8);
      expect(result.pointsAdded).toBe(3);
      expect(result.hasWon).toBe(false);
    });

    it("should indicate win when reaching threshold", () => {
      const player = createMockPlayer({ victoryPoints: 8 });
      const result = addVictoryPoints(player, 2);

      expect(result.newPoints).toBe(10);
      expect(result.hasWon).toBe(true);
    });

    it("should indicate win when exceeding threshold", () => {
      const player = createMockPlayer({ victoryPoints: 8 });
      const result = addVictoryPoints(player, 5);

      expect(result.newPoints).toBe(13);
      expect(result.hasWon).toBe(true);
    });

    it("should handle negative points by ignoring them", () => {
      const player = createMockPlayer({ victoryPoints: 5 });
      const result = addVictoryPoints(player, -2);

      expect(result.newPoints).toBe(5);
      expect(result.pointsAdded).toBe(0);
    });

    it("should handle zero points", () => {
      const player = createMockPlayer({ victoryPoints: 5 });
      const result = addVictoryPoints(player, 0);

      expect(result.newPoints).toBe(5);
      expect(result.pointsAdded).toBe(0);
    });
  });

  describe("checkVictory", () => {
    it("should return false when below threshold", () => {
      const player = createMockPlayer({ victoryPoints: 5 });
      expect(checkVictory(player)).toBe(false);
    });

    it("should return true when at threshold", () => {
      const player = createMockPlayer({ victoryPoints: VICTORY_POINTS_TO_WIN });
      expect(checkVictory(player)).toBe(true);
    });

    it("should return true when above threshold", () => {
      const player = createMockPlayer({
        victoryPoints: VICTORY_POINTS_TO_WIN + 2,
      });
      expect(checkVictory(player)).toBe(true);
    });
  });

  describe("checkVictoryWithBonus", () => {
    it("should not include bonus for non-leader", () => {
      const player = createMockPlayer({ victoryPoints: 8 });
      expect(checkVictoryWithBonus(player, false)).toBe(false);
    });

    it("should include bonus for damage leader", () => {
      const player = createMockPlayer({
        victoryPoints: VICTORY_POINTS_TO_WIN - DAMAGE_LEADER_BONUS,
      });
      expect(checkVictoryWithBonus(player, true)).toBe(true);
    });
  });

  describe("getEffectiveVictoryPoints", () => {
    it("should return base points for non-leader", () => {
      const player = createMockPlayer({ victoryPoints: 5 });
      expect(getEffectiveVictoryPoints(player, false)).toBe(5);
    });

    it("should add bonus for damage leader", () => {
      const player = createMockPlayer({ victoryPoints: 5 });
      expect(getEffectiveVictoryPoints(player, true)).toBe(
        5 + DAMAGE_LEADER_BONUS
      );
    });
  });

  describe("getWinner", () => {
    it("should return null when no winner", () => {
      const players = [
        createMockPlayer({ id: "p1", victoryPoints: 5 }),
        createMockPlayer({ id: "p2", victoryPoints: 3 }),
      ];
      expect(getWinner(players, null)).toBeNull();
    });

    it("should return the winner when one exists", () => {
      const players = [
        createMockPlayer({ id: "p1", victoryPoints: 5 }),
        createMockPlayer({ id: "p2", victoryPoints: VICTORY_POINTS_TO_WIN }),
      ];
      const winner = getWinner(players, null);
      expect(winner?.id).toBe("p2");
    });

    it("should include damage leader bonus", () => {
      const players = [
        createMockPlayer({ id: "p1", victoryPoints: 5 }),
        createMockPlayer({
          id: "p2",
          victoryPoints: VICTORY_POINTS_TO_WIN - DAMAGE_LEADER_BONUS,
        }),
      ];
      const winner = getWinner(players, "p2");
      expect(winner?.id).toBe("p2");
    });
  });

  describe("getWinners", () => {
    it("should return empty array when no winners", () => {
      const players = [
        createMockPlayer({ id: "p1", victoryPoints: 5 }),
        createMockPlayer({ id: "p2", victoryPoints: 3 }),
      ];
      expect(getWinners(players, null)).toHaveLength(0);
    });

    it("should return multiple winners", () => {
      const players = [
        createMockPlayer({ id: "p1", victoryPoints: VICTORY_POINTS_TO_WIN }),
        createMockPlayer({ id: "p2", victoryPoints: VICTORY_POINTS_TO_WIN }),
        createMockPlayer({ id: "p3", victoryPoints: 5 }),
      ];
      const winners = getWinners(players, null);
      expect(winners).toHaveLength(2);
    });
  });

  describe("resolveTieBreaker", () => {
    it("should return null for empty array", () => {
      expect(resolveTieBreaker([], null)).toBeNull();
    });

    it("should return the single winner", () => {
      const winner = createMockPlayer({ id: "p1" });
      expect(resolveTieBreaker([winner], null)).toBe(winner);
    });

    it("should pick winner by victory points", () => {
      const players = [
        createMockPlayer({
          id: "p1",
          victoryPoints: VICTORY_POINTS_TO_WIN + 2,
        }),
        createMockPlayer({ id: "p2", victoryPoints: VICTORY_POINTS_TO_WIN }),
      ];
      const winner = resolveTieBreaker(players, null);
      expect(winner?.id).toBe("p1");
    });

    it("should use gold as tiebreaker", () => {
      const players = [
        createMockPlayer({
          id: "p1",
          victoryPoints: VICTORY_POINTS_TO_WIN,
          gold: 5,
        }),
        createMockPlayer({
          id: "p2",
          victoryPoints: VICTORY_POINTS_TO_WIN,
          gold: 10,
        }),
      ];
      const winner = resolveTieBreaker(players, null);
      expect(winner?.id).toBe("p2");
    });

    it("should use permanent card count as final tiebreaker", () => {
      const players = [
        createMockPlayer({
          id: "p1",
          victoryPoints: VICTORY_POINTS_TO_WIN,
          gold: 10,
          permanentCards: [createMockPermanentCard()],
        }),
        createMockPlayer({
          id: "p2",
          victoryPoints: VICTORY_POINTS_TO_WIN,
          gold: 10,
          permanentCards: [createMockPermanentCard(), createMockPermanentCard()],
        }),
      ];
      const winner = resolveTieBreaker(players, null);
      expect(winner?.id).toBe("p2");
    });

    it("should return null for true tie (shared victory)", () => {
      const card = createMockPermanentCard();
      const players = [
        createMockPlayer({
          id: "p1",
          victoryPoints: VICTORY_POINTS_TO_WIN,
          gold: 10,
          permanentCards: [card],
        }),
        createMockPlayer({
          id: "p2",
          victoryPoints: VICTORY_POINTS_TO_WIN,
          gold: 10,
          permanentCards: [{ ...card, id: "card-2" }],
        }),
      ];
      const winner = resolveTieBreaker(players, null);
      expect(winner).toBeNull();
    });
  });

  describe("getPlayerRankings", () => {
    it("should sort players by effective victory points descending", () => {
      const players = [
        createMockPlayer({ id: "p1", victoryPoints: 3 }),
        createMockPlayer({ id: "p2", victoryPoints: 8 }),
        createMockPlayer({ id: "p3", victoryPoints: 5 }),
      ];
      const rankings = getPlayerRankings(players, null);
      expect(rankings[0].id).toBe("p2");
      expect(rankings[1].id).toBe("p3");
      expect(rankings[2].id).toBe("p1");
    });

    it("should account for damage leader bonus", () => {
      const players = [
        createMockPlayer({ id: "p1", victoryPoints: 5 }),
        createMockPlayer({ id: "p2", victoryPoints: 3 }),
      ];
      const rankings = getPlayerRankings(players, "p2");
      // p2 has 3 + 3 = 6, p1 has 5
      expect(rankings[0].id).toBe("p2");
    });
  });

  describe("pointsToWin", () => {
    it("should calculate points needed", () => {
      const player = createMockPlayer({ victoryPoints: 7 });
      expect(pointsToWin(player, false)).toBe(3);
    });

    it("should return 0 when already won", () => {
      const player = createMockPlayer({ victoryPoints: VICTORY_POINTS_TO_WIN });
      expect(pointsToWin(player, false)).toBe(0);
    });

    it("should account for damage leader bonus", () => {
      const player = createMockPlayer({ victoryPoints: 5 });
      expect(pointsToWin(player, true)).toBe(
        VICTORY_POINTS_TO_WIN - 5 - DAMAGE_LEADER_BONUS
      );
    });

    it("should not return negative", () => {
      const player = createMockPlayer({
        victoryPoints: VICTORY_POINTS_TO_WIN + 5,
      });
      expect(pointsToWin(player, false)).toBe(0);
    });
  });

  describe("formatVictoryPoints", () => {
    it("should format without bonus for non-leader", () => {
      const player = createMockPlayer({ victoryPoints: 7 });
      expect(formatVictoryPoints(player, false)).toBe("7 VP");
    });

    it("should include bonus indicator for damage leader", () => {
      const player = createMockPlayer({ victoryPoints: 7 });
      const formatted = formatVictoryPoints(player, true);
      expect(formatted).toBe(`7 VP (+${DAMAGE_LEADER_BONUS})`);
    });
  });
});
