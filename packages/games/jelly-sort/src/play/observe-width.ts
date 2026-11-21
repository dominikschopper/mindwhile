type ObserverLike = { observe(target: unknown): void; disconnect(): void };
type ObserverFactory = (callback: (width: number) => void) => ObserverLike | null;

function defaultFactory(callback: (width: number) => void): ObserverLike | null {
  if (typeof ResizeObserver === 'undefined') {
    return null;
  }
  return new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width;
    if (typeof width === 'number') {
      callback(width);
    }
  });
}

/**
 * Reports the content width of `element` now and on every resize. Returns a stop function.
 * Without a `ResizeObserver` nothing is reported. `factory` is injectable for tests.
 */
export function observeWidth(
  element: unknown,
  onWidth: (width: number) => void,
  factory: ObserverFactory = defaultFactory,
): () => void {
  if (typeof element !== 'object' || element === null) {
    return () => {};
  }
  const observer = factory(onWidth);
  if (observer === null) {
    return () => {};
  }
  observer.observe(element);
  return () => observer.disconnect();
}
