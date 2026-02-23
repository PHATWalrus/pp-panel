export function reorderByIndices(items, fromIndex, toIndex) {
  if (!Array.isArray(items)) return [];
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function remapIndexOnMove(currentIndex, fromIndex, toIndex) {
  if (fromIndex === toIndex) return currentIndex;
  if (currentIndex === fromIndex) return toIndex;

  if (fromIndex < toIndex) {
    if (currentIndex > fromIndex && currentIndex <= toIndex) return currentIndex - 1;
    return currentIndex;
  }

  if (currentIndex >= toIndex && currentIndex < fromIndex) return currentIndex + 1;
  return currentIndex;
}
