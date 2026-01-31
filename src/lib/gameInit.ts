import type { Player, GameState, TurnState, Marketplace, Card } from "@/types/game";
import { TurnPhase } from "@/types/game";
import {
  STARTING_GOLD,
  STARTING_VICTORY_POINTS,
  STARTING_DAMAGE,
  MARKETPLACE_SIZE,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from "./constants";
import { createMonsterGauntlet } from "./monsterDeck";
import { createShuffledDeck, drawCards } from "./cardDeck";

// ============================================
// Player Creation
// ============================================

/**
 * Creates a new player with starting resources
 * @param name - Player's display name
 * @param index - Player index (used for ID generation)
 * @returns New Player object
 */
export function createPlayer(name: string, index: number): Player {
  return {
    id: `player-${index}-${Date.now()}`,
    name: name.trim(),
    gold: STARTING_GOLD,
    victoryPoints: STARTING_VICTORY_POINTS,
    damageCount: STARTING_DAMAGE,
    permanentCards: [],
    singleUseCards: [],
  };
}

/**
 * Creates an array of players from names
 * @param names - Array of player names
 * @returns Array of Player objects
 */
export function createPlayers(names: string[]): Player[] {
  return names.map((name, index) => createPlayer(name, index));
}

// ============================================
// Validation Types
// ============================================

export interface ValidationError {
  message: string;
  playerIndex?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates player names for game initialization
 * @param names - Array of player names to validate
 * @returns ValidationResult with isValid boolean and array of errors
 */
export function validatePlayerNames(names: string[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Check player count
  if (names.length < MIN_PLAYERS) {
    errors.push({
      message: `Minimum ${MIN_PLAYERS} players required`,
    });
  }

  if (names.length > MAX_PLAYERS) {
    errors.push({
      message: `Maximum ${MAX_PLAYERS} players allowed`,
    });
  }

  // Check for empty names
  const trimmedNames = names.map((n) => n.trim());
  trimmedNames.forEach((name, index) => {
    if (name.length === 0) {
      errors.push({
        message: "Name cannot be empty",
        playerIndex: index,
      });
    }
  });

  // Check for duplicate names (case-insensitive)
  const seenNames = new Map<string, number>();
  trimmedNames.forEach((name, index) => {
    if (name.length === 0) return; // Skip empty names (already handled)

    const lowerName = name.toLowerCase();
    const previousIndex = seenNames.get(lowerName);

    if (previousIndex !== undefined) {
      errors.push({
        message: `Duplicate name (same as Player ${previousIndex + 1})`,
        playerIndex: index,
      });
    } else {
      seenNames.set(lowerName, index);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// Turn State Initialization
// ============================================

/**
 * Creates the initial turn state for a new game
 * @param firstPlayerId - ID of the first player
 * @returns Initial TurnState object
 */
export function createInitialTurnState(firstPlayerId: string): TurnState {
  return {
    phase: TurnPhase.MARKETPLACE_REFRESH,
    activePlayerId: firstPlayerId,
    point: null,
    turnDamage: 0,
    monsterStateBeforeTurn: null,
    hasUsedRevive: false,
    consecutiveTurns: 1,
    rollCount: 0,
  };
}

// ============================================
// Marketplace Initialization
// ============================================

/**
 * Creates the initial marketplace with cards drawn from deck
 * @param deck - The card deck to draw from
 * @returns Object with marketplace and remaining deck
 */
export function createInitialMarketplace(deck: Card[]): {
  marketplace: Marketplace;
  remainingDeck: Card[];
} {
  const { drawn, remaining } = drawCards(deck, MARKETPLACE_SIZE);

  return {
    marketplace: { cards: drawn },
    remainingDeck: remaining,
  };
}

// ============================================
// Full Game Initialization
// ============================================

/**
 * Initializes a complete new game state
 * @param playerNames - Array of player names
 * @returns Complete GameState object ready for play
 * @throws Error if player names are invalid
 */
export function initializeGame(playerNames: string[]): GameState {
  // Validate player names
  const validation = validatePlayerNames(playerNames);
  if (!validation.isValid) {
    const errorMessages = validation.errors.map((e) => e.message).join("; ");
    throw new Error(errorMessages);
  }

  // Create players
  const players = createPlayers(playerNames);

  // Create monster gauntlet
  const monsters = createMonsterGauntlet();

  // Create and shuffle card deck, then set up marketplace
  const shuffledDeck = createShuffledDeck();
  const { marketplace, remainingDeck } = createInitialMarketplace(shuffledDeck);

  // Create initial turn state
  const turnState = createInitialTurnState(players[0].id);

  // Assemble complete game state
  const gameState: GameState = {
    // Core game data
    players,
    monsters,
    currentMonsterIndex: 0,

    // Turn management
    turnState,
    currentPlayerIndex: 0,

    // Betting
    bets: [],

    // Marketplace
    marketplace,
    cardDeck: remainingDeck,

    // Damage leader (no one at start)
    damageLeaderId: null,

    // Game status
    isGameOver: false,
    winnerId: null,
  };

  return gameState;
}

// ============================================
// State Reset Functions
// ============================================

/**
 * Resets turn state for a new turn
 * @param activePlayerId - ID of the player whose turn it is
 * @param currentMonster - The current monster (to store state before turn)
 * @returns Fresh TurnState for the new turn
 */
export function resetTurnState(
  activePlayerId: string,
  hasUsedRevive: boolean = false
): TurnState {
  return {
    phase: TurnPhase.MARKETPLACE_REFRESH,
    activePlayerId,
    point: null,
    turnDamage: 0,
    monsterStateBeforeTurn: null,
    hasUsedRevive,
    consecutiveTurns: 1,
    rollCount: 0,
  };
}

/**
 * Gets the next player index, wrapping around if necessary
 * @param currentIndex - Current player index
 * @param playerCount - Total number of players
 * @returns Next player index
 */
export function getNextPlayerIndex(
  currentIndex: number,
  playerCount: number
): number {
  return (currentIndex + 1) % playerCount;
}

/**
 * Finds a player by ID in the players array
 * @param players - Array of players
 * @param playerId - ID to search for
 * @returns Player if found, undefined otherwise
 */
export function findPlayerById(
  players: Player[],
  playerId: string
): Player | undefined {
  return players.find((p) => p.id === playerId);
}

/**
 * Finds a player's index by ID
 * @param players - Array of players
 * @param playerId - ID to search for
 * @returns Player index if found, -1 otherwise
 */
export function findPlayerIndexById(
  players: Player[],
  playerId: string
): number {
  return players.findIndex((p) => p.id === playerId);
}
