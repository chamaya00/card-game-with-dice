"use client";

import React from "react";
import type { Monster as MonsterType } from "@/types/game";
import {
  isMonsterDefeated,
  getMonsterDifficulty,
  isBossMonster,
} from "@/lib/monsterDeck";

// ============================================
// Monster Component Types
// ============================================

export interface MonsterProps {
  /** The monster to display */
  monster: MonsterType;
  /** Optional number to highlight (e.g., from a dice roll) */
  highlightNumber?: number;
  /** Whether to show the defeated animation */
  showDefeatAnimation?: boolean;
  /** Whether this is the current monster being fought */
  isActive?: boolean;
  /** Size variant */
  size?: "small" | "medium" | "large";
  /** Custom className */
  className?: string;
}

// ============================================
// Monster Type Icons/Colors
// ============================================

const MONSTER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  GOBLIN: { bg: "bg-green-100", border: "border-green-500", text: "text-green-700" },
  SKELETON: { bg: "bg-gray-100", border: "border-gray-500", text: "text-gray-700" },
  ORC: { bg: "bg-orange-100", border: "border-orange-500", text: "text-orange-700" },
  TROLL: { bg: "bg-stone-100", border: "border-stone-500", text: "text-stone-700" },
  WRAITH: { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple-700" },
  GOLEM: { bg: "bg-slate-100", border: "border-slate-500", text: "text-slate-700" },
  DEMON: { bg: "bg-red-100", border: "border-red-500", text: "text-red-700" },
  DRAGON: { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-700" },
  LICH: { bg: "bg-indigo-100", border: "border-indigo-500", text: "text-indigo-700" },
  BOSS: { bg: "bg-rose-100", border: "border-rose-600", text: "text-rose-700" },
};

const MONSTER_EMOJIS: Record<string, string> = {
  GOBLIN: "👺",
  SKELETON: "💀",
  ORC: "👹",
  TROLL: "🧌",
  WRAITH: "👻",
  GOLEM: "🗿",
  DEMON: "😈",
  DRAGON: "🐉",
  LICH: "🧙‍♂️",
  BOSS: "👑",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-green-600 bg-green-50",
  Medium: "text-yellow-600 bg-yellow-50",
  Hard: "text-red-600 bg-red-50",
  Boss: "text-purple-600 bg-purple-50",
};

// ============================================
// Number Cell Component
// ============================================

interface NumberCellProps {
  number: number;
  isHit: boolean;
  isHighlighted: boolean;
  size: "small" | "medium" | "large";
}

function NumberCell({ number, isHit, isHighlighted, size }: NumberCellProps) {
  const sizeClasses = {
    small: "w-8 h-8 text-sm",
    medium: "w-10 h-10 text-base",
    large: "w-12 h-12 text-lg",
  };

  const baseClasses = `
    ${sizeClasses[size]}
    flex items-center justify-center
    rounded-lg font-bold
    transition-all duration-200
    border-2
  `;

  if (isHit) {
    return (
      <div
        className={`${baseClasses} bg-gray-200 border-gray-300 text-gray-400 line-through`}
        aria-label={`Number ${number} - hit`}
      >
        {number}
      </div>
    );
  }

  if (isHighlighted) {
    return (
      <div
        className={`${baseClasses} bg-yellow-400 border-yellow-500 text-yellow-900 animate-pulse shadow-lg scale-110`}
        aria-label={`Number ${number} - highlighted`}
      >
        {number}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} bg-white border-gray-400 text-gray-700 hover:border-gray-500`}
      aria-label={`Number ${number} - remaining`}
    >
      {number}
    </div>
  );
}

// ============================================
// Numbers Grid Component
// ============================================

interface NumbersGridProps {
  numbersToHit: number[];
  remainingNumbers: number[];
  highlightNumber?: number;
  size: "small" | "medium" | "large";
}

function NumbersGrid({
  numbersToHit,
  remainingNumbers,
  highlightNumber,
  size,
}: NumbersGridProps) {
  // All possible point numbers in craps
  const allPointNumbers = [4, 5, 6, 8, 9, 10];

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {allPointNumbers.map((num) => {
        const isOnMonster = numbersToHit.includes(num);
        const isRemaining = remainingNumbers.includes(num);
        const isHit = isOnMonster && !isRemaining;
        const isHighlighted = num === highlightNumber && isRemaining;

        if (!isOnMonster) {
          // Number not on this monster - show as inactive
          return (
            <div
              key={num}
              className={`
                ${size === "small" ? "w-8 h-8 text-sm" : size === "medium" ? "w-10 h-10 text-base" : "w-12 h-12 text-lg"}
                flex items-center justify-center
                rounded-lg
                bg-gray-50 border-2 border-dashed border-gray-200
                text-gray-300
              `}
              aria-label={`Number ${num} - not on monster`}
            >
              {num}
            </div>
          );
        }

        return (
          <NumberCell
            key={num}
            number={num}
            isHit={isHit}
            isHighlighted={isHighlighted}
            size={size}
          />
        );
      })}
    </div>
  );
}

// ============================================
// Monster Stats Component
// ============================================

interface MonsterStatsProps {
  points: number;
  goldReward: number;
  size: "small" | "medium" | "large";
}

function MonsterStats({ points, goldReward, size }: MonsterStatsProps) {
  const textSize = size === "small" ? "text-xs" : size === "medium" ? "text-sm" : "text-base";

  return (
    <div className={`flex gap-4 justify-center ${textSize}`}>
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">⭐</span>
        <span className="font-semibold text-gray-700">{points} VP</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">🪙</span>
        <span className="font-semibold text-gray-700">{goldReward} Gold</span>
      </div>
    </div>
  );
}

// ============================================
// Main Monster Component
// ============================================

export function Monster({
  monster,
  highlightNumber,
  showDefeatAnimation = false,
  isActive = false,
  size = "medium",
  className = "",
}: MonsterProps) {
  const colors = MONSTER_COLORS[monster.type] || MONSTER_COLORS.GOBLIN;
  const emoji = MONSTER_EMOJIS[monster.type] || "👾";
  const difficulty = getMonsterDifficulty(monster);
  const defeated = isMonsterDefeated(monster);
  const isBoss = isBossMonster(monster);

  const containerSizeClasses = {
    small: "p-3 max-w-xs",
    medium: "p-4 max-w-sm",
    large: "p-6 max-w-md",
  };

  const titleSizeClasses = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl",
  };

  const emojiSizeClasses = {
    small: "text-2xl",
    medium: "text-3xl",
    large: "text-4xl",
  };

  return (
    <div
      className={`
        ${containerSizeClasses[size]}
        ${colors.bg}
        ${isActive ? `${colors.border} border-4 shadow-lg` : "border-2 border-gray-300"}
        ${defeated && showDefeatAnimation ? "animate-pulse opacity-50" : ""}
        ${isBoss ? "ring-2 ring-yellow-400 ring-offset-2" : ""}
        rounded-xl
        transition-all duration-300
        ${className}
      `}
      role="article"
      aria-label={`Monster: ${monster.name}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={emojiSizeClasses[size]} role="img" aria-label={monster.type}>
            {emoji}
          </span>
          <div>
            <h3 className={`${titleSizeClasses[size]} font-bold ${colors.text}`}>
              {monster.name}
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`
                  text-xs font-medium px-2 py-0.5 rounded-full
                  ${DIFFICULTY_COLORS[difficulty]}
                `}
              >
                {difficulty}
              </span>
              <span className="text-xs text-gray-500">
                Position {monster.position}/10
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Defeated Banner */}
      {defeated && (
        <div className="mb-3 bg-gray-800 text-white text-center py-2 px-4 rounded-lg font-bold">
          ☠️ DEFEATED ☠️
        </div>
      )}

      {/* Numbers Grid */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 text-center mb-2 font-medium">
          Numbers to Hit ({monster.remainingNumbers.length} remaining)
        </div>
        <NumbersGrid
          numbersToHit={monster.numbersToHit}
          remainingNumbers={monster.remainingNumbers}
          highlightNumber={highlightNumber}
          size={size}
        />
      </div>

      {/* Stats */}
      <MonsterStats
        points={monster.points}
        goldReward={monster.goldReward}
        size={size}
      />

      {/* Boss indicator */}
      {isBoss && (
        <div className="mt-3 text-center">
          <span className="inline-block bg-gradient-to-r from-yellow-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            👑 FINAL BOSS 👑
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact Monster Card (for gauntlet display)
// ============================================

export interface MonsterCardProps {
  monster: MonsterType;
  isCurrent: boolean;
  defeatedBy?: string;
  onClick?: () => void;
  className?: string;
}

export function MonsterCard({
  monster,
  isCurrent,
  defeatedBy,
  onClick,
  className = "",
}: MonsterCardProps) {
  const colors = MONSTER_COLORS[monster.type] || MONSTER_COLORS.GOBLIN;
  const emoji = MONSTER_EMOJIS[monster.type] || "👾";
  const defeated = isMonsterDefeated(monster);
  const isBoss = isBossMonster(monster);

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        relative
        w-16 h-20
        flex flex-col items-center justify-center
        rounded-lg
        border-2
        transition-all duration-200
        ${isCurrent ? `${colors.border} ${colors.bg} shadow-lg scale-105` : ""}
        ${defeated ? "bg-gray-200 border-gray-400 opacity-60" : ""}
        ${!isCurrent && !defeated ? "bg-white border-gray-300 hover:border-gray-400" : ""}
        ${isBoss && !defeated ? "ring-2 ring-yellow-400" : ""}
        ${onClick ? "cursor-pointer" : "cursor-default"}
        ${className}
      `}
      aria-label={`${monster.name}${isCurrent ? " (current)" : ""}${defeated ? " (defeated)" : ""}`}
    >
      {/* Position badge */}
      <span className="absolute -top-2 -left-2 w-5 h-5 bg-gray-700 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {monster.position}
      </span>

      {/* Monster emoji */}
      <span className="text-2xl" role="img" aria-hidden>
        {defeated ? "☠️" : emoji}
      </span>

      {/* Remaining count */}
      {!defeated && (
        <span className="text-xs font-medium text-gray-600 mt-1">
          {monster.remainingNumbers.length} left
        </span>
      )}

      {/* Defeated by indicator */}
      {defeated && defeatedBy && (
        <span className="text-xs text-gray-500 mt-1 truncate max-w-full px-1">
          {defeatedBy}
        </span>
      )}

      {/* Current indicator */}
      {isCurrent && !defeated && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}

// Default export
export default Monster;
