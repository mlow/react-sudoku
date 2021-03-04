function zeroPad(n: number, length: number = 2) {
  return String(n).padStart(length, "0");
}

export function formatElapsedMilliseconds(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${zeroPad(hours)}:${zeroPad(minutes % 60)}:${zeroPad(seconds % 60)}`;
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
