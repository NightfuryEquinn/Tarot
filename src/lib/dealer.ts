/** Two fans on wider tables and three on phones keep the whole deck in view. */
export function fanColumns(width: number) {
  return width >= 700 ? 39 : 26;
}

export function fanLayout(
  index: number,
  columns: number,
  width: number,
  height: number,
  count = 78,
) {
  const row = Math.floor(index / columns);
  const rowCount = Math.min(columns, count - row * columns);
  const t = rowCount > 1 ? ((index % columns) / (rowCount - 1) - 0.5) * 2 : 0;
  const rowHeight = height / Math.ceil(count / columns);
  const radians = (32 * Math.PI) / 180;
  // Account for rotated corners and the arc before sizing the card surfaces.
  const cardHeight = Math.max(
    0,
    Math.min(180, rowHeight / (Math.cos(radians) + 0.6 * Math.sin(radians) + 0.5), width * 0.33),
  );
  const cardWidth = cardHeight * 0.6;
  const bow = cardHeight * 0.5;
  const inset = (cardWidth * Math.cos(radians) + cardHeight * Math.sin(radians)) / 2 + 4;
  const span = Math.max(0, width - 2 * inset);
  return {
    row,
    x: width / 2 + (t * span) / 2,
    y: (rowHeight - bow) / 2 + bow * t * t,
    rowHeight,
    width: cardWidth,
    height: cardHeight,
    hitWidth: span / Math.max(1, rowCount - 1),
    angle: t * 32,
  };
}

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
