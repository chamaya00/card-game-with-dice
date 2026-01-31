import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Marketplace, CompactMarketplace } from "@/components/Marketplace";
import type {
  Player,
  Marketplace as MarketplaceType,
  PermanentCard,
  SingleUseCard,
  PointCard,
} from "@/types/game";
import { MARKETPLACE_SIZE, MARKETPLACE_REFRESH_COST } from "@/lib/constants";

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

function createMockPointCard(overrides: Partial<PointCard> = {}): PointCard {
  return {
    type: "point",
    id: "point-test-1",
    name: "+1 Point",
    cost: 2,
    points: 1,
    ...overrides,
  };
}

function createMockMarketplace(
  cards: (PermanentCard | SingleUseCard | PointCard)[] = []
): MarketplaceType {
  return { cards };
}

describe("Marketplace", () => {
  it("should render marketplace header", () => {
    const player = createMockPlayer();
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });

  it("should display card count", () => {
    const player = createMockPlayer();
    const marketplace = createMockMarketplace([
      createMockPermanentCard(),
      createMockSingleUseCard(),
    ]);

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    expect(screen.getByText(`(2/${MARKETPLACE_SIZE})`)).toBeInTheDocument();
  });

  it("should display player gold", () => {
    const player = createMockPlayer({ gold: 15 });
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("should render cards with their names", () => {
    const player = createMockPlayer({ gold: 10 });
    const card = createMockPermanentCard({ name: "Magic Dice" });
    const marketplace = createMockMarketplace([card]);

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    expect(screen.getByText("Magic Dice")).toBeInTheDocument();
  });

  it("should call onPurchaseCard when clicking a purchasable card", () => {
    const player = createMockPlayer({ gold: 10 });
    const card = createMockPermanentCard({ id: "test-card", cost: 5 });
    const marketplace = createMockMarketplace([card]);
    const onPurchase = jest.fn();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
        onPurchaseCard={onPurchase}
      />
    );

    fireEvent.click(screen.getByText("Purchase"));
    expect(onPurchase).toHaveBeenCalledWith("test-card");
  });

  it("should not allow purchase when player cannot afford", () => {
    const player = createMockPlayer({ gold: 2 });
    const card = createMockPermanentCard({ cost: 10 });
    const marketplace = createMockMarketplace([card]);
    const onPurchase = jest.fn();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
        onPurchaseCard={onPurchase}
      />
    );

    // Should not have purchase button or it should not be clickable
    const purchaseButtons = screen.queryAllByText("Purchase");
    expect(purchaseButtons.length).toBe(0);
  });

  it("should show refresh button during shopping phase", () => {
    const player = createMockPlayer({ gold: 10 });
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("should disable refresh button when player cannot afford", () => {
    const player = createMockPlayer({ gold: MARKETPLACE_REFRESH_COST - 1 });
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    const refreshButton = screen.getByText("Refresh").closest("button");
    expect(refreshButton).toBeDisabled();
  });

  it("should show confirmation when clicking refresh", () => {
    const player = createMockPlayer({ gold: 10 });
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    fireEvent.click(screen.getByText("Refresh"));
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should call onRefresh when confirmed", () => {
    const player = createMockPlayer({ gold: 10 });
    const marketplace = createMockMarketplace();
    const onRefresh = jest.fn();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByText("Refresh"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("should cancel refresh when cancel clicked", () => {
    const player = createMockPlayer({ gold: 10 });
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    fireEvent.click(screen.getByText("Refresh"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
  });

  it("should show marketplace closed message when not shopping phase", () => {
    const player = createMockPlayer();
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={false}
      />
    );

    expect(screen.getByText(/closed during this phase/)).toBeInTheDocument();
  });

  it("should display empty slots for missing cards", () => {
    const player = createMockPlayer();
    const marketplace = createMockMarketplace([createMockPermanentCard()]);

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    // Should show "Sold" for empty slots
    const soldSlots = screen.getAllByText("Sold");
    expect(soldSlots.length).toBe(MARKETPLACE_SIZE - 1);
  });

  it("should show card type badges", () => {
    const player = createMockPlayer({ gold: 20 });
    const marketplace = createMockMarketplace([
      createMockPermanentCard(),
      createMockSingleUseCard(),
      createMockPointCard(),
    ]);

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    expect(screen.getByText("PERM")).toBeInTheDocument();
    expect(screen.getByText("USE")).toBeInTheDocument();
    expect(screen.getByText("VP")).toBeInTheDocument();
  });

  it("should show hand capacity warnings", () => {
    const fullPermanentHand: PermanentCard[] = Array(6)
      .fill(null)
      .map((_, i) => createMockPermanentCard({ id: `perm-${i}` }));
    const player = createMockPlayer({
      gold: 20,
      permanentCards: fullPermanentHand,
    });
    const marketplace = createMockMarketplace();

    render(
      <Marketplace
        marketplace={marketplace}
        player={player}
        isShoppingPhase={true}
      />
    );

    // Should show 6/6 for permanent cards
    expect(screen.getByText("6/6")).toBeInTheDocument();
  });
});

describe("CompactMarketplace", () => {
  it("should render marketplace name", () => {
    const marketplace = createMockMarketplace([createMockPermanentCard()]);

    render(<CompactMarketplace marketplace={marketplace} />);

    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });

  it("should show card count", () => {
    const marketplace = createMockMarketplace([
      createMockPermanentCard(),
      createMockSingleUseCard(),
    ]);

    render(<CompactMarketplace marketplace={marketplace} />);

    expect(screen.getByText(`2/${MARKETPLACE_SIZE}`)).toBeInTheDocument();
  });

  it("should show card type counts", () => {
    const marketplace = createMockMarketplace([
      createMockPermanentCard({ id: "1" }),
      createMockPermanentCard({ id: "2" }),
      createMockSingleUseCard(),
    ]);

    render(<CompactMarketplace marketplace={marketplace} />);

    // Should show type indicators with counts
    expect(screen.getByText("2")).toBeInTheDocument(); // 2 permanent
    expect(screen.getByText("1")).toBeInTheDocument(); // 1 single-use
  });

  it("should call onExpand when clicked", () => {
    const marketplace = createMockMarketplace();
    const onExpand = jest.fn();

    render(<CompactMarketplace marketplace={marketplace} onExpand={onExpand} />);

    fireEvent.click(screen.getByText("Marketplace"));
    expect(onExpand).toHaveBeenCalled();
  });
});
