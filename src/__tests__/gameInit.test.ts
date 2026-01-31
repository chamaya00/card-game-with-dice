import {
  createPlayer,
  createPlayers,
  validatePlayerNames,
  createInitialTurnState,
  createInitialMarketplace,
  initializeGame,
  resetTurnState,
  getNextPlayerIndex,
  findPlayerById,
  findPlayerIndexById,
} from "@/lib/gameInit";
import { TurnPhase } from "@/types/game";
import {
  STARTING_GOLD,
  STARTING_VICTORY_POINTS,
  STARTING_DAMAGE,
  MARKETPLACE_SIZE,
  MIN_PLAYERS,
  MAX_PLAYERS,
  MONSTER_COUNT,
} from "@/lib/constants";
import { createShuffledDeck } from "@/lib/cardDeck";

describe("gameInit utility functions", () => {
  describe("createPlayer", () => {
    it("should create a player with correct starting values", () => {
      const player = createPlayer("Alice", 0);

      expect(player.name).toBe("Alice");
      expect(player.gold).toBe(STARTING_GOLD);
      expect(player.victoryPoints).toBe(STARTING_VICTORY_POINTS);
      expect(player.damageCount).toBe(STARTING_DAMAGE);
      expect(player.permanentCards).toEqual([]);
      expect(player.singleUseCards).toEqual([]);
    });

    it("should generate unique IDs for different players", () => {
      const player1 = createPlayer("Alice", 0);
      const player2 = createPlayer("Bob", 1);

      expect(player1.id).not.toBe(player2.id);
    });

    it("should include player index in ID", () => {
      const player = createPlayer("Alice", 5);

      expect(player.id).toContain("player-5");
    });

    it("should trim whitespace from name", () => {
      const player = createPlayer("  Alice  ", 0);

      expect(player.name).toBe("Alice");
    });
  });

  describe("createPlayers", () => {
    it("should create correct number of players", () => {
      const players = createPlayers(["Alice", "Bob", "Charlie"]);

      expect(players).toHaveLength(3);
    });

    it("should assign correct names to players", () => {
      const names = ["Alice", "Bob", "Charlie"];
      const players = createPlayers(names);

      expect(players[0].name).toBe("Alice");
      expect(players[1].name).toBe("Bob");
      expect(players[2].name).toBe("Charlie");
    });

    it("should create players with unique IDs", () => {
      const players = createPlayers(["Alice", "Bob", "Charlie"]);
      const ids = players.map((p) => p.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should give all players starting gold", () => {
      const players = createPlayers(["Alice", "Bob"]);

      players.forEach((player) => {
        expect(player.gold).toBe(STARTING_GOLD);
      });
    });
  });

  describe("validatePlayerNames", () => {
    it("should accept valid player names", () => {
      const result = validatePlayerNames(["Alice", "Bob"]);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept maximum number of players", () => {
      const names = Array.from(
        { length: MAX_PLAYERS },
        (_, i) => `Player${i + 1}`
      );
      const result = validatePlayerNames(names);

      expect(result.isValid).toBe(true);
    });

    it("should reject too few players", () => {
      const result = validatePlayerNames(["Alice"]);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain(`Minimum ${MIN_PLAYERS} players`);
    });

    it("should reject too many players", () => {
      const names = Array.from(
        { length: MAX_PLAYERS + 1 },
        (_, i) => `Player${i + 1}`
      );
      const result = validatePlayerNames(names);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain(`Maximum ${MAX_PLAYERS} players`);
    });

    it("should reject empty names", () => {
      const result = validatePlayerNames(["Alice", "", "Charlie"]);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must have a name");
    });

    it("should reject whitespace-only names", () => {
      const result = validatePlayerNames(["Alice", "   ", "Charlie"]);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("must have a name");
    });

    it("should reject duplicate names", () => {
      const result = validatePlayerNames(["Alice", "Bob", "Alice"]);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("unique");
    });

    it("should reject duplicate names case-insensitively", () => {
      const result = validatePlayerNames(["Alice", "Bob", "alice"]);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("unique");
    });
  });

  describe("createInitialTurnState", () => {
    it("should create turn state with correct initial phase", () => {
      const turnState = createInitialTurnState("player-0");

      expect(turnState.phase).toBe(TurnPhase.MARKETPLACE_REFRESH);
    });

    it("should set the correct active player", () => {
      const turnState = createInitialTurnState("player-5");

      expect(turnState.activePlayerId).toBe("player-5");
    });

    it("should start with no established point", () => {
      const turnState = createInitialTurnState("player-0");

      expect(turnState.point).toBeNull();
    });

    it("should start with zero turn damage", () => {
      const turnState = createInitialTurnState("player-0");

      expect(turnState.turnDamage).toBe(0);
    });

    it("should start with no stored monster state", () => {
      const turnState = createInitialTurnState("player-0");

      expect(turnState.monsterStateBeforeTurn).toBeNull();
    });

    it("should start without having used revive", () => {
      const turnState = createInitialTurnState("player-0");

      expect(turnState.hasUsedRevive).toBe(false);
    });

    it("should start with one consecutive turn", () => {
      const turnState = createInitialTurnState("player-0");

      expect(turnState.consecutiveTurns).toBe(1);
    });

    it("should start with zero roll count", () => {
      const turnState = createInitialTurnState("player-0");

      expect(turnState.rollCount).toBe(0);
    });
  });

  describe("createInitialMarketplace", () => {
    it("should create marketplace with correct number of cards", () => {
      const deck = createShuffledDeck();
      const { marketplace } = createInitialMarketplace(deck);

      expect(marketplace.cards).toHaveLength(MARKETPLACE_SIZE);
    });

    it("should remove marketplace cards from deck", () => {
      const deck = createShuffledDeck();
      const originalDeckSize = deck.length;
      const { remainingDeck } = createInitialMarketplace(deck);

      expect(remainingDeck.length).toBe(originalDeckSize - MARKETPLACE_SIZE);
    });

    it("should not have duplicate cards between marketplace and deck", () => {
      const deck = createShuffledDeck();
      const { marketplace, remainingDeck } = createInitialMarketplace(deck);

      const marketplaceIds = new Set(marketplace.cards.map((c) => c.id));
      const deckIds = new Set(remainingDeck.map((c) => c.id));

      marketplaceIds.forEach((id) => {
        expect(deckIds.has(id)).toBe(false);
      });
    });
  });

  describe("initializeGame", () => {
    it("should create a valid game state", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState).toBeDefined();
      expect(gameState.players).toHaveLength(2);
    });

    it("should throw error for invalid player names", () => {
      expect(() => initializeGame(["Alice"])).toThrow();
    });

    it("should create correct number of monsters", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.monsters).toHaveLength(MONSTER_COUNT);
    });

    it("should start at first monster", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.currentMonsterIndex).toBe(0);
    });

    it("should start with first player", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.currentPlayerIndex).toBe(0);
      expect(gameState.turnState.activePlayerId).toBe(gameState.players[0].id);
    });

    it("should start with empty bets", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.bets).toEqual([]);
    });

    it("should initialize marketplace with cards", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.marketplace.cards).toHaveLength(MARKETPLACE_SIZE);
    });

    it("should have cards in the deck", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.cardDeck.length).toBeGreaterThan(0);
    });

    it("should start with no damage leader", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.damageLeaderId).toBeNull();
    });

    it("should not be game over at start", () => {
      const gameState = initializeGame(["Alice", "Bob"]);

      expect(gameState.isGameOver).toBe(false);
      expect(gameState.winnerId).toBeNull();
    });
  });

  describe("resetTurnState", () => {
    it("should reset to marketplace refresh phase", () => {
      const turnState = resetTurnState("player-0");

      expect(turnState.phase).toBe(TurnPhase.MARKETPLACE_REFRESH);
    });

    it("should set the active player", () => {
      const turnState = resetTurnState("player-5");

      expect(turnState.activePlayerId).toBe("player-5");
    });

    it("should reset point to null", () => {
      const turnState = resetTurnState("player-0");

      expect(turnState.point).toBeNull();
    });

    it("should reset turn damage to zero", () => {
      const turnState = resetTurnState("player-0");

      expect(turnState.turnDamage).toBe(0);
    });

    it("should preserve hasUsedRevive if specified", () => {
      const turnState = resetTurnState("player-0", true);

      expect(turnState.hasUsedRevive).toBe(true);
    });

    it("should default hasUsedRevive to false", () => {
      const turnState = resetTurnState("player-0");

      expect(turnState.hasUsedRevive).toBe(false);
    });
  });

  describe("getNextPlayerIndex", () => {
    it("should return next index normally", () => {
      expect(getNextPlayerIndex(0, 4)).toBe(1);
      expect(getNextPlayerIndex(1, 4)).toBe(2);
      expect(getNextPlayerIndex(2, 4)).toBe(3);
    });

    it("should wrap around at the end", () => {
      expect(getNextPlayerIndex(3, 4)).toBe(0);
      expect(getNextPlayerIndex(7, 8)).toBe(0);
    });

    it("should work for 2 players", () => {
      expect(getNextPlayerIndex(0, 2)).toBe(1);
      expect(getNextPlayerIndex(1, 2)).toBe(0);
    });
  });

  describe("findPlayerById", () => {
    it("should find existing player", () => {
      const players = createPlayers(["Alice", "Bob", "Charlie"]);
      const targetId = players[1].id;

      const found = findPlayerById(players, targetId);

      expect(found).toBeDefined();
      expect(found?.name).toBe("Bob");
    });

    it("should return undefined for non-existent player", () => {
      const players = createPlayers(["Alice", "Bob"]);

      const found = findPlayerById(players, "non-existent-id");

      expect(found).toBeUndefined();
    });
  });

  describe("findPlayerIndexById", () => {
    it("should find existing player index", () => {
      const players = createPlayers(["Alice", "Bob", "Charlie"]);
      const targetId = players[1].id;

      const index = findPlayerIndexById(players, targetId);

      expect(index).toBe(1);
    });

    it("should return -1 for non-existent player", () => {
      const players = createPlayers(["Alice", "Bob"]);

      const index = findPlayerIndexById(players, "non-existent-id");

      expect(index).toBe(-1);
    });
  });
});
