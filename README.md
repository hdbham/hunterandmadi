# Hunter and Madi's Wedding Website

A beautiful wedding website with RSVP form functionality.

## Features

- Multi-page wedding website
- Step-by-step RSVP form
- Mobile-responsive design
- Swipe navigation for mobile devices
- Google Sheets integration for RSVP data

## Setup

1. Clone the repository
2. Open `index.html` in a web browser

## Testing

This project includes automated tests for the RSVP form functionality.

### Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Or use the test runner script
./tests/run-tests.sh
```

### Test Commands

- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:all` - Run all tests

See [README-TESTS.md](README-TESTS.md) for detailed testing documentation.

## Deployment

The website is deployed via GitHub Pages. See `.github/workflows/pages.yml` for deployment configuration.

## RSVP Form Setup

See [RSVP-FORM-SETUP.md](RSVP-FORM-SETUP.md) for instructions on setting up the Google Apps Script and Google Sheets integration.
