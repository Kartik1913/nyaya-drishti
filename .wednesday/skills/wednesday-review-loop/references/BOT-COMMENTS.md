# Handling Review Bot Comments

This document provides detailed guidance on handling comments from automated code review bots including CodeRabbit, Gemini, GitHub Copilot, SonarCloud, and others.

---

## 1. CodeRabbit

CodeRabbit is an AI-powered code review bot that provides detailed feedback on pull requests.

### Comment Types

| Type | Icon | Severity | Action Required |
|------|------|----------|-----------------|
| `[issue]` | :warning: | High | Must fix before merge |
| `[security]` | :lock: | Critical | Must fix immediately |
| `[performance]` | :rocket: | Medium | Evaluate and fix if impactful |
| `[suggestion]` | :bulb: | Medium | Strongly consider implementing |
| `[nitpick]` | :mag: | Low | Optional, can discuss |
| `[question]` | :question: | Info | Provide clarification |

### Interacting with CodeRabbit

#### Resolving Comments

```markdown
<!-- Simple acknowledgment -->
@coderabbitai resolve

<!-- Resolve with explanation -->
@coderabbitai resolve - Fixed by using null coalescing operator

<!-- Resolve multiple comments -->
@coderabbitai resolve all
```

#### Requesting Re-review

```markdown
<!-- Request fresh review after fixes -->
@coderabbitai review

<!-- Request review of specific files -->
@coderabbitai review src/auth/login.ts
```

#### Dismissing Suggestions

```markdown
<!-- Dismiss with reason (required) -->
@coderabbitai dismiss - This is intentional because the API requires this format

<!-- Dismiss as false positive -->
@coderabbitai dismiss - False positive: variable is used in template
```

#### Asking for Clarification

```markdown
<!-- Ask CodeRabbit to explain -->
@coderabbitai explain why is this a concern?

<!-- Ask for alternative suggestions -->
@coderabbitai suggest alternatives
```

### Common CodeRabbit Feedback Patterns

#### Security Issues

```typescript
// CodeRabbit flags: SQL injection vulnerability
// BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;

// GOOD (parameterized query)
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);
```

```typescript
// CodeRabbit flags: XSS vulnerability
// BAD
element.innerHTML = userInput;

// GOOD
element.textContent = userInput;
// OR with sanitization
element.innerHTML = DOMPurify.sanitize(userInput);
```

#### Performance Issues

```typescript
// CodeRabbit flags: N+1 query pattern
// BAD
for (const user of users) {
  const orders = await db.query('SELECT * FROM orders WHERE user_id = $1', [user.id]);
}

// GOOD (batch query)
const userIds = users.map(u => u.id);
const orders = await db.query('SELECT * FROM orders WHERE user_id = ANY($1)', [userIds]);
```

#### Code Quality Issues

```typescript
// CodeRabbit flags: unused variable
// BAD
const { data, error, loading } = useQuery();  // loading never used

// GOOD
const { data, error } = useQuery();
```

### CodeRabbit Configuration

```yaml
# .coderabbit.yaml
reviews:
  auto_review:
    enabled: true
    ignore_drafts: true
  review_comment_type: code_review
  severity_thresholds:
    error: 1      # Any error blocks merge
    warning: 5    # 5+ warnings require attention
    info: 10      # Info is advisory

chat:
  enabled: true

ignore:
  - "*.md"
  - "*.lock"
  - "dist/**"
```

---

## 2. Gemini Code Review (Google)

Gemini provides AI-powered code review with structured feedback.

### Comment Categories

| Category | Description | Action |
|----------|-------------|--------|
| `ERROR` | Bugs, crashes, logic errors | Must fix |
| `WARNING` | Potential issues, bad practices | Should fix |
| `INFO` | Suggestions, improvements | Nice to have |
| `STYLE` | Formatting, conventions | Follow project rules |

### Handling Gemini Feedback

#### Acknowledging Feedback

```markdown
<!-- Acknowledge and mark as done -->
/gemini resolved

<!-- Acknowledge with note -->
/gemini resolved - Addressed by extracting to helper function
```

#### Disagreeing with Feedback

```markdown
<!-- Explain why you disagree -->
/gemini won't fix - This pattern is required for backward compatibility.
See ADR-005 for context.
```

#### Requesting Explanation

```markdown
<!-- Ask for more details -->
/gemini explain

<!-- Ask for examples -->
/gemini show example
```

### Common Gemini Patterns

#### Error Handling

```typescript
// Gemini flags: Unhandled promise rejection
// BAD
async function fetchData() {
  const response = await fetch(url);
  return response.json();
}

// GOOD
async function fetchData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
```

#### Type Safety

```typescript
// Gemini flags: Implicit any type
// BAD
function process(data) {
  return data.value;
}

// GOOD
interface DataInput {
  value: string;
}

function process(data: DataInput): string {
  return data.value;
}
```

---

## 3. GitHub Copilot Review

Copilot provides inline suggestions during code review.

### Suggestion Types

| Type | Description | Action |
|------|-------------|--------|
| Code improvement | Better implementation | Evaluate and implement |
| Bug detection | Potential issues | Review and fix |
| Security concern | Vulnerability hint | Must address |
| Performance tip | Optimization | Consider implementing |

### Handling Copilot Suggestions

#### Accepting Suggestions

1. Review the suggestion carefully
2. Click "Accept" or implement manually
3. Commit with reference to improvement

```bash
git commit -m "refactor(auth): apply Copilot suggestion for cleaner null check"
```

#### Modifying Suggestions

```markdown
<!-- In PR comment -->
Implemented a variation of Copilot's suggestion:
- Original: Use optional chaining throughout
- Applied: Used optional chaining for nullable paths only

This preserves our explicit null checks for required fields.
```

#### Dismissing Suggestions

```markdown
<!-- Explain dismissal -->
Dismissed Copilot suggestion because:
- Project uses explicit error handling pattern
- Optional chaining would hide errors we need to catch
```

---

## 4. SonarCloud / SonarQube

SonarCloud analyzes code quality, security, and maintainability.

### Issue Types

| Type | Icon | Description | Action |
|------|------|-------------|--------|
| Bug | :bug: | Something wrong with code | Must fix |
| Vulnerability | :lock: | Security issue | Must fix immediately |
| Code Smell | :nose: | Maintainability issue | Should fix |
| Security Hotspot | :fire: | Needs security review | Review and decide |
| Debt | :clock: | Technical debt | Track and plan |

### Handling SonarCloud Issues

#### Resolving Issues

```markdown
<!-- In code, explain resolution -->
// NOSONAR: False positive - value is validated at entry point

<!-- Or fix the issue -->
// Before: Code smell
if (x == true) { ... }

// After: Clean code
if (x) { ... }
```

#### Marking as False Positive

In SonarCloud UI:
1. Click on the issue
2. Select "Resolve as False Positive"
3. Add comment explaining why

```
False positive: This null check is required because the API
returns null for deleted users, not undefined.
```

#### Marking as Won't Fix

```
Won't fix: This complexity is inherent to the algorithm.
Splitting would reduce readability without improving maintainability.
See ADR-012 for architectural decision.
```

### Common SonarCloud Rules

#### Cognitive Complexity

```typescript
// Sonar flags: Cognitive complexity too high (15, max 10)
// BAD
function processOrder(order) {
  if (order.items) {
    for (const item of order.items) {
      if (item.quantity > 0) {
        if (item.inStock) {
          // deep nesting continues...
        }
      }
    }
  }
}

// GOOD (extracted functions)
function processOrder(order) {
  if (!order.items) return;
  order.items.filter(isValidItem).forEach(processItem);
}

function isValidItem(item) {
  return item.quantity > 0 && item.inStock;
}

function processItem(item) {
  // focused logic
}
```

#### Security Hotspots

```typescript
// Sonar flags: Hardcoded password
// BAD
const password = "admin123";

// GOOD
const password = process.env.ADMIN_PASSWORD;
```

---

## 5. Codecov

Codecov analyzes test coverage and reports changes.

### Coverage Warnings

| Warning | Meaning | Action |
|---------|---------|--------|
| Coverage decreased | PR reduces coverage | Add tests |
| Patch not covered | New code untested | Add tests for changes |
| Below threshold | Under minimum | Increase coverage |

### Handling Coverage Comments

#### Adding Missing Tests

```markdown
Codecov shows 3 uncovered lines in `src/auth/login.ts`:
- Line 45: Error handling path
- Lines 67-68: Edge case for expired tokens

Adding tests for these paths...
```

```typescript
// New test for uncovered path
it('should handle expired token gracefully', () => {
  const expiredToken = createExpiredToken();
  expect(() => validateToken(expiredToken)).toThrow(TokenExpiredError);
});
```

#### Excluding Files

```yaml
# codecov.yml
coverage:
  ignore:
    - "src/**/*.test.ts"
    - "src/mocks/**"
    - "src/types/**"  # Type-only files
```

#### Addressing Coverage Decrease

```markdown
Coverage decreased by 2% due to:
1. New error handling paths (hard to test in unit tests)
2. Added logging code

Mitigation:
- Added integration tests covering error scenarios
- Excluded logging-only functions from coverage
```

---

## 6. Review Loop Automation

### Automated Comment Fetching

```bash
#!/bin/bash
# fetch-reviews.sh

PR_NUMBER=$1
REPO="owner/repo"

# Fetch all review comments
gh api repos/$REPO/pulls/$PR_NUMBER/comments \
  --jq '.[] | {id: .id, author: .user.login, body: .body, path: .path, line: .line}'

# Fetch review bot status
gh api repos/$REPO/pulls/$PR_NUMBER/reviews \
  --jq '.[] | select(.user.type == "Bot") | {bot: .user.login, state: .state}'
```

### Automated Resolution Loop

```bash
#!/bin/bash
# review-loop.sh

PR_NUMBER=$1

while true; do
  echo "Fetching review comments..."

  # Count unresolved comments
  UNRESOLVED=$(gh api repos/$REPO/pulls/$PR_NUMBER/comments \
    --jq '[.[] | select(.resolved != true)] | length')

  if [ "$UNRESOLVED" -eq 0 ]; then
    echo "All comments resolved!"

    # Check for new reviews
    PENDING_REVIEWS=$(gh pr checks $PR_NUMBER --json state \
      --jq '[.[] | select(.state == "pending")] | length')

    if [ "$PENDING_REVIEWS" -eq 0 ]; then
      echo "All checks complete. PR ready for human review."
      break
    else
      echo "Waiting for $PENDING_REVIEWS pending checks..."
    fi
  else
    echo "$UNRESOLVED unresolved comments. Waiting for fixes..."
  fi

  sleep 60
done
```

### Comment Categorization Script

```bash
#!/bin/bash
# categorize-comments.sh

PR_NUMBER=$1

echo "=== Critical (Must Fix) ==="
gh api repos/$REPO/pulls/$PR_NUMBER/comments \
  --jq '.[] | select(.body | test("\\[security\\]|\\[issue\\]|ERROR"; "i")) | .body' \
  | head -20

echo ""
echo "=== Should Fix ==="
gh api repos/$REPO/pulls/$PR_NUMBER/comments \
  --jq '.[] | select(.body | test("\\[warning\\]|\\[suggestion\\]|WARNING"; "i")) | .body' \
  | head -20

echo ""
echo "=== Nice to Have ==="
gh api repos/$REPO/pulls/$PR_NUMBER/comments \
  --jq '.[] | select(.body | test("\\[nitpick\\]|\\[info\\]|INFO"; "i")) | .body' \
  | head -20
```

---

## 7. Resolution Strategies by Priority

### Critical (Security/Bugs)

```
1. STOP other work
2. Understand the issue fully
3. Fix immediately
4. Add regression test
5. Commit with clear message
6. Push and verify fix
```

### High (Issues/Warnings)

```
1. Add to immediate todo list
2. Fix in current session
3. Test thoroughly
4. Commit with reference
5. Push with other fixes
```

### Medium (Suggestions)

```
1. Evaluate effort vs benefit
2. Implement if quick win
3. Note for later if complex
4. Respond with plan if deferring
```

### Low (Nitpicks)

```
1. Fix if trivial (< 2 minutes)
2. Defer if busy
3. Respond acknowledging feedback
4. Track for future cleanup
```

---

## 8. Response Templates

### Acknowledging and Fixing

```markdown
Good catch! Fixed by:
- Adding null check at line 45
- Updating error handling at line 67

Commit: abc1234
```

### Explaining Intentional Behavior

```markdown
This is intentional because:
1. The API contract requires this specific format
2. Changing it would break backward compatibility
3. See RFC-123 for context

I've added a code comment explaining this for future reviewers.
```

### Deferring to Future PR

```markdown
Great suggestion! This is a larger refactoring that deserves its own PR.

Created follow-up issue: #456

For this PR, I've added a TODO comment with the issue reference.
```

### Requesting More Context

```markdown
I'm not sure I understand the concern here. Could you elaborate on:
1. What specific issue this could cause?
2. Any examples of how this might fail?

Happy to fix once I understand the risk better.
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BOT COMMENT PRIORITY GUIDE                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MUST FIX (Blocking):                                                  │
│  - Security vulnerabilities                                            │
│  - Bugs / logic errors                                                 │
│  - Breaking changes                                                    │
│  - Test failures                                                       │
│                                                                         │
│  SHOULD FIX (Important):                                               │
│  - Performance issues                                                  │
│  - Code smells                                                         │
│  - Missing error handling                                              │
│  - Type safety issues                                                  │
│                                                                         │
│  CONSIDER (Optional):                                                  │
│  - Style suggestions                                                   │
│  - Refactoring ideas                                                   │
│  - Documentation improvements                                          │
│  - Nitpicks                                                            │
│                                                                         │
│  ALWAYS RESPOND:                                                       │
│  - Never ignore bot comments                                           │
│  - Explain if not fixing                                               │
│  - Link to issues if deferring                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
