import type { Monster, MonsterType } from "@/types/game";

// ============================================
// Monster Deck Data
// ============================================

// Base monster definitions (templates for creating monster instances)
interface MonsterTemplate {
  name: string;
  type: MonsterType;
  numbersToHit: number[];
  points: number;
  goldReward: number;
}

const monsterTemplates: MonsterTemplate[] = [
  // Position 1: Easy monster
  {
    name: "Cave Goblin",
    type: "GOBLIN",
    numbersToHit: [4, 10],
    points: 1,
    goldReward: 2,
  },
  // Position 2: Easy monster
  {
    name: "Skeletal Warrior",
    type: "SKELETON",
    numbersToHit: [5, 9],
    points: 1,
    goldReward: 2,
  },
  // Position 3: Medium-easy monster
  {
    name: "Orc Berserker",
    type: "ORC",
    numbersToHit: [4, 6, 10],
    points: 1,
    goldReward: 3,
  },
  // Position 4: Medium monster
  {
    name: "Mountain Troll",
    type: "TROLL",
    numbersToHit: [5, 8, 9],
    points: 2,
    goldReward: 3,
  },
  // Position 5: Medium monster
  {
    name: "Vengeful Wraith",
    type: "WRAITH",
    numbersToHit: [4, 6, 8, 10],
    points: 2,
    goldReward: 4,
  },
  // Position 6: Medium-hard monster
  {
    name: "Stone Golem",
    type: "GOLEM",
    numbersToHit: [4, 5, 9, 10],
    points: 2,
    goldReward: 4,
  },
  // Position 7: Hard monster
  {
    name: "Infernal Demon",
    type: "DEMON",
    numbersToHit: [4, 5, 6, 8, 9],
    points: 3,
    goldReward: 5,
  },
  // Position 8: Hard monster
  {
    name: "Ancient Dragon",
    type: "DRAGON",
    numbersToHit: [4, 5, 6, 9, 10],
    points: 3,
    goldReward: 5,
  },
  // Position 9: Very hard monster
  {
    name: "Dread Lich",
    type: "LICH",
    numbersToHit: [4, 5, 6, 8, 9, 10],
    points: 4,
    goldReward: 6,
  },
  // Position 10: Boss monster with all point numbers
  {
    name: "The Abyssal Tyrant",
    type: "BOSS",
    numbersToHit: [4, 5, 6, 8, 9, 10],
    points: 5,
    goldReward: 8,
  },
];

/**
 * Creates a new monster instance from a template
 * @param position - The position in the gauntlet (1-10)
 * @returns A new Monster instance
 */
export function createMonster(position: number): Monster {
  if (position < 1 || position > 10) {
    throw new Error("Monster position must be between 1 and 10");
  }

  const template = monsterTemplates[position - 1];

  return {
    id: `monster-${position}-${Date.now()}`,
    name: template.name,
    type: template.type,
    position,
    numbersToHit: [...template.numbersToHit],
    remainingNumbers: [...template.numbersToHit], // Start with all numbers needing to be hit
    points: template.points,
    goldReward: template.goldReward,
  };
}

/**
 * Creates the full monster gauntlet (10 monsters)
 * @returns Array of 10 Monster instances
 */
export function createMonsterGauntlet(): Monster[] {
  const monsters: Monster[] = [];
  for (let i = 1; i <= 10; i++) {
    monsters.push(createMonster(i));
  }
  return monsters;
}

/**
 * Gets monster template info without creating an instance
 * @param position - The position in the gauntlet (1-10)
 * @returns The monster template
 */
export function getMonsterTemplate(position: number): MonsterTemplate {
  if (position < 1 || position > 10) {
    throw new Error("Monster position must be between 1 and 10");
  }
  return { ...monsterTemplates[position - 1] };
}

/**
 * Check if a monster is the boss
 * @param monster - The monster to check
 * @returns True if the monster is the boss
 */
export function isBossMonster(monster: Monster): boolean {
  return monster.type === "BOSS";
}

/**
 * Get total points available in the gauntlet
 * @returns Total victory points from all monsters
 */
export function getTotalGauntletPoints(): number {
  return monsterTemplates.reduce((sum, template) => sum + template.points, 0);
}

/**
 * Get total gold available in the gauntlet
 * @returns Total gold from all monsters
 */
export function getTotalGauntletGold(): number {
  return monsterTemplates.reduce((sum, template) => sum + template.goldReward, 0);
}

/**
 * Check if a monster has been defeated (all numbers crossed off)
 * @param monster - The monster to check
 * @returns True if all numbers have been hit
 */
export function isMonsterDefeated(monster: Monster): boolean {
  return monster.remainingNumbers.length === 0;
}

/**
 * Get the numbers that have been hit on a monster
 * @param monster - The monster to check
 * @returns Array of numbers that have been crossed off
 */
export function getHitNumbers(monster: Monster): number[] {
  return monster.numbersToHit.filter(
    (num) => !monster.remainingNumbers.includes(num)
  );
}

/**
 * Get the count of remaining numbers on a monster
 * @param monster - The monster to check
 * @returns Number of hits still needed to defeat the monster
 */
export function getRemainingHitCount(monster: Monster): number {
  return monster.remainingNumbers.length;
}

/**
 * Get monster difficulty description based on number count
 * @param monster - The monster to evaluate
 * @returns A difficulty string
 */
export function getMonsterDifficulty(monster: Monster): "Easy" | "Medium" | "Hard" | "Boss" {
  if (monster.type === "BOSS") return "Boss";
  const count = monster.numbersToHit.length;
  if (count <= 2) return "Easy";
  if (count <= 4) return "Medium";
  return "Hard";
}
