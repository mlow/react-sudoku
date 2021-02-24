import React, { useRef, useCallback, useReducer } from "react";

import "./sudoku.css";

import { SudokuTransform } from "./transform";

import { useWindowClickListener } from "./effects";
import { useSudokuApi } from "./api";

import { Timer } from "./components/timer";
import { Input, Board, Settings, Cell as CellJsx } from "./components/sudoku";

const DEFAULT_WIDTH = 3;
const DEFAULT_HEIGHT = 3;
const DEFAULT_DIFFICULTY = 1;

const DIFFICULTY_CLUES: { [key: number]: number[] } = {
  4: [16, 16, 16, 16],
  6: [36, 36, 36, 36],
  9: [38, 30, 23, 21],
  12: [144, 144, 144, 144],
  15: [225, 225, 225, 225],
  16: [133, 118, 105, 95],
  20: [400, 400, 400, 400],
  25: [625, 625, 625, 625],
  30: [900, 900, 900, 900],
  36: [1296, 1296, 1296, 1296],
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
    };

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

  const isLoading = useSudokuApi(
    state.regionWidth,
    state.regionHeight,
    DIFFICULTY_CLUES[state.regionHeight * state.regionWidth][state.difficulty],
    state.regenerate,
    useCallback(
      (cells) => dispatch({ type: "onApiLoad", payload: { dispatch, cells } }),
      [dispatch]
    )
  );

  const board = useRef<HTMLDivElement>(null!);
  const input = useRef<HTMLDivElement>(null!);
  const settings = useRef<HTMLDivElement>(null!);
  useWindowClickListener(({ target }) => {
    if (
      !isNaN(state.selected) &&
      ![board, input, settings].some(
        ({ current }) => current && current.contains(target as Node)
      )
    ) {
      // unselect our current cell when outside of board or input is clicked
      dispatch({ type: "setSelected", payload: NaN });
    }
  });

  const getInputCells = (): JSX.Element[] => {
    const takenValues =
      !isNaN(state.selected) && state.showHints
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

  const regions: JSX.Element[][] = state.transform.chunkRegions(
    state.cells.map((cell) => cell.element)
  );

  const boardAndInputJsx = () => {
    if (isLoading) {
      return <span>Loading...</span>;
    }

    return (
      <>
        <div className="input" ref={input}>
          <Input
            regionWidth={state.regionWidth}
            cells={getInputCells()}
            onErase={() => dispatch({ type: "setValue", payload: 0 })}
          />
        </div>
        <div ref={board}>
          <Board
            regionWidth={state.regionWidth}
            regionHeight={state.regionHeight}
            regions={regions}
          />
        </div>
        <span className="timer">
          <Timer start={state.timerStart} />
        </span>
      </>
    );
  };

  return (
    <div className="game">
      <div className="settings" ref={settings}>
        <Settings
          regionWidth={state.regionWidth}
          regionHeight={state.regionHeight}
          difficulty={state.difficulty}
          onApply={(settings) =>
            dispatch({ type: "setSudokuParameters", payload: settings })
          }
          onRegenerate={() => dispatch({ type: "regenerate" })}
          onReset={() => dispatch({ type: "reset" })}
          onSolve={() => {
            throw new Error("Not implemented.");
          }}
          onRenderStyleChange={(renderStyle: number) =>
            dispatch({ type: "setRenderStyle", payload: renderStyle })
          }
          onToggleHints={() => dispatch({ type: "toggleShowHints" })}
        />
      </div>
      {boardAndInputJsx()}
    </div>
  );
};
