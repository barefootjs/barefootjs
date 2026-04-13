/**
 * Apply position styling to an absolutely-positioned container element.
 * Parses a position string like 'top-left' or 'bottom-right'.
 */
export function applyPositionStyle(
  el: HTMLElement,
  position: string,
  offset = '10px',
): void {
  const [vertical, horizontal] = position.split('-')
  el.style[vertical as 'top' | 'bottom'] = offset
  el.style[horizontal as 'left' | 'right'] = offset
}
