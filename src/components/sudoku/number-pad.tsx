'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NumberPadProps {
  onNumberClick: (num: number) => void;
  onErase: () => void;
  isNotesMode: boolean;
  onToggleNotes: () => void;
  numberCounts: Record<number, number>;
  disabled: boolean;
}

export function NumberPad({
  onNumberClick,
  onErase,
  isNotesMode,
  onToggleNotes,
  numberCounts,
  disabled,
}: NumberPadProps) {
  return (
    <div className="w-full max-w-[min(80vw,420px)] mx-auto space-y-3">
      {/* Number buttons */}
      <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const count = numberCounts[num] || 0;
          const isFull = count >= 9;

          return (
            <button
              key={num}
              onClick={() => onNumberClick(num)}
              disabled={disabled || isFull}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'aspect-square rounded-lg',
                'text-lg sm:text-xl font-semibold',
                'transition-all duration-150',
                'cursor-pointer',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                isFull
                  ? 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed'
                  : 'bg-secondary hover:bg-secondary/80 text-foreground hover:scale-105 active:scale-95',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span>{num}</span>
              {!isFull && (
                <span className="text-[0.5rem] text-muted-foreground leading-none mt-0.5">
                  {9 - count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className={cn(
            'flex-1 h-10',
            isNotesMode && 'bg-primary/20 border-primary text-primary'
          )}
          onClick={onToggleNotes}
          disabled={disabled}
        >
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Notes {isNotesMode ? 'ON' : 'OFF'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-10"
          onClick={onErase}
          disabled={disabled}
        >
          <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
            <line x1="18" x2="12" y1="9" y2="15" />
            <line x1="12" x2="18" y1="9" y2="15" />
          </svg>
          Erase
        </Button>
      </div>
    </div>
  );
}
