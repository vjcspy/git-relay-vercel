export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 9×9 raw board — 0 means empty */
export type Board = CellValue[][];

export interface Cell {
  value: CellValue;
  /** true = original clue, cannot be modified */
  isGiven: boolean;
  /** true = conflicts with row/col/box */
  isError: boolean;
  /** pencil-mark notes (1-9) */
  notes: Set<number>;
}

export type CellGrid = Cell[][];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface DifficultyConfig {
  label: string;
  /** Number of cells removed from solved board */
  removedCells: [number, number]; // [min, max]
  description: string;
  emoji: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    removedCells: [30, 35],
    description: 'Perfect for beginners',
    emoji: '🌱',
  },
  medium: {
    label: 'Medium',
    removedCells: [36, 45],
    description: 'A balanced challenge',
    emoji: '🔥',
  },
  hard: {
    label: 'Hard',
    removedCells: [46, 52],
    description: 'For experienced players',
    emoji: '💎',
  },
  expert: {
    label: 'Expert',
    removedCells: [53, 58],
    description: 'Only the bravest',
    emoji: '🏆',
  },
};

export type GameState = 'playing' | 'won' | 'paused';

export interface HistoryEntry {
  row: number;
  col: number;
  prevValue: CellValue;
  prevNotes: Set<number>;
  newValue: CellValue;
  newNotes: Set<number>;
}
