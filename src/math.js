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
}
