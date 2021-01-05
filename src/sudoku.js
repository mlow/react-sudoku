import React, { useState, useEffect, useMemo, useRef } from "react";
import classNames from "classnames";
import { range, SudokuMath } from "./math.js";
import {
  completeSolver,
  generatePuzzle,
  getTakenValues,
  optimisticSolver,
} from "./puzzle.js";
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

function formatElapsedMilliseconds(ms) {
  const hours = String(Math.floor(ms / (3600 * 1000))).padStart(2, "0");
  const minutes = String(Math.floor((ms / (60 * 1000)) % 60)).padStart(2, "0");
  const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
  const deciseconds = String(Math.floor(ms / 100) % 10);
  return `${hours}:${minutes}:${seconds}.${deciseconds}`;
}

const Timer = ({ start }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - start), 50);
    return () => clearInterval(timer);
  }, [start]);
  return <span className="timer">{formatElapsedMilliseconds(elapsed)}</span>;
};

const ALL_VALUES = range(1, 9).map((value) => ({ value }));

const DIFFICULTY_CLUES = [38, 30, 25, 23];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

function generate(sudokuMath, difficulty) {
  return generatePuzzle(sudokuMath, DIFFICULTY_CLUES[difficulty]).map(
    ({ value }) => ({
      value,
      disabled: !!value,
    })
  );
}

export const Sudoku = () => {
  const [difficulty, setDifficulty] = useState(1);
  const [regionWidth, setRegionWidth] = useState(3);
  const [regionHeight, setRegionHeight] = useState(3);
  const sudokuMath = useMemo(() => new SudokuMath(regionWidth, regionHeight), [
    regionWidth,
    regionHeight,
  ]);
  const [cells, setCells] = useState(() => generate(sudokuMath, difficulty));
  const [selected, setSelected] = useState(undefined);
  const [showHints, setShowHints] = useState(false);
  const [timerStart, setTimerStart] = useState(() => Date.now());
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

  const regions = sudokuMath.chunkRegions(cells);
  const getInputCells = () => {
    if (selected === undefined || !showHints) return ALL_VALUES;

    const takenValues = getTakenValues(sudokuMath, selected, cells, regions);
    return ALL_VALUES.map(({ value }) => ({
      value,
      disabled: takenValues.has(value),
    }));
  };

  function handleRegionWidthChange(newWidth) {
    setRegionWidth(newWidth);
  }

  function handleRegionHeightChange(newHeight) {
    setRegionHeight(newHeight);
  }

  function handleDifficultySelect(e) {
    setDifficulty(parseInt(e.target.value));
  }

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

  function _regenerate() {
    setCells(generate(sudokuMath, difficulty));
    setSelected(undefined);
    setTimerStart(Date.now());
  }

  function handleRegenerate() {
    if (window.confirm("Are you sure you want to regenerate the puzzle?")) {
      _regenerate();
    }
  }

  function handleSolve() {
    if (window.confirm("Are you sure you want the puzzle to be solved?")) {
      if (!optimisticSolver(sudokuMath, cells)) {
        completeSolver(sudokuMath, cells);
      }
      setCells(cells.map((cell) => cell));
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
        <button onClick={handleSolve}>Solve</button>
        <label>
          <input
            type="checkbox"
            name="hints"
            checked={showHints}
            onChange={handleShowHintCheckbox}
          />
          Hints?
        </label>
        <Timer start={timerStart} />
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
