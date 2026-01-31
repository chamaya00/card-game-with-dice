// ============================================
// Turn Phase Enum
// ============================================

export enum TurnPhase {
  MARKETPLACE_REFRESH = "MARKETPLACE_REFRESH",
  MARKET_PURCHASE = "MARKET_PURCHASE",
  CARD_REVEAL = "CARD_REVEAL",
  BETTING = "BETTING",
  COME_OUT_ROLL = "COME_OUT_ROLL",
  POINT_PHASE = "POINT_PHASE",
  RESOLUTION = "RESOLUTION",
}

// ============================================
// Card Types (Discriminated Unions)
// ============================================

export type PermanentCardEffect =
  | "PLUS_ONE_DIE"
  | "REROLL"
  | "SHIELD"
  | "LUCKY"
  | "ARMOR"
  | "POINT_BONUS"
  | "DOUBLE";

export type SingleUseCardEffect =
  | "STUN"
  | "RAPID_FIRE"
  | "MOMENTUM"
  | "CHARM"
  | "CURSE"
  | "HEAL";

export interface PermanentCard {
  type: "permanent";
  id: string;
  name: string;
  cost: number;
  effect: PermanentCardEffect;
  description: string;
}

export interface SingleUseCard {
  type: "single_use";
  id: string;
  name: string;
  cost: number;
  effect: SingleUseCardEffect;
  description: string;
}

export interface PointCard {
  type: "point";
  id: string;
  name: string;
  cost: number;
  points: number;
}

export type Card = PermanentCard | SingleUseCard | PointCard;

// ============================================
// Monster Types
// ============================================

export type MonsterType =
  | "GOBLIN"
  | "SKELETON"
  | "ORC"
  | "TROLL"
  | "WRAITH"
  | "GOLEM"
  | "DEMON"
  | "DRAGON"
  | "LICH"
  | "BOSS";

export interface Monster {
  id: string;
  name: string;
  type: MonsterType;
  position: number; // 1-10 in the gauntlet
  numbersToHit: number[]; // e.g., [4, 5, 6, 8, 9, 10]
  remainingNumbers: number[]; // numbers still needing to be hit
  points: number; // victory points awarded on defeat
  goldReward: number; // gold awarded on defeat
}

// ============================================
// Player Types
// ============================================

export interface Player {
  id: string;
  name: string;
  gold: number;
  victoryPoints: number;
  damageCount: number; // cumulative damage dealt across the game
  permanentCards: PermanentCard[];
  singleUseCards: SingleUseCard[];
}

// ============================================
// Betting Types
// ============================================

export type BetType = "FOR" | "AGAINST";

export interface Bet {
  playerId: string;
  type: BetType;
  amount: number;
}

// ============================================
// Roll Result Types
// ============================================

export interface ComeOutNatural {
  type: "natural";
  sum: number;
}

export interface ComeOutCraps {
  type: "craps";
  sum: number;
}

export interface ComeOutPoint {
  type: "point";
  pointValue: number;
}

export type ComeOutResult = ComeOutNatural | ComeOutCraps | ComeOutPoint;

export interface PointPhaseHit {
  type: "hit";
  hitNumber: number;
}

export interface PointPhasePointHit {
  type: "point_hit";
  pointValue: number;
}

export interface PointPhaseEscapeOffered {
  type: "escape_offered";
}

export interface PointPhaseCrapOut {
  type: "crap_out";
}

export interface PointPhaseMiss {
  type: "miss";
  sum: number;
}

export type PointPhaseResult =
  | PointPhaseHit
  | PointPhasePointHit
  | PointPhaseEscapeOffered
  | PointPhaseCrapOut
  | PointPhaseMiss;

export type RollResult = ComeOutResult | PointPhaseResult;

// ============================================
// Turn State
// ============================================

export interface TurnState {
  phase: TurnPhase;
  activePlayerId: string;
  point: number | null; // established point value during point phase
  turnDamage: number; // damage dealt during current turn
  monsterStateBeforeTurn: Monster | null; // for resetting on crap-out
  hasUsedRevive: boolean; // can only revive once per monster
  consecutiveTurns: number; // for charm card effect
  rollCount: number; // number of rolls this turn
}

// ============================================
// Marketplace State
// ============================================

export interface Marketplace {
  cards: Card[];
}

// ============================================
// Game State
// ============================================

export interface GameState {
  // Core game data
  players: Player[];
  monsters: Monster[];
  currentMonsterIndex: number; // 0-9 index of current monster

  // Turn management
  turnState: TurnState;
  currentPlayerIndex: number; // index into players array

  // Betting
  bets: Bet[];

  // Marketplace
  marketplace: Marketplace;
  cardDeck: Card[]; // remaining cards to draw from

  // Damage leader
  damageLeaderId: string | null; // player with most cumulative damage

  // Game status
  isGameOver: boolean;
  winnerId: string | null;
}

// ============================================
// Game Actions (for state management)
// ============================================

export type GameAction =
  | { type: "INITIALIZE_GAME"; playerNames: string[] }
  | { type: "SET_TURN_PHASE"; phase: TurnPhase }
  | { type: "NEXT_PLAYER" }
  | { type: "UPDATE_PLAYER"; playerId: string; updates: Partial<Player> }
  | { type: "UPDATE_MONSTER"; updates: Partial<Monster> }
  | { type: "REFRESH_MARKETPLACE" }
  | { type: "PURCHASE_CARD"; playerId: string; cardId: string }
  | { type: "PLACE_BET"; bet: Bet }
  | { type: "CLEAR_BETS" }
  | { type: "ROLL_DICE"; diceValues: number[] }
  | { type: "HIT_MONSTER_NUMBER"; number: number }
  | { type: "DEFEAT_MONSTER" }
  | { type: "CRAP_OUT" }
  | { type: "ESCAPE" }
  | { type: "REVIVE" }
  | { type: "USE_SINGLE_USE_CARD"; playerId: string; cardId: string; targetPlayerId?: string }
  | { type: "END_GAME"; winnerId: string };
