import {
  canRefreshMarketplace,
  validateCardPurchase,
  getAffordableCards,
  getMarketplaceByType,
  isMarketplaceLow,
  getMarketplaceCardCount,
  isMarketplaceFull,
  getMarketplaceCard,
  getCardDisplayInfo,
  sortCardsByCost,
  sortCardsByTypeAndCost,
} from "@/lib/marketplace";
import type {
  Player,
  Marketplace,
  Card,
  PermanentCard,
  SingleUseCard,
  PointCard,
} from "@/types/game";
import { MARKETPLACE_REFRESH_COST, MARKETPLACE_SIZE } from "@/lib/constants";

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

// Helper to create mock cards
function createMockPermanentCard(
  overrides: Partial<PermanentCard> = {}
): PermanentCard {
  return {
    type: "permanent",
    id: "perm-test-1",
    name: "+1 Die",
    cost: 5,
    effect: "PLUS_ONE_DIE",
    description: "Roll 3 dice and keep the best 2",
    ...overrides,
  };
}

function createMockSingleUseCard(
  overrides: Partial<SingleUseCard> = {}
): SingleUseCard {
  return {
    type: "single_use",
    id: "single-test-1",
    name: "Stun",
    cost: 2,
    effect: "STUN",
    description: "Skip your rolling phase this turn",
    ...overrides,
  };
}

function createMockPointCard(overrides: Partial<PointCard> = {}): PointCard {
  return {
    type: "point",
    id: "point-test-1",
    name: "+1 Point",
    cost: 2,
    points: 1,
    ...overrides,
  };
}

function createMockMarketplace(cards: Card[] = []): Marketplace {
  return { cards };
}

describe("marketplace utility functions", () => {
  describe("canRefreshMarketplace", () => {
    it("should allow refresh when player has enough gold", () => {
      const player = createMockPlayer({ gold: MARKETPLACE_REFRESH_COST });
      const result = canRefreshMarketplace(player);

      expect(result.success).toBe(true);
      expect(result.cost).toBe(MARKETPLACE_REFRESH_COST);
      expect(result.currentGold).toBe(MARKETPLACE_REFRESH_COST);
    });

    it("should allow refresh with excess gold", () => {
      const player = createMockPlayer({ gold: 10 });
      const result = canRefreshMarketplace(player);

      expect(result.success).toBe(true);
    });

    it("should reject refresh when player cannot afford", () => {
      const player = createMockPlayer({ gold: MARKETPLACE_REFRESH_COST - 1 });
      const result = canRefreshMarketplace(player);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("Not enough gold");
    });

    it("should reject refresh with zero gold", () => {
      const player = createMockPlayer({ gold: 0 });
      const result = canRefreshMarketplace(player);

      expect(result.success).toBe(false);
    });
  });

  describe("validateCardPurchase", () => {
    it("should validate successful purchase of permanent card", () => {
      const player = createMockPlayer({ gold: 10, permanentCards: [] });
      const card = createMockPermanentCard({ cost: 5 });
      const marketplace = createMockMarketplace([card]);

      const result = validateCardPurchase(player, marketplace, card.id);

      expect(result.success).toBe(true);
      expect(result.card).toEqual(card);
      expect(result.canHold).toBe(true);
      expect(result.canAffordCard).toBe(true);
    });

    it("should validate successful purchase of single-use card", () => {
      const player = createMockPlayer({ gold: 10, singleUseCards: [] });
      const card = createMockSingleUseCard({ cost: 2 });
      const marketplace = createMockMarketplace([card]);

      const result = validateCardPurchase(player, marketplace, card.id);

      expect(result.success).toBe(true);
    });

    it("should validate successful purchase of point card", () => {
      const player = createMockPlayer({ gold: 10 });
      const card = createMockPointCard({ cost: 2 });
      const marketplace = createMockMarketplace([card]);

      const result = validateCardPurchase(player, marketplace, card.id);

      expect(result.success).toBe(true);
    });

    it("should reject purchase when card not found", () => {
      const player = createMockPlayer({ gold: 10 });
      const marketplace = createMockMarketplace([]);

      const result = validateCardPurchase(player, marketplace, "nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("should reject purchase when player cannot afford", () => {
      const player = createMockPlayer({ gold: 3 });
      const card = createMockPermanentCard({ cost: 5 });
      const marketplace = createMockMarketplace([card]);

      const result = validateCardPurchase(player, marketplace, card.id);

      expect(result.success).toBe(false);
      expect(result.canAffordCard).toBe(false);
      expect(result.error).toContain("Not enough gold");
    });

    it("should reject permanent card when hand is full", () => {
      const fullHand: PermanentCard[] = Array(6)
        .fill(null)
        .map((_, i) => createMockPermanentCard({ id: `perm-${i}` }));
      const player = createMockPlayer({ gold: 10, permanentCards: fullHand });
      const card = createMockPermanentCard({ id: "new-perm", cost: 5 });
      const marketplace = createMockMarketplace([card]);

      const result = validateCardPurchase(player, marketplace, card.id);

      expect(result.success).toBe(false);
      expect(result.canHold).toBe(false);
      expect(result.error).toContain("Max limit");
    });

    it("should reject single-use card when hand is full", () => {
      const fullHand: SingleUseCard[] = Array(8)
        .fill(null)
        .map((_, i) => createMockSingleUseCard({ id: `single-${i}` }));
      const player = createMockPlayer({ gold: 10, singleUseCards: fullHand });
      const card = createMockSingleUseCard({ id: "new-single", cost: 2 });
      const marketplace = createMockMarketplace([card]);

      const result = validateCardPurchase(player, marketplace, card.id);

      expect(result.success).toBe(false);
      expect(result.canHold).toBe(false);
    });
  });

  describe("getAffordableCards", () => {
    it("should return all affordable cards", () => {
      const player = createMockPlayer({ gold: 5 });
      const cheapCard = createMockPermanentCard({ id: "cheap", cost: 3 });
      const expensiveCard = createMockPermanentCard({ id: "expensive", cost: 10 });
      const marketplace = createMockMarketplace([cheapCard, expensiveCard]);

      const affordable = getAffordableCards(player, marketplace);

      expect(affordable).toHaveLength(1);
      expect(affordable[0].id).toBe("cheap");
    });

    it("should return empty array when nothing is affordable", () => {
      const player = createMockPlayer({ gold: 1 });
      const card = createMockPermanentCard({ cost: 5 });
      const marketplace = createMockMarketplace([card]);

      const affordable = getAffordableCards(player, marketplace);

      expect(affordable).toHaveLength(0);
    });

    it("should consider hand limits", () => {
      const fullHand: PermanentCard[] = Array(6)
        .fill(null)
        .map((_, i) => createMockPermanentCard({ id: `perm-${i}` }));
      const player = createMockPlayer({ gold: 10, permanentCards: fullHand });
      const permCard = createMockPermanentCard({ id: "new-perm", cost: 3 });
      const singleCard = createMockSingleUseCard({ id: "single", cost: 2 });
      const marketplace = createMockMarketplace([permCard, singleCard]);

      const affordable = getAffordableCards(player, marketplace);

      // Should only include single-use card since permanent hand is full
      expect(affordable).toHaveLength(1);
      expect(affordable[0].type).toBe("single_use");
    });
  });

  describe("getMarketplaceByType", () => {
    it("should group cards by type", () => {
      const permCard = createMockPermanentCard();
      const singleCard = createMockSingleUseCard();
      const pointCard = createMockPointCard();
      const marketplace = createMockMarketplace([permCard, singleCard, pointCard]);

      const grouped = getMarketplaceByType(marketplace);

      expect(grouped.permanent).toHaveLength(1);
      expect(grouped.singleUse).toHaveLength(1);
      expect(grouped.point).toHaveLength(1);
    });

    it("should handle empty marketplace", () => {
      const marketplace = createMockMarketplace([]);

      const grouped = getMarketplaceByType(marketplace);

      expect(grouped.permanent).toHaveLength(0);
      expect(grouped.singleUse).toHaveLength(0);
      expect(grouped.point).toHaveLength(0);
    });

    it("should handle multiple cards of same type", () => {
      const cards = [
        createMockPermanentCard({ id: "perm-1" }),
        createMockPermanentCard({ id: "perm-2" }),
        createMockPermanentCard({ id: "perm-3" }),
      ];
      const marketplace = createMockMarketplace(cards);

      const grouped = getMarketplaceByType(marketplace);

      expect(grouped.permanent).toHaveLength(3);
    });
  });

  describe("isMarketplaceLow", () => {
    it("should return true when below threshold", () => {
      const marketplace = createMockMarketplace([
        createMockPermanentCard(),
        createMockSingleUseCard(),
      ]);

      expect(isMarketplaceLow(marketplace, 3)).toBe(true);
    });

    it("should return false when at or above threshold", () => {
      const cards = [
        createMockPermanentCard({ id: "1" }),
        createMockSingleUseCard({ id: "2" }),
        createMockPointCard({ id: "3" }),
      ];
      const marketplace = createMockMarketplace(cards);

      expect(isMarketplaceLow(marketplace, 3)).toBe(false);
    });

    it("should use default threshold of 3", () => {
      const marketplace = createMockMarketplace([createMockPermanentCard()]);

      expect(isMarketplaceLow(marketplace)).toBe(true);
    });
  });

  describe("getMarketplaceCardCount", () => {
    it("should return correct count", () => {
      const cards = [
        createMockPermanentCard({ id: "1" }),
        createMockSingleUseCard({ id: "2" }),
      ];
      const marketplace = createMockMarketplace(cards);

      expect(getMarketplaceCardCount(marketplace)).toBe(2);
    });

    it("should return 0 for empty marketplace", () => {
      const marketplace = createMockMarketplace([]);

      expect(getMarketplaceCardCount(marketplace)).toBe(0);
    });
  });

  describe("isMarketplaceFull", () => {
    it("should return true when at max size", () => {
      const cards = Array(MARKETPLACE_SIZE)
        .fill(null)
        .map((_, i) => createMockPermanentCard({ id: `card-${i}` }));
      const marketplace = createMockMarketplace(cards);

      expect(isMarketplaceFull(marketplace)).toBe(true);
    });

    it("should return false when below max size", () => {
      const marketplace = createMockMarketplace([createMockPermanentCard()]);

      expect(isMarketplaceFull(marketplace)).toBe(false);
    });
  });

  describe("getMarketplaceCard", () => {
    it("should find card by id", () => {
      const card = createMockPermanentCard({ id: "target-card" });
      const marketplace = createMockMarketplace([
        createMockSingleUseCard({ id: "other" }),
        card,
      ]);

      const found = getMarketplaceCard(marketplace, "target-card");

      expect(found).toEqual(card);
    });

    it("should return undefined for nonexistent card", () => {
      const marketplace = createMockMarketplace([createMockPermanentCard()]);

      const found = getMarketplaceCard(marketplace, "nonexistent");

      expect(found).toBeUndefined();
    });
  });

  describe("getCardDisplayInfo", () => {
    it("should return info for permanent card", () => {
      const card = createMockPermanentCard();
      const info = getCardDisplayInfo(card);

      expect(info.name).toBe(card.name);
      expect(info.cost).toBe(card.cost);
      expect(info.type).toBe("Permanent");
      expect(info.description).toBe(card.description);
      expect(info.icon).toBeDefined();
    });

    it("should return info for single-use card", () => {
      const card = createMockSingleUseCard();
      const info = getCardDisplayInfo(card);

      expect(info.type).toBe("Single Use");
    });

    it("should return info for point card", () => {
      const card = createMockPointCard({ points: 3 });
      const info = getCardDisplayInfo(card);

      expect(info.type).toBe("Victory Points");
      expect(info.description).toContain("3");
      expect(info.icon).toBe("⭐");
    });
  });

  describe("sortCardsByCost", () => {
    it("should sort ascending by default", () => {
      const cards = [
        createMockPermanentCard({ id: "1", cost: 5 }),
        createMockSingleUseCard({ id: "2", cost: 2 }),
        createMockPointCard({ id: "3", cost: 10 }),
      ];

      const sorted = sortCardsByCost(cards);

      expect(sorted[0].cost).toBe(2);
      expect(sorted[1].cost).toBe(5);
      expect(sorted[2].cost).toBe(10);
    });

    it("should sort descending when specified", () => {
      const cards = [
        createMockPermanentCard({ id: "1", cost: 5 }),
        createMockSingleUseCard({ id: "2", cost: 2 }),
        createMockPointCard({ id: "3", cost: 10 }),
      ];

      const sorted = sortCardsByCost(cards, false);

      expect(sorted[0].cost).toBe(10);
      expect(sorted[2].cost).toBe(2);
    });

    it("should not mutate original array", () => {
      const cards = [
        createMockPermanentCard({ id: "1", cost: 5 }),
        createMockSingleUseCard({ id: "2", cost: 2 }),
      ];
      const originalOrder = [...cards];

      sortCardsByCost(cards);

      expect(cards).toEqual(originalOrder);
    });
  });

  describe("sortCardsByTypeAndCost", () => {
    it("should sort by type first, then cost", () => {
      const cards = [
        createMockPointCard({ id: "point-expensive", cost: 10 }),
        createMockSingleUseCard({ id: "single-cheap", cost: 2 }),
        createMockPermanentCard({ id: "perm-mid", cost: 5 }),
        createMockPermanentCard({ id: "perm-cheap", cost: 3 }),
        createMockPointCard({ id: "point-cheap", cost: 2 }),
      ];

      const sorted = sortCardsByTypeAndCost(cards);

      // First all permanent cards (sorted by cost)
      expect(sorted[0].id).toBe("perm-cheap");
      expect(sorted[1].id).toBe("perm-mid");
      // Then single-use cards
      expect(sorted[2].id).toBe("single-cheap");
      // Then point cards (sorted by cost)
      expect(sorted[3].id).toBe("point-cheap");
      expect(sorted[4].id).toBe("point-expensive");
    });
  });
});
