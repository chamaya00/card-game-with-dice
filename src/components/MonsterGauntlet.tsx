"use client";

import React from "react";
import type { Monster as MonsterType, Player } from "@/types/game";
import { Monster, MonsterCard } from "./Monster";
import { isMonsterDefeated } from "@/lib/monsterDeck";

// ============================================
// MonsterGauntlet Component Types
// ============================================

export interface MonsterGauntletProps {
  /** Array of all 10 monsters in the gauntlet */
  monsters: MonsterType[];
  /** Index of the current monster (0-9) */
  currentMonsterIndex: number;
  /** Map of monster IDs to the player who defeated them */
  defeatedByMap?: Map<string, Player>;
  /** Number to highlight on the current monster (from dice roll) */
  highlightNumber?: number;
  /** Whether to show the full monster details or compact view */
  showFullDetails?: boolean;
  /** Callback when a monster card is clicked */
  onMonsterClick?: (monster: MonsterType, index: number) => void;
  /** Custom className */
  className?: string;
}

export interface GauntletProgressProps {
  /** Total number of monsters */
  total: number;
  /** Number of monsters defeated */
  defeated: number;
  /** Current monster position (1-10) */
  currentPosition: number;
}

// ============================================
// Gauntlet Progress Bar Component
// ============================================

export function GauntletProgress({
  total,
  defeated,
  currentPosition,
}: GauntletProgressProps) {
  const progressPercent = (defeated / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Gauntlet Progress
        </span>
        <span className="text-sm text-gray-500">
          {defeated}/{total} Defeated
        </span>
      </div>
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
        {/* Progress fill */}
        <div
          className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Current position marker */}
        <div
          className="absolute top-0 h-full w-1 bg-yellow-400 shadow-lg transition-all duration-300"
          style={{ left: `${((currentPosition - 1) / total) * 100}%` }}
        />
        {/* Segment lines */}
        {Array.from({ length: total - 1 }).map((_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-px bg-gray-300"
            style={{ left: `${((i + 1) / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">Start</span>
        <span className="text-xs text-gray-400">Boss</span>
      </div>
    </div>
  );
}

// ============================================
// Gauntlet Stats Component
// ============================================

interface GauntletStatsProps {
  monsters: MonsterType[];
  currentMonsterIndex: number;
}

function GauntletStats({ monsters, currentMonsterIndex }: GauntletStatsProps) {
  const defeated = monsters.filter(isMonsterDefeated).length;
  const totalPoints = monsters.reduce((sum, m) => sum + m.points, 0);
  const earnedPoints = monsters
    .filter(isMonsterDefeated)
    .reduce((sum, m) => sum + m.points, 0);
  const totalGold = monsters.reduce((sum, m) => sum + m.goldReward, 0);
  const earnedGold = monsters
    .filter(isMonsterDefeated)
    .reduce((sum, m) => sum + m.goldReward, 0);

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-2xl font-bold text-gray-800">
          {defeated}/{monsters.length}
        </div>
        <div className="text-xs text-gray-500">Monsters Defeated</div>
      </div>
      <div className="bg-yellow-50 rounded-lg p-3">
        <div className="text-2xl font-bold text-yellow-700">
          {earnedPoints}/{totalPoints}
        </div>
        <div className="text-xs text-gray-500">Victory Points</div>
      </div>
      <div className="bg-amber-50 rounded-lg p-3">
        <div className="text-2xl font-bold text-amber-700">
          {earnedGold}/{totalGold}
        </div>
        <div className="text-xs text-gray-500">Gold Awarded</div>
      </div>
    </div>
  );
}

// ============================================
// Compact Gauntlet View (Horizontal Cards)
// ============================================

interface CompactGauntletProps {
  monsters: MonsterType[];
  currentMonsterIndex: number;
  defeatedByMap?: Map<string, Player>;
  onMonsterClick?: (monster: MonsterType, index: number) => void;
}

function CompactGauntlet({
  monsters,
  currentMonsterIndex,
  defeatedByMap,
  onMonsterClick,
}: CompactGauntletProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-1">
      {monsters.map((monster, index) => {
        const defeatedBy = defeatedByMap?.get(monster.id);
        return (
          <MonsterCard
            key={monster.id}
            monster={monster}
            isCurrent={index === currentMonsterIndex}
            defeatedBy={defeatedBy?.name}
            onClick={onMonsterClick ? () => onMonsterClick(monster, index) : undefined}
          />
        );
      })}
    </div>
  );
}

// ============================================
// Main MonsterGauntlet Component
// ============================================

export function MonsterGauntlet({
  monsters,
  currentMonsterIndex,
  defeatedByMap,
  highlightNumber,
  showFullDetails = true,
  onMonsterClick,
  className = "",
}: MonsterGauntletProps) {
  const currentMonster = monsters[currentMonsterIndex];
  const defeatedCount = monsters.filter(isMonsterDefeated).length;

  if (monsters.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        No monsters in the gauntlet
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <GauntletProgress
        total={monsters.length}
        defeated={defeatedCount}
        currentPosition={currentMonsterIndex + 1}
      />

      {/* Current Monster (Full Display) */}
      {showFullDetails && currentMonster && (
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-bold text-gray-700 mb-3">
            Current Challenge
          </h2>
          <Monster
            monster={currentMonster}
            highlightNumber={highlightNumber}
            isActive={true}
            size="large"
            showDefeatAnimation={isMonsterDefeated(currentMonster)}
          />
        </div>
      )}

      {/* Monster Cards Row */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">
          All Monsters
        </h3>
        <CompactGauntlet
          monsters={monsters}
          currentMonsterIndex={currentMonsterIndex}
          defeatedByMap={defeatedByMap}
          onMonsterClick={onMonsterClick}
        />
      </div>

      {/* Gauntlet Stats */}
      <GauntletStats
        monsters={monsters}
        currentMonsterIndex={currentMonsterIndex}
      />
    </div>
  );
}

// ============================================
// Mini Gauntlet (For sidebar/compact display)
// ============================================

export interface MiniGauntletProps {
  monsters: MonsterType[];
  currentMonsterIndex: number;
  className?: string;
}

export function MiniGauntlet({
  monsters,
  currentMonsterIndex,
  className = "",
}: MiniGauntletProps) {
  const defeatedCount = monsters.filter(isMonsterDefeated).length;

  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Gauntlet</span>
        <span className="text-xs text-gray-500">
          {defeatedCount}/{monsters.length}
        </span>
      </div>
      <div className="flex gap-1">
        {monsters.map((monster, index) => {
          const defeated = isMonsterDefeated(monster);
          const isCurrent = index === currentMonsterIndex;

          return (
            <div
              key={monster.id}
              className={`
                w-3 h-3 rounded-sm
                ${defeated ? "bg-gray-400" : isCurrent ? "bg-green-500 animate-pulse" : "bg-gray-200"}
                ${monster.type === "BOSS" ? "ring-1 ring-yellow-400" : ""}
              `}
              title={`${monster.name}${isCurrent ? " (current)" : ""}${defeated ? " (defeated)" : ""}`}
            />
          );
        })}
      </div>
      {monsters[currentMonsterIndex] && (
        <div className="mt-2 text-xs text-gray-600 truncate">
          Current: {monsters[currentMonsterIndex].name}
        </div>
      )}
    </div>
  );
}

// Default export
export default MonsterGauntlet;
