'use client';

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface SudokuCellProps {
  value: number;
  isGiven: boolean;
  isError: boolean;
  notes: Set<number>;
  isSelected: boolean;
  isHighlighted: boolean;
  isSameNumber: boolean;
  isSameRowCol: boolean;
  animationClass?: string;
  onClick: () => void;
  row: number;
  col: number;
}

function SudokuCellInner({
  value,
  isGiven,
  isError,
  notes,
  isSelected,
  isHighlighted,
  isSameNumber,
  isSameRowCol,
  animationClass,
  onClick,
  row,
  col,
}: SudokuCellProps) {
  // Determine border classes for 3x3 box edges
  const borderRight = (col + 1) % 3 === 0 && col < 8 ? 'border-r-2 border-r-[oklch(0.4_0.05_277)]' : 'border-r border-r-border';
  const borderBottom = (row + 1) % 3 === 0 && row < 8 ? 'border-b-2 border-b-[oklch(0.4_0.05_277)]' : 'border-b border-b-border';
  const borderLeft = col === 0 ? 'border-l-2 border-l-[oklch(0.4_0.05_277)]' : '';
  const borderTop = row === 0 ? 'border-t-2 border-t-[oklch(0.4_0.05_277)]' : '';

  // Last column/row outer border
  const borderRightOuter = col === 8 ? 'border-r-2 border-r-[oklch(0.4_0.05_277)]' : '';
  const borderBottomOuter = row === 8 ? 'border-b-2 border-b-[oklch(0.4_0.05_277)]' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center justify-center',
        'w-full aspect-square',
        'text-lg sm:text-xl md:text-2xl font-medium',
        'transition-colors duration-150 cursor-pointer',
        'focus:outline-none',
        borderRight,
        borderBottom,
        borderLeft,
        borderTop,
        borderRightOuter,
        borderBottomOuter,
        // Background states (priority order)
        isSelected && 'bg-cell-selected',
        !isSelected && isError && 'bg-cell-error',
        !isSelected && !isError && isSameNumber && 'bg-cell-same-number',
        !isSelected && !isError && !isSameNumber && isSameRowCol && 'bg-cell-highlight',
        !isSelected && !isError && !isSameNumber && !isSameRowCol && 'bg-transparent',
        // Text color
        isError && !isGiven && 'text-cell-error-text',
        isGiven && 'text-cell-given font-bold',
        !isGiven && !isError && 'text-cell-user',
        // Corner radius for board corners
        row === 0 && col === 0 && 'rounded-tl-lg',
        row === 0 && col === 8 && 'rounded-tr-lg',
        row === 8 && col === 0 && 'rounded-bl-lg',
        row === 8 && col === 8 && 'rounded-br-lg',
        // Selected glow
        isSelected && 'animate-glow-pulse',
        // Animation
        animationClass
      )}
      aria-label={`Cell row ${row + 1} column ${col + 1}${value ? ` value ${value}` : ' empty'}`}
    >
      {value !== 0 ? (
        <span className={animationClass || ''}>{value}</span>
      ) : notes.size > 0 ? (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <span
              key={n}
              className={cn(
                'flex items-center justify-center',
                'text-[0.5rem] sm:text-[0.6rem] leading-none',
                'text-cell-note',
                !notes.has(n) && 'invisible'
              )}
            >
              {n}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}

export const SudokuCell = memo(SudokuCellInner);
