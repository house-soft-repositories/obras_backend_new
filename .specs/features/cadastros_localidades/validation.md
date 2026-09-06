# Cadastros de Localidades Validation

**Date**: 2026-09-05
**Spec**: `.specs/features/cadastros_localidades/spec.md`
**Tasks**: `.specs/features/cadastros_localidades/tasks.md`
**Diff range**: `master` dirty working tree; feature files are uncommitted in current workspace.
**Verifier**: standalone verifier pass with independent sub-agent checks requested.
**Verdict**: PASS

---

## Task Completion

| Task | Status | Evidence |
| --- | --- | --- |
| T1 | Complete | `tasks.md` marks T1 Complete; `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:54` asserts persisted tenancy id and `:56` asserts identity tables include `localidades`. |
| T2 | Complete | `test/modules/localidades/domain/entities/localidade.entity.spec.ts:16` asserts generated id, `:17` asserts normalized name, `:18` asserts normalized UF; `test/modules/localidades/infra/repositories/localidade.repository.spec.ts:49` asserts ordered repository listing. |
| T3 | Complete | `test/modules/localidades/application/localidade.services.spec.ts:34` asserts admin create output, `:50` asserts forbidden non-admin write, `:68` asserts reader list output, and `:96` asserts update output. |
| T4 | Complete | `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:156`, `:198`, `:217`, `:245`, `:265`, `:307`, `:319`, and `:343` assert HTTP success and failure contracts. |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| LOC-P1-1 | ADMIN creates tenant-scoped locality with UUID, normalized `nome`/`uf`, optional fields, and timestamps. | `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:156` - `expect(body).toEqual({ id, nome: 'Centro', uf: 'CE', codigoIbge: '2304400', tipo: TipoLocalidade.DISTRITO, municipio: 'Fortaleza', observacoes: null, createdAt, updatedAt })`; `:167` - `expect(createLocalidade.execute.mock.calls).toContainEqual([{ nome: 'Centro', uf: 'CE', codigoIbge: '2304400', tipo: TipoLocalidade.DISTRITO, municipio: 'Fortaleza', observacoes: null, role: UserRole.ADMIN }])`; `test/modules/localidades/domain/entities/localidade.entity.spec.ts:16` - `expect(locality.id).toEqual(expect.any(String))`. | PASS |
| LOC-P1-2 | Authorized tenant user lists only verified tenant records ordered by `nome ASC`. | `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:198` - `expect(body.map((item) => item.nome)).toEqual(['Aldeota', 'Centro'])`; `test/modules/localidades/infra/repositories/localidade.repository.spec.ts:49` - `expect(result.getOrThrow().map((item) => item.nome)).toEqual(['Alpha', 'Zeta'])`; `:110` - `expect(result.getOrThrow().map((item) => item.nome)).toEqual(['Tenant One'])` after another tenant stores `Tenant Two`. | PASS |
| LOC-P1-3 | ADMIN update persists only supplied mutable fields and returns updated record. | `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:217` - `expect(body).toMatchObject({ id: localidadeIds.localidadeId, nome: 'Centro', municipio: 'Sobral' })`; `:222` - `expect(updateLocalidade.execute.mock.calls).toContainEqual([{ id: localidadeIds.localidadeId, municipio: 'Sobral', role: UserRole.ADMIN }])`; `test/modules/localidades/application/localidade.services.spec.ts:96` - `expect(result.getOrThrow()).toMatchObject({ id: current.id, nome: validLocalidade.nome, municipio: 'Parnaíba' })`. | PASS |
| LOC-P1-4 | Missing/invalid `nome`, `uf`, or `tipo` returns HTTP 400 with registered codes. | `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:245` - `expect(body.message).toEqual(expect.arrayContaining([ErrorCodeConstants.LOCALIDADE_INVALID_NAME, ErrorCodeConstants.LOCALIDADE_INVALID_UF, ErrorCodeConstants.LOCALIDADE_INVALID_TYPE]))`; `:265` - `expect(body.message).toEqual(expect.arrayContaining([ErrorCodeConstants.LOCALIDADE_INVALID_NAME, ErrorCodeConstants.LOCALIDADE_INVALID_UF]))` for missing fields; `:271` - `expect(createLocalidade.execute.mock.calls).toHaveLength(0)`; `test/modules/localidades/domain/entities/localidade.entity.spec.ts:44` - `expect(error).toBeInstanceOf(LocalidadeDomainException)`; `:45` - `expect((error as LocalidadeDomainException).code).toBe(code)`. | PASS |
| LOC-P1-5 | Absent locality in verified tenant returns HTTP 404 registered code. | `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:265` - `expect(body.message).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND)` for malformed id; `:307` - `expect(body.message).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND)` for foreign tenant id; `test/modules/localidades/application/localidade.services.spec.ts:120` - `expect(result.isLeft()).toBe(true)`; `:123` - `expect(result.value).toMatchObject({ code: ErrorCodeConstants.LOCALIDADE_NOT_FOUND, statusCode: 404 })`; `test/modules/localidades/infra/repositories/localidade.repository.spec.ts:91` - `expect(result.value.code).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND)`. | PASS |
| LOC-P1-6 | Missing tenant context or lacking permission returns HTTP 401/403 before schema persistence. | `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:319` - `expect(body.message).toBe(ErrorCodeConstants.TENANT_CONTEXT_REQUIRED)`; `:322` - `expect(listLocalidades.execute.mock.calls).toHaveLength(0)`; `:343` - `expect(body.message).toBe(ErrorCodeConstants.LOCALIDADE_ACCESS_FORBIDDEN)`; `test/modules/localidades/application/localidade.services.spec.ts:50` - `expect(result.isLeft()).toBe(true)`; `:51` - `expect(repository.save.mock.calls).toHaveLength(0)`. | PASS |
| LOC-PROV-1 | Provisioning a tenancy creates `localidades` in the generated schema before returning. | `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:54` - `expect(result.getOrThrow().id).toBe(tenancy.id)`; `:56` - `expect(identityTables.map(({ table_name }) => table_name).sort()).toEqual(['localidades', 'orgaos', 'setores'])`. | PASS |
| LOC-PROV-2 | Locality-table creation failure rolls back schema and tenancy record. | `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:153` - `expect(result.isLeft()).toBe(true)` when `TenantIdentitySchema.create` rejects; `:154` - `expect(schema[0].exists).toBe(false)`; `:155` - `expect(await dataSource.getRepository(TenancyModel).findOne({ where: { id: tenancy.id } })).toBeNull()`. | PASS |
| LOC-PROV-3 | Migration creates `localidades` in every existing tenant schema without altering records. | `test/modules/core/infra/migrations/tenant_identity_schema.migration.spec.ts:61` - `expect(tables.map(({ table_name }) => table_name).sort()).toEqual(['localidades', 'orgaos', 'setores'])`; `:73` - `expect(secondTables.map(({ table_name }) => table_name).sort()).toEqual(['localidades', 'orgaos', 'setores'])`; `:90` - `expect(localities).toEqual([{ id: localityId }])`. | PASS |

**Status**: PASS. 9/9 ACs have direct evidence and asserted outcomes match the spec.

---

## Edge Cases

- [x] Unknown fields return HTTP 400 through the global validation pipe: `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:302` asserts `expect(body.message).toContain('property totalObras should not exist')` and `:305` asserts `expect(createLocalidade.execute.mock.calls).toHaveLength(0)`.
- [x] Listing localities does not query `obra`: `src/modules/localidades/infra/repositories/localidade.repository.ts:51` selects only from `"${schema}"."localidades"` ordered by `nome ASC`; `rtk rg -n "obra|totalObras" src/modules/localidades test/modules/localidades` found only the HTTP unknown-field test references under `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:278`.

---

## Gate Check

| Command | Result |
| --- | --- |
| `rtk docker compose exec api pnpm run build` | PASS |
| `rtk docker compose exec api pnpm run lint` | PASS exit code 0; 2 existing warnings in orgao entity tests. |
| `rtk docker compose exec api pnpm test` | PASS: 22 suites, 113 tests. |
| `rtk docker compose exec api pnpm run test:e2e` | PASS: 4 suites, 40 tests. |
| `rtk docker compose exec api pnpm run test:integration` | PASS: 9 suites, 25 tests. |

Focused feature gates also passed:

- `rtk docker compose exec api pnpm test -- test/modules/localidades/application/localidade.services.spec.ts test/modules/localidades/domain/entities/localidade.entity.spec.ts`: PASS, 2 suites, 12 tests.
- `rtk docker compose exec api pnpm run test:e2e -- test/modules/localidades/controller/localidade.controller.e2e-spec.ts`: PASS, 1 suite, 11 tests.
- `rtk docker compose exec api pnpm run test:integration -- test/modules/localidades/infra/repositories/localidade.repository.spec.ts test/modules/core/infra/migrations/tenant_identity_schema.migration.spec.ts test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts`: PASS, 3 suites, 10 tests.

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M1 | `src/modules/localidades/application/create_localidade.service.ts:42` | In `/tmp/obras_loc_sensor`, bypassed `denyUnlessWriter(param.role)` so `STAFF` could attempt locality creation. | PASS: killed by `test/modules/localidades/application/localidade.services.spec.ts:50`; focused application test failed with 1 failure. |

**Sensor depth**: Lightweight.
**Result**: PASS, 1/1 killed.
**Isolation**: Mutation ran only in `/tmp/obras_loc_sensor`; scratch copy was removed after the run.

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | PASS |
| Surgical changes | PASS |
| No scope creep | PASS |
| Matches project patterns | PASS |
| Spec-anchored asserted outcomes | PASS |
| Per-layer coverage expectation | PASS |
| Every test maps to a spec requirement | PASS |
| Documented guidelines followed: `AGENTS.md`, `.specs/features/cadastros_localidades/tasks.md` | PASS |

---

## Requirement Traceability

| Requirement | Previous Status | Verified Status |
| --- | --- | --- |
| LOC-01 | Complete | Verified |
| LOC-02 | Complete | Verified |
| LOC-03 | Complete | Verified |
| LOC-04 | Complete | Verified |

## Summary

**Overall**: Ready.

**Spec-anchored check**: 9/9 ACs matched the spec-defined outcome.
**Gate**: build, lint, unit, e2e, and integration passed.
**Sensor**: 1 mutation injected, 1 killed, 0 survived.
