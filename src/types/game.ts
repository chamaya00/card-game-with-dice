export interface Card {
  id: string;
  name: string;
  description: string;
  value: number;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  hand: Card[];
  color: string;
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
