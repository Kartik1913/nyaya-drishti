# Advanced Commit Practices

This document provides detailed guidance on commit strategies, message formatting, and workflows for maintaining a clean git history.

---

## 1. Commit Granularity

### The Single Responsibility Principle for Commits

Each commit should change ONE thing. If you can't describe it in one short sentence, it's too big.

#### Splitting Large Changes

```bash
# BAD: One giant commit
git add .
git commit -m "feat: add user authentication"  # 50 files changed!

# GOOD: Multiple focused commits
git add src/auth/jwt.ts src/auth/jwt.test.ts
git commit -m "feat(auth): add JWT token generation utility"

git add src/auth/middleware.ts src/auth/middleware.test.ts
git commit -m "feat(auth): add authentication middleware"

git add src/routes/auth.ts src/routes/auth.test.ts
git commit -m "feat(auth): add login and logout endpoints"

git add src/models/user.ts src/models/user.test.ts
git commit -m "feat(auth): add User model with password hashing"
```

### When to Commit

| Situation | Commit Trigger |
|-----------|----------------|
| Feature complete | All tests pass, feature works |
| Sub-feature complete | Logical unit done, tests pass |
| Bug fixed | Issue resolved, regression test added |
| Refactoring step | Code still works, tests pass |
| Test added | Tests pass, coverage improved |
| Config change | Change verified working |

### Commit Frequency Guidelines

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMIT EARLY, COMMIT OFTEN                                             │
│                                                                         │
│  Working on a feature for 4 hours?                                      │
│  You should have at least 3-5 commits, not 1.                          │
│                                                                         │
│  If you're hesitant to commit because "it's not done yet,"              │
│  you're probably making your changes too large.                         │
│                                                                         │
│  Small commits = Easy reviews = Faster merges = Happy team              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Conventional Commits Deep Dive

### Full Specification

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type Details

| Type | When to Use | Semantic Version Impact |
|------|-------------|------------------------|
| `feat` | New functionality visible to users | MINOR bump |
| `fix` | Bug fix visible to users | PATCH bump |
| `docs` | Documentation only | No bump |
| `style` | Formatting, missing semicolons | No bump |
| `refactor` | Code change that doesn't fix bug or add feature | No bump |
| `perf` | Performance improvement | PATCH bump |
| `test` | Adding/correcting tests | No bump |
| `build` | Build system, dependencies | No bump |
| `ci` | CI configuration | No bump |
| `chore` | Other changes (tooling, etc.) | No bump |
| `revert` | Reverting a previous commit | Depends |

### Scope Guidelines

Scope should identify the module, component, or area affected:

```bash
# By feature area
feat(auth): add password reset flow
feat(cart): implement quantity update
feat(search): add fuzzy matching

# By technical layer
fix(api): handle timeout errors gracefully
fix(db): add retry logic for connections
fix(ui): correct button alignment

# By component
feat(Button): add loading state variant
fix(Modal): prevent scroll when open
refactor(Form): extract validation logic
```

### Description Best Practices

```bash
# Use imperative mood (like giving a command)
✓ "add user validation"
✗ "added user validation"
✗ "adds user validation"
✗ "adding user validation"

# Be specific
✓ "fix null pointer when user has no profile"
✗ "fix bug"
✗ "fix issue"

# Include context when helpful
✓ "prevent duplicate submissions on slow networks"
✗ "prevent duplicate submissions"  # Why?

# Keep it short (50 chars max for title)
✓ "add email validation to signup form"
✗ "add email validation to the signup form to ensure users enter valid email addresses"
```

### Body Guidelines

Use the body for:
- **What** changes were made (if not obvious from title)
- **Why** these changes were necessary
- **How** the solution works (briefly)

```bash
git commit -m "fix(auth): prevent session fixation attacks

Previously, session IDs were not regenerated after login,
allowing attackers to fixate a session ID before authentication.

Now regenerate session ID immediately after successful login
as recommended by OWASP session management guidelines.

Tested with: session_fixation_test.py"
```

### Footer Guidelines

```bash
# Reference issues
Fixes #123
Closes #456
Refs #789

# Breaking changes
BREAKING CHANGE: API now requires authentication header

# Co-authors
Co-authored-by: Name <email@example.com>

# Reviewed by
Reviewed-by: Name <email@example.com>
```

---

## 3. Commit Workflows

### Feature Development

```bash
# 1. Start from updated main
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/AUTH-123-oauth-login

# 3. Make changes in atomic commits
# ... code ...
git add src/oauth/provider.ts
git commit -m "feat(oauth): add OAuth provider base class"

# ... more code ...
git add src/oauth/google.ts src/oauth/google.test.ts
git commit -m "feat(oauth): implement Google OAuth provider"

# ... more code ...
git add src/oauth/github.ts src/oauth/github.test.ts
git commit -m "feat(oauth): implement GitHub OAuth provider"

# 4. Keep branch updated
git fetch origin main
git rebase origin/main

# 5. Push for review
git push origin feat/AUTH-123-oauth-login
```

### Bug Fix Flow

```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b fix/BUG-456-cart-total

# 2. Write failing test first
git add src/cart/calculator.test.ts
git commit -m "test(cart): add failing test for discount calculation"

# 3. Implement fix
git add src/cart/calculator.ts
git commit -m "fix(cart): correct discount calculation for multiple items

Discounts were being applied per-item instead of to cart total.
Added regression test to prevent recurrence.

Fixes #456"

# 4. Push
git push origin fix/BUG-456-cart-total
```

### Refactoring Flow

```bash
# Make small, safe steps - each commit should keep tests passing

git commit -m "refactor(utils): extract date formatting to module"
# Tests pass

git commit -m "refactor(utils): extract string helpers to module"
# Tests pass

git commit -m "refactor(utils): extract number formatting to module"
# Tests pass

git commit -m "refactor(components): update imports to use new utils"
# Tests pass
```

---

## 4. Interactive Rebase for Clean History

### Cleaning Up Before PR

```bash
# Squash fixup commits before pushing
git rebase -i origin/main

# In the editor:
pick abc1234 feat(auth): add login endpoint
squash def5678 fix typo
squash ghi9012 address review comments
pick jkl3456 test(auth): add login tests
```

### Reordering Commits

```bash
git rebase -i HEAD~5

# Reorder to group related changes
pick abc1234 feat(auth): add user model
pick mno7890 test(auth): add user model tests
pick def5678 feat(auth): add auth service
pick pqr1234 test(auth): add auth service tests
pick ghi9012 feat(auth): add login endpoint
```

### Editing Commit Messages

```bash
git rebase -i HEAD~3

# Change 'pick' to 'reword' for commits to edit
reword abc1234 feat(auth): add loign endpoint  # typo!
pick def5678 test(auth): add login tests
```

---

## 5. Commit Signing

### Setting Up GPG Signing

```bash
# Generate GPG key
gpg --full-generate-key

# Get key ID
gpg --list-secret-keys --keyid-format=long

# Configure Git
git config --global user.signingkey YOUR_KEY_ID
git config --global commit.gpgsign true

# Signed commits
git commit -S -m "feat(auth): add secure endpoint"
```

### Verified Commits on GitHub

Add your GPG public key to GitHub settings to show "Verified" badge on commits.

---

## 6. Pre-Commit Hooks

### Recommended Setup

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm run test:staged

# Check commit message format
npm run commitlint
```

### commitlint Configuration

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

---

## 7. Common Patterns

### Work In Progress (WIP)

```bash
# Temporary WIP commits for switching context
git commit -m "wip: save progress on user validation"

# Before PR, squash WIP commits
git rebase -i origin/main
# Change 'pick' to 'squash' for WIP commits
```

### Fixup Commits

```bash
# Create a fixup commit to be squashed later
git commit --fixup abc1234

# Auto-squash during rebase
git rebase -i --autosquash origin/main
```

### Amending Last Commit

```bash
# Add forgotten changes to last commit
git add forgotten-file.ts
git commit --amend --no-edit

# Fix last commit message
git commit --amend -m "feat(auth): correct commit message"
```

---

## 8. Anti-Patterns to Avoid

### DON'T Do This

```bash
# Vague messages
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
git commit -m "stuff"

# Huge commits
git commit -m "feat: add entire authentication system"  # 100 files!

# Multiple unrelated changes
git commit -m "fix bug and add feature and update styles"

# Commits that break the build
git commit -m "wip - not working yet"  # Never push this!

# Meaningless ticket numbers only
git commit -m "JIRA-123"

# Stream of consciousness
git commit -m "trying something... maybe this works?"
```

### DO This Instead

```bash
# Specific and descriptive
git commit -m "fix(cart): prevent negative quantities in cart items"

# One focused change
git commit -m "feat(auth): add password strength validation"

# Each change separate
git commit -m "fix(api): handle timeout errors"
git commit -m "feat(ui): add loading spinner"
git commit -m "style(button): update hover colors"

# Always working state
git commit -m "feat(auth): add login endpoint with validation"

# Ticket + description
git commit -m "feat(auth): JIRA-123 add OAuth login flow"
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMIT MESSAGE CHEATSHEET                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FORMAT:  <type>(<scope>): <description>                                │
│                                                                         │
│  TYPES:   feat fix docs style refactor perf test build ci chore        │
│                                                                         │
│  RULES:   - Imperative mood ("add" not "added")                        │
│           - Lowercase                                                   │
│           - No period at end                                           │
│           - Max 50 chars for title                                     │
│           - Blank line before body                                     │
│           - Wrap body at 72 chars                                      │
│                                                                         │
│  EXAMPLE:                                                               │
│  feat(auth): add password reset flow                                   │
│                                                                         │
│  Implement password reset via email token.                              │
│  Token expires after 24 hours.                                         │
│                                                                         │
│  Closes #234                                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
