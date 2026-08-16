# End-to-End Testing

This document provides comprehensive E2E testing patterns using Playwright (primary) and Cypress (secondary).

---

## When to Write E2E Tests

E2E tests verify complete user journeys through the application. Write E2E tests for:

- Critical user flows (authentication, checkout, onboarding)
- Happy path scenarios for key features
- Cross-browser compatibility verification
- Visual regression testing

```
┌─────────────────────────────────────────────────────────────────────────┐
│  E2E tests are the most expensive to run and maintain.                 │
│  Only test CRITICAL user journeys.                                     │
│                                                                         │
│  ✓ Login/logout flow                                                   │
│  ✓ Payment/checkout flow                                               │
│  ✓ User registration                                                   │
│  ✓ Core feature happy paths                                            │
│                                                                         │
│  ❌ Edge cases (cover with unit/integration tests)                     │
│  ❌ Error states (cover with unit/integration tests)                   │
│  ❌ UI variations (cover with component tests)                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Playwright Setup

### Installation

```bash
npm init playwright@latest
# or
yarn create playwright
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## Page Object Model (Required)

All E2E tests MUST use the Page Object Model pattern for maintainability.

### Page Object Definition

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorAlert = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toContainText(message);
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

```typescript
// e2e/pages/DashboardPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByRole('heading', { name: /welcome/i });
    this.userMenu = page.getByRole('button', { name: 'User menu' });
    this.logoutButton = page.getByRole('menuitem', { name: 'Logout' });
    this.sidebar = page.getByRole('navigation', { name: 'Sidebar' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async expectVisible() {
    await expect(this.welcomeMessage).toBeVisible();
  }
}
```

```typescript
// e2e/pages/index.ts
export { LoginPage } from './LoginPage';
export { DashboardPage } from './DashboardPage';
export { CheckoutPage } from './CheckoutPage';
export { ProductPage } from './ProductPage';
```

---

## Test Structure

### Basic Test File

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      // Arrange
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      // Act
      await loginPage.goto();
      await loginPage.login('user@example.com', 'password123');

      // Assert
      await dashboardPage.expectVisible();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Arrange
      const loginPage = new LoginPage(page);

      // Act
      await loginPage.goto();
      await loginPage.login('user@example.com', 'wrongpassword');

      // Assert
      await loginPage.expectError('Invalid email or password');
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to requested page after login', async ({ page }) => {
      // Arrange
      const loginPage = new LoginPage(page);

      // Act
      await page.goto('/settings'); // Protected page
      await loginPage.login('user@example.com', 'password123');

      // Assert
      await expect(page).toHaveURL('/settings');
    });
  });

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login('user@example.com', 'password123');
    });

    test('should logout and redirect to login', async ({ page }) => {
      // Arrange
      const dashboardPage = new DashboardPage(page);

      // Act
      await dashboardPage.logout();

      // Assert
      await expect(page).toHaveURL('/login');
    });

    test('should clear session on logout', async ({ page, context }) => {
      // Arrange
      const dashboardPage = new DashboardPage(page);

      // Act
      await dashboardPage.logout();

      // Assert
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'session');
      expect(sessionCookie).toBeUndefined();
    });
  });
});
```

### Test with Fixtures

```typescript
// e2e/fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage, DashboardPage, CheckoutPage } from './pages';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  checkoutPage: CheckoutPage;
  authenticatedPage: void;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  authenticatedPage: async ({ page, loginPage }, use) => {
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');
    await use();
  },
});

export { expect } from '@playwright/test';
```

```typescript
// e2e/checkout.spec.ts
import { test, expect } from './fixtures';

test.describe('Checkout', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // User is now logged in
  });

  test('should complete checkout flow', async ({ page, checkoutPage }) => {
    // Arrange
    await page.goto('/products/1');
    await page.getByRole('button', { name: 'Add to cart' }).click();

    // Act
    await checkoutPage.goto();
    await checkoutPage.fillShippingAddress({
      name: 'John Doe',
      address: '123 Main St',
      city: 'New York',
      zip: '10001',
    });
    await checkoutPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvc: '123',
    });
    await checkoutPage.placeOrder();

    // Assert
    await expect(page).toHaveURL(/\/orders\/\w+/);
    await expect(page.getByText('Order confirmed')).toBeVisible();
  });
});
```

---

## API Mocking in E2E Tests

### Using Playwright's Route API

```typescript
// e2e/api-mock.spec.ts
import { test, expect } from '@playwright/test';

test.describe('with mocked API', () => {
  test('should display products from API', async ({ page }) => {
    // Mock the API response
    await page.route('**/api/products', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Product 1', price: 99.99 },
          { id: '2', name: 'Product 2', price: 149.99 },
        ]),
      });
    });

    // Act
    await page.goto('/products');

    // Assert
    await expect(page.getByText('Product 1')).toBeVisible();
    await expect(page.getByText('$99.99')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/products', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Act
    await page.goto('/products');

    // Assert
    await expect(page.getByText('Failed to load products')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });
});
```

---

## Visual Regression Testing

### Screenshot Comparisons

```typescript
// e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('homepage matches snapshot', async ({ page }) => {
    await page.goto('/');

    // Full page screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('product card matches snapshot', async ({ page }) => {
    await page.goto('/products');

    // Component screenshot
    const productCard = page.getByTestId('product-card').first();
    await expect(productCard).toHaveScreenshot('product-card.png');
  });

  test('responsive layouts', async ({ page }) => {
    await page.goto('/');

    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page).toHaveScreenshot('homepage-desktop.png');

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('homepage-tablet.png');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('homepage-mobile.png');
  });
});
```

### Update Screenshots

```bash
# Update all snapshots
npx playwright test --update-snapshots

# Update specific test snapshots
npx playwright test visual.spec.ts --update-snapshots
```

---

## Test Data Management

### Database Seeding

```typescript
// e2e/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Seed database with test data
  const response = await fetch(`${config.projects[0].use.baseURL}/api/test/seed`, {
    method: 'POST',
    headers: { 'X-Test-Secret': process.env.TEST_SECRET! },
  });

  if (!response.ok) {
    throw new Error('Failed to seed database');
  }

  // Create authenticated state for tests
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${config.projects[0].use.baseURL}/login`);
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');

  // Save authentication state
  await page.context().storageState({ path: './e2e/.auth/user.json' });

  await browser.close();
}

export default globalSetup;
```

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: require.resolve('./e2e/global-setup'),
  projects: [
    {
      name: 'authenticated',
      use: {
        storageState: './e2e/.auth/user.json',
      },
    },
  ],
});
```

---

## Cypress (Secondary)

### Setup

```bash
npm install --save-dev cypress
npx cypress open
```

### Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
});
```

### Page Objects in Cypress

```typescript
// cypress/support/pages/LoginPage.ts
export class LoginPage {
  visit() {
    cy.visit('/login');
    return this;
  }

  fillEmail(email: string) {
    cy.get('[data-cy=email-input]').type(email);
    return this;
  }

  fillPassword(password: string) {
    cy.get('[data-cy=password-input]').type(password);
    return this;
  }

  submit() {
    cy.get('[data-cy=submit-button]').click();
    return this;
  }

  login(email: string, password: string) {
    this.fillEmail(email);
    this.fillPassword(password);
    this.submit();
    return this;
  }

  expectError(message: string) {
    cy.get('[data-cy=error-message]').should('contain', message);
    return this;
  }
}

export const loginPage = new LoginPage();
```

### Cypress Test

```typescript
// cypress/e2e/auth.cy.ts
import { loginPage } from '../support/pages/LoginPage';

describe('Authentication', () => {
  describe('Login', () => {
    it('should login with valid credentials', () => {
      loginPage
        .visit()
        .login('user@example.com', 'password123');

      cy.url().should('include', '/dashboard');
      cy.contains('Welcome back').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      loginPage
        .visit()
        .login('user@example.com', 'wrongpassword')
        .expectError('Invalid email or password');

      cy.url().should('include', '/login');
    });
  });
});
```

---

## Best Practices

### 1. Use Semantic Locators

```typescript
// GOOD - Semantic, accessible locators
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter your email')
page.getByText('Welcome back')

// BAD - Brittle CSS selectors
page.locator('#submit-btn')
page.locator('.email-input')
page.locator('div.welcome-message')
```

### 2. Wait for Network Idle

```typescript
// GOOD - Wait for specific conditions
await page.waitForLoadState('networkidle');
await expect(page.getByText('Data loaded')).toBeVisible();

// BAD - Arbitrary delays
await page.waitForTimeout(5000);
```

### 3. Isolate Tests

```typescript
// GOOD - Each test is independent
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Reset state
});

// BAD - Tests depend on each other
test('step 1', async () => { /* creates data */ });
test('step 2', async () => { /* expects data from step 1 */ });
```

### 4. Use Test IDs for Complex Elements

```tsx
// Component
<div data-testid="product-card" className="card">
  <h3 data-testid="product-name">{product.name}</h3>
  <span data-testid="product-price">${product.price}</span>
</div>

// Test
const card = page.getByTestId('product-card').first();
await expect(card.getByTestId('product-name')).toHaveText('Product 1');
```

### 5. Parallelize Tests

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined, // Full parallelism locally
});
```

---

## Accessibility Testing

### Automated A11y Checks

```typescript
// e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should have no a11y violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('login form should be accessible', async ({ page }) => {
    await page.goto('/login');

    const results = await new AxeBuilder({ page })
      .include('[data-testid="login-form"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```
