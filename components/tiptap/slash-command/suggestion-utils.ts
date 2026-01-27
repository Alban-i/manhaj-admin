import { computePosition, flip, shift, offset } from '@floating-ui/dom';

export interface SuggestionClientRect {
  getBoundingClientRect: () => DOMRect;
}

/**
 * Calculate the position for the slash command menu
 * Uses floating-ui for smart positioning with flip and shift
 */
export async function calculateMenuPosition(
  clientRect: SuggestionClientRect,
  menuElement: HTMLElement
): Promise<{ x: number; y: number }> {
  // Create a virtual element for floating-ui
  const virtualElement = {
    getBoundingClientRect: () => clientRect.getBoundingClientRect(),
  };

  const { x, y } = await computePosition(virtualElement, menuElement, {
    placement: 'bottom-start',
    middleware: [
      offset(8), // 8px gap between cursor and menu
      flip({
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
        padding: 16, // Keep 16px from viewport edges
      }),
      shift({
        padding: 16,
      }),
    ],
  });

  return { x, y };
}

/**
 * Create a virtual bounding rect from cursor coordinates
 * Useful when we have x,y coordinates instead of a DOM element
 */
export function createVirtualRect(x: number, y: number, width = 0, height = 0): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect;
}

/**
 * Get the bounding rect from a TipTap suggestion clientRect
 * Handles the case where clientRect might be null
 */
export function getSuggestionRect(clientRect: (() => DOMRect | null) | null): DOMRect | null {
  if (!clientRect) return null;
  return clientRect();
}
