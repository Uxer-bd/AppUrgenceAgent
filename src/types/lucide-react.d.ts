declare module 'lucide-react' {
  import * as React from 'react';

  /**
   * Props used by lucide-react icon components.
   * Extends standard SVG props and adds common lucide options.
   */
  export type LucideProps = React.SVGProps<SVGSVGElement> & {
    size?: number | string;
    color?: string;
    strokeWidth?: number;
  };

  // A single icon component type
  export type LucideIcon = React.ComponentType<LucideProps>;

  /**
   * Default export contains a map of icon name -> component.
   * Also provide a small set of helpers so imports receive useful types
   * instead of implicit `any`.
   */
  const icons: { [key: string]: LucideIcon };
  export default icons;

  // helper used by library to create icons (typed as best-effort)
  export function createLucideIcon(name: string, component: LucideIcon): LucideIcon;

  // Provide a generic named export signature so consumers that do
  // `import { X } from 'lucide-react'` will at least get a component type
  // (TypeScript can't list every icon here, so this is a best-effort).
  // Use `any` only in an index position is avoided; we expose the component type.
  // Consumers can still import the default map if they prefer programmatic access.
  export const Icon: LucideIcon;
}
