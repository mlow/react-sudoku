import { getColumnStyle } from "../../util";
import { Region } from "./region";

interface BoardProps {
  regionWidth: number;
  regionHeight: number;
  regions: JSX.Element[][];
}

export const Board = (props: BoardProps) => (
  <div className="board" style={getColumnStyle(props.regionHeight)}>
    {props.regions.map((region, i) => (
      <Region regionWidth={props.regionWidth} key={i} cells={region} />
    ))}
  </div>
);
