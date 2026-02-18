'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface GameControlsProps {
  onNewGame: () => void;
  onUndo: () => void;
  onHint: () => void;
  canUndo: boolean;
  disabled: boolean;
}

export function GameControls({
  onNewGame,
  onUndo,
  onHint,
  canUndo,
  disabled,
}: GameControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={disabled || !canUndo}
        className="gap-1.5"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
        Undo
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onHint}
        disabled={disabled}
        className="gap-1.5"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" x2="12.01" y1="17" y2="17" />
        </svg>
        Hint
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={onNewGame}
        className="gap-1.5 bg-primary hover:bg-primary/80"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        New Game
      </Button>
    </div>
  );
}
