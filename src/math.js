let REGION_WIDTH = 3;
let REGION_HEIGHT = 3;
let BOARD_WIDTH = 3;
let BOARD_HEIGHT = 3;
let CELLS_WIDTH = REGION_WIDTH * BOARD_WIDTH;
let CELLS_HEIGHT = REGION_HEIGHT * BOARD_HEIGHT;
let BOARD_CELLS = CELLS_WIDTH * CELLS_HEIGHT;
let REGION_CELLS = REGION_WIDTH * REGION_HEIGHT;

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

function _regionFromRegionIndex(index) {
  return Math.trunc(index / REGION_CELLS);
}

function _rowColFromRegionIndex(index) {
  const region = regionFromRegionIndex(index);
  const cell = index % REGION_CELLS;
  const regionRow = Math.trunc(region / BOARD_WIDTH);
  const regionCol = region % BOARD_WIDTH;
  const cellRow = Math.trunc(cell / REGION_WIDTH);
  const cellCol = cell % REGION_WIDTH;
  return [
    regionRow * REGION_WIDTH + cellRow,
    regionCol * REGION_HEIGHT + cellCol,
  ];
}

const _rowsFromIndex = Array(BOARD_CELLS);
const _colsFromIndex = Array(BOARD_CELLS);
const _regionsFromIndex = Array(BOARD_CELLS);
Array(BOARD_CELLS)
  .fill()
  .forEach((_, i) => {
    _regionsFromIndex[i] = _regionFromRegionIndex(i);
    const [row, col] = _rowColFromRegionIndex(i);
    _rowsFromIndex[i] = row;
    _colsFromIndex[i] = col;
  });

export function rowColFromRegionIndex(i) {
  return [_rowsFromIndex[i], _colsFromIndex[i]];
}

export function regionFromRegionIndex(i) {
  return _regionsFromIndex[i];
}

const _rowIndexToRegionIndex = Array(BOARD_CELLS);
const _regionIndexToRowIndex = Array(BOARD_CELLS)
  .fill()
  .map((_, regionIndex) => {
    const [row, col] = rowColFromRegionIndex(regionIndex);
    const rowIndex = row * CELLS_WIDTH + col;
    _rowIndexToRegionIndex[rowIndex] = regionIndex;
    return rowIndex;
  });

const _regionIndexToColIndex = Array(BOARD_CELLS);
const _colIndexToRegionIndex = Array(BOARD_CELLS)
  .fill()
  .map((_, columnIndex) => {
    const [row, col] = rowColFromRegionIndex(columnIndex);
    const regionIndex = col * CELLS_HEIGHT + row;
    _regionIndexToColIndex[regionIndex] = columnIndex;
    return regionIndex;
  });

export function regionIndexToRowIndex(index) {
  return _regionIndexToRowIndex[index];
}

export function rowIndexToRegionIndex(index) {
  return _rowIndexToRegionIndex[index];
}

export function regionIndexToColIndex(index) {
  return _regionIndexToColIndex[index];
}

export function colIndexToRegionIndex(index) {
  return _colIndexToRegionIndex[index];
}

function mapArray(array, indexes) {
  const newArr = Array(indexes.length);
  for (let i = 0, len = array.length; i < len; i++) {
    newArr[i] = array[indexes[i]];
  }
  return newArr;
}

export function chunkRegions(cells) {
  return chunkify(cells, REGION_CELLS);
}

export function regionsToRows(cells, split = false) {
  const rows = mapArray(cells, _regionIndexToRowIndex);
  return split ? chunkify(rows, CELLS_WIDTH) : rows;
}

export function regionsToCols(cells, split = false) {
  const cols = mapArray(cells, _regionIndexToColIndex);
  return split ? chunkify(cols, CELLS_HEIGHT) : cols;
}

export function rowsToRegions(cells, split = false) {
  const regions = mapArray(cells, _rowIndexToRegionIndex);
  return split ? chunkify(regions, REGION_CELLS) : regions;
}

export function colsToRegions(cells, split = false) {
  const regions = mapArray(cells, _colIndexToRegionIndex);
  return split ? chunkify(regions, REGION_CELLS) : regions;
}
