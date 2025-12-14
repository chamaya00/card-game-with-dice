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
        ${selectable
          ? 'cursor-pointer hover:scale-105 hover:shadow-xl hover:-translate-y-2'
          : ''
        }
      `}
      style={{
        backgroundColor: card.color,
        border: '3px solid rgba(255,255,255,0.3)',
      }}
    >
      <div className="text-white font-bold text-center drop-shadow-md">
        {card.name}
      </div>
      <div
        className={`
          ${small ? 'w-8 h-8 text-lg' : 'w-16 h-16 text-3xl'}
          bg-white/90 rounded-full flex items-center justify-center
          font-bold shadow-inner
        `}
        style={{ color: card.color }}
      >
        {card.value}
      </div>
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
