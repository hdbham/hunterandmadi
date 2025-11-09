/**
 * Integration tests for the wedding website structure
 * 
 * Note: These tests focus on testing the HTML structure.
 * For full functionality testing, use the Playwright E2E tests.
 */

const fs = require('fs');
const path = require('path');

describe('Wedding Website Structure', () => {
  let html;
  
  beforeAll(() => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    html = fs.readFileSync(htmlPath, 'utf8');
  });

  describe('Page Structure', () => {
    test('should have all required pages', () => {
      const pages = ['home', 'location', 'faq', 'schedule', 'gallery', 'things-to-do', 'registry', 'rsvp'];
      
      pages.forEach(pageId => {
        expect(html).toMatch(new RegExp(`id="${pageId}"`));
      });
    });

    test('should have navigation menu', () => {
      expect(html).toMatch(/<nav/);
    });

    test('should have navigation links', () => {
      expect(html).toMatch(/data-page="rsvp"/);
      expect(html).toMatch(/data-page="registry"/);
    });
  });

  describe('RSVP Form Structure', () => {
    test('should have RSVP form', () => {
      expect(html).toMatch(/id="rsvpForm"/);
    });

    test('should have form steps', () => {
      expect(html).toMatch(/form-step/);
    });

    test('should have form message element', () => {
      expect(html).toMatch(/id="formMessage"/);
    });
  });

  describe('JavaScript Functionality', () => {
    test('should have showPage function', () => {
      expect(html).toMatch(/function\s+showPage/);
    });

    test('should have form step navigation', () => {
      expect(html).toMatch(/function\s+showStep/);
      expect(html).toMatch(/function\s+goToNextStep/);
      expect(html).toMatch(/function\s+prevStep/);
    });

    test('should have attendee management functions', () => {
      expect(html).toMatch(/function\s+createAttendeeCard/);
      expect(html).toMatch(/function\s+addAttendee/);
      expect(html).toMatch(/function\s+removeAttendee/);
    });

    test('should have form submission handler', () => {
      expect(html).toMatch(/addEventListener\s*\(\s*['"]submit['"]/);
    });
  });
});
