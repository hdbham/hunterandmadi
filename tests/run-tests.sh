#!/bin/bash

# Test runner script for wedding website

echo "🧪 Running Wedding Website Tests"
echo "================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
  echo ""
fi

# Run unit tests
echo "🔬 Running unit tests..."
npm test
UNIT_TEST_EXIT=$?

echo ""

# Run E2E tests if Playwright is installed
if command -v npx &> /dev/null && npx playwright --version &> /dev/null; then
  echo "🌐 Running E2E tests..."
  npm run test:e2e
  E2E_TEST_EXIT=$?
else
  echo "⚠️  Playwright not installed. Skipping E2E tests."
  echo "   Run 'npx playwright install --with-deps' to install."
  E2E_TEST_EXIT=0
fi

echo ""
echo "================================"

# Exit with error if any tests failed
if [ $UNIT_TEST_EXIT -ne 0 ] || [ $E2E_TEST_EXIT -ne 0 ]; then
  echo "❌ Some tests failed"
  exit 1
else
  echo "✅ All tests passed!"
  exit 0
fi

