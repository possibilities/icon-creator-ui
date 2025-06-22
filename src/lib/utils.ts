import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function gapToScaleFactor(gap: number): number {
  const clampedGap = Math.max(0, Math.min(20, gap))
  const minScaleFactor = 0.5
  const maxScaleFactor = 1.0
  const scaleFactor =
    maxScaleFactor - (clampedGap / 20) * (maxScaleFactor - minScaleFactor)
  return scaleFactor
}
