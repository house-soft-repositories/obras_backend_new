# Cadastros de Orgaos e Setores Tasks

## Execution Protocol

Implement these tasks with the `tlc-spec-driven` skill and follow its Execute flow. Local commits require explicit user authorization in this repository.

**Design**: `.specs/features/cadastros_orgaos_setores/design.md`
**Status**: Approved

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: `AGENTS.md`, `package.json`, existing tests under `test/modules/localidades/`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Tenant bootstrap and migration | integration | Orgao/setor table creation for new and existing schemas | `test/modules/core/infra/`, `test/modules/tenancy/infra/` | `docker compose exec api pnpm run test:integration` |
| Domain | unit | Normalization and every validation branch for orgao and setor | `test/modules/orgaos/domain/` | `docker compose exec api pnpm run test -- test/modules/orgaos/domain` |
| Application | unit | Role authorization, parent validation and update semantics | `test/modules/orgaos/application/` | `docker compose exec api pnpm run test -- test/modules/orgaos/application` |
| Repository | integration | Schema isolation, parent FK behavior, ordering and not-found mapping | `test/modules/orgaos/infra/` | `docker compose exec api pnpm run test:integration` |
| HTTP | e2e | Create, list, update and documented failures for orgaos and setores | `test/modules/orgaos/controller/` | `docker compose exec api pnpm run test:e2e` |

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

### Phase 2: Domain and persistence

```
T2
```

### Phase 3: Application and HTTP API

```
T3 -> T4
```

## Task Breakdown

### Phase 1: Tenant schema foundation

#### T1: Confirm orgao and setor tenant tables

**What**: Treat `orgaos` and `setores` as part of tenant identity schema provisioning and verify table creation remains covered.
**Where**: `src/core/multitenancy/`, `src/core/database/migrations/`, integration tests
**Depends on**: None
**Reuses**: `.specs/features/cadastros_localidades/tasks.md` T1
**Requirement**: ORG-03, SET-03
**Done when**:
- [x] New tenant schemas contain `orgaos` and `setores`.
- [x] Existing-schema migration creates `orgaos` and `setores`.
- [x] No duplicate migration is added for already-covered schema work.
**Tests**: integration
**Gate**: Full
**Status**: Complete

### Phase 2: Domain and persistence

#### T2: Implement orgao and setor entities, mappers and repositories

**What**: Add rich entities, mappers/models and schema-qualified repositories for create/list/find/update of orgaos and setores.
**Where**: `src/modules/orgaos/domain/`, `src/modules/orgaos/infra/`, repository tests
**Depends on**: T1
**Reuses**: `src/modules/localidades/`
**Requirement**: ORG-01, ORG-02, SET-01, SET-02
**Done when**:
- [x] Orgao validates `nome`, `localidadeId`, `tipo`, `email` and default active state.
- [x] Setor validates `nome`, `orgaoId` and default active state.
- [x] Repositories use the verified schema and map missing foreign records to registered 404 codes.
- [x] Lists return records ordered by `nome ASC`.
- [x] Foreign-tenant IDs are not exposed or mutated.
**Tests**: unit, integration
**Gate**: Full
**Status**: Complete

### Phase 3: Application and HTTP API

#### T3: Implement orgao and setor use cases and authorization

**What**: Add create/list/update use cases with `ADMIN` orgao writes, `ADMIN`/`STAFF` setor writes, tenant-user reads and parent lookup checks.
**Where**: `src/modules/orgaos/application/`, `src/modules/orgaos/domain/usecase/`, unit tests
**Depends on**: T2
**Reuses**: `src/modules/localidades/application/`
**Requirement**: ORG-01, ORG-02, SET-01, SET-02
**Done when**:
- [x] Orgao writes allow `ADMIN` only.
- [x] Setor writes allow `ADMIN` and `STAFF`.
- [x] Reads allow `ADMIN`, `STAFF` and `USER`.
- [x] Parent localidade/orgao absence returns registered 404 before persistence.
- [x] Update applies only supplied mutable fields including `ativo`.
**Tests**: unit
**Gate**: Quick
**Status**: Complete

#### T4: Expose validated orgao and setor endpoints

**What**: Add DTOs, symbol/useFactory module wiring and guarded `/api/orgaos` plus `/api/orgaos/:orgaoId/setores` endpoints.
**Where**: `src/modules/orgaos/`, `src/app.module.ts`, e2e tests
**Depends on**: T3
**Reuses**: `src/modules/localidades/controller/`
**Requirement**: ORG-01, ORG-02, SET-01, SET-02
**Done when**:
- [x] DTOs validate and transform every accepted field.
- [x] Unknown fields return HTTP 400 through the global validation pipe.
- [x] Missing tenant context returns HTTP 401 before use cases run.
- [x] Unauthorized callers return HTTP 403 before persistence.
- [x] Foreign-tenant identifiers return HTTP 404.
**Tests**: e2e
**Gate**: Full
**Status**: Complete

## Phase Execution Map

```
Phase 1: T1
Phase 2: T1 -> T2
Phase 3: T2 -> T3 -> T4
```

## Validation Tables

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | Phase 1: T1 | OK |
| T2 | T1 | Phase 2: T1 -> T2 | OK |
| T3 | T2 | Phase 3: T2 -> T3 -> T4 | OK |
| T4 | T3 | Phase 3: T2 -> T3 -> T4 | OK |

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Tenant bootstrap and migration | integration | integration | OK |
| T2 | Domain, repository | unit, integration | unit, integration | OK |
| T3 | Application | unit | unit | OK |
| T4 | HTTP | e2e | e2e | OK |
