'use client';

import React from 'react';
import type { CellGrid } from '@/lib/sudoku/types';
import { SudokuCell } from './sudoku-cell';

interface SudokuBoardProps {
  grid: CellGrid;
  selectedCell: [number, number] | null;
  conflicts: Set<string>;
  cellAnimations: Map<string, string>;
  onCellClick: (row: number, col: number) => void;
}

export function SudokuBoard({
  grid,
  selectedCell,
  conflicts,
  cellAnimations,
  onCellClick,
}: SudokuBoardProps) {
  const selectedValue = selectedCell
    ? grid[selectedCell[0]][selectedCell[1]].value
    : 0;

  return (
    <div className="w-full max-w-[min(80vw,420px)] mx-auto">
      <div
        className="grid grid-cols-9 grid-rows-9 rounded-lg overflow-hidden border-2 border-[oklch(0.4_0.05_277)] shadow-[0_0_30px_oklch(0.585_0.233_277_/_0.12)]"
        role="grid"
        aria-label="Sudoku board"
      >
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const key = `${rowIdx}-${colIdx}`;
            const isSelected =
              selectedCell !== null &&
              selectedCell[0] === rowIdx &&
              selectedCell[1] === colIdx;

            const isSameRowCol =
              selectedCell !== null &&
              !isSelected &&
              (selectedCell[0] === rowIdx ||
                selectedCell[1] === colIdx ||
                (Math.floor(selectedCell[0] / 3) === Math.floor(rowIdx / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(colIdx / 3)));

            const isSameNumber =
              !isSelected &&
              selectedValue !== 0 &&
              cell.value !== 0 &&
              cell.value === selectedValue;

            return (
              <SudokuCell
                key={key}
                row={rowIdx}
                col={colIdx}
                value={cell.value}
                isGiven={cell.isGiven}
                isError={conflicts.has(key)}
                notes={cell.notes}
                isSelected={isSelected}
                isHighlighted={isSameRowCol}
                isSameNumber={isSameNumber}
                isSameRowCol={isSameRowCol}
                animationClass={cellAnimations.get(key)}
                onClick={() => onCellClick(rowIdx, colIdx)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
