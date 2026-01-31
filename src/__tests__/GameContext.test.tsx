import React from "react";
import { render, screen, act } from "@testing-library/react";
import { GameProvider, useGame } from "@/context/GameContext";
import { TurnPhase } from "@/types/game";
import {
  STARTING_GOLD,
  MARKETPLACE_SIZE,
  MONSTER_COUNT,
} from "@/lib/constants";

// Test component that uses the useGame hook
function TestComponent({
  onReady,
}: {
  onReady?: (game: ReturnType<typeof useGame>) => void;
}) {
  const game = useGame();

  React.useEffect(() => {
    if (onReady) {
      onReady(game);
    }
  }, [game, onReady]);

  return (
    <div>
      <div data-testid="initialized">
        {game.isInitialized ? "true" : "false"}
      </div>
      <div data-testid="player-count">{game.state?.players.length ?? 0}</div>
      <div data-testid="phase">{game.state?.turnState.phase ?? "none"}</div>
      <div data-testid="current-player-index">
        {game.state?.currentPlayerIndex ?? -1}
      </div>
      <div data-testid="monster-index">
        {game.state?.currentMonsterIndex ?? -1}
      </div>
      <div data-testid="game-over">
        {game.state?.isGameOver ? "true" : "false"}
      </div>
    </div>
  );
}

describe("GameContext", () => {
  describe("GameProvider", () => {
    it("should render children", () => {
      render(
        <GameProvider>
          <div data-testid="child">Hello</div>
        </GameProvider>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Hello");
    });

    it("should start with null state", () => {
      render(
        <GameProvider>
          <TestComponent />
        </GameProvider>
      );

      expect(screen.getByTestId("initialized")).toHaveTextContent("false");
    });
  });

  describe("useGame hook", () => {
    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useGame must be used within a GameProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("initializeGame", () => {
    it("should initialize game with players", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(screen.getByTestId("initialized")).toHaveTextContent("true");
      expect(screen.getByTestId("player-count")).toHaveTextContent("2");
    });

    it("should create players with starting gold", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const players = gameContext!.state!.players;
      players.forEach((player) => {
        expect(player.gold).toBe(STARTING_GOLD);
      });
    });

    it("should create monster gauntlet", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(gameContext!.state!.monsters).toHaveLength(MONSTER_COUNT);
    });

    it("should initialize marketplace", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(gameContext!.state!.marketplace.cards).toHaveLength(
        MARKETPLACE_SIZE
      );
    });
  });

  describe("setTurnPhase", () => {
    it("should update turn phase", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      act(() => {
        gameContext!.setTurnPhase(TurnPhase.BETTING);
      });

      expect(screen.getByTestId("phase")).toHaveTextContent(TurnPhase.BETTING);
    });
  });

  describe("nextPlayer", () => {
    it("should advance to next player", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob", "Charlie"]);
      });

      expect(screen.getByTestId("current-player-index")).toHaveTextContent("0");

      act(() => {
        gameContext!.nextPlayer();
      });

      expect(screen.getByTestId("current-player-index")).toHaveTextContent("1");
    });

    it("should wrap around to first player", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      act(() => {
        gameContext!.nextPlayer();
      });

      expect(screen.getByTestId("current-player-index")).toHaveTextContent("1");

      act(() => {
        gameContext!.nextPlayer();
      });

      expect(screen.getByTestId("current-player-index")).toHaveTextContent("0");
    });

    it("should reset turn state for new player", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      act(() => {
        gameContext!.setTurnPhase(TurnPhase.POINT_PHASE);
        gameContext!.setPoint(6);
      });

      act(() => {
        gameContext!.nextPlayer();
      });

      expect(gameContext!.state!.turnState.phase).toBe(
        TurnPhase.MARKETPLACE_REFRESH
      );
      expect(gameContext!.state!.turnState.point).toBeNull();
    });
  });

  describe("updatePlayer", () => {
    it("should update player gold", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const playerId = gameContext!.state!.players[0].id;

      act(() => {
        gameContext!.updatePlayer(playerId, { gold: 10 });
      });

      expect(gameContext!.state!.players[0].gold).toBe(10);
    });

    it("should update player victory points", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const playerId = gameContext!.state!.players[0].id;

      act(() => {
        gameContext!.updatePlayer(playerId, { victoryPoints: 5 });
      });

      expect(gameContext!.state!.players[0].victoryPoints).toBe(5);
    });

    it("should not affect other players", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const playerId = gameContext!.state!.players[0].id;

      act(() => {
        gameContext!.updatePlayer(playerId, { gold: 100 });
      });

      expect(gameContext!.state!.players[1].gold).toBe(STARTING_GOLD);
    });
  });

  describe("updateMonster", () => {
    it("should update current monster", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      act(() => {
        gameContext!.updateMonster({ remainingNumbers: [4, 5] });
      });

      expect(gameContext!.getCurrentMonster()!.remainingNumbers).toEqual([
        4, 5,
      ]);
    });
  });

  describe("hitMonsterNumber", () => {
    it("should remove number from monster", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const monster = gameContext!.getCurrentMonster()!;
      const targetNumber = monster.remainingNumbers[0];

      act(() => {
        gameContext!.hitMonsterNumber(targetNumber);
      });

      expect(
        gameContext!.getCurrentMonster()!.remainingNumbers
      ).not.toContain(targetNumber);
    });
  });

  describe("placeBet", () => {
    it("should add bet and deduct gold", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const playerId = gameContext!.state!.players[1].id;
      const initialGold = gameContext!.state!.players[1].gold;

      act(() => {
        gameContext!.placeBet({ playerId, type: "FOR", amount: 2 });
      });

      expect(gameContext!.state!.bets).toHaveLength(1);
      expect(gameContext!.state!.bets[0].type).toBe("FOR");
      expect(gameContext!.state!.bets[0].amount).toBe(2);
      expect(gameContext!.state!.players[1].gold).toBe(initialGold - 2);
    });

    it("should not allow bet if player cannot afford", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const playerId = gameContext!.state!.players[1].id;

      act(() => {
        gameContext!.placeBet({ playerId, type: "FOR", amount: 100 });
      });

      expect(gameContext!.state!.bets).toHaveLength(0);
    });
  });

  describe("clearBets", () => {
    it("should clear all bets", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const playerId = gameContext!.state!.players[1].id;

      act(() => {
        gameContext!.placeBet({ playerId, type: "FOR", amount: 1 });
      });

      expect(gameContext!.state!.bets).toHaveLength(1);

      act(() => {
        gameContext!.clearBets();
      });

      expect(gameContext!.state!.bets).toHaveLength(0);
    });
  });

  describe("storeMonsterStateBeforeTurn", () => {
    it("should store current monster state", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const originalNumbers = [
        ...gameContext!.getCurrentMonster()!.remainingNumbers,
      ];

      act(() => {
        gameContext!.storeMonsterStateBeforeTurn();
      });

      expect(
        gameContext!.state!.turnState.monsterStateBeforeTurn
      ).not.toBeNull();
      expect(
        gameContext!.state!.turnState.monsterStateBeforeTurn!.remainingNumbers
      ).toEqual(originalNumbers);
    });
  });

  describe("resetMonsterToTurnStart", () => {
    it("should restore monster state", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const originalNumbers = [
        ...gameContext!.getCurrentMonster()!.remainingNumbers,
      ];

      act(() => {
        gameContext!.storeMonsterStateBeforeTurn();
      });

      // Hit a number
      const targetNumber = originalNumbers[0];
      act(() => {
        gameContext!.hitMonsterNumber(targetNumber);
      });

      expect(gameContext!.getCurrentMonster()!.remainingNumbers).not.toContain(
        targetNumber
      );

      // Reset
      act(() => {
        gameContext!.resetMonsterToTurnStart();
      });

      expect(gameContext!.getCurrentMonster()!.remainingNumbers).toEqual(
        originalNumbers
      );
    });
  });

  describe("advanceToNextMonster", () => {
    it("should advance monster index", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(screen.getByTestId("monster-index")).toHaveTextContent("0");

      act(() => {
        gameContext!.advanceToNextMonster();
      });

      expect(screen.getByTestId("monster-index")).toHaveTextContent("1");
    });
  });

  describe("endGame", () => {
    it("should set game over with winner", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const winnerId = gameContext!.state!.players[0].id;

      act(() => {
        gameContext!.endGame(winnerId);
      });

      expect(screen.getByTestId("game-over")).toHaveTextContent("true");
      expect(gameContext!.state!.winnerId).toBe(winnerId);
    });
  });

  describe("resetGame", () => {
    it("should reset state to null", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(screen.getByTestId("initialized")).toHaveTextContent("true");

      act(() => {
        gameContext!.resetGame();
      });

      expect(screen.getByTestId("initialized")).toHaveTextContent("false");
    });
  });

  describe("getActivePlayer", () => {
    it("should return current active player", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const activePlayer = gameContext!.getActivePlayer();

      expect(activePlayer).not.toBeNull();
      expect(activePlayer!.name).toBe("Alice");
    });

    it("should return null when not initialized", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      const activePlayer = gameContext!.getActivePlayer();

      expect(activePlayer).toBeNull();
    });
  });

  describe("getCurrentMonster", () => {
    it("should return current monster", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const monster = gameContext!.getCurrentMonster();

      expect(monster).not.toBeNull();
      expect(monster!.position).toBe(1);
    });
  });

  describe("getPlayer", () => {
    it("should return player by id", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const playerId = gameContext!.state!.players[1].id;
      const player = gameContext!.getPlayer(playerId);

      expect(player).not.toBeUndefined();
      expect(player!.name).toBe("Bob");
    });

    it("should return undefined for invalid id", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      const player = gameContext!.getPlayer("invalid-id");

      expect(player).toBeUndefined();
    });
  });

  describe("turn damage tracking", () => {
    it("should add turn damage", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(gameContext!.state!.turnState.turnDamage).toBe(0);

      act(() => {
        gameContext!.addTurnDamage(1);
      });

      expect(gameContext!.state!.turnState.turnDamage).toBe(1);

      act(() => {
        gameContext!.addTurnDamage(2);
      });

      expect(gameContext!.state!.turnState.turnDamage).toBe(3);
    });
  });

  describe("roll count tracking", () => {
    it("should increment roll count", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(gameContext!.state!.turnState.rollCount).toBe(0);

      act(() => {
        gameContext!.incrementRollCount();
      });

      expect(gameContext!.state!.turnState.rollCount).toBe(1);
    });
  });

  describe("revive tracking", () => {
    it("should set revive used flag", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(gameContext!.state!.turnState.hasUsedRevive).toBe(false);

      act(() => {
        gameContext!.setHasUsedRevive(true);
      });

      expect(gameContext!.state!.turnState.hasUsedRevive).toBe(true);
    });
  });

  describe("setPoint", () => {
    it("should set the established point", async () => {
      let gameContext: ReturnType<typeof useGame>;

      render(
        <GameProvider>
          <TestComponent
            onReady={(game) => {
              gameContext = game;
            }}
          />
        </GameProvider>
      );

      act(() => {
        gameContext!.initializeGame(["Alice", "Bob"]);
      });

      expect(gameContext!.state!.turnState.point).toBeNull();

      act(() => {
        gameContext!.setPoint(8);
      });

      expect(gameContext!.state!.turnState.point).toBe(8);
    });
  });
});
