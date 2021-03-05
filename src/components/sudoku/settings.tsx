import React, { useReducer } from "react";
import { Select } from "../select";

export const DIFFICULTIES = ["Easy", "Medium", "Hard", "Expert"];

const REGION_DIMENSION_OPTS = Array(4)
  .fill(null)
  .map((_, x) => x + 3)
  .map((value) => ({ key: String(value), value }));

type SettingsState = {
  regionWidth: number;
  regionHeight: number;
  difficulty: number;
};

interface SettingsParams {
  regionWidth: number;
  regionHeight: number;
  difficulty: number;
  onApply: (state: SettingsState) => void;
}

type SettingsAction = {
  type: "setRegionWidth" | "setRegionHeight" | "setDifficulty";
  payload: number;
};

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
    default:
      throw new Error("Invalid SettingsAction.type");
  }
};

export const Settings = (props: SettingsParams) => {
  const [state, dispatch] = useReducer(settingsReducer, {
    regionWidth: props.regionWidth,
    regionHeight: props.regionHeight,
    difficulty: props.difficulty,
  });

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
      <div className="form-row">
        <div className="form-input">
          <Select
            id="regionWidth"
            className="margin-auto"
            value={state.regionWidth}
            options={REGION_DIMENSION_OPTS}
            onSelect={(payload) =>
              dispatch({ type: "setRegionWidth", payload })
            }
          />
        </div>
        <div className="form-input">
          <Select
            id="regionHeight"
            className="margin-auto"
            value={state.regionHeight}
            options={REGION_DIMENSION_OPTS}
            onSelect={(payload) =>
              dispatch({ type: "setRegionHeight", payload })
            }
          />
        </div>
        <div className="form-input">
          <Select
            id="difficulty"
            value={state.difficulty}
            options={DIFFICULTIES.map((key, value) => ({ key, value }))}
            onSelect={(payload) => dispatch({ type: "setDifficulty", payload })}
          />
        </div>
        <div className="form-input">
          <button onClick={handleApply} disabled={!isParamsChanged()}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
};
