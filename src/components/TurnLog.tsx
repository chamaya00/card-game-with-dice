"use client";

import React, { useRef, useEffect } from "react";
import type { Player, Monster, Card, Bet } from "@/types/game";

// ============================================
// Log Entry Types
// ============================================

export type LogEntryType =
  | "roll"
  | "natural"
  | "craps"
  | "point_established"
  | "monster_hit"
  | "point_hit"
  | "monster_defeated"
  | "crap_out"
  | "escape"
  | "revive"
  | "bet_placed"
  | "bet_resolved"
  | "card_drawn"
  | "card_used"
  | "card_purchased"
  | "marketplace_refreshed"
  | "turn_start"
  | "turn_end"
  | "game_start"
  | "game_end"
  | "phase_change"
  | "gold_change"
  | "damage_leader_change";

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: LogEntryType;
  playerId?: string;
  playerName?: string;
  message: string;
  details?: {
    diceValues?: number[];
    sum?: number;
    point?: number;
    hitNumber?: number;
    goldChange?: number;
    card?: Card;
    bet?: Bet;
    monster?: Monster;
    fromPlayer?: string;
    toPlayer?: string;
  };
}

// ============================================
// Log Entry Icon Mapping
// ============================================

const LOG_ICONS: Record<LogEntryType, string> = {
  roll: "🎲",
  natural: "🎉",
  craps: "💀",
  point_established: "🎯",
  monster_hit: "💥",
  point_hit: "✨",
  monster_defeated: "🏆",
  crap_out: "☠️",
  escape: "🏃",
  revive: "💫",
  bet_placed: "💰",
  bet_resolved: "📊",
  card_drawn: "🃏",
  card_used: "⚡",
  card_purchased: "🛒",
  marketplace_refreshed: "🔄",
  turn_start: "▶️",
  turn_end: "⏹️",
  game_start: "🎮",
  game_end: "🏁",
  phase_change: "📍",
  gold_change: "🪙",
  damage_leader_change: "👑",
};

const LOG_COLORS: Record<LogEntryType, string> = {
  roll: "text-gray-600",
  natural: "text-green-600 font-semibold",
  craps: "text-red-600 font-semibold",
  point_established: "text-blue-600 font-semibold",
  monster_hit: "text-green-600",
  point_hit: "text-purple-600",
  monster_defeated: "text-green-700 font-bold",
  crap_out: "text-red-700 font-bold",
  escape: "text-yellow-600",
  revive: "text-purple-600",
  bet_placed: "text-amber-600",
  bet_resolved: "text-amber-700",
  card_drawn: "text-blue-500",
  card_used: "text-indigo-600",
  card_purchased: "text-teal-600",
  marketplace_refreshed: "text-cyan-600",
  turn_start: "text-blue-600 font-semibold",
  turn_end: "text-gray-500",
  game_start: "text-green-700 font-bold",
  game_end: "text-purple-700 font-bold",
  phase_change: "text-gray-400 text-xs",
  gold_change: "text-yellow-600",
  damage_leader_change: "text-amber-600 font-semibold",
};

// ============================================
// Log Entry Component
// ============================================

interface LogEntryItemProps {
  entry: LogEntry;
  showTimestamp?: boolean;
}

function LogEntryItem({ entry, showTimestamp = false }: LogEntryItemProps) {
  const icon = LOG_ICONS[entry.type];
  const colorClass = LOG_COLORS[entry.type];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="flex items-start gap-2 py-1.5 px-2 hover:bg-gray-50 rounded transition-colors">
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${colorClass}`}>
          {entry.playerName && (
            <span className="font-medium text-gray-800">{entry.playerName}: </span>
          )}
          {entry.message}
        </p>
        {entry.details?.diceValues && (
          <p className="text-xs text-gray-400 mt-0.5">
            Dice: [{entry.details.diceValues.join(", ")}] = {entry.details.sum}
          </p>
        )}
        {showTimestamp && (
          <p className="text-xs text-gray-300 mt-0.5">{formatTime(entry.timestamp)}</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Turn Log Component
// ============================================

export interface TurnLogProps {
  /** Log entries to display */
  entries: LogEntry[];
  /** Maximum height before scrolling */
  maxHeight?: number;
  /** Show timestamps on entries */
  showTimestamps?: boolean;
  /** Title for the log panel */
  title?: string;
  /** Whether to auto-scroll to bottom on new entries */
  autoScroll?: boolean;
  /** Custom className */
  className?: string;
}

export function TurnLog({
  entries,
  maxHeight = 400,
  showTimestamps = false,
  title = "Game Log",
  autoScroll = true,
  className = "",
}: TurnLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const entriesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (autoScroll && entriesEndRef.current) {
      entriesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries.length, autoScroll]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg">📜</span>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <span className="text-xs text-gray-400">{entries.length} entries</span>
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {entries.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
            No events yet...
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <LogEntryItem
                key={entry.id}
                entry={entry}
                showTimestamp={showTimestamps}
              />
            ))}
            <div ref={entriesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Log Entry Factory Functions
// ============================================

let logIdCounter = 0;

function createLogId(): string {
  return `log-${Date.now()}-${++logIdCounter}`;
}

export function createLogEntry(
  type: LogEntryType,
  message: string,
  options?: {
    playerId?: string;
    playerName?: string;
    details?: LogEntry["details"];
  }
): LogEntry {
  return {
    id: createLogId(),
    timestamp: new Date(),
    type,
    message,
    playerId: options?.playerId,
    playerName: options?.playerName,
    details: options?.details,
  };
}

// Pre-built log entry creators
export const LogEntries = {
  gameStart: (playerCount: number): LogEntry =>
    createLogEntry("game_start", `Game started with ${playerCount} players!`),

  gameEnd: (winnerName: string): LogEntry =>
    createLogEntry("game_end", `${winnerName} wins the game!`, {
      playerName: winnerName,
    }),

  turnStart: (playerName: string): LogEntry =>
    createLogEntry("turn_start", `${playerName}'s turn begins`, {
      playerName,
    }),

  turnEnd: (playerName: string): LogEntry =>
    createLogEntry("turn_end", `${playerName}'s turn ends`, {
      playerName,
    }),

  roll: (playerName: string, diceValues: number[], sum: number): LogEntry =>
    createLogEntry("roll", `Rolled ${sum}`, {
      playerName,
      details: { diceValues, sum },
    }),

  natural: (playerName: string, sum: number): LogEntry =>
    createLogEntry("natural", `NATURAL! Rolled ${sum} - instant victory!`, {
      playerName,
      details: { sum },
    }),

  craps: (playerName: string, sum: number, goldLost: number): LogEntry =>
    createLogEntry("craps", `CRAPS! Rolled ${sum} - lost ${goldLost} gold`, {
      playerName,
      details: { sum, goldChange: -goldLost },
    }),

  pointEstablished: (playerName: string, point: number): LogEntry =>
    createLogEntry("point_established", `Point established at ${point}`, {
      playerName,
      details: { point },
    }),

  monsterHit: (playerName: string, hitNumber: number): LogEntry =>
    createLogEntry("monster_hit", `Hit monster number ${hitNumber}!`, {
      playerName,
      details: { hitNumber },
    }),

  pointHit: (playerName: string, point: number, removedNumber: number): LogEntry =>
    createLogEntry("point_hit", `Hit point (${point})! Removed number ${removedNumber}`, {
      playerName,
      details: { point, hitNumber: removedNumber },
    }),

  monsterDefeated: (playerName: string, monsterName: string, points: number, gold: number): LogEntry =>
    createLogEntry("monster_defeated", `Defeated ${monsterName}! +${points} VP, +${gold} gold`, {
      playerName,
    }),

  crapOut: (playerName: string, goldLost: number): LogEntry =>
    createLogEntry("crap_out", `CRAP OUT! Lost ${goldLost} gold, monster damage reset`, {
      playerName,
      details: { goldChange: -goldLost },
    }),

  escape: (playerName: string): LogEntry =>
    createLogEntry("escape", `Escaped safely - turn ends`, {
      playerName,
    }),

  revive: (playerName: string, cardsDiscarded: number): LogEntry =>
    createLogEntry("revive", `Revived! Discarded ${cardsDiscarded} cards to continue`, {
      playerName,
    }),

  betPlaced: (playerName: string, betType: "FOR" | "AGAINST", amount: number): LogEntry =>
    createLogEntry("bet_placed", `Bet ${amount} gold ${betType} the shooter`, {
      playerName,
      details: { goldChange: -amount },
    }),

  betResolved: (playerName: string, goldChange: number, won: boolean): LogEntry =>
    createLogEntry(
      "bet_resolved",
      goldChange > 0
        ? `Won ${goldChange} gold from bet!`
        : goldChange < 0
          ? `Lost ${Math.abs(goldChange)} gold from bet`
          : `Bet returned`,
      {
        playerName,
        details: { goldChange },
      }
    ),

  cardDrawn: (playerName: string, cardName: string): LogEntry =>
    createLogEntry("card_drawn", `Drew card: ${cardName}`, {
      playerName,
    }),

  cardUsed: (playerName: string, cardName: string, targetName?: string): LogEntry =>
    createLogEntry(
      "card_used",
      targetName
        ? `Used ${cardName} on ${targetName}`
        : `Used ${cardName}`,
      { playerName }
    ),

  cardPurchased: (playerName: string, cardName: string, cost: number): LogEntry =>
    createLogEntry("card_purchased", `Bought ${cardName} for ${cost} gold`, {
      playerName,
      details: { goldChange: -cost },
    }),

  marketplaceRefreshed: (playerName: string): LogEntry =>
    createLogEntry("marketplace_refreshed", `Refreshed marketplace for 3 gold`, {
      playerName,
      details: { goldChange: -3 },
    }),

  damageLeaderChange: (newLeaderName: string, damage: number): LogEntry =>
    createLogEntry(
      "damage_leader_change",
      `${newLeaderName} is now the damage leader with ${damage} total damage!`,
      { playerName: newLeaderName }
    ),

  phaseChange: (phaseName: string): LogEntry =>
    createLogEntry("phase_change", `Phase: ${phaseName}`),
};

// ============================================
// Turn Log Hook
// ============================================

export interface UseTurnLogReturn {
  entries: LogEntry[];
  addEntry: (entry: LogEntry) => void;
  addEntries: (entries: LogEntry[]) => void;
  clearLog: () => void;
}

export function useTurnLog(initialEntries: LogEntry[] = []): UseTurnLogReturn {
  const [entries, setEntries] = React.useState<LogEntry[]>(initialEntries);

  const addEntry = React.useCallback((entry: LogEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  const addEntries = React.useCallback((newEntries: LogEntry[]) => {
    setEntries((prev) => [...prev, ...newEntries]);
  }, []);

  const clearLog = React.useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addEntry, addEntries, clearLog };
}

// ============================================
// Exports
// ============================================

export default TurnLog;
