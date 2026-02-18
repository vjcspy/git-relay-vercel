import type { Board, CellGrid, CellValue, Cell } from './types';

/**
 * Deep copy a Board.
 */
export function copyBoard(board: Board): Board {
  return board.map(row => [...row]) as Board;
}

/**
 * Create a CellGrid from a raw Board (puzzle) and its solution.
 */
export function createCellGrid(puzzle: Board): CellGrid {
  return puzzle.map(row =>
    row.map(value => ({
      value,
      isGiven: value !== 0,
      isError: false,
      notes: new Set<number>(),
    }))
  );
}

/**
 * Find all cells that have conflicts (same number in row/col/box).
 * Returns a Set of "row-col" keys.
 */
export function findConflicts(grid: CellGrid): Set<string> {
  const conflicts = new Set<string>();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = grid[row][col].value;
      if (val === 0) continue;

      // Check row
      for (let c = 0; c < 9; c++) {
        if (c !== col && grid[row][c].value === val) {
          conflicts.add(`${row}-${col}`);
          conflicts.add(`${row}-${c}`);
        }
      }

      // Check column
      for (let r = 0; r < 9; r++) {
        if (r !== row && grid[r][col].value === val) {
          conflicts.add(`${row}-${col}`);
          conflicts.add(`${r}-${col}`);
        }
      }

      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          if (r !== row || c !== col) {
            if (grid[r][c].value === val) {
              conflicts.add(`${row}-${col}`);
              conflicts.add(`${r}-${c}`);
            }
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Check if the board is completely and correctly filled.
 */
export function isBoardComplete(grid: CellGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value === 0) return false;
    }
  }
  return findConflicts(grid).size === 0;
}

/**
 * Format seconds as mm:ss.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Count how many times each number (1-9) appears on the grid.
 */
export function getNumberCounts(grid: CellGrid): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) counts[n] = 0;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const v = grid[row][col].value;
      if (v !== 0) counts[v]++;
    }
  }
  return counts;
}

/**
 * Deep clone a CellGrid (including Sets).
 */
export function cloneCellGrid(grid: CellGrid): CellGrid {
  return grid.map(row =>
    row.map(cell => ({
      ...cell,
      notes: new Set(cell.notes),
    }))
  );
}
