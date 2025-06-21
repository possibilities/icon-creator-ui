import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function gapToScaleFactor(gap: number): number {
  const clampedGap = Math.max(1, Math.min(20, gap))
  const minScaleFactor = 0.5
  const maxScaleFactor = 0.99
  const scaleFactor =
    maxScaleFactor - ((clampedGap - 1) / 19) * (maxScaleFactor - minScaleFactor)
  return scaleFactor
}
