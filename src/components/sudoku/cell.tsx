import { renderedCellValue } from "../../util";
import classNames from "classnames";

interface CellProps {
  idx: number;
  value: number;
  disabled: boolean;
  selected: boolean;
  renderStyle: number;
  onClick: (idx: number) => any;
}

export const Cell = (props: CellProps) => (
  <button
    key={props.idx}
    disabled={props.disabled}
    className={classNames("cell", { selected: props.selected })}
    onClick={() => props.onClick(props.idx)}
  >
    {renderedCellValue(props.renderStyle, props.value)}
  </button>
);
