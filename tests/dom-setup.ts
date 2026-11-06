import { JSDOM } from "jsdom";
export const dom = new JSDOM(
  '<!doctype html><html><head></head><body><div id="root"></div></body></html>',
  { url: "https://tarot.test", pretendToBeVisual: true },
);
for (const key of [
  "self",
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "SVGElement",
  "NodeList",
  "HTMLCollection",
  "HTMLDialogElement",
  "Element",
  "location",
  "history",
  "localStorage",
] as const) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: dom.window[key],
  });
}
Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  innerWidth: 390,
  matchMedia: () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }),
});
dom.window.matchMedia = globalThis.matchMedia;
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new dom.window.Event("close"));
};

Object.assign(globalThis, {
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
});

// JSDOM has no layout engine; emit explicit sizes for responsive interactions.
const observers = new Map<Element, Set<ResizeObserverMock>>();
class ResizeObserverMock {
  constructor(readonly callback: ResizeObserverCallback) {}
  observe(element: Element) {
    if (!observers.has(element)) observers.set(element, new Set());
    observers.get(element)!.add(this);
    resizeElement(element, 320, 240);
  }
  unobserve(element: Element) {
    observers.get(element)?.delete(this);
  }
  disconnect() {
    for (const targets of observers.values()) targets.delete(this);
  }
}
export function resizeElement(element: Element, width: number, height: number) {
  for (const observer of observers.get(element) ?? []) {
    observer.callback(
      [{ target: element, contentRect: new dom.window.DOMRect(0, 0, width, height) } as ResizeObserverEntry],
      observer as unknown as ResizeObserver,
    );
  }
}
Object.assign(globalThis, { ResizeObserver: ResizeObserverMock });
