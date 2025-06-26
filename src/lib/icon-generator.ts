export async function generatePNGFromSVG(
  svgString: string,
  width: number,
  height: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      if (width <= 32 && height <= 32) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => reject(new Error('Failed to load SVG'))

    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    })
    const svgUrl = URL.createObjectURL(svgBlob)
    img.src = svgUrl
  })
}

export async function generateFaviconSet(
  svgString: string,
): Promise<Record<string, string>> {
  const icons: Record<string, string> = {}

  icons['favicon.svg'] = svgString
  icons['favicon.ico'] = await generatePNGFromSVG(svgString, 16, 16)
  icons['apple-icon.png'] = await generatePNGFromSVG(svgString, 180, 180)
  icons['icon.png'] = await generatePNGFromSVG(svgString, 512, 512)
  icons['icon-192.png'] = await generatePNGFromSVG(svgString, 192, 192)
  icons['icon-512.png'] = await generatePNGFromSVG(svgString, 512, 512)

  return icons
}

export function generateManifest(shapeName: string): string {
  const manifest = {
    name: shapeName,
    short_name: shapeName,
    description: `${shapeName} Progressive Web App`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
  return JSON.stringify(manifest, null, 2)
}
