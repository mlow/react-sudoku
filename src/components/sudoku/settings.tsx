import React, { useReducer } from "react";
import { Select } from "../select";

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];
const RENDER_STYLES = ["Numbers", "Letters", "Mixed"];

const REGION_DIMENSION_OPTS = Array(5)
  .fill(null)
  .map((_, x) => x + 2)
  .map((value) => ({ key: String(value), value }));

type SettingsState = {
  regionWidth: number;
  regionHeight: number;
  difficulty: number;
  renderStyle: number;
  showHints: boolean;
};

interface SettingsParams {
  regionWidth: number;
  regionHeight: number;
  difficulty: number;
  onApply: (state: SettingsState) => void;
  onRegenerate: () => void;
  onReset: () => void;
  onSolve: () => void;
  onRenderStyleChange: (renderStyle: number) => void;
  onToggleHints: (showHints: boolean) => void;
}

type SettingsAction =
  | {
      type:
        | "setRegionWidth"
        | "setRegionHeight"
        | "setDifficulty"
        | "setRenderStyle";
      payload: number;
    }
  | { type: "toggleHints" };

const settingsReducer = (
  state: SettingsState,
  action: SettingsAction
): SettingsState => {
  switch (action.type) {
    case "setDifficulty":
      return { ...state, difficulty: action.payload };
    case "setRegionWidth":
      return { ...state, regionWidth: action.payload };
    case "setRegionHeight":
      return { ...state, regionHeight: action.payload };
    case "setRenderStyle":
      return { ...state, renderStyle: action.payload };
    case "toggleHints":
      return { ...state, showHints: !state.showHints };
    default:
      throw new Error("Invalid SettingsAction.type");
  }
};

export const Settings = (props: SettingsParams) => {
  const [state, dispatch] = useReducer(settingsReducer, {
    regionWidth: props.regionWidth,
    regionHeight: props.regionHeight,
    difficulty: props.difficulty,
    renderStyle: 0,
    showHints: false,
  });

  const handleRegenerate = () => {
    if (window.confirm("Are you sure you want to regenerate the puzzle?")) {
      props.onRegenerate();
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset the puzzle?")) {
      props.onReset();
    }
  };

  const handleSolve = () => {
    if (window.confirm("Are you sure you want the puzzle to be solved?")) {
      props.onSolve();
    }
  };

  const handleRenderStyleChange = (renderStyle: number) => {
    dispatch({ type: "setRenderStyle", payload: renderStyle });
    props.onRenderStyleChange(renderStyle);
  };

  const handleHintsToggle = () => {
    dispatch({ type: "toggleHints" });
    props.onToggleHints(!state.showHints);
  };

  const isParamsChanged = () =>
    props.difficulty !== state.difficulty ||
    props.regionWidth !== state.regionWidth ||
    props.regionHeight !== state.regionHeight;

  const handleApply = () => {
    if (
      window.confirm(
        "Applying these settings will regenerate the current puzzle. Are you sure?"
      )
    ) {
      props.onApply(state);
    }
  };

  return (
    <>
      <Select
        value={state.regionWidth}
        options={REGION_DIMENSION_OPTS}
        onSelect={(payload) => dispatch({ type: "setRegionWidth", payload })}
      />
      <Select
        value={state.regionHeight}
        options={REGION_DIMENSION_OPTS}
        onSelect={(payload) => dispatch({ type: "setRegionHeight", payload })}
      />
      <Select
        value={state.difficulty}
        options={DIFFICULTIES.map((key, value) => ({ key, value }))}
        onSelect={(payload) => dispatch({ type: "setDifficulty", payload })}
      />
      <button onClick={handleApply} disabled={!isParamsChanged()}>
        Apply
      </button>
      <button onClick={handleRegenerate}>Regenerate</button>
      <br />
      <span>
        {RENDER_STYLES.map((style, i) => (
          <React.Fragment key={`renderStyle-${i}`}>
            <input
              type="radio"
              id={style}
              name="renderStyle"
              value={i}
              checked={i === state.renderStyle}
              onChange={(e) =>
                handleRenderStyleChange(parseInt(e.target.value))
              }
            />
            <label htmlFor={style}>{style}</label>
          </React.Fragment>
        ))}
      </span>
      <label>
        <input
          type="checkbox"
          name="hints"
          checked={state.showHints}
          onChange={handleHintsToggle}
        />
        Hints?
      </label>
      <br />
      <button onClick={handleReset}>Reset</button>
      <button onClick={handleSolve}>Solve</button>
    </>
  );
};
