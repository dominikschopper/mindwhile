import { wobbleStyleSheet } from './wobble';

const STYLE_ID = 'jelly-sort-wobble';

/**
 * Puts the generated wobble keyframes on the page, once. Nothing is fetched, the text comes from
 * wobble.ts, so the numbers exist only there. Does nothing without a document.
 */
export function installWobbleStyles(
  doc: Document | undefined = typeof document === 'undefined' ? undefined : document,
): void {
  if (!doc || doc.getElementById(STYLE_ID)) {
    return;
  }
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = wobbleStyleSheet();
  doc.head.appendChild(style);
}
