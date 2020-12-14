import "./sudoku.css";

const Cell = ({ value }) => {
  return <button className="cell">{value}</button>;
};

const Region = () => {
  return (
    <div className="region">
      {Array(9)
        .fill()
        .map((_, i) => (
          <Cell key={i} value={i + 1} />
        ))}
    </div>
  );
};

const Board = () => {
  return (
    <div className="board">
      <Region />
      <Region />
      <Region />
      <Region />
      <Region />
      <Region />
      <Region />
      <Region />
      <Region />
    </div>
  );
};

export const Sudoku = () => {
  return (
    <div className="game">
      <Board />
    </div>
  );
};
