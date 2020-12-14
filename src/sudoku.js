import React, { useState, useEffect, useRef } from "react";
import { splitIntoRegions } from "./math";
import "./sudoku.css";

const Cell = (props) => (
  <button {...props} className="cell">
    {props.value}
  </button>
);

const Region = ({ ordinal, cells, onClick = () => {} }) => (
  <div className="region">
    {cells.map((cell, i) => {
      const cellIndex = ordinal * 9 + i;
      return (
        <Cell
          key={`${ordinal}-${i}`}
          value={cell}
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
  const [cells, setCells] = useState(Array(81).fill(null));
  const [selected, setSelected] = useState(undefined);
  const board = useRef(null);
  const input = useRef(null);

  useWindowClickListener(({ target }) => {
    if (![board, input].some(({ current }) => current.contains(target))) {
      // unselect our current cell when outside of board clicked
      setSelected(undefined);
    }
  });

  const boardEvents = {
    onClick: (index) => {
      setSelected(index);
    },
  };

  const inputEvents = {
    onClick: (index) => {
      cells[selected] = index + 1;
      setCells(cells.slice());
    },
  };

  return (
    <div className="game">
      <div ref={board}>
        <Board cells={cells} {...boardEvents} />
      </div>
      <div ref={input} className="input">
        <Region ordinal={0} cells={range(1, 9)} {...inputEvents} />
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
