import { getColumnStyle } from "../../util";

interface RegionProps {
  regionWidth: number;
  cells: JSX.Element[];
}

export const Region = ({ regionWidth, cells }: RegionProps) => (
  <div className="region" style={getColumnStyle(regionWidth)}>
    {cells}
  </div>
);
