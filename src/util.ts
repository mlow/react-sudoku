function zeroPad(length: number, n: number) {
  return String(n).padStart(length, "0");
}

export function formatElapsedMilliseconds(ms: number) {
  const hours = zeroPad(2, Math.floor(ms / (3600 * 1000)));
  const minutes = zeroPad(2, Math.floor((ms / (60 * 1000)) % 60));
  const seconds = zeroPad(2, Math.floor((ms / 1000) % 60));
  const deciseconds = Math.floor(ms / 100) % 10;
  return `${hours}:${minutes}:${seconds}.${deciseconds}`;
}

export const getColumnStyle = (colCount: number) => ({
  gridTemplateColumns: `repeat(${colCount}, 1fr)`,
});

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export function renderedCellValue(renderStyle: number, value: number) {
  if (value === 0) {
    return;
  }
  switch (renderStyle) {
    case 1:
      return letters[value - 1];
    case 2:
      return value < 10 ? value : letters[value - 10];
    default:
      return value;
  }
}
