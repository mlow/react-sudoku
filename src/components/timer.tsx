import { useState, useEffect } from "react";
import { formatElapsedMilliseconds as format } from "../util";

interface TimerParams {
  start: number;
}

export const Timer = ({ start }: TimerParams) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - start), 50);
    return () => clearInterval(timer);
  }, [start]);

  return <>{format(elapsed)}</>;
};
