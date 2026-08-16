---
name: wednesday-review-loop
description: Automated PR review workflow that guides AI agents through committing code with best practices, raising PRs, and resolving review bot comments (CodeRabbit, Gemini, etc.) in a continuous loop until all feedback is addressed.
license: MIT
metadata:
  author: wednesday-solutions
  version: "1.0"
compatibility: GitHub, GitLab, Bitbucket, CodeRabbit, Gemini Code Review, GitHub Copilot Review
---

# Wednesday PR Review Loop Workflow

This skill automates the entire PR lifecycle: committing code following best practices, raising pull requests, and iteratively resolving review comments from automated bots until the PR is clean.

---

## CRITICAL: THE REVIEW LOOP PROCESS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   THE PR REVIEW LOOP IS A MANDATORY WORKFLOW                            │
│                                                                         │
│   1. COMMIT → Make atomic commits with best practices                   │
│   2. PUSH   → Push to feature branch                                    │
│   3. PR     → Create/update pull request                                │
│   4. WAIT   → Wait for review bot comments                              │
│   5. RESOLVE→ Address ALL review comments                               │
│   6. REPEAT → Go to step 1 until NO NEW COMMENTS                        │
│                                                                         │
│   ❌ DO NOT mark PR as ready until all bot comments are resolved        │
│   ❌ DO NOT ignore any review comments                                  │
│   ❌ DO NOT batch multiple unrelated changes in one commit              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Commit Best Practices

### Atomic Commits

Each commit should represent ONE logical change. This makes reviews easier and allows for clean reverts.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ONE COMMIT = ONE CHANGE                                                │
│                                                                         │
│  ✓ Add user authentication endpoint                                    │
│  ✓ Fix password validation regex                                       │
│  ✓ Add unit tests for auth service                                     │
│                                                                         │
│  ❌ Add auth, fix bugs, update tests, refactor utils (TOO MUCH!)        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Commit Frequency

| Scenario | When to Commit |
|----------|----------------|
| New feature | After each logical component is complete |
| Bug fix | After the fix is implemented and tested locally |
| Refactoring | After each refactoring step that keeps code working |
| Tests | After writing tests for a specific unit/feature |
| Documentation | After completing a section of documentation |

### Commit Message Format

Use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add JWT token refresh endpoint` |
| `fix` | Bug fix | `fix(api): handle null response in user lookup` |
| `docs` | Documentation | `docs(readme): add setup instructions` |
| `style` | Formatting (no code change) | `style(lint): fix eslint warnings` |
| `refactor` | Code restructuring | `refactor(utils): extract date helpers` |
| `test` | Adding/updating tests | `test(auth): add unit tests for login flow` |
| `chore` | Maintenance tasks | `chore(deps): update axios to v1.6.0` |
| `perf` | Performance improvements | `perf(query): add index for user lookup` |

#### Examples

```bash
# Good commit messages
git commit -m "feat(user): add email verification endpoint"
git commit -m "fix(cart): prevent negative quantity values"
git commit -m "test(payment): add integration tests for Stripe webhook"
git commit -m "refactor(auth): extract token validation to middleware"

# Bad commit messages
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "updates"
git commit -m "asdfasdf"
```

### Pre-Commit Checklist

Before EVERY commit, verify:

- [ ] Code compiles/builds without errors
- [ ] All existing tests pass
- [ ] New tests written for new code
- [ ] Linting passes (no warnings)
- [ ] Type checking passes
- [ ] No console.log/debug statements
- [ ] No hardcoded secrets or credentials
- [ ] Changes are atomic (one logical unit)

See [references/COMMIT-PRACTICES.md](references/COMMIT-PRACTICES.md) for advanced patterns.

---

## 2. Branch Strategy

### Branch Naming

```
<type>/<ticket-id>-<short-description>
```

| Type | Use Case | Example |
|------|----------|---------|
| `feat/` | New features | `feat/AUTH-123-add-oauth-login` |
| `fix/` | Bug fixes | `fix/BUG-456-cart-calculation` |
| `refactor/` | Code improvements | `refactor/TECH-789-extract-utils` |
| `docs/` | Documentation | `docs/DOC-101-api-reference` |
| `test/` | Test additions | `test/QA-202-e2e-checkout` |

### Keeping Branch Updated

```bash
# Before pushing, always sync with main
git fetch origin main
git rebase origin/main

# If conflicts occur, resolve them before pushing
# After resolving:
git rebase --continue
git push --force-with-lease
```

---

## 3. Pull Request Creation

### PR Title Format

```
<type>(<scope>): <concise description>
```

Examples:
- `feat(auth): implement OAuth2 login with Google`
- `fix(api): handle rate limiting in external service calls`
- `refactor(database): migrate to connection pooling`

### PR Description Template

```markdown
## Summary
<!-- Brief description of what this PR does -->

## Changes
<!-- List the key changes made -->
- Added X
- Modified Y
- Removed Z

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Tests
- [ ] Chore/maintenance

## Testing
<!-- How was this tested? -->
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No new warnings introduced
```

See [references/PR-TEMPLATES.md](references/PR-TEMPLATES.md) for more templates.

---

## 4. The Review Loop

### Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Create/    │     │  Wait for    │     │   Review     │
│   Update PR  │────▶│   Reviews    │────▶│   Comments   │
└──────────────┘     └──────────────┘     └──────┬───────┘
       ▲                                         │
       │                                         ▼
       │                                  ┌──────────────┐
       │              NO                  │  Comments    │
       └──────────────────────────────────│   Exist?     │
                                          └──────┬───────┘
                                                 │ YES
                                                 ▼
                                          ┌──────────────┐
                                          │   Resolve    │
                                          │   Comments   │
                                          └──────┬───────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   Commit &   │
                                          │    Push      │
                                          └──────────────┘
```

### Step-by-Step Process

#### Step 1: Create or Update PR

```bash
# Push your changes
git push origin <branch-name>

# Create PR (if new)
gh pr create --title "feat(scope): description" --body "$(cat pr-template.md)"

# Or update existing PR (just push)
git push origin <branch-name>
```

#### Step 2: Wait for Bot Reviews

Common review bots:
- **CodeRabbit** - AI-powered code review
- **Gemini Code Review** - Google's AI reviewer
- **GitHub Copilot** - Copilot review suggestions
- **SonarCloud** - Code quality and security
- **Codecov** - Coverage analysis

Wait for ALL bots to complete their reviews before proceeding.

#### Step 3: Fetch and Analyze Comments

```bash
# List all PR comments
gh pr view <pr-number> --comments

# Or fetch via API for detailed analysis
gh api repos/{owner}/{repo}/pulls/<pr-number>/comments
```

#### Step 4: Resolve Each Comment

For EACH comment:

1. **Read and understand** the feedback
2. **Implement the fix** or improvement
3. **Reply to the comment** explaining what was done
4. **Commit the change** with reference to the comment

```bash
# Commit referencing the review
git commit -m "fix(auth): address review - add input validation

Resolves CodeRabbit comment about missing validation"
```

#### Step 5: Push and Repeat

```bash
# Push all fixes
git push origin <branch-name>

# Wait for new review cycle
# Check for new comments
gh pr view <pr-number> --comments

# If new comments exist, go to Step 4
# If no new comments, PR is ready for human review
```

### Automated Loop Script

```bash
#!/bin/bash
# review-loop.sh - Automate the review resolution process

PR_NUMBER=$1

while true; do
  echo "Checking for unresolved comments..."

  # Fetch comments
  COMMENTS=$(gh api repos/{owner}/{repo}/pulls/$PR_NUMBER/comments)
  UNRESOLVED=$(echo $COMMENTS | jq '[.[] | select(.resolved == false)] | length')

  if [ "$UNRESOLVED" -eq 0 ]; then
    echo "All comments resolved!"
    break
  fi

  echo "Found $UNRESOLVED unresolved comments. Waiting for fixes..."
  sleep 60  # Wait before checking again
done
```

See [references/BOT-COMMENTS.md](references/BOT-COMMENTS.md) for bot-specific handling.

---

## 5. Handling Specific Review Bots

### CodeRabbit

CodeRabbit provides detailed AI-powered reviews. Handle its comments by:

| Comment Type | Action |
|-------------|--------|
| `[nitpick]` | Consider fixing, can discuss |
| `[suggestion]` | Strongly consider implementing |
| `[issue]` | Must fix before merge |
| `[security]` | MUST fix - security concern |
| `[performance]` | Evaluate and fix if impactful |

#### Responding to CodeRabbit

```markdown
<!-- To acknowledge and resolve -->
@coderabbitai resolve

<!-- To request re-review after fixes -->
@coderabbitai review

<!-- To dismiss a suggestion with reason -->
@coderabbitai dismiss - reason: this is intentional because...
```

### Gemini Code Review

Gemini provides suggestions categorized by severity:

| Severity | Action |
|----------|--------|
| `ERROR` | Must fix |
| `WARNING` | Should fix |
| `INFO` | Nice to have |

### GitHub Copilot Review

Copilot suggestions appear as inline comments. Address each:

1. **Accept** - Implement the suggestion
2. **Modify** - Implement a variation
3. **Dismiss** - Explain why it doesn't apply

### SonarCloud / SonarQube

| Issue Type | Action |
|------------|--------|
| Bug | Must fix |
| Vulnerability | Must fix |
| Code Smell | Should fix (may impact maintainability) |
| Security Hotspot | Review and mark as safe or fix |

---

## 6. Resolution Strategies

### Quick Fixes

For simple suggestions (typos, naming, formatting):

```bash
# Fix, commit, and push immediately
git add .
git commit -m "style: address review feedback - fix naming conventions"
git push
```

### Complex Changes

For significant changes requested:

1. Create a sub-task/checklist
2. Implement each change
3. Test thoroughly
4. Commit with detailed message
5. Request re-review

```bash
git commit -m "refactor(auth): restructure token validation per review

- Extracted validation logic to separate module
- Added comprehensive error handling
- Updated related tests

Addresses CodeRabbit review feedback"
```

### Disagreements

If you disagree with a suggestion:

1. **Don't ignore it** - always respond
2. **Explain your reasoning** clearly
3. **Provide context** the bot may not have
4. **Offer alternatives** if applicable
5. **Escalate to human reviewer** if needed

```markdown
@coderabbitai I've considered this suggestion, but in this case we intentionally
use X because:
1. Reason one
2. Reason two

Would you like me to add a comment explaining this in the code?
```

---

## 7. Loop Completion Criteria

The review loop is complete when:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PR READY FOR HUMAN REVIEW CHECKLIST                                    │
│                                                                         │
│  ✓ All CodeRabbit comments resolved or dismissed with reason            │
│  ✓ All Gemini suggestions addressed                                     │
│  ✓ All Copilot feedback handled                                         │
│  ✓ SonarCloud shows no new issues                                       │
│  ✓ Coverage meets minimum thresholds                                    │
│  ✓ All CI checks pass                                                   │
│  ✓ No merge conflicts with base branch                                  │
│  ✓ Latest bot review shows no new comments                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Final Verification

```bash
# Ensure all checks pass
gh pr checks <pr-number>

# Verify no unresolved conversations
gh pr view <pr-number> --json reviewDecision,reviews,comments

# Confirm branch is up to date
git fetch origin main
git log origin/main..HEAD  # Should show your commits only
```

---

## 8. Agent Instructions

### For AI Agents Implementing This Workflow

When working on code changes, follow this exact process:

```
1. UNDERSTAND the task requirements fully
2. IMPLEMENT changes in logical, atomic units
3. TEST each change before committing
4. COMMIT with proper conventional commit messages
5. PUSH to feature branch
6. CREATE or UPDATE the PR
7. WAIT for bot reviews (CodeRabbit, Gemini, etc.)
8. FETCH all review comments
9. FOR EACH comment:
   a. Analyze the feedback
   b. Implement the fix
   c. Write appropriate tests if needed
   d. Commit with reference to the comment
10. PUSH all fixes
11. CHECK for new comments
12. IF new comments exist → GO TO step 8
13. IF no new comments → PR is ready for human review
14. NOTIFY user that the review loop is complete
```

### Key Commands for Agents

```bash
# Create PR
gh pr create --title "<type>(<scope>): <description>" --body "<body>"

# View PR comments
gh pr view <number> --comments

# Check PR status
gh pr checks <number>

# View specific review comments
gh api repos/{owner}/{repo}/pulls/<number>/comments

# Reply to a review comment
gh api repos/{owner}/{repo}/pulls/<number>/comments/<comment-id>/replies \
  -f body="Fixed in commit <sha>"

# Request re-review
gh pr review <number> --request-changes false
```

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| [references/COMMIT-PRACTICES.md](references/COMMIT-PRACTICES.md) | Advanced commit strategies and examples |
| [references/PR-TEMPLATES.md](references/PR-TEMPLATES.md) | PR description templates by change type |
| [references/BOT-COMMENTS.md](references/BOT-COMMENTS.md) | Detailed bot-specific handling guides |

---

## Enforcement Rules Summary

### MUST Requirements

- MUST make atomic commits (one logical change per commit)
- MUST use conventional commit message format
- MUST wait for all bot reviews before resolving
- MUST address EVERY review comment (fix or explain)
- MUST re-run the loop until no new comments appear
- MUST ensure all CI checks pass before marking ready
- MUST keep branch updated with base branch

### DO NOT Rules

- DO NOT ignore any bot comments
- DO NOT batch unrelated changes in single commits
- DO NOT push without running tests locally
- DO NOT mark PR ready while comments are unresolved
- DO NOT force push over teammate's changes
- DO NOT merge with failing CI checks
- DO NOT skip the review loop process
