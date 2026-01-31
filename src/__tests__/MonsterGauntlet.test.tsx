import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  MonsterGauntlet,
  GauntletProgress,
  MiniGauntlet,
} from "@/components/MonsterGauntlet";
import type { Monster, Player } from "@/types/game";

// Helper to create test monsters
function createTestMonsters(count = 10): Monster[] {
  const monsters: Monster[] = [];
  for (let i = 1; i <= count; i++) {
    monsters.push({
      id: `monster-${i}`,
      name: `Monster ${i}`,
      type: i === 10 ? "BOSS" : "GOBLIN",
      position: i,
      numbersToHit: [4, 10],
      remainingNumbers: [4, 10],
      points: i,
      goldReward: i,
    });
  }
  return monsters;
}

// Helper to create a defeated monster
function defeatMonster(monster: Monster): Monster {
  return { ...monster, remainingNumbers: [] };
}

// Helper to create a test player
function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player-1",
    name: "Test Player",
    gold: 10,
    victoryPoints: 0,
    damageCount: 0,
    permanentCards: [],
    singleUseCards: [],
    ...overrides,
  };
}

describe("GauntletProgress", () => {
  it("should render progress bar", () => {
    render(<GauntletProgress total={10} defeated={3} currentPosition={4} />);

    expect(screen.getByText("Gauntlet Progress")).toBeInTheDocument();
    expect(screen.getByText("3/10 Defeated")).toBeInTheDocument();
  });

  it("should show start and boss labels", () => {
    render(<GauntletProgress total={10} defeated={0} currentPosition={1} />);

    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByText("Boss")).toBeInTheDocument();
  });
});

describe("MonsterGauntlet", () => {
  it("should render all monster cards", () => {
    const monsters = createTestMonsters();
    const { container } = render(<MonsterGauntlet monsters={monsters} currentMonsterIndex={0} />);

    // Check all 10 monster cards are rendered by counting the position badges
    const positionBadges = container.querySelectorAll(".absolute.-top-2.-left-2");
    expect(positionBadges).toHaveLength(10);

    // Also verify monster buttons exist
    const monsterButtons = screen.getAllByRole("button");
    expect(monsterButtons).toHaveLength(10);
  });

  it("should show current monster details when showFullDetails is true", () => {
    const monsters = createTestMonsters();
    render(
      <MonsterGauntlet
        monsters={monsters}
        currentMonsterIndex={0}
        showFullDetails={true}
      />
    );

    expect(screen.getByText("Current Challenge")).toBeInTheDocument();
    expect(screen.getByRole("article", { name: /Monster: Monster 1/ })).toBeInTheDocument();
  });

  it("should hide current monster details when showFullDetails is false", () => {
    const monsters = createTestMonsters();
    render(
      <MonsterGauntlet
        monsters={monsters}
        currentMonsterIndex={0}
        showFullDetails={false}
      />
    );

    expect(screen.queryByText("Current Challenge")).not.toBeInTheDocument();
  });

  it("should highlight the current monster", () => {
    const monsters = createTestMonsters();
    const { container } = render(
      <MonsterGauntlet monsters={monsters} currentMonsterIndex={4} />
    );

    // The current monster card should have scale-105 class
    const currentCard = container.querySelectorAll(".scale-105");
    expect(currentCard.length).toBeGreaterThan(0);
  });

  it("should display gauntlet stats", () => {
    const monsters = createTestMonsters();
    // Defeat first 3 monsters
    monsters[0] = defeatMonster(monsters[0]);
    monsters[1] = defeatMonster(monsters[1]);
    monsters[2] = defeatMonster(monsters[2]);

    render(<MonsterGauntlet monsters={monsters} currentMonsterIndex={3} />);

    // Should show defeated count
    expect(screen.getByText("3/10")).toBeInTheDocument();
    expect(screen.getByText("Monsters Defeated")).toBeInTheDocument();
  });

  it("should calculate and display victory points", () => {
    const monsters = createTestMonsters();
    // Defeat monster with 1 point and monster with 2 points
    monsters[0] = defeatMonster(monsters[0]); // 1 VP
    monsters[1] = defeatMonster(monsters[1]); // 2 VP

    const { container } = render(<MonsterGauntlet monsters={monsters} currentMonsterIndex={2} />);

    // Earned VP: 1 + 2 = 3
    // Total VP: 1+2+3+4+5+6+7+8+9+10 = 55
    // Use container query to find the specific stat box
    const vpStatBox = container.querySelector(".bg-yellow-50");
    expect(vpStatBox).toBeInTheDocument();
    expect(vpStatBox?.textContent).toContain("3/55");
    expect(screen.getByText("Victory Points")).toBeInTheDocument();
  });

  it("should pass highlight number to current monster", () => {
    const monsters = createTestMonsters();
    render(
      <MonsterGauntlet
        monsters={monsters}
        currentMonsterIndex={0}
        highlightNumber={4}
        showFullDetails={true}
      />
    );

    // The highlight should be visible on the current monster display
    expect(screen.getByLabelText("Number 4 - highlighted")).toBeInTheDocument();
  });

  it("should show defeated by player name", () => {
    const monsters = createTestMonsters();
    monsters[0] = defeatMonster(monsters[0]);

    const defeatedByMap = new Map<string, Player>();
    defeatedByMap.set(monsters[0].id, createTestPlayer({ name: "Alice" }));

    render(
      <MonsterGauntlet
        monsters={monsters}
        currentMonsterIndex={1}
        defeatedByMap={defeatedByMap}
      />
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("should call onMonsterClick when monster card is clicked", () => {
    const monsters = createTestMonsters();
    const handleClick = jest.fn();

    render(
      <MonsterGauntlet
        monsters={monsters}
        currentMonsterIndex={0}
        onMonsterClick={handleClick}
      />
    );

    // Click on a monster card
    const monsterCards = screen.getAllByRole("button");
    fireEvent.click(monsterCards[2]); // Click third monster

    expect(handleClick).toHaveBeenCalledWith(monsters[2], 2);
  });

  it("should render empty state when no monsters", () => {
    render(<MonsterGauntlet monsters={[]} currentMonsterIndex={0} />);

    expect(screen.getByText("No monsters in the gauntlet")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const monsters = createTestMonsters();
    const { container } = render(
      <MonsterGauntlet
        monsters={monsters}
        currentMonsterIndex={0}
        className="custom-gauntlet"
      />
    );

    expect(container.querySelector(".custom-gauntlet")).toBeInTheDocument();
  });
});

describe("MiniGauntlet", () => {
  it("should render compact gauntlet display", () => {
    const monsters = createTestMonsters();
    render(<MiniGauntlet monsters={monsters} currentMonsterIndex={0} />);

    expect(screen.getByText("Gauntlet")).toBeInTheDocument();
    expect(screen.getByText("0/10")).toBeInTheDocument();
  });

  it("should show current monster name", () => {
    const monsters = createTestMonsters();
    render(<MiniGauntlet monsters={monsters} currentMonsterIndex={4} />);

    expect(screen.getByText("Current: Monster 5")).toBeInTheDocument();
  });

  it("should update defeated count", () => {
    const monsters = createTestMonsters();
    monsters[0] = defeatMonster(monsters[0]);
    monsters[1] = defeatMonster(monsters[1]);

    render(<MiniGauntlet monsters={monsters} currentMonsterIndex={2} />);

    expect(screen.getByText("2/10")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const monsters = createTestMonsters();
    const { container } = render(
      <MiniGauntlet
        monsters={monsters}
        currentMonsterIndex={0}
        className="mini-custom"
      />
    );

    expect(container.querySelector(".mini-custom")).toBeInTheDocument();
  });

  it("should render 10 indicator squares", () => {
    const monsters = createTestMonsters();
    const { container } = render(
      <MiniGauntlet monsters={monsters} currentMonsterIndex={0} />
    );

    // Should have 10 squares (one per monster)
    const squares = container.querySelectorAll(".w-3.h-3.rounded-sm");
    expect(squares).toHaveLength(10);
  });

  it("should highlight current monster with green pulse", () => {
    const monsters = createTestMonsters();
    const { container } = render(
      <MiniGauntlet monsters={monsters} currentMonsterIndex={3} />
    );

    const currentSquare = container.querySelector(".bg-green-500.animate-pulse");
    expect(currentSquare).toBeInTheDocument();
  });

  it("should show defeated monsters as gray", () => {
    const monsters = createTestMonsters();
    monsters[0] = defeatMonster(monsters[0]);
    monsters[1] = defeatMonster(monsters[1]);

    const { container } = render(
      <MiniGauntlet monsters={monsters} currentMonsterIndex={2} />
    );

    const graySquares = container.querySelectorAll(".bg-gray-400");
    expect(graySquares).toHaveLength(2);
  });
});
