import { Card, GameState, Player, PLAYER_COLORS, WINNING_SCORE } from '@/types/game';

const CARD_COLORS = [
  '#DC2626', // red
  '#2563EB', // blue
  '#16A34A', // green
  '#CA8A04', // yellow
  '#9333EA', // purple
];

const CARD_NAMES = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
  'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
  'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron',
  'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
];

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  // Create 60 cards (4 copies of each name, spread across colors)
  for (let copy = 0; copy < 3; copy++) {
    for (let i = 0; i < CARD_NAMES.length; i++) {
      deck.push({
        id: `card-${id++}`,
        name: CARD_NAMES[i],
        description: `A mysterious ${CARD_NAMES[i]} card`,
        value: (i % 5) + 1, // Values 1-5
        color: CARD_COLORS[i % CARD_COLORS.length],
      });
    }
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createPlayer(id: string, name: string, index: number): Player {
  return {
    id,
    name,
    points: 0,
    hand: [],
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
  };
}

export function initializeGame(playerNames: string[]): GameState {
  const players = playerNames.map((name, index) =>
    createPlayer(`player-${index}`, name, index)
  );

  return {
    players,
    currentPlayerIndex: 0,
    selectingPlayerIndex: 0,
    deck: generateDeck(),
    inPlayZone: [],
    discardPile: [],
    phase: 'drawing',
    winner: null,
    turnNumber: 1,
  };
}

export function getCardsToDrawCount(playerCount: number): number {
  return playerCount + 1;
}

export function drawCards(state: GameState): GameState {
  const cardsToDraw = getCardsToDrawCount(state.players.length);

  // If not enough cards in deck, shuffle discard pile back in
  let deck = [...state.deck];
  let discardPile = [...state.discardPile];

  if (deck.length < cardsToDraw) {
    deck = [...deck, ...shuffleDeck(discardPile)];
    discardPile = [];
  }

  const drawnCards = deck.slice(0, cardsToDraw);
  const remainingDeck = deck.slice(cardsToDraw);

  return {
    ...state,
    deck: remainingDeck,
    discardPile,
    inPlayZone: drawnCards,
    phase: 'selecting',
    selectingPlayerIndex: state.currentPlayerIndex,
  };
}

export function selectCard(state: GameState, cardId: string): GameState {
  const card = state.inPlayZone.find(c => c.id === cardId);
  if (!card) return state;

  const selectingPlayer = state.players[state.selectingPlayerIndex];

  // Add card to player's hand and add points (for now, points = card value)
  const updatedPlayers = state.players.map(p => {
    if (p.id === selectingPlayer.id) {
      const newPoints = p.points + card.value;
      return {
        ...p,
        hand: [...p.hand, card],
        points: newPoints,
      };
    }
    return p;
  });

  // Remove card from in-play zone
  const updatedInPlayZone = state.inPlayZone.filter(c => c.id !== cardId);

  // Check for winner
  const potentialWinner = updatedPlayers.find(p => p.points >= WINNING_SCORE);

  // Move to next selecting player
  const nextSelectingIndex = (state.selectingPlayerIndex + 1) % state.players.length;
  const allPlayersSelected = nextSelectingIndex === state.currentPlayerIndex;

  if (potentialWinner) {
    return {
      ...state,
      players: updatedPlayers,
      inPlayZone: updatedInPlayZone,
      phase: 'ended',
      winner: potentialWinner,
    };
  }

  if (allPlayersSelected) {
    // All players have selected, move to discarding phase
    return {
      ...state,
      players: updatedPlayers,
      inPlayZone: updatedInPlayZone,
      phase: 'discarding',
      selectingPlayerIndex: nextSelectingIndex,
    };
  }

  return {
    ...state,
    players: updatedPlayers,
    inPlayZone: updatedInPlayZone,
    selectingPlayerIndex: nextSelectingIndex,
  };
}

export function discardRemainingCards(state: GameState): GameState {
  const newDiscardPile = [...state.discardPile, ...state.inPlayZone];
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    inPlayZone: [],
    discardPile: newDiscardPile,
    currentPlayerIndex: nextPlayerIndex,
    selectingPlayerIndex: nextPlayerIndex,
    phase: 'drawing',
    turnNumber: state.turnNumber + 1,
  };
}
