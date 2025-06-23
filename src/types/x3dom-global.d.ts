import 'react'

declare global {
  interface Window {
    x3dom?: {
      reload: () => void
      runtime?: unknown
      canvases?: unknown[]
      fields?: {
        SFMatrix4f: new (
          m00: number,
          m01: number,
          m02: number,
          m03: number,
          m10: number,
          m11: number,
          m12: number,
          m13: number,
          m20: number,
          m21: number,
          m22: number,
          m23: number,
          m30: number,
          m31: number,
          m32: number,
          m33: number,
        ) => unknown
      }
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      x3d: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
        style?: React.CSSProperties
        disablewheel?: string
        disablekeys?: string
        disablerightdrag?: string
        disablemiddledrag?: string
        disabledoubleclick?: string
        disablecontextmenu?: string
        disablewheel?: string
      }
      scene: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
      }
      viewpoint: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
        position?: string
        orientation?: string
        fieldofview?: string
      }
      shape: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
      }
      appearance: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
      }
      material: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
        emissivecolor?: string
        diffusecolor?: string
      }
      indexedfaceset: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
        solid?: string
        coordindex?: string | number[]
      }
      coordinate: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        is?: string
        point?: string | number[]
      }
    }
  }
}
