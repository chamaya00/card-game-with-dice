import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Monster, MonsterCard } from "@/components/Monster";
import type { Monster as MonsterType } from "@/types/game";

// Helper to create a test monster
function createTestMonster(overrides: Partial<MonsterType> = {}): MonsterType {
  return {
    id: "test-monster-1",
    name: "Test Goblin",
    type: "GOBLIN",
    position: 1,
    numbersToHit: [4, 10],
    remainingNumbers: [4, 10],
    points: 1,
    goldReward: 2,
    ...overrides,
  };
}

describe("Monster", () => {
  it("should render monster name", () => {
    const monster = createTestMonster();
    render(<Monster monster={monster} />);
    expect(screen.getByText("Test Goblin")).toBeInTheDocument();
  });

  it("should display monster position", () => {
    const monster = createTestMonster({ position: 5 });
    render(<Monster monster={monster} />);
    expect(screen.getByText(/Position 5\/10/)).toBeInTheDocument();
  });

  it("should show victory points and gold reward", () => {
    const monster = createTestMonster({ points: 3, goldReward: 5 });
    render(<Monster monster={monster} />);
    expect(screen.getByText("3 VP")).toBeInTheDocument();
    expect(screen.getByText("5 Gold")).toBeInTheDocument();
  });

  it("should show remaining numbers count", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 5, 6],
      remainingNumbers: [4, 6],
    });
    render(<Monster monster={monster} />);
    expect(screen.getByText(/2 remaining/)).toBeInTheDocument();
  });

  it("should display hit numbers as crossed off", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 10],
      remainingNumbers: [10], // 4 is hit
    });
    render(<Monster monster={monster} />);

    // Number 4 should be marked as hit
    const hitNumber = screen.getByLabelText("Number 4 - hit");
    expect(hitNumber).toBeInTheDocument();
    expect(hitNumber).toHaveClass("line-through");
  });

  it("should display remaining numbers as active", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 10],
      remainingNumbers: [4, 10],
    });
    render(<Monster monster={monster} />);

    expect(screen.getByLabelText("Number 4 - remaining")).toBeInTheDocument();
    expect(screen.getByLabelText("Number 10 - remaining")).toBeInTheDocument();
  });

  it("should highlight specified number", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 5, 10],
      remainingNumbers: [4, 5, 10],
    });
    render(<Monster monster={monster} highlightNumber={5} />);

    const highlighted = screen.getByLabelText("Number 5 - highlighted");
    expect(highlighted).toBeInTheDocument();
    expect(highlighted).toHaveClass("animate-pulse");
  });

  it("should not highlight number if it's already hit", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 5],
      remainingNumbers: [5], // 4 is hit
    });
    render(<Monster monster={monster} highlightNumber={4} />);

    // Should show as hit, not highlighted
    expect(screen.getByLabelText("Number 4 - hit")).toBeInTheDocument();
    expect(screen.queryByLabelText("Number 4 - highlighted")).not.toBeInTheDocument();
  });

  it("should show DEFEATED banner when all numbers are hit", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 10],
      remainingNumbers: [], // all hit
    });
    render(<Monster monster={monster} />);

    expect(screen.getByText(/DEFEATED/)).toBeInTheDocument();
  });

  it("should apply active styling when isActive is true", () => {
    const monster = createTestMonster();
    const { container } = render(<Monster monster={monster} isActive={true} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("border-4");
    expect(card).toHaveClass("shadow-lg");
  });

  it("should show FINAL BOSS indicator for boss monster", () => {
    const monster = createTestMonster({
      type: "BOSS",
      name: "The Abyssal Tyrant",
      position: 10,
    });
    render(<Monster monster={monster} />);

    expect(screen.getByText(/FINAL BOSS/)).toBeInTheDocument();
  });

  it("should show difficulty badge based on numbers count", () => {
    // Easy monster (2 numbers)
    const easyMonster = createTestMonster({ numbersToHit: [4, 10] });
    const { rerender } = render(<Monster monster={easyMonster} />);
    expect(screen.getByText("Easy")).toBeInTheDocument();

    // Hard monster (5+ numbers)
    const hardMonster = createTestMonster({
      type: "DEMON",
      numbersToHit: [4, 5, 6, 8, 9],
    });
    rerender(<Monster monster={hardMonster} />);
    expect(screen.getByText("Hard")).toBeInTheDocument();
  });

  it("should render different sizes", () => {
    const monster = createTestMonster();

    const { rerender, container } = render(<Monster monster={monster} size="small" />);
    expect(container.firstChild).toHaveClass("max-w-xs");

    rerender(<Monster monster={monster} size="large" />);
    expect(container.firstChild).toHaveClass("max-w-md");
  });

  it("should have correct aria attributes", () => {
    const monster = createTestMonster({ name: "Cave Goblin" });
    render(<Monster monster={monster} />);

    expect(screen.getByRole("article", { name: /Monster: Cave Goblin/ })).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const monster = createTestMonster();
    const { container } = render(<Monster monster={monster} className="custom-test-class" />);

    expect(container.querySelector(".custom-test-class")).toBeInTheDocument();
  });

  it("should show all point numbers (4,5,6,8,9,10) with appropriate styling", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 5, 6], // Only some numbers on monster
      remainingNumbers: [4, 5, 6],
    });
    render(<Monster monster={monster} />);

    // Numbers on monster should be "remaining"
    expect(screen.getByLabelText("Number 4 - remaining")).toBeInTheDocument();
    expect(screen.getByLabelText("Number 5 - remaining")).toBeInTheDocument();
    expect(screen.getByLabelText("Number 6 - remaining")).toBeInTheDocument();

    // Numbers not on monster should be marked as such
    expect(screen.getByLabelText("Number 8 - not on monster")).toBeInTheDocument();
    expect(screen.getByLabelText("Number 9 - not on monster")).toBeInTheDocument();
    expect(screen.getByLabelText("Number 10 - not on monster")).toBeInTheDocument();
  });
});

describe("MonsterCard", () => {
  it("should render monster position badge", () => {
    const monster = createTestMonster({ position: 7 });
    render(<MonsterCard monster={monster} isCurrent={false} />);

    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("should show remaining count for active monsters", () => {
    const monster = createTestMonster({
      numbersToHit: [4, 5, 6],
      remainingNumbers: [4, 5],
    });
    render(<MonsterCard monster={monster} isCurrent={false} />);

    expect(screen.getByText("2 left")).toBeInTheDocument();
  });

  it("should show skull emoji when defeated", () => {
    const monster = createTestMonster({ remainingNumbers: [] });
    render(<MonsterCard monster={monster} isCurrent={false} />);

    expect(screen.getByText("☠️")).toBeInTheDocument();
  });

  it("should show who defeated the monster", () => {
    const monster = createTestMonster({ remainingNumbers: [] });
    render(<MonsterCard monster={monster} isCurrent={false} defeatedBy="Alice" />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("should apply current styling when isCurrent is true", () => {
    const monster = createTestMonster();
    const { container } = render(<MonsterCard monster={monster} isCurrent={true} />);

    expect(container.querySelector(".scale-105")).toBeInTheDocument();
    expect(container.querySelector(".shadow-lg")).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const monster = createTestMonster();
    const handleClick = jest.fn();
    render(<MonsterCard monster={monster} isCurrent={false} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when no onClick is provided", () => {
    const monster = createTestMonster();
    render(<MonsterCard monster={monster} isCurrent={false} />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should have appropriate aria label", () => {
    const monster = createTestMonster({ name: "Test Monster" });
    render(<MonsterCard monster={monster} isCurrent={true} />);

    expect(screen.getByLabelText(/Test Monster.*current/)).toBeInTheDocument();
  });

  it("should show boss styling for boss monster", () => {
    const monster = createTestMonster({ type: "BOSS" });
    const { container } = render(<MonsterCard monster={monster} isCurrent={false} />);

    expect(container.querySelector(".ring-yellow-400")).toBeInTheDocument();
  });
});
