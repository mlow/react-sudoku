import { Cell } from "./types";

export function chunkify<T>(arr: T[], chunkSize: number) {
  const chunks = Array<T[]>(arr.length / chunkSize);
  for (let i = 0, len = chunks.length; i < len; i++) {
    const start = i * chunkSize;
    chunks[i] = arr.slice(start, start + chunkSize);
  }
  return chunks;
}

export function range(start: number, end: number) {
  return Array.from(Array(1 + end - start), (_, i) => start + i);
}

function mapArray<T>(array: T[], indexes: number[]) {
  const newArr = Array<T>(indexes.length);
  for (let i = 0, len = array.length; i < len; i++) {
    newArr[i] = array[indexes[i]];
  }
  return newArr;
}

export function clone(puzz: Cell[]) {
  return puzz.map(({ value }) => ({ value } as Cell));
}

function addCellValuesToSet(set: Set<number>, cells: Cell[]) {
  cells.forEach((cell) => {
    if (cell.value > 0) set.add(cell.value);
  });
  return set;
}

function _getTakenValues(region: Cell[], row: Cell[], col: Cell[]) {
  const filter = new Set<number>();
  addCellValuesToSet(filter, region);
  addCellValuesToSet(filter, row);
  addCellValuesToSet(filter, col);
  return filter;
}

export class SudokuMath {
  regionWidth: number;
  regionHeight: number;
  boardWidth: number;
  boardHeight: number;
  width: number;
  height: number;
  boardCells: number;
  regionCells: number;
  legalValues: number[];

  _regionsFromIndex: number[];
  _rowsFromIndex: number[];
  _colsFromIndex: number[];
  _rowIndexToRegionIndex: number[];
  _colIndexToRegionIndex: number[];
  _regionIndexToRowIndex: number[];
  _regionIndexToColIndex: number[];

  constructor(regionWidth: number, regionHeight: number) {
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

  _regionFromRegionIndex(index: number) {
    return Math.trunc(index / this.regionCells);
  }

  regionFromRegionIndex(i: number) {
    return this._regionsFromIndex[i];
  }

  _rowColFromRegionIndex(index: number) {
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

  rowColFromRegionIndex(i: number): [number, number] {
    return [this._rowsFromIndex[i], this._colsFromIndex[i]];
  }

  regionIndexToRowIndex(index: number) {
    return this._regionIndexToRowIndex[index];
  }

  rowIndexToRegionIndex(index: number) {
    return this._rowIndexToRegionIndex[index];
  }

  regionIndexToColIndex(index: number) {
    return this._regionIndexToColIndex[index];
  }

  colIndexToRegionIndex(index: number) {
    return this._colIndexToRegionIndex[index];
  }

  chunkRegions(cells: Cell[]) {
    return chunkify(cells, this.regionCells);
  }

  regionsToRows<T>(cells: T[], split = false) {
    const rows = mapArray(cells, this._regionIndexToRowIndex);
    return split ? chunkify(rows, this.width) : rows;
  }

  regionsToCols<T>(cells: T[], split = false) {
    const cols = mapArray(cells, this._regionIndexToColIndex);
    return split ? chunkify(cols, this.height) : cols;
  }

  rowsToRegions<T>(cells: T[], split = false) {
    const regions = mapArray(cells, this._rowIndexToRegionIndex);
    return split ? chunkify(regions, this.regionCells) : regions;
  }

  colsToRegions<T>(cells: T[], split = false) {
    const regions = mapArray(cells, this._colIndexToRegionIndex);
    return split ? chunkify(regions, this.regionCells) : regions;
  }

  getBlankPuzzle = () =>
    Array(this.boardCells)
      .fill(null)
      .map((value) => ({ value } as Cell));

  /**
   * Returns the remaining legal values given a set of taken values.
   *
   * @param taken a set of taken values
   */
  getLegalValues(taken: Set<number>) {
    return this.legalValues.filter((value) => !taken.has(value));
  }

  /**
   * Returns which values are unavailable at a given location, looking at the
   * row, column, and region of the given cell index.
   */
  getTakenValues(cell: number, cells: Cell[]) {
    const rows = this.regionsToRows(cells, true) as Cell[][];
    const cols = this.regionsToCols(cells, true) as Cell[][];
    const regions = this.chunkRegions(cells);
    const [row, col] = this.rowColFromRegionIndex(cell);
    const region = this.regionFromRegionIndex(cell);
    return _getTakenValues(regions[region], rows[row], cols[col]);
  }
}
