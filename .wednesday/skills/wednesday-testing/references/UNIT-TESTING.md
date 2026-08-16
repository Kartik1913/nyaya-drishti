# Unit Testing Patterns

This document provides comprehensive unit testing patterns for all supported languages and frameworks.

---

## Test File Naming Conventions

| Language    | Pattern                          | Location                    | Example                      |
|-------------|----------------------------------|-----------------------------|-----------------------------|
| TypeScript  | `*.test.ts`, `*.spec.ts`        | Adjacent to source file     | `UserService.test.ts`       |
| React/TSX   | `*.test.tsx`, `*.spec.tsx`      | Adjacent or `__tests__/`    | `Button.test.tsx`           |
| Python      | `test_*.py` or `*_test.py`      | `tests/` directory          | `test_user_service.py`      |
| Go          | `*_test.go`                     | Same package as source      | `user_service_test.go`      |
| Java        | `*Test.java`                    | `src/test/java/...`         | `UserServiceTest.java`      |
| Kotlin      | `*Test.kt`                      | `src/test/kotlin/...`       | `UserServiceTest.kt`        |

---

## The AAA Pattern (Arrange, Act, Assert)

Every unit test MUST follow the AAA pattern for clarity and consistency.

### Structure

```
Arrange: Set up test data, mocks, and preconditions
Act:     Execute the code under test (single action)
Assert:  Verify the expected outcome
```

### Why AAA?

1. **Clarity** - Each section has a distinct purpose
2. **Debugging** - Easy to identify which phase failed
3. **Maintenance** - Clear structure for modifications
4. **Review** - Consistent pattern speeds up code review

---

## TypeScript/JavaScript (Jest/Vitest)

### Basic Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
// or
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: MockUserRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    userService = new UserService(mockUserRepository);
  });

  afterEach(() => {
    vi.clearAllMocks(); // or jest.clearAllMocks()
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const userData = UserFactory.build({
        email: 'test@example.com',
        password: 'plainPassword123',
      });

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.email).toBe('test@example.com');
      expect(result.passwordHash).not.toBe('plainPassword123');
      expect(result.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt pattern
    });

    it('should throw ValidationError when email is invalid', async () => {
      // Arrange
      const invalidData = UserFactory.build({ email: 'not-an-email' });

      // Act & Assert
      await expect(userService.createUser(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });

  describe('findById', () => {
    it('should return user when exists', async () => {
      // Arrange
      const existingUser = UserFactory.build();
      mockUserRepository.findById.mockResolvedValue(existingUser);

      // Act
      const result = await userService.findById(existingUser.id);

      // Assert
      expect(result).toEqual(existingUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(existingUser.id);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await userService.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### React Component Testing (React Testing Library)

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('should display user name and email', () => {
    // Arrange
    const user = UserFactory.build({ name: 'John Doe', email: 'john@example.com' });

    // Act
    render(<UserProfile user={user} />);

    // Assert
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    // Arrange
    const user = UserFactory.build();
    const onEdit = vi.fn();
    const userEventInstance = userEvent.setup();

    render(<UserProfile user={user} onEdit={onEdit} />);

    // Act
    await userEventInstance.click(screen.getByRole('button', { name: /edit/i }));

    // Assert
    expect(onEdit).toHaveBeenCalledWith(user.id);
  });

  it('should show loading state while fetching', () => {
    // Arrange & Act
    render(<UserProfile userId="123" />);

    // Assert
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show error message when fetch fails', async () => {
    // Arrange
    server.use(
      http.get('/api/users/:id', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    // Act
    render(<UserProfile userId="123" />);

    // Assert
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('User not found');
    });
  });
});
```

### Hook Testing

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUsers', () => {
  it('should fetch and return users', async () => {
    // Arrange
    const mockUsers = UserFactory.buildList(3);
    server.use(
      http.get('/api/users', () => HttpResponse.json(mockUsers))
    );

    // Act
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUsers);
  });

  it('should handle pagination', async () => {
    // Arrange
    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Act
    act(() => {
      result.current.nextPage();
    });

    // Assert
    await waitFor(() => {
      expect(result.current.page).toBe(2);
    });
  });
});
```

---

## Python (pytest)

### Basic Structure

```python
import pytest
from unittest.mock import Mock, patch, AsyncMock
from services.user_service import UserService
from tests.factories import UserFactory


class TestUserService:
    """Tests for UserService."""

    @pytest.fixture
    def mock_repository(self):
        """Create a mock user repository."""
        return Mock()

    @pytest.fixture
    def user_service(self, mock_repository):
        """Create a UserService with mocked dependencies."""
        return UserService(repository=mock_repository)

    def test_create_user_hashes_password(self, user_service, mock_repository):
        """Should create user with hashed password."""
        # Arrange
        user_data = UserFactory.build(password="plainPassword123")
        mock_repository.save.return_value = user_data

        # Act
        result = user_service.create_user(user_data)

        # Assert
        assert result.password_hash != "plainPassword123"
        assert result.password_hash.startswith("$2b$")
        mock_repository.save.assert_called_once()

    def test_create_user_raises_validation_error_for_invalid_email(self, user_service):
        """Should raise ValidationError when email is invalid."""
        # Arrange
        invalid_data = UserFactory.build(email="not-an-email")

        # Act & Assert
        with pytest.raises(ValidationError, match="Invalid email"):
            user_service.create_user(invalid_data)

    def test_find_by_id_returns_user_when_exists(self, user_service, mock_repository):
        """Should return user when exists."""
        # Arrange
        existing_user = UserFactory.build()
        mock_repository.find_by_id.return_value = existing_user

        # Act
        result = user_service.find_by_id(existing_user.id)

        # Assert
        assert result == existing_user
        mock_repository.find_by_id.assert_called_once_with(existing_user.id)

    def test_find_by_id_returns_none_when_not_exists(self, user_service, mock_repository):
        """Should return None when user does not exist."""
        # Arrange
        mock_repository.find_by_id.return_value = None

        # Act
        result = user_service.find_by_id("non-existent-id")

        # Assert
        assert result is None


class TestUserServiceAsync:
    """Async tests for UserService."""

    @pytest.fixture
    def mock_async_repository(self):
        """Create an async mock repository."""
        mock = AsyncMock()
        return mock

    @pytest.fixture
    def async_user_service(self, mock_async_repository):
        """Create an async UserService."""
        return AsyncUserService(repository=mock_async_repository)

    @pytest.mark.asyncio
    async def test_create_user_async(self, async_user_service, mock_async_repository):
        """Should create user asynchronously."""
        # Arrange
        user_data = UserFactory.build()
        mock_async_repository.save.return_value = user_data

        # Act
        result = await async_user_service.create_user(user_data)

        # Assert
        assert result.id == user_data.id
        mock_async_repository.save.assert_awaited_once()
```

### Parametrized Tests

```python
import pytest

class TestEmailValidator:
    """Tests for email validation."""

    @pytest.mark.parametrize("email,is_valid", [
        ("user@example.com", True),
        ("user.name@example.co.uk", True),
        ("user+tag@example.com", True),
        ("not-an-email", False),
        ("@missing-local.com", False),
        ("missing-domain@", False),
        ("", False),
        (None, False),
    ])
    def test_validate_email(self, email, is_valid):
        """Should correctly validate various email formats."""
        # Act
        result = validate_email(email)

        # Assert
        assert result == is_valid

    @pytest.mark.parametrize("password,expected_error", [
        ("short", "Password must be at least 8 characters"),
        ("no-uppercase-123", "Password must contain uppercase letter"),
        ("NO-LOWERCASE-123", "Password must contain lowercase letter"),
        ("NoNumbers!", "Password must contain a number"),
    ])
    def test_validate_password_errors(self, password, expected_error):
        """Should return appropriate error for invalid passwords."""
        # Act
        errors = validate_password(password)

        # Assert
        assert expected_error in errors
```

---

## Go (testing + testify)

### Basic Structure

```go
package user_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/stretchr/testify/require"
    "github.com/stretchr/testify/suite"

    "myapp/internal/user"
    "myapp/internal/user/mocks"
    "myapp/tests/factories"
)

type UserServiceTestSuite struct {
    suite.Suite
    mockRepo    *mocks.UserRepository
    userService *user.Service
}

func (s *UserServiceTestSuite) SetupTest() {
    s.mockRepo = mocks.NewUserRepository(s.T())
    s.userService = user.NewService(s.mockRepo)
}

func (s *UserServiceTestSuite) TestCreateUser_HashesPassword() {
    // Arrange
    userData := factories.NewUserFactory().Build()
    s.mockRepo.On("Save", mock.AnythingOfType("*user.User")).Return(nil)

    // Act
    result, err := s.userService.CreateUser(context.Background(), userData)

    // Assert
    require.NoError(s.T(), err)
    assert.NotEqual(s.T(), "plainPassword", result.PasswordHash)
    assert.True(s.T(), strings.HasPrefix(result.PasswordHash, "$2a$"))
    s.mockRepo.AssertExpectations(s.T())
}

func (s *UserServiceTestSuite) TestCreateUser_ReturnsErrorForInvalidEmail() {
    // Arrange
    userData := factories.NewUserFactory().WithEmail("invalid-email").Build()

    // Act
    _, err := s.userService.CreateUser(context.Background(), userData)

    // Assert
    require.Error(s.T(), err)
    assert.ErrorIs(s.T(), err, user.ErrInvalidEmail)
}

func (s *UserServiceTestSuite) TestFindById_ReturnsUserWhenExists() {
    // Arrange
    existingUser := factories.NewUserFactory().Build()
    s.mockRepo.On("FindByID", existingUser.ID).Return(existingUser, nil)

    // Act
    result, err := s.userService.FindByID(context.Background(), existingUser.ID)

    // Assert
    require.NoError(s.T(), err)
    assert.Equal(s.T(), existingUser, result)
}

func (s *UserServiceTestSuite) TestFindById_ReturnsNilWhenNotExists() {
    // Arrange
    s.mockRepo.On("FindByID", "non-existent").Return(nil, nil)

    // Act
    result, err := s.userService.FindByID(context.Background(), "non-existent")

    // Assert
    require.NoError(s.T(), err)
    assert.Nil(s.T(), result)
}

func TestUserServiceTestSuite(t *testing.T) {
    suite.Run(t, new(UserServiceTestSuite))
}
```

### Table-Driven Tests

```go
func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name     string
        email    string
        expected bool
    }{
        {"valid email", "user@example.com", true},
        {"valid with subdomain", "user@mail.example.com", true},
        {"valid with plus", "user+tag@example.com", true},
        {"missing @", "userexample.com", false},
        {"missing domain", "user@", false},
        {"missing local", "@example.com", false},
        {"empty string", "", false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Act
            result := ValidateEmail(tt.email)

            // Assert
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

---

## Java/Kotlin (JUnit 5 + Mockito)

### Java Structure

```java
package com.example.user;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Nested
    @DisplayName("createUser")
    class CreateUser {

        @Test
        @DisplayName("should create user with hashed password")
        void shouldCreateUserWithHashedPassword() {
            // Arrange
            var userData = UserFactory.builder()
                .email("test@example.com")
                .password("plainPassword123")
                .build();
            when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

            // Act
            var result = userService.createUser(userData);

            // Assert
            assertThat(result.getEmail()).isEqualTo("test@example.com");
            assertThat(result.getPasswordHash()).isNotEqualTo("plainPassword123");
            assertThat(result.getPasswordHash()).startsWith("$2a$");
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("should throw ValidationException when email is invalid")
        void shouldThrowValidationExceptionForInvalidEmail() {
            // Arrange
            var invalidData = UserFactory.builder()
                .email("not-an-email")
                .build();

            // Act & Assert
            assertThatThrownBy(() -> userService.createUser(invalidData))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Invalid email");
        }
    }

    @Nested
    @DisplayName("findById")
    class FindById {

        @Test
        @DisplayName("should return user when exists")
        void shouldReturnUserWhenExists() {
            // Arrange
            var existingUser = UserFactory.create();
            when(userRepository.findById(existingUser.getId()))
                .thenReturn(Optional.of(existingUser));

            // Act
            var result = userService.findById(existingUser.getId());

            // Assert
            assertThat(result).isPresent().contains(existingUser);
        }

        @Test
        @DisplayName("should return empty when user does not exist")
        void shouldReturnEmptyWhenNotExists() {
            // Arrange
            when(userRepository.findById("non-existent")).thenReturn(Optional.empty());

            // Act
            var result = userService.findById("non-existent");

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @ParameterizedTest
    @CsvSource({
        "user@example.com, true",
        "user.name@example.co.uk, true",
        "not-an-email, false",
        "'', false"
    })
    @DisplayName("should validate email correctly")
    void shouldValidateEmailCorrectly(String email, boolean expected) {
        // Act
        var result = userService.isValidEmail(email);

        // Assert
        assertThat(result).isEqualTo(expected);
    }
}
```

### Kotlin Structure

```kotlin
package com.example.user

import io.mockk.*
import org.junit.jupiter.api.*
import org.assertj.core.api.Assertions.*

@DisplayName("UserService")
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

    @Nested
    @DisplayName("createUser")
    inner class CreateUser {

        @Test
        fun `should create user with hashed password`() {
            // Arrange
            val userData = UserFactory.build(
                email = "test@example.com",
                password = "plainPassword123"
            )
            every { userRepository.save(any()) } answers { firstArg() }

            // Act
            val result = userService.createUser(userData)

            // Assert
            assertThat(result.email).isEqualTo("test@example.com")
            assertThat(result.passwordHash).isNotEqualTo("plainPassword123")
            verify { userRepository.save(any()) }
        }

        @Test
        fun `should throw ValidationException when email is invalid`() {
            // Arrange
            val invalidData = UserFactory.build(email = "not-an-email")

            // Act & Assert
            assertThatThrownBy { userService.createUser(invalidData) }
                .isInstanceOf(ValidationException::class.java)
                .hasMessageContaining("Invalid email")
        }
    }
}
```

---

## Async Testing Patterns

### TypeScript Async

```typescript
// Promise rejection testing
it('should reject with NetworkError when API is unreachable', async () => {
  // Arrange
  server.use(
    http.get('/api/users', () => {
      return HttpResponse.error();
    })
  );

  // Act & Assert
  await expect(fetchUsers()).rejects.toThrow(NetworkError);
});

// Timeout testing
it('should timeout after 5 seconds', async () => {
  // Arrange
  vi.useFakeTimers();
  const promise = longRunningOperation();

  // Act
  vi.advanceTimersByTime(5000);

  // Assert
  await expect(promise).rejects.toThrow(TimeoutError);

  vi.useRealTimers();
});
```

### Python Async

```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_concurrent_user_creation():
    """Should handle concurrent user creation without conflicts."""
    # Arrange
    users_data = [UserFactory.build() for _ in range(10)]
    service = AsyncUserService()

    # Act
    results = await asyncio.gather(
        *[service.create_user(data) for data in users_data]
    )

    # Assert
    assert len(results) == 10
    ids = [r.id for r in results]
    assert len(set(ids)) == 10  # All unique IDs
```

### Go Async (Goroutines)

```go
func TestConcurrentUserCreation(t *testing.T) {
    // Arrange
    service := NewUserService()
    var wg sync.WaitGroup
    results := make(chan *User, 10)
    errors := make(chan error, 10)

    // Act
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            user := factories.NewUserFactory().Build()
            result, err := service.CreateUser(context.Background(), user)
            if err != nil {
                errors <- err
                return
            }
            results <- result
        }()
    }

    wg.Wait()
    close(results)
    close(errors)

    // Assert
    require.Empty(t, errors)
    ids := make(map[string]bool)
    for user := range results {
        ids[user.ID] = true
    }
    assert.Len(t, ids, 10) // All unique IDs
}
```

---

## Test Organization Best Practices

### Describe Block Hierarchy

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    describe('when email is valid', () => {
      it('should create user successfully', () => {});
      it('should hash password', () => {});
      it('should generate unique ID', () => {});
    });

    describe('when email is invalid', () => {
      it('should throw ValidationError', () => {});
    });

    describe('when email already exists', () => {
      it('should throw ConflictError', () => {});
    });
  });

  describe('updateUser', () => {
    describe('when user exists', () => {
      it('should update and return user', () => {});
    });

    describe('when user does not exist', () => {
      it('should throw NotFoundError', () => {});
    });
  });
});
```

### One Assert Per Test (When Possible)

```typescript
// GOOD - Single responsibility per test
it('should set user email', () => {
  const result = createUser({ email: 'test@example.com' });
  expect(result.email).toBe('test@example.com');
});

it('should hash user password', () => {
  const result = createUser({ password: 'plain' });
  expect(result.passwordHash).not.toBe('plain');
});

it('should generate unique ID', () => {
  const result = createUser({});
  expect(result.id).toMatch(/^usr_[a-z0-9]+$/);
});

// ACCEPTABLE - Multiple related assertions
it('should create user with all required fields', () => {
  const result = createUser({ email: 'test@example.com', name: 'John' });

  expect(result).toMatchObject({
    email: 'test@example.com',
    name: 'John',
  });
  expect(result.id).toBeDefined();
  expect(result.createdAt).toBeInstanceOf(Date);
});
```
