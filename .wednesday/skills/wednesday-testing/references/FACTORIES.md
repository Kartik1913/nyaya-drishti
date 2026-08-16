# Test Data Factories

This document defines the mandatory factory pattern for creating test data across all supported languages.

---

## Why Factories Are Mandatory

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TEST DATA MUST USE FACTORIES. NO INLINE OBJECT LITERALS.               │
│                                                                         │
│  ❌ WRONG - Inline object literals:                                     │
│  const user = {                                                         │
│    id: '1',                                                             │
│    name: 'John',                                                        │
│    email: 'john@test.com',                                              │
│    role: 'user',                                                        │
│    createdAt: new Date(),                                               │
│  };                                                                     │
│                                                                         │
│  ✓ CORRECT - Factory pattern:                                          │
│  const user = UserFactory.build({ name: 'John' });                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Benefits of Factories

1. **DRY** - Define defaults once, override only what matters for each test
2. **Maintainability** - Schema changes require updates in one place
3. **Realistic Data** - Faker generates production-like values
4. **Type Safety** - Factories ensure type correctness
5. **Readability** - Tests focus on what's being tested, not data setup
6. **Associations** - Handle complex object relationships cleanly

---

## TypeScript/JavaScript: Fishery + Faker

### Installation

```bash
npm install --save-dev fishery @faker-js/faker
# or
yarn add -D fishery @faker-js/faker
```

### Factory Definition

```typescript
// factories/user.factory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import type { User, UserRole } from '@/types';

export const UserFactory = Factory.define<User>(({ sequence, params }) => ({
  id: `usr_${sequence}`,
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: params.role ?? 'user',
  passwordHash: faker.string.alphanumeric(60),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  isActive: true,
  metadata: {
    lastLoginAt: faker.date.recent(),
    loginCount: faker.number.int({ min: 1, max: 100 }),
  },
}));

// factories/post.factory.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';
import type { Post } from '@/types';
import { UserFactory } from './user.factory';

export const PostFactory = Factory.define<Post>(({ sequence, associations }) => ({
  id: `post_${sequence}`,
  title: faker.lorem.sentence(),
  content: faker.lorem.paragraphs(3),
  slug: faker.helpers.slugify(faker.lorem.words(3)),
  author: associations.author || UserFactory.build(),
  authorId: associations.author?.id || `usr_${sequence}`,
  publishedAt: faker.date.past(),
  tags: faker.helpers.arrayElements(['tech', 'news', 'tutorial', 'opinion'], 2),
  viewCount: faker.number.int({ min: 0, max: 10000 }),
}));
```

### Factory Usage

```typescript
// Basic usage
const user = UserFactory.build();

// Override specific fields
const admin = UserFactory.build({ role: 'admin', name: 'Admin User' });

// Build multiple
const users = UserFactory.buildList(5);

// With associations
const postWithAuthor = PostFactory.build({}, {
  associations: { author: UserFactory.build({ name: 'Jane Doe' }) }
});

// Transient params (not part of the object)
const UserFactoryWithTransient = Factory.define<User>(({ transientParams }) => ({
  // ...fields
  passwordHash: transientParams.plainPassword
    ? hashSync(transientParams.plainPassword, 10)
    : faker.string.alphanumeric(60),
}));

const userWithKnownPassword = UserFactoryWithTransient.build(
  {},
  { transient: { plainPassword: 'testPassword123' } }
);
```

### Traits/Variants

```typescript
// factories/user.factory.ts
export const UserFactory = Factory.define<User>(({ sequence }) => ({
  id: `usr_${sequence}`,
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'user',
  isActive: true,
  isVerified: false,
}));

// Define traits as separate factories that extend base
export const AdminFactory = UserFactory.params({ role: 'admin' });
export const VerifiedUserFactory = UserFactory.params({ isVerified: true });
export const InactiveUserFactory = UserFactory.params({ isActive: false });

// Usage
const admin = AdminFactory.build();
const verifiedUser = VerifiedUserFactory.build();
```

### Factory Index

```typescript
// factories/index.ts
export { UserFactory, AdminFactory, VerifiedUserFactory } from './user.factory';
export { PostFactory } from './post.factory';
export { CommentFactory } from './comment.factory';
export { OrderFactory, OrderItemFactory } from './order.factory';

// Usage in tests
import { UserFactory, PostFactory } from '@/tests/factories';
```

---

## Python: factory_boy + Faker

### Installation

```bash
pip install factory-boy Faker
```

### Factory Definition

```python
# tests/factories/user_factory.py
import factory
from faker import Faker
from datetime import datetime, timezone

from app.models import User

fake = Faker()


class UserFactory(factory.Factory):
    """Factory for creating User instances."""

    class Meta:
        model = User

    id = factory.Sequence(lambda n: f"usr_{n}")
    email = factory.LazyAttribute(lambda _: fake.email())
    name = factory.LazyAttribute(lambda _: fake.name())
    role = "user"
    password_hash = factory.LazyAttribute(lambda _: fake.sha256())
    created_at = factory.LazyFunction(lambda: datetime.now(timezone.utc))
    is_active = True

    class Params:
        """Traits for the factory."""
        admin = factory.Trait(role="admin")
        inactive = factory.Trait(is_active=False)


class PostFactory(factory.Factory):
    """Factory for creating Post instances."""

    class Meta:
        model = Post

    id = factory.Sequence(lambda n: f"post_{n}")
    title = factory.LazyAttribute(lambda _: fake.sentence())
    content = factory.LazyAttribute(lambda _: fake.paragraphs(3))
    slug = factory.LazyAttribute(lambda obj: fake.slug())
    author = factory.SubFactory(UserFactory)
    author_id = factory.LazyAttribute(lambda obj: obj.author.id)
    published_at = factory.LazyFunction(lambda: fake.date_time_this_year())
    view_count = factory.LazyAttribute(lambda _: fake.random_int(min=0, max=10000))


# SQLAlchemy integration
class SQLAlchemyUserFactory(factory.alchemy.SQLAlchemyModelFactory):
    """Factory for creating User instances with SQLAlchemy."""

    class Meta:
        model = User
        sqlalchemy_session = None  # Set in conftest.py
        sqlalchemy_session_persistence = "commit"

    id = factory.Sequence(lambda n: f"usr_{n}")
    email = factory.LazyAttribute(lambda _: fake.email())
    name = factory.LazyAttribute(lambda _: fake.name())
```

### Factory Usage

```python
# Basic usage
user = UserFactory()

# Override specific fields
admin = UserFactory(role="admin", name="Admin User")

# Using traits
admin_user = UserFactory(admin=True)
inactive_user = UserFactory(inactive=True)

# Build multiple
users = UserFactory.create_batch(5)

# With associations
post = PostFactory(author=UserFactory(name="Jane Doe"))

# Build without saving (for non-ORM factories)
user_dict = UserFactory.build()

# Stub (minimal valid object)
user_stub = UserFactory.stub()
```

### Conftest Setup

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from tests.factories import SQLAlchemyUserFactory, SQLAlchemyPostFactory


@pytest.fixture(scope="session")
def engine():
    """Create test database engine."""
    return create_engine("sqlite:///:memory:")


@pytest.fixture
def db_session(engine):
    """Create a new database session for each test."""
    Session = sessionmaker(bind=engine)
    session = Session()

    # Set session for all SQLAlchemy factories
    SQLAlchemyUserFactory._meta.sqlalchemy_session = session
    SQLAlchemyPostFactory._meta.sqlalchemy_session = session

    yield session

    session.rollback()
    session.close()
```

---

## Go: Custom Factory Pattern

Go doesn't have a standard factory library, so we use a builder pattern with functional options.

### Factory Definition

```go
// tests/factories/user_factory.go
package factories

import (
    "fmt"
    "sync/atomic"
    "time"

    "github.com/brianvoe/gofakeit/v6"
    "myapp/internal/user"
)

var userSequence int64

type UserFactoryOption func(*user.User)

type UserFactory struct{}

func NewUserFactory() *UserFactory {
    return &UserFactory{}
}

func (f *UserFactory) Build(opts ...UserFactoryOption) *user.User {
    seq := atomic.AddInt64(&userSequence, 1)

    u := &user.User{
        ID:           fmt.Sprintf("usr_%d", seq),
        Email:        gofakeit.Email(),
        Name:         gofakeit.Name(),
        Role:         user.RoleUser,
        PasswordHash: gofakeit.Password(true, true, true, false, false, 60),
        CreatedAt:    gofakeit.DateRange(time.Now().AddDate(-1, 0, 0), time.Now()),
        IsActive:     true,
    }

    for _, opt := range opts {
        opt(u)
    }

    return u
}

func (f *UserFactory) BuildList(count int, opts ...UserFactoryOption) []*user.User {
    users := make([]*user.User, count)
    for i := 0; i < count; i++ {
        users[i] = f.Build(opts...)
    }
    return users
}

// Option functions (traits)
func WithEmail(email string) UserFactoryOption {
    return func(u *user.User) {
        u.Email = email
    }
}

func WithRole(role user.Role) UserFactoryOption {
    return func(u *user.User) {
        u.Role = role
    }
}

func WithName(name string) UserFactoryOption {
    return func(u *user.User) {
        u.Name = name
    }
}

func AsAdmin() UserFactoryOption {
    return WithRole(user.RoleAdmin)
}

func AsInactive() UserFactoryOption {
    return func(u *user.User) {
        u.IsActive = false
    }
}
```

### Factory Usage

```go
func TestUserService(t *testing.T) {
    factory := factories.NewUserFactory()

    // Basic usage
    user := factory.Build()

    // With options
    admin := factory.Build(
        factories.WithName("Admin User"),
        factories.AsAdmin(),
    )

    // Build multiple
    users := factory.BuildList(5)

    // With specific email
    specificUser := factory.Build(
        factories.WithEmail("test@example.com"),
    )
}
```

### Post Factory with Associations

```go
// tests/factories/post_factory.go
package factories

import (
    "fmt"
    "sync/atomic"

    "github.com/brianvoe/gofakeit/v6"
    "myapp/internal/post"
)

var postSequence int64

type PostFactoryOption func(*post.Post)

type PostFactory struct {
    userFactory *UserFactory
}

func NewPostFactory() *PostFactory {
    return &PostFactory{
        userFactory: NewUserFactory(),
    }
}

func (f *PostFactory) Build(opts ...PostFactoryOption) *post.Post {
    seq := atomic.AddInt64(&postSequence, 1)
    author := f.userFactory.Build()

    p := &post.Post{
        ID:          fmt.Sprintf("post_%d", seq),
        Title:       gofakeit.Sentence(5),
        Content:     gofakeit.Paragraph(3, 5, 10, "\n\n"),
        Slug:        gofakeit.LetterN(10),
        Author:      author,
        AuthorID:    author.ID,
        PublishedAt: gofakeit.DateRange(time.Now().AddDate(-1, 0, 0), time.Now()),
        ViewCount:   gofakeit.Number(0, 10000),
    }

    for _, opt := range opts {
        opt(p)
    }

    return p
}

func WithAuthor(author *user.User) PostFactoryOption {
    return func(p *post.Post) {
        p.Author = author
        p.AuthorID = author.ID
    }
}

func WithTitle(title string) PostFactoryOption {
    return func(p *post.Post) {
        p.Title = title
    }
}
```

---

## Java/Kotlin: Instancio

### Installation (Maven)

```xml
<dependency>
    <groupId>org.instancio</groupId>
    <artifactId>instancio-junit</artifactId>
    <version>3.3.1</version>
    <scope>test</scope>
</dependency>
```

### Java Factory Definition

```java
// src/test/java/com/example/factories/UserFactory.java
package com.example.factories;

import com.example.models.User;
import com.example.models.UserRole;
import org.instancio.Instancio;
import org.instancio.Model;

import static org.instancio.Select.field;

public class UserFactory {

    private static final Model<User> BASE_MODEL = Instancio.of(User.class)
        .set(field(User::getRole), UserRole.USER)
        .set(field(User::isActive), true)
        .toModel();

    public static User build() {
        return Instancio.create(BASE_MODEL);
    }

    public static User build(UserRole role) {
        return Instancio.of(BASE_MODEL)
            .set(field(User::getRole), role)
            .create();
    }

    public static User buildAdmin() {
        return build(UserRole.ADMIN);
    }

    public static User buildInactive() {
        return Instancio.of(BASE_MODEL)
            .set(field(User::isActive), false)
            .create();
    }

    public static User buildWithEmail(String email) {
        return Instancio.of(BASE_MODEL)
            .set(field(User::getEmail), email)
            .create();
    }

    public static java.util.List<User> buildList(int count) {
        return Instancio.ofList(BASE_MODEL)
            .size(count)
            .create();
    }
}
```

### Kotlin Factory Definition

```kotlin
// src/test/kotlin/com/example/factories/UserFactory.kt
package com.example.factories

import com.example.models.User
import com.example.models.UserRole
import org.instancio.Instancio
import org.instancio.Select.field

object UserFactory {

    private val baseModel = Instancio.of(User::class.java)
        .set(field(User::role), UserRole.USER)
        .set(field(User::isActive), true)
        .toModel()

    fun build(): User = Instancio.create(baseModel)

    fun build(role: UserRole): User = Instancio.of(baseModel)
        .set(field(User::role), role)
        .create()

    fun buildAdmin(): User = build(UserRole.ADMIN)

    fun buildInactive(): User = Instancio.of(baseModel)
        .set(field(User::isActive), false)
        .create()

    fun buildWithEmail(email: String): User = Instancio.of(baseModel)
        .set(field(User::email), email)
        .create()

    fun buildList(count: Int): List<User> = Instancio.ofList(baseModel)
        .size(count)
        .create()
}
```

### Usage

```java
// Java
@Test
void shouldCreateUserWithHashedPassword() {
    // Arrange
    var userData = UserFactory.build();

    // Act
    var result = userService.createUser(userData);

    // Assert
    assertThat(result.getPasswordHash()).isNotEqualTo(userData.getPassword());
}

@Test
void shouldRejectDuplicateEmail() {
    // Arrange
    var existingUser = UserFactory.buildWithEmail("existing@example.com");
    userRepository.save(existingUser);

    var duplicateUser = UserFactory.buildWithEmail("existing@example.com");

    // Act & Assert
    assertThatThrownBy(() -> userService.createUser(duplicateUser))
        .isInstanceOf(DuplicateEmailException.class);
}
```

```kotlin
// Kotlin
@Test
fun `should create user with hashed password`() {
    // Arrange
    val userData = UserFactory.build()

    // Act
    val result = userService.createUser(userData)

    // Assert
    assertThat(result.passwordHash).isNotEqualTo(userData.password)
}
```

---

## Factory Organization

### Directory Structure

```
tests/
├── factories/
│   ├── index.ts           # TypeScript: Re-export all factories
│   ├── __init__.py        # Python: Re-export all factories
│   ├── user.factory.ts
│   ├── user_factory.py
│   ├── user_factory.go
│   ├── post.factory.ts
│   ├── post_factory.py
│   ├── post_factory.go
│   └── ...
└── ...
```

### Naming Conventions

| Language    | File Name              | Class/Export Name  |
|-------------|------------------------|--------------------|
| TypeScript  | `user.factory.ts`      | `UserFactory`      |
| Python      | `user_factory.py`      | `UserFactory`      |
| Go          | `user_factory.go`      | `UserFactory`      |
| Java        | `UserFactory.java`     | `UserFactory`      |
| Kotlin      | `UserFactory.kt`       | `UserFactory`      |

---

## Anti-Patterns to Avoid

### DON'T: Inline Object Literals

```typescript
// BAD
it('should create user', () => {
  const user = {
    id: '1',
    email: 'test@test.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date('2024-01-01'),
  };
  // If User model changes, this breaks silently
});

// GOOD
it('should create user', () => {
  const user = UserFactory.build();
  // Factory always produces valid, up-to-date objects
});
```

### DON'T: Hardcode Test Data

```typescript
// BAD - Magic values scattered across tests
const user = { email: 'john@test.com', id: '12345' };

// GOOD - Factory with meaningful overrides only
const user = UserFactory.build({ email: 'john@test.com' });
```

### DON'T: Duplicate Factory Logic

```typescript
// BAD - Copy-pasted setup in every test
beforeEach(() => {
  user = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    // ... 20 more lines
  };
});

// GOOD - Centralized factory
beforeEach(() => {
  user = UserFactory.build();
});
```

### DON'T: Over-specify Test Data

```typescript
// BAD - Over-specified, fragile
const user = UserFactory.build({
  id: 'usr_1',
  email: 'test@example.com',
  name: 'John Doe',
  role: 'user',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// GOOD - Only specify what the test cares about
const user = UserFactory.build({ role: 'admin' });
```
