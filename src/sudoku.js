import React, { useState, useEffect, useRef } from "react";
import classNames from "classnames";
import { chunkRegions, range } from "./math.js";
import { getPuzzle, getLegalValues } from "./puzzle.js";
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
    {props.regions.map((region, i) => (
      <Region {...props} key={i} ordinal={i} cells={region} />
    ))}
  </div>
);

const Input = ({ cells, onInput }) => {
  return (
    <div className="input-area">
      <div className="input">
        <Region ordinal={0} cells={cells} onClick={(i) => onInput(i + 1)} />
      </div>
      <button onClick={() => onInput(null)}>Erase</button>
    </div>
  );
};

const allInputValues = range(1, 9).map((value) => ({ value }));

export const Sudoku = () => {
  const [cells, setCells] = useState(
    getPuzzle().map((value) => ({
      value,
      disabled: !!value,
    }))
  );
  const regions = chunkRegions(cells);

  const [selected, setSelected] = useState(undefined);
  const [legalValues, setLegalValues] = useState(allInputValues);
  const board = useRef(null);
  const input = useRef(null);

  useWindowClickListener(({ target }) => {
    if (![board, input].some(({ current }) => current.contains(target))) {
      // unselect our current cell when outside of board clicked
      handleUnselect();
    }
  });

  const handleSelect = (index) => {
    if (selected !== undefined) handleUnselect(false);
    cells[index].selected = true;
    setCells(cells.slice());
    setSelected(index);
    setLegalValues(_getLegalValues(index));
  };

  const handleUnselect = (update = true) => {
    if (selected === undefined) return;
    delete cells[selected].selected;
    if (update) setCells(cells.slice());
    setSelected(undefined);
    setLegalValues(allInputValues);
  };

  const handleSetValue = (value) => {
    if (selected !== undefined && cells[selected].value !== value) {
      cells[selected].value = value;
      setCells(cells.slice());
      setLegalValues(_getLegalValues(selected));
    }
  };

  const _getLegalValues = (selected) => {
    if (selected === undefined) return range(1, 9).map((value) => ({ value }));

    const legalMoves = getLegalValues(selected, cells, regions);
    return range(1, 9).map((x) => ({
      value: x,
      disabled: legalMoves.has(x),
    }));
  };

  useWindowClickListener(({ target }) => {
    if (![board, input].some(({ current }) => current.contains(target))) {
      // unselect our current cell when outside of board clicked
      handleUnselect();
    }
  });

  return (
    <div className="game">
      <div ref={board}>
        <Board regions={regions} onClick={handleSelect} />
      </div>
      <div ref={input}>
        <Input cells={legalValues} onInput={handleSetValue} />
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
