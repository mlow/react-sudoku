import { useEffect } from "react";

export function useWindowClickListener(func: (e: MouseEvent) => any) {
  useEffect(() => {
    window.addEventListener("click", func);
    return () => window.removeEventListener("click", func);
  });
}
