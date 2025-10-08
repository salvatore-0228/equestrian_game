export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Returns true if two axis-aligned rectangles intersect.
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function fromDOMRect(r: DOMRect): Rect {
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}
