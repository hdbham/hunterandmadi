# Testing Guide

This document describes the testing setup for the wedding website.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers (for E2E tests):
```bash
npx playwright install --with-deps
```

## Running Tests

### Run all unit tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with coverage:
```bash
npm run test:coverage
```

### Run end-to-end tests:
```bash
npm run test:e2e
```

### Run E2E tests with UI:
```bash
npm run test:e2e:ui
```

### Run all tests (unit + E2E):
```bash
npm run test:all
```

## Test Structure

### Unit Tests (`tests/rsvp-form.test.js`)
- Form initialization
- Step navigation
- Attendee management
- Form validation
- Form submission

### Integration Tests (`tests/integration.test.js`)
- Page navigation
- Complete form flow
- Mobile swipe navigation

### End-to-End Tests (`tests/e2e/rsvp-form.spec.js`)
- Full form submission flow
- Browser compatibility testing
- Mobile swipe navigation
- Error handling

## Continuous Integration

Tests are automatically run on:
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches

The CI pipeline runs on GitHub Actions and includes:
- Unit tests on Node.js 18.x and 20.x
- E2E tests with Playwright (Chrome, Firefox, Safari)
- Coverage reports uploaded to Codecov

## Writing New Tests

When adding new features, add corresponding tests:

1. For form functionality, add tests to `tests/rsvp-form.test.js`
2. For integration scenarios, add tests to `tests/integration.test.js`
3. For browser-based testing, add tests to `tests/e2e/rsvp-form.spec.js`
4. Follow the existing test structure and naming conventions

## Test Coverage

Aim for high test coverage of critical functionality:
- Form validation logic
- Step navigation
- Attendee management
- Form submission
- Error handling

