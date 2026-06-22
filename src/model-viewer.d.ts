/**
 * Tipagem JSX para o custom element <model-viewer> do @google/model-viewer.
 * O pacote não publica tipos JSX prontos — só a classe do elemento.
 */
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string
  'ios-src'?: string
  alt?: string
  ar?: boolean
  'ar-modes'?: string
  'ar-scale'?: string
  'ar-placement'?: string
  'camera-controls'?: boolean
  'auto-rotate'?: boolean
  'shadow-intensity'?: string
  'shadow-softness'?: string
  exposure?: string
  poster?: string
  reveal?: string
  loading?: string
  'environment-image'?: string
  'disable-zoom'?: boolean
  'camera-orbit'?: string
  'field-of-view'?: string
  'interaction-prompt'?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes
    }
  }
}

export {}
