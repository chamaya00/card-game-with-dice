'use client';

import { Card as CardType } from '@/types/game';
import { Card } from './Card';

interface InPlayZoneProps {
  cards: CardType[];
  onSelectCard: (cardId: string) => void;
  canSelect: boolean;
  selectingPlayerName: string;
}

export function InPlayZone({
  cards,
  onSelectCard,
  canSelect,
  selectingPlayerName,
}: InPlayZoneProps) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-32 h-48 rounded-xl border-4 border-dashed border-white/30 flex items-center justify-center">
          <span className="text-white/50 text-sm text-center px-2">
            Cards will appear here
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 text-center">
        {canSelect ? (
          <p className="text-yellow-300 font-bold text-lg animate-pulse">
            {selectingPlayerName}, select a card!
          </p>
        ) : (
          <p className="text-white/70">
            Waiting for {selectingPlayerName} to select...
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onClick={() => onSelectCard(card.id)}
            selectable={canSelect}
          />
        ))}
      </div>
    </div>
  );
}
