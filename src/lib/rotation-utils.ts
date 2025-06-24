export function wrapAngle(angle: number): number {
  let wrapped = angle % 360
  if (wrapped > 180) wrapped -= 360
  if (wrapped < -180) wrapped += 360
  return wrapped
}
