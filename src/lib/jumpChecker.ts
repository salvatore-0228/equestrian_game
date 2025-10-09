/**
 * isJumpSuccessful
 * Returns true when a jump occurred at or before (fenceX - buffer).
 * - horseX: current x coordinate of the horse at the moment of jump
 * - fenceX: x coordinate of the fence/obstacle
 * - buffer: number of pixels before the fence that still counts as a successful jump (default 20)
 */
export default function isJumpSuccessful(horseX: number, fenceX: number, buffer = 300): boolean {
  if (typeof horseX === undefined || typeof fenceX === undefined) return false;
  return Math.abs(horseX - fenceX) <= buffer;
}
