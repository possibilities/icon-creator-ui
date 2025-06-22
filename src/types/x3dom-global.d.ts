import 'react'

declare global {
  interface Window {
    x3dom?: {
      reload: () => void
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
        width?: string
        height?: string
        style?: React.CSSProperties
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
