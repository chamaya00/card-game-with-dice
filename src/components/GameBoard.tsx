"use client";

import React from "react";
import type { GameState, Player, Monster as MonsterType, Bet } from "@/types/game";
import { TurnPhase } from "@/types/game";
import { Monster } from "./Monster";
import { MonsterGauntlet } from "./MonsterGauntlet";
import { PlayerDashboard, PlayerList, MiniPlayerBadge } from "./PlayerDashboard";
import { Marketplace, CompactMarketplace } from "./Marketplace";
import { BettingPanel, CompactBettingDisplay } from "./BettingPanel";
import { TurnLog, type LogEntry } from "./TurnLog";
import { DamageTracker } from "./DamageTracker";

// ============================================
// Types
// ============================================

export interface GameBoardProps {
  /** Current game state */
  gameState: GameState;
  /** Log entries for the turn log */
  logEntries: LogEntry[];
  /** The currently viewing player (for their perspective) */
  viewingPlayerId?: string;
  /** Current phase component to render in the main area */
  phaseComponent?: React.ReactNode;
  /** Callback when a card is purchased from marketplace */
  onPurchaseCard?: (cardId: string) => void;
  /** Callback when marketplace is refreshed */
  onRefreshMarketplace?: () => void;
  /** Callback when a bet is placed */
  onPlaceBet?: (bet: Bet) => void;
  /** Callback when a single-use card is used */
  onUseSingleUseCard?: (playerId: string, cardId: string) => void;
  /** Whether bets are locked */
  betsLocked?: boolean;
  /** Custom className */
  className?: string;
}

// ============================================
// Phase Title Helper
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

function getPhaseDescription(phase: TurnPhase): string {
  switch (phase) {
    case TurnPhase.MARKETPLACE_REFRESH:
      return "Optionally refresh the marketplace for 3 gold";
    case TurnPhase.MARKET_PURCHASE:
      return "Purchase cards from the marketplace";
    case TurnPhase.CARD_REVEAL:
      return "View your newly acquired cards";
    case TurnPhase.BETTING:
      return "Other players place their bets";
    case TurnPhase.COME_OUT_ROLL:
      return "Roll to defeat the monster or establish your point";
    case TurnPhase.POINT_PHASE:
      return "Roll to hit the monster or your point";
    case TurnPhase.RESOLUTION:
      return "Resolving turn results";
    default:
      return "";
  }
}

// ============================================
// Phase Indicator Component
// ============================================

interface PhaseIndicatorProps {
  phase: TurnPhase;
  playerName: string;
}

function PhaseIndicator({ phase, playerName }: PhaseIndicatorProps) {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">Current Phase</p>
          <h2 className="text-xl font-bold">{getPhaseName(phase)}</h2>
          <p className="text-sm opacity-80 mt-1">{getPhaseDescription(phase)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Shooter</p>
          <p className="text-lg font-bold">{playerName}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Turn Order Component
// ============================================

interface TurnOrderProps {
  players: Player[];
  currentPlayerIndex: number;
  damageLeaderId: string | null;
}

function TurnOrder({ players, currentPlayerIndex, damageLeaderId }: TurnOrderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span>🔄</span>
        Turn Order
      </h3>
      <div className="flex flex-wrap gap-2">
        {players.map((player, index) => (
          <MiniPlayerBadge
            key={player.id}
            player={player}
            isActive={index === currentPlayerIndex}
            isDamageLeader={player.id === damageLeaderId}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main GameBoard Component
// ============================================

export function GameBoard({
  gameState,
  logEntries,
  viewingPlayerId,
  phaseComponent,
  onPurchaseCard,
  onRefreshMarketplace,
  onPlaceBet,
  onUseSingleUseCard,
  betsLocked = false,
  className = "",
}: GameBoardProps) {
  const {
    players,
    monsters,
    currentMonsterIndex,
    currentPlayerIndex,
    turnState,
    bets,
    marketplace,
    damageLeaderId,
  } = gameState;

  const activePlayer = players[currentPlayerIndex];
  const currentMonster = monsters[currentMonsterIndex];
  const viewingPlayer = viewingPlayerId
    ? players.find((p) => p.id === viewingPlayerId) || activePlayer
    : activePlayer;

  // Determine which phases allow shopping
  const isShoppingPhase =
    turnState.phase === TurnPhase.MARKETPLACE_REFRESH ||
    turnState.phase === TurnPhase.MARKET_PURCHASE;

  // Determine if betting is open
  const isBettingPhase = turnState.phase === TurnPhase.BETTING;

  // Check if cards can be used
  const canUseCards =
    turnState.phase === TurnPhase.COME_OUT_ROLL ||
    turnState.phase === TurnPhase.POINT_PHASE;

  return (
    <div className={`min-h-screen bg-gray-100 ${className}`}>
      {/* Main Grid Layout */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Players & Turn Order */}
          <div className="lg:col-span-3 space-y-4">
            {/* Turn Order */}
            <TurnOrder
              players={players}
              currentPlayerIndex={currentPlayerIndex}
              damageLeaderId={damageLeaderId}
            />

            {/* Damage Tracker */}
            <DamageTracker
              players={players}
              damageLeaderId={damageLeaderId}
              compact={true}
            />

            {/* Active Player Dashboard */}
            <PlayerDashboard
              player={activePlayer}
              isActive={true}
              isDamageLeader={activePlayer.id === damageLeaderId}
              canUseCards={canUseCards && viewingPlayer.id === activePlayer.id}
              onUseSingleUseCard={
                onUseSingleUseCard
                  ? (cardId) => onUseSingleUseCard(activePlayer.id, cardId)
                  : undefined
              }
            />

            {/* Other Players (collapsed) */}
            {players.length > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Other Players</h3>
                <div className="space-y-2">
                  {players
                    .filter((p) => p.id !== activePlayer.id)
                    .map((player) => (
                      <MiniPlayerBadge
                        key={player.id}
                        player={player}
                        isActive={false}
                        isDamageLeader={player.id === damageLeaderId}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Center - Main Game Area */}
          <div className="lg:col-span-6 space-y-4">
            {/* Phase Indicator */}
            <PhaseIndicator phase={turnState.phase} playerName={activePlayer.name} />

            {/* Monster Display */}
            <div className="flex justify-center">
              <Monster
                monster={currentMonster}
                isActive={true}
                size="large"
                highlightNumber={undefined}
              />
            </div>

            {/* Monster Gauntlet Progress */}
            <MonsterGauntlet
              monsters={monsters}
              currentMonsterIndex={currentMonsterIndex}
            />

            {/* Phase Component (ComeOutRoll, PointPhase, etc.) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {phaseComponent ? (
                phaseComponent
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <span className="text-4xl block mb-4">🎲</span>
                  <p>Waiting for game action...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Marketplace, Betting, Log */}
          <div className="lg:col-span-3 space-y-4">
            {/* Marketplace (collapsible on smaller screens) */}
            {isShoppingPhase && viewingPlayer.id === activePlayer.id ? (
              <Marketplace
                marketplace={marketplace}
                player={activePlayer}
                isShoppingPhase={isShoppingPhase}
                onPurchaseCard={onPurchaseCard}
                onRefresh={onRefreshMarketplace}
              />
            ) : (
              <CompactMarketplace marketplace={marketplace} />
            )}

            {/* Betting Panel */}
            {isBettingPhase || bets.length > 0 ? (
              <BettingPanel
                player={viewingPlayer}
                activePlayerId={activePlayer.id}
                bets={bets}
                players={players}
                isBettingPhase={isBettingPhase}
                onPlaceBet={onPlaceBet}
                isLocked={betsLocked}
              />
            ) : (
              <CompactBettingDisplay
                bets={bets}
                players={players}
                isOpen={isBettingPhase}
              />
            )}

            {/* Turn Log */}
            <TurnLog entries={logEntries} maxHeight={300} title="Game Log" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Simplified Layout for Mobile
// ============================================

export interface MobileGameBoardProps {
  gameState: GameState;
  logEntries: LogEntry[];
  phaseComponent?: React.ReactNode;
  className?: string;
}

export function MobileGameBoard({
  gameState,
  logEntries,
  phaseComponent,
  className = "",
}: MobileGameBoardProps) {
  const {
    players,
    monsters,
    currentMonsterIndex,
    currentPlayerIndex,
    turnState,
    bets,
    damageLeaderId,
  } = gameState;

  const activePlayer = players[currentPlayerIndex];
  const currentMonster = monsters[currentMonsterIndex];

  return (
    <div className={`min-h-screen bg-gray-100 ${className}`}>
      <div className="p-4 space-y-4">
        {/* Phase Header */}
        <PhaseIndicator phase={turnState.phase} playerName={activePlayer.name} />

        {/* Monster */}
        <div className="flex justify-center">
          <Monster monster={currentMonster} isActive={true} size="medium" />
        </div>

        {/* Phase Component */}
        {phaseComponent}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2">
          <MiniPlayerBadge
            player={activePlayer}
            isActive={true}
            isDamageLeader={activePlayer.id === damageLeaderId}
          />
          <CompactBettingDisplay bets={bets} players={players} isOpen={false} />
        </div>

        {/* Turn Log (collapsed) */}
        <TurnLog entries={logEntries} maxHeight={200} title="Recent Activity" />
      </div>
    </div>
  );
}

// ============================================
// Exports
// ============================================

export default GameBoard;
