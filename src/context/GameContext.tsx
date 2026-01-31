"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  GameState,
  Player,
  Monster,
  Bet,
  Card,
  TurnState,
} from "@/types/game";
import { TurnPhase } from "@/types/game";
import {
  initializeGame as initGame,
  getNextPlayerIndex,
  resetTurnState,
  findPlayerById,
} from "@/lib/gameInit";
import { createShuffledDeck, drawCards } from "@/lib/cardDeck";
import { MARKETPLACE_SIZE } from "@/lib/constants";

// ============================================
// Context Types
// ============================================

interface GameContextValue {
  // State
  state: GameState | null;
  isInitialized: boolean;

  // Core Actions
  initializeGame: (playerNames: string[]) => void;
  setTurnPhase: (phase: TurnPhase) => void;
  nextPlayer: () => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  updateMonster: (updates: Partial<Monster>) => void;

  // Marketplace Actions
  refreshMarketplace: () => void;
  purchaseCard: (playerId: string, cardId: string) => void;

  // Betting Actions
  placeBet: (bet: Bet) => void;
  clearBets: () => void;

  // Turn Actions
  setPoint: (point: number) => void;
  addTurnDamage: (amount: number) => void;
  storeMonsterStateBeforeTurn: () => void;
  setHasUsedRevive: (value: boolean) => void;
  incrementRollCount: () => void;

  // Monster Actions
  hitMonsterNumber: (number: number) => void;
  defeatMonster: () => void;
  resetMonsterToTurnStart: () => void;
  advanceToNextMonster: () => void;

  // Game Flow Actions
  endGame: (winnerId: string) => void;
  resetGame: () => void;

  // Utility
  getActivePlayer: () => Player | null;
  getCurrentMonster: () => Monster | null;
  getPlayer: (playerId: string) => Player | undefined;
}

// ============================================
// Action Types
// ============================================

type GameAction =
  | { type: "INITIALIZE_GAME"; playerNames: string[] }
  | { type: "SET_TURN_PHASE"; phase: TurnPhase }
  | { type: "NEXT_PLAYER" }
  | { type: "UPDATE_PLAYER"; playerId: string; updates: Partial<Player> }
  | { type: "UPDATE_MONSTER"; updates: Partial<Monster> }
  | { type: "REFRESH_MARKETPLACE" }
  | { type: "PURCHASE_CARD"; playerId: string; cardId: string }
  | { type: "PLACE_BET"; bet: Bet }
  | { type: "CLEAR_BETS" }
  | { type: "SET_POINT"; point: number }
  | { type: "ADD_TURN_DAMAGE"; amount: number }
  | { type: "STORE_MONSTER_STATE_BEFORE_TURN" }
  | { type: "SET_HAS_USED_REVIVE"; value: boolean }
  | { type: "INCREMENT_ROLL_COUNT" }
  | { type: "HIT_MONSTER_NUMBER"; number: number }
  | { type: "DEFEAT_MONSTER" }
  | { type: "RESET_MONSTER_TO_TURN_START" }
  | { type: "ADVANCE_TO_NEXT_MONSTER" }
  | { type: "END_GAME"; winnerId: string }
  | { type: "RESET_GAME" };

// ============================================
// Reducer
// ============================================

function gameReducer(
  state: GameState | null,
  action: GameAction
): GameState | null {
  switch (action.type) {
    case "INITIALIZE_GAME": {
      return initGame(action.playerNames);
    }

    case "SET_TURN_PHASE": {
      if (!state) return null;
      return {
        ...state,
        turnState: {
          ...state.turnState,
          phase: action.phase,
        },
      };
    }

    case "NEXT_PLAYER": {
      if (!state) return null;
      const nextIndex = getNextPlayerIndex(
        state.currentPlayerIndex,
        state.players.length
      );
      const nextPlayer = state.players[nextIndex];

      // Preserve hasUsedRevive if on same monster
      const newTurnState = resetTurnState(nextPlayer.id, false);

      return {
        ...state,
        currentPlayerIndex: nextIndex,
        turnState: newTurnState,
        bets: [], // Clear bets for new turn
      };
    }

    case "UPDATE_PLAYER": {
      if (!state) return null;
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.playerId
            ? { ...player, ...action.updates }
            : player
        ),
      };
    }

    case "UPDATE_MONSTER": {
      if (!state) return null;
      const currentMonster = state.monsters[state.currentMonsterIndex];
      return {
        ...state,
        monsters: state.monsters.map((monster) =>
          monster.id === currentMonster.id
            ? { ...monster, ...action.updates }
            : monster
        ),
      };
    }

    case "REFRESH_MARKETPLACE": {
      if (!state) return null;
      // Return current marketplace cards to deck, shuffle, and draw new ones
      const allCards = [...state.cardDeck, ...state.marketplace.cards];
      const shuffledDeck = shuffleCards(allCards);
      const { drawn, remaining } = drawCards(shuffledDeck, MARKETPLACE_SIZE);

      return {
        ...state,
        marketplace: { cards: drawn },
        cardDeck: remaining,
      };
    }

    case "PURCHASE_CARD": {
      if (!state) return null;
      const card = state.marketplace.cards.find((c) => c.id === action.cardId);
      if (!card) return state;

      const player = findPlayerById(state.players, action.playerId);
      if (!player) return state;

      // Check if player can afford the card
      if (player.gold < card.cost) return state;

      // Remove card from marketplace
      const newMarketplaceCards = state.marketplace.cards.filter(
        (c) => c.id !== action.cardId
      );

      // Add card to player's hand based on type
      let updatedPlayer: Player = {
        ...player,
        gold: player.gold - card.cost,
      };

      if (card.type === "permanent") {
        updatedPlayer = {
          ...updatedPlayer,
          permanentCards: [...updatedPlayer.permanentCards, card],
        };
      } else if (card.type === "single_use") {
        updatedPlayer = {
          ...updatedPlayer,
          singleUseCards: [...updatedPlayer.singleUseCards, card],
        };
      } else if (card.type === "point") {
        // Point cards add victory points immediately
        updatedPlayer = {
          ...updatedPlayer,
          victoryPoints: updatedPlayer.victoryPoints + card.points,
        };
      }

      return {
        ...state,
        marketplace: { cards: newMarketplaceCards },
        players: state.players.map((p) =>
          p.id === action.playerId ? updatedPlayer : p
        ),
      };
    }

    case "PLACE_BET": {
      if (!state) return null;
      // Validate bet
      const bettor = findPlayerById(state.players, action.bet.playerId);
      if (!bettor || bettor.gold < action.bet.amount) return state;

      // Remove gold from bettor
      const updatedPlayers = state.players.map((p) =>
        p.id === action.bet.playerId
          ? { ...p, gold: p.gold - action.bet.amount }
          : p
      );

      return {
        ...state,
        players: updatedPlayers,
        bets: [...state.bets, action.bet],
      };
    }

    case "CLEAR_BETS": {
      if (!state) return null;
      return {
        ...state,
        bets: [],
      };
    }

    case "SET_POINT": {
      if (!state) return null;
      return {
        ...state,
        turnState: {
          ...state.turnState,
          point: action.point,
        },
      };
    }

    case "ADD_TURN_DAMAGE": {
      if (!state) return null;
      return {
        ...state,
        turnState: {
          ...state.turnState,
          turnDamage: state.turnState.turnDamage + action.amount,
        },
      };
    }

    case "STORE_MONSTER_STATE_BEFORE_TURN": {
      if (!state) return null;
      const currentMonster = state.monsters[state.currentMonsterIndex];
      return {
        ...state,
        turnState: {
          ...state.turnState,
          monsterStateBeforeTurn: { ...currentMonster },
        },
      };
    }

    case "SET_HAS_USED_REVIVE": {
      if (!state) return null;
      return {
        ...state,
        turnState: {
          ...state.turnState,
          hasUsedRevive: action.value,
        },
      };
    }

    case "INCREMENT_ROLL_COUNT": {
      if (!state) return null;
      return {
        ...state,
        turnState: {
          ...state.turnState,
          rollCount: state.turnState.rollCount + 1,
        },
      };
    }

    case "HIT_MONSTER_NUMBER": {
      if (!state) return null;
      const currentMonster = state.monsters[state.currentMonsterIndex];
      const newRemainingNumbers = currentMonster.remainingNumbers.filter(
        (n) => n !== action.number
      );

      return {
        ...state,
        monsters: state.monsters.map((monster) =>
          monster.id === currentMonster.id
            ? { ...monster, remainingNumbers: newRemainingNumbers }
            : monster
        ),
      };
    }

    case "DEFEAT_MONSTER": {
      if (!state) return null;
      // Mark all remaining numbers as hit
      const currentMonster = state.monsters[state.currentMonsterIndex];

      return {
        ...state,
        monsters: state.monsters.map((monster) =>
          monster.id === currentMonster.id
            ? { ...monster, remainingNumbers: [] }
            : monster
        ),
      };
    }

    case "RESET_MONSTER_TO_TURN_START": {
      if (!state) return null;
      const savedState = state.turnState.monsterStateBeforeTurn;
      if (!savedState) return state;

      return {
        ...state,
        monsters: state.monsters.map((monster) =>
          monster.id === savedState.id ? { ...savedState } : monster
        ),
      };
    }

    case "ADVANCE_TO_NEXT_MONSTER": {
      if (!state) return null;
      const nextIndex = state.currentMonsterIndex + 1;
      if (nextIndex >= state.monsters.length) {
        // All monsters defeated - this shouldn't happen in normal flow
        return state;
      }

      return {
        ...state,
        currentMonsterIndex: nextIndex,
      };
    }

    case "END_GAME": {
      if (!state) return null;
      return {
        ...state,
        isGameOver: true,
        winnerId: action.winnerId,
      };
    }

    case "RESET_GAME": {
      return null;
    }

    default:
      return state;
  }
}

// Helper function to shuffle cards
function shuffleCards(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// Context Creation
// ============================================

const GameContext = createContext<GameContextValue | null>(null);

// ============================================
// Provider Component
// ============================================

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, null);

  // Core Actions
  const initializeGame = useCallback((playerNames: string[]) => {
    dispatch({ type: "INITIALIZE_GAME", playerNames });
  }, []);

  const setTurnPhase = useCallback((phase: TurnPhase) => {
    dispatch({ type: "SET_TURN_PHASE", phase });
  }, []);

  const nextPlayer = useCallback(() => {
    dispatch({ type: "NEXT_PLAYER" });
  }, []);

  const updatePlayer = useCallback(
    (playerId: string, updates: Partial<Player>) => {
      dispatch({ type: "UPDATE_PLAYER", playerId, updates });
    },
    []
  );

  const updateMonster = useCallback((updates: Partial<Monster>) => {
    dispatch({ type: "UPDATE_MONSTER", updates });
  }, []);

  // Marketplace Actions
  const refreshMarketplace = useCallback(() => {
    dispatch({ type: "REFRESH_MARKETPLACE" });
  }, []);

  const purchaseCard = useCallback((playerId: string, cardId: string) => {
    dispatch({ type: "PURCHASE_CARD", playerId, cardId });
  }, []);

  // Betting Actions
  const placeBet = useCallback((bet: Bet) => {
    dispatch({ type: "PLACE_BET", bet });
  }, []);

  const clearBets = useCallback(() => {
    dispatch({ type: "CLEAR_BETS" });
  }, []);

  // Turn Actions
  const setPoint = useCallback((point: number) => {
    dispatch({ type: "SET_POINT", point });
  }, []);

  const addTurnDamage = useCallback((amount: number) => {
    dispatch({ type: "ADD_TURN_DAMAGE", amount });
  }, []);

  const storeMonsterStateBeforeTurn = useCallback(() => {
    dispatch({ type: "STORE_MONSTER_STATE_BEFORE_TURN" });
  }, []);

  const setHasUsedRevive = useCallback((value: boolean) => {
    dispatch({ type: "SET_HAS_USED_REVIVE", value });
  }, []);

  const incrementRollCount = useCallback(() => {
    dispatch({ type: "INCREMENT_ROLL_COUNT" });
  }, []);

  // Monster Actions
  const hitMonsterNumber = useCallback((number: number) => {
    dispatch({ type: "HIT_MONSTER_NUMBER", number });
  }, []);

  const defeatMonster = useCallback(() => {
    dispatch({ type: "DEFEAT_MONSTER" });
  }, []);

  const resetMonsterToTurnStart = useCallback(() => {
    dispatch({ type: "RESET_MONSTER_TO_TURN_START" });
  }, []);

  const advanceToNextMonster = useCallback(() => {
    dispatch({ type: "ADVANCE_TO_NEXT_MONSTER" });
  }, []);

  // Game Flow Actions
  const endGame = useCallback((winnerId: string) => {
    dispatch({ type: "END_GAME", winnerId });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: "RESET_GAME" });
  }, []);

  // Utility Functions
  const getActivePlayer = useCallback((): Player | null => {
    if (!state) return null;
    return state.players[state.currentPlayerIndex] || null;
  }, [state]);

  const getCurrentMonster = useCallback((): Monster | null => {
    if (!state) return null;
    return state.monsters[state.currentMonsterIndex] || null;
  }, [state]);

  const getPlayer = useCallback(
    (playerId: string): Player | undefined => {
      if (!state) return undefined;
      return findPlayerById(state.players, playerId);
    },
    [state]
  );

  // Memoized context value
  const contextValue = useMemo<GameContextValue>(
    () => ({
      state,
      isInitialized: state !== null,

      // Core Actions
      initializeGame,
      setTurnPhase,
      nextPlayer,
      updatePlayer,
      updateMonster,

      // Marketplace Actions
      refreshMarketplace,
      purchaseCard,

      // Betting Actions
      placeBet,
      clearBets,

      // Turn Actions
      setPoint,
      addTurnDamage,
      storeMonsterStateBeforeTurn,
      setHasUsedRevive,
      incrementRollCount,

      // Monster Actions
      hitMonsterNumber,
      defeatMonster,
      resetMonsterToTurnStart,
      advanceToNextMonster,

      // Game Flow Actions
      endGame,
      resetGame,

      // Utility
      getActivePlayer,
      getCurrentMonster,
      getPlayer,
    }),
    [
      state,
      initializeGame,
      setTurnPhase,
      nextPlayer,
      updatePlayer,
      updateMonster,
      refreshMarketplace,
      purchaseCard,
      placeBet,
      clearBets,
      setPoint,
      addTurnDamage,
      storeMonsterStateBeforeTurn,
      setHasUsedRevive,
      incrementRollCount,
      hitMonsterNumber,
      defeatMonster,
      resetMonsterToTurnStart,
      advanceToNextMonster,
      endGame,
      resetGame,
      getActivePlayer,
      getCurrentMonster,
      getPlayer,
    ]
  );

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

/**
 * Hook to access the game context
 * @returns GameContextValue
 * @throws Error if used outside of GameProvider
 */
export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

// ============================================
// Exports
// ============================================

export { GameContext };
export type { GameContextValue, GameAction };
