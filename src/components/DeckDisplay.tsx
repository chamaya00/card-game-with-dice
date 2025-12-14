'use client';

import { Card as CardType } from '@/types/game';
import { CardBack, Card } from './Card';

interface DeckDisplayProps {
  deckCount: number;
  discardPile: CardType[];
  onDrawCards?: () => void;
  canDraw: boolean;
  currentPlayerName: string;
}

export function DeckDisplay({
  deckCount,
  discardPile,
  onDrawCards,
  canDraw,
  currentPlayerName,
}: DeckDisplayProps) {
  const topDiscard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  return (
    <div className="flex items-center justify-center gap-8">
      {/* Draw Deck */}
      <div className="flex flex-col items-center">
        <div
          className={`relative ${canDraw ? 'cursor-pointer' : ''}`}
          onClick={canDraw ? onDrawCards : undefined}
        >
          <CardBack small />
          {canDraw && (
            <div className="absolute inset-0 rounded-xl bg-yellow-400/30 animate-pulse flex items-center justify-center">
              <span className="text-white font-bold text-xs drop-shadow-lg">
                Click!
              </span>
            </div>
          )}
        </div>
        <div className="text-white/70 text-sm mt-2">
          Deck: {deckCount}
        </div>
        {canDraw && (
          <button
            onClick={onDrawCards}
            className="mt-2 px-4 py-2 bg-yellow-500 text-yellow-900 font-bold rounded-lg
              hover:bg-yellow-400 transition-colors text-sm shadow-lg"
          >
            {currentPlayerName}: Draw Cards
          </button>
        )}
      </div>

      {/* Discard Pile */}
      <div className="flex flex-col items-center">
        {topDiscard ? (
          <Card card={topDiscard} small />
        ) : (
          <div className="w-16 h-24 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center">
            <span className="text-white/30 text-xs">Empty</span>
          </div>
        )}
        <div className="text-white/70 text-sm mt-2">
          Discard: {discardPile.length}
        </div>
      </div>
    </div>
  );
}
