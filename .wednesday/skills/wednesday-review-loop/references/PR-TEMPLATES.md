# Pull Request Templates

This document provides PR description templates for different types of changes. Use these templates to create clear, informative PRs that are easy to review.

---

## 1. Feature PR Template

```markdown
## Summary

Brief description of the feature being added.

## Motivation

Why is this feature needed? Link to relevant discussions, user requests, or business requirements.

## Changes

### Added
- New endpoint `POST /api/users/verify`
- Email verification component
- Verification email template

### Modified
- User model to include `verified` field
- Auth middleware to check verification status

### Removed
- Legacy verification logic (deprecated)

## Implementation Details

<!-- Technical details for reviewers -->

The verification flow works as follows:
1. User signs up and receives email with token
2. Token is JWT with 24h expiry
3. Clicking link calls verify endpoint
4. User record updated, session refreshed

## Testing

### Unit Tests
- [ ] `UserService.sendVerificationEmail` - Added
- [ ] `UserService.verifyEmail` - Added
- [ ] `AuthMiddleware.requireVerified` - Added

### Integration Tests
- [ ] Email sending with test SMTP server
- [ ] Full verification flow E2E

### Manual Testing
- [ ] Verified email sends correctly
- [ ] Verified link works and redirects
- [ ] Verified expired link shows error
- [ ] Verified already-verified user shows message

## Screenshots

<!-- For UI changes, include before/after screenshots -->

| Before | After |
|--------|-------|
| ![before](url) | ![after](url) |

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Feature flag added (if applicable)
- [ ] Migration script included (if applicable)

## Related Issues

Closes #123
Refs #456, #789
```

---

## 2. Bug Fix PR Template

```markdown
## Bug Description

Clear description of the bug being fixed.

**Reported in:** #123 / Support ticket / User report
**Severity:** Critical / High / Medium / Low
**Affected versions:** v1.2.0 - v1.4.2

## Root Cause

Explain what was causing the bug.

The discount calculation was using integer division instead of float division,
causing discounts to be truncated. For example, a 15% discount on $100 was
calculated as $0 instead of $15.

## Solution

Explain how the fix works.

Changed division operator and added explicit float casting to ensure proper
decimal handling. Added regression tests to prevent recurrence.

## Changes

- `src/cart/calculator.ts` - Fixed discount calculation
- `src/cart/calculator.test.ts` - Added regression tests

## Testing

### Regression Test Added
```typescript
it('should calculate percentage discount correctly', () => {
  expect(calculateDiscount(100, 15)).toBe(15);
  expect(calculateDiscount(99, 10)).toBe(9.9);
});
```

### Manual Testing
- [ ] Reproduced original bug on main branch
- [ ] Verified fix resolves the issue
- [ ] Tested edge cases (0%, 100%, decimal amounts)
- [ ] Verified no regression in related functionality

## Impact Assessment

- **User Impact:** Users will now see correct discount amounts
- **Data Impact:** No data migration needed
- **Rollback Plan:** Revert this PR if issues arise

## Checklist

- [ ] Root cause identified and documented
- [ ] Fix addresses root cause (not just symptoms)
- [ ] Regression test added
- [ ] Tested on affected versions/environments
- [ ] No new warnings introduced

## Related Issues

Fixes #123
```

---

## 3. Refactoring PR Template

```markdown
## Summary

Brief description of the refactoring performed.

## Motivation

Why is this refactoring needed?

- Code complexity has grown, making changes difficult
- Duplicate logic across multiple files
- Performance issues identified
- Preparing for upcoming feature work

## Scope

### What Changed
- Extracted common validation logic to `ValidationService`
- Consolidated date utilities into `DateUtils` module
- Renamed `processData` to `transformUserInput` for clarity

### What Did NOT Change
- No business logic changes
- No API contract changes
- No database schema changes
- No user-facing changes

## Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `src/utils/validation.ts` | Added | New validation utilities |
| `src/services/user.ts` | Modified | Uses new ValidationService |
| `src/services/order.ts` | Modified | Uses new ValidationService |
| `src/helpers/validate.ts` | Deleted | Replaced by ValidationService |

## Testing Strategy

### Existing Tests
All existing tests should pass without modification, proving behavior is unchanged.

```bash
npm test -- --coverage
# Coverage: 94% (unchanged from before)
```

### New Tests
- [ ] Added tests for extracted `ValidationService`
- [ ] Added tests for `DateUtils` module

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing behavior | Low | All tests passing |
| Performance regression | Low | Benchmarked critical paths |
| Merge conflicts | Medium | Coordinated with team |

## Checklist

- [ ] All existing tests pass
- [ ] No business logic changes
- [ ] Performance benchmarks unchanged
- [ ] Documentation updated
- [ ] Team notified of structural changes

## Notes for Reviewers

Please focus on:
1. Are the new abstractions at the right level?
2. Is the naming clear and consistent?
3. Any patterns I might have missed?
```

---

## 4. Documentation PR Template

```markdown
## Summary

Brief description of documentation changes.

## Type of Documentation

- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
- [ ] README updates
- [ ] Code comments
- [ ] Architecture docs

## Changes

### Added
- API endpoint documentation for `/api/v2/users`
- Setup guide for local development
- Troubleshooting section

### Updated
- Installation instructions for new dependencies
- Configuration options table
- Screenshots for new UI

### Removed
- Deprecated API endpoint docs
- Outdated setup instructions

## Preview

<!-- For web docs, include preview link or screenshots -->

[Preview Link](https://deploy-preview-123.netlify.app/)

## Checklist

- [ ] Spelling and grammar checked
- [ ] Links verified working
- [ ] Code examples tested
- [ ] Screenshots up to date
- [ ] Consistent formatting
- [ ] Table of contents updated (if applicable)
```

---

## 5. Dependency Update PR Template

```markdown
## Summary

Update [package-name] from v1.2.3 to v2.0.0

## Motivation

- [ ] Security vulnerability fix
- [ ] Bug fix needed
- [ ] New features required
- [ ] Routine maintenance
- [ ] Deprecation of current version

## Changes

### Updated Dependencies
| Package | From | To | Type |
|---------|------|----|----- |
| axios | 0.21.1 | 1.6.0 | Major |
| lodash | 4.17.20 | 4.17.21 | Patch |

### Breaking Changes

List any breaking changes from the update:

1. `axios.defaults.baseURL` is now required
2. Response interceptors signature changed

### Code Changes Required

- Updated API client initialization
- Fixed response interceptor types

## Testing

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Manual smoke testing completed
- [ ] No console errors/warnings

## Rollback Plan

If issues arise:
1. Revert this PR
2. Run `npm ci` to restore previous versions
3. Verify application works

## Checklist

- [ ] Changelog reviewed for breaking changes
- [ ] Migration guide followed (if applicable)
- [ ] No security vulnerabilities introduced
- [ ] Lock file updated
- [ ] Build succeeds
- [ ] All tests pass
```

---

## 6. Hotfix PR Template

```markdown
## HOTFIX: [Brief Description]

**Severity:** Critical
**Production Impact:** Yes
**Affected Users:** All / Subset

## Issue

Clear description of the production issue.

**Error:** `TypeError: Cannot read property 'x' of undefined`
**Frequency:** 100+ errors/minute
**First Detected:** 2024-01-15 14:30 UTC

## Root Cause

Brief explanation of what caused the issue.

Deployment at 14:00 UTC introduced null check regression in user lookup.

## Fix

What this hotfix does.

Added null check before accessing user properties. Matches logic from pre-regression version.

## Changes

Minimal changes only:
- `src/services/user.ts:45` - Added null check

## Testing

- [ ] Fix verified in staging
- [ ] Regression test added
- [ ] Smoke test passed

## Deployment Notes

- [ ] No migration required
- [ ] No config changes required
- [ ] Cache clear required: No
- [ ] Service restart required: Yes

## Post-Deployment

- [ ] Monitor error rates
- [ ] Verify fix in production logs
- [ ] Update status page
- [ ] Notify affected users (if applicable)

## Follow-up

- [ ] Create ticket for proper fix: #XXX
- [ ] Schedule post-mortem
- [ ] Update runbook

---
**Approved by:** @oncall-lead
**Deploy window:** ASAP
```

---

## 7. Performance PR Template

```markdown
## Summary

Performance improvement for [component/feature].

## Metrics

### Before
| Metric | Value |
|--------|-------|
| API Response Time (p95) | 450ms |
| Memory Usage | 512MB |
| Database Queries | 15 |

### After
| Metric | Value | Improvement |
|--------|-------|-------------|
| API Response Time (p95) | 120ms | 73% faster |
| Memory Usage | 384MB | 25% reduction |
| Database Queries | 3 | 80% reduction |

## Changes

### Optimizations Applied
1. Added database index on `users.email`
2. Implemented query batching for related data
3. Added Redis caching for frequently accessed data
4. Lazy loading for non-critical components

### Code Changes
- `src/db/migrations/add_email_index.sql` - New index
- `src/services/user.ts` - Query optimization
- `src/cache/user.ts` - New caching layer

## Testing

### Load Testing Results
```
Requests: 10,000
Concurrency: 100
Duration: 60s

Before: 45 req/s, 2.3% errors
After: 180 req/s, 0.1% errors
```

### Profiling
![Flame graph comparison](url)

## Rollback Plan

Performance changes can be rolled back by:
1. Reverting this PR
2. Cache will self-invalidate

## Checklist

- [ ] Benchmarks run on production-like data
- [ ] No functionality changes
- [ ] All existing tests pass
- [ ] Memory profiling shows no leaks
- [ ] Documentation updated
```

---

## 8. Database Migration PR Template

```markdown
## Summary

Database migration for [description].

## Migration Type

- [ ] Schema change (DDL)
- [ ] Data migration (DML)
- [ ] Both

## Changes

### New Tables
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  theme VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Tables
```sql
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
```

### Indexes
```sql
CREATE INDEX idx_users_last_login ON users(last_login_at);
```

## Rollback Script

```sql
DROP TABLE IF EXISTS user_preferences;
ALTER TABLE users DROP COLUMN IF EXISTS last_login_at;
```

## Testing

- [ ] Migration tested on copy of production data
- [ ] Rollback script tested
- [ ] Application works with new schema
- [ ] Performance impact assessed

## Deployment Notes

**Estimated Duration:** 5 minutes
**Downtime Required:** No (online migration)
**Deployment Order:**
1. Run migration
2. Deploy application code
3. Verify functionality

## Checklist

- [ ] Migration is idempotent
- [ ] Rollback script verified
- [ ] Indexes added for new queries
- [ ] Data backfilled (if applicable)
- [ ] Team notified of schema change
```

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PR DESCRIPTION ESSENTIALS                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Every PR should answer:                                                │
│                                                                         │
│  1. WHAT?     - Summary of changes                                     │
│  2. WHY?      - Motivation / problem being solved                      │
│  3. HOW?      - Implementation approach                                │
│  4. TESTING?  - How it was verified                                    │
│  5. RISKS?    - Potential issues / rollback plan                       │
│                                                                         │
│  Size Guidelines:                                                       │
│  - Small (< 100 lines): Quick merge expected                           │
│  - Medium (100-500 lines): Standard review                             │
│  - Large (> 500 lines): Consider splitting                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
