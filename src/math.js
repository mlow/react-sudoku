let REGION_WIDTH = 3;
let REGION_HEIGHT = 3;
let BOARD_WIDTH = 3;
let BOARD_HEIGHT = 3;
let REGION_CELLS = REGION_WIDTH * REGION_HEIGHT;

const getRowOffset = (row) =>
  Math.trunc(row / REGION_HEIGHT) * BOARD_WIDTH * REGION_CELLS +
  (row % REGION_HEIGHT) * REGION_WIDTH;

const getColOffset = (col) =>
  Math.trunc(col / REGION_WIDTH) * REGION_CELLS + (col % REGION_WIDTH);

// colOffset and rowOffset caches
const rowOffsets = Array(REGION_HEIGHT * BOARD_HEIGHT)
  .fill()
  .map((_, row) => getRowOffset(row));

const colOffsets = Array(REGION_WIDTH * REGION_HEIGHT)
  .fill()
  .map((_, col) => getColOffset(col));

const getOffset = (row, col) => rowOffsets[row] + colOffsets[col];

export function splitIntoRows(cells) {
  const rows = Array(REGION_HEIGHT * BOARD_HEIGHT).fill([]);
  rows.forEach((row, rowIndex) => {
    for (let col = 0; col < REGION_WIDTH * BOARD_WIDTH; col++)
      row[col] = cells[getOffset(row, col)];
  });
  return rows;
}

export function splitIntoCols(cells) {
  const cols = Array(REGION_HEIGHT * BOARD_HEIGHT).fill([]);
  cols.forEach((col, colIndex) => {
    for (let row = 0; row < REGION_HEIGHT * BOARD_HEIGHT; row++)
      col[row] = cells[getOffset(row, col)];
  });
  return cols;
}

export function splitIntoRegions(cells) {
  return Array(BOARD_HEIGHT * BOARD_WIDTH)
    .fill()
    .map((_, index) =>
      cells.slice(index * REGION_CELLS, index * REGION_CELLS + REGION_CELLS)
    );
}
