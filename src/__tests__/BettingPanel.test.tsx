import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BettingPanel, CompactBettingDisplay } from "@/components/BettingPanel";
import type { Player, Bet } from "@/types/game";

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

describe("BettingPanel", () => {
  const defaultProps = {
    player: createMockPlayer(),
    activePlayerId: "shooter-1",
    bets: [] as Bet[],
    players: [
      createMockPlayer({ id: "test-player-1", name: "Test Player" }),
      createMockPlayer({ id: "shooter-1", name: "Shooter" }),
    ],
    isBettingPhase: true,
  };

  it("should render betting header", () => {
    render(<BettingPanel {...defaultProps} />);
    expect(screen.getByText("Betting")).toBeInTheDocument();
  });

  it("should show current shooter name", () => {
    render(<BettingPanel {...defaultProps} />);
    expect(screen.getByText("Shooter")).toBeInTheDocument();
  });

  it("should show bet type buttons", () => {
    render(<BettingPanel {...defaultProps} />);
    expect(screen.getByText("FOR")).toBeInTheDocument();
    expect(screen.getByText("AGAINST")).toBeInTheDocument();
  });

  it("should show player gold", () => {
    const player = createMockPlayer({ gold: 15 });
    render(<BettingPanel {...defaultProps} player={player} />);
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it("should show message when player is the shooter", () => {
    const player = createMockPlayer({ id: "shooter-1" });
    render(<BettingPanel {...defaultProps} player={player} />);
    expect(screen.getByText(/You're the shooter/)).toBeInTheDocument();
  });

  it("should allow placing a FOR bet", () => {
    const onPlaceBet = jest.fn();
    render(<BettingPanel {...defaultProps} onPlaceBet={onPlaceBet} />);

    // Default is FOR, so just click place bet
    fireEvent.click(screen.getByText(/Place Bet/));

    expect(onPlaceBet).toHaveBeenCalled();
    expect(onPlaceBet.mock.calls[0][0].type).toBe("FOR");
  });

  it("should allow placing an AGAINST bet", () => {
    const onPlaceBet = jest.fn();
    render(<BettingPanel {...defaultProps} onPlaceBet={onPlaceBet} />);

    // Select AGAINST
    fireEvent.click(screen.getByText("AGAINST"));
    fireEvent.click(screen.getByText(/Place Bet/));

    expect(onPlaceBet.mock.calls[0][0].type).toBe("AGAINST");
  });

  it("should allow changing bet amount", () => {
    const onPlaceBet = jest.fn();
    render(<BettingPanel {...defaultProps} onPlaceBet={onPlaceBet} />);

    // Click the quick amount button for 3
    fireEvent.click(screen.getByText("3"));
    fireEvent.click(screen.getByText(/Place Bet/));

    expect(onPlaceBet.mock.calls[0][0].amount).toBe(3);
  });

  it("should show existing bets", () => {
    const bets: Bet[] = [
      { playerId: "other-player", type: "FOR", amount: 5 },
    ];
    const players = [
      ...defaultProps.players,
      createMockPlayer({ id: "other-player", name: "Other Player" }),
    ];

    render(<BettingPanel {...defaultProps} bets={bets} players={players} />);

    expect(screen.getByText("Other Player")).toBeInTheDocument();
    // Check for the bet amount in the active bets section
    const activeBetsSection = screen.getByText("Active Bets").parentElement;
    expect(activeBetsSection).toHaveTextContent("5");
  });

  it("should show player's existing bet when they have one", () => {
    const bets: Bet[] = [{ playerId: "test-player-1", type: "FOR", amount: 3 }];

    render(<BettingPanel {...defaultProps} bets={bets} />);

    expect(screen.getByText("Your bet:")).toBeInTheDocument();
    expect(screen.getByText(/3.*FOR/)).toBeInTheDocument();
  });

  it("should disable betting when locked", () => {
    render(<BettingPanel {...defaultProps} isLocked={true} />);

    expect(screen.getByText("Locked")).toBeInTheDocument();
    const placeButton = screen.getByText(/Betting Closed/);
    expect(placeButton.closest("button")).toBeDisabled();
  });

  it("should disable betting when not betting phase", () => {
    render(<BettingPanel {...defaultProps} isBettingPhase={false} />);

    const placeButton = screen.getByText(/Betting Closed/);
    expect(placeButton.closest("button")).toBeDisabled();
  });

  it("should show no gold message when player has no gold", () => {
    const player = createMockPlayer({ gold: 0 });
    render(<BettingPanel {...defaultProps} player={player} />);

    expect(screen.getByText(/No gold to bet/)).toBeInTheDocument();
  });

  it("should show Open indicator when betting phase is active", () => {
    render(<BettingPanel {...defaultProps} isBettingPhase={true} />);

    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("should show bet totals in active bets section", () => {
    const bets: Bet[] = [
      { playerId: "p1", type: "FOR", amount: 5 },
      { playerId: "p2", type: "AGAINST", amount: 3 },
    ];
    const players = [
      ...defaultProps.players,
      createMockPlayer({ id: "p1", name: "Player One" }),
      createMockPlayer({ id: "p2", name: "Player Two" }),
    ];

    render(<BettingPanel {...defaultProps} bets={bets} players={players} />);

    // Should show bettor count
    expect(screen.getByText(/2 bettors/)).toBeInTheDocument();
  });

  it("should show no bets message when no bets placed", () => {
    render(<BettingPanel {...defaultProps} bets={[]} />);

    expect(screen.getByText(/No bets placed yet/)).toBeInTheDocument();
  });

  it("should increment amount with + button", () => {
    const onPlaceBet = jest.fn();
    render(<BettingPanel {...defaultProps} onPlaceBet={onPlaceBet} />);

    // Click + button twice
    const increaseButton = screen.getByLabelText("Increase amount");
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    fireEvent.click(screen.getByText(/Place Bet/));

    expect(onPlaceBet.mock.calls[0][0].amount).toBe(3);
  });

  it("should decrement amount with - button", () => {
    const onPlaceBet = jest.fn();
    render(<BettingPanel {...defaultProps} onPlaceBet={onPlaceBet} />);

    // Set to 3 first
    fireEvent.click(screen.getByText("3"));

    // Click - button
    const decreaseButton = screen.getByLabelText("Decrease amount");
    fireEvent.click(decreaseButton);

    fireEvent.click(screen.getByText(/Place Bet/));

    expect(onPlaceBet.mock.calls[0][0].amount).toBe(2);
  });

  it("should have Max button that sets to max bet", () => {
    const player = createMockPlayer({ gold: 10 });
    const onPlaceBet = jest.fn();
    render(<BettingPanel {...defaultProps} player={player} onPlaceBet={onPlaceBet} />);

    // Click Max button (capped at MAX_BET_AMOUNT which is 5)
    // The button text is "Max (5)"
    fireEvent.click(screen.getByRole("button", { name: /Max \(5\)/ }));
    fireEvent.click(screen.getByText(/Place Bet/));

    expect(onPlaceBet.mock.calls[0][0].amount).toBe(5);
  });
});

describe("CompactBettingDisplay", () => {
  const players = [
    createMockPlayer({ id: "p1", name: "Player One" }),
    createMockPlayer({ id: "p2", name: "Player Two" }),
  ];

  it("should render bets label", () => {
    render(<CompactBettingDisplay bets={[]} players={players} />);
    expect(screen.getByText("Bets")).toBeInTheDocument();
  });

  it("should show bet count", () => {
    const bets: Bet[] = [
      { playerId: "p1", type: "FOR", amount: 5 },
      { playerId: "p2", type: "AGAINST", amount: 3 },
    ];

    render(<CompactBettingDisplay bets={bets} players={players} />);

    expect(screen.getByText("2 placed")).toBeInTheDocument();
  });

  it("should show totals for each bet type", () => {
    const bets: Bet[] = [
      { playerId: "p1", type: "FOR", amount: 5 },
      { playerId: "p2", type: "AGAINST", amount: 3 },
    ];

    render(<CompactBettingDisplay bets={bets} players={players} />);

    expect(screen.getByText("5")).toBeInTheDocument(); // FOR total
    expect(screen.getByText("3")).toBeInTheDocument(); // AGAINST total
  });

  it("should show open indicator when isOpen is true", () => {
    render(<CompactBettingDisplay bets={[]} players={players} isOpen={true} />);

    // Should have a pulsing indicator
    const container = screen.getByText("Bets").closest("div");
    expect(container?.querySelector(".animate-pulse")).toBeInTheDocument();
  });
});
