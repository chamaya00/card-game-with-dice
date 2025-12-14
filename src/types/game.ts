export interface Card {
  id: string;
  name: string;
  description: string;
  color: string;
  // Monster card properties
  isMonster: boolean;
  strength?: number;    // 1-10 for monsters
  defense?: number;     // 1-10 for monsters
  pointValue?: number;  // 1-3 for monsters
}

export interface Player {
  id: string;
  name: string;
  points: number;
  hand: Card[];
  color: string;
  strength: number;  // Player strength for combat
  defense: number;   // Player defense for combat
}

export type GamePhase =
  | 'setup'           // Setting up players
  | 'drawing'         // Current player is drawing cards
  | 'selecting'       // Players are selecting cards from in-play zone
  | 'discarding'      // Leftover cards being discarded
  | 'ended';          // Game over

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;      // Player whose turn it is (draws cards)
  selectingPlayerIndex: number;    // Player currently selecting a card
  deck: Card[];
  inPlayZone: Card[];
  discardPile: Card[];
  phase: GamePhase;
  winner: Player | null;
  turnNumber: number;
}

export const WINNING_SCORE = 10;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export const PLAYER_COLORS = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
];
