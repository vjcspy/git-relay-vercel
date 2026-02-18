import type { Board, CellValue, Difficulty } from './types';
import { DIFFICULTIES } from './types';
import { isValid, solve, hasUniqueSolution } from './solver';

/**
 * Shuffle an array in-place (Fisher-Yates).
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Create an empty 9×9 board.
 */
function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0) as CellValue[]);
}

/**
 * Generate a fully solved Sudoku board.
 * Uses randomized backtracking to produce a random valid board.
 */
export function generateSolvedBoard(): Board {
  const board = emptyBoard();

  function fillBoard(board: Board): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== 0) continue;

        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num as CellValue;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
    return true;
  }

  fillBoard(board);
  return board;
}

/**
 * Generate a Sudoku puzzle with a unique solution.
 *
 * Strategy: start from solved board, remove cells one by one,
 * checking unique solution is maintained after each removal.
 */
export function generatePuzzle(difficulty: Difficulty): {
  puzzle: Board;
  solution: Board;
} {
  const solution = generateSolvedBoard();
  const puzzle = solution.map(row => [...row]) as Board;
  const config = DIFFICULTIES[difficulty];
  const [minRemove, maxRemove] = config.removedCells;
  const targetRemove = minRemove + Math.floor(Math.random() * (maxRemove - minRemove + 1));

  // All 81 cell positions, shuffled
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;

  for (const [row, col] of positions) {
    if (removed >= targetRemove) break;
    if (puzzle[row][col] === 0) continue;

    const backup = puzzle[row][col];
    puzzle[row][col] = 0;

    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[row][col] = backup; // restore — removing breaks uniqueness
    }
  }

  return { puzzle, solution };
}
