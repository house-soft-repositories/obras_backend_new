# Cadastros de Localidades Tasks

**Design**: `.specs/features/cadastros_localidades/design.md`

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Tenant bootstrap and migration | integration | Creation, rollback and existing-schema upgrade | `test/modules/core/infra/` | `docker compose exec api pnpm run test:integration` |
| Domain | unit | Normalization and every validation branch | `test/modules/localidades/domain/` | `docker compose exec api pnpm run test -- test/modules/localidades/domain` |
| Application | unit | Role and tenant-context authorization plus update semantics | `test/modules/localidades/application/` | `docker compose exec api pnpm run test -- test/modules/localidades/application` |
| Repository | integration | Schema isolation, order and not-found mapping | `test/modules/localidades/infra/` | `docker compose exec api pnpm run test:integration` |
| HTTP | e2e | Create, list, update and all documented failures | `test/modules/localidades/controller/` | `docker compose exec api pnpm run test:e2e` |

## Gate Check Commands

| Gate Level | Command |
| --- | --- |
| Quick | `docker compose exec api pnpm run test -- <task test path>` |
| Full | `docker compose exec api pnpm run test && docker compose exec api pnpm run test:e2e && docker compose exec api pnpm run test:integration` |
| Build | `docker compose exec api pnpm run build && docker compose exec api pnpm run lint && docker compose exec api pnpm run test` |

## Execution Plan

### Phase 1: Tenant schema foundation

```
T1
```

### Phase 2: Locality domain and persistence

```
T2
```

### Phase 3: Application and HTTP API

```
T3 → T4
```

## Task Breakdown

### Phase 1: Tenant schema foundation

#### T1: Bootstrap localidades in tenant schemas

**What**: Create `localidades` for newly provisioned tenancies and upgrade existing tenant schemas idempotently.
**Where**: `src/core/multitenancy/`, `src/core/database/migrations/`, `src/modules/tenancy/`, integration tests
**Depends on**: None
**Requirement**: LOC-04
**Tests**: integration
**Gate**: Full
**Status**: Complete

### Phase 2: Locality domain and persistence

#### T2: Implement locality entity, mapper and tenant repository

**What**: Add the rich locality entity, mapper/model and schema-qualified repository for creation, ordered listing, lookup and update.
**Where**: `src/modules/localidades/domain/`, `src/modules/localidades/infra/`, repository tests
**Depends on**: T1
**Requirement**: LOC-01, LOC-02, LOC-03
**Tests**: unit, integration
**Gate**: Full
**Status**: Complete

### Phase 3: Application and HTTP API

#### T3: Implement locality use cases and authorization

**What**: Authorize `ADMIN` writes and tenant-user reads, deriving all scope from verified request context.
**Where**: `src/modules/localidades/application/`, `src/modules/localidades/domain/usecase/`, unit tests
**Depends on**: T2
**Requirement**: LOC-01, LOC-02, LOC-03
**Tests**: unit
**Gate**: Quick
**Status**: Complete

#### T4: Expose validated locality endpoints

**What**: Add DTOs, symbol/useFactory module wiring and guarded `/api/localidades` create, list and update endpoints.
**Where**: `src/modules/localidades/`, `src/app.module.ts`, e2e tests
**Depends on**: T3
**Requirement**: LOC-01, LOC-02, LOC-03
**Tests**: e2e
**Gate**: Full
**Status**: Complete

## Phase Execution Map

```
Phase 1: T1
Phase 2: T1 → T2
Phase 3: T2 → T3 → T4
```
