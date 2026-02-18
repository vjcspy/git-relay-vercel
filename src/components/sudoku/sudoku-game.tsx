'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Difficulty, CellGrid, CellValue, GameState, HistoryEntry } from '@/lib/sudoku/types';
import { generatePuzzle } from '@/lib/sudoku/generator';
import { createCellGrid, findConflicts, isBoardComplete, getNumberCounts, cloneCellGrid } from '@/lib/sudoku/utils';
import type { Board } from '@/lib/sudoku/types';
import { SudokuBoard } from './sudoku-board';
import { NumberPad } from './number-pad';
import { GameControls } from './game-controls';
import { DifficultySelector } from './difficulty-selector';
import { GameHeader } from './game-header';
import { WinDialog } from './win-dialog';

const MAX_MISTAKES = 3;

export function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [grid, setGrid] = useState<CellGrid>([]);
  const [solution, setSolution] = useState<Board>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timer, setTimer] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isNotesMode, setIsNotesMode] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [cellAnimations, setCellAnimations] = useState<Map<string, string>>(new Map());
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(true);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Timer ---
  useEffect(() => {
    if (gameState === 'playing' && !showDifficultyPicker) {
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, showDifficultyPicker]);

  // --- Start new game ---
  const startGame = useCallback((diff: Difficulty) => {
    setIsGenerating(true);
    // Use setTimeout to let the UI show "generating" state
    setTimeout(() => {
      const { puzzle, solution: sol } = generatePuzzle(diff);
      const cellGrid = createCellGrid(puzzle);
      setGrid(cellGrid);
      setSolution(sol);
      setDifficulty(diff);
      setSelectedCell(null);
      setGameState('playing');
      setTimer(0);
      setMistakes(0);
      setIsNotesMode(false);
      setHistory([]);
      setConflicts(new Set());
      setCellAnimations(new Map());
      setShowDifficultyPicker(false);
      setShowWinDialog(false);
      setIsGenerating(false);
    }, 50);
  }, []);

  // --- Cell click ---
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return;
    setSelectedCell([row, col]);
  }, [gameState]);

  // --- Trigger animation on a cell ---
  const triggerAnimation = useCallback((row: number, col: number, cls: string) => {
    const key = `${row}-${col}`;
    setCellAnimations(prev => {
      const next = new Map(prev);
      next.set(key, cls);
      return next;
    });
    setTimeout(() => {
      setCellAnimations(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    }, 350);
  }, []);

  // --- Place number ---
  const placeNumber = useCallback((num: number) => {
    if (!selectedCell || gameState !== 'playing' || grid.length === 0) return;
    const [row, col] = selectedCell;
    const cell = grid[row][col];
    if (cell.isGiven) return;

    const newGrid = cloneCellGrid(grid);
    const entry: HistoryEntry = {
      row,
      col,
      prevValue: cell.value,
      prevNotes: new Set(cell.notes),
      newValue: 0 as CellValue,
      newNotes: new Set<number>(),
    };

    if (isNotesMode) {
      // Toggle note
      const newNotes = new Set(cell.notes);
      if (newNotes.has(num)) {
        newNotes.delete(num);
      } else {
        newNotes.add(num);
      }
      newGrid[row][col] = { ...cell, value: 0 as CellValue, notes: newNotes };
      entry.newValue = 0 as CellValue;
      entry.newNotes = newNotes;
    } else {
      // Place value
      const v = num as CellValue;
      newGrid[row][col] = { ...cell, value: v, notes: new Set() };
      entry.newValue = v;
      entry.newNotes = new Set();

      // Check if correct
      if (solution[row][col] !== v) {
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        triggerAnimation(row, col, 'animate-cell-shake');
        
        if (newMistakes >= MAX_MISTAKES) {
          setGameState('paused');
          // Auto-reveal the solution with a slight delay
          setTimeout(() => {
            const revealedGrid = cloneCellGrid(newGrid);
            for (let r = 0; r < 9; r++) {
              for (let c = 0; c < 9; c++) {
                if (revealedGrid[r][c].value === 0) {
                  revealedGrid[r][c].value = solution[r][c];
                }
              }
            }
            setGrid(revealedGrid);
          }, 500);
        }
      } else {
        triggerAnimation(row, col, 'animate-fade-in-number');
        // Remove this number from notes in same row/col/box
        for (let i = 0; i < 9; i++) {
          newGrid[row][i].notes.delete(num);
          newGrid[i][col].notes.delete(num);
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
          for (let c = boxCol; c < boxCol + 3; c++) {
            newGrid[r][c].notes.delete(num);
          }
        }
      }
    }

    setGrid(newGrid);
    setHistory(prev => [...prev, entry]);

    // Update conflicts
    const newConflicts = findConflicts(newGrid);
    setConflicts(newConflicts);

    // Check win
    if (!isNotesMode && isBoardComplete(newGrid)) {
      setGameState('won');
      setShowWinDialog(true);
    }
  }, [selectedCell, gameState, grid, solution, isNotesMode, mistakes, triggerAnimation]);

  // --- Erase ---
  const handleErase = useCallback(() => {
    if (!selectedCell || gameState !== 'playing' || grid.length === 0) return;
    const [row, col] = selectedCell;
    const cell = grid[row][col];
    if (cell.isGiven) return;

    const newGrid = cloneCellGrid(grid);
    const entry: HistoryEntry = {
      row,
      col,
      prevValue: cell.value,
      prevNotes: new Set(cell.notes),
      newValue: 0 as CellValue,
      newNotes: new Set(),
    };

    newGrid[row][col] = { ...cell, value: 0 as CellValue, notes: new Set() };
    setGrid(newGrid);
    setHistory(prev => [...prev, entry]);
    setConflicts(findConflicts(newGrid));
  }, [selectedCell, gameState, grid]);

  // --- Undo ---
  const handleUndo = useCallback(() => {
    if (history.length === 0 || gameState !== 'playing') return;
    const entry = history[history.length - 1];
    const newGrid = cloneCellGrid(grid);
    newGrid[entry.row][entry.col] = {
      ...newGrid[entry.row][entry.col],
      value: entry.prevValue,
      notes: entry.prevNotes,
    };
    setGrid(newGrid);
    setHistory(prev => prev.slice(0, -1));
    setConflicts(findConflicts(newGrid));
  }, [history, gameState, grid]);

  // --- Hint ---
  const handleHint = useCallback(() => {
    if (gameState !== 'playing' || grid.length === 0) return;

    // Find an empty cell and reveal its solution
    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === 0 && !grid[r][c].isGiven) {
          emptyCells.push([r, c]);
        }
      }
    }
    // Also consider wrong cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value !== 0 && !grid[r][c].isGiven && grid[r][c].value !== solution[r][c]) {
          emptyCells.push([r, c]);
        }
      }
    }

    if (emptyCells.length === 0) return;

    // Prefer selected cell if it's empty, otherwise random
    let target: [number, number];
    if (selectedCell && (grid[selectedCell[0]][selectedCell[1]].value === 0 || grid[selectedCell[0]][selectedCell[1]].value !== solution[selectedCell[0]][selectedCell[1]])) {
      target = selectedCell;
    } else {
      target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    const [row, col] = target;
    const newGrid = cloneCellGrid(grid);
    const entry: HistoryEntry = {
      row,
      col,
      prevValue: grid[row][col].value,
      prevNotes: new Set(grid[row][col].notes),
      newValue: solution[row][col],
      newNotes: new Set(),
    };

    newGrid[row][col] = {
      ...newGrid[row][col],
      value: solution[row][col],
      notes: new Set(),
      isGiven: true, // Make it permanent like a clue
    };

    setGrid(newGrid);
    setHistory(prev => [...prev, entry]);
    setSelectedCell(target);
    triggerAnimation(row, col, 'animate-cell-pop');
    setConflicts(findConflicts(newGrid));

    if (isBoardComplete(newGrid)) {
      setGameState('won');
      setShowWinDialog(true);
    }
  }, [gameState, grid, solution, selectedCell, triggerAnimation]);

  // --- Keyboard support ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameState !== 'playing' || showDifficultyPicker) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        placeNumber(num);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleErase();
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsNotesMode(prev => !prev);
        return;
      }

      if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Arrow keys navigation
      if (selectedCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const [row, col] = selectedCell;
        let newRow = row;
        let newCol = col;

        switch (e.key) {
          case 'ArrowUp': newRow = Math.max(0, row - 1); break;
          case 'ArrowDown': newRow = Math.min(8, row + 1); break;
          case 'ArrowLeft': newCol = Math.max(0, col - 1); break;
          case 'ArrowRight': newCol = Math.min(8, col + 1); break;
        }
        setSelectedCell([newRow, newCol]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showDifficultyPicker, selectedCell, placeNumber, handleErase, handleUndo]);

  // --- Computed ---
  const numberCounts = grid.length > 0 ? getNumberCounts(grid) : {} as Record<number, number>;

  // --- Difficulty picker screen ---
  if (showDifficultyPicker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-[oklch(0.14_0.03_280)]">
        <div className="text-center space-y-8 max-w-md w-full">
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Sudoku
            </h1>
            <p className="text-muted-foreground text-sm">
              Challenge your mind with the classic number puzzle
            </p>
          </div>

          {/* Difficulty cards */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              Select Difficulty
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(d => {
                const config = {
                  easy: { emoji: '🌱', label: 'Easy', desc: 'Perfect for beginners', gradient: 'from-emerald-500/20 to-emerald-500/5' },
                  medium: { emoji: '🔥', label: 'Medium', desc: 'A balanced challenge', gradient: 'from-amber-500/20 to-amber-500/5' },
                  hard: { emoji: '💎', label: 'Hard', desc: 'For experienced players', gradient: 'from-blue-500/20 to-blue-500/5' },
                  expert: { emoji: '🏆', label: 'Expert', desc: 'Only the bravest', gradient: 'from-purple-500/20 to-purple-500/5' },
                }[d];

                return (
                  <button
                    key={d}
                    onClick={() => startGame(d)}
                    disabled={isGenerating}
                    className={`
                      flex flex-col items-center gap-2 p-5 rounded-xl
                      bg-gradient-to-b ${config.gradient}
                      border border-border hover:border-primary/50
                      transition-all duration-200
                      hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/10
                      active:scale-[0.98]
                      cursor-pointer
                      disabled:opacity-50 disabled:cursor-wait
                    `}
                  >
                    <span className="text-3xl">{config.emoji}</span>
                    <span className="font-semibold text-foreground">{config.label}</span>
                    <span className="text-xs text-muted-foreground">{config.desc}</span>
                  </button>
                );
              })}
            </div>
            {isGenerating && (
              <p className="text-sm text-primary animate-pulse mt-2">
                Generating puzzle...
              </p>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground/50">
            Use keyboard 1-9 to input • N for notes • Arrow keys to navigate
          </p>
        </div>
      </div>
    );
  }

  // --- Main game screen ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-4 bg-gradient-to-br from-background via-background to-[oklch(0.14_0.03_280)]">
      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Sudoku
      </h1>

      {/* Header: difficulty + timer + mistakes */}
      <GameHeader
        difficulty={difficulty}
        timer={timer}
        mistakes={mistakes}
        maxMistakes={MAX_MISTAKES}
        gameState={gameState}
      />

      {/* Board */}
      <SudokuBoard
        grid={grid}
        selectedCell={selectedCell}
        conflicts={conflicts}
        cellAnimations={cellAnimations}
        onCellClick={handleCellClick}
      />

      {/* Difficulty selector (compact, under board) */}
      <DifficultySelector
        selected={difficulty}
        onSelect={d => startGame(d)}
      />

      {/* Controls */}
      <GameControls
        onNewGame={() => startGame(difficulty)}
        onUndo={handleUndo}
        onHint={handleHint}
        canUndo={history.length > 0}
        disabled={gameState !== 'playing'}
      />

      {/* Number pad */}
      <NumberPad
        onNumberClick={placeNumber}
        onErase={handleErase}
        isNotesMode={isNotesMode}
        onToggleNotes={() => setIsNotesMode(prev => !prev)}
        numberCounts={numberCounts}
        disabled={gameState !== 'playing'}
      />

      {/* Game over overlay for max mistakes */}
      {gameState === 'paused' && mistakes >= MAX_MISTAKES && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card p-8 rounded-2xl border border-border text-center space-y-4 max-w-sm w-full shadow-2xl">
            <div className="text-4xl">😔</div>
            <h2 className="text-xl font-bold text-foreground">Game Over</h2>
            <p className="text-muted-foreground text-sm">
              You made {MAX_MISTAKES} mistakes. The solution has been revealed.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => startGame(difficulty)}
                className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/80 transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowDifficultyPicker(true)}
                className="w-full px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Change Difficulty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win dialog */}
      <WinDialog
        open={showWinDialog}
        onClose={() => setShowWinDialog(false)}
        onPlayAgain={() => startGame(difficulty)}
        onChangeDifficulty={() => {
          setShowWinDialog(false);
          setShowDifficultyPicker(true);
        }}
        difficulty={difficulty}
        time={timer}
        mistakes={mistakes}
      />
    </div>
  );
}
