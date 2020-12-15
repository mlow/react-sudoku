import {
  rowColFromRegionIndex,
  regionFromRegionIndex,
  rowsToRegions,
  regionsToCols,
  regionsToRows,
} from "./math";

// prettier-ignore
const puzzle = [
  null, null, null,   null,    5, null,      9,    2, null,
     1, null, null,   null,    4, null,      7,    6,    3,
     9, null,    2,   null, null,    7,   null, null,    5,

  null, null, null,   null, null,    3,      1,    5,    7,
  null,    5, null,      6, null,    9,   null,    8, null,
  null, null, null,      5,    7, null,   null, null, null,

     5, null, null,   null,    9,    8,      6, null,    2,
  null,    2,    7,      3, null,    1,   null, null,    9,
  null,    4,    9,      7, null, null,      8,    3, null
];

export function getPuzzle() {
  // TODO: either generate or use some public API
  return rowsToRegions(puzzle);
}

export function getLegalValues(cell, cells, regions = null) {
  const rows = regionsToRows(cells, true);
  const cols = regionsToCols(cells, true);
  const [row, col] = rowColFromRegionIndex(cell);
  const region = regionFromRegionIndex(cell);
  const filter = new Set();
  rows[row]
    .concat(cols[col])
    .concat(regions[region])
    .forEach(({ value }) => {
      filter.add(value);
    });
  return filter;
}
