import { Region } from "./region";

interface InputProps {
  regionWidth: number;
  cells: JSX.Element[];
  onErase: () => void;
}

export const Input = ({ regionWidth, cells, onErase }: InputProps) => (
  <div className="input">
    <Region regionWidth={regionWidth} cells={cells} />
    <button className="erase" onClick={onErase}>
      Erase
    </button>
  </div>
);
