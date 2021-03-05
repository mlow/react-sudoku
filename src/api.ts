import { useState, useEffect } from "react";

const SUDOKU_QUERY = `\
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

export function useSudokuApi(
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
      const response = await fetch(process.env.REACT_APP_SUDOKU_API_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: SUDOKU_QUERY,
          variables: {
            regionWidth,
            regionHeight,
            clues,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        callback(json.data.generate.cells);
      }

      setIsLoading(false);
    })();
  }, [regionWidth, regionHeight, clues, regenerate, callback]);
  return isLoading;
}
