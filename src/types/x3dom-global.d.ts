import 'react'

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
        fieldOfView?: string
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
        emissiveColor?: string
        diffuseColor?: string
      }
      indexedFaceSet: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        solid?: string
        coordIndex?: string | number[]
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
