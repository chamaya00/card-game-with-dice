"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { TurnPhase } from "@/types/game";
import type { Bet, Card, ComeOutResult, Player } from "@/types/game";

// Components
import { GameBoard } from "./GameBoard";
import { PlayerSetup } from "./PlayerSetup";
import { ComeOutRoll } from "./ComeOutRoll";
import { PointPhase } from "./PointPhase";
import { Marketplace } from "./Marketplace";
import { BettingPanel } from "./BettingPanel";
import { GameOver } from "./GameOver";
import { DamageTracker, calculateDamageLeader } from "./DamageTracker";

// Turn log utilities
import {
  useTurnLog,
  LogEntries,
  type LogEntry,
} from "./TurnLog";

// Victory utilities
import { getEffectiveVictoryPoints } from "@/lib/victory";
import { VICTORY_POINTS_TO_WIN } from "@/lib/constants";

// ============================================
// Game Component
// ============================================

export interface GameProps {
  /** Initial player names (if provided, skip setup) */
  initialPlayerNames?: string[];
  /** Custom className */
  className?: string;
}

export function Game({ initialPlayerNames, className = "" }: GameProps) {
  const {
    state,
    isInitialized,
    initializeGame,
    resetGame,
    setTurnPhase,
    nextPlayer,
    storeMonsterStateBeforeTurn,
    advanceToNextMonster,
    setPoint,
    placeBet,
    purchaseCard,
    refreshMarketplace,
    drawRandomCard,
    handleComeOutNatural,
    handleComeOutCraps,
    handlePointPhaseHit,
    handlePointHit,
    handleNumberSelected,
    handleMonsterDefeated,
    handleEscape,
    handlePointPhaseCrapOut,
    handleRevive,
    endGame,
  } = useGame();

  // Turn log state
  const { entries: logEntries, addEntry, clearLog } = useTurnLog();

  // Local UI state
  const [betsLocked, setBetsLocked] = useState(false);
  const [showSetup, setShowSetup] = useState(!initialPlayerNames);
  const [winner, setWinner] = useState<Player | Player[] | null>(null);

  // Initialize game if initial player names provided
  useEffect(() => {
    if (initialPlayerNames && !isInitialized) {
      handleStartGame(initialPlayerNames);
    }
  }, [initialPlayerNames, isInitialized]);

  // ============================================
  // Game Start Handler
  // ============================================

  const handleStartGame = useCallback((playerNames: string[]) => {
    initializeGame(playerNames);
    clearLog();
    addEntry(LogEntries.gameStart(playerNames.length));
    setShowSetup(false);

    // Log turn start for first player
    setTimeout(() => {
      if (playerNames.length > 0) {
        addEntry(LogEntries.turnStart(playerNames[0]));
      }
    }, 100);
  }, [initializeGame, clearLog, addEntry]);

  // ============================================
  // Phase Transition Handlers
  // ============================================

  const handlePhaseChange = useCallback((newPhase: TurnPhase) => {
    setTurnPhase(newPhase);
    addEntry(LogEntries.phaseChange(getPhaseName(newPhase)));
  }, [setTurnPhase, addEntry]);

  const handleStartTurn = useCallback(() => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];

    // Store monster state for potential crap-out reset
    storeMonsterStateBeforeTurn();

    // Log turn start
    addEntry(LogEntries.turnStart(activePlayer.name));

    // Start with marketplace refresh phase
    handlePhaseChange(TurnPhase.MARKETPLACE_REFRESH);
  }, [state, storeMonsterStateBeforeTurn, addEntry, handlePhaseChange]);

  const handleEndTurn = useCallback((reason: "defeated" | "escaped" | "crapped_out") => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];

    // Log turn end
    addEntry(LogEntries.turnEnd(activePlayer.name));

    // Check for victory
    const potentialWinner = checkForWinner();
    if (potentialWinner) {
      const winnerPlayer = Array.isArray(potentialWinner) ? potentialWinner[0] : potentialWinner;
      setWinner(potentialWinner);
      endGame(winnerPlayer.id);
      addEntry(LogEntries.gameEnd(winnerPlayer.name));
      return;
    }

    // If monster was defeated, advance to next monster
    if (reason === "defeated") {
      advanceToNextMonster();
    }

    // Move to next player
    nextPlayer();

    // Reset bets lock
    setBetsLocked(false);

    // Start new turn after a short delay
    setTimeout(() => {
      handleStartTurn();
    }, 500);
  }, [state, addEntry, endGame, advanceToNextMonster, nextPlayer, handleStartTurn]);

  // ============================================
  // Victory Check
  // ============================================

  const checkForWinner = useCallback(() => {
    if (!state) return null;

    // Update damage leader first
    const newDamageLeaderId = calculateDamageLeader(state.players);

    const potentialWinners = state.players.filter((p) => {
      const isDamageLeader = p.id === newDamageLeaderId;
      const effectiveVP = getEffectiveVictoryPoints(p, isDamageLeader);
      return effectiveVP >= VICTORY_POINTS_TO_WIN;
    });

    if (potentialWinners.length === 0) return null;
    if (potentialWinners.length === 1) return potentialWinners[0];

    // Return all tied winners
    return potentialWinners;
  }, [state]);

  // ============================================
  // Marketplace Handlers
  // ============================================

  const handlePurchaseCard = useCallback((cardId: string) => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];
    const card = state.marketplace.cards.find((c) => c.id === cardId);

    if (card) {
      purchaseCard(activePlayer.id, cardId);
      addEntry(LogEntries.cardPurchased(activePlayer.name, card.name, card.cost));
    }
  }, [state, purchaseCard, addEntry]);

  const handleRefreshMarketplace = useCallback(() => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];
    refreshMarketplace();
    addEntry(LogEntries.marketplaceRefreshed(activePlayer.name));
  }, [state, refreshMarketplace, addEntry]);

  const handleSkipMarketplace = useCallback(() => {
    handlePhaseChange(TurnPhase.BETTING);
  }, [handlePhaseChange]);

  const handleFinishShopping = useCallback(() => {
    handlePhaseChange(TurnPhase.BETTING);
  }, [handlePhaseChange]);

  // ============================================
  // Betting Handlers
  // ============================================

  const handlePlaceBet = useCallback((bet: Bet) => {
    if (!state) return;

    const bettor = state.players.find((p) => p.id === bet.playerId);
    if (bettor) {
      placeBet(bet);
      addEntry(LogEntries.betPlaced(bettor.name, bet.type, bet.amount));
    }
  }, [state, placeBet, addEntry]);

  const handleFinishBetting = useCallback(() => {
    setBetsLocked(true);
    handlePhaseChange(TurnPhase.COME_OUT_ROLL);
  }, [handlePhaseChange]);

  // ============================================
  // Come-Out Roll Handlers
  // ============================================

  const handleComeOutNaturalResult = useCallback(() => {
    if (!state) return { betResults: [], cardDrawn: null };

    const activePlayer = state.players[state.currentPlayerIndex];
    const currentMonster = state.monsters[state.currentMonsterIndex];

    // Process natural
    const betResults = handleComeOutNatural();

    // Draw card
    const cardDrawn = drawRandomCard(activePlayer.id);

    // Log
    addEntry(LogEntries.natural(activePlayer.name, 7));
    addEntry(LogEntries.monsterDefeated(
      activePlayer.name,
      currentMonster.name,
      currentMonster.points,
      currentMonster.goldReward
    ));

    if (cardDrawn) {
      addEntry(LogEntries.cardDrawn(activePlayer.name, cardDrawn.name));
    }

    return { betResults, cardDrawn };
  }, [state, handleComeOutNatural, drawRandomCard, addEntry]);

  const handleComeOutCrapsResult = useCallback(() => {
    if (!state) return { betResults: [], goldLost: 0 };

    const activePlayer = state.players[state.currentPlayerIndex];
    const goldBefore = activePlayer.gold;

    // Process craps
    const betResults = handleComeOutCraps();

    // Calculate gold lost (50%)
    const goldLost = Math.floor(goldBefore / 2);

    // Log
    addEntry(LogEntries.craps(activePlayer.name, 2, goldLost));

    return { betResults, goldLost };
  }, [state, handleComeOutCraps, addEntry]);

  const handlePointEstablished = useCallback((point: number) => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];

    setPoint(point);
    addEntry(LogEntries.pointEstablished(activePlayer.name, point));
    handlePhaseChange(TurnPhase.POINT_PHASE);
  }, [state, setPoint, addEntry, handlePhaseChange]);

  const handleComeOutRollComplete = useCallback((result: ComeOutResult, diceValues: number[]) => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];
    const sum = diceValues.reduce((a, b) => a + b, 0);

    addEntry(LogEntries.roll(activePlayer.name, diceValues, sum));
  }, [state, addEntry]);

  // ============================================
  // Point Phase Handlers
  // ============================================

  const handlePointPhaseMonsterHit = useCallback((hitNumber: number) => {
    if (!state) return [];

    const activePlayer = state.players[state.currentPlayerIndex];

    const betResults = handlePointPhaseHit(hitNumber);

    addEntry(LogEntries.monsterHit(activePlayer.name, hitNumber));

    return betResults;
  }, [state, handlePointPhaseHit, addEntry]);

  const handlePointPhasePointHit = useCallback(() => {
    return handlePointHit();
  }, [handlePointHit]);

  const handlePointPhaseNumberSelected = useCallback((number: number) => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];
    const point = state.turnState.point || 0;

    handleNumberSelected(number);

    addEntry(LogEntries.pointHit(activePlayer.name, point, number));
  }, [state, handleNumberSelected, addEntry]);

  const handlePointPhaseMonsterDefeated = useCallback(() => {
    if (!state) return { betResults: [], cardDrawn: null, shooterWinnings: 0 };

    const activePlayer = state.players[state.currentPlayerIndex];
    const currentMonster = state.monsters[state.currentMonsterIndex];

    const result = handleMonsterDefeated();

    addEntry(LogEntries.monsterDefeated(
      activePlayer.name,
      currentMonster.name,
      currentMonster.points,
      currentMonster.goldReward
    ));

    if (result.cardDrawn) {
      addEntry(LogEntries.cardDrawn(activePlayer.name, result.cardDrawn.name));
    }

    return result;
  }, [state, handleMonsterDefeated, addEntry]);

  const handlePointPhaseEscape = useCallback(() => {
    if (!state) return { betResults: [] };

    const activePlayer = state.players[state.currentPlayerIndex];

    const result = handleEscape();

    addEntry(LogEntries.escape(activePlayer.name));

    return result;
  }, [state, handleEscape, addEntry]);

  const handlePointPhaseCrapOutResult = useCallback(() => {
    if (!state) return { betResults: [], goldLost: 0 };

    const activePlayer = state.players[state.currentPlayerIndex];

    const result = handlePointPhaseCrapOut();

    addEntry(LogEntries.crapOut(activePlayer.name, result.goldLost));

    return result;
  }, [state, handlePointPhaseCrapOut, addEntry]);

  const handlePointPhaseRevive = useCallback(() => {
    if (!state) return;

    const activePlayer = state.players[state.currentPlayerIndex];
    const cardsDiscarded = activePlayer.permanentCards.length + activePlayer.singleUseCards.length;

    handleRevive();

    addEntry(LogEntries.revive(activePlayer.name, cardsDiscarded));
  }, [state, handleRevive, addEntry]);

  const handlePointPhaseTurnEnd = useCallback((result: "defeated" | "escaped" | "crapped_out") => {
    handleEndTurn(result);
  }, [handleEndTurn]);

  // ============================================
  // Play Again Handler
  // ============================================

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setWinner(null);
    setShowSetup(true);
    clearLog();
  }, [resetGame, clearLog]);

  // ============================================
  // Render Phase Components
  // ============================================

  const renderPhaseComponent = () => {
    if (!state) return null;

    const activePlayer = state.players[state.currentPlayerIndex];
    const currentMonster = state.monsters[state.currentMonsterIndex];

    switch (state.turnState.phase) {
      case TurnPhase.MARKETPLACE_REFRESH:
      case TurnPhase.MARKET_PURCHASE:
        return (
          <div className="p-4 space-y-4">
            <Marketplace
              marketplace={state.marketplace}
              player={activePlayer}
              isShoppingPhase={true}
              onPurchaseCard={handlePurchaseCard}
              onRefresh={handleRefreshMarketplace}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleSkipMarketplace}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleFinishShopping}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Continue to Betting
              </button>
            </div>
          </div>
        );

      case TurnPhase.BETTING:
        return (
          <div className="p-4 space-y-4">
            <BettingPanel
              player={activePlayer}
              activePlayerId={activePlayer.id}
              bets={state.bets}
              players={state.players}
              isBettingPhase={true}
              onPlaceBet={handlePlaceBet}
              isLocked={betsLocked}
            />
            <div className="flex justify-end">
              <button
                onClick={handleFinishBetting}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg transition-colors"
              >
                Start Rolling!
              </button>
            </div>
          </div>
        );

      case TurnPhase.COME_OUT_ROLL:
        return (
          <ComeOutRoll
            player={activePlayer}
            monster={currentMonster}
            bets={state.bets}
            players={state.players}
            onNatural={handleComeOutNaturalResult}
            onCraps={handleComeOutCrapsResult}
            onPointEstablished={handlePointEstablished}
            onRollComplete={handleComeOutRollComplete}
          />
        );

      case TurnPhase.POINT_PHASE:
        return (
          <PointPhase
            player={activePlayer}
            monster={currentMonster}
            point={state.turnState.point || 0}
            bets={state.bets}
            players={state.players}
            turnDamage={state.turnState.turnDamage}
            hasUsedRevive={state.turnState.hasUsedRevive}
            onMonsterHit={handlePointPhaseMonsterHit}
            onPointHit={handlePointPhasePointHit}
            onNumberSelected={handlePointPhaseNumberSelected}
            onMonsterDefeated={handlePointPhaseMonsterDefeated}
            onEscape={handlePointPhaseEscape}
            onCrapOut={handlePointPhaseCrapOutResult}
            onRevive={handlePointPhaseRevive}
            onTurnEnd={handlePointPhaseTurnEnd}
          />
        );

      case TurnPhase.RESOLUTION:
        return (
          <div className="p-8 text-center">
            <span className="text-4xl block mb-4">⏳</span>
            <p className="text-gray-600">Resolving turn...</p>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <span className="text-4xl block mb-4">🎲</span>
            <p className="text-gray-600">Preparing next phase...</p>
          </div>
        );
    }
  };

  // ============================================
  // Render
  // ============================================

  // Show setup if not initialized
  if (showSetup || !isInitialized || !state) {
    return (
      <div className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${className}`}>
        <PlayerSetup onStartGame={handleStartGame} />
      </div>
    );
  }

  // Show game over if there's a winner
  if (state.isGameOver && winner) {
    return (
      <div className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${className}`}>
        <GameOver
          winner={winner}
          players={state.players}
          damageLeaderId={state.damageLeaderId}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    );
  }

  // Render game board
  return (
    <GameBoard
      gameState={state}
      logEntries={logEntries}
      phaseComponent={renderPhaseComponent()}
      onPurchaseCard={handlePurchaseCard}
      onRefreshMarketplace={handleRefreshMarketplace}
      onPlaceBet={handlePlaceBet}
      betsLocked={betsLocked}
      className={className}
    />
  );
}

// ============================================
// Helper Functions
// ============================================

function getPhaseName(phase: TurnPhase): string {
  switch (phase) {
    case TurnPhase.MARKETPLACE_REFRESH:
      return "Marketplace Refresh";
    case TurnPhase.MARKET_PURCHASE:
      return "Market Purchase";
    case TurnPhase.CARD_REVEAL:
      return "Card Reveal";
    case TurnPhase.BETTING:
      return "Betting Phase";
    case TurnPhase.COME_OUT_ROLL:
      return "Come-Out Roll";
    case TurnPhase.POINT_PHASE:
      return "Point Phase";
    case TurnPhase.RESOLUTION:
      return "Resolution";
    default:
      return "Unknown Phase";
  }
}

// ============================================
// Exports
// ============================================

export default Game;
