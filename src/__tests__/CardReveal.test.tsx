import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  CardReveal,
  CompactCardReveal,
  CardRevealPhaseHeader,
} from "@/components/CardReveal";
import type { Player, PermanentCard, SingleUseCard } from "@/types/game";

// Helper to create a mock player
function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "test-player-1",
    name: "Test Player",
    gold: 10,
    victoryPoints: 0,
    damageCount: 0,
    permanentCards: [],
    singleUseCards: [],
    ...overrides,
  };
}

// Helper to create mock cards
function createMockPermanentCard(
  overrides: Partial<PermanentCard> = {}
): PermanentCard {
  return {
    type: "permanent",
    id: "perm-test-1",
    name: "+1 Die",
    cost: 5,
    effect: "PLUS_ONE_DIE",
    description: "Roll 3 dice and keep the best 2",
    ...overrides,
  };
}

function createMockSingleUseCard(
  overrides: Partial<SingleUseCard> = {}
): SingleUseCard {
  return {
    type: "single_use",
    id: "single-test-1",
    name: "Stun",
    cost: 2,
    effect: "STUN",
    description: "Skip your rolling phase this turn",
    ...overrides,
  };
}

describe("CardReveal", () => {
  it("should render player name in header", () => {
    const player = createMockPlayer({ name: "Alice" });
    render(<CardReveal player={player} />);

    expect(screen.getByText(/Alice's Cards/)).toBeInTheDocument();
  });

  it("should show message about cards being visible", () => {
    const player = createMockPlayer();
    render(<CardReveal player={player} />);

    expect(screen.getByText(/All players can see these cards/)).toBeInTheDocument();
  });

  it("should show no cards message when player has no cards", () => {
    const player = createMockPlayer({
      permanentCards: [],
      singleUseCards: [],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("No cards in hand")).toBeInTheDocument();
  });

  it("should show permanent cards", () => {
    const player = createMockPlayer({
      permanentCards: [
        createMockPermanentCard({ name: "Shield Card" }),
      ],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("Shield Card")).toBeInTheDocument();
    expect(screen.getByText("Permanent Cards")).toBeInTheDocument();
  });

  it("should show single-use cards", () => {
    const player = createMockPlayer({
      singleUseCards: [
        createMockSingleUseCard({ name: "Healing Potion" }),
      ],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("Healing Potion")).toBeInTheDocument();
    expect(screen.getByText("Single-Use Cards")).toBeInTheDocument();
  });

  it("should display card count", () => {
    const player = createMockPlayer({
      permanentCards: [createMockPermanentCard()],
      singleUseCards: [
        createMockSingleUseCard({ id: "s1" }),
        createMockSingleUseCard({ id: "s2" }),
      ],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("3 cards")).toBeInTheDocument();
  });

  it("should show card descriptions", () => {
    const player = createMockPlayer({
      permanentCards: [
        createMockPermanentCard({
          description: "This is a test description",
        }),
      ],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("This is a test description")).toBeInTheDocument();
  });

  it("should show permanent/single-use badges on cards", () => {
    const player = createMockPlayer({
      permanentCards: [createMockPermanentCard()],
      singleUseCards: [createMockSingleUseCard()],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("PERMANENT")).toBeInTheDocument();
    expect(screen.getByText("SINGLE USE")).toBeInTheDocument();
  });

  it("should highlight specified cards", () => {
    const card = createMockPermanentCard({ id: "highlight-me" });
    const player = createMockPlayer({
      permanentCards: [card],
    });
    const { container } = render(<CardReveal player={player} highlightedCardIds={["highlight-me"]} />);

    // The highlighted card should have animate-pulse class on the card container
    const animatedElement = container.querySelector(".animate-pulse");
    expect(animatedElement).toBeInTheDocument();
  });

  it("should show hand capacity for permanent cards", () => {
    const player = createMockPlayer({
      permanentCards: [
        createMockPermanentCard({ id: "1" }),
        createMockPermanentCard({ id: "2" }),
      ],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("2/6")).toBeInTheDocument();
  });

  it("should show hand capacity for single-use cards", () => {
    const player = createMockPlayer({
      singleUseCards: [
        createMockSingleUseCard({ id: "1" }),
        createMockSingleUseCard({ id: "2" }),
        createMockSingleUseCard({ id: "3" }),
      ],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText("3/8")).toBeInTheDocument();
  });

  it("should show strategic note when player has cards", () => {
    const player = createMockPlayer({
      permanentCards: [createMockPermanentCard()],
    });
    render(<CardReveal player={player} />);

    expect(screen.getByText(/Consider these cards when placing your bets/)).toBeInTheDocument();
  });

  it("should show player avatar with first letter", () => {
    const player = createMockPlayer({ name: "Bob" });
    render(<CardReveal player={player} />);

    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const player = createMockPlayer();
    const { container } = render(
      <CardReveal player={player} className="custom-class" />
    );

    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});

describe("CompactCardReveal", () => {
  it("should render player name", () => {
    const player = createMockPlayer({ name: "Charlie" });
    render(<CompactCardReveal player={player} />);

    expect(screen.getByText(/Charlie's Cards/)).toBeInTheDocument();
  });

  it("should show total card count", () => {
    const player = createMockPlayer({
      permanentCards: [createMockPermanentCard()],
      singleUseCards: [createMockSingleUseCard()],
    });
    render(<CompactCardReveal player={player} />);

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should show no cards message when empty", () => {
    const player = createMockPlayer({
      permanentCards: [],
      singleUseCards: [],
    });
    render(<CompactCardReveal player={player} />);

    expect(screen.getByText("No cards")).toBeInTheDocument();
  });

  it("should call onExpand when clicked", () => {
    const player = createMockPlayer();
    const onExpand = jest.fn();
    render(<CompactCardReveal player={player} onExpand={onExpand} />);

    fireEvent.click(screen.getByText(/Cards/));
    expect(onExpand).toHaveBeenCalled();
  });

  it("should show card effect icons", () => {
    const player = createMockPlayer({
      permanentCards: [
        createMockPermanentCard({ effect: "SHIELD" }),
      ],
      singleUseCards: [
        createMockSingleUseCard({ effect: "HEAL" }),
      ],
    });
    render(<CompactCardReveal player={player} />);

    // Check that the icons are rendered (shield and heal icons)
    expect(screen.getByText("🛡️")).toBeInTheDocument();
    expect(screen.getByText("💚")).toBeInTheDocument();
  });
});

describe("CardRevealPhaseHeader", () => {
  it("should render phase name", () => {
    render(<CardRevealPhaseHeader playerName="Dave" />);

    expect(screen.getByText("Card Reveal Phase")).toBeInTheDocument();
  });

  it("should show player name in message", () => {
    render(<CardRevealPhaseHeader playerName="Dave" />);

    expect(screen.getByText(/Review Dave's cards/)).toBeInTheDocument();
  });

  it("should show continue button when onContinue is provided", () => {
    const onContinue = jest.fn();
    render(<CardRevealPhaseHeader playerName="Dave" onContinue={onContinue} />);

    expect(screen.getByText("Continue to Betting")).toBeInTheDocument();
  });

  it("should call onContinue when button clicked", () => {
    const onContinue = jest.fn();
    render(<CardRevealPhaseHeader playerName="Dave" onContinue={onContinue} />);

    fireEvent.click(screen.getByText("Continue to Betting"));
    expect(onContinue).toHaveBeenCalled();
  });

  it("should not show button when onContinue is not provided", () => {
    render(<CardRevealPhaseHeader playerName="Dave" />);

    expect(screen.queryByText("Continue to Betting")).not.toBeInTheDocument();
  });
});
