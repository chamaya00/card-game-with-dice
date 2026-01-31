import {
  canHoldPermanent,
  canHoldSingleUse,
  getRemainingPermanentSlots,
  getRemainingSingleUseSlots,
  addPermanentCard,
  addSingleUseCard,
  useSingleUseCard,
  removePermanentCard,
  discardHand,
  discardSingleUseCards,
  findPermanentCard,
  findSingleUseCard,
  hasPermanentEffect,
  hasSingleUseEffect,
  getPermanentCardsWithEffect,
  getSingleUseCardsWithEffect,
  getTotalCardCount,
  isHandEmpty,
} from "@/lib/cardHand";
import { MAX_PERMANENT_CARDS, MAX_SINGLE_USE_CARDS } from "@/lib/constants";
import type { Player, PermanentCard, SingleUseCard } from "@/types/game";

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

// Helper to create mock permanent cards
function createMockPermanentCard(
  overrides: Partial<PermanentCard> = {}
): PermanentCard {
  return {
    type: "permanent",
    id: `perm-${Date.now()}-${Math.random()}`,
    name: "Test Permanent Card",
    cost: 3,
    effect: "REROLL",
    description: "Test description",
    ...overrides,
  };
}

// Helper to create mock single-use cards
function createMockSingleUseCard(
  overrides: Partial<SingleUseCard> = {}
): SingleUseCard {
  return {
    type: "single_use",
    id: `single-${Date.now()}-${Math.random()}`,
    name: "Test Single Use Card",
    cost: 2,
    effect: "STUN",
    description: "Test description",
    ...overrides,
  };
}

describe("card hand management functions", () => {
  describe("capacity checks", () => {
    describe("canHoldPermanent", () => {
      it("should return true when under limit", () => {
        const player = createMockPlayer({ permanentCards: [] });
        expect(canHoldPermanent(player)).toBe(true);
      });

      it("should return false when at limit", () => {
        const cards = Array(MAX_PERMANENT_CARDS)
          .fill(null)
          .map((_, i) => createMockPermanentCard({ id: `card-${i}` }));
        const player = createMockPlayer({ permanentCards: cards });
        expect(canHoldPermanent(player)).toBe(false);
      });
    });

    describe("canHoldSingleUse", () => {
      it("should return true when under limit", () => {
        const player = createMockPlayer({ singleUseCards: [] });
        expect(canHoldSingleUse(player)).toBe(true);
      });

      it("should return false when at limit", () => {
        const cards = Array(MAX_SINGLE_USE_CARDS)
          .fill(null)
          .map((_, i) => createMockSingleUseCard({ id: `card-${i}` }));
        const player = createMockPlayer({ singleUseCards: cards });
        expect(canHoldSingleUse(player)).toBe(false);
      });
    });

    describe("getRemainingPermanentSlots", () => {
      it("should return correct remaining slots", () => {
        const player = createMockPlayer({ permanentCards: [] });
        expect(getRemainingPermanentSlots(player)).toBe(MAX_PERMANENT_CARDS);

        const cards = [createMockPermanentCard(), createMockPermanentCard()];
        const player2 = createMockPlayer({ permanentCards: cards });
        expect(getRemainingPermanentSlots(player2)).toBe(
          MAX_PERMANENT_CARDS - 2
        );
      });
    });

    describe("getRemainingSingleUseSlots", () => {
      it("should return correct remaining slots", () => {
        const player = createMockPlayer({ singleUseCards: [] });
        expect(getRemainingSingleUseSlots(player)).toBe(MAX_SINGLE_USE_CARDS);

        const cards = [createMockSingleUseCard(), createMockSingleUseCard()];
        const player2 = createMockPlayer({ singleUseCards: cards });
        expect(getRemainingSingleUseSlots(player2)).toBe(
          MAX_SINGLE_USE_CARDS - 2
        );
      });
    });
  });

  describe("adding cards", () => {
    describe("addPermanentCard", () => {
      it("should add a card to empty hand", () => {
        const player = createMockPlayer({ permanentCards: [] });
        const card = createMockPermanentCard({ id: "new-card" });
        const result = addPermanentCard(player, card);

        expect(result.success).toBe(true);
        expect(result.permanentCards).toHaveLength(1);
        expect(result.permanentCards?.[0].id).toBe("new-card");
      });

      it("should fail when at max capacity", () => {
        const cards = Array(MAX_PERMANENT_CARDS)
          .fill(null)
          .map((_, i) => createMockPermanentCard({ id: `card-${i}` }));
        const player = createMockPlayer({ permanentCards: cards });
        const newCard = createMockPermanentCard({ id: "new-card" });
        const result = addPermanentCard(player, newCard);

        expect(result.success).toBe(false);
        expect(result.error).toContain("maximum");
      });

      it("should fail when adding duplicate card ID", () => {
        const existingCard = createMockPermanentCard({ id: "existing-card" });
        const player = createMockPlayer({ permanentCards: [existingCard] });
        const result = addPermanentCard(player, existingCard);

        expect(result.success).toBe(false);
        expect(result.error).toContain("duplicate");
      });
    });

    describe("addSingleUseCard", () => {
      it("should add a card to empty hand", () => {
        const player = createMockPlayer({ singleUseCards: [] });
        const card = createMockSingleUseCard({ id: "new-card" });
        const result = addSingleUseCard(player, card);

        expect(result.success).toBe(true);
        expect(result.singleUseCards).toHaveLength(1);
        expect(result.singleUseCards?.[0].id).toBe("new-card");
      });

      it("should fail when at max capacity", () => {
        const cards = Array(MAX_SINGLE_USE_CARDS)
          .fill(null)
          .map((_, i) => createMockSingleUseCard({ id: `card-${i}` }));
        const player = createMockPlayer({ singleUseCards: cards });
        const newCard = createMockSingleUseCard({ id: "new-card" });
        const result = addSingleUseCard(player, newCard);

        expect(result.success).toBe(false);
        expect(result.error).toContain("maximum");
      });
    });
  });

  describe("using/removing cards", () => {
    describe("useSingleUseCard", () => {
      it("should remove and return the used card", () => {
        const card1 = createMockSingleUseCard({ id: "card-1" });
        const card2 = createMockSingleUseCard({ id: "card-2" });
        const player = createMockPlayer({ singleUseCards: [card1, card2] });
        const result = useSingleUseCard(player, "card-1");

        expect(result.success).toBe(true);
        expect(result.card?.id).toBe("card-1");
        expect(result.singleUseCards).toHaveLength(1);
        expect(result.singleUseCards?.[0].id).toBe("card-2");
      });

      it("should fail when card not found", () => {
        const player = createMockPlayer({ singleUseCards: [] });
        const result = useSingleUseCard(player, "nonexistent");

        expect(result.success).toBe(false);
        expect(result.error).toContain("not found");
      });
    });

    describe("removePermanentCard", () => {
      it("should remove the specified card", () => {
        const card1 = createMockPermanentCard({ id: "card-1" });
        const card2 = createMockPermanentCard({ id: "card-2" });
        const player = createMockPlayer({ permanentCards: [card1, card2] });
        const result = removePermanentCard(player, "card-1");

        expect(result.success).toBe(true);
        expect(result.permanentCards).toHaveLength(1);
        expect(result.permanentCards?.[0].id).toBe("card-2");
      });

      it("should fail when card not found", () => {
        const player = createMockPlayer({ permanentCards: [] });
        const result = removePermanentCard(player, "nonexistent");

        expect(result.success).toBe(false);
        expect(result.error).toContain("not found");
      });
    });
  });

  describe("discarding", () => {
    describe("discardHand", () => {
      it("should return empty hands and list discarded cards", () => {
        const permCard = createMockPermanentCard({ id: "perm-1" });
        const singleCard = createMockSingleUseCard({ id: "single-1" });
        const player = createMockPlayer({
          permanentCards: [permCard],
          singleUseCards: [singleCard],
        });
        const result = discardHand(player);

        expect(result.permanentCards).toHaveLength(0);
        expect(result.singleUseCards).toHaveLength(0);
        expect(result.discardedPermanent).toHaveLength(1);
        expect(result.discardedSingleUse).toHaveLength(1);
      });

      it("should handle already empty hand", () => {
        const player = createMockPlayer();
        const result = discardHand(player);

        expect(result.permanentCards).toHaveLength(0);
        expect(result.discardedPermanent).toHaveLength(0);
      });
    });

    describe("discardSingleUseCards", () => {
      it("should only discard single-use cards", () => {
        const singleCard = createMockSingleUseCard({ id: "single-1" });
        const player = createMockPlayer({
          singleUseCards: [singleCard],
        });
        const result = discardSingleUseCards(player);

        expect(result.singleUseCards).toHaveLength(0);
        expect(result.discarded).toHaveLength(1);
      });
    });
  });

  describe("card queries", () => {
    describe("findPermanentCard", () => {
      it("should find existing card", () => {
        const card = createMockPermanentCard({ id: "target" });
        const player = createMockPlayer({ permanentCards: [card] });
        const found = findPermanentCard(player, "target");

        expect(found).toBeDefined();
        expect(found?.id).toBe("target");
      });

      it("should return undefined for missing card", () => {
        const player = createMockPlayer({ permanentCards: [] });
        expect(findPermanentCard(player, "missing")).toBeUndefined();
      });
    });

    describe("findSingleUseCard", () => {
      it("should find existing card", () => {
        const card = createMockSingleUseCard({ id: "target" });
        const player = createMockPlayer({ singleUseCards: [card] });
        const found = findSingleUseCard(player, "target");

        expect(found).toBeDefined();
        expect(found?.id).toBe("target");
      });
    });

    describe("hasPermanentEffect", () => {
      it("should return true when effect exists", () => {
        const card = createMockPermanentCard({ effect: "SHIELD" });
        const player = createMockPlayer({ permanentCards: [card] });
        expect(hasPermanentEffect(player, "SHIELD")).toBe(true);
      });

      it("should return false when effect not found", () => {
        const player = createMockPlayer({ permanentCards: [] });
        expect(hasPermanentEffect(player, "SHIELD")).toBe(false);
      });
    });

    describe("hasSingleUseEffect", () => {
      it("should return true when effect exists", () => {
        const card = createMockSingleUseCard({ effect: "CURSE" });
        const player = createMockPlayer({ singleUseCards: [card] });
        expect(hasSingleUseEffect(player, "CURSE")).toBe(true);
      });
    });

    describe("getPermanentCardsWithEffect", () => {
      it("should return all cards with matching effect", () => {
        const card1 = createMockPermanentCard({ id: "c1", effect: "REROLL" });
        const card2 = createMockPermanentCard({ id: "c2", effect: "REROLL" });
        const card3 = createMockPermanentCard({ id: "c3", effect: "SHIELD" });
        const player = createMockPlayer({
          permanentCards: [card1, card2, card3],
        });
        const cards = getPermanentCardsWithEffect(player, "REROLL");

        expect(cards).toHaveLength(2);
      });
    });

    describe("getSingleUseCardsWithEffect", () => {
      it("should return all cards with matching effect", () => {
        const card1 = createMockSingleUseCard({ id: "c1", effect: "STUN" });
        const card2 = createMockSingleUseCard({ id: "c2", effect: "STUN" });
        const player = createMockPlayer({ singleUseCards: [card1, card2] });
        const cards = getSingleUseCardsWithEffect(player, "STUN");

        expect(cards).toHaveLength(2);
      });
    });

    describe("getTotalCardCount", () => {
      it("should count all cards", () => {
        const player = createMockPlayer({
          permanentCards: [createMockPermanentCard(), createMockPermanentCard()],
          singleUseCards: [createMockSingleUseCard()],
        });
        expect(getTotalCardCount(player)).toBe(3);
      });

      it("should return 0 for empty hand", () => {
        const player = createMockPlayer();
        expect(getTotalCardCount(player)).toBe(0);
      });
    });

    describe("isHandEmpty", () => {
      it("should return true for empty hand", () => {
        const player = createMockPlayer();
        expect(isHandEmpty(player)).toBe(true);
      });

      it("should return false when hand has cards", () => {
        const player = createMockPlayer({
          permanentCards: [createMockPermanentCard()],
        });
        expect(isHandEmpty(player)).toBe(false);
      });
    });
  });
});
