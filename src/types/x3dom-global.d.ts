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
        style?: React.CSSProperties
      }
      scene: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      viewpoint: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        position?: string
        orientation?: string
        fieldofview?: string
      }
      shape: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      appearance: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >
      material: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        emissivecolor?: string
        diffusecolor?: string
      }
      indexedfaceset: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        solid?: string
        coordindex?: string | number[]
      }
      coordinate: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        point?: string | number[]
      }
    }
  }
}
