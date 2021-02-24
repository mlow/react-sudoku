import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from "react";
import classNames from "classnames";

import { Cell as TCell } from "./types";

import { SudokuMath } from "./math";
import "./sudoku.css";

const RenderStyleContext = React.createContext(0);

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type SelectCellCallback = (idx: number) => void;

interface CellProps {
  onClick: SelectCellCallback;
  index: number;
  value: number;
  selected?: boolean;
  disabled?: boolean;
}

const Cell = React.memo(
  ({ onClick, index, selected, disabled, value }: CellProps) => {
    const renderStyle = useContext(RenderStyleContext);
    function renderedValue() {
      if (value === 0) {
        return;
      }
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
  }
);

function getColumnStyle(colCount: number) {
  return {
    gridTemplateColumns: `repeat(${colCount}, 1fr)`,
  };
}

interface RegionProps {
  regionWidth: number;
  ordinal: number;
  selected?: number;
  cells: TCell[];
  onClick: SelectCellCallback;
}

const Region = ({
  regionWidth,
  ordinal,
  selected,
  cells,
  onClick,
}: RegionProps) => (
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

interface BoardProps {
  regions: TCell[][];
  regionWidth: number;
  regionHeight: number;
  selected: number;
  onClick: SelectCellCallback;
}

const Board = (props: BoardProps) => (
  <div className="board" style={getColumnStyle(props.regionHeight)}>
    {props.regions.map((region, i) => (
      <Region {...props} key={i} ordinal={i} cells={region} />
    ))}
  </div>
);

interface InputProps {
  regionWidth: number;
  cells: TCell[];
  onInput: (idx: number) => void;
}

const Input = ({ regionWidth, cells, onInput }: InputProps) => (
  <div className="input-area">
    <div className="input">
      <Region
        ordinal={0}
        regionWidth={regionWidth}
        cells={cells}
        onClick={(i) => onInput(i + 1)}
      />
    </div>
    <button onClick={() => onInput(0)}>Erase</button>
  </div>
);

function formatElapsedMilliseconds(ms: number) {
  const hours = String(Math.floor(ms / (3600 * 1000))).padStart(2, "0");
  const minutes = String(Math.floor((ms / (60 * 1000)) % 60)).padStart(2, "0");
  const seconds = String(Math.floor((ms / 1000) % 60)).padStart(2, "0");
  const deciseconds = String(Math.floor(ms / 100) % 10);
  return `${hours}:${minutes}:${seconds}.${deciseconds}`;
}

interface TimerParams {
  start: number;
}

const Timer = ({ start }: TimerParams) => {
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
  const [cells, setCells] = useState(
    () => sudokuMath.getBlankPuzzle() as TCell[]
  );
  const [selected, setSelected] = useState(NaN);
  const [showHints, setShowHints] = useState(false);
  const [timerStart, setTimerStart] = useState(() => Date.now());
  const [renderStyle, setRenderStyle] = useState(0);

  const board = useRef<HTMLDivElement>(null!);
  const input = useRef<HTMLInputElement>(null!);

  useWindowClickListener(({ target }) => {
    if (
      ![board, input].some(({ current }) => current.contains(target as Node))
    ) {
      // unselect our current cell when outside of board or input clicked
      setSelected(NaN);
    }
  });

  const isLoading = useSudukoApi(
    regionWidth,
    regionHeight,
    DIFFICULTY_CLUES[difficulty],
    regenerate,
    useCallback(
      (cells) => setCells(sudokuMath.rowsToRegions(cells) as TCell[]),
      [sudokuMath]
    )
  );

  const handleSetValue = (value: number) => {
    if (selected && cells[selected].value !== value) {
      cells[selected].value = value;
      setCells(cells.slice());
    }
  };

  const getInputCells = () => {
    if (Number.isNaN(selected) || !showHints) {
      return sudokuMath.legalValues.map((value) => ({
        value,
        disabled: false,
      }));
    }

    const takenValues = sudokuMath.getTakenValues(selected, cells);
    return sudokuMath.legalValues.map((value) => ({
      value,
      disabled: takenValues.has(value),
    }));
  };

  function handleRegionWidthChange(newWidth: number) {
    setRegionWidth(newWidth);
  }

  function handleRegionHeightChange(newHeight: number) {
    setRegionHeight(newHeight);
  }

  function handleShowHintCheckbox() {
    setShowHints(!showHints);
  }

  function handleDifficultySelect(e: React.ChangeEvent<HTMLSelectElement>) {
    setDifficulty(parseInt(e.target.value));
  }

  function handleRenderStyleRadio(e: React.ChangeEvent<HTMLInputElement>) {
    setRenderStyle(parseInt(e.target.value));
  }

  function handleReset() {
    if (window.confirm("Are you sure you want to reset the puzzle?")) {
      setCells(
        cells.map(({ value, disabled }) => ({
          value: disabled ? value : 0,
          disabled,
        }))
      );
    }
  }

  function _regenerate() {
    setRegenerate(!regenerate);
    setSelected(NaN);
    setTimerStart(Date.now());
  }

  function handleRegenerate() {
    if (window.confirm("Are you sure you want to regenerate the puzzle?")) {
      _regenerate();
    }
  }

  function handleSolve() {
    if (window.confirm("Are you sure you want the puzzle to be solved?")) {
      throw Error("Not implemented.");
    }
  }

  return (
    <div className="game">
      <RenderStyleContext.Provider value={renderStyle}>
        <div ref={board}>
          <Board
            regions={sudokuMath.chunkRegions(cells)}
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

function useWindowClickListener(func: (e: MouseEvent) => any) {
  useEffect(() => {
    window.addEventListener("click", func);
    return () => window.removeEventListener("click", func);
  });
}

function useSudukoApi(
  regionWidth: number,
  regionHeight: number,
  clues: number,
  regenerate: any,
  callback: (cells: TCell[]) => void
) {
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
            cells
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
        callback(
          json.data.generate.cells.map((value: number) => ({
            value: value,
            disabled: value > 0,
          }))
        );
      }
    })();
  }, [callback, regenerate, regionWidth, regionHeight, clues]);
  return isLoading;
}
