---
name: wednesday-testing
description: Comprehensive testing guidelines ensuring AI agents write unit, integration, E2E, and contract tests for all code produced. Enforces 80% line coverage, 70% branch coverage, factory patterns for test data, and mandatory contract testing for microservices.
license: MIT
metadata:
  author: wednesday-solutions
  version: "1.0"
compatibility: Jest 29+, Vitest 1+, Pytest 7+, Go 1.21+, JUnit 5+, Playwright 1.40+, Cypress 13+, Pact 12+, Testcontainers, Detox 20+, XCTest, Espresso, Appium 2+
---

# Wednesday Testing Standards & Best Practices

This skill establishes comprehensive testing standards for Wednesday Solutions projects. These guidelines ensure reliable, maintainable, and performant tests across all supported languages and frameworks.

---

## CRITICAL: EVERY CODE CHANGE REQUIRES TESTS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   THIS IS A MANDATORY REQUIREMENT. NO EXCEPTIONS.                       │
│                                                                         │
│   DO NOT submit code without corresponding tests.                       │
│   All code changes MUST have:                                           │
│                                                                         │
│   ✓ Unit tests for business logic                                       │
│   ✓ Integration tests for external dependencies                         │
│   ✓ E2E tests for critical user flows                                   │
│   ✓ Contract tests for microservice boundaries                          │
│                                                                         │
│   ❌ NO CODE IS COMPLETE WITHOUT TESTS                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Matters

1. **Reliability** - Tests catch regressions before production
2. **Documentation** - Tests serve as living documentation
3. **Confidence** - Refactoring becomes safe with test coverage
4. **Speed** - Automated tests are faster than manual testing
5. **Quality** - Tests force better design through testability

---

## 1. Test Decision Matrix

Before writing any code, determine which test types are required:

| Scenario                          | Unit | Integration | E2E | Contract |
|-----------------------------------|:----:|:-----------:|:---:|:--------:|
| Pure utility function             | YES  | -           | -   | -        |
| React/Vue/Angular component       | YES  | -           | -   | -        |
| React component with API calls    | YES  | YES         | -   | -        |
| API endpoint handler              | YES  | YES         | -   | YES*     |
| Database repository/model         | -    | YES         | -   | -        |
| User authentication flow          | YES  | YES         | YES | YES*     |
| Payment/checkout flow             | YES  | YES         | YES | YES      |
| Service-to-service communication  | YES  | YES         | -   | YES      |
| Message queue producer/consumer   | YES  | YES         | -   | YES      |
| Third-party API integration       | YES  | YES         | -   | -        |
| Bug fix                           | YES  | **          | **  | -        |
| React Native/Flutter component    | YES  | -           | -   | -        |
| Mobile screen with navigation     | YES  | YES         | YES | -        |
| Native module/plugin              | YES  | YES         | -   | -        |
| Deep link handling                | YES  | -           | YES | -        |
| Push notification handling        | YES  | -           | YES | -        |
| Biometric authentication          | YES  | -           | YES | -        |
| Gesture-based interaction         | YES  | -           | YES | -        |

`*` Required if exposed as API to other services
`**` Regression test at appropriate level

---

## 2. Coverage Requirements

### Minimum Thresholds

| Metric              | Minimum | Target  | Critical Path |
|---------------------|:-------:|:-------:|:-------------:|
| Line Coverage       | 80%     | 90%     | 100%          |
| Branch Coverage     | 70%     | 85%     | 95%           |
| Function Coverage   | 80%     | 90%     | 100%          |
| Statement Coverage  | 80%     | 90%     | 100%          |

### Coverage by Component Type

| Component Type          | Line Min | Branch Min |
|-------------------------|:--------:|:----------:|
| Business logic          | 90%      | 85%        |
| API handlers            | 85%      | 80%        |
| React/Vue components    | 80%      | 70%        |
| Utility functions       | 95%      | 90%        |
| Database repositories   | 85%      | 75%        |
| Critical paths (auth/pay)| 100%    | 95%        |

See [references/COVERAGE.md](references/COVERAGE.md) for configuration details.

---

## 3. Language/Framework Quick Reference

| Language    | Unit Framework        | Integration           | E2E        | Contract |
|-------------|----------------------|----------------------|------------|----------|
| TypeScript  | Jest / Vitest        | Supertest + MSW      | Playwright | Pact     |
| React       | RTL + Jest/Vitest    | MSW                  | Playwright | -        |
| Next.js     | Jest + RTL           | Supertest + MSW      | Playwright | Pact     |
| Vue         | Vue Test Utils       | MSW                  | Playwright | -        |
| Angular     | Jasmine/Jest         | Angular Testing      | Playwright | -        |
| Python      | pytest               | pytest + testcontainers | Playwright | Pact  |
| Go          | testing + testify    | testcontainers-go    | Playwright | Pact     |
| Java/Kotlin | JUnit 5 + Mockito    | Testcontainers       | Playwright | Pact     |
| React Native| Jest + RNTL          | MSW                  | Detox      | Pact     |
| Flutter     | flutter_test         | integration_test     | integration_test | - |
| iOS (Swift) | XCTest               | XCTest               | XCUITest   | Pact     |
| Android     | JUnit + Mockk        | Espresso             | UI Automator| Pact    |

---

## 4. Test Structure: AAA Pattern

All tests MUST follow the Arrange-Act-Assert pattern:

```typescript
// GOOD - Clear AAA structure
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with generated ID and hashed password', async () => {
      // Arrange - Set up test data using factories
      const userData = UserFactory.build({
        email: 'test@example.com',
        password: 'securePassword123'
      });
      const mockRepo = createMockUserRepository();

      // Act - Execute the code under test
      const result = await userService.createUser(userData);

      // Assert - Verify the expected outcome
      expect(result.id).toMatch(/^usr_[a-z0-9]+$/);
      expect(result.email).toBe('test@example.com');
      expect(result.passwordHash).not.toBe('securePassword123');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      );
    });
  });
});
```

```typescript
// BAD - No clear structure, multiple concerns
test('user creation', async () => {
  const result = await createUser({ name: 'John', email: 'john@test.com', password: '123' });
  expect(result.name).toBe('John');
  expect(result.id).toBeDefined();
  const fetched = await getUser(result.id);
  expect(fetched.email).toBe('john@test.com');
});
```

See [references/UNIT-TESTING.md](references/UNIT-TESTING.md) for language-specific patterns.

---

## 5. Test Data: Factory Pattern Required

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TEST DATA MUST USE FACTORIES. NO INLINE OBJECT LITERALS.               │
│                                                                         │
│  ❌ WRONG:                                                              │
│  const user = { id: '1', name: 'John', email: 'john@test.com' };        │
│                                                                         │
│  ✓ CORRECT:                                                             │
│  const user = UserFactory.build({ name: 'John' });                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Factory Libraries by Language

| Language    | Library                | Example                              |
|-------------|------------------------|--------------------------------------|
| TypeScript  | Fishery + @faker-js    | `UserFactory.build({ role: 'admin' })` |
| Python      | factory_boy + Faker    | `UserFactory(role='admin')`          |
| Go          | Custom + gofakeit      | `userFactory.Build(WithRole("admin"))` |
| Java/Kotlin | Instancio              | `Instancio.of(User.class).create()`  |

See [references/FACTORIES.md](references/FACTORIES.md) for complete patterns.

---

## 6. Contract Testing for Microservices

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CONTRACT TESTING IS MANDATORY FOR ALL MICROSERVICE BOUNDARIES          │
│                                                                         │
│  If your code:                                                          │
│  - Exposes an API consumed by other services → Provider contract        │
│  - Consumes an API from another service → Consumer contract             │
│  - Publishes events to a message queue → Producer contract              │
│  - Subscribes to events from a queue → Consumer contract                │
│                                                                         │
│  ❌ NO EXCEPTIONS. Missing contract tests = PR REJECTED                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Consumer Contract Example (TypeScript/Pact)

```typescript
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'UserService',
});

describe('UserService API Contract', () => {
  it('returns user details for valid user ID', async () => {
    await provider
      .given('user with ID 123 exists')
      .uponReceiving('a request for user details')
      .withRequest({
        method: 'GET',
        path: '/api/users/123',
        headers: { Authorization: MatchersV3.regex(/Bearer .+/, 'Bearer token') },
      })
      .willRespondWith({
        status: 200,
        body: MatchersV3.like({
          id: '123',
          email: 'user@example.com',
          name: 'John Doe',
        }),
      })
      .executeTest(async (mockServer) => {
        const client = new UserClient(mockServer.url);
        const user = await client.getUser('123');

        expect(user.id).toBe('123');
        expect(user.email).toBe('user@example.com');
      });
  });
});
```

See [references/CONTRACT-TESTING.md](references/CONTRACT-TESTING.md) for provider verification and event-driven patterns.

---

## 7. E2E Testing with Playwright

### Required: Page Object Model

```typescript
// GOOD - Page Object Model
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  async expectError(message: string) {
    await expect(this.page.getByRole('alert')).toContainText(message);
  }
}

// tests/auth.spec.ts
test('successful login redirects to dashboard', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('Welcome back')).toBeVisible();
});
```

```typescript
// BAD - Direct selectors in tests
test('login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'test@example.com');
  await page.fill('#password', 'password');
  await page.click('button[type="submit"]');
});
```

See [references/E2E-TESTING.md](references/E2E-TESTING.md) for configuration and advanced patterns.

---

## 8. Integration Testing

### Database Testing with Testcontainers

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

describe('UserRepository', () => {
  let container: StartedPostgreSqlContainer;
  let repository: UserRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('testdb')
      .start();

    const db = await connectDatabase(container.getConnectionUri());
    await runMigrations(db);
    repository = new UserRepository(db);
  }, 60000);

  afterAll(async () => {
    await container.stop();
  });

  afterEach(async () => {
    await repository.deleteAll(); // Clean slate for each test
  });

  it('should persist and retrieve user', async () => {
    const user = UserFactory.build();

    await repository.save(user);
    const retrieved = await repository.findById(user.id);

    expect(retrieved).toEqual(user);
  });
});
```

See [references/INTEGRATION-TESTING.md](references/INTEGRATION-TESTING.md) for MongoDB, Redis, and API testing patterns.

---

## 9. Mocking Guidelines

### When to Mock vs Use Real Dependencies

| Dependency Type        | Unit Test | Integration Test |
|------------------------|:---------:|:----------------:|
| External HTTP APIs     | MOCK      | MOCK (MSW)       |
| Database               | MOCK      | REAL (container) |
| File system            | MOCK      | REAL (temp dir)  |
| Time/Date              | MOCK      | MOCK             |
| Random/UUID generation | MOCK      | MOCK             |
| Other microservices    | MOCK      | MOCK (contract)  |
| Message queues         | MOCK      | REAL (container) |

### MSW for HTTP Mocking (Frontend)

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json(UserFactory.build({ id: params.id as string }));
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(UserFactory.build(body), { status: 201 });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

See [references/MOCKING.md](references/MOCKING.md) for framework-specific patterns.

---

## 10. Testing Complex Architectures

### Microservices Testing Pyramid

```
┌─────────────────────────────────────────┐
│           E2E Tests (10%)               │  ← Cross-service user journeys
├─────────────────────────────────────────┤
│       Contract Tests (20%)              │  ← Service boundaries (MANDATORY)
├─────────────────────────────────────────┤
│     Integration Tests (30%)             │  ← Database, queues, external APIs
├─────────────────────────────────────────┤
│         Unit Tests (40%)                │  ← Business logic
└─────────────────────────────────────────┘
```

### Microfrontend Testing

- Test each MFE in isolation with its own test suite
- Test shell/host application separately
- Use contract tests for cross-MFE communication
- Test Module Federation remotes with mocked dependencies

### Monorepo Strategy

```bash
# Run only affected tests (Nx)
nx affected --target=test

# Run only affected tests (Turborepo)
npx turbo run test --filter=[origin/main]
```

See [references/ARCHITECTURE-PATTERNS.md](references/ARCHITECTURE-PATTERNS.md) for detailed patterns.

---

## 11. Naming Conventions

### Test Files

| Language    | Pattern                          | Example                    |
|-------------|----------------------------------|----------------------------|
| TypeScript  | `*.test.ts`, `*.spec.ts`        | `UserService.test.ts`      |
| React       | `*.test.tsx`, `*.spec.tsx`      | `Button.test.tsx`          |
| Python      | `test_*.py`, `*_test.py`        | `test_user_service.py`     |
| Go          | `*_test.go`                     | `user_service_test.go`     |
| Java/Kotlin | `*Test.java`, `*Test.kt`        | `UserServiceTest.java`     |

### Test Descriptions

Format: `should [expected behavior] when [condition]`

```typescript
// GOOD
it('should throw ValidationError when email is invalid')
it('should return empty array when no users exist')
it('should hash password before saving user')

// BAD
it('test email validation')
it('works correctly')
it('user creation')
```

---

## 12. Forbidden Patterns

### DO NOT

- ❌ **Test implementation details** - Test behavior, not internal structure
- ❌ **Use snapshot tests for logic** - Only for stable UI components
- ❌ **Write flaky tests** - No timing dependencies, no order dependencies
- ❌ **Leave tests without assertions** - Every test must assert something
- ❌ **Mock what you don't own** - Use integration tests instead
- ❌ **Use `any` type in tests** - Maintain type safety
- ❌ **Skip tests in CI** - No `.skip`, `xit`, `@Disabled` in main branch
- ❌ **Commit without running tests** - Always verify locally first
- ❌ **Use inline object literals** - Use factories for test data
- ❌ **Ignore test failures** - Fix or delete, never ignore

### Anti-Pattern Examples

```typescript
// BAD - Testing implementation details
it('should call repository.save', async () => {
  await service.createUser(userData);
  expect(mockRepo.save).toHaveBeenCalled(); // Implementation detail!
});

// GOOD - Testing behavior
it('should persist user and return created user', async () => {
  const result = await service.createUser(userData);
  const persisted = await repository.findById(result.id);
  expect(persisted).toEqual(result); // Behavior!
});
```

```typescript
// BAD - Flaky timing-dependent test
it('should show loading state', async () => {
  render(<UserList />);
  expect(screen.getByText('Loading...')).toBeVisible();
  await sleep(100); // Race condition!
  expect(screen.getByText('User 1')).toBeVisible();
});

// GOOD - Deterministic async test
it('should show loading then users', async () => {
  render(<UserList />);
  expect(screen.getByText('Loading...')).toBeVisible();
  await waitFor(() => {
    expect(screen.getByText('User 1')).toBeVisible();
  });
});
```

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [references/UNIT-TESTING.md](references/UNIT-TESTING.md) | Unit testing patterns for all languages |
| [references/INTEGRATION-TESTING.md](references/INTEGRATION-TESTING.md) | Database and API integration testing |
| [references/E2E-TESTING.md](references/E2E-TESTING.md) | Playwright and Cypress patterns |
| [references/CONTRACT-TESTING.md](references/CONTRACT-TESTING.md) | Pact contract testing for microservices |
| [references/FACTORIES.md](references/FACTORIES.md) | Factory pattern for test data |
| [references/MOCKING.md](references/MOCKING.md) | Mocking strategies by framework |
| [references/COVERAGE.md](references/COVERAGE.md) | Coverage configuration and enforcement |
| [references/ARCHITECTURE-PATTERNS.md](references/ARCHITECTURE-PATTERNS.md) | Microservices, MFE, monorepo patterns |
| [references/MOBILE-TESTING.md](references/MOBILE-TESTING.md) | React Native, Flutter, iOS, Android, Appium |

---

## Enforcement Rules Summary

### MUST Requirements

- MUST write unit tests for all business logic
- MUST use factories for test data creation
- MUST achieve 80% line coverage, 70% branch coverage
- MUST write contract tests for all microservice boundaries
- MUST use Page Object Model for E2E tests
- MUST follow AAA pattern (Arrange, Act, Assert)
- MUST clean up test state in afterEach/afterAll
- MUST run tests before committing code

### DO NOT Rules

- DO NOT use inline object literals for test data
- DO NOT skip tests in CI (no `.skip` or `xit`)
- DO NOT mock what you don't own
- DO NOT write tests that depend on execution order
- DO NOT use `any` type in test files
- DO NOT test implementation details
- DO NOT commit without running the test suite

---

## Pre-Submission Checklist

Before submitting any PR, verify:

### Coverage Requirements
- [ ] Line coverage >= 80% (90% for critical paths)
- [ ] Branch coverage >= 70% (95% for critical paths)
- [ ] No `istanbul ignore` without documented justification

### Test Types
- [ ] Unit tests for all new functions/methods
- [ ] Integration tests for database/API interactions
- [ ] E2E tests for new user-facing features
- [ ] Contract tests for any new/modified API endpoints (microservices)

### Test Quality
- [ ] Tests use factories, not inline object literals
- [ ] AAA pattern (Arrange, Act, Assert) followed
- [ ] Test names describe behavior: "should X when Y"
- [ ] No flaky tests (deterministic, no timing dependencies)
- [ ] Mocks cleaned up in afterEach/afterAll

### Framework-Specific
- [ ] React components tested with RTL + user-event
- [ ] API tests use Supertest or framework equivalent
- [ ] E2E tests use Page Object Model
- [ ] Contract tests verified with Pact broker (if applicable)

### CI/CD
- [ ] All tests pass locally
- [ ] No skipped tests (`.skip`, `xit`, `@Disabled`)
- [ ] Coverage report reviewed
