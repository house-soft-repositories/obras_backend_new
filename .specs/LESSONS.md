# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Token-type tests must use structurally valid cross-type payloads so claim-shape validation cannot mask type enforcement.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `auth` · harmful: 0
- features: multi_tenant_identity
- evidence: src/modules/auth/infra/token/jwt_token.service.ts:26 (M1) (auth)
- last seen: 2026-09-04T11:02:40Z

### L-002 - Authorization branch tests must configure downstream dependencies to succeed so the asserted guard condition is the only rejection cause.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `multitenancy` · harmful: 0
- features: multi_tenant_identity
- evidence: src/core/multitenancy/verified_tenant_context.service.ts:18 (M2) (multitenancy)
- last seen: 2026-09-04T11:02:40Z

### L-003 - Security configuration tests must assert the exact configured parameter reaches the cryptographic operation.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `auth` · harmful: 0
- features: multi_tenant_identity
- evidence: src/modules/auth/infra/password/bcrypt_password_hasher.ts:8 (M5) (auth)
- last seen: 2026-09-04T11:02:40Z

### L-004 - When a dependency ships as ESM, keep the e2e Jest transform and module-loading configuration executable before relying on route coverage.
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `test` · harmful: 0
- features: multi_tenant_identity
- evidence: test/app.e2e-spec.ts:5 (test)
- last seen: 2026-09-04T11:02:40Z

### L-005 - Migration integration tests must assert the complete specified column set, not a representative subset.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `database migrations` · harmful: 0
- features: multi_tenant_identity
- evidence: test/modules/core/infra/migrations/identity_foundation.migration.spec.ts:94-128 (database migrations)
- last seen: 2026-09-04T12:22:47Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
