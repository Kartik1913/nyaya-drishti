# Mocking Strategies

This document provides comprehensive mocking patterns for all supported languages and frameworks.

---

## When to Mock vs Use Real Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RULE: Mock at boundaries, not implementation details.                 │
│                                                                         │
│  Mock external systems you don't control.                              │
│  Use real implementations for your own code.                           │
└─────────────────────────────────────────────────────────────────────────┘
```

| Dependency Type        | Unit Test | Integration Test |
|------------------------|:---------:|:----------------:|
| External HTTP APIs     | MOCK      | MOCK (MSW)       |
| Database               | MOCK      | REAL (container) |
| File system            | MOCK      | REAL (temp dir)  |
| Time/Date              | MOCK      | MOCK             |
| Random/UUID generation | MOCK      | MOCK             |
| Other microservices    | MOCK      | MOCK (contract)  |
| Message queues         | MOCK      | REAL (container) |
| Your own services      | REAL      | REAL             |
| Third-party SDKs       | MOCK      | MOCK             |

---

## TypeScript/JavaScript Mocking

### Jest Mocking

```typescript
// Manual mock
jest.mock('@/lib/api/client');
import { apiClient } from '@/lib/api/client';
const mockApiClient = jest.mocked(apiClient);

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch user from API', async () => {
    // Arrange
    const mockUser = UserFactory.build();
    mockApiClient.get.mockResolvedValue({ data: mockUser });

    // Act
    const result = await userService.getUser('123');

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/users/123');
    expect(result).toEqual(mockUser);
  });
});

// Spy on existing implementation
const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

afterEach(() => {
  consoleSpy.mockRestore();
});
```

### Vitest Mocking

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock module
vi.mock('@/lib/api/client');
import { apiClient } from '@/lib/api/client';
const mockApiClient = vi.mocked(apiClient);

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user from API', async () => {
    // Arrange
    const mockUser = UserFactory.build();
    mockApiClient.get.mockResolvedValue({ data: mockUser });

    // Act
    const result = await userService.getUser('123');

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/users/123');
    expect(result).toEqual(mockUser);
  });
});

// Spy
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
```

### MSW (Mock Service Worker)

MSW is the recommended approach for mocking HTTP APIs in frontend tests.

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { UserFactory, ProductFactory } from '@/tests/factories';

export const handlers = [
  // GET request
  http.get('/api/users/:id', ({ params }) => {
    const user = UserFactory.build({ id: params.id as string });
    return HttpResponse.json(user);
  }),

  // GET with query params
  http.get('/api/users', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const users = UserFactory.buildList(limit);
    return HttpResponse.json({
      data: users,
      pagination: { page, limit, total: 100 },
    });
  }),

  // POST request
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    const user = UserFactory.build(body);
    return HttpResponse.json(user, { status: 201 });
  }),

  // Error response
  http.get('/api/users/error', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  // Delay response
  http.get('/api/slow', async () => {
    await delay(2000);
    return HttpResponse.json({ data: 'slow response' });
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
// Override handler for specific test
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

it('should handle API error', async () => {
  // Override default handler
  server.use(
    http.get('/api/users/:id', () => {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    })
  );

  // Test error handling
  await expect(userService.getUser('123')).rejects.toThrow('User not found');
});
```

### Mocking Time

```typescript
describe('time-dependent tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate age correctly', () => {
    const user = UserFactory.build({
      birthDate: new Date('1990-01-15'),
    });

    expect(calculateAge(user.birthDate)).toBe(34);
  });

  it('should expire after timeout', async () => {
    const session = createSession();

    // Fast-forward time
    vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes

    expect(session.isExpired()).toBe(true);
  });
});
```

### Mocking Random/UUID

```typescript
// Mock UUID
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-123'),
}));

// Mock Math.random
const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

afterEach(() => {
  randomSpy.mockRestore();
});
```

---

## Python Mocking

### unittest.mock

```python
from unittest.mock import Mock, MagicMock, patch, AsyncMock
import pytest

from app.services import UserService
from tests.factories import UserFactory


class TestUserService:
    """Tests for UserService."""

    @patch("app.services.user_service.UserRepository")
    def test_get_user(self, mock_repo_class):
        """Should fetch user from repository."""
        # Arrange
        mock_repo = Mock()
        mock_repo_class.return_value = mock_repo
        mock_user = UserFactory.build()
        mock_repo.find_by_id.return_value = mock_user

        service = UserService()

        # Act
        result = service.get_user("123")

        # Assert
        mock_repo.find_by_id.assert_called_once_with("123")
        assert result == mock_user

    @patch("app.services.user_service.external_api")
    def test_fetch_external_data(self, mock_api):
        """Should fetch data from external API."""
        # Arrange
        mock_api.get.return_value = {"data": "value"}
        service = UserService()

        # Act
        result = service.fetch_external_data()

        # Assert
        mock_api.get.assert_called_once()
        assert result == {"data": "value"}

    def test_with_context_manager(self):
        """Should mock within context."""
        with patch("app.services.user_service.UserRepository") as mock_repo:
            mock_repo.return_value.find_by_id.return_value = UserFactory.build()

            service = UserService()
            result = service.get_user("123")

            assert result is not None


class TestAsyncUserService:
    """Async tests with mocking."""

    @pytest.mark.asyncio
    async def test_async_get_user(self):
        """Should fetch user asynchronously."""
        with patch("app.services.async_user_service.AsyncUserRepository") as mock_repo:
            # Use AsyncMock for async methods
            mock_instance = AsyncMock()
            mock_repo.return_value = mock_instance
            mock_instance.find_by_id.return_value = UserFactory.build()

            service = AsyncUserService()
            result = await service.get_user("123")

            mock_instance.find_by_id.assert_awaited_once_with("123")
            assert result is not None
```

### pytest-mock

```python
import pytest
from tests.factories import UserFactory


def test_with_mocker(mocker):
    """Using pytest-mock fixture."""
    # Mock class
    mock_repo = mocker.patch("app.services.user_service.UserRepository")
    mock_repo.return_value.find_by_id.return_value = UserFactory.build()

    service = UserService()
    result = service.get_user("123")

    assert result is not None


def test_spy(mocker):
    """Spy on real implementation."""
    spy = mocker.spy(user_service, "validate_email")

    user_service.create_user(email="test@example.com")

    spy.assert_called_once_with("test@example.com")
```

### responses (HTTP mocking)

```python
import responses
import requests


@responses.activate
def test_external_api_call():
    """Mock HTTP requests."""
    responses.add(
        responses.GET,
        "https://api.example.com/users/123",
        json={"id": "123", "name": "John"},
        status=200,
    )

    response = requests.get("https://api.example.com/users/123")

    assert response.json()["name"] == "John"


@responses.activate
def test_api_error():
    """Mock API error."""
    responses.add(
        responses.GET,
        "https://api.example.com/users/999",
        json={"error": "Not found"},
        status=404,
    )

    with pytest.raises(UserNotFoundError):
        client.get_user("999")
```

### freezegun (Time mocking)

```python
from freezegun import freeze_time
from datetime import datetime


@freeze_time("2024-01-15 10:00:00")
def test_time_dependent():
    """Test with frozen time."""
    now = datetime.now()
    assert now.year == 2024
    assert now.month == 1
    assert now.day == 15


@freeze_time("2024-01-15")
def test_age_calculation():
    """Test age calculation."""
    user = UserFactory.build(birth_date=datetime(1990, 1, 15))
    assert calculate_age(user.birth_date) == 34


class TestSessionExpiry:
    """Test session expiry with time control."""

    @freeze_time("2024-01-15 10:00:00")
    def test_session_not_expired(self):
        """Session should not be expired immediately."""
        session = create_session()
        assert not session.is_expired()

    @freeze_time("2024-01-15 10:30:00")
    def test_session_expired_after_30_minutes(self):
        """Session should expire after 30 minutes."""
        with freeze_time("2024-01-15 10:00:00"):
            session = create_session()

        # Time is now 10:30
        assert session.is_expired()
```

---

## Go Mocking

### Interface-Based Mocking

```go
// Define interface for dependency
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    Save(ctx context.Context, user *User) error
}

// Service uses interface
type UserService struct {
    repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}
```

### testify/mock

```go
package mocks

import (
    "context"

    "github.com/stretchr/testify/mock"
    "myapp/internal/user"
)

type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) FindByID(ctx context.Context, id string) (*user.User, error) {
    args := m.Called(ctx, id)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*user.User), args.Error(1)
}

func (m *MockUserRepository) Save(ctx context.Context, u *user.User) error {
    args := m.Called(ctx, u)
    return args.Error(0)
}
```

```go
// tests/user_service_test.go
package user_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"

    "myapp/internal/user"
    "myapp/tests/factories"
    "myapp/tests/mocks"
)

func TestUserService_GetUser(t *testing.T) {
    ctx := context.Background()

    t.Run("returns user when exists", func(t *testing.T) {
        // Arrange
        mockRepo := new(mocks.MockUserRepository)
        service := user.NewUserService(mockRepo)
        expectedUser := factories.NewUserFactory().Build()

        mockRepo.On("FindByID", ctx, "123").Return(expectedUser, nil)

        // Act
        result, err := service.GetUser(ctx, "123")

        // Assert
        assert.NoError(t, err)
        assert.Equal(t, expectedUser, result)
        mockRepo.AssertExpectations(t)
    })

    t.Run("returns error when not found", func(t *testing.T) {
        // Arrange
        mockRepo := new(mocks.MockUserRepository)
        service := user.NewUserService(mockRepo)

        mockRepo.On("FindByID", ctx, "999").Return(nil, user.ErrNotFound)

        // Act
        result, err := service.GetUser(ctx, "999")

        // Assert
        assert.ErrorIs(t, err, user.ErrNotFound)
        assert.Nil(t, result)
    })
}

func TestUserService_CreateUser(t *testing.T) {
    ctx := context.Background()

    t.Run("saves user to repository", func(t *testing.T) {
        // Arrange
        mockRepo := new(mocks.MockUserRepository)
        service := user.NewUserService(mockRepo)
        newUser := factories.NewUserFactory().Build()

        mockRepo.On("Save", ctx, mock.AnythingOfType("*user.User")).Return(nil)

        // Act
        err := service.CreateUser(ctx, newUser)

        // Assert
        assert.NoError(t, err)
        mockRepo.AssertCalled(t, "Save", ctx, mock.AnythingOfType("*user.User"))
    })
}
```

### gomock

```go
//go:generate mockgen -source=repository.go -destination=mocks/mock_repository.go -package=mocks

package user_test

import (
    "context"
    "testing"

    "github.com/golang/mock/gomock"
    "github.com/stretchr/testify/assert"

    "myapp/internal/user"
    "myapp/tests/factories"
    "myapp/tests/mocks"
)

func TestUserService_GetUser_GoMock(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockRepo := mocks.NewMockUserRepository(ctrl)
    service := user.NewUserService(mockRepo)
    ctx := context.Background()

    t.Run("returns user when exists", func(t *testing.T) {
        expectedUser := factories.NewUserFactory().Build()

        mockRepo.EXPECT().
            FindByID(ctx, "123").
            Return(expectedUser, nil)

        result, err := service.GetUser(ctx, "123")

        assert.NoError(t, err)
        assert.Equal(t, expectedUser, result)
    })
}
```

### HTTP Testing

```go
package handlers_test

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/stretchr/testify/assert"

    "myapp/internal/handlers"
    "myapp/tests/factories"
)

func TestGetUserHandler(t *testing.T) {
    t.Run("returns user JSON", func(t *testing.T) {
        // Arrange
        user := factories.NewUserFactory().Build()
        mockService := &mocks.MockUserService{}
        mockService.On("GetUser", mock.Anything, "123").Return(user, nil)

        handler := handlers.NewUserHandler(mockService)

        req := httptest.NewRequest(http.MethodGet, "/users/123", nil)
        rec := httptest.NewRecorder()

        // Act
        handler.ServeHTTP(rec, req)

        // Assert
        assert.Equal(t, http.StatusOK, rec.Code)

        var response map[string]interface{}
        json.Unmarshal(rec.Body.Bytes(), &response)
        assert.Equal(t, user.ID, response["id"])
    })
}
```

---

## Java/Kotlin Mocking

### Mockito (Java)

```java
package com.example.services;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    @Test
    void shouldReturnUserWhenExists() {
        // Arrange
        var user = UserFactory.build();
        when(userRepository.findById("123")).thenReturn(Optional.of(user));

        // Act
        var result = userService.getUser("123");

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo(user);
        verify(userRepository).findById("123");
    }

    @Test
    void shouldThrowWhenUserNotFound() {
        // Arrange
        when(userRepository.findById("999")).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userService.getUser("999"))
            .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    void shouldSaveUserWithHashedPassword() {
        // Arrange
        var userData = UserFactory.buildInput();

        // Act
        userService.createUser(userData);

        // Assert
        verify(userRepository).save(userCaptor.capture());
        var savedUser = userCaptor.getValue();
        assertThat(savedUser.getPasswordHash()).isNotEqualTo(userData.getPassword());
    }

    @Test
    void shouldCallExternalApiOnce() {
        // Arrange
        when(externalApi.fetchData()).thenReturn("data");

        // Act
        userService.processWithExternalData();

        // Assert
        verify(externalApi, times(1)).fetchData();
        verifyNoMoreInteractions(externalApi);
    }
}
```

### MockK (Kotlin)

```kotlin
package com.example.services

import io.mockk.*
import org.junit.jupiter.api.*
import org.assertj.core.api.Assertions.*

class UserServiceTest {

    private lateinit var userRepository: UserRepository
    private lateinit var userService: UserService

    @BeforeEach
    fun setUp() {
        userRepository = mockk()
        userService = UserService(userRepository)
    }

    @AfterEach
    fun tearDown() {
        clearAllMocks()
    }

    @Test
    fun `should return user when exists`() {
        // Arrange
        val user = UserFactory.build()
        every { userRepository.findById("123") } returns user

        // Act
        val result = userService.getUser("123")

        // Assert
        assertThat(result).isEqualTo(user)
        verify { userRepository.findById("123") }
    }

    @Test
    fun `should throw when user not found`() {
        // Arrange
        every { userRepository.findById("999") } returns null

        // Act & Assert
        assertThatThrownBy { userService.getUser("999") }
            .isInstanceOf(UserNotFoundException::class.java)
    }

    @Test
    fun `should capture saved user`() {
        // Arrange
        val slot = slot<User>()
        every { userRepository.save(capture(slot)) } just runs

        // Act
        userService.createUser(UserFactory.buildInput())

        // Assert
        val savedUser = slot.captured
        assertThat(savedUser.passwordHash).isNotBlank()
    }

    @Test
    fun `should call external API with relaxed mock`() {
        // Arrange
        val externalApi = mockk<ExternalApi>(relaxed = true)
        val service = UserService(userRepository, externalApi)

        // Act
        service.processWithExternalData()

        // Assert
        verify { externalApi.fetchData() }
    }
}

// Coroutine mocking
class AsyncUserServiceTest {

    @Test
    fun `should fetch user asynchronously`() = runTest {
        // Arrange
        val asyncRepo = mockk<AsyncUserRepository>()
        val user = UserFactory.build()
        coEvery { asyncRepo.findById("123") } returns user

        val service = AsyncUserService(asyncRepo)

        // Act
        val result = service.getUser("123")

        // Assert
        assertThat(result).isEqualTo(user)
        coVerify { asyncRepo.findById("123") }
    }
}
```

---

## Anti-Patterns to Avoid

### DON'T: Mock What You Own

```typescript
// BAD - Mocking your own code
jest.mock('@/services/user.service');
const mockUserService = jest.mocked(userService);

it('should call userService', () => {
  mockUserService.getUser.mockResolvedValue(user);
  // This tests nothing useful!
});

// GOOD - Test with real implementation, mock external dependencies
it('should get user from database', async () => {
  // Use real UserService, mock only the database
  const result = await userService.getUser('123');
  expect(result).toEqual(expectedUser);
});
```

### DON'T: Mock Everything

```typescript
// BAD - Over-mocking
jest.mock('@/utils/validation');
jest.mock('@/utils/formatting');
jest.mock('@/utils/date');

// GOOD - Use real utilities
// Only mock external boundaries
```

### DON'T: Test Mock Interactions Only

```typescript
// BAD - Only testing that mock was called
it('should call repository', async () => {
  await userService.getUser('123');
  expect(mockRepo.findById).toHaveBeenCalledWith('123');
  // No assertion on actual behavior!
});

// GOOD - Test actual behavior
it('should return user with formatted name', async () => {
  mockRepo.findById.mockResolvedValue({ id: '123', name: 'john doe' });

  const result = await userService.getUser('123');

  expect(result.name).toBe('John Doe'); // Actual behavior tested
});
```

### DON'T: Leave Mocks Uncleared

```typescript
// BAD - Mocks leak between tests
it('test 1', () => {
  mockApi.get.mockResolvedValue({ data: 'test1' });
});

it('test 2', () => {
  // Still has mock from test 1!
});

// GOOD - Clear mocks
afterEach(() => {
  jest.clearAllMocks();
  // or
  vi.clearAllMocks();
});
```
