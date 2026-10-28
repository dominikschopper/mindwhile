/** The element that currently has focus, to hand it back after a dialog closes. */
export type FocusTarget = ReturnType<typeof activeElement>

export function activeElement(): Element | null {
  return document.activeElement
}

/** Gives focus back to the element that had it before a dialog opened. */
export function restoreFocus(element: FocusTarget): void {
  if (element instanceof HTMLElement && element.isConnected) element.focus()
}
