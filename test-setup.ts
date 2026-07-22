import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

const g = globalThis as Record<string, unknown>;
g.document = dom.window.document;
g.window = dom.window;
g.navigator = dom.window.navigator;
g.HTMLElement = dom.window.HTMLElement;
g.Node = dom.window.Node;
g.Event = dom.window.Event;

// Dynamic import after globals are set so @testing-library/dom binds screen to document
const { cleanup } = await import('@testing-library/react');
const { afterEach } = await import('bun:test');

afterEach(() => {
  cleanup();
});
