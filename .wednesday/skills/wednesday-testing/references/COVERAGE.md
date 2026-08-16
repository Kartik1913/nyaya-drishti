# Coverage Requirements

This document defines coverage requirements, configuration, and enforcement strategies.

---

## Coverage Thresholds

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MINIMUM COVERAGE REQUIREMENTS                                          │
│                                                                         │
│  Line Coverage:      80%                                                │
│  Branch Coverage:    70%                                                │
│  Function Coverage:  80%                                                │
│  Statement Coverage: 80%                                                │
│                                                                         │
│  Critical paths (auth, payment): 95%+ branch, 100% line                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Coverage by Component Type

| Component Type             | Line Min | Branch Min | Rationale |
|----------------------------|:--------:|:----------:|-----------|
| Business logic/services    | 90%      | 85%        | Core application logic |
| API handlers/controllers   | 85%      | 80%        | Entry points to system |
| React/Vue components       | 80%      | 70%        | UI has visual testing too |
| Utility functions          | 95%      | 90%        | Reused everywhere |
| Database repositories      | 85%      | 75%        | Data access layer |
| Authentication/Security    | 100%     | 95%        | Security-critical |
| Payment processing         | 100%     | 95%        | Business-critical |
| Configuration/setup        | 70%      | 60%        | Often environment-specific |

---

## Coverage Configuration

### TypeScript/Jest

```typescript
// jest.config.ts
export default {
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Stricter thresholds for critical paths
    './src/services/auth/**/*.ts': {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/services/payment/**/*.ts': {
      branches: 95,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__fixtures__/',
    '/__mocks__/',
    '/tests/',
    '\\.test\\.ts$',
    '\\.spec\\.ts$',
  ],
};
```

### TypeScript/Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules',
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/index.ts',
        'src/types/**',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 80,
        statements: 80,
      },
      // Per-file thresholds (Vitest 1.0+)
      thresholdAutoUpdate: false,
    },
  },
});
```

### Python/pytest

```ini
# pytest.ini or pyproject.toml
[tool.pytest.ini_options]
addopts = "--cov=app --cov-report=term-missing --cov-report=html --cov-fail-under=80"

[tool.coverage.run]
source = ["app"]
omit = [
    "*/tests/*",
    "*/__init__.py",
    "*/migrations/*",
    "*/conftest.py",
]
branch = true

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise NotImplementedError",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.:",
]
fail_under = 80
show_missing = true

[tool.coverage.html]
directory = "coverage_html"
```

```python
# conftest.py - Stricter coverage for critical modules
import pytest

def pytest_configure(config):
    """Configure coverage thresholds per module."""
    config.addinivalue_line(
        "markers",
        "critical: mark test as testing critical functionality"
    )

# Run with: pytest --cov-fail-under=95 tests/test_auth.py
```

### Go

```go
// Run tests with coverage
// go test -coverprofile=coverage.out -covermode=atomic ./...
// go tool cover -html=coverage.out -o coverage.html

// Makefile
.PHONY: test-coverage
test-coverage:
	go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -func=coverage.out | tail -1
	@coverage=$$(go tool cover -func=coverage.out | tail -1 | awk '{print $$3}' | sed 's/%//'); \
	if [ $$(echo "$$coverage < 80" | bc) -eq 1 ]; then \
		echo "Coverage $$coverage% is below threshold of 80%"; \
		exit 1; \
	fi
```

### Java/Kotlin (JaCoCo)

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>check</id>
            <phase>verify</phase>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.70</minimum>
                            </limit>
                        </limits>
                    </rule>
                    <!-- Stricter for security packages -->
                    <rule>
                        <element>PACKAGE</element>
                        <includes>
                            <include>com.example.security.*</include>
                            <include>com.example.auth.*</include>
                        </includes>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.95</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

```kotlin
// build.gradle.kts
plugins {
    jacoco
}

jacoco {
    toolVersion = "0.8.11"
}

tasks.jacocoTestReport {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.80".toBigDecimal()
            }
        }
        rule {
            element = "PACKAGE"
            includes = listOf("com.example.auth.*", "com.example.payment.*")
            limit {
                minimum = "0.95".toBigDecimal()
            }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}
```

---

## Coverage Exclusions

### Legitimate Exclusions

```typescript
// TypeScript/JavaScript
/* istanbul ignore next */
function platformSpecificCode() {
  // Only runs on specific platforms
  if (process.platform === 'win32') {
    // Windows-specific code
  }
}

/* istanbul ignore if */
if (process.env.NODE_ENV === 'development') {
  // Development-only code
}
```

```python
# Python
def platform_specific():
    if sys.platform == 'win32':  # pragma: no cover
        # Windows-specific code
        pass

# Exclude entire functions
def __repr__(self):  # pragma: no cover
    return f"User({self.id})"
```

```go
// Go - use build tags
// +build !windows

package mypackage

func unixOnlyFunction() {
    // This won't be included in Windows builds
}
```

### What NOT to Exclude

```typescript
// BAD - Excluding error handling
/* istanbul ignore next */
catch (error) {
  // This should be tested!
  handleError(error);
}

// BAD - Excluding edge cases
/* istanbul ignore if */
if (users.length === 0) {
  // This should be tested!
  return [];
}

// BAD - Excluding validation
/* istanbul ignore next */
function validateEmail(email: string) {
  // This MUST be tested!
}
```

### Required Justification

Every `istanbul ignore` or `pragma: no cover` MUST have a comment explaining why:

```typescript
// GOOD - Justified exclusion
/* istanbul ignore next - defensive code for type narrowing, TypeScript guarantees this path is unreachable */
default:
  const exhaustiveCheck: never = status;
  throw new Error(`Unhandled status: ${exhaustiveCheck}`);

// GOOD - Platform-specific
/* istanbul ignore next - Windows-specific file path handling, tested in Windows CI */
if (process.platform === 'win32') {
  path = path.replace(/\//g, '\\');
}

// BAD - No justification
/* istanbul ignore next */
if (error) {
  throw error;
}
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Check coverage thresholds
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          echo "Line coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage below threshold!"
            exit 1
          fi

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Comment coverage on PR
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
            const { lines, branches, functions } = coverage.total;

            const body = `## Coverage Report

            | Metric | Coverage | Threshold |
            |--------|----------|-----------|
            | Lines | ${lines.pct}% | 80% |
            | Branches | ${branches.pct}% | 70% |
            | Functions | ${functions.pct}% | 80% |
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  stage: test
  script:
    - npm ci
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 1 week
```

---

## Coverage Reports

### Generating Reports

```bash
# TypeScript/Jest
npm run test -- --coverage --coverageReporters=text,lcov,html

# TypeScript/Vitest
npm run test -- --coverage

# Python
pytest --cov=app --cov-report=html --cov-report=xml

# Go
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# Java
mvn test jacoco:report
```

### Reading Reports

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
--------------------|---------|----------|---------|---------|-------------------
All files           |   85.71 |    72.22 |   88.89 |   85.71 |
 services/          |   90.00 |    80.00 |   100.0 |   90.00 |
  user.service.ts   |   90.00 |    80.00 |   100.0 |   90.00 | 45-48,72
 utils/             |   75.00 |    60.00 |   66.67 |   75.00 |
  validation.ts     |   75.00 |    60.00 |   66.67 |   75.00 | 23-30
--------------------|---------|----------|---------|---------|-------------------
```

- **% Stmts**: Percentage of statements executed
- **% Branch**: Percentage of branches (if/else) covered
- **% Funcs**: Percentage of functions called
- **% Lines**: Percentage of lines executed
- **Uncovered Lines**: Line numbers missing coverage

---

## Improving Coverage

### Identifying Gaps

1. **Run coverage report**: `npm run test:coverage`
2. **Open HTML report**: `open coverage/lcov-report/index.html`
3. **Review uncovered lines**: Red highlighted lines need tests
4. **Check branch coverage**: Yellow indicates partial branch coverage

### Common Coverage Gaps

```typescript
// Gap: Error handling not tested
async function fetchUser(id: string) {
  try {
    return await api.get(`/users/${id}`);
  } catch (error) {
    // Often uncovered - add error test case!
    throw new UserFetchError(error);
  }
}

// Test to cover error case:
it('should throw UserFetchError when API fails', async () => {
  mockApi.get.mockRejectedValue(new Error('Network error'));

  await expect(fetchUser('123')).rejects.toThrow(UserFetchError);
});
```

```typescript
// Gap: Edge cases not tested
function processItems(items: Item[]) {
  if (items.length === 0) {
    // Often uncovered!
    return [];
  }
  return items.map(process);
}

// Test to cover edge case:
it('should return empty array for empty input', () => {
  expect(processItems([])).toEqual([]);
});
```

```typescript
// Gap: Switch default case
function getStatusLabel(status: Status) {
  switch (status) {
    case 'active': return 'Active';
    case 'inactive': return 'Inactive';
    default:
      // May be uncovered
      return 'Unknown';
  }
}

// Test all cases including default:
it.each([
  ['active', 'Active'],
  ['inactive', 'Inactive'],
  ['unknown', 'Unknown'],
])('should return %s for status %s', (status, expected) => {
  expect(getStatusLabel(status as Status)).toBe(expected);
});
```

---

## Coverage Anti-Patterns

### DON'T: Chase 100% at All Costs

```typescript
// BAD - Testing trivial getters just for coverage
class User {
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
}

it('should return full name', () => {
  const user = new User('John', 'Doe');
  expect(user.fullName).toBe('John Doe'); // Low value test
});

// GOOD - Test meaningful behavior
it('should format display name correctly', () => {
  // This tests actual business logic
});
```

### DON'T: Write Tests Just to Hit Coverage

```typescript
// BAD - Test exists only for coverage
it('should call function', () => {
  someFunction();
  // No assertion! Just hitting lines
});

// GOOD - Test verifies behavior
it('should validate email format', () => {
  expect(validateEmail('invalid')).toBe(false);
  expect(validateEmail('valid@example.com')).toBe(true);
});
```

### DON'T: Ignore Low Coverage Warnings

```bash
# BAD - Lowering threshold to pass CI
coverageThreshold: {
  global: {
    lines: 50,  # Lowered from 80 to pass!
  }
}

# GOOD - Write tests to meet threshold
# Keep threshold at 80%, add missing tests
```

### DO: Focus on Critical Path Coverage

```typescript
// Prioritize coverage for:
// 1. Authentication/authorization
// 2. Payment processing
// 3. Data validation
// 4. Security-sensitive code
// 5. Core business logic

// Lower priority:
// 1. UI styling
// 2. Configuration loading
// 3. Logging utilities
// 4. Third-party wrapper code
```
