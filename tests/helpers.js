/**
 * Test helpers for loading and manipulating the HTML
 */

// Polyfill for TextEncoder/TextDecoder (for Node < 18)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

/**
 * Load the HTML file and return a JSDOM instance
 */
function loadHTML() {
  const htmlPath = path.resolve(__dirname, '../index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  
  // Remove Google Maps script to avoid loading issues in tests
  let htmlWithoutMaps = html.replace(
    /<script[^>]*maps\.googleapis\.com[^>]*><\/script>/gi,
    ''
  );
  
  // Also remove any inline scripts that might load Google Maps
  htmlWithoutMaps = htmlWithoutMaps.replace(
    /<script[^>]*>[\s\S]*?maps\.googleapis[\s\S]*?<\/script>/gi,
    ''
  );
  
  // Create a virtual console that suppresses errors
  const virtualConsole = new (require('jsdom').VirtualConsole)();
  virtualConsole.on('error', () => {}); // Suppress all errors
  virtualConsole.on('warn', () => {}); // Suppress all warnings
  
  const dom = new JSDOM(htmlWithoutMaps, {
    runScripts: 'outside-only', // Don't run inline scripts to avoid Google Maps issues
    resources: 'usable',
    url: 'http://localhost',
    virtualConsole: virtualConsole,
    pretendToBeVisual: true
  });
  
  // Manually execute the form-related scripts after DOM is ready
  // This avoids Google Maps loading issues
  try {
    const scriptTags = dom.window.document.querySelectorAll('script');
    scriptTags.forEach(script => {
      if (script.src && script.src.includes('maps.googleapis.com')) {
        // Skip Google Maps scripts
        return;
      }
      if (script.textContent && !script.textContent.includes('maps.googleapis.com')) {
        // Execute non-Google Maps scripts
        try {
          dom.window.eval(script.textContent);
        } catch (e) {
          // Ignore script execution errors in tests
        }
      }
    });
  } catch (e) {
    // Ignore script execution errors
  }
  
  // Make JSDOM globals available
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  
  // Polyfill for scrollIntoView (not available in jsdom)
  if (typeof dom.window.Element.prototype.scrollIntoView === 'undefined') {
    dom.window.Element.prototype.scrollIntoView = jest.fn();
  }
  
  // Polyfill for performance API
  if (!dom.window.performance || typeof dom.window.performance.getEntriesByType !== 'function') {
    const originalPerformance = dom.window.performance || {};
    dom.window.performance = {
      getEntriesByType: jest.fn(() => []),
      now: originalPerformance.now || jest.fn(() => Date.now()),
      mark: originalPerformance.mark || jest.fn(),
      measure: originalPerformance.measure || jest.fn(),
      clearMarks: originalPerformance.clearMarks || jest.fn(),
      clearMeasures: originalPerformance.clearMeasures || jest.fn(),
      timing: originalPerformance.timing || {},
      navigation: originalPerformance.navigation || {}
    };
  }
  
  // Mock Google Maps API
  dom.window.google = {
    maps: {
      Map: jest.fn(),
      Marker: jest.fn(),
      Geocoder: jest.fn(),
      places: {
        PlacesService: jest.fn()
      }
    }
  };
  
  // Mock showPage function
  dom.window.showPage = jest.fn();
  global.showPage = jest.fn();
  
  return dom;
}

/**
 * Wait for async operations
 */
function wait(ms = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Trigger an event on an element
 */
function triggerEvent(element, eventType, options = {}) {
  const event = new window.Event(eventType, {
    bubbles: true,
    cancelable: true,
    ...options
  });
  element.dispatchEvent(event);
}

/**
 * Fill out a form field
 */
function fillField(selector, value) {
  const field = document.querySelector(selector);
  if (field) {
    field.value = value;
    triggerEvent(field, 'input');
    triggerEvent(field, 'change');
  }
  return field;
}

/**
 * Click an element
 */
function clickElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    triggerEvent(element, 'click');
  }
  return element;
}

module.exports = {
  loadHTML,
  wait,
  triggerEvent,
  fillField,
  clickElement
};

