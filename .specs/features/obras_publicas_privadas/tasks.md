# Obras Públicas e Privadas Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/obras_publicas_privadas/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `RTK.md`, `package.json`, `test/jest-e2e.json`, `test/jest-integration.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Domain entities | unit | Factories validate required fields, immutable/generated fields, tenant invariants, and derived private-work initial state. | `test/modules/<module>/domain/*.spec.ts` | `docker compose exec api pnpm test -- test/modules/<module>/domain/<file>.spec.ts` |
| DTOs | unit | DTO validation covers required fields, enums, nested arrays, numeric strings, and pagination bounds/defaults. | `test/modules/<module>/dtos/*.spec.ts` | `docker compose exec api pnpm test -- test/modules/<module>/dtos/<file>.spec.ts` |
| Application services | unit | Services cover happy path and every spec failure branch with typed mocks and no `@nestjs/testing`. | `test/modules/<module>/application/*.spec.ts` | `docker compose exec api pnpm test -- test/modules/<module>/application/<file>.spec.ts` |
| Repositories / migrations | integration | Tenant-scoped persistence, unique indexes, pagination ordering, and rollback/apply behavior are verified against PostgreSQL. | `test/modules/<module>/infra/*.spec.ts` | `docker compose exec api pnpm run test:integration -- test/modules/<module>/infra/<file>.spec.ts` |
| Controllers / HTTP | e2e | Routes cover source creation/listing, pessoa creation/listing, public-work creation, private-work creation, and invalid payloads. | `test/modules/<module>/*.e2e-spec.ts` | `docker compose exec api pnpm run test:e2e -- test/modules/<module>/<file>.e2e-spec.ts` |

## Gate Check Commands

| Gate | Command |
| --- | --- |
| Fonte unit | `docker compose exec api pnpm test -- test/modules/financeiro` |
| Pessoa unit | `docker compose exec api pnpm test -- test/modules/pessoas` |
| Obras unit | `docker compose exec api pnpm test -- test/modules/obras` |
| Obras privadas unit | `docker compose exec api pnpm test -- test/modules/obras-privadas` |
| Integration | `docker compose exec api pnpm run test:integration` |
| E2E | `docker compose exec api pnpm run test:e2e` |
| Build | `docker compose exec api pnpm run build` |
| Lint | `docker compose exec api pnpm run lint` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Fonte and pessoa foundations

```
T1
T2
```

### Phase 2: Work creation cores

```
T1 → T3
T2 → T3
T2 → T4
```

### Phase 3: Schema and HTTP integration

```
T1 → T5
T2 → T5
T3 → T5
T4 → T5
T3 → T6
T4 → T6
T5 → T6
```

---

## Task Breakdown

### T1: Implement fonte creation and listing

**What**: Create the tenant-scoped fonte model, entity, mapper, repository, create use case, paginated list use case, DTOs, and controller.
**Where**: `src/modules/financeiro/`
**Depends on**: None
**Reuses**: `src/modules/users/`, `src/modules/tenancy/`, legacy `src/modules/financeiro/`
**Requirement**: WPR-01, WPR-02, WPR-03, WPR-04, WPR-05, WPR-06, WPR-07, WPR-08, WPR-09

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `POST /fontes` creates an active fonte scoped to the verified tenant.
- [x] `GET /fontes` returns tenant-scoped, `nome`-ordered paginated results with metadata.
- [x] Duplicate non-null `codigo` in the same tenant returns HTTP 409.
- [x] Invalid `nome`, `tipo`, `valorPrevisto`, `page`, or `limit` fails before persistence.

**Tests**: unit + e2e
**Gate**: Fonte unit + E2E focused route tests + Build

---

### T2: Implement pessoa creation and listing

**What**: Create the tenant-scoped pessoa model, entity, mapper, repository, create use case, paginated list use case, DTOs, and controller.
**Where**: `src/modules/pessoas/`
**Depends on**: None
**Reuses**: `src/modules/users/`, `src/modules/tenancy/`, legacy `src/modules/obras-privadas/entities/pessoa.entity.ts`
**Requirement**: WPR-10, WPR-11, WPR-12, WPR-13, WPR-14, WPR-15, WPR-16, WPR-17, WPR-18

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `POST /pessoas` creates an active pessoa scoped to the verified tenant.
- [x] `GET /pessoas` returns tenant-scoped, `nome`-ordered paginated results with metadata.
- [x] Duplicate `documento` in the same tenant returns HTTP 409.
- [x] Invalid `tipo`, `documento`, `nome`, `page`, or `limit` fails before persistence.

**Tests**: unit + e2e
**Gate**: Pessoa unit + E2E focused route tests + Build

---

### T3: Implement public work creation

**What**: Create the public obra aggregate, code generator, linked responsible/budget/follower models, repositories, create use case, DTO, and controller.
**Where**: `src/modules/obras/`
**Depends on**: T1, T2
**Reuses**: `src/modules/financeiro/`, `src/modules/pessoas/`, legacy `src/modules/obras/`
**Requirement**: WPR-19, WPR-20, WPR-21, WPR-22, WPR-23, WPR-24, WPR-25, WPR-26, WPR-27, WPR-28

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `POST /obras` creates an obra with generated immutable `OBR-<ano>-NNNN` code.
- [x] Creation validates active fonte references and at least one orçamento item.
- [x] Creation persists obra, responsible link, each orçamento, and optional follower atomically.
- [x] Invalid subclassification/type combinations and invalid relationship IDs fail without partial writes.

**Tests**: unit + integration + e2e
**Gate**: Obras unit + Integration + E2E focused route tests + Build

---

### T4: Implement private work creation

**What**: Create the private obra aggregate, code generator, repository, create use case, DTO, and controller using an existing pessoa as proprietor.
**Where**: `src/modules/obras-privadas/`
**Depends on**: T2
**Reuses**: `src/modules/pessoas/`, legacy `src/modules/obras-privadas/`
**Requirement**: WPR-29, WPR-30, WPR-31, WPR-32, WPR-33, WPR-34, WPR-35, WPR-36, WPR-37, WPR-38, WPR-39, WPR-40

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] `POST /obras-privadas` creates an obra privada with generated immutable `OBP-<ano>-NNNN` code.
- [x] Creation validates `proprietarioPessoaId` against tenant-scoped pessoas.
- [x] Creation persists address, property identity, geo, date, and enum fields.
- [x] Initial `situacaoAlvara` is `SEM_ALVARA` and cannot become inconsistent during creation.

**Tests**: unit + integration + e2e
**Gate**: Obras privadas unit + Integration + E2E focused route tests + Build

---

### T5: Wire modules and cross-flow HTTP tests

**What**: Register modules in the app graph and add end-to-end flows that create fonte, pessoa, public obra, and private obra in sequence.
**Where**: `src/app.module.ts`, `test/modules/obras_publicas_privadas/`
**Depends on**: T1, T2, T3, T4
**Reuses**: `src/modules/auth/controller/access_token.guard.ts`, `src/core/multitenancy/verified_tenant_context.service.ts`
**Requirement**: WPR-01, WPR-05, WPR-09, WPR-10, WPR-14, WPR-18, WPR-19, WPR-23, WPR-25, WPR-28, WPR-29, WPR-32, WPR-35, WPR-40

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] App imports the new modules and exports only symbols needed by dependent modules.
- [x] E2E creates a fonte and uses it in public obra creation.
- [x] E2E creates a pessoa and uses it in private obra creation.
- [x] E2E proves tenant isolation for fonte and pessoa paginated listing.

**Tests**: e2e
**Gate**: E2E + Build

---

### T6: Add migrations, indexes, and full validation gate

**What**: Add reversible TypeORM migrations and verify schema, indexes, build, lint, unit, integration, and e2e gates.
**Where**: `src/core/database/migrations/`
**Depends on**: T3, T4, T5
**Reuses**: `src/core/database/migrations/1781200000000-create_identity_foundation.ts`, current TypeORM DataSource setup
**Requirement**: WPR-01, WPR-02, WPR-10, WPR-11, WPR-19, WPR-20, WPR-29, WPR-30

**Tools**:

- MCP: NONE
- Skill: tlc-spec-driven

**Done when**:

- [x] Migrations create and revert fonte, pessoa, public obra, private obra, and linked public-work item tables.
- [x] Unique indexes enforce fonte code, pessoa document, public obra code, and private obra code within tenant scope.
- [x] Private obra indexes cover proprietor, inscrição imobiliária, and geolocation lookup fields.
- [x] Full validation gate passes in the canonical Docker environment.

**Tests**: integration + full suite
**Gate**: Integration + E2E + Build + Lint

---

## Pre-Approval Checks

### Task Granularity

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Fonte vertical slice | OK |
| T2 | Pessoa vertical slice | OK |
| T3 | Public obra vertical slice | OK |
| T4 | Private obra vertical slice | OK |
| T5 | Cross-flow HTTP wiring | OK |
| T6 | Schema and full gate | OK |

### Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | No inbound arrows | OK |
| T2 | None | No inbound arrows | OK |
| T3 | T1, T2 | T1 → T3, T2 → T3 | OK |
| T4 | T2 | T2 → T4 | OK |
| T5 | T1, T2, T3, T4 | T1 → T5, T2 → T5, T3 → T5, T4 → T5 | OK |
| T6 | T3, T4, T5 | T3 → T6, T4 → T6, T5 → T6 | OK |

### Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | DTO, entity, service, repository, controller | unit + e2e | unit + e2e | OK |
| T2 | DTO, entity, service, repository, controller | unit + e2e | unit + e2e | OK |
| T3 | DTO, entities, services, repositories, controller | unit + integration + e2e | unit + integration + e2e | OK |
| T4 | DTO, entity, service, repository, controller | unit + integration + e2e | unit + integration + e2e | OK |
| T5 | module graph and HTTP routes | e2e | e2e | OK |
| T6 | migrations and indexes | integration + full suite | integration + full suite | OK |
