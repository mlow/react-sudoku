import { useState, useEffect } from "react";

function handleErrors(response: any) {
  if (response.errors) {
    throw new Error(
      (response.errors as any[]).map((err) => err.message).join(", ")
    );
  }
}

async function graphqlQuery(query: string, variables: any) {
  const response = await fetch(process.env.REACT_APP_SUDOKU_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (response.ok) {
    const json = await response.json();
    handleErrors(json);
    return json.data;
  }
}

const GENERATE_QUERY = `\
query generate(
  $regionWidth: Int!
  $regionHeight: Int!
  $clues: Int!
) {
  generate(
    regionWidth: $regionWidth
    regionHeight: $regionHeight
    clues: $clues
  ) {
    cells
  }
}`;

export function useGenerateSudoku(
  regionWidth: number,
  regionHeight: number,
  clues: number,
  regenerate: boolean,
  callback: (cells: number[]) => void
) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const result = await graphqlQuery(GENERATE_QUERY, {
        regionWidth,
        regionHeight,
        clues,
      });
      callback(result.generate.cells);
      setIsLoading(false);
    })();
  }, [regionWidth, regionHeight, clues, regenerate, callback]);
  return isLoading;
}

const SOLVE_QUERY = `\
query solve(
  $regionWidth: Int!
  $regionHeight: Int!
  $cells: [Int!]!
) {
  solve(
    regionWidth: $regionWidth
    regionHeight: $regionHeight
    cells: $cells
  ) {
    cells
  }
}`;

type SolveArguments = {
  regionWidth: number;
  regionHeight: number;
  cells: number[];
};

export function useSudokuSolver(
  callback: (cells: number[]) => void
): [boolean, React.Dispatch<React.SetStateAction<SolveArguments>>] {
  const [isSolving, setIsSolving] = useState(false);
  const [toSolve, setToSolve] = useState({
    regionWidth: 0,
    regionHeight: 0,
    cells: [] as number[],
  } as SolveArguments);
  useEffect(() => {
    if (toSolve.regionWidth === 0) {
      return;
    }
    (async () => {
      setIsSolving(true);
      const result = await graphqlQuery(SOLVE_QUERY, toSolve);
      callback(result.solve.cells);
      setIsSolving(false);
    })();
  }, [callback, toSolve]);
  return [isSolving, setToSolve];
}
