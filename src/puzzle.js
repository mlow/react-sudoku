import { shuffle } from "lodash";

const getBlankPuzzle = (sudokuMath) =>
  Array(sudokuMath.boardCells)
    .fill(null)
    .map((value) => ({ value }));

export function clone(puzz) {
  return puzz.map(({ value }) => ({ value }));
}

function addCellValuesToSet(set, cells, valueKeys) {
  cells.forEach((cell) => {
    valueKeys.forEach((key) => {
      if (!!cell[key]) set.add(cell[key]);
    });
  });
  return set;
}

function _getTakenValues(region, row, col, valueKeys = ["value"]) {
  const filter = new Set();
  addCellValuesToSet(filter, region, valueKeys);
  addCellValuesToSet(filter, row, valueKeys);
  addCellValuesToSet(filter, col, valueKeys);
  return filter;
}

function getLegalValues(sudokuMath, taken) {
  return sudokuMath.legalValues.filter((value) => !taken.has(value));
}

export function getTakenValues(sudokuMath, cell, cells, regions) {
  const rows = sudokuMath.regionsToRows(cells, true);
  const cols = sudokuMath.regionsToCols(cells, true);
  const [row, col] = sudokuMath.rowColFromRegionIndex(cell);
  const region = sudokuMath.regionFromRegionIndex(cell);
  return _getTakenValues(regions[region], rows[row], cols[col]);
}

/**
 * Returns whether a puzzle can only be solved one way.
 *
 * @param {SudokuMath} sudokuMath a SudokuMath instance
 * @param {[T]} puzzle
 */
export function hasOneSolution(sudokuMath, puzzle) {
  const optimistic = clone(puzzle);
  if (optimisticSolver(sudokuMath, optimistic)) {
    return true;
  }
  return backTrackingSolver(sudokuMath, optimistic) === 1;
}

/**
 * Generates a single-solution sudoku puzzle.
 *
 * @param {SudokuMath} sudokuMath a SudokuMath instance
 * @param {Integer} clues the number of cells to have pre-filled
 */
export function generatePuzzle(sudokuMath, clues) {
  const puzzle = getBlankPuzzle(sudokuMath);
  completeSolver(sudokuMath, puzzle, shuffle);
  const orig = clone(puzzle);

  const toRemove = puzzle.length - clues;
  let removed = [];
  let removeNext = shuffle(puzzle.map((_, i) => i));

  function remove(count) {
    const x = removeNext.shift();
    removed.push(x);
    puzzle[x].value = null;
  }

  function replace(count) {
    const x = removed.pop();
    removeNext.push(x);
    puzzle[x].value = orig[x].value;
  }

  function removeCell(check = true) {
    remove();
    if (hasOneSolution(sudokuMath, puzzle)) {
      return true;
    }
    replace();
    return false;
  }

  let fails = 0;
  while (removed.length < toRemove) {
    if (!removeCell()) {
      fails++;
    } else {
      fails = 0;
    }
    if (fails > removeNext.length) {
      fails = 0;
      console.log("Backstepping..");
      Array(removed.length)
        .fill()
        .forEach(() => replace());
      removeNext = shuffle(removeNext);
    }
  }

  return puzzle;
}

/**
 * Attempt to solve the puzzle "optimistically". Only sets values which are
 * certain, i.e. no guesses are made.
 *
 * Useful as a first pass.
 *
 * @param {SudokuMath} sudokuMath a SudokuMath instance
 * @param {*} puzzle a region-ordered array of cells (each cell an object with
 *   a `value` key.
 * @returns whether the puzzle was completely solved
 */
export function optimisticSolver(sudokuMath, puzzle) {
  const regions = sudokuMath.chunkRegions(puzzle);
  const rows = sudokuMath.regionsToRows(puzzle, true);
  const cols = sudokuMath.regionsToCols(puzzle, true);

  function solve() {
    let foundValue = false;
    let foundEmpty = false;

    for (let i = 0, len = puzzle.length; i < len; i++) {
      const cell = puzzle[i];
      if (!!cell.value) continue;
      foundEmpty = true;
      const region = sudokuMath.regionFromRegionIndex(i);
      const [row, col] = sudokuMath.rowColFromRegionIndex(i);
      const taken = _getTakenValues(regions[region], rows[row], cols[col]);
      if (taken.size === sudokuMath.regionCells - 1) {
        cell.value = getLegalValues(sudokuMath, taken)[0];
        foundValue = true;
      }
    }
    return foundValue && foundEmpty ? solve() : !foundEmpty;
  }

  return solve();
}

/**
 * Attempt to completely solve a puzzle. Can also be used to generate a full
 * puzzle. Less efficient than backtracking solver at finding solutions, but
 * more efficient if you only want *one* solution.
 *
 * @param {SudokuMath} sudokuMath a SudokuMath instance
 * @param {[T]} puzzle see optimisticSolver
 * @param {Function} guessStrategy a function which takes an array of possible
 *  values for a cell as an argument, and either re-orders/shuffles them, or
 *  returns the array unmodified.
 *
 */
export function completeSolver(
  sudokuMath,
  puzzle,
  guessStrategy = (values) => values
) {
  const takenKeys = ["value", "guess"];
  const regions = sudokuMath.chunkRegions(puzzle);
  const rows = sudokuMath.regionsToRows(puzzle, true);
  const cols = sudokuMath.regionsToCols(puzzle, true);

  function solve(i) {
    if (i === puzzle.length) {
      return true;
    }

    const cell = puzzle[i];
    if (!!cell.value) return solve(i + 1);

    const region = sudokuMath.regionFromRegionIndex(i);
    const [row, col] = sudokuMath.rowColFromRegionIndex(i);
    const taken = _getTakenValues(
      regions[region],
      rows[row],
      cols[col],
      takenKeys
    );

    // no available values, give up this branch
    if (taken.size === sudokuMath.regionCells) return false;

    const avail = guessStrategy(getLegalValues(sudokuMath, taken));
    for (const guess of avail) {
      // clear all guesses after i
      for (let j = i + 1; j < puzzle.length; j++) {
        delete puzzle[j].guess;
      }

      puzzle[i].guess = guess;

      // if this guess worked (reached end of puzzle) we conclude
      if (solve(i + 1)) {
        return true;
      }
    }

    // no guess worked
    // upper branch will try next guess, or this is an impossible puzzle
    return false;
  }

  const result = solve(0);
  puzzle.forEach((cell) => {
    if (!!cell.guess) {
      cell.value = cell.guess;
      delete cell.guess;
    }
  });
  return result;
}

/**
 * Backtracking solver. Mutates the puzzle during solve but eventually returns
 * it to its initial state.
 *
 * @param {SudokuMath} sudokuMath a SudokuMath instance
 * @param {[T]} puzzle see optimisticSolver
 * @returns the number of solutions found
 */
export function backTrackingSolver(sudokuMath, puzzle) {
  const regions = sudokuMath.chunkRegions(puzzle);
  const rows = sudokuMath.regionsToRows(puzzle, true);
  const cols = sudokuMath.regionsToCols(puzzle, true);

  let solutions = 0;
  function solve() {
    for (let i = 0, len = puzzle.length; i < len; i++) {
      const cell = puzzle[i];
      if (!cell.value) {
        const region = sudokuMath.regionFromRegionIndex(i);
        const [row, col] = sudokuMath.rowColFromRegionIndex(i);
        const taken = _getTakenValues(regions[region], rows[row], cols[col]);
        const avail = getLegalValues(sudokuMath, taken);
        for (let j = 0; j < avail.length; j++) {
          cell.value = avail[j];
          solve();
          cell.value = null;
        }
        return;
      }
    }
    solutions++;
  }

  solve();

  return solutions;
}
