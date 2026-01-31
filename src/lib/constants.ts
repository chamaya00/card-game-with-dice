// ============================================
// Game Constants
// ============================================

// Player starting values
export const STARTING_GOLD = 4;
export const STARTING_VICTORY_POINTS = 0;
export const STARTING_DAMAGE = 0;

// Victory conditions
export const VICTORY_POINTS_TO_WIN = 10;

// Card limits
export const MAX_PERMANENT_CARDS = 6;
export const MAX_SINGLE_USE_CARDS = 8;

// Marketplace
export const MARKETPLACE_SIZE = 8;
export const MARKETPLACE_REFRESH_COST = 3;

// Damage leader
export const DAMAGE_LEADER_BONUS = 3;

// Dice
export const DEFAULT_DICE_COUNT = 2;
export const DICE_SIDES = 6;

// Craps numbers
export const NATURAL_NUMBERS = [7, 11] as const;
export const CRAPS_NUMBERS = [2, 3, 12] as const;
export const POINT_NUMBERS = [4, 5, 6, 8, 9, 10] as const;
export const CRAP_OUT_NUMBER = 7;
export const ESCAPE_NUMBER = 2;

// Gold penalties
export const CRAP_OUT_GOLD_PENALTY_PERCENT = 0.5; // Lose 50% gold on crap-out

// Player limits
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;

// Monster count
export const MONSTER_COUNT = 10;

// Betting
export const MAX_BET_AMOUNT = 5; // Optional betting cap
