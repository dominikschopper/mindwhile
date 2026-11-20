// Publishes the height of an element as a CSS custom property on the root element,
// so other chrome (the toast host) can sit directly under the sticky header.
export type HeaderElement = HTMLElement;

export function trackHeight(element: HeaderElement, property: string): () => void {
  const root = document.documentElement;
  const update = (): void => {
    root.style.setProperty(property, `${element.offsetHeight}px`);
  };
  update();
  if (typeof ResizeObserver === 'undefined') {
    return () => root.style.removeProperty(property);
  }
  const observer = new ResizeObserver(update);
  observer.observe(element);
  return () => {
    observer.disconnect();
    root.style.removeProperty(property);
  };
}
