'use client';

import React from 'react';
import type { Difficulty, GameState } from '@/lib/sudoku/types';
import { DIFFICULTIES } from '@/lib/sudoku/types';
import { formatTime } from '@/lib/sudoku/utils';
import { Badge } from '@/components/ui/badge';

interface GameHeaderProps {
  difficulty: Difficulty;
  timer: number;
  mistakes: number;
  maxMistakes: number;
  gameState: GameState;
}

export function GameHeader({
  difficulty,
  timer,
  mistakes,
  maxMistakes,
  gameState,
}: GameHeaderProps) {
  const config = DIFFICULTIES[difficulty];

  return (
    <div className="flex items-center justify-between w-full max-w-[min(80vw,420px)] mx-auto">
      {/* Difficulty badge */}
      <Badge
        variant="secondary"
        className="text-xs px-2.5 py-0.5 gap-1"
      >
        <span>{config.emoji}</span>
        {config.label}
      </Badge>

      {/* Timer */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-sm font-mono tabular-nums tracking-wider">
          {formatTime(timer)}
        </span>
      </div>

      {/* Mistakes */}
      <div className="flex items-center gap-1">
        {Array.from({ length: maxMistakes }, (_, i) => (
          <span
            key={i}
            className={`text-base transition-all duration-300 ${
              i < mistakes ? 'text-destructive scale-110' : 'text-muted-foreground/30'
            }`}
          >
            ✕
          </span>
        ))}
      </div>
    </div>
  );
}
