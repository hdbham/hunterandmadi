// Jest setup file
require('@testing-library/jest-dom');

// Polyfill for TextEncoder/TextDecoder (for Node < 18)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for scrollIntoView (not available in jsdom)
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = jest.fn();
}

// Polyfill for performance API
if (typeof global.performance === 'undefined' || !global.performance.getEntriesByType) {
  global.performance = {
    getEntriesByType: jest.fn(() => []),
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn()
  };
}

// Mock Google Maps API
global.google = {
  maps: {
    Map: jest.fn(),
    Marker: jest.fn(),
    Geocoder: jest.fn(),
    places: {
      PlacesService: jest.fn()
    }
  }
};

// Mock window.showPage function
global.showPage = jest.fn();

// Mock fetch for form submissions
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  })
);

