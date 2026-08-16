# Architecture-Specific Testing Patterns

This document provides testing patterns for complex architectures: microservices, microfrontends, and monorepos.

---

## Microservices Testing

### Testing Pyramid for Microservices

```
┌─────────────────────────────────────────┐
│           E2E Tests (10%)               │  ← Cross-service user journeys
│         (Critical paths only)           │
├─────────────────────────────────────────┤
│       Contract Tests (20%)              │  ← Service boundaries (MANDATORY)
│     (Pact consumer & provider)          │
├─────────────────────────────────────────┤
│     Integration Tests (30%)             │  ← Database, queues, external APIs
│   (Testcontainers, real dependencies)   │
├─────────────────────────────────────────┤
│         Unit Tests (40%)                │  ← Business logic, pure functions
│      (Fast, isolated, mocked)           │
└─────────────────────────────────────────┘
```

### Service Boundary Testing

Every service boundary MUST have contract tests:

```typescript
// OrderService (Consumer) → UserService (Provider)
// tests/contracts/user-service.consumer.pact.ts

import { PactV3, MatchersV3 } from '@pact-foundation/pact';

describe('OrderService → UserService Contract', () => {
  const provider = new PactV3({
    consumer: 'OrderService',
    provider: 'UserService',
  });

  it('can fetch user by ID', async () => {
    await provider
      .given('user exists')
      .uponReceiving('get user request')
      .withRequest({ method: 'GET', path: '/api/users/123' })
      .willRespondWith({
        status: 200,
        body: MatchersV3.like({
          id: '123',
          email: 'user@example.com',
        }),
      })
      .executeTest(async (mockServer) => {
        const client = new UserClient(mockServer.url);
        const user = await client.getUser('123');
        expect(user.id).toBe('123');
      });
  });
});
```

### Event-Driven Testing

```typescript
// Message Producer Tests
describe('OrderEventProducer', () => {
  let messageBroker: StartedTestContainer;
  let producer: OrderEventProducer;

  beforeAll(async () => {
    messageBroker = await new GenericContainer('rabbitmq:3-management')
      .withExposedPorts(5672)
      .start();

    producer = new OrderEventProducer({
      url: `amqp://localhost:${messageBroker.getMappedPort(5672)}`,
    });
  });

  it('should publish OrderCreated event', async () => {
    // Arrange
    const order = OrderFactory.build();
    const consumer = await createTestConsumer('order.created');

    // Act
    await producer.publishOrderCreated(order);

    // Assert
    const message = await consumer.waitForMessage(5000);
    expect(message.orderId).toBe(order.id);
    expect(message.eventType).toBe('OrderCreated');
  });
});

// Message Consumer Tests
describe('InventoryEventHandler', () => {
  it('should reserve inventory on OrderCreated', async () => {
    // Arrange
    const event = {
      eventType: 'OrderCreated',
      payload: {
        orderId: 'order-123',
        items: [{ productId: 'prod-1', quantity: 2 }],
      },
    };
    const mockInventoryService = createMockInventoryService();

    // Act
    await inventoryHandler.handle(event);

    // Assert
    expect(mockInventoryService.reserve).toHaveBeenCalledWith(
      'prod-1',
      2,
      'order-123'
    );
  });
});
```

### Saga Testing

```typescript
// Test saga orchestration
describe('OrderSaga', () => {
  it('should complete order flow successfully', async () => {
    // Arrange
    const order = OrderFactory.build();
    const saga = new OrderSaga();

    // Mock all participating services
    mockPaymentService.charge.mockResolvedValue({ success: true });
    mockInventoryService.reserve.mockResolvedValue({ success: true });
    mockShippingService.schedule.mockResolvedValue({ trackingId: 'track-123' });

    // Act
    const result = await saga.execute(order);

    // Assert
    expect(result.status).toBe('completed');
    expect(result.trackingId).toBe('track-123');
  });

  it('should compensate on payment failure', async () => {
    // Arrange
    const order = OrderFactory.build();
    const saga = new OrderSaga();

    mockPaymentService.charge.mockResolvedValue({ success: false });

    // Act
    const result = await saga.execute(order);

    // Assert
    expect(result.status).toBe('failed');
    expect(mockInventoryService.release).toHaveBeenCalled(); // Compensation
  });
});
```

### Service Isolation Testing

```typescript
// Each service should be testable in isolation
describe('OrderService (Isolated)', () => {
  // Mock all external service clients
  let mockUserClient: jest.Mocked<UserClient>;
  let mockPaymentClient: jest.Mocked<PaymentClient>;
  let mockInventoryClient: jest.Mocked<InventoryClient>;

  beforeEach(() => {
    mockUserClient = createMockClient(UserClient);
    mockPaymentClient = createMockClient(PaymentClient);
    mockInventoryClient = createMockClient(InventoryClient);
  });

  it('should process order with mocked dependencies', async () => {
    // Arrange
    mockUserClient.getUser.mockResolvedValue(UserFactory.build());
    mockPaymentClient.charge.mockResolvedValue({ success: true });
    mockInventoryClient.reserve.mockResolvedValue({ success: true });

    const orderService = new OrderService({
      userClient: mockUserClient,
      paymentClient: mockPaymentClient,
      inventoryClient: mockInventoryClient,
    });

    // Act
    const order = await orderService.createOrder(OrderFactory.build());

    // Assert
    expect(order.status).toBe('confirmed');
  });
});
```

---

## Microfrontend Testing

### MFE Testing Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                           E2E Tests                                  │
│              (Full application, all MFEs integrated)                 │
├─────────────────────────────────────────────────────────────────────┤
│                    Integration Tests                                 │
│         (Shell + MFE communication, shared state)                    │
├─────────────────────────────────────────────────────────────────────┤
│                    Component Tests                                   │
│              (Individual MFE components)                             │
├─────────────────────────────────────────────────────────────────────┤
│                      Unit Tests                                      │
│          (Business logic, utilities, hooks)                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Testing Individual MFEs

```typescript
// Each MFE should be independently testable
// mfe-checkout/tests/CheckoutWidget.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckoutWidget } from '../src/CheckoutWidget';
import { CartFactory } from './factories';

// Mock the shell's shared context
jest.mock('@shell/shared-context', () => ({
  useSharedCart: jest.fn(),
  useSharedAuth: jest.fn(),
}));

describe('CheckoutWidget (Isolated MFE)', () => {
  beforeEach(() => {
    // Setup shared context mocks
    (useSharedCart as jest.Mock).mockReturnValue({
      items: CartFactory.buildList(3),
      total: 299.99,
    });
    (useSharedAuth as jest.Mock).mockReturnValue({
      user: UserFactory.build(),
      isAuthenticated: true,
    });
  });

  it('should display cart items from shared context', () => {
    render(<CheckoutWidget />);

    expect(screen.getByText('3 items in cart')).toBeInTheDocument();
    expect(screen.getByText('$299.99')).toBeInTheDocument();
  });

  it('should emit checkout event on submit', async () => {
    const onCheckout = jest.fn();
    render(<CheckoutWidget onCheckout={onCheckout} />);

    await userEvent.click(screen.getByRole('button', { name: 'Checkout' }));

    expect(onCheckout).toHaveBeenCalled();
  });
});
```

### Testing Module Federation

```typescript
// Testing federated modules (Webpack 5 / Vite)
// tests/federation.test.tsx

import { render, screen, waitFor } from '@testing-library/react';

// Dynamic import of federated module
const loadCheckoutMFE = () =>
  import('checkout/CheckoutWidget').then((m) => m.CheckoutWidget);

describe('Module Federation Integration', () => {
  it('should load remote CheckoutWidget', async () => {
    // Mock the federated module
    jest.mock('checkout/CheckoutWidget', () => ({
      CheckoutWidget: () => <div>Checkout Widget Loaded</div>,
    }));

    const CheckoutWidget = await loadCheckoutMFE();
    render(<CheckoutWidget />);

    expect(screen.getByText('Checkout Widget Loaded')).toBeInTheDocument();
  });

  it('should handle remote module load failure', async () => {
    // Mock failed load
    jest.mock('checkout/CheckoutWidget', () => {
      throw new Error('Failed to load remote module');
    });

    render(
      <ErrorBoundary fallback={<div>Failed to load checkout</div>}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <RemoteCheckout />
        </React.Suspense>
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load checkout')).toBeInTheDocument();
    });
  });
});
```

### Shell/Host Testing

```typescript
// Testing the shell application that hosts MFEs
// shell/tests/App.test.tsx

describe('Shell Application', () => {
  it('should render navigation with all MFE routes', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('should lazy load MFE on navigation', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Navigate to checkout
    await userEvent.click(screen.getByRole('link', { name: 'Checkout' }));

    // Should show loading state then MFE
    expect(screen.getByText('Loading checkout...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('checkout-mfe')).toBeInTheDocument();
    });
  });

  it('should share authentication state across MFEs', async () => {
    // Login in shell
    render(<App />);
    await loginUser('user@example.com', 'password');

    // Navigate to checkout MFE
    await userEvent.click(screen.getByRole('link', { name: 'Checkout' }));

    // MFE should have access to authenticated user
    await waitFor(() => {
      expect(screen.getByText('Welcome, user@example.com')).toBeInTheDocument();
    });
  });
});
```

### Cross-MFE Communication Testing

```typescript
// Testing event bus communication between MFEs
describe('Cross-MFE Communication', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  it('should send cart update from ProductMFE to CheckoutMFE', async () => {
    const onCartUpdate = jest.fn();

    // Checkout MFE subscribes to cart updates
    eventBus.subscribe('cart:updated', onCartUpdate);

    // Product MFE publishes cart update
    const product = ProductFactory.build();
    eventBus.publish('cart:updated', { product, action: 'add' });

    // Verify Checkout MFE received the event
    expect(onCartUpdate).toHaveBeenCalledWith({
      product,
      action: 'add',
    });
  });

  it('should handle navigation between MFEs', async () => {
    render(
      <MFEProvider eventBus={eventBus}>
        <ProductMFE />
        <CheckoutMFE />
      </MFEProvider>
    );

    // Click "Buy Now" in Product MFE
    await userEvent.click(screen.getByRole('button', { name: 'Buy Now' }));

    // Should navigate to Checkout MFE
    await waitFor(() => {
      expect(screen.getByTestId('checkout-mfe')).toBeVisible();
    });
  });
});
```

### Shared State Testing

```typescript
// Testing shared state management across MFEs
describe('Shared State', () => {
  it('should sync cart state across MFEs', async () => {
    const { result: cartResult } = renderHook(() => useSharedCart(), {
      wrapper: SharedStateProvider,
    });

    // Add item from Product MFE context
    act(() => {
      cartResult.current.addItem(ProductFactory.build());
    });

    // Verify cart count in Checkout MFE
    render(<CheckoutMFE />, { wrapper: SharedStateProvider });
    expect(screen.getByText('1 item in cart')).toBeInTheDocument();
  });
});
```

---

## Monorepo Testing

### Affected Test Strategy

Only run tests for packages affected by changes:

```bash
# Nx
nx affected --target=test --base=origin/main

# Turborepo
npx turbo run test --filter=[origin/main]

# Lerna
npx lerna run test --since origin/main

# pnpm
pnpm -r --filter "...[origin/main]" test
```

### Package-Level Testing

```
monorepo/
├── packages/
│   ├── core/                  # Shared business logic
│   │   ├── src/
│   │   └── tests/
│   │       ├── unit/          # Unit tests for core logic
│   │       └── integration/   # Integration tests
│   ├── ui/                    # Shared UI components
│   │   ├── src/
│   │   └── tests/
│   │       ├── unit/          # Component unit tests
│   │       └── visual/        # Visual regression tests
│   └── api/                   # API package
│       ├── src/
│       └── tests/
│           ├── unit/
│           ├── integration/   # Database tests
│           └── e2e/           # API E2E tests
├── apps/
│   ├── web/                   # Web application
│   │   └── tests/
│   │       ├── unit/
│   │       ├── integration/
│   │       └── e2e/           # Full E2E tests
│   └── mobile/
└── e2e/                       # Cross-package E2E tests
```

### Shared Test Utilities

```typescript
// packages/test-utils/src/index.ts
export { renderWithProviders } from './render';
export { createMockServer } from './msw';
export { UserFactory, ProductFactory, OrderFactory } from './factories';
export { createTestDatabase, seedDatabase } from './database';
export { waitForCondition, retryAsync } from './async';

// Usage in any package
// packages/web/tests/user.test.tsx
import {
  renderWithProviders,
  UserFactory,
  createMockServer,
} from '@monorepo/test-utils';
```

```typescript
// packages/test-utils/src/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@monorepo/auth';
import { ThemeProvider } from '@monorepo/ui';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });
```

### Cross-Package Testing

```typescript
// Testing integration between packages
// packages/web/tests/integration/checkout-flow.test.tsx

import { renderWithProviders } from '@monorepo/test-utils';
import { CheckoutPage } from '../src/pages/CheckoutPage';
import { CartProvider } from '@monorepo/cart';
import { PaymentProvider } from '@monorepo/payment';

describe('Checkout Flow (Cross-Package)', () => {
  it('should process payment using payment package', async () => {
    renderWithProviders(
      <CartProvider>
        <PaymentProvider>
          <CheckoutPage />
        </PaymentProvider>
      </CartProvider>
    );

    // Fill cart (from @monorepo/cart)
    await addItemToCart(ProductFactory.build());

    // Process payment (from @monorepo/payment)
    await fillPaymentForm({
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvc: '123',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Pay' }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText('Payment successful')).toBeInTheDocument();
    });
  });
});
```

### CI Configuration for Monorepos

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            core:
              - 'packages/core/**'
            ui:
              - 'packages/ui/**'
            api:
              - 'packages/api/**'
            web:
              - 'apps/web/**'

  test:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: ${{ fromJson(needs.detect-changes.outputs.packages) }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests for ${{ matrix.package }}
        run: pnpm --filter ${{ matrix.package }} test

  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run E2E tests
        run: pnpm e2e
```

---

## Best Practices Summary

### Microservices

1. **Contract tests are mandatory** for all service boundaries
2. **Test each service in isolation** with mocked dependencies
3. **Use testcontainers** for databases and message brokers
4. **Test saga compensation** logic thoroughly
5. **Keep E2E tests minimal** - only critical user journeys

### Microfrontends

1. **Test each MFE independently** with mocked shell context
2. **Test Module Federation loading** and error handling
3. **Test cross-MFE communication** via event bus
4. **Test shared state synchronization** across MFEs
5. **Shell tests should verify routing** and MFE loading

### Monorepos

1. **Use affected test strategy** to run only relevant tests
2. **Create shared test utilities** package
3. **Test cross-package integration** at appropriate level
4. **Configure CI for parallel** package testing
5. **Maintain consistent test structure** across packages
