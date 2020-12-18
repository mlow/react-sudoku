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

const DIFFICULTY_CLUES = [38, 30, 25, 23];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

function generate(difficulty) {
  return generatePuzzle(DIFFICULTY_CLUES[difficulty]).map(({ value }) => ({
    value,
    disabled: !!value,
  }));
}

export const Sudoku = () => {
  const [difficulty, setDifficulty] = useState(1);
  const [cells, setCells] = useState(() => generate(difficulty));
  const [selected, setSelected] = useState(undefined);
  const [showHints, setShowHints] = useState(false);
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
    if (selected === undefined || !showHints) return ALL_VALUES;

    const takenValues = getTakenValues(selected, cells, regions);
    return ALL_VALUES.map(({ value }) => ({
      value,
      disabled: takenValues.has(value),
    }));
  };

  const handleDifficultySelect = (e) => {
    setDifficulty(parseInt(e.target.value));
  };

  function handleReset() {
    if (window.confirm("Are you sure you want to reset the puzzle?")) {
      setCells(
        cells.map(({ value, disabled }) => ({
          value: disabled ? value : null,
          disabled,
        }))
      );
    }
  }

  function handleRegenerate() {
    if (window.confirm("Are you sure you want to regenerate the puzzle?")) {
      setCells(generate(difficulty));
      setSelected(undefined);
    }
  }

  function handleShowHintCheckbox() {
    setShowHints(!showHints);
  }

  return (
    <div className="game">
      <div ref={board}>
        <Board regions={regions} selected={selected} onClick={setSelected} />
      </div>
      <div className="settings" ref={input}>
        <select
          className="setting"
          defaultValue={difficulty}
          onChange={handleDifficultySelect}
        >
          {DIFFICULTIES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
        <button onClick={handleRegenerate}>Regenerate</button>
        <Input cells={getInputCells()} onInput={handleSetValue} />
        <button onClick={handleReset}>Reset</button>
        <div>
          <input
            type="checkbox"
            name="hints"
            checked={showHints}
            onChange={handleShowHintCheckbox}
          ></input>
          <label for="hints"> Hints?</label>
        </div>
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
