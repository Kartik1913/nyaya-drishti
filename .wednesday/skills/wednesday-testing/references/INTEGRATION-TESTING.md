# Integration Testing

This document provides comprehensive integration testing patterns for databases, APIs, and external services.

---

## When to Write Integration Tests

Integration tests verify that components work correctly together. Write integration tests when:

- Testing database operations (repositories, queries, transactions)
- Testing API endpoints end-to-end
- Testing message queue producers/consumers
- Testing file system operations
- Testing external service integrations

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Integration tests use REAL dependencies, not mocks.                   │
│                                                                         │
│  Database  → Real database in container (Testcontainers)               │
│  API       → Real HTTP calls (Supertest, httptest)                     │
│  Queues    → Real message broker in container                          │
│  Files     → Real file system (temp directories)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Testcontainers Setup

### TypeScript/Node.js

```bash
npm install --save-dev @testcontainers/postgresql @testcontainers/mongodb @testcontainers/redis
```

### Python

```bash
pip install testcontainers[postgres,mongodb,redis]
```

### Go

```bash
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
go get github.com/testcontainers/testcontainers-go/modules/mongodb
go get github.com/testcontainers/testcontainers-go/modules/redis
```

### Java/Kotlin

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.3</version>
    <scope>test</scope>
</dependency>
```

---

## PostgreSQL Testing

### TypeScript

```typescript
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import { UserRepository } from '@/repositories/user.repository';
import { UserFactory } from '@/tests/factories';

describe('UserRepository', () => {
  let container: StartedPostgreSqlContainer;
  let client: Client;
  let repository: UserRepository;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .start();

    // Connect to database
    client = new Client({
      connectionString: container.getConnectionUri(),
    });
    await client.connect();

    // Run migrations
    await runMigrations(client);

    // Create repository
    repository = new UserRepository(client);
  }, 60000); // 60s timeout for container startup

  afterAll(async () => {
    await client.end();
    await container.stop();
  });

  afterEach(async () => {
    // Clean up data between tests
    await client.query('TRUNCATE users CASCADE');
  });

  describe('save', () => {
    it('should persist user to database', async () => {
      // Arrange
      const user = UserFactory.build();

      // Act
      await repository.save(user);

      // Assert
      const result = await client.query('SELECT * FROM users WHERE id = $1', [user.id]);
      expect(result.rows[0]).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    });

    it('should throw on duplicate email', async () => {
      // Arrange
      const user1 = UserFactory.build({ email: 'duplicate@example.com' });
      const user2 = UserFactory.build({ email: 'duplicate@example.com' });
      await repository.save(user1);

      // Act & Assert
      await expect(repository.save(user2)).rejects.toThrow(/duplicate key/);
    });
  });

  describe('findById', () => {
    it('should return user when exists', async () => {
      // Arrange
      const user = UserFactory.build();
      await repository.save(user);

      // Act
      const result = await repository.findById(user.id);

      // Assert
      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });

    it('should return null when not exists', async () => {
      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('transactions', () => {
    it('should rollback on error', async () => {
      // Arrange
      const user = UserFactory.build();

      // Act
      try {
        await repository.withTransaction(async (tx) => {
          await tx.save(user);
          throw new Error('Simulated failure');
        });
      } catch (e) {
        // Expected
      }

      // Assert - user should not be saved
      const result = await repository.findById(user.id);
      expect(result).toBeNull();
    });
  });
});
```

### Python

```python
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.repositories import UserRepository
from app.models import Base
from tests.factories import UserFactory


@pytest.fixture(scope="module")
def postgres_container():
    """Start PostgreSQL container for the test module."""
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="module")
def engine(postgres_container):
    """Create SQLAlchemy engine."""
    engine = create_engine(postgres_container.get_connection_url())
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def db_session(engine):
    """Create a new session for each test."""
    Session = sessionmaker(bind=engine)
    session = Session()

    yield session

    session.rollback()
    session.close()


@pytest.fixture
def user_repository(db_session):
    """Create UserRepository with test session."""
    return UserRepository(db_session)


class TestUserRepository:
    """Integration tests for UserRepository."""

    def test_save_persists_user(self, user_repository, db_session):
        """Should persist user to database."""
        # Arrange
        user = UserFactory.build()

        # Act
        user_repository.save(user)
        db_session.commit()

        # Assert
        result = db_session.execute(
            text("SELECT * FROM users WHERE id = :id"),
            {"id": user.id}
        ).fetchone()

        assert result is not None
        assert result.email == user.email

    def test_save_raises_on_duplicate_email(self, user_repository, db_session):
        """Should raise on duplicate email."""
        # Arrange
        user1 = UserFactory.build(email="duplicate@example.com")
        user2 = UserFactory.build(email="duplicate@example.com")
        user_repository.save(user1)
        db_session.commit()

        # Act & Assert
        with pytest.raises(Exception, match="duplicate"):
            user_repository.save(user2)
            db_session.commit()

    def test_find_by_id_returns_user_when_exists(self, user_repository, db_session):
        """Should return user when exists."""
        # Arrange
        user = UserFactory.build()
        user_repository.save(user)
        db_session.commit()

        # Act
        result = user_repository.find_by_id(user.id)

        # Assert
        assert result is not None
        assert result.id == user.id

    def test_find_by_id_returns_none_when_not_exists(self, user_repository):
        """Should return None when user doesn't exist."""
        # Act
        result = user_repository.find_by_id("non-existent")

        # Assert
        assert result is None
```

### Go

```go
package repository_test

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    "github.com/stretchr/testify/suite"
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
    "github.com/jackc/pgx/v5/pgxpool"

    "myapp/internal/repository"
    "myapp/tests/factories"
)

type UserRepositoryTestSuite struct {
    suite.Suite
    container *postgres.PostgresContainer
    pool      *pgxpool.Pool
    repo      *repository.UserRepository
    ctx       context.Context
}

func (s *UserRepositoryTestSuite) SetupSuite() {
    s.ctx = context.Background()

    // Start PostgreSQL container
    container, err := postgres.Run(s.ctx,
        "postgres:15-alpine",
        postgres.WithDatabase("testdb"),
        postgres.WithUsername("testuser"),
        postgres.WithPassword("testpass"),
        testcontainers.WithWaitStrategy(
            wait.ForLog("database system is ready to accept connections").
                WithOccurrence(2).
                WithStartupTimeout(60*time.Second),
        ),
    )
    require.NoError(s.T(), err)
    s.container = container

    // Connect to database
    connStr, err := container.ConnectionString(s.ctx, "sslmode=disable")
    require.NoError(s.T(), err)

    pool, err := pgxpool.New(s.ctx, connStr)
    require.NoError(s.T(), err)
    s.pool = pool

    // Run migrations
    err = runMigrations(s.ctx, pool)
    require.NoError(s.T(), err)

    s.repo = repository.NewUserRepository(pool)
}

func (s *UserRepositoryTestSuite) TearDownSuite() {
    s.pool.Close()
    _ = s.container.Terminate(s.ctx)
}

func (s *UserRepositoryTestSuite) TearDownTest() {
    // Clean up data between tests
    _, _ = s.pool.Exec(s.ctx, "TRUNCATE users CASCADE")
}

func (s *UserRepositoryTestSuite) TestSave_PersistsUser() {
    // Arrange
    user := factories.NewUserFactory().Build()

    // Act
    err := s.repo.Save(s.ctx, user)

    // Assert
    require.NoError(s.T(), err)

    var count int
    err = s.pool.QueryRow(s.ctx, "SELECT COUNT(*) FROM users WHERE id = $1", user.ID).Scan(&count)
    require.NoError(s.T(), err)
    assert.Equal(s.T(), 1, count)
}

func (s *UserRepositoryTestSuite) TestSave_RaisesOnDuplicateEmail() {
    // Arrange
    user1 := factories.NewUserFactory().Build(factories.WithEmail("duplicate@example.com"))
    user2 := factories.NewUserFactory().Build(factories.WithEmail("duplicate@example.com"))

    err := s.repo.Save(s.ctx, user1)
    require.NoError(s.T(), err)

    // Act
    err = s.repo.Save(s.ctx, user2)

    // Assert
    assert.Error(s.T(), err)
    assert.Contains(s.T(), err.Error(), "duplicate")
}

func (s *UserRepositoryTestSuite) TestFindByID_ReturnsUserWhenExists() {
    // Arrange
    user := factories.NewUserFactory().Build()
    err := s.repo.Save(s.ctx, user)
    require.NoError(s.T(), err)

    // Act
    result, err := s.repo.FindByID(s.ctx, user.ID)

    // Assert
    require.NoError(s.T(), err)
    assert.Equal(s.T(), user.ID, result.ID)
    assert.Equal(s.T(), user.Email, result.Email)
}

func (s *UserRepositoryTestSuite) TestFindByID_ReturnsNilWhenNotExists() {
    // Act
    result, err := s.repo.FindByID(s.ctx, "non-existent")

    // Assert
    require.NoError(s.T(), err)
    assert.Nil(s.T(), result)
}

func TestUserRepositoryTestSuite(t *testing.T) {
    suite.Run(t, new(UserRepositoryTestSuite))
}
```

---

## MongoDB Testing

### TypeScript

```typescript
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { MongoClient, Db } from 'mongodb';
import { UserRepository } from '@/repositories/user.repository';
import { UserFactory } from '@/tests/factories';

describe('UserRepository (MongoDB)', () => {
  let container: StartedMongoDBContainer;
  let client: MongoClient;
  let db: Db;
  let repository: UserRepository;

  beforeAll(async () => {
    container = await new MongoDBContainer('mongo:7').start();
    client = new MongoClient(container.getConnectionString());
    await client.connect();
    db = client.db('testdb');
    repository = new UserRepository(db.collection('users'));
  }, 60000);

  afterAll(async () => {
    await client.close();
    await container.stop();
  });

  afterEach(async () => {
    await db.collection('users').deleteMany({});
  });

  it('should save and retrieve user', async () => {
    // Arrange
    const user = UserFactory.build();

    // Act
    await repository.save(user);
    const result = await repository.findById(user.id);

    // Assert
    expect(result).toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it('should support complex queries', async () => {
    // Arrange
    const users = [
      UserFactory.build({ role: 'admin', isActive: true }),
      UserFactory.build({ role: 'user', isActive: true }),
      UserFactory.build({ role: 'admin', isActive: false }),
    ];
    await Promise.all(users.map(u => repository.save(u)));

    // Act
    const activeAdmins = await repository.find({ role: 'admin', isActive: true });

    // Assert
    expect(activeAdmins).toHaveLength(1);
    expect(activeAdmins[0].role).toBe('admin');
  });
});
```

### Python

```python
import pytest
from testcontainers.mongodb import MongoDbContainer
from pymongo import MongoClient

from app.repositories import UserRepository
from tests.factories import UserFactory


@pytest.fixture(scope="module")
def mongo_container():
    """Start MongoDB container."""
    with MongoDbContainer("mongo:7") as mongo:
        yield mongo


@pytest.fixture
def mongo_db(mongo_container):
    """Get MongoDB database."""
    client = MongoClient(mongo_container.get_connection_url())
    db = client.testdb
    yield db
    client.close()


@pytest.fixture
def user_repository(mongo_db):
    """Create UserRepository with test database."""
    return UserRepository(mongo_db.users)


@pytest.fixture(autouse=True)
def cleanup(mongo_db):
    """Clean up collections after each test."""
    yield
    mongo_db.users.delete_many({})


class TestUserRepositoryMongo:
    """MongoDB integration tests."""

    def test_save_and_retrieve(self, user_repository):
        """Should save and retrieve user."""
        # Arrange
        user = UserFactory.build()

        # Act
        user_repository.save(user)
        result = user_repository.find_by_id(user.id)

        # Assert
        assert result is not None
        assert result["email"] == user.email

    def test_complex_queries(self, user_repository):
        """Should support complex queries."""
        # Arrange
        users = [
            UserFactory.build(role="admin", is_active=True),
            UserFactory.build(role="user", is_active=True),
            UserFactory.build(role="admin", is_active=False),
        ]
        for user in users:
            user_repository.save(user)

        # Act
        active_admins = user_repository.find({"role": "admin", "is_active": True})

        # Assert
        assert len(list(active_admins)) == 1
```

---

## Redis Testing

### TypeScript

```typescript
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { createClient, RedisClientType } from 'redis';
import { CacheService } from '@/services/cache.service';
import { UserFactory } from '@/tests/factories';

describe('CacheService', () => {
  let container: StartedRedisContainer;
  let client: RedisClientType;
  let cacheService: CacheService;

  beforeAll(async () => {
    container = await new RedisContainer('redis:7-alpine').start();
    client = createClient({ url: container.getConnectionUrl() });
    await client.connect();
    cacheService = new CacheService(client);
  }, 30000);

  afterAll(async () => {
    await client.quit();
    await container.stop();
  });

  afterEach(async () => {
    await client.flushAll();
  });

  it('should cache and retrieve user', async () => {
    // Arrange
    const user = UserFactory.build();

    // Act
    await cacheService.set(`user:${user.id}`, user, 3600);
    const cached = await cacheService.get(`user:${user.id}`);

    // Assert
    expect(cached).toEqual(user);
  });

  it('should return null for expired cache', async () => {
    // Arrange
    const user = UserFactory.build();
    await cacheService.set(`user:${user.id}`, user, 1); // 1 second TTL

    // Act
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for expiry
    const cached = await cacheService.get(`user:${user.id}`);

    // Assert
    expect(cached).toBeNull();
  });

  it('should handle cache invalidation', async () => {
    // Arrange
    const user = UserFactory.build();
    await cacheService.set(`user:${user.id}`, user, 3600);

    // Act
    await cacheService.delete(`user:${user.id}`);
    const cached = await cacheService.get(`user:${user.id}`);

    // Assert
    expect(cached).toBeNull();
  });
});
```

---

## API Integration Testing

### TypeScript (Supertest + Express)

```typescript
import request from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { createApp } from '@/app';
import { UserFactory } from '@/tests/factories';

describe('User API', () => {
  let container: StartedPostgreSqlContainer;
  let app: Express;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    app = await createApp({
      databaseUrl: container.getConnectionUri(),
    });
  }, 60000);

  afterAll(async () => {
    await container.stop();
  });

  describe('POST /api/users', () => {
    it('should create user and return 201', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securePassword123',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for invalid email', async () => {
      // Arrange
      const invalidData = {
        email: 'not-an-email',
        name: 'Test',
        password: 'password123',
      };

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ]),
      });
    });

    it('should return 409 for duplicate email', async () => {
      // Arrange
      const userData = UserFactory.build({ email: 'duplicate@example.com' });
      await request(app).post('/api/users').send(userData);

      // Act
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(409);

      // Assert
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user when exists', async () => {
      // Arrange
      const createResponse = await request(app)
        .post('/api/users')
        .send(UserFactory.build());
      const userId = createResponse.body.id;

      // Act
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      // Assert
      expect(response.body.id).toBe(userId);
    });

    it('should return 404 when not exists', async () => {
      // Act
      const response = await request(app)
        .get('/api/users/non-existent')
        .expect(404);

      // Assert
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('Authentication', () => {
    it('should return 401 for protected routes without token', async () => {
      // Act
      await request(app)
        .get('/api/users/me')
        .expect(401);
    });

    it('should return user data with valid token', async () => {
      // Arrange
      const user = UserFactory.build();
      await request(app).post('/api/users').send(user);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: user.password });

      const token = loginResponse.body.token;

      // Act
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Assert
      expect(response.body.email).toBe(user.email);
    });
  });
});
```

### Python (pytest + FastAPI)

```python
import pytest
from fastapi.testclient import TestClient
from testcontainers.postgres import PostgresContainer

from app.main import create_app
from tests.factories import UserFactory


@pytest.fixture(scope="module")
def postgres():
    """Start PostgreSQL container."""
    with PostgresContainer("postgres:15-alpine") as pg:
        yield pg


@pytest.fixture(scope="module")
def app(postgres):
    """Create FastAPI app with test database."""
    return create_app(database_url=postgres.get_connection_url())


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


class TestUserAPI:
    """Integration tests for User API."""

    def test_create_user_returns_201(self, client):
        """Should create user and return 201."""
        # Arrange
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "securePassword123",
        }

        # Act
        response = client.post("/api/users", json=user_data)

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "password" not in data
        assert "password_hash" not in data

    def test_create_user_returns_400_for_invalid_email(self, client):
        """Should return 400 for invalid email."""
        # Arrange
        invalid_data = {
            "email": "not-an-email",
            "name": "Test",
            "password": "password123",
        }

        # Act
        response = client.post("/api/users", json=invalid_data)

        # Assert
        assert response.status_code == 400
        assert "email" in response.json()["detail"][0]["loc"]

    def test_get_user_returns_404_when_not_exists(self, client):
        """Should return 404 when user doesn't exist."""
        # Act
        response = client.get("/api/users/non-existent")

        # Assert
        assert response.status_code == 404
```

---

## External Service Mocking with MSW

For integration tests that need to mock external HTTP services:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock external payment API
  http.post('https://api.stripe.com/v1/charges', async ({ request }) => {
    const body = await request.formData();
    const amount = body.get('amount');

    return HttpResponse.json({
      id: 'ch_test_123',
      amount: Number(amount),
      status: 'succeeded',
    });
  }),

  // Mock external email service
  http.post('https://api.sendgrid.com/v3/mail/send', () => {
    return HttpResponse.json({ message: 'Queued' }, { status: 202 });
  }),
];

// tests/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// tests/setup.ts
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// Usage in tests
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

describe('PaymentService', () => {
  it('should handle payment failure', async () => {
    // Override handler for this test
    server.use(
      http.post('https://api.stripe.com/v1/charges', () => {
        return HttpResponse.json(
          { error: { message: 'Card declined' } },
          { status: 402 }
        );
      })
    );

    // Act
    const result = await paymentService.charge(1000, 'tok_declined');

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Card declined');
  });
});
```

---

## Best Practices

### 1. Container Lifecycle

```typescript
// GOOD - Start container once for all tests in suite
beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
}, 60000);

afterAll(async () => {
  await container.stop();
});

// GOOD - Clean data between tests
afterEach(async () => {
  await db.query('TRUNCATE users, orders CASCADE');
});
```

### 2. Parallel Test Isolation

```typescript
// GOOD - Use unique identifiers per test
it('should find user by email', async () => {
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const user = UserFactory.build({ email: uniqueEmail });
  // ...
});
```

### 3. Timeout Configuration

```typescript
// GOOD - Appropriate timeouts for container operations
beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
}, 60000); // 60 second timeout

// Jest config
{
  "testTimeout": 30000 // 30 seconds for regular tests
}
```

### 4. Realistic Test Data

```typescript
// GOOD - Use factories for realistic data
const users = UserFactory.buildList(100);

// BAD - Hardcoded minimal data
const users = [{ id: '1' }, { id: '2' }];
```
