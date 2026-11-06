/** Keyboard traversal for the responsive, face-down HTML deck. */
export function adjacentCard(
  index: number,
  key: string,
  columns: number,
  selected: number[],
) {
  const step =
    key === "ArrowLeft"
      ? -1
      : key === "ArrowRight"
        ? 1
        : key === "ArrowUp"
          ? -columns
          : key === "ArrowDown"
            ? columns
            : 0;
  let next = key === "Home" ? 0 : key === "End" ? 77 : index + step;
  if (!step && key !== "Home" && key !== "End") return index;
  while (next >= 0 && next < 78 && selected.includes(next))
    next += step || (key === "Home" ? 1 : -1);
  return next >= 0 && next < 78 ? next : index;
}
