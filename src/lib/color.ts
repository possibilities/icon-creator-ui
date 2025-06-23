export async function cssVarToX3dColor(varName: string): Promise<string> {
  const Color = (await import('colorjs.io')).default

  const cssValue = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()

  if (!cssValue) {
    return '1 1 1'
  }

  const color = new Color(cssValue)
  const srgb = color.to('srgb')

  const [r, g, b] = srgb.coords.map(c => Math.max(0, Math.min(1, c)))

  return `${r.toFixed(4)} ${g.toFixed(4)} ${b.toFixed(4)}`
}
