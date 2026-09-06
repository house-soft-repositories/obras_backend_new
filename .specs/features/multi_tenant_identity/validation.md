# Multi-tenant Identity Foundation Validation

**Date**: 2026-09-04  
**Spec**: `.specs/features/multi_tenant_identity/spec.md`  
**Diff range**: `bfad8fa..working tree`  
**Verifier**: independent sub-agent (author != verifier)

---

**Verdict**: PASS
**Result**: PASS

All executable Docker gates pass and the P0 discrimination sensor killed five of
five behavior mutations. The migration integration test now asserts the exact
required tenancy and user column sets. The feature satisfies the specification.

## Task Completion

| Task | Status | Notes |
| --- | --- | --- |
| T1-T10 | ✅ Marked complete | `tasks.md` records every task as Complete. Evidence below independently validates the outcomes. |

## Spec-Anchored Acceptance Criteria

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| Persist AC1 | Three UUID public tables and reversible down | `test/modules/core/infra/migrations/identity_foundation.migration.spec.ts:89-93,253-259` checks exact table set and zero remaining tables | ✅ PASS |
| Persist AC2 | Every tenancy field plus unique slug/schema | `...identity_foundation.migration.spec.ts:145-158` asserts the exact tenancy column set; `:181-190` checks both uniqueness constraints | ✅ PASS |
| Persist AC3 | Every user field plus tenant/platform e-mail uniqueness | `...identity_foundation.migration.spec.ts:160-173` asserts the exact user column set; `:208-241` checks both e-mail indexes and duplicate behavior | ✅ PASS |
| Persist AC4 | SUPERADMIN persists null tenant | `...identity_foundation.migration.spec.ts:187-201` asserts database check failures for incompatible role/tenant assignments | ✅ PASS |
| Persist AC5 | Tenant roles persist valid tenancy FK | `...identity_foundation.migration.spec.ts:243-248` expects PostgreSQL FK error `23503` | ✅ PASS |
| Persist AC6 | Session stores hash, expiry and revocation state | `...identity_foundation.migration.spec.ts:114-127,131-143`; `test/modules/auth/application/login.service.spec.ts:79-81` | ✅ PASS |
| Provision AC1 | SUPERADMIN may create tenancy | `test/modules/tenancy/application/create_tenancy.service.spec.ts:15-21` | ✅ PASS |
| Provision AC2 | SUPERADMIN may select another tenancy | `test/modules/users/application/create_user.service.spec.ts:67-76`; `test/identity.e2e-spec.ts:270-291` | ✅ PASS |
| Provision AC3 | ADMIN may create in verified tenant | `test/identity.e2e-spec.ts:218-243` asserts authenticated creator claim sent to use case | ✅ PASS |
| Provision AC4 | ADMIN permits only USER/STAFF | `test/identity.e2e-spec.ts:172-191` rejects ADMIN role before use case; `src/modules/users/domain/usecase/create_user.usecase.ts:10-13` restricts the request type | ✅ PASS |
| Provision AC5 | Forbidden/unauthenticated requests reject before persistence | `test/modules/users/application/create_user.service.spec.ts:47-51,88-92`; `test/identity.e2e-spec.ts:117-129,294-300` | ✅ PASS |
| Provision AC6 | ADMIN scope derives from verified claim | `test/modules/users/application/create_user.service.spec.ts:29-51`; `test/identity.e2e-spec.ts:235-243` | ✅ PASS |
| Domain AC1 | Dedicated superadmin factory and null tenant | `test/modules/users/domain/entities/user.entity.spec.ts:8-15` | ✅ PASS |
| Domain AC2 | Dedicated tenant-role factories require valid tenant | `...user.entity.spec.ts:18-49` | ✅ PASS |
| Domain AC3 | Invalid name/email/password/tenant fail with domain exception | `...user.entity.spec.ts:39-84` | ✅ PASS |
| Domain AC4 | Factories generate UUID/timestamps; reconstitution bypasses validation | `...user.entity.spec.ts:13-15,87-100` | ✅ PASS |
| Auth AC1 | bcrypt uses configured validated SALT | `test/modules/auth/infra/password/bcrypt_password_hasher.spec.ts:9-15` checks exact 10-round hash | ✅ PASS |
| Auth AC2 | Valid credentials yield signed 1h/7d pair | `test/modules/auth/infra/token/jwt_token.service.spec.ts:28-35,53-60`; `test/modules/auth/application/login.service.spec.ts:79-92` | ✅ PASS |
| Auth AC3 | Exact typed claims and no sensitive claims | `...jwt_token.service.spec.ts:19-27,45-52` | ✅ PASS |
| Auth AC4 | Refresh checks session, revokes predecessor, issues pair | `test/modules/auth/application/refresh_token.service.spec.ts:37-48`; `test/modules/auth/infra/repositories/user_session.repository.spec.ts:38-70` | ✅ PASS |
| Auth AC5 | Bad refresh variants issue no pair | `...refresh_token.service.spec.ts:51-99` | ✅ PASS |
| Auth AC6 | Invalid credentials are generic unauthorized | `test/modules/auth/application/login.service.spec.ts:23-34,46-56` | ✅ PASS |
| Auth AC7 | Verified tenant access establishes resolved context | `test/modules/core/multitenancy/verified_tenant_context.service.spec.ts:26-33` | ✅ PASS |
| Auth AC8 | Verified superadmin has no context | `...verified_tenant_context.service.spec.ts:48-51` | ✅ PASS |
| Auth AC9 | Invalid/tenantless access denied before tenant work | `...verified_tenant_context.service.spec.ts:83-90` | ✅ PASS |
| Schema AC1 | Generated schema is provisioned | `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:41-65` | ✅ PASS |
| Schema AC2 | Schema/persistence failures leave no dangling tenancy/schema | `...tenancy.repository.spec.ts:77-84,94-101,119-126` | ✅ PASS |
| Schema AC3 | Tenant data uses resolved schema; identities remain public | `...tenancy.repository.spec.ts:46-60`; `test/modules/core/infra/migrations/identity_foundation.migration.spec.ts:43-48` | ✅ PASS |
| Fixtures AC1-AC3 | Fixtures are module/layer-owned and resolvable | `test/modules/core/fixtures/identity_fixture_ownership.spec.ts:5-15`; imports in `test/identity.e2e-spec.ts:21-27` | ✅ PASS |

**Status**: ✅ 31/31 exact AC outcomes verified.

## Edge Cases

- [x] Duplicate tenancy slug and persistence failure rollback: `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:87-131`.
- [x] Same e-mail across tenants, duplicate tenant/platform e-mail, and invalid tenant FK: `test/modules/core/infra/migrations/identity_foundation.migration.spec.ts:211-248`.
- [x] Tenantless non-superadmin is denied before resolver/callback work: `test/modules/core/multitenancy/verified_tenant_context.service.spec.ts:83-90`.
- [x] Invalid SALT / absent JWT secret configuration: `test/modules/core/config/environment.validation.spec.ts:25-39`.
- [x] Cross-token access boundary: `test/modules/auth/infra/token/jwt_token.service.spec.ts:62-85`.

## Discrimination Sensor

Each mutation ran in a fresh disposable `/tmp/mti_reverify_m*` Git worktree populated
with the current test tree. The worktree was removed after each run. The real
tree's porcelain was never modified by the sensor. Unrelated concurrent edits
appeared while it ran and were preserved.

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M1 | `src/modules/auth/infra/token/jwt_token.service.ts:26` | Removed access token `type` check | ✅ `jwt_token.service.spec.ts:73-85` failed |
| M2 | `src/core/multitenancy/verified_tenant_context.service.ts:18` | Disabled tenantless non-superadmin rejection | ✅ `verified_tenant_context.service.spec.ts:83-90` failed |
| M3 | `src/modules/users/application/create_user.service.ts:69-70` | Trusted ADMIN caller-selected tenant | ✅ `create_user.service.spec.ts:47-51` failed |
| M4 | `src/modules/auth/infra/password/bcrypt_password_hasher.ts:8` | Changed SALT rounds from configured value to value + 1 | ✅ `bcrypt_password_hasher.spec.ts:12` failed |
| M5 | `src/modules/auth/application/refresh_token.service.ts:39-40` | Removed predecessor-session revocation | ✅ `refresh_token.service.spec.ts:40-42` failed |

**Sensor depth**: P0-full manual (5 mutations)  
**Result**: ✅ 5/5 killed.

## Gate Check

- **Commands**: `docker compose exec api pnpm run build && docker compose exec api pnpm run lint && docker compose exec api pnpm run test && docker compose exec api pnpm run test:e2e`; `docker compose exec api pnpm exec jest --config test/jest-integration.json`.
- **Result**: build ✅; lint ✅; unit ✅ 57/57 (15 suites); e2e ✅ 11/11 (2 suites); integration ✅ 15/15 (7 suites); no skipped tests reported.
- **Note**: this checkout exposes service `api` rather than the stale `nest-dev` name in `tasks.md`; the commands used the active Docker service.

## Code Quality

| Principle | Status |
| --- | --- |
| Surgical changes / no unrelated cleanup | ✅ Feature diff and tests are focused on identity boundaries |
| Matches repository patterns | ✅ Symbols/useFactory, typed mocks, Docker gates and DDD layers followed |
| Per-layer coverage | ✅ Domain, application, HTTP, repository and migration outcomes are covered |
| Spec-anchored asserted outcomes | ✅ All 31 criteria have exact asserted outcomes |
| Fixture ownership | ✅ `test/modules/core/fixtures/identity_fixture_ownership.spec.ts:5-15` |

## Ranked Gaps

None.

## Requirement Traceability

| Requirement | Verifier status |
| --- | --- |
| MTI-01 | ✅ Verified |
| MTI-02 | ✅ Verified |
| MTI-03 | ✅ Verified |
| MTI-04 | ✅ Verified |
| MTI-05 | ✅ Verified |
| MTI-06 | ✅ Verified |
| MTI-07 | ✅ Verified |
