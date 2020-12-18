import {
  rowColFromRegionIndex,
  regionFromRegionIndex,
  regionsToCols,
  regionsToRows,
  chunkRegions,
  range,
} from "./math.js";
import { shuffle } from "lodash";

const getBlankPuzzle = () =>
  Array(81)
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

const values = range(1, 9);

function getLegalValues(taken) {
  return values.filter((value) => !taken.has(value));
}

export function getTakenValues(cell, cells, regions) {
  const rows = regionsToRows(cells, true);
  const cols = regionsToCols(cells, true);
  const [row, col] = rowColFromRegionIndex(cell);
  const region = regionFromRegionIndex(cell);
  return _getTakenValues(regions[region], rows[row], cols[col]);
}

/**
 * Returns whether a puzzle can only be solved one way.
 * @param {[T]} puzzle
 */
export function hasOneSolution(puzzle) {
  const optimistic = clone(puzzle);
  if (optimisticSolver(optimistic)) {
    return true;
  }
  return backTrackingSolver(optimistic) === 1;
}

/**
 * Generates a single-solution sudoku puzzle.
 * @param {Integer} clues the number of cells to have pre-filled
 */
export function generatePuzzle(clues) {
  const puzzle = getBlankPuzzle();
  completeSolver(puzzle, shuffle);
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
    if (hasOneSolution(puzzle)) {
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
 * @param {*} puzzle a region-ordered array of cells (each cell an object with
 *   a `value` key.
 * @returns whether the puzzle was completely solved
 */
export function optimisticSolver(puzzle) {
  const regions = chunkRegions(puzzle);
  const rows = regionsToRows(puzzle, true);
  const cols = regionsToCols(puzzle, true);

  function solve() {
    let foundValue = false;
    let foundEmpty = false;

    for (let i = 0, len = puzzle.length; i < len; i++) {
      const cell = puzzle[i];
      if (!!cell.value) continue;
      foundEmpty = true;
      const region = regionFromRegionIndex(i);
      const [row, col] = rowColFromRegionIndex(i);
      const taken = _getTakenValues(regions[region], rows[row], cols[col]);
      if (taken.size === 8) {
        cell.value = getLegalValues(taken)[0];
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
 * @param {[T]} puzzle see optimisticSolver
 * @param {Function} guessStrategy a function which takes an array of possible
 *  values for a cell as an argument, and either re-orders/shuffles them, or
 *  returns the array unmodified.
 *
 */
export function completeSolver(puzzle, guessStrategy = (val) => val) {
  const takenKeys = ["value", "guess"];
  const regions = chunkRegions(puzzle);
  const rows = regionsToRows(puzzle, true);
  const cols = regionsToCols(puzzle, true);

  function solve(i) {
    if (i === puzzle.length) {
      return true;
    }

    const cell = puzzle[i];
    if (!!cell.value) return solve(i + 1);

    const region = regionFromRegionIndex(i);
    const [row, col] = rowColFromRegionIndex(i);
    const taken = _getTakenValues(
      regions[region],
      rows[row],
      cols[col],
      takenKeys
    );

    // no available values, give up this branch
    if (taken.size === 9) return false;

    const avail = guessStrategy(getLegalValues(taken));
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
 * @param {[T]} puzzle see optimisticSolver
 * @returns the number of solutions found
 */
export function backTrackingSolver(puzzle) {
  const regions = chunkRegions(puzzle);
  const rows = regionsToRows(puzzle, true);
  const cols = regionsToCols(puzzle, true);

  let solutions = 0;
  function solve() {
    for (let i = 0, len = puzzle.length; i < len; i++) {
      const cell = puzzle[i];
      if (!cell.value) {
        const region = regionFromRegionIndex(i);
        const [row, col] = rowColFromRegionIndex(i);
        const taken = _getTakenValues(regions[region], rows[row], cols[col]);
        const avail = getLegalValues(taken);
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
