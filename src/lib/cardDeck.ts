import type {
  Card,
  PermanentCard,
  SingleUseCard,
  PointCard,
  PermanentCardEffect,
  SingleUseCardEffect,
} from "@/types/game";

// ============================================
// Card Templates
// ============================================

interface PermanentCardTemplate {
  name: string;
  effect: PermanentCardEffect;
  cost: number;
  description: string;
  copies: number; // Number of copies in the deck
}

interface SingleUseCardTemplate {
  name: string;
  effect: SingleUseCardEffect;
  cost: number;
  description: string;
  copies: number;
}

interface PointCardTemplate {
  name: string;
  points: number;
  cost: number;
  copies: number;
}

// ============================================
// Permanent Card Definitions
// ============================================

const permanentCardTemplates: PermanentCardTemplate[] = [
  {
    name: "+1 Die",
    effect: "PLUS_ONE_DIE",
    cost: 5,
    description: "Roll 3 dice and keep the best 2",
    copies: 2,
  },
  {
    name: "Reroll",
    effect: "REROLL",
    cost: 3,
    description: "Reroll one die after seeing the result",
    copies: 3,
  },
  {
    name: "Shield",
    effect: "SHIELD",
    cost: 4,
    description: "Block one 7 (negate crap-out once per turn)",
    copies: 2,
  },
  {
    name: "Lucky Charm",
    effect: "LUCKY",
    cost: 4,
    description: "Guarantee non-7 on next roll",
    copies: 2,
  },
  {
    name: "Armor",
    effect: "ARMOR",
    cost: 3,
    description: "Next crap-out doesn't lose gold",
    copies: 2,
  },
  {
    name: "Point Bonus",
    effect: "POINT_BONUS",
    cost: 4,
    description: "Point hit removes 2 numbers instead of 1",
    copies: 2,
  },
  {
    name: "Double Strike",
    effect: "DOUBLE",
    cost: 5,
    description: "Next monster hit counts as 2 hits",
    copies: 2,
  },
];

// ============================================
// Single-Use Card Definitions
// ============================================

const singleUseCardTemplates: SingleUseCardTemplate[] = [
  {
    name: "Stun",
    effect: "STUN",
    cost: 2,
    description: "Skip your rolling phase this turn (avoid risky fights)",
    copies: 2,
  },
  {
    name: "Rapid Fire",
    effect: "RAPID_FIRE",
    cost: 3,
    description: "Roll twice this turn",
    copies: 2,
  },
  {
    name: "Momentum",
    effect: "MOMENTUM",
    cost: 3,
    description: "After 2 hits, gain +1 die for your next roll",
    copies: 2,
  },
  {
    name: "Charm",
    effect: "CHARM",
    cost: 4,
    description: "Take 2 consecutive turns",
    copies: 1,
  },
  {
    name: "Curse",
    effect: "CURSE",
    cost: 3,
    description: "Target player's next roll is treated as 7",
    copies: 2,
  },
  {
    name: "Heal",
    effect: "HEAL",
    cost: 2,
    description: "Un-cross one number from the current monster",
    copies: 1,
  },
];

// ============================================
// Point Card Definitions
// ============================================

const pointCardTemplates: PointCardTemplate[] = [
  {
    name: "+1 Point",
    points: 1,
    cost: 2,
    copies: 8,
  },
  {
    name: "+2 Points",
    points: 2,
    cost: 4,
    copies: 6,
  },
  {
    name: "+3 Points",
    points: 3,
    cost: 6,
    copies: 4,
  },
  {
    name: "+5 Points",
    points: 5,
    cost: 10,
    copies: 2,
  },
];

// ============================================
// Card Creation Functions
// ============================================

let cardIdCounter = 0;

function generateCardId(prefix: string): string {
  cardIdCounter++;
  return `${prefix}-${cardIdCounter}-${Date.now()}`;
}

function createPermanentCard(template: PermanentCardTemplate): PermanentCard {
  return {
    type: "permanent",
    id: generateCardId("perm"),
    name: template.name,
    cost: template.cost,
    effect: template.effect,
    description: template.description,
  };
}

function createSingleUseCard(template: SingleUseCardTemplate): SingleUseCard {
  return {
    type: "single_use",
    id: generateCardId("single"),
    name: template.name,
    cost: template.cost,
    effect: template.effect,
    description: template.description,
  };
}

function createPointCard(template: PointCardTemplate): PointCard {
  return {
    type: "point",
    id: generateCardId("point"),
    name: template.name,
    cost: template.cost,
    points: template.points,
  };
}

// ============================================
// Deck Creation Functions
// ============================================

/**
 * Creates the full card deck with all card types
 * @returns Array of all cards in the deck
 */
export function createCardDeck(): Card[] {
  const deck: Card[] = [];

  // Add permanent cards
  for (const template of permanentCardTemplates) {
    for (let i = 0; i < template.copies; i++) {
      deck.push(createPermanentCard(template));
    }
  }

  // Add single-use cards
  for (const template of singleUseCardTemplates) {
    for (let i = 0; i < template.copies; i++) {
      deck.push(createSingleUseCard(template));
    }
  }

  // Add point cards
  for (const template of pointCardTemplates) {
    for (let i = 0; i < template.copies; i++) {
      deck.push(createPointCard(template));
    }
  }

  return deck;
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array (does not mutate original)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a shuffled card deck
 * @returns Shuffled array of all cards
 */
export function createShuffledDeck(): Card[] {
  return shuffleArray(createCardDeck());
}

/**
 * Draws cards from the deck
 * @param deck - The deck to draw from
 * @param count - Number of cards to draw
 * @returns Object with drawn cards and remaining deck
 */
export function drawCards(
  deck: Card[],
  count: number
): { drawn: Card[]; remaining: Card[] } {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
}

// ============================================
// Card Info Functions
// ============================================

/**
 * Gets the total number of cards in a full deck
 * @returns Total card count
 */
export function getTotalCardCount(): number {
  let count = 0;
  for (const template of permanentCardTemplates) {
    count += template.copies;
  }
  for (const template of singleUseCardTemplates) {
    count += template.copies;
  }
  for (const template of pointCardTemplates) {
    count += template.copies;
  }
  return count;
}

/**
 * Gets card counts by type
 * @returns Object with counts for each card type
 */
export function getCardCountsByType(): {
  permanent: number;
  singleUse: number;
  point: number;
} {
  let permanent = 0;
  let singleUse = 0;
  let point = 0;

  for (const template of permanentCardTemplates) {
    permanent += template.copies;
  }
  for (const template of singleUseCardTemplates) {
    singleUse += template.copies;
  }
  for (const template of pointCardTemplates) {
    point += template.copies;
  }

  return { permanent, singleUse, point };
}

/**
 * Checks if a card is a permanent card
 */
export function isPermanentCard(card: Card): card is PermanentCard {
  return card.type === "permanent";
}

/**
 * Checks if a card is a single-use card
 */
export function isSingleUseCard(card: Card): card is SingleUseCard {
  return card.type === "single_use";
}

/**
 * Checks if a card is a point card
 */
export function isPointCard(card: Card): card is PointCard {
  return card.type === "point";
}
