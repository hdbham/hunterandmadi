/**
 * Tests for RSVP Form structure
 * 
 * Note: These tests focus on testing the form HTML structure.
 * For full functionality testing, use the Playwright E2E tests.
 */

const fs = require('fs');
const path = require('path');

describe('RSVP Form Structure', () => {
  let html;
  
  beforeAll(() => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    html = fs.readFileSync(htmlPath, 'utf8');
  });

  describe('Form HTML Structure', () => {
    test('should have RSVP form element', () => {
      expect(html).toMatch(/id="rsvpForm"/);
    });

    test('should have step indicator', () => {
      expect(html).toMatch(/id="stepIndicator"/);
    });

    test('should have navigation buttons', () => {
      expect(html).toMatch(/id="nextBtn"/);
      expect(html).toMatch(/id="prevBtn"/);
      expect(html).toMatch(/id="submitBtn"/);
    });

    test('should have ceremony attendance step', () => {
      expect(html).toMatch(/data-step="0"/);
      expect(html).toMatch(/id="ceremony_yes"/);
      expect(html).toMatch(/id="ceremony_no"/);
    });

    test('should have attendees step', () => {
      expect(html).toMatch(/data-step="1"/);
      expect(html).toMatch(/id="attendees-container"/);
      expect(html).toMatch(/id="addAttendeeBtn"/);
    });

    test('should have additional information step', () => {
      expect(html).toMatch(/data-step="2"/);
    });

    test('should have form message element', () => {
      expect(html).toMatch(/id="formMessage"/);
    });

    test('should have not attending message', () => {
      expect(html).toMatch(/id="not-attending-message"/);
    });
  });

  describe('Attendee Card Structure', () => {
    test('should have attendee card structure in JavaScript', () => {
      // Check that the createAttendeeCard function creates the right structure
      expect(html).toMatch(/attendee_name_/);
      expect(html).toMatch(/attendee_emergency_name_/);
      expect(html).toMatch(/attendee_emergency_phone_/);
      expect(html).toMatch(/attendee_dietary_/);
      expect(html).toMatch(/attendee_health_/);
    });

    test('should have email field for first attendee', () => {
      expect(html).toMatch(/attendee_email_\$\{index\}/);
    });

    test('should have phone field for first attendee', () => {
      expect(html).toMatch(/attendee_phone_\$\{index\}/);
    });

    test('should have overnight stay fields', () => {
      expect(html).toMatch(/arrival_\$\{index\}/);
      expect(html).toMatch(/sleeping_\$\{index\}/);
      expect(html).toMatch(/packing_list_\$\{index\}/);
    });

    test('should have meal preference fields', () => {
      expect(html).toMatch(/meals_\$\{index\}/);
    });
  });

  describe('Form Fields', () => {
    test('should have song requests field', () => {
      expect(html).toMatch(/name="song_requests"/);
    });

    test('should have comments field', () => {
      expect(html).toMatch(/name="comments"/);
    });
  });

  describe('Form Submission', () => {
    test('should have form submission handler', () => {
      expect(html).toMatch(/addEventListener\s*\(\s*['"]submit['"]/);
    });

    test('should have registry link in success message', () => {
      expect(html).toMatch(/showPage\s*\(\s*['"]registry['"]/);
    });
  });
});
