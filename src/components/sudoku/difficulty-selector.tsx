'use client';

import React from 'react';
import type { Difficulty } from '@/lib/sudoku/types';
import { DIFFICULTIES } from '@/lib/sudoku/types';
import { cn } from '@/lib/utils';

interface DifficultySelectorProps {
  selected: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export function DifficultySelector({ selected, onSelect }: DifficultySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {difficulties.map(d => {
        const config = DIFFICULTIES[d];
        const isActive = selected === d;

        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'text-sm font-medium transition-all duration-200 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105'
            )}
          >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
