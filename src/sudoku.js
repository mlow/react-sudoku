import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";
import { chunkRegions, range } from "./math.js";
import { generatePuzzle, getTakenValues } from "./puzzle.js";
import "./sudoku.css";

const Cell = React.memo(({ onClick, index, selected, disabled, value }) => (
  <button
    onClick={() => onClick(index)}
    disabled={disabled}
    className={classNames("cell", {
      selected: !!selected,
    })}
  >
    {value}
  </button>
));

const Region = ({ ordinal, selected, cells, onClick }) => (
  <div className="region">
    {cells.map((cell, i) => {
      const index = ordinal * 9 + i;
      return (
        <Cell
          key={`${ordinal}-${i}`}
          onClick={onClick}
          index={index}
          selected={index === selected}
          {...cell}
        />
      );
    })}
  </div>
);

const Board = (props) => (
  <div className="board">
    {props.regions.map((region, i) => (
      <Region {...props} key={i} ordinal={i} cells={region} />
    ))}
  </div>
);

const Input = ({ cells, onInput }) => (
  <div className="input-area">
    <div className="input">
      <Region ordinal={0} cells={cells} onClick={(i) => onInput(i + 1)} />
    </div>
    <button onClick={() => onInput(null)}>Erase</button>
  </div>
);

const ALL_VALUES = range(1, 9).map((value) => ({ value }));

const DIFFICULTIES = {
  easy: 38,
  medium: 30,
  hard: 25,
  expert: 23,
};

export const Sudoku = () => {
  const [difficulty] = useState(DIFFICULTIES.easy);
  const [cells, setCells] = useState(() =>
    generatePuzzle(difficulty).map(({ value }) => ({
      value,
      disabled: !!value,
    }))
  );
  const [selected, setSelected] = useState(undefined);
  const board = useRef(null);
  const input = useRef(null);

  useWindowClickListener(({ target }) => {
    if (![board, input].some(({ current }) => current.contains(target))) {
      // unselect our current cell when outside of board clicked
      setSelected(undefined);
    }
  });

  const handleSetValue = (value) => {
    if (selected !== undefined && cells[selected].value !== value) {
      cells[selected].value = value;
      setCells(cells.slice());
    }
  };

  const regions = chunkRegions(cells);
  const getInputCells = () => {
    if (selected === undefined) return ALL_VALUES;

    const takenValues = getTakenValues(selected, cells, regions);
    return ALL_VALUES.map(({ value }) => ({
      value,
      disabled: takenValues.has(value),
    }));
  };

  return (
    <div className="game">
      <div ref={board}>
        <Board regions={regions} selected={selected} onClick={setSelected} />
      </div>
      <div ref={input}>
        <Input cells={getInputCells()} onInput={handleSetValue} />
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
