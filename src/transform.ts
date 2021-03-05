type Cell = {
  value: number;
};

export function chunkify<T>(arr: T[], chunkSize: number) {
  const chunks = Array<T[]>(arr.length / chunkSize);
  for (let i = 0, len = chunks.length; i < len; i++) {
    const start = i * chunkSize;
    chunks[i] = arr.slice(start, start + chunkSize);
  }
  return chunks;
}

export function range(start: number, end: number) {
  return Array.from(Array(end - start), (_, i) => start + i);
}

function mapArray<T>(array: T[], indexes: number[]) {
  const newArr = Array<T>(indexes.length);
  for (let i = 0, len = array.length; i < len; i++) {
    newArr[indexes[i]] = array[i];
  }
  return newArr;
}

function addCellValuesToSet<T extends Cell>(set: Set<number>, cells: T[]) {
  cells.forEach((cell) => {
    if (cell.value > 0) set.add(cell.value);
  });
  return set;
}

function _getTakenValues<T extends Cell>(region: T[], row: T[], col: T[]) {
  const filter = new Set<number>();
  addCellValuesToSet(filter, region);
  addCellValuesToSet(filter, row);
  addCellValuesToSet(filter, col);
  return filter;
}

export class SudokuTransform {
  regionWidth: number;
  regionHeight: number;
  length: number;
  area: number;
  values: number[];

  _rowIndexToRegionIndex: number[];
  _colIndexToRegionIndex: number[];
  _regionIndexToRowIndex: number[];
  _regionIndexToColIndex: number[];
  _rowColFromRegionIndex: [number, number][];

  constructor(regionWidth: number, regionHeight: number) {
    this.regionWidth = regionWidth;
    this.regionHeight = regionHeight;
    this.length = regionWidth * regionHeight;
    this.area = this.length * this.length;
    this.values = range(1, this.length + 1);

    this._rowIndexToRegionIndex = Array(this.area);
    this._colIndexToRegionIndex = Array(this.area);
    this._regionIndexToRowIndex = Array(this.area);
    this._regionIndexToColIndex = Array(this.area);

    this._rowColFromRegionIndex = Array(this.area);

    for (let rowIdx = 0; rowIdx < this.area; rowIdx++) {
      const row = Math.trunc(rowIdx / this.length);
      const column = rowIdx % this.length;
      const region =
        Math.trunc(row / regionHeight) * regionHeight +
        Math.trunc(column / regionWidth);

      const columnIdx = column * this.length + row;
      const regionIdx =
        region * this.length +
        (row % regionHeight) * regionWidth +
        (column % regionWidth);

      this._rowIndexToRegionIndex[rowIdx] = regionIdx;
      this._colIndexToRegionIndex[columnIdx] = regionIdx;
      this._regionIndexToRowIndex[regionIdx] = rowIdx;
      this._regionIndexToColIndex[regionIdx] = columnIdx;
      this._rowColFromRegionIndex[regionIdx] = [row, column];
    }
  }

  regionFromRegionIndex(idx: number) {
    return Math.trunc(idx / this.length);
  }

  rowColFromRegionIndex(idx: number): [number, number] {
    return this._rowColFromRegionIndex[idx];
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

  chunkRegions<T>(cells: T[]) {
    return chunkify(cells, this.length);
  }

  regionsToRows<T>(cells: T[]) {
    return mapArray(cells, this._regionIndexToRowIndex);
  }

  regionsToCols<T>(cells: T[]) {
    return mapArray(cells, this._regionIndexToColIndex);
  }

  rowsToRegions<T>(cells: T[]) {
    return mapArray(cells, this._rowIndexToRegionIndex);
  }

  colsToRegions<T>(cells: T[], split = false) {
    const regions = mapArray(cells, this._colIndexToRegionIndex);
    return split ? chunkify(regions, this.length) : regions;
  }

  getBlankPuzzle = () => range(0, this.area).map((value) => ({ value }));

  /**
   * Returns the remaining legal values given a set of taken values.
   *
   * @param taken a set of taken values
   */
  getLegalValues(taken: Set<number>) {
    return this.values.filter((value) => !taken.has(value));
  }

  /**
   * Returns which values are unavailable at a given location, looking at the
   * row, column, and region of the given cell index.
   */
  getTakenValues<T extends Cell>(idx: number, cells: T[]) {
    const rows = chunkify(this.regionsToRows(cells), this.length);
    const cols = chunkify(this.regionsToCols(cells), this.length);
    const regions = this.chunkRegions(cells);
    const [row, col] = this.rowColFromRegionIndex(idx);
    const region = this.regionFromRegionIndex(idx);
    return _getTakenValues(regions[region], rows[row], cols[col]);
  }
}
