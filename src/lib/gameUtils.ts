import { Card, GameState, Player, PLAYER_COLORS, WINNING_SCORE, BOSS_FIGHT_INTERVAL, SHOP_INTERVAL } from '@/types/game';

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

const BOSS_NAMES = [
  'Ancient Dragon',
  'Demon Lord',
  'Lich King',
  'Titan Golem',
  'Shadow Behemoth',
  'Frost Giant King',
  'Void Wyrm',
  'Inferno Phoenix',
];

export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  // Create monster cards (3 copies of each monster)
  for (let copy = 0; copy < 3; copy++) {
    for (let i = 0; i < MONSTER_NAMES.length; i++) {
      // Vary the difficulty - some monsters are tougher than others
      const baseStrength = (i % 2) + 1;  // 1-2 (reduced for testing)
      const baseDefense = (i % 3) + 1;   // 1-3 (reduced for testing)
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
        goldValue: baseStrength, // Gold value equals strength
      });
    }
  }

  return shuffleDeck(deck);
}

export function generateBossDeck(): Card[] {
  const bossDeck: Card[] = [];
  let id = 1000; // Start with high ID to avoid conflicts

  // Create powerful boss cards
  BOSS_NAMES.forEach((name, i) => {
    const strength = 10 + (i % 10) + 1; // 11-20
    const defense = 10 + (i % 10) + 1;  // 11-20
    const pointValue = 5 + Math.floor(i / 2); // 5-9

    bossDeck.push({
      id: `boss-${id++}`,
      name,
      description: `A legendary ${name}, feared across the realm`,
      color: '#8B0000', // Dark red for all bosses
      isMonster: true,
      isBoss: true,
      strength,
      defense,
      pointValue,
      goldValue: strength, // Gold value equals strength for bosses too
    });
  });

  return shuffleDeck(bossDeck);
}

const EQUIPMENT_NAMES = [
  'Iron Sword', 'Steel Sword', 'Enchanted Blade', 'Dragon Slayer',
  'Leather Armor', 'Chain Mail', 'Plate Armor', 'Dragon Scale Armor',
  'Wooden Shield', 'Iron Shield', 'Tower Shield', 'Blessed Shield',
  'Magic Ring', 'Power Amulet', 'Battle Helm', 'Gauntlets of Strength',
  'Boots of Speed', 'Cloak of Defense', 'Berserker Axe', 'Holy Mace',
];

export function generateShopDeck(): Card[] {
  const shopDeck: Card[] = [];
  let id = 2000; // Start with high ID to avoid conflicts

  // Create equipment cards with varying stats and costs
  EQUIPMENT_NAMES.forEach((name, i) => {
    // Cost ranges from 1-10
    const cost = (i % 10) + 1;

    // Determine if item is more strength or defense focused
    const isStrengthFocused = i % 3 !== 0;
    const isDefenseFocused = i % 3 === 0;
    const isBalanced = i % 5 === 0;

    let strengthBonus = 0;
    let defenseBonus = 0;

    if (isBalanced) {
      // Balanced items give both stats
      strengthBonus = Math.floor(cost / 2);
      defenseBonus = Math.floor(cost / 2);
    } else if (isStrengthFocused) {
      // Strength focused items
      strengthBonus = cost;
      defenseBonus = Math.floor(cost / 3);
    } else {
      // Defense focused items
      strengthBonus = Math.floor(cost / 3);
      defenseBonus = cost;
    }

    shopDeck.push({
      id: `shop-${id++}`,
      name,
      description: `+${strengthBonus} STR, +${defenseBonus} DEF`,
      color: '#FFD700', // Gold color for shop items
      isMonster: false,
      isShopItem: true,
      itemType: 'equipment',
      cost,
      strengthBonus,
      defenseBonus,
    });
  });

  return shuffleDeck(shopDeck);
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
    inventory: [],    // Empty inventory at start
    equipment: [],    // No equipment at start
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    strength: 1,      // All players start with strength 1
    defense: 1,       // All players start with defense 1
    skipNextTurn: false, // No penalty at start
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
    shoppingPlayerIndex: 0,
    deck: generateDeck(),
    bossDeck: generateBossDeck(),
    shopDeck: generateShopDeck(),
    inPlayZone: [],
    shopZone: [],
    discardPile: [],
    phase: 'drawing',
    winner: null,
    turnNumber: 1,
    bossDefeated: false,
    gameOver: false,
  };
}

export function getCardsToDrawCount(playerCount: number): number {
  return playerCount + 1;
}

export function drawCards(state: GameState): GameState {
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Check if current player has skip turn penalty
  if (currentPlayer.skipNextTurn) {
    // Skip this player's turn and remove penalty
    const updatedPlayers = state.players.map(p => {
      if (p.id === currentPlayer.id) {
        return { ...p, skipNextTurn: false };
      }
      return p;
    });

    const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

    return {
      ...state,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      selectingPlayerIndex: nextPlayerIndex,
      turnNumber: state.turnNumber + 1,
    };
  }

  const isBossFight = state.turnNumber % BOSS_FIGHT_INTERVAL === 0;
  const playerCount = state.players.length;

  let drawnCards: Card[] = [];
  let deck = [...state.deck];
  let bossDeck = [...state.bossDeck];
  let discardPile = [...state.discardPile];

  if (isBossFight) {
    // Boss fight: Draw 1 boss + (playerCount) regular cards
    // Draw boss card
    if (bossDeck.length > 0) {
      const bossCard = bossDeck[0];
      drawnCards.push(bossCard);
      bossDeck = bossDeck.slice(1);
    }

    // Draw remaining regular cards
    const regularCardsToDraw = playerCount;
    if (deck.length < regularCardsToDraw) {
      deck = [...deck, ...shuffleDeck(discardPile)];
      discardPile = [];
    }

    const regularCards = deck.slice(0, regularCardsToDraw);
    deck = deck.slice(regularCardsToDraw);
    drawnCards = [...drawnCards, ...regularCards];
  } else {
    // Regular turn: Draw playerCount + 1 cards
    const cardsToDraw = getCardsToDrawCount(playerCount);

    if (deck.length < cardsToDraw) {
      deck = [...deck, ...shuffleDeck(discardPile)];
      discardPile = [];
    }

    drawnCards = deck.slice(0, cardsToDraw);
    deck = deck.slice(cardsToDraw);
  }

  return {
    ...state,
    deck,
    bossDeck,
    discardPile,
    inPlayZone: drawnCards,
    phase: 'selecting',
    selectingPlayerIndex: state.currentPlayerIndex,
    bossDefeated: false, // Reset boss defeated flag for new turn
  };
}

export function selectCard(state: GameState, cardId: string): GameState {
  const card = state.inPlayZone.find(c => c.id === cardId);
  if (!card) return state;

  const selectingPlayer = state.players[state.selectingPlayerIndex];

  // Combat logic for monster cards
  let updatedPlayers = state.players;
  let combatResult: 'victory' | 'defeat' | null = null;
  let updatedInPlayZone = state.inPlayZone;
  let bossDefeated = state.bossDefeated;

  if (card.isMonster && card.strength !== undefined && card.defense !== undefined) {
    const playerStrength = selectingPlayer.strength;
    const playerDefense = selectingPlayer.defense;
    const monsterStrength = card.strength;
    const monsterDefense = card.defense;

    // Player defeats monster if their strength > monster defense
    if (playerStrength > monsterDefense) {
      combatResult = 'victory';

      // If it's a boss, mark it as defeated and remove from play
      if (card.isBoss) {
        bossDefeated = true;
        updatedInPlayZone = state.inPlayZone.filter(c => c.id !== cardId);
      } else {
        // Regular monsters are always removed
        updatedInPlayZone = state.inPlayZone.filter(c => c.id !== cardId);
      }

      // Add card to inventory (for trading) and hand, award points
      updatedPlayers = state.players.map(p => {
        if (p.id === selectingPlayer.id) {
          const pointsGained = card.pointValue || 0;
          return {
            ...p,
            hand: [...p.hand, card],
            inventory: [...p.inventory, card], // Add to inventory for trading
            points: p.points + pointsGained,
          };
        }
        return p;
      });
    }
    // Player is defeated if their strength <= monster defense AND monster strength > their defense
    else if (playerStrength <= monsterDefense && monsterStrength > playerDefense) {
      combatResult = 'defeat';

      // If it's a boss, it stays in play
      if (card.isBoss) {
        // Boss remains in play, don't remove it
        updatedInPlayZone = state.inPlayZone;
      } else {
        // Regular monsters are removed even on defeat
        updatedInPlayZone = state.inPlayZone.filter(c => c.id !== cardId);
      }

      // Player gets the card but no points (they were defeated)
      // Apply penalty: skip next turn
      // Unless it's a boss that stays in play
      updatedPlayers = state.players.map(p => {
        if (p.id === selectingPlayer.id) {
          return {
            ...p,
            hand: card.isBoss ? p.hand : [...p.hand, card],
            skipNextTurn: true, // Apply penalty
          };
        }
        return p;
      });
    }
    // Stalemate - neither player nor monster wins
    else {
      // For bosses in stalemate, they stay in play
      if (card.isBoss) {
        updatedInPlayZone = state.inPlayZone;
      } else {
        updatedInPlayZone = state.inPlayZone.filter(c => c.id !== cardId);
      }

      // Player gets the card but no points (unless it's a boss)
      updatedPlayers = state.players.map(p => {
        if (p.id === selectingPlayer.id) {
          return {
            ...p,
            hand: card.isBoss ? p.hand : [...p.hand, card],
          };
        }
        return p;
      });
    }
  } else {
    // Non-monster cards (if any exist in future)
    updatedInPlayZone = state.inPlayZone.filter(c => c.id !== cardId);
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
      bossDefeated,
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
      bossDefeated,
    };
  }

  return {
    ...state,
    players: updatedPlayers,
    inPlayZone: updatedInPlayZone,
    selectingPlayerIndex: nextSelectingIndex,
    bossDefeated,
  };
}

export function discardRemainingCards(state: GameState): GameState {
  // Check if there's an undefeated boss in play
  const undefeatedBoss = state.inPlayZone.find(card => card.isBoss);

  if (undefeatedBoss && !state.bossDefeated) {
    // Game over - boss was not defeated
    return {
      ...state,
      phase: 'ended',
      winner: null,
      gameOver: true,
    };
  }

  const newDiscardPile = [...state.discardPile, ...state.inPlayZone];
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const nextTurnNumber = state.turnNumber + 1;

  // Check if next turn should be a shop round (every 5 turns, including boss fight rounds)
  const isShopRound = nextTurnNumber % SHOP_INTERVAL === 0;

  if (isShopRound) {
    // Transition to shopping phase
    return drawShopCards({
      ...state,
      inPlayZone: [],
      discardPile: newDiscardPile,
      currentPlayerIndex: nextPlayerIndex,
      selectingPlayerIndex: nextPlayerIndex,
      turnNumber: nextTurnNumber,
      bossDefeated: false,
    });
  }

  return {
    ...state,
    inPlayZone: [],
    discardPile: newDiscardPile,
    currentPlayerIndex: nextPlayerIndex,
    selectingPlayerIndex: nextPlayerIndex,
    phase: 'drawing',
    turnNumber: nextTurnNumber,
    bossDefeated: false,
  };
}

export function drawShopCards(state: GameState): GameState {
  const playerCount = state.players.length;
  const cardsToDraw = playerCount * 2; // N*2 cards for N players

  let shopDeck = [...state.shopDeck];
  const drawnCards = shopDeck.slice(0, cardsToDraw);
  shopDeck = shopDeck.slice(cardsToDraw);

  return {
    ...state,
    shopDeck,
    shopZone: drawnCards,
    phase: 'shopping',
    shoppingPlayerIndex: state.currentPlayerIndex,
  };
}

export function buyShopItem(
  state: GameState,
  shopItemId: string,
  tradeInCardIds: string[]
): GameState {
  const shopItem = state.shopZone.find(c => c.id === shopItemId);
  if (!shopItem || !shopItem.cost) return state;

  const shoppingPlayer = state.players[state.shoppingPlayerIndex];

  // Calculate total gold from trade-in cards
  const tradeInCards = shoppingPlayer.inventory.filter(c =>
    tradeInCardIds.includes(c.id)
  );
  const totalGold = tradeInCards.reduce((sum, card) => sum + (card.goldValue || 0), 0);

  // Check if player has enough gold
  if (totalGold < shopItem.cost) {
    return state; // Not enough gold
  }

  // Remove trade-in cards from inventory
  const updatedInventory = shoppingPlayer.inventory.filter(
    c => !tradeInCardIds.includes(c.id)
  );

  // Add shop item to equipment and apply bonuses
  const strengthBonus = shopItem.strengthBonus || 0;
  const defenseBonus = shopItem.defenseBonus || 0;

  const updatedPlayers = state.players.map(p => {
    if (p.id === shoppingPlayer.id) {
      return {
        ...p,
        inventory: updatedInventory,
        equipment: [...p.equipment, shopItem],
        strength: p.strength + strengthBonus,
        defense: p.defense + defenseBonus,
      };
    }
    return p;
  });

  // Remove purchased item from shop
  const updatedShopZone = state.shopZone.filter(c => c.id !== shopItemId);

  // Move to next player
  const nextShoppingIndex = (state.shoppingPlayerIndex + 1) % state.players.length;
  const allPlayersShopped = nextShoppingIndex === state.currentPlayerIndex;

  if (allPlayersShopped) {
    // All players have had their turn, end shopping phase
    return completeShoppingPhase({
      ...state,
      players: updatedPlayers,
      shopZone: updatedShopZone,
      shoppingPlayerIndex: nextShoppingIndex,
    });
  }

  return {
    ...state,
    players: updatedPlayers,
    shopZone: updatedShopZone,
    shoppingPlayerIndex: nextShoppingIndex,
  };
}

export function skipShopTurn(state: GameState): GameState {
  // Player chooses not to buy anything
  const nextShoppingIndex = (state.shoppingPlayerIndex + 1) % state.players.length;
  const allPlayersShopped = nextShoppingIndex === state.currentPlayerIndex;

  if (allPlayersShopped) {
    return completeShoppingPhase({
      ...state,
      shoppingPlayerIndex: nextShoppingIndex,
    });
  }

  return {
    ...state,
    shoppingPlayerIndex: nextShoppingIndex,
  };
}

export function completeShoppingPhase(state: GameState): GameState {
  // Return unpurchased shop items to the shop deck
  const updatedShopDeck = [...state.shopDeck, ...state.shopZone];

  return {
    ...state,
    shopZone: [],
    shopDeck: shuffleDeck(updatedShopDeck),
    phase: 'drawing',
  };
}
