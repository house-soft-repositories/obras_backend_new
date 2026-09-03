# Multi-tenant Identity Foundation Tasks

**Design**: `.specs/features/multi_tenant_identity/design.md`  
**Status**: Draft

## Test Coverage Matrix

> Generated from `AGENTS.md`, `docs/architecture.md`, `package.json`, `test/jest-e2e.json`, and the existing Jest specs. New domain and application tests follow the documented direct-instantiation convention; the existing Nest testing examples remain legacy-only.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Test configuration | unit | Test discovery covers the documented `test/modules` tree | `test/**/*.spec.ts` | `docker compose exec nest-dev pnpm run test` |
| Domain entities | unit | Every role/tenant and tenant-field validation branch | `test/modules/<module>/domain/**/*.spec.ts` | `docker compose exec nest-dev pnpm run test -- test/modules/<module>/domain` |
| Application services | unit | 1:1 with applicable ACs and every listed edge case | `test/modules/<module>/application/**/*.spec.ts` | `docker compose exec nest-dev pnpm run test -- test/modules/<module>/application` |
| Repositories and migration | integration | Schema constraints, provisioning rollback, and repository error mapping | `test/modules/<module>/infra/**/*.spec.ts` | `docker compose exec nest-dev pnpm run test -- test/modules/<module>/infra` |
| Auth HTTP boundary | e2e | Login, refresh, provisioning, and every authorization failure path | `test/modules/auth/controller/**/*.e2e-spec.ts` | `docker compose exec nest-dev pnpm run test:e2e` |
| Configuration and module wiring | build | Valid startup configuration and dependency wiring | `src/**/*.ts` | `docker compose exec nest-dev pnpm run build` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Domain or application unit task | `docker compose exec nest-dev pnpm run test -- <task test path>` |
| Full | Repository, migration, or HTTP task | `docker compose exec nest-dev pnpm run test && docker compose exec nest-dev pnpm run test:e2e` |
| Build | Phase end or configuration/module task | `docker compose exec nest-dev pnpm run build && docker compose exec nest-dev pnpm run lint && docker compose exec nest-dev pnpm run test` |

## Execution Plan

### Phase 1: Shared foundation and persistence

```
T1 → T2 → T3
```

### Phase 2: Tenancy and user provisioning

```
T4 → T6
T5 → T6
```

### Phase 3: Authentication and trusted context

```
T7 → T8
T7 → T9
```

### Phase 4: HTTP composition

```
T10
```

## Task Breakdown

### Phase 1: Shared foundation and persistence

#### T1: Align test discovery with the project test tree

**What**: Configure Jest so documented module tests under `test/modules/` run with the existing aliases.
**Where**: `package.json`
**Depends on**: None
**Reuses**: `test/jest-e2e.json`
**Requirement**: MTI-06
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Unit-test discovery includes `test/modules`; the existing unit test still runs; no test uses `@nestjs/testing` for new domain/application coverage.
**Tests**: unit
**Gate**: build
**Commit**: `test(identity): configure module test discovery`
**Status**: Complete

#### T2: Add identity dependencies and validated security configuration

**What**: Add the supported bcrypt and JWT dependencies and validate a safe bcrypt cost plus `JWT_SECRET` at startup.
**Where**: `src/core/config/enviroment.ts`
**Depends on**: T1
**Reuses**: `src/core/config/enviroment.validation.ts`
**Requirement**: MTI-04
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Missing secret, non-numeric salt, and unsafe salt fail validation; accepted salt reaches the hasher configuration; production dependencies are declared.
**Tests**: unit
**Gate**: build
**Commit**: `feat(auth): validate token and password configuration`
**Status**: Complete

#### T3: Create public identity models and reversible migration

**What**: Add public tenancy, user, and refresh-session persistence models and their reversible TypeORM migration with scoped uniqueness and role checks.
**Where**: `src/core/database/migrations/`
**Depends on**: T2
**Reuses**: `src/core/database/data-source.ts`
**Requirement**: MTI-01, MTI-02
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Migration creates and reverts all three public tables; tenant slug/schema and scoped e-mail constraints are present; role/tenant database invariant is enforced.
**Tests**: integration
**Gate**: full
**Commit**: `feat(database): add identity schema migration`
**Status**: Complete

### Phase 2: Tenancy and user provisioning

#### T4: Implement the tenancy domain and schema provisioning service

**What**: Implement tenancy creation with legacy fields, generated safe schema names, duplicate handling, and rollback-safe schema provisioning.
**Where**: `src/modules/tenancy/`
**Depends on**: T3
**Reuses**: `src/core/database/data-source.ts`
**Requirement**: MTI-01, MTI-05
**Tools**: MCP: NONE; Skill: NONE
**Done when**: A tenancy starts active with valid slug and optional CNPJ; generated schema names cannot be caller supplied; failed provisioning leaves no persisted tenancy pointing at a missing schema.
**Tests**: integration
**Gate**: full
**Commit**: `feat(tenancy): provision isolated tenant schemas`
**Status**: Complete

#### T5: Implement user role factories and scoped persistence

**What**: Implement rich user factories, mapper, repository, and fixture ownership for tenant-aware identities.
**Where**: `src/modules/users/`
**Depends on**: T3
**Reuses**: `docs/architecture.md`
**Requirement**: MTI-02, MTI-03, MTI-06
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Superadmin has null tenant; admin/staff/user require tenant; invalid fields and incompatible assignments raise domain exceptions; reconstitution does not rerun creation validation.
**Tests**: unit
**Gate**: quick
**Commit**: `feat(users): add tenant-aware user domain`
**Status**: Complete

#### T6: Authorize tenancy and user provisioning use cases

**What**: Create use cases that restrict tenancy creation to superadmins and user creation to the verified creator scope.
**Where**: `src/modules/users/application/`
**Depends on**: T4, T5
**Reuses**: `src/modules/users/domain/`
**Requirement**: MTI-07
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Superadmin can target any tenancy; admin can create only USER or STAFF in its JWT tenancy; rejected combinations do not persist records; caller-supplied scope is not trusted.
**Tests**: unit
**Gate**: build
**Commit**: `feat(users): enforce provisioning scope`
**Status**: Complete

### Phase 3: Authentication and trusted context

#### T7: Implement password and typed JWT infrastructure adapters

**What**: Add bcrypt hashing/comparison and typed access/refresh JWT generation and verification adapters.
**Where**: `src/modules/auth/infra/`
**Depends on**: T2, T5
**Reuses**: `src/core/services/configuration.service.ts`
**Requirement**: MTI-04
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Passwords are bcrypt-hashed with configured cost; access tokens contain only the specified access claims and one-hour expiry; refresh tokens contain only specified refresh claims and seven-day expiry.
**Tests**: unit
**Gate**: quick
**Commit**: `feat(auth): add password and token adapters`
**Status**: Complete

#### T8: Implement credential login and refresh rotation

**What**: Add authentication and refresh-session services with generic credential failures and hashed, revocable refresh sessions.
**Where**: `src/modules/auth/application/`
**Depends on**: T5, T7
**Reuses**: `src/modules/users/adapters/`
**Requirement**: MTI-04
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Valid credentials issue both token types; refresh rotation revokes the predecessor; malformed, expired, revoked, access-type, and hash-mismatched refresh input issues nothing; invalid credentials disclose no account existence.
**Tests**: unit
**Gate**: build
**Commit**: `feat(auth): add login and refresh rotation`
**Status**: Complete

#### T9: Establish trusted request tenant context

**What**: Add access-token validation and async tenant context resolution for tenant-bound work.
**Where**: `src/core/multitenancy/`
**Depends on**: T4, T7
**Reuses**: `src/core/core.module.ts`
**Requirement**: MTI-04
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Verified non-superadmin access tokens yield resolved tenant id/schema; superadmin yields no context; absent, wrong-type, malformed, or tenantless non-superadmin tokens are rejected before tenant work.
**Tests**: unit
**Gate**: build
**Commit**: `feat(tenancy): add verified request context`
**Status**: Complete

### Phase 4: HTTP composition

#### T10: Expose authenticated identity provisioning endpoints

**What**: Wire identity modules and expose login, refresh, tenant provisioning, and user provisioning endpoints through guarded controllers.
**Where**: `src/modules/auth/controller/`
**Depends on**: T6, T8, T9
**Reuses**: `src/app.module.ts`
**Requirement**: MTI-04, MTI-07
**Tools**: MCP: NONE; Skill: NONE
**Done when**: Login and refresh return the specified token pairs; protected provisioning accepts only verified allowed creators; all unauthorized combinations return before persistence; modules use Symbol plus `useFactory` dependency injection.
**Tests**: e2e
**Gate**: full
**Commit**: `feat(auth): expose identity provisioning api`
**Status**: Complete

## Phase Execution Map

```
Phase 1: T1 → T2 → T3
Phase 2: T4 → T6
         T5 → T6
Phase 3: T7 → T8
         T4 → T9
         T7 → T9
Phase 4: T6 → T10
         T8 → T10
         T9 → T10
```

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Test configuration | ✅ Granular |
| T2 | Security configuration and dependencies | ✅ Cohesive |
| T3 | Identity schema migration | ✅ Cohesive |
| T4 | Tenancy provisioning boundary | ✅ Cohesive |
| T5 | User domain/persistence boundary | ✅ Cohesive |
| T6 | Provisioning authorization use cases | ✅ Cohesive |
| T7 | Auth infrastructure adapters | ✅ Cohesive |
| T8 | Login and refresh application boundary | ✅ Cohesive |
| T9 | Trusted tenant-context boundary | ✅ Cohesive |
| T10 | Identity HTTP boundary | ✅ Cohesive |

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T2 | T2 → T3 | ✅ Match |
| T4 | T3 | phase order | ✅ Match |
| T5 | T3 | phase order | ✅ Match |
| T6 | T4, T5 | T4 → T6; T5 → T6 | ✅ Match |
| T7 | T2, T5 | phase order | ✅ Match |
| T8 | T5, T7 | T7 → T8 | ✅ Match |
| T9 | T4, T7 | T4 → T9; T7 → T9 | ✅ Match |
| T10 | T6, T8, T9 | T6 → T10; T8 → T10; T9 → T10 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Test configuration | unit | unit | ✅ OK |
| T2 | Configuration | unit/build | unit | ✅ OK |
| T3 | Migration/models | integration | integration | ✅ OK |
| T4 | Repository/application | integration | integration | ✅ OK |
| T5 | Domain/persistence | unit | unit | ✅ OK |
| T6 | Application | unit | unit | ✅ OK |
| T7 | Infrastructure adapter | unit | unit | ✅ OK |
| T8 | Application | unit | unit | ✅ OK |
| T9 | Context infrastructure | unit | unit | ✅ OK |
| T10 | Controller | e2e | e2e | ✅ OK |
