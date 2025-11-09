/**
 * End-to-end tests for RSVP form using Playwright
 */

const { test, expect } = require('@playwright/test');

test.describe('RSVP Form E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    // Navigate to RSVP page
    await page.click('nav a[data-page="rsvp"]');
    await page.waitForSelector('#rsvpForm');
  });

  test('should display form on RSVP page', async ({ page }) => {
    const form = page.locator('#rsvpForm');
    await expect(form).toBeVisible();
  });

  test('should start on ceremony attendance step', async ({ page }) => {
    const firstStep = page.locator('.form-step.active[data-step="0"]');
    await expect(firstStep).toBeVisible();
    
    const ceremonyQuestion = page.locator('text=Will you be attending the ceremony');
    await expect(ceremonyQuestion).toBeVisible();
  });

  test('should navigate to attendees step when selecting Yes', async ({ page }) => {
    // Select "Yes" for ceremony attendance
    await page.check('#ceremony_yes');
    
    // Click next
    await page.click('#nextBtn');
    
    // Should be on attendees step
    const attendeesStep = page.locator('.form-step.active[data-step="1"]');
    await expect(attendeesStep).toBeVisible();
    
    const attendeesTitle = page.locator('text=Who\'s Attending?');
    await expect(attendeesTitle).toBeVisible();
  });

  test('should show not attending message when selecting No', async ({ page }) => {
    // Select "No" for ceremony attendance
    await page.check('#ceremony_no');
    
    // Should show not attending message
    const notAttendingMessage = page.locator('#not-attending-message');
    await expect(notAttendingMessage).toBeVisible();
    
    // Should have Padlet link
    const padletLink = page.locator('a[href*="padlet"]');
    await expect(padletLink).toBeVisible();
  });

  test('should add attendee when add button is clicked', async ({ page }) => {
    // Navigate to attendees step
    await page.check('#ceremony_yes');
    await page.click('#nextBtn');
    await page.waitForSelector('#attendees-container');
    
    // Count initial attendees
    const initialCount = await page.locator('.attendee-card').count();
    
    // Click add attendee button
    await page.click('#addAttendeeBtn');
    
    // Should have one more attendee
    const newCount = await page.locator('.attendee-card').count();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should validate required fields before proceeding', async ({ page }) => {
    // Navigate to attendees step
    await page.check('#ceremony_yes');
    await page.click('#nextBtn');
    await page.waitForSelector('#attendees-container');
    
    // Try to proceed without filling required fields
    await page.click('#nextBtn');
    
    // Should still be on attendees step
    const attendeesStep = page.locator('.form-step.active[data-step="1"]');
    await expect(attendeesStep).toBeVisible();
  });

  test('should complete full form submission', async ({ page }) => {
    // Step 1: Select ceremony attendance
    await page.check('#ceremony_yes');
    await page.click('#nextBtn');
    
    // Step 2: Fill attendee information
    await page.fill('input[name="attendee_name_0"]', 'John Doe');
    await page.fill('input[name="attendee_email_0"]', 'john@example.com');
    await page.fill('input[name="attendee_emergency_name_0"]', 'Jane Doe');
    await page.fill('input[name="attendee_emergency_phone_0"]', '123-456-7890');
    
    await page.click('#nextBtn');
    
    // Step 3: Fill additional information
    await page.fill('textarea[name="song_requests"]', 'Test song request');
    
    // Submit form
    await page.click('#submitBtn');
    
    // Should show success message
    const successMessage = page.locator('.form-message.success');
    await expect(successMessage).toBeVisible();
    
    // Should have registry link
    const registryLink = page.locator('a[onclick*="registry"]');
    await expect(registryLink).toBeVisible();
  });

  test('should handle form submission error gracefully', async ({ page }) => {
    // Mock fetch to return error
    await page.route('**/YOUR_GOOGLE_APPS_SCRIPT_URL_HERE', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    // Fill and submit form
    await page.check('#ceremony_yes');
    await page.click('#nextBtn');
    await page.fill('input[name="attendee_name_0"]', 'John Doe');
    await page.fill('input[name="attendee_email_0"]', 'john@example.com');
    await page.fill('input[name="attendee_emergency_name_0"]', 'Jane Doe');
    await page.fill('input[name="attendee_emergency_phone_0"]', '123-456-7890');
    await page.click('#nextBtn');
    await page.click('#submitBtn');
    
    // Should show error message
    const errorMessage = page.locator('.form-message.error');
    await expect(errorMessage).toBeVisible();
  });
});

test.describe('Mobile Swipe Navigation', () => {
  test('should navigate pages with swipe on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/index.html');
    
    // Get initial page
    const initialPage = await page.locator('.page.active').first();
    const initialPageId = await initialPage.getAttribute('id');
    
    // Simulate swipe left
    await page.touchscreen.tap(300, 400);
    await page.mouse.move(100, 400);
    await page.mouse.up();
    
    // Should navigate to next page
    await page.waitForTimeout(500);
    const newPage = await page.locator('.page.active').first();
    const newPageId = await newPage.getAttribute('id');
    
    expect(newPageId).not.toBe(initialPageId);
  });
});

