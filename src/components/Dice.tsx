"use client";

import React from "react";

// ============================================
// Dice Component Types
// ============================================

export interface DiceProps {
  /** Array of dice values to display (1-6 each) */
  values: number[];
  /** Whether the dice are currently rolling (triggers animation) */
  rolling?: boolean;
  /** Size of each die in pixels (default: 64) */
  size?: number;
  /** Custom className for the container */
  className?: string;
}

export interface SingleDieProps {
  /** Value to display (1-6) */
  value: number;
  /** Whether this die is currently rolling */
  rolling?: boolean;
  /** Size of the die in pixels */
  size?: number;
}

// ============================================
// Pip Position Configurations
// ============================================

type PipPosition = { top: string; left: string };

const PIP_POSITIONS: Record<number, PipPosition[]> = {
  1: [{ top: "50%", left: "50%" }],
  2: [
    { top: "25%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
  3: [
    { top: "25%", left: "25%" },
    { top: "50%", left: "50%" },
    { top: "75%", left: "75%" },
  ],
  4: [
    { top: "25%", left: "25%" },
    { top: "25%", left: "75%" },
    { top: "75%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
  5: [
    { top: "25%", left: "25%" },
    { top: "25%", left: "75%" },
    { top: "50%", left: "50%" },
    { top: "75%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
  6: [
    { top: "25%", left: "25%" },
    { top: "25%", left: "75%" },
    { top: "50%", left: "25%" },
    { top: "50%", left: "75%" },
    { top: "75%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
};

// ============================================
// Pip Component
// ============================================

interface PipProps {
  position: PipPosition;
  size: number;
}

function Pip({ position, size }: PipProps) {
  // Pip size is proportional to die size
  const pipSize = Math.max(size * 0.15, 6);

  return (
    <div
      className="absolute rounded-full bg-gray-800"
      style={{
        width: pipSize,
        height: pipSize,
        top: position.top,
        left: position.left,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

// ============================================
// Single Die Component
// ============================================

export function SingleDie({ value, rolling = false, size = 64 }: SingleDieProps) {
  // Clamp value to valid range
  const safeValue = Math.min(Math.max(Math.round(value), 1), 6);
  const pips = PIP_POSITIONS[safeValue];

  return (
    <div
      className={`
        relative rounded-lg bg-white shadow-lg border-2 border-gray-300
        ${rolling ? "animate-dice-roll" : ""}
      `}
      style={{
        width: size,
        height: size,
      }}
      role="img"
      aria-label={`Die showing ${safeValue}`}
    >
      {pips.map((position, index) => (
        <Pip key={index} position={position} size={size} />
      ))}
    </div>
  );
}

// ============================================
// Dice Group Component
// ============================================

export function Dice({
  values,
  rolling = false,
  size = 64,
  className = "",
}: DiceProps) {
  if (values.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex gap-4 ${className}`}
      role="group"
      aria-label={`Dice showing ${values.join(", ")}`}
    >
      {values.map((value, index) => (
        <SingleDie
          key={index}
          value={value}
          rolling={rolling}
          size={size}
        />
      ))}
    </div>
  );
}

// ============================================
// Dice Result Display Component
// ============================================

export interface DiceResultProps {
  /** Array of dice values */
  values: number[];
  /** Whether to show the sum */
  showSum?: boolean;
  /** Size of each die */
  size?: number;
  /** Custom className */
  className?: string;
}

export function DiceResult({
  values,
  showSum = true,
  size = 64,
  className = "",
}: DiceResultProps) {
  const sum = values.reduce((a, b) => a + b, 0);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <Dice values={values} size={size} />
      {showSum && values.length > 0 && (
        <div className="text-2xl font-bold text-gray-700">
          Sum: {sum}
        </div>
      )}
    </div>
  );
}

// Default export
export default Dice;
