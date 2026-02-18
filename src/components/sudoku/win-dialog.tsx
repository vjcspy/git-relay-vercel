'use client';

import React from 'react';
import type { Difficulty } from '@/lib/sudoku/types';
import { DIFFICULTIES } from '@/lib/sudoku/types';
import { formatTime } from '@/lib/sudoku/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface WinDialogProps {
  open: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
  difficulty: Difficulty;
  time: number;
  mistakes: number;
}

export function WinDialog({
  open,
  onClose,
  onPlayAgain,
  onChangeDifficulty,
  difficulty,
  time,
  mistakes,
}: WinDialogProps) {
  const config = DIFFICULTIES[difficulty];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center">
          <div className="text-5xl mb-3 text-center">🎉</div>
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            You solved the puzzle!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">Difficulty</span>
              <span className="text-sm font-semibold">
                {config.emoji} {config.label}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">Time</span>
              <span className="text-sm font-semibold font-mono">{formatTime(time)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-secondary/50">
              <span className="text-xs text-muted-foreground">Mistakes</span>
              <span className="text-sm font-semibold">{mistakes}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              className="w-full bg-primary hover:bg-primary/80"
              onClick={onPlayAgain}
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onChangeDifficulty}
            >
              Change Difficulty
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
