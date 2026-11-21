export type TrayKeyEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat?: boolean;
  defaultPrevented?: boolean;
  target?: unknown;
};

export type TrayKeyAction =
  { type: 'move'; delta: -1 | 1 } | { type: 'jump'; index: number } | { type: 'tap' };

type TargetLike = { tagName?: unknown; isContentEditable?: unknown };

function tagOf(target: unknown): string {
  if (typeof target !== 'object' || target === null) {
    return '';
  }
  const { tagName } = target as TargetLike;
  return typeof tagName === 'string' ? tagName.toUpperCase() : '';
}

function isEditable(target: unknown): boolean {
  if (typeof target === 'object' && target !== null) {
    if ((target as TargetLike).isContentEditable === true) {
      return true;
    }
  }
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagOf(target));
}

const moveKeys: Record<string, -1 | 1> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
};

/** The action a key press means, or undefined when the event must be ignored. */
export function trayKeyAction(event: TrayKeyEvent, trayCount: number): TrayKeyAction | undefined {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    return undefined;
  }
  if (event.repeat || event.defaultPrevented || isEditable(event.target)) {
    return undefined;
  }
  const delta = moveKeys[event.key];
  if (delta !== undefined) {
    return { type: 'move', delta };
  }
  if (/^[1-9]$/.test(event.key)) {
    const index = Number(event.key) - 1;
    return index < trayCount ? { type: 'jump', index } : undefined;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    // A focused button (or link) handles Enter and Space itself, as a click.
    return ['BUTTON', 'A'].includes(tagOf(event.target)) ? undefined : { type: 'tap' };
  }
  return undefined;
}

/** The cursor after moving by `delta`, wrapping around the trays. */
export function moveCursor(cursor: number, delta: -1 | 1, trayCount: number): number {
  return (cursor + delta + trayCount) % trayCount;
}

/** Listens for key presses on the window. Returns the function that removes the listener. */
export function listenForTrayKeys(
  trayCount: number,
  onAction: (action: TrayKeyAction) => void,
): () => void {
  function onKeydown(event: KeyboardEvent): void {
    const action = trayKeyAction(event, trayCount);
    if (action !== undefined) {
      event.preventDefault();
      onAction(action);
    }
  }
  globalThis.addEventListener('keydown', onKeydown);
  return () => globalThis.removeEventListener('keydown', onKeydown);
}

/** Moves the keyboard focus to the nth button inside `root`. */
export function focusTray(root: unknown, index: number): void {
  const buttons = (root as ParentNode | null)?.querySelectorAll?.('button');
  buttons?.[index]?.focus();
}
