import React, { useRef, useCallback, useReducer } from "react";

import "./sudoku.css";

import { SudokuTransform } from "./transform";

import { useWindowClickListener } from "./effects";
import { useGenerateSudoku, useSudokuSolver } from "./api";

import { Timer } from "./components/timer";
import { Input, Board, Settings, Cell as CellJsx } from "./components/sudoku";
import { DIFFICULTIES } from "./components/sudoku/settings";

const DEFAULT_WIDTH = 3;
const DEFAULT_HEIGHT = 3;
const DEFAULT_DIFFICULTY = 1;
const RENDER_STYLES = ["Numbers", "Letters", "Mixed"];

type DifficultySet = [number, number, number, number, number];
const DIFFICULTY_CLUES: { [key: number]: DifficultySet } = {
  9: [38, 30, 25, 22, 0],
  12: [80, 64, 56, 47, 0],
  15: [125, 112, 98, 88, 0],
  16: [133, 118, 105, 95, 0],
  18: [175, 160, 150, 140, 0],
  20: [235, 220, 200, 180, 0],
  24: [340, 325, 310, 290, 0],
  25: [425, 400, 350, 310, 0],
  30: [560, 525, 500, 475, 0],
  36: [900, 850, 800, 750, 0],
};

interface Cell {
  /** The ID of this cell on the board */
  idx: number;
  /** The value of the cell */
  value: number;
  /** Whether this cell is disabled */
  disabled: boolean;
  /** Whether this cell is currently selected */
  selected: boolean;
  /** The renderStyle to use for this cell */
  renderStyle: number;
  /** The element rendered for this cell */
  element: JSX.Element;
  /** re-renders the JSX with current values */
  update: () => void;
}

const getCell = (
  idx: number,
  value: number,
  onClick: (idx: number) => any,
  renderStyle: number = 0,
  selected: boolean = false,
  disabled: boolean = false
): Cell => {
  const cell = {
    idx,
    value,
    renderStyle,
    selected,
    disabled,
  } as Cell;

  cell.update = () => (cell.element = CellJsx({ ...cell, onClick }));
  cell.update();
  return cell;
};

interface GameState {
  /** The width of each region */
  regionWidth: number;
  /** The height of each region */
  regionHeight: number;
  /** The difficulty of the generated sudoku, from 0-3 */
  difficulty: number;
  /** A cached SudokuTransform instance */
  transform: SudokuTransform;
  /** Board regenerates when toggled */
  regenerate: boolean;
  /** The cells of the board */
  cells: Cell[];
  /** The currently selected cell */
  selected: number;

  /** When the timer started */
  timerStart: number;
  /** Current cell rendering style, from 0-2 */
  renderStyle: number;
  /** Whether to show hints */
  showHints: boolean;
}

type Action =
  | { type: "reset" | "regenerate" | "toggleShowHints" }
  | {
      type: "setSelected" | "setRenderStyle" | "setValue";
      payload: number;
    }
  | {
      type: "setSudokuParameters";
      payload: {
        regionWidth: number;
        regionHeight: number;
        difficulty: number;
      };
    }
  | {
      type: "onApiLoad";
      payload: { dispatch: React.Dispatch<Action>; cells: number[] };
    }
  | { type: "onSolve"; payload: number[] };

const reducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case "setSudokuParameters":
      const { regionWidth, regionHeight, difficulty } = action.payload;
      return {
        ...state,
        cells: [],
        regionWidth,
        regionHeight,
        difficulty,
        transform: new SudokuTransform(regionWidth, regionHeight),
      };
    case "setSelected":
      const selected = action.payload;
      return {
        ...state,
        selected,
        cells: state.cells.map((cell, idx) => {
          if (
            (cell.selected && idx !== selected) ||
            (!cell.selected && idx === selected)
          ) {
            cell.selected = idx === selected;
            cell.update();
          }
          return cell;
        }),
      };
    case "setValue":
      return {
        ...state,
        cells: state.cells.map((cell) => {
          if (cell.idx === state.selected) {
            cell.value = action.payload;
            cell.update();
          }
          return cell;
        }),
      };
    case "setRenderStyle":
      const renderStyle = action.payload;
      return {
        ...state,
        renderStyle,
        cells: state.cells.map((cell) => {
          cell.renderStyle = renderStyle;
          cell.update();
          return cell;
        }),
      };
    case "onApiLoad":
      const click = (idx: number) =>
        action.payload.dispatch({ type: "setSelected", payload: idx });
      return {
        ...state,
        selected: NaN,
        timerStart: Date.now(),
        cells: state.transform
          .rowsToRegions(action.payload.cells)
          .map((value, idx) =>
            getCell(idx, value, click, state.renderStyle, false, value > 0)
          ),
      };
    case "onSolve":
      const transformed = state.transform.rowsToRegions(action.payload);
      return {
        ...state,
        cells: state.cells.map((cell, idx) => {
          const solved = transformed[idx];
          if (cell.value !== solved) {
            cell.value = solved;
            cell.update();
          }
          return cell;
        }),
      };
    case "reset":
      return {
        ...state,
        timerStart: Date.now(),
        cells: state.cells.map((cell) => {
          if (!cell.disabled && cell.value > 0) {
            cell.value = 0;
            cell.update();
          }
          return cell;
        }),
      };
    case "regenerate":
      return {
        ...state,
        regenerate: !state.regenerate,
      };
    case "toggleShowHints":
      return {
        ...state,
        showHints: !state.showHints,
      };
    default:
      throw new Error(`Invalid Action.type`);
  }
};

const Controls = ({
  onReset,
  onRegenerate,
  onSolve,
}: {
  onReset: () => void;
  onRegenerate: () => void;
  onSolve: () => void;
}) => {
  const handleRegenerate = () => {
    if (window.confirm("Are you sure you want to regenerate the puzzle?")) {
      onRegenerate();
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the puzzle?")) {
      onReset();
    }
  };

  const handleSolve = () => {
    if (window.confirm("Are you sure you want the puzzle to be solved?")) {
      onSolve();
    }
  };
  return (
    <div className="form-row centered">
      <div className="form-input">
        <button onClick={handleReset}>Reset</button>
      </div>
      <div className="form-input">
        <button onClick={handleRegenerate}>Regenerate</button>
      </div>
      <div className="form-input">
        <button onClick={handleSolve}>Solve</button>
      </div>
    </div>
  );
};

export const Sudoku = () => {
  const [state, dispatch] = useReducer(reducer, {
    regionWidth: DEFAULT_WIDTH,
    regionHeight: DEFAULT_HEIGHT,
    difficulty: DEFAULT_DIFFICULTY,
    transform: new SudokuTransform(DEFAULT_WIDTH, DEFAULT_HEIGHT),
    cells: [],
    selected: NaN,
    renderStyle: 0,
    regenerate: false,
    showHints: false,
    timerStart: 0,
  });

  const isLoading = useGenerateSudoku(
    state.regionWidth,
    state.regionHeight,
    DIFFICULTY_CLUES[state.regionHeight * state.regionWidth][state.difficulty],
    state.regenerate,
    useCallback(
      (cells) => dispatch({ type: "onApiLoad", payload: { dispatch, cells } }),
      []
    )
  );
  const [isSolving, solve] = useSudokuSolver(
    useCallback((payload) => dispatch({ type: "onSolve", payload }), [])
  );

  const board = useRef<HTMLDivElement>(null!);
  const input = useRef<HTMLDivElement>(null!);
  const settings = useRef<HTMLDivElement>(null!);
  const controls = useRef<HTMLDivElement>(null!);
  useWindowClickListener(({ target }) => {
    if (
      !isNaN(state.selected) &&
      ![board, input, settings, controls].some(
        ({ current }) => current && current.contains(target as Node)
      )
    ) {
      // unselect our current cell when outside of board or input is clicked
      dispatch({ type: "setSelected", payload: NaN });
    }
  });

  const getInputCells = (): JSX.Element[] => {
    const takenValues =
      !isNaN(state.selected) && state.showHints && state.cells.length > 0
        ? state.transform.getTakenValues(state.selected, state.cells)
        : new Set<number>();
    return state.transform.values.map((value, idx) =>
      CellJsx({
        idx,
        value,
        disabled: takenValues.has(value),
        selected: false,
        renderStyle: state.renderStyle,
        onClick: (idx) => dispatch({ type: "setValue", payload: idx + 1 }),
      })
    );
  };

  const handleHintsToggle = () => {
    dispatch({ type: "toggleShowHints" });
  };

  const handleRenderStyleChange = (payload: number) => {
    dispatch({ type: "setRenderStyle", payload });
  };

  const handleSolve = () => {
    solve({
      regionWidth: state.regionWidth,
      regionHeight: state.regionHeight,
      cells: state.transform.regionsToRows(
        state.cells.map((cell) => cell.value)
      ),
    });
  };

  const regions = (): JSX.Element[][] =>
    state.transform.chunkRegions(state.cells.map((cell) => cell.element));

  const page = () => {
    if (isLoading) {
      return <span>Loading...</span>;
    }

    return (
      <>
        <div className="game-container">
          <div className="column">
            <div className="print-hide centered" ref={settings}>
              <Settings
                regionWidth={state.regionWidth}
                regionHeight={state.regionHeight}
                difficulty={state.difficulty}
                onApply={(settings) =>
                  dispatch({ type: "setSudokuParameters", payload: settings })
                }
              />
            </div>
            <div ref={board}>
              <Board
                regionWidth={state.regionWidth}
                regionHeight={state.regionHeight}
                regions={regions()}
              />
            </div>
            <div className="print-block difficulty-label centered">
              {DIFFICULTIES[state.difficulty]}
            </div>
            <div className="print-hide" ref={controls}>
              <Controls
                onRegenerate={() => dispatch({ type: "regenerate" })}
                onReset={() => dispatch({ type: "reset" })}
                onSolve={handleSolve}
              />
            </div>
          </div>
          <div className="print-hide column" ref={input}>
            <Input
              regionWidth={state.regionWidth}
              cells={getInputCells()}
              onErase={() => dispatch({ type: "setValue", payload: 0 })}
            />
            <div className="timer centered">
              <Timer start={state.timerStart} />
            </div>
            <div>
              <input
                type="checkbox"
                id="hints"
                checked={state.showHints}
                onChange={handleHintsToggle}
              />
              <label htmlFor="hints">Hints?</label>
            </div>
            <div>
              {RENDER_STYLES.map((style, i) => (
                <React.Fragment key={`renderStyle-${i}`}>
                  <input
                    type="radio"
                    id={style}
                    name="renderStyle"
                    value={i}
                    onChange={(e) =>
                      handleRenderStyleChange(parseInt(e.target.value))
                    }
                    checked={i === state.renderStyle}
                  />
                  <label htmlFor={style}>{style}</label>
                  <br />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  return <div className="page">{page()}</div>;
};
