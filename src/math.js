const { shuffle } = require("lodash");

export function chunkify(arr, chunkSize) {
  const chunks = Array(arr.length / chunkSize);
  for (let i = 0, len = chunks.length; i < len; i++) {
    const start = i * chunkSize;
    chunks[i] = arr.slice(start, start + chunkSize);
  }
  return chunks;
}

export function range(start, end) {
  return Array(1 + end - start)
    .fill()
    .map((_, i) => start + i);
}

function mapArray(array, indexes) {
  const newArr = Array(indexes.length);
  for (let i = 0, len = array.length; i < len; i++) {
    newArr[i] = array[indexes[i]];
  }
  return newArr;
}

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

export class SudokuMath {
  constructor(regionWidth, regionHeight) {
    this.regionWidth = regionWidth;
    this.regionHeight = regionHeight;
    this.boardWidth = regionHeight;
    this.boardHeight = regionWidth;
    this.width = regionWidth * this.boardWidth;
    this.height = regionHeight * this.boardHeight;
    this.boardCells = this.width * this.height;
    this.regionCells = regionWidth * regionHeight;
    this.legalValues = range(1, this.regionCells);

    this._regionsFromIndex = Array(this.boardCells);
    this._rowsFromIndex = Array(this.boardCells);
    this._colsFromIndex = Array(this.boardCells);
    this._rowIndexToRegionIndex = Array(this.boardCells);
    this._colIndexToRegionIndex = Array(this.boardCells);
    this._regionIndexToRowIndex = Array(this.boardCells);
    this._regionIndexToColIndex = Array(this.boardCells);

    for (let i = 0; i < this.boardCells; i++) {
      this._regionsFromIndex[i] = this._regionFromRegionIndex(i);

      const [row, col] = this._rowColFromRegionIndex(i);
      this._rowsFromIndex[i] = row;
      this._colsFromIndex[i] = col;

      const rowIndex = row * this.width + col;
      const colIndex = col * this.height + row;
      this._rowIndexToRegionIndex[rowIndex] = i;
      this._colIndexToRegionIndex[i] = rowIndex;
      this._regionIndexToRowIndex[i] = rowIndex;
      this._regionIndexToColIndex[colIndex] = i;
    }
  }

  _regionFromRegionIndex(index) {
    return Math.trunc(index / this.regionCells);
  }

  regionFromRegionIndex(i) {
    return this._regionsFromIndex[i];
  }

  _rowColFromRegionIndex(index) {
    const region = this.regionFromRegionIndex(index);
    const cell = index % this.regionCells;
    const regionRow = Math.trunc(region / this.boardWidth);
    const regionCol = region % this.boardWidth;
    const cellRow = Math.trunc(cell / this.regionWidth);
    const cellCol = cell % this.regionWidth;
    return [
      regionRow * this.regionHeight + cellRow,
      regionCol * this.regionWidth + cellCol,
    ];
  }

  rowColFromRegionIndex(i) {
    return [this._rowsFromIndex[i], this._colsFromIndex[i]];
  }

  regionIndexToRowIndex(index) {
    return this._regionIndexToRowIndex[index];
  }

  rowIndexToRegionIndex(index) {
    return this._rowIndexToRegionIndex[index];
  }

  regionIndexToColIndex(index) {
    return this._regionIndexToColIndex[index];
  }

  colIndexToRegionIndex(index) {
    return this._colIndexToRegionIndex[index];
  }

  chunkRegions(cells) {
    return chunkify(cells, this.regionCells);
  }

  regionsToRows(cells, split = false) {
    const rows = mapArray(cells, this._regionIndexToRowIndex);
    return split ? chunkify(rows, this.width) : rows;
  }

  regionsToCols(cells, split = false) {
    const cols = mapArray(cells, this._regionIndexToColIndex);
    return split ? chunkify(cols, this.height) : cols;
  }

  rowsToRegions(cells, split = false) {
    const regions = mapArray(cells, this._rowIndexToRegionIndex);
    return split ? chunkify(regions, this.regionCells) : regions;
  }

  colsToRegions(cells, split = false) {
    const regions = mapArray(cells, this._colIndexToRegionIndex);
    return split ? chunkify(regions, this.regionCells) : regions;
  }

  getBlankPuzzle = () =>
    Array(this.boardCells)
      .fill(null)
      .map((value) => ({ value }));

  getLegalValues(taken) {
    return this.legalValues.filter((value) => !taken.has(value));
  }

  /**
   * Returns which values are unavailable at a given location, looking at the
   * row, column, and region of the given cell index.
   *
   * @param {k} cell
   * @param {*} cells
   * @param {*} regions
   */
  getTakenValues(cell, cells, regions) {
    const rows = this.regionsToRows(cells, true);
    const cols = this.regionsToCols(cells, true);
    const [row, col] = this.rowColFromRegionIndex(cell);
    const region = this.regionFromRegionIndex(cell);
    return _getTakenValues(regions[region], rows[row], cols[col]);
  }

  /**
   * Returns whether a puzzle can only be solved one way.
   *
   * @param {[T]} puzzle
   */
  hasOneSolution(puzzle) {
    const optimistic = clone(puzzle);
    if (this.optimisticSolver(optimistic)) {
      return true;
    }
    return this.backTrackingSolver(optimistic) === 1;
  }

  /**
   * Generates a single-solution sudoku puzzle.
   *
   * @param {Integer} clues the number of cells to have pre-filled
   */
  generatePuzzle(clues) {
    const puzzle = this.getBlankPuzzle();
    console.log("hi", this);
    this.completeSolver(puzzle, shuffle);

    if (clues >= puzzle.length) return puzzle;

    const orig = clone(puzzle);

    const toRemove = puzzle.length - clues;
    let removed = [];
    let removeNext = shuffle(puzzle.map((_, i) => i));

    const remove = (count) => {
      const x = removeNext.shift();
      removed.push(x);
      puzzle[x].value = null;
    };

    const replace = (count) => {
      const x = removed.pop();
      removeNext.push(x);
      puzzle[x].value = orig[x].value;
    };

    const removeCell = (check = true) => {
      remove();
      if (this.hasOneSolution(puzzle)) {
        return true;
      }
      replace();
      return false;
    };

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
  optimisticSolver(puzzle) {
    const regions = this.chunkRegions(puzzle);
    const rows = this.regionsToRows(puzzle, true);
    const cols = this.regionsToCols(puzzle, true);

    const solve = () => {
      let foundValue = false;
      let foundEmpty = false;

      for (let i = 0, len = puzzle.length; i < len; i++) {
        const cell = puzzle[i];
        if (!!cell.value) continue;
        foundEmpty = true;
        const region = this.regionFromRegionIndex(i);
        const [row, col] = this.rowColFromRegionIndex(i);
        const taken = _getTakenValues(regions[region], rows[row], cols[col]);
        if (taken.size === this.regionCells - 1) {
          cell.value = this.getLegalValues(taken)[0];
          foundValue = true;
        }
      }
      return foundValue && foundEmpty ? solve() : !foundEmpty;
    };

    return solve();
  }

  /**
   * Attempt to completely solve a puzzle. Can also be used to generate a full
   * puzzle. Less efficient than backtracking solver at finding solutions, but
   * more efficient if you only want *one* solution.
   *
   * @param {[T]} puzzle see optimisticSolver
   * @param {Function} guessStrategy a function which takes an array of possible
   *  values for a cell as an argument, and either re-orders/shuffles them, or
   *  returns the array unmodified.
   *
   */
  completeSolver(puzzle, guessStrategy = (values) => values) {
    const takenKeys = ["value", "guess"];
    const regions = this.chunkRegions(puzzle);
    const rows = this.regionsToRows(puzzle, true);
    const cols = this.regionsToCols(puzzle, true);

    const solve = (i) => {
      if (i === puzzle.length) {
        return true;
      }

      const cell = puzzle[i];
      if (!!cell.value) return solve(i + 1);

      const region = this.regionFromRegionIndex(i);
      const [row, col] = this.rowColFromRegionIndex(i);
      const taken = _getTakenValues(
        regions[region],
        rows[row],
        cols[col],
        takenKeys
      );

      // no available values, give up this branch
      if (taken.size === this.regionCells) return false;

      const avail = guessStrategy(this.getLegalValues(taken));
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
    };

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
   * @param {[T]} puzzle see optimisticSolver
   * @returns the number of solutions found
   */
  backTrackingSolver(puzzle) {
    const regions = this.chunkRegions(puzzle);
    const rows = this.regionsToRows(puzzle, true);
    const cols = this.regionsToCols(puzzle, true);

    let solutions = 0;
    const solve = () => {
      for (let i = 0, len = puzzle.length; i < len; i++) {
        const cell = puzzle[i];
        if (!cell.value) {
          const region = this.regionFromRegionIndex(i);
          const [row, col] = this.rowColFromRegionIndex(i);
          const taken = _getTakenValues(regions[region], rows[row], cols[col]);
          const avail = this.getLegalValues(taken);
          for (let j = 0; j < avail.length; j++) {
            cell.value = avail[j];
            solve();
            cell.value = null;
          }
          return;
        }
      }
      solutions++;
    };

    solve();

    return solutions;
  }
}
