import { JSDOM } from 'jsdom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'bun:test';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

(global as any).document = dom.window.document;
(global as any).window = dom.window;
(global as any).navigator = dom.window.navigator;
(global as any).HTMLElement = dom.window.HTMLElement;
(global as any).Node = dom.window.Node;
(global as any).Event = dom.window.Event;

afterEach(() => {
  cleanup();
});
