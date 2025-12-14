import { Card, GameState, Player, PLAYER_COLORS, WINNING_SCORE } from '@/types/game';

const CARD_COLORS = [
  '#DC2626', // red
  '#2563EB', // blue
  '#16A34A', // green
  '#CA8A04', // yellow
  '#9333EA', // purple
];

const MONSTER_NAMES = [
  'Goblin', 'Orc', 'Troll', 'Dragon', 'Skeleton',
  'Zombie', 'Ghost', 'Vampire', 'Werewolf', 'Demon',
  'Spider', 'Rat', 'Bat', 'Snake', 'Wolf',
  'Bear', 'Minotaur', 'Harpy', 'Medusa', 'Cyclops',
];

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  // Create monster cards (3 copies of each monster)
  for (let copy = 0; copy < 3; copy++) {
    for (let i = 0; i < MONSTER_NAMES.length; i++) {
      // Vary the difficulty - some monsters are tougher than others
      const baseStrength = (i % 10) + 1;  // 1-10
      const baseDefense = (i % 10) + 1;   // 1-10
      const pointValue = Math.min(Math.floor(baseStrength / 3) + 1, 3); // 1-3 based on strength

      deck.push({
        id: `card-${id++}`,
        name: MONSTER_NAMES[i],
        description: `A fearsome ${MONSTER_NAMES[i]}`,
        color: CARD_COLORS[i % CARD_COLORS.length],
        isMonster: true,
        strength: baseStrength,
        defense: baseDefense,
        pointValue: pointValue,
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
    strength: 1,  // All players start with strength 1
    defense: 1,   // All players start with defense 1
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

  // Combat logic for monster cards
  let updatedPlayers = state.players;
  let combatResult: 'victory' | 'defeat' | null = null;

  if (card.isMonster && card.strength !== undefined && card.defense !== undefined) {
    const playerStrength = selectingPlayer.strength;
    const playerDefense = selectingPlayer.defense;
    const monsterStrength = card.strength;
    const monsterDefense = card.defense;

    // Player defeats monster if their strength > monster defense
    if (playerStrength > monsterDefense) {
      combatResult = 'victory';
      // Add card to hand and award points
      updatedPlayers = state.players.map(p => {
        if (p.id === selectingPlayer.id) {
          const pointsGained = card.pointValue || 0;
          return {
            ...p,
            hand: [...p.hand, card],
            points: p.points + pointsGained,
          };
        }
        return p;
      });
    }
    // Player is defeated if their strength <= monster defense AND monster strength > their defense
    else if (playerStrength <= monsterDefense && monsterStrength > playerDefense) {
      combatResult = 'defeat';
      // Player gets the card but no points (they were defeated)
      updatedPlayers = state.players.map(p => {
        if (p.id === selectingPlayer.id) {
          return {
            ...p,
            hand: [...p.hand, card],
          };
        }
        return p;
      });
    }
    // Stalemate - neither player nor monster wins
    else {
      // Player gets the card but no points
      updatedPlayers = state.players.map(p => {
        if (p.id === selectingPlayer.id) {
          return {
            ...p,
            hand: [...p.hand, card],
          };
        }
        return p;
      });
    }
  } else {
    // Non-monster cards (if any exist in future)
    updatedPlayers = state.players.map(p => {
      if (p.id === selectingPlayer.id) {
        return {
          ...p,
          hand: [...p.hand, card],
        };
      }
      return p;
    });
  }

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
