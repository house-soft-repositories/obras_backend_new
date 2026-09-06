# Vínculos Organizacionais de Usuários Tasks

**Design**: `.specs/features/usuarios_vinculos_organizacionais/design.md`
**Status**: Approved

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Migration/model | integration | User organizational columns are persisted and cleaned up | `test/modules/core/infra/`, `test/modules/users/infra/` | `docker compose exec api pnpm run test:integration` |
| Application | unit | Create-user reference validation and sector move blocking | `test/modules/users/application/`, `test/modules/orgaos/application/` | `docker compose exec api pnpm test -- <test path>` |
| Repository | integration | Tenant-scoped reference validation and linked-sector checks | `test/modules/users/infra/`, `test/modules/orgaos/infra/` | `docker compose exec api pnpm run test:integration -- <test path>` |
| HTTP | e2e | Create-user accepts references and maps documented failures | `test/identity.e2e-spec.ts` | `docker compose exec api pnpm run test:e2e -- test/identity.e2e-spec.ts` |

## Gate Check Commands

| Gate Level | Command |
| --- | --- |
| Quick | `docker compose exec api pnpm test -- test/modules/users/application/create_user.service.spec.ts test/modules/orgaos/application/orgao_setor.services.spec.ts` |
| Full | `docker compose exec api pnpm run test:e2e -- test/identity.e2e-spec.ts && docker compose exec api pnpm run test:integration -- test/modules/users/infra/repositories/user.repository.spec.ts test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts` |
| Build | `docker compose exec api pnpm run build && docker compose exec api pnpm run lint && docker compose exec api pnpm test` |

## Task Breakdown

### T1: Persist user organization references

**What**: Add nullable `localidadeId`, `orgaoId` and `setorId` to user entity, model, mapper, migration and response.
**Where**: `src/modules/users/`, `src/core/database/migrations/`
**Requirement**: UOR-01
**Tests**: unit, integration
**Gate**: Quick
**Status**: Complete

### T2: Validate tenant-scoped user references

**What**: Add repository checks for locality, organization and sector ownership inside the verified tenant schema and enforce them during user creation.
**Where**: `src/modules/users/`
**Depends on**: T1
**Requirement**: UOR-01, UOR-02, UOR-03
**Tests**: unit, e2e
**Gate**: Quick
**Status**: Complete

### T3: Block unsafe sector movement

**What**: Detect public users linked to a sector and reject orgao moves with HTTP 422 while allowing moves without links.
**Where**: `src/modules/orgaos/`
**Depends on**: T2
**Requirement**: UOR-03
**Tests**: unit, integration, e2e
**Gate**: Full
**Status**: Complete

## Execution Plan

### Phase 1: User organization persistence

```
T1 → T2
```

### Phase 2: Sector movement protection

```
T2 → T3
```

## Requirement Traceability

| Requirement ID | Task | Status |
| --- | --- | --- |
| UOR-01 | T1, T2 | Verified |
| UOR-02 | T2 | Verified |
| UOR-03 | T2, T3 | Verified |
