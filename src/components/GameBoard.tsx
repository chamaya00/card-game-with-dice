'use client';

import { useGame } from '@/context/GameContext';
import { PlayerScoreboard } from './PlayerScoreboard';
import { InPlayZone } from './InPlayZone';
import { DeckDisplay } from './DeckDisplay';
import { GameOver } from './GameOver';
import { ShopZone } from './ShopZone';
import { BOSS_FIGHT_INTERVAL, SHOP_INTERVAL } from '@/types/game';

export function GameBoard() {
  const {
    gameState,
    handleDrawCards,
    handleSelectCard,
    handleDiscard,
    handleBuyShopItem,
    handleSkipShopTurn,
    resetGame,
  } = useGame();

  if (!gameState) return null;

  const {
    players,
    currentPlayerIndex,
    selectingPlayerIndex,
    shoppingPlayerIndex,
    deck,
    inPlayZone,
    shopZone,
    discardPile,
    phase,
    winner,
    turnNumber,
    gameOver,
  } = gameState;

  const currentPlayer = players[currentPlayerIndex];
  const selectingPlayer = players[selectingPlayerIndex];
  const shoppingPlayer = players[shoppingPlayerIndex];
  const isBossFight = turnNumber % BOSS_FIGHT_INTERVAL === 0;
  const isShopRound = turnNumber % SHOP_INTERVAL === 0;

  // Auto-discard when in discarding phase
  if (phase === 'discarding') {
    setTimeout(() => handleDiscard(), 1000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-800 to-emerald-950 p-4">
      {/* Winner/Game Over Overlay */}
      {(winner || gameOver) && (
        <GameOver
          winner={winner}
          players={players}
          onPlayAgain={resetGame}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Card Game</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-white/70">Turn {turnNumber}</span>
              {isBossFight && (
                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-bold animate-pulse">
                  BOSS FIGHT!
                </span>
              )}
            </div>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg
                hover:bg-red-500/30 transition-colors text-sm"
            >
              End Game
            </button>
          </div>
        </div>

        {/* Player Scoreboard */}
        <PlayerScoreboard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          selectingPlayerIndex={selectingPlayerIndex}
          shoppingPlayerIndex={shoppingPlayerIndex}
          phase={phase}
        />

        {/* Game Status */}
        <div className="text-center py-4">
          {phase === 'drawing' && (
            <div>
              {currentPlayer.skipNextTurn && (
                <p className="text-red-400 text-lg font-bold mb-2 animate-pulse">
                  ⚠️ {currentPlayer.name} is skipping this turn (defeated by monster)
                </p>
              )}
              {isBossFight ? (
                <p className="text-white text-lg">
                  <span className="font-bold text-red-400">BOSS FIGHT!</span>
                  {' '}
                  <span className="font-bold" style={{ color: currentPlayer.color }}>
                    {currentPlayer.name}
                  </span>
                  , draw 1 boss card + {players.length} regular cards!
                </p>
              ) : isShopRound ? (
                <p className="text-white text-lg">
                  <span className="font-bold text-yellow-400">🛒 SHOP ROUND!</span>
                  {' '}
                  Players will be able to buy equipment after this round!
                </p>
              ) : (
                <p className="text-white text-lg">
                  <span className="font-bold" style={{ color: currentPlayer.color }}>
                    {currentPlayer.name}
                  </span>
                  , draw {players.length + 1} cards to start your turn!
                </p>
              )}
            </div>
          )}
          {phase === 'selecting' && (
            <p className="text-white text-lg">
              Players are selecting cards...
              <span className="text-white/70 ml-2">
                ({inPlayZone.length} cards remaining)
              </span>
            </p>
          )}
          {phase === 'shopping' && (
            <p className="text-yellow-400 text-lg">
              🛒 Shop Round!
              <span className="font-bold ml-2" style={{ color: shoppingPlayer.color }}>
                {shoppingPlayer.name}
              </span>
              &apos;s turn to shop
            </p>
          )}
          {phase === 'discarding' && (
            <p className="text-yellow-300 text-lg animate-pulse">
              Discarding remaining {inPlayZone.length} card(s)...
            </p>
          )}
        </div>

        {/* Main Game Area */}
        <div className="bg-black/20 rounded-2xl p-6">
          {phase === 'shopping' ? (
            /* Shop Zone */
            <ShopZone
              shopCards={shopZone}
              shoppingPlayer={shoppingPlayer}
              onBuyItem={handleBuyShopItem}
              onSkipTurn={handleSkipShopTurn}
            />
          ) : (
            <>
              {/* In Play Zone */}
              <div className="mb-8">
                <h2 className="text-white/70 text-sm font-medium mb-4 text-center uppercase tracking-wider">
                  In Play Zone
                </h2>
                <InPlayZone
                  cards={inPlayZone}
                  onSelectCard={handleSelectCard}
                  canSelect={phase === 'selecting'}
                  selectingPlayerName={selectingPlayer.name}
                />
              </div>

              {/* Deck and Discard */}
              <div className="border-t border-white/10 pt-6">
                <DeckDisplay
                  deckCount={deck.length}
                  discardPile={discardPile}
                  onDrawCards={handleDrawCards}
                  canDraw={phase === 'drawing'}
                  currentPlayerName={currentPlayer.name}
                />
              </div>
            </>
          )}
        </div>

        {/* Game Rules Reminder */}
        <div className="text-center text-white/50 text-sm">
          <p>Each card&apos;s value adds to your score. First to 10 points wins!</p>
        </div>
      </div>
    </div>
  );
}
