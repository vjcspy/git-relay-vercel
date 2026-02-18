import type { Board, CellValue } from './types';

/**
 * Check if placing `num` at (row, col) is valid (no conflict).
 */
export function isValid(board: Board, row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

/**
 * Solve the board in-place using backtracking.
 * Returns true if solved, false if unsolvable.
 */
export function solve(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;

      for (let num = 1; num <= 9; num++) {
        if (isValid(board, row, col, num)) {
          board[row][col] = num as CellValue;
          if (solve(board)) return true;
          board[row][col] = 0;
        }
      }
      return false; // no valid number → backtrack
    }
  }
  return true; // all cells filled
}

/**
 * Count solutions (up to `limit`). Used to verify unique solution.
 */
export function countSolutions(board: Board, limit: number = 2): number {
  let count = 0;

  function _solve(b: Board): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] !== 0) continue;

        for (let num = 1; num <= 9; num++) {
          if (isValid(b, row, col, num)) {
            b[row][col] = num as CellValue;
            if (_solve(b)) {
              if (count >= limit) return true;
            }
            b[row][col] = 0;
          }
        }
        return false;
      }
    }
    count++;
    return count >= limit;
  }

  // Work on a copy
  const copy = board.map(row => [...row]) as Board;
  _solve(copy);
  return count;
}

/**
 * Check if the board has exactly one unique solution.
 */
export function hasUniqueSolution(board: Board): boolean {
  return countSolutions(board, 2) === 1;
}
