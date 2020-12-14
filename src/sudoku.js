import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";
import { splitIntoRegions } from "./math";
import "./sudoku.css";

const Cell = ({ onClick, cell }) => {
  return (
    <button
      onClick={onClick}
      disabled={cell.disabled}
      className={classNames("cell", {
        selected: cell.selected,
      })}
    >
      {cell.value}
    </button>
  );
};

const Region = ({ ordinal, cells, onClick = () => {} }) => (
  <div className="region">
    {cells.map((cell, i) => {
      const cellIndex = ordinal * 9 + i;
      return (
        <Cell
          key={`${ordinal}-${i}`}
          cell={cell}
          onClick={() => onClick(cellIndex)}
        />
      );
    })}
  </div>
);

const Board = (props) => (
  <div className="board">
    {splitIntoRegions(props.cells).map((region, i) => (
      <Region {...props} key={i} ordinal={i} cells={region} />
    ))}
  </div>
);

export const Sudoku = () => {
  const [cells, setCells] = useState(
    Array(81)
      .fill()
      .map(() => ({}))
  );
  const [selected, setSelected] = useState(undefined);
  const board = useRef(null);
  const input = useRef(null);

  const handleSelect = (index) => {
    if (selected !== undefined) handleUnselect(false);
    cells[index].selected = true;
    setCells(cells.slice());
    setSelected(index);
  };

  const handleUnselect = (update = true) => {
    if (selected === undefined) return;
    delete cells[selected].selected;
    if (update) setCells(cells.slice());
    setSelected(undefined);
  };

  const handleSetValue = (value) => {
    if (selected !== undefined && cells[selected].value !== value) {
      cells[selected].value = value;
      setCells(cells.slice());
    }
  };

  useWindowClickListener(({ target }) => {
    if (![board, input].some(({ current }) => current.contains(target))) {
      // unselect our current cell when outside of board clicked
      handleUnselect();
    }
  });

  const boardEvents = {
    onClick: (index) => {
      handleSelect(index);
    },
  };

  const inputEvents = {
    onClick: (index) => {
      handleSetValue(index + 1);
    },
  };

  return (
    <div className="game">
      <div ref={board}>
        <Board cells={cells} {...boardEvents} />
      </div>
      <div ref={input} className="input-area">
        <div className="input">
          <Region
            ordinal={0}
            cells={range(1, 9).map((x) => ({ value: x }))}
            {...inputEvents}
          />
        </div>
        <button onClick={() => handleSetValue(null)}>Clear</button>
      </div>
    </div>
  );
};

function useWindowClickListener(func) {
  useEffect(() => {
    window.addEventListener("click", func);
    return () => window.removeEventListener("click", func);
  });
}

// Return array from start to end, inclusive
function range(start, end) {
  return Array(1 + end - start)
    .fill()
    .map((_, i) => start + i);
}
