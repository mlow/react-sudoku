import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from "react";
import classNames from "classnames";
import { SudokuMath } from "./math.js";
import "./sudoku.css";

const RenderStyleContext = React.createContext();

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const Cell = React.memo(({ onClick, index, selected, disabled, value }) => {
  const renderStyle = useContext(RenderStyleContext);
  function renderedValue() {
    switch (renderStyle) {
      case 1:
        return letters[value - 1];
      case 2:
        return value < 10 ? value : letters[value - 10];
      default:
        return value;
    }
  }
  return (
    <button
      onClick={() => onClick(index)}
      disabled={disabled}
      className={classNames("cell", {
        selected: !!selected,
      })}
    >
      {renderedValue()}
    </button>
  );
});

function getColumnStyle(colCount) {
  return {
    gridTemplateColumns: `repeat(${colCount}, 1fr)`,
  };
}

const Region = ({ regionWidth, ordinal, selected, cells, onClick }) => (
  <div className="region" style={getColumnStyle(regionWidth)}>
    {cells.map((cell, i) => {
      const index = ordinal * cells.length + i;
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
  <div className="board" style={getColumnStyle(props.regionHeight)}>
    {props.regions.map((region, i) => (
      <Region {...props} key={i} ordinal={i} cells={region} />
    ))}
  </div>
);

const Input = ({ regionWidth, cells, onInput }) => (
  <div className="input-area">
    <div className="input">
      <Region
        ordinal={0}
        regionWidth={regionWidth}
        cells={cells}
        onClick={(i) => onInput(i + 1)}
      />
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

const DIFFICULTY_CLUES = [138, 118, 116, 93];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];
const RENDER_STYLES = ["Numbers", "Letters", "Mixed"];

export const Sudoku = () => {
  const [difficulty, setDifficulty] = useState(1);
  const [regionWidth, setRegionWidth] = useState(4);
  const [regionHeight, setRegionHeight] = useState(4);
  const [regenerate, setRegenerate] = useState(false);
  const sudokuMath = useMemo(() => new SudokuMath(regionWidth, regionHeight), [
    regionWidth,
    regionHeight,
  ]);
  const [cells, setCells] = useState(sudokuMath.getBlankPuzzle());
  const [selected, setSelected] = useState(undefined);
  const [showHints, setShowHints] = useState(false);
  const [timerStart, setTimerStart] = useState(() => Date.now());
  const [renderStyle, setRenderStyle] = useState(0);
  const board = useRef(null);
  const input = useRef(null);

  useWindowClickListener(({ target }) => {
    if (![board, input].some(({ current }) => current.contains(target))) {
      // unselect our current cell when outside of board clicked
      setSelected(undefined);
    }
  });

  const isLoading = useSudukoApi(
    regionWidth,
    regionHeight,
    DIFFICULTY_CLUES[difficulty],
    regenerate,
    useCallback((cells) => setCells(sudokuMath.rowsToRegions(cells)), [
      sudokuMath,
    ])
  );

  const handleSetValue = (value) => {
    if (selected !== undefined && cells[selected].value !== value) {
      cells[selected].value = value;
      setCells(cells.slice());
    }
  };

  const regions = sudokuMath.chunkRegions(cells);
  const getInputCells = () => {
    if (selected === undefined || !showHints)
      return sudokuMath.legalValues.map((value) => ({ value }));

    const takenValues = sudokuMath.getTakenValues(selected, cells, regions);
    return sudokuMath.legalValues.map((value) => ({
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
    setRegenerate(!regenerate);
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
      if (!sudokuMath.optimisticSolver(cells)) {
        sudokuMath.backTrackingSolver(cells, true);
      }
      setCells(cells.map((cell) => cell));
    }
  }

  function handleShowHintCheckbox() {
    setShowHints(!showHints);
  }

  function handleRenderStyleRadio(e) {
    setRenderStyle(parseInt(e.target.value));
  }

  return (
    <div className="game">
      <RenderStyleContext.Provider value={renderStyle}>
        <div ref={board}>
          <Board
            regions={regions}
            regionWidth={regionWidth}
            regionHeight={regionHeight}
            selected={selected}
            onClick={setSelected}
          />
        </div>
      </RenderStyleContext.Provider>
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
        <RenderStyleContext.Provider value={renderStyle}>
          <Input
            regionWidth={regionWidth}
            cells={getInputCells()}
            onInput={handleSetValue}
          />
        </RenderStyleContext.Provider>
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
        <span onChange={handleRenderStyleRadio}>
          {RENDER_STYLES.map((style, i) => (
            <div key={`renderStyle-${i}`}>
              <input
                type="radio"
                id={style}
                name="renderStyle"
                value={i}
                onChange={handleRenderStyleRadio}
                checked={i === renderStyle}
              />
              <label htmlFor={style}>{style}</label>
            </div>
          ))}
        </span>
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

function useSudukoApi(regionWidth, regionHeight, clues, regenerate, callback) {
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const response = await fetch("http://localhost:4000/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `query generate($regionWidth: Int!, $regionHeight: Int!, $clues: Int!) {
          generate(
            regionWidth: $regionWidth
            regionHeight: $regionHeight
            clues: $clues
          ) {
            cells {
              value
            }
          }
        }`,
          variables: {
            regionWidth,
            regionHeight,
            clues,
          },
        }),
      });
      setIsLoading(false);

      if (response.ok) {
        const json = await response.json();
        console.log(json);
        callback(
          json.data.generate.cells.reduce((acc, row) => acc.concat(row), [])
        );
      }
    })();
  }, [callback, regenerate, regionWidth, regionHeight, clues]);
  return isLoading;
}
