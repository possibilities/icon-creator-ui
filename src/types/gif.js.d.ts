declare module 'gif.js' {
  interface GIFOptions {
    repeat?: number
    quality?: number
    workers?: number
    workerScript?: string
    background?: string
    width?: number | null
    height?: number | null
    transparent?: string | null
    dither?: string | boolean
    debug?: boolean
  }

  interface AddFrameOptions {
    delay?: number
    copy?: boolean
    dispose?: number
  }

  class GIF {
    constructor(options?: GIFOptions)
    addFrame(
      element: HTMLImageElement | HTMLCanvasElement | CanvasRenderingContext2D,
      options?: AddFrameOptions,
    ): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'error', callback: (error: Error) => void): void
    render(): void
    abort(): void
    setOptions(options: GIFOptions): void
  }

  export = GIF
}
