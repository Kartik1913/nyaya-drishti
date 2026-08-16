# Contract Testing

This document provides comprehensive contract testing patterns for microservices using Pact.

---

## Contract Testing is Mandatory

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

## Why Contract Testing?

Traditional integration testing has limitations in microservices:

| Problem | Contract Testing Solution |
|---------|---------------------------|
| Slow feedback | Tests run in isolation, no need for running services |
| Flaky tests | No network, no timing issues |
| Version conflicts | Contracts versioned and shared via broker |
| Breaking changes | Detected before deployment |
| Environment issues | Tests run without infrastructure |

---

## Pact Setup

### TypeScript/Node.js

```bash
npm install --save-dev @pact-foundation/pact
```

### Python

```bash
pip install pact-python
```

### Go

```bash
go get github.com/pact-foundation/pact-go/v2
```

### Java/Kotlin

```xml
<dependency>
    <groupId>au.com.dius.pact.consumer</groupId>
    <artifactId>junit5</artifactId>
    <version>4.6.5</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>au.com.dius.pact.provider</groupId>
    <artifactId>junit5</artifactId>
    <version>4.6.5</version>
    <scope>test</scope>
</dependency>
```

---

## Consumer-Driven Contract Pattern

The consumer defines the contract based on its needs. The provider then verifies it can fulfill that contract.

```
┌──────────────┐                    ┌──────────────┐
│   Consumer   │                    │   Provider   │
│ (OrderService)│                    │ (UserService)│
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │  1. Consumer writes contract      │
       │     (what it expects)             │
       │                                   │
       ▼                                   │
┌──────────────┐                           │
│ Pact Contract │ ─────────────────────────┤
│    (JSON)     │  2. Published to broker  │
└──────────────┘                           │
       │                                   │
       │  3. Provider verifies contract    │
       │     (can it fulfill?)             │
       │                                   ▼
       │                           ┌──────────────┐
       │                           │ Verification │
       │                           │   Result     │
       └───────────────────────────┴──────────────┘
```

---

## Consumer Contract Tests

### TypeScript

```typescript
// tests/contracts/user-service.consumer.pact.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import { UserClient } from '@/clients/user.client';

const { like, eachLike, regex, integer, string, boolean } = MatchersV3;

const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'UserService',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'warn',
});

describe('UserService API Contract', () => {
  describe('GET /api/users/:id', () => {
    it('returns user details for valid user ID', async () => {
      // Define the expected interaction
      await provider
        .given('user with ID 123 exists')
        .uponReceiving('a request for user details')
        .withRequest({
          method: 'GET',
          path: '/api/users/123',
          headers: {
            Authorization: regex(/Bearer .+/, 'Bearer valid-token'),
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            id: string('123'),
            email: string('user@example.com'),
            name: string('John Doe'),
            role: string('user'),
            isActive: boolean(true),
            createdAt: regex(
              /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
              '2024-01-15T10:30:00.000Z'
            ),
          }),
        })
        .executeTest(async (mockServer) => {
          // Create client pointing to mock server
          const client = new UserClient(mockServer.url);

          // Execute the actual client code
          const user = await client.getUser('123');

          // Verify the response
          expect(user.id).toBe('123');
          expect(user.email).toBe('user@example.com');
          expect(user.name).toBe('John Doe');
        });
    });

    it('returns 404 for non-existent user', async () => {
      await provider
        .given('user with ID 999 does not exist')
        .uponReceiving('a request for non-existent user')
        .withRequest({
          method: 'GET',
          path: '/api/users/999',
          headers: {
            Authorization: regex(/Bearer .+/, 'Bearer valid-token'),
          },
        })
        .willRespondWith({
          status: 404,
          body: like({
            error: string('User not found'),
            code: string('USER_NOT_FOUND'),
          }),
        })
        .executeTest(async (mockServer) => {
          const client = new UserClient(mockServer.url);

          await expect(client.getUser('999')).rejects.toThrow('User not found');
        });
    });

    it('returns 401 for invalid token', async () => {
      await provider
        .uponReceiving('a request with invalid token')
        .withRequest({
          method: 'GET',
          path: '/api/users/123',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        })
        .willRespondWith({
          status: 401,
          body: like({
            error: string('Unauthorized'),
            code: string('INVALID_TOKEN'),
          }),
        })
        .executeTest(async (mockServer) => {
          const client = new UserClient(mockServer.url);
          client.setToken('invalid-token');

          await expect(client.getUser('123')).rejects.toThrow('Unauthorized');
        });
    });
  });

  describe('GET /api/users', () => {
    it('returns paginated list of users', async () => {
      await provider
        .given('users exist in the system')
        .uponReceiving('a request for user list')
        .withRequest({
          method: 'GET',
          path: '/api/users',
          query: {
            page: '1',
            limit: '10',
          },
          headers: {
            Authorization: regex(/Bearer .+/, 'Bearer valid-token'),
          },
        })
        .willRespondWith({
          status: 200,
          body: like({
            data: eachLike({
              id: string('1'),
              email: string('user@example.com'),
              name: string('User'),
            }),
            pagination: {
              page: integer(1),
              limit: integer(10),
              total: integer(50),
              totalPages: integer(5),
            },
          }),
        })
        .executeTest(async (mockServer) => {
          const client = new UserClient(mockServer.url);
          const result = await client.getUsers({ page: 1, limit: 10 });

          expect(result.data).toBeInstanceOf(Array);
          expect(result.pagination.page).toBe(1);
        });
    });
  });

  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      await provider
        .uponReceiving('a request to create a user')
        .withRequest({
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
            Authorization: regex(/Bearer .+/, 'Bearer valid-token'),
          },
          body: like({
            email: string('new@example.com'),
            name: string('New User'),
            password: string('securePassword123'),
          }),
        })
        .willRespondWith({
          status: 201,
          body: like({
            id: string('new-id'),
            email: string('new@example.com'),
            name: string('New User'),
          }),
        })
        .executeTest(async (mockServer) => {
          const client = new UserClient(mockServer.url);
          const user = await client.createUser({
            email: 'new@example.com',
            name: 'New User',
            password: 'securePassword123',
          });

          expect(user.id).toBeDefined();
          expect(user.email).toBe('new@example.com');
        });
    });
  });
});
```

### Python

```python
# tests/contracts/test_user_service_consumer.py
import pytest
from pact import Consumer, Provider, Like, EachLike, Term

from app.clients import UserClient


@pytest.fixture
def pact():
    """Create Pact consumer."""
    pact = Consumer("OrderService").has_pact_with(
        Provider("UserService"),
        pact_dir="./pacts",
    )
    pact.start_service()
    yield pact
    pact.stop_service()


class TestUserServiceContract:
    """Consumer contract tests for UserService."""

    def test_get_user_by_id(self, pact):
        """Should return user details for valid ID."""
        # Define expected interaction
        (
            pact
            .given("user with ID 123 exists")
            .upon_receiving("a request for user details")
            .with_request("GET", "/api/users/123")
            .will_respond_with(
                200,
                body=Like({
                    "id": "123",
                    "email": "user@example.com",
                    "name": "John Doe",
                    "role": "user",
                    "isActive": True,
                }),
            )
        )

        with pact:
            # Create client pointing to mock server
            client = UserClient(base_url=pact.uri)
            user = client.get_user("123")

            assert user["id"] == "123"
            assert user["email"] == "user@example.com"

    def test_get_user_not_found(self, pact):
        """Should return 404 for non-existent user."""
        (
            pact
            .given("user with ID 999 does not exist")
            .upon_receiving("a request for non-existent user")
            .with_request("GET", "/api/users/999")
            .will_respond_with(
                404,
                body=Like({
                    "error": "User not found",
                    "code": "USER_NOT_FOUND",
                }),
            )
        )

        with pact:
            client = UserClient(base_url=pact.uri)

            with pytest.raises(UserNotFoundError):
                client.get_user("999")

    def test_get_users_list(self, pact):
        """Should return paginated user list."""
        (
            pact
            .given("users exist in the system")
            .upon_receiving("a request for user list")
            .with_request(
                "GET",
                "/api/users",
                query={"page": "1", "limit": "10"},
            )
            .will_respond_with(
                200,
                body={
                    "data": EachLike({
                        "id": Like("1"),
                        "email": Like("user@example.com"),
                        "name": Like("User"),
                    }),
                    "pagination": Like({
                        "page": 1,
                        "limit": 10,
                        "total": 50,
                    }),
                },
            )
        )

        with pact:
            client = UserClient(base_url=pact.uri)
            result = client.get_users(page=1, limit=10)

            assert isinstance(result["data"], list)
            assert result["pagination"]["page"] == 1
```

### Go

```go
// tests/contracts/user_service_consumer_test.go
package contracts

import (
    "fmt"
    "testing"

    "github.com/pact-foundation/pact-go/v2/consumer"
    "github.com/pact-foundation/pact-go/v2/matchers"
    "github.com/stretchr/testify/assert"

    "myapp/internal/clients"
)

func TestUserServiceConsumer(t *testing.T) {
    mockProvider, err := consumer.NewV3Pact(consumer.MockHTTPProviderConfig{
        Consumer: "OrderService",
        Provider: "UserService",
        PactDir:  "./pacts",
    })
    assert.NoError(t, err)

    t.Run("get user by ID", func(t *testing.T) {
        err := mockProvider.
            AddInteraction().
            Given("user with ID 123 exists").
            UponReceiving("a request for user details").
            WithRequest("GET", "/api/users/123").
            WithHeaders(map[string]string{
                "Authorization": "Bearer valid-token",
            }).
            WillRespondWith(200).
            WithBody(matchers.MapMatcher{
                "id":       matchers.Like("123"),
                "email":    matchers.Like("user@example.com"),
                "name":     matchers.Like("John Doe"),
                "role":     matchers.Like("user"),
                "isActive": matchers.Like(true),
            }).
            ExecuteTest(t, func(config consumer.MockServerConfig) error {
                client := clients.NewUserClient(fmt.Sprintf("http://%s:%d", config.Host, config.Port))

                user, err := client.GetUser("123")
                if err != nil {
                    return err
                }

                assert.Equal(t, "123", user.ID)
                assert.Equal(t, "user@example.com", user.Email)
                return nil
            })

        assert.NoError(t, err)
    })

    t.Run("get user not found", func(t *testing.T) {
        err := mockProvider.
            AddInteraction().
            Given("user with ID 999 does not exist").
            UponReceiving("a request for non-existent user").
            WithRequest("GET", "/api/users/999").
            WillRespondWith(404).
            WithBody(matchers.MapMatcher{
                "error": matchers.Like("User not found"),
                "code":  matchers.Like("USER_NOT_FOUND"),
            }).
            ExecuteTest(t, func(config consumer.MockServerConfig) error {
                client := clients.NewUserClient(fmt.Sprintf("http://%s:%d", config.Host, config.Port))

                _, err := client.GetUser("999")
                assert.Error(t, err)
                assert.Contains(t, err.Error(), "User not found")
                return nil
            })

        assert.NoError(t, err)
    })
}
```

---

## Provider Verification

### TypeScript

```typescript
// tests/contracts/user-service.provider.pact.ts
import { Verifier } from '@pact-foundation/pact';
import { app } from '@/app';
import { seedDatabase, clearDatabase } from '@/tests/helpers';

describe('UserService Provider Verification', () => {
  let server: any;

  beforeAll(async () => {
    server = app.listen(3001);
  });

  afterAll(async () => {
    server.close();
  });

  it('validates contracts with all consumers', async () => {
    const verifier = new Verifier({
      providerBaseUrl: 'http://localhost:3001',
      provider: 'UserService',
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT || '1.0.0',
      providerVersionBranch: process.env.GIT_BRANCH || 'main',
      stateHandlers: {
        'user with ID 123 exists': async () => {
          await clearDatabase();
          await seedDatabase({
            users: [
              {
                id: '123',
                email: 'user@example.com',
                name: 'John Doe',
                role: 'user',
                isActive: true,
              },
            ],
          });
        },
        'user with ID 999 does not exist': async () => {
          await clearDatabase();
        },
        'users exist in the system': async () => {
          await clearDatabase();
          await seedDatabase({
            users: Array.from({ length: 50 }, (_, i) => ({
              id: String(i + 1),
              email: `user${i + 1}@example.com`,
              name: `User ${i + 1}`,
            })),
          });
        },
      },
    });

    await verifier.verifyProvider();
  });
});
```

### Python

```python
# tests/contracts/test_user_service_provider.py
import pytest
from pact import Verifier

from app.main import create_app
from tests.helpers import seed_database, clear_database


@pytest.fixture
def app():
    """Create test app."""
    return create_app(testing=True)


def test_provider_verification(app):
    """Verify contracts with all consumers."""
    verifier = Verifier(
        provider="UserService",
        provider_base_url="http://localhost:3001",
    )

    # Set up state handlers
    def setup_state(state_name):
        if state_name == "user with ID 123 exists":
            clear_database()
            seed_database({
                "users": [{
                    "id": "123",
                    "email": "user@example.com",
                    "name": "John Doe",
                }]
            })
        elif state_name == "user with ID 999 does not exist":
            clear_database()
        elif state_name == "users exist in the system":
            clear_database()
            seed_database({
                "users": [
                    {"id": str(i), "email": f"user{i}@example.com"}
                    for i in range(1, 51)
                ]
            })

    success, logs = verifier.verify_pacts(
        pact_dir="./pacts",
        state_handler=setup_state,
    )

    assert success, f"Provider verification failed: {logs}"
```

---

## Event-Driven Contract Testing

### Message Producer (TypeScript)

```typescript
// tests/contracts/order-events.producer.pact.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { OrderEventPublisher } from '@/events/order-event.publisher';

const { like, string, integer, regex } = MatchersV3;

describe('Order Events Producer', () => {
  const provider = new PactV3({
    consumer: 'InventoryService',
    provider: 'OrderService',
    dir: './pacts',
  });

  describe('OrderCreated event', () => {
    it('publishes valid OrderCreated event', async () => {
      await provider
        .addInteraction()
        .given('order is created')
        .uponReceiving('an OrderCreated event')
        .withContent({
          eventType: string('OrderCreated'),
          timestamp: regex(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/,
            '2024-01-15T10:30:00.000Z'
          ),
          payload: like({
            orderId: string('order-123'),
            userId: string('user-456'),
            items: [
              {
                productId: string('prod-789'),
                quantity: integer(2),
                price: integer(9999),
              },
            ],
            totalAmount: integer(19998),
          }),
        })
        .executeTest(async (mockServer) => {
          const publisher = new OrderEventPublisher();
          const event = publisher.createOrderCreatedEvent({
            orderId: 'order-123',
            userId: 'user-456',
            items: [{ productId: 'prod-789', quantity: 2, price: 9999 }],
          });

          // Verify the event matches the contract
          expect(event.eventType).toBe('OrderCreated');
          expect(event.payload.orderId).toBe('order-123');
        });
    });
  });
});
```

### Message Consumer (TypeScript)

```typescript
// tests/contracts/order-events.consumer.pact.ts
import { MessageConsumerPact, MatchersV3 } from '@pact-foundation/pact';
import { OrderEventHandler } from '@/handlers/order-event.handler';

describe('Order Events Consumer', () => {
  const messagePact = new MessageConsumerPact({
    consumer: 'InventoryService',
    provider: 'OrderService',
    dir: './pacts',
  });

  describe('OrderCreated event', () => {
    it('handles OrderCreated event', async () => {
      await messagePact
        .given('order is created')
        .expectsToReceive('an OrderCreated event')
        .withContent({
          eventType: 'OrderCreated',
          timestamp: '2024-01-15T10:30:00.000Z',
          payload: {
            orderId: 'order-123',
            userId: 'user-456',
            items: [{ productId: 'prod-789', quantity: 2, price: 9999 }],
            totalAmount: 19998,
          },
        })
        .verify(async (message) => {
          // Test that our handler can process this message
          const handler = new OrderEventHandler();
          await handler.handle(message);

          // Verify side effects
          expect(handler.processedOrders).toContain('order-123');
        });
    });
  });
});
```

---

## Pact Broker Integration

### Publishing Contracts

```bash
# Publish pacts to broker
pact-broker publish ./pacts \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN \
  --consumer-app-version=$GIT_COMMIT \
  --branch=$GIT_BRANCH
```

### CI/CD Workflow

```yaml
# .github/workflows/contract-tests.yml
name: Contract Tests

on: [push, pull_request]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run consumer contract tests
        run: npm run test:contracts:consumer

      - name: Publish pacts
        if: github.ref == 'refs/heads/main'
        run: |
          npm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.ref_name }}

  provider-verification:
    runs-on: ubuntu-latest
    needs: consumer-tests
    steps:
      - uses: actions/checkout@v4

      - name: Verify provider contracts
        run: npm run test:contracts:provider
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
```

### Can I Deploy?

```bash
# Check if it's safe to deploy
pact-broker can-i-deploy \
  --pacticipant=OrderService \
  --version=$GIT_COMMIT \
  --to-environment=production \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

---

## Best Practices

### 1. Test Consumer Needs, Not Provider Implementation

```typescript
// GOOD - Consumer defines what it needs
.willRespondWith({
  body: like({
    id: string(),
    name: string(),  // Consumer only needs id and name
  }),
})

// BAD - Testing full provider response
.willRespondWith({
  body: like({
    id: string(),
    name: string(),
    email: string(),      // Consumer doesn't use this
    createdAt: string(),  // Consumer doesn't use this
    // ... 20 more fields
  }),
})
```

### 2. Use Matchers Appropriately

```typescript
// Exact match - only when specific value matters
{ status: 'active' }

// Type match - for dynamic values
{ id: like('123') }

// Regex match - for specific formats
{ email: regex(/^.+@.+\..+$/, 'user@example.com') }

// Each like - for arrays
{ items: eachLike({ id: like('1') }) }
```

### 3. Meaningful Provider States

```typescript
// GOOD - Descriptive state
.given('user with ID 123 exists')
.given('user has admin role')
.given('order has 3 items')

// BAD - Vague state
.given('data exists')
.given('setup complete')
```

### 4. Version Contracts Properly

```bash
# Use git commit as version
--consumer-app-version=$GIT_COMMIT

# Tag branches
--branch=$GIT_BRANCH
```
