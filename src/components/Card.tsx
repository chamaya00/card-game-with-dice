'use client';

import { Card as CardType } from '@/types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selectable?: boolean;
  small?: boolean;
}

export function Card({ card, onClick, selectable = false, small = false }: CardProps) {
  const baseClasses = small
    ? 'w-16 h-24 text-xs'
    : 'w-32 h-48 text-sm';

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={`
        ${baseClasses}
        rounded-xl shadow-lg
        flex flex-col items-center justify-between
        p-2 transition-all duration-200
        relative
        ${selectable
          ? 'cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-2'
          : ''
        }
        ${card.isBoss ? 'shadow-red-500/50 shadow-2xl' : ''}
      `}
      style={{
        backgroundColor: card.color,
        border: card.isBoss
          ? '4px solid #FFD700'
          : '3px solid rgba(255,255,255,0.3)',
        boxShadow: card.isBoss
          ? '0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)'
          : undefined,
      }}
    >
      {card.isBoss && (
        <div className={`${small ? 'text-xs' : 'text-sm'} bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold shadow-md absolute -top-2`}>
          BOSS
        </div>
      )}
      <div className={`text-white font-bold text-center drop-shadow-md ${card.isBoss ? 'mt-2' : ''}`}>
        {card.name}
      </div>

      {/* Monster stats display */}
      {card.isMonster && (
        <div className={`flex gap-1 ${small ? 'text-[10px]' : 'text-sm'}`}>
          <div className="bg-red-600/90 text-white px-2 py-1 rounded font-bold shadow-inner">
            ⚔️ {card.strength}
          </div>
          <div className="bg-blue-600/90 text-white px-2 py-1 rounded font-bold shadow-inner">
            🛡️ {card.defense}
          </div>
        </div>
      )}

      {/* Point value badge */}
      {card.isMonster && card.pointValue && (
        <div
          className={`
            ${small ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}
            bg-yellow-400 rounded-full flex items-center justify-center
            font-bold shadow-md border-2 border-yellow-600
          `}
        >
          {card.pointValue}
        </div>
      )}

      <div className="text-white/80 text-center text-[10px] leading-tight px-1">
        {small ? '' : card.description}
      </div>
    </div>
  );
}

export function CardBack({ small = false }: { small?: boolean }) {
  const baseClasses = small
    ? 'w-16 h-24'
    : 'w-32 h-48';

  return (
    <div
      className={`
        ${baseClasses}
        rounded-xl shadow-lg
        flex items-center justify-center
        bg-gradient-to-br from-slate-700 to-slate-900
        border-4 border-slate-600
      `}
    >
      <div className="w-3/4 h-3/4 rounded-lg border-2 border-slate-500 flex items-center justify-center">
        <span className="text-slate-400 font-bold text-2xl">?</span>
      </div>
    </div>
  );
}
