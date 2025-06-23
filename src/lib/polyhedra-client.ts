export function gapToScaleFactor(gap: number): number {
  const clampedGap = Math.max(1, Math.min(20, gap))
  const scaleFactor = 1.0 - (0.005 + (clampedGap - 1) * 0.005)
  return scaleFactor
}
