export interface Card {
  id: string;
  name: string;
  description: string;
  color: string;
  // Monster card properties
  isMonster: boolean;
  isBoss?: boolean;     // Boss monsters for special encounters
  strength?: number;    // 1-10 for monsters, 10-20 for bosses
  defense?: number;     // 1-10 for monsters, 10-20 for bosses
  pointValue?: number;  // 1-3 for monsters, 5-10 for bosses
  goldValue?: number;   // 1-10 gold value for trading
  // Shop card properties
  isShopItem?: boolean;
  itemType?: 'equipment'; // Can be extended later
  cost?: number;        // 1-10 gold cost
  strengthBonus?: number;  // Equipment strength bonus
  defenseBonus?: number;   // Equipment defense bonus
}

export interface Player {
  id: string;
  name: string;
  points: number;
  hand: Card[];
  inventory: Card[];     // Defeated monster cards for trading
  equipment: Card[];     // Equipped shop items
  color: string;
  strength: number;      // Player strength for combat
  defense: number;       // Player defense for combat
  skipNextTurn: boolean; // Penalty for being defeated
}

export type GamePhase =
  | 'setup'           // Setting up players
  | 'drawing'         // Current player is drawing cards
  | 'selecting'       // Players are selecting cards from in-play zone
  | 'shopping'        // Players are buying from the shop
  | 'discarding'      // Leftover cards being discarded
  | 'ended';          // Game over

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;      // Player whose turn it is (draws cards)
  selectingPlayerIndex: number;    // Player currently selecting a card
  shoppingPlayerIndex: number;     // Player currently shopping
  deck: Card[];
  bossDeck: Card[];                // Separate deck for boss encounters
  shopDeck: Card[];                // Deck of shop items
  inPlayZone: Card[];
  shopZone: Card[];                // Shop items available for purchase
  discardPile: Card[];
  phase: GamePhase;
  winner: Player | null;
  turnNumber: number;
  bossDefeated: boolean;          // Track if current boss was defeated
  gameOver: boolean;               // Game over due to undefeated boss
}

export const WINNING_SCORE = 10;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const MAX_TURNS = 50;
export const BOSS_FIGHT_INTERVAL = 10; // Boss fight every 10 turns
export const SHOP_INTERVAL = 5;        // Shop round every 5 turns

export const PLAYER_COLORS = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
];
