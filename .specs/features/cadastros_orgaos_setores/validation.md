# Cadastros de Orgaos e Setores Validation

**Date**: 2026-09-05
**Spec**: `.specs/features/cadastros_orgaos_setores/spec.md`
**Tasks**: `.specs/features/cadastros_orgaos_setores/tasks.md`
**Diff range**: `master` dirty working tree; feature files are uncommitted in current workspace.
**Verifier**: independent verifier pass plus follow-up fix validation.
**Verdict**: PASS

---

## Task Completion

| Task | Status | Evidence |
| --- | --- | --- |
| T1 | Complete | `tasks.md` marks T1 Complete; `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:54` asserts persisted tenancy id and `:56` asserts identity tables include `localidades`, `orgaos`, `setores`. |
| T2 | Complete | `test/modules/orgaos/domain/entities/orgao_setor.entity.spec.ts:23` asserts orgao normalized fields; `:98` asserts setor normalized fields; `test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts:64` and `:138` assert ordered repository lists. |
| T3 | Complete | `test/modules/orgaos/application/orgao_setor.services.spec.ts:65` asserts forbidden orgao write; `:235` asserts forbidden setor write; `:128` and `:300` assert update semantics. |
| T4 | Complete | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:140`, `:172`, `:193`, `:217`, `:265`, `:315`, `:399`, `:426`, `:459` assert HTTP success and failure contracts. |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| ORG-P1-1 | ADMIN creates orgao with normalized fields and `ativo=true`. | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:140` - `expect(body).toMatchObject({ id, localidadeId, nome: 'Secretaria', tipo: TipoOrgao.SECRETARIA, ativo: true })`; `:147` - `expect(createOrgao.execute.mock.calls).toContainEqual([{ localidadeId, nome: 'Secretaria', sigla: 'Seob', tipo, responsavel: 'Maria', email: 'gestao@example.com', telefone, role: UserRole.ADMIN }])`. | PASS |
| ORG-P1-2 | Authorized tenant users list only verified-tenant orgaos ordered by `nome ASC`. | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:172` - `expect(body.map((item) => item.nome)).toEqual(['A Secretaria', 'Z Secretaria'])`; `test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts:64` - `expect(result.getOrThrow().map((item) => item.nome)).toEqual(['Alpha', 'Zeta'])`; `:112` - `expect(result.isLeft()).toBe(true)`. | PASS |
| ORG-P1-3 | Authorized writer persists supplied mutable orgao fields including `ativo`. | `test/modules/orgaos/application/orgao_setor.services.spec.ts:128` - `expect(result.getOrThrow()).toMatchObject({ id, localidadeId: destinationLocalidadeId, nome: 'Secretaria Atualizada', sigla: null, tipo: null, responsavel: 'Ana', email: 'ana@example.com', telefone: '85988887777', ativo: false })`; `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:193` - `expect(body).toMatchObject({ id, nome: 'Secretaria', ativo: false })`. | PASS |
| ORG-P1-4 | Invalid locality id, type, email, or name returns HTTP 400 with registered codes. | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:217` - `expect(body.message).toEqual(expect.arrayContaining([ErrorCodeConstants.ORGAO_INVALID_LOCALIDADE, ErrorCodeConstants.ORGAO_INVALID_NAME, ErrorCodeConstants.ORGAO_INVALID_TYPE, ErrorCodeConstants.ORGAO_INVALID_EMAIL]))`; `:225` - `expect(createOrgao.execute.mock.calls).toHaveLength(0)`. | PASS |
| ORG-P1-5 | Absent referenced localidade or orgao returns HTTP 404 registered code. | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:245` - `expect(body.message).toBe(ErrorCodeConstants.LOCALIDADE_NOT_FOUND)`; `:265` - `expect(body.message).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND)`; `test/modules/orgaos/application/orgao_setor.services.spec.ts:161` - `expect(result.isLeft()).toBe(true)`. | PASS |
| ORG-P1-6 | Provisioning a tenancy creates `orgaos` in the generated schema. | `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:54` - `expect(result.getOrThrow().id).toBe(tenancy.id)`; `:56` - `expect(identityTables.map(({ table_name }) => table_name).sort()).toEqual(['localidades', 'orgaos', 'setores'])`. | PASS |
| ORG-P1-7 | Migration creates `orgaos` in existing tenant schemas without altering records. | `test/modules/core/infra/migrations/tenant_identity_schema.migration.spec.ts:48` - `expect(tables.map(({ table_name }) => table_name).sort()).toEqual(['localidades', 'orgaos', 'setores'])`; `:65` - `expect(localities).toEqual([{ id: localityId }])`. | PASS |
| SET-P1-1 | ADMIN/STAFF creates setor under verified orgao with `nome`, `ativo`, and `orgaoId`. | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:315` - `expect(createdBody).toMatchObject({ id, orgaoId, nome: 'Engenharia' })`; `test/modules/orgaos/domain/entities/orgao_setor.entity.spec.ts:98` - `expect(setor).toMatchObject({ orgaoId, nome: 'Engenharia', ativo: true })`. | PASS |
| SET-P1-2 | Authorized tenant users list only parent orgao sectors ordered by `nome ASC`. | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:320` - `expect(listedBody.map((item) => item.nome)).toEqual(['Arquitetura', 'Zeladoria'])`; `test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts:138` - `expect(result.getOrThrow().map((item) => item.nome)).toEqual(['Arquitetura', 'Zeladoria'])`. | PASS |
| SET-P1-3 | Authorized writer persists supplied `nome`, `ativo`, or verified destination `orgaoId`. | `test/modules/orgaos/application/orgao_setor.services.spec.ts:278` - `expect(result.getOrThrow()).toMatchObject({ id, orgaoId: orgaoIds.orgaoId, nome: 'Projetos', ativo: false })`; `:300` - `expect(result.getOrThrow()).toMatchObject({ id, orgaoId: destinationOrgaoId, nome: validSetor.nome, ativo: validSetor.ativo })`; `:306` - `expect(repository.existsOrgao.mock.calls).toContainEqual([destinationOrgaoId])`. | PASS |
| SET-P1-4 | Parent, sector, or destination orgao absence returns HTTP 404 registered code. | `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:379` - `expect(body.message).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND)`; `:399` - `expect(body.message).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND)`; `:426` - `expect(body.message).toBe(ErrorCodeConstants.SETOR_NOT_FOUND)`. | PASS |
| SET-P1-5 | Provisioning a tenancy creates `setores` in the generated schema. | `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:56` - `expect(identityTables.map(({ table_name }) => table_name).sort()).toEqual(['localidades', 'orgaos', 'setores'])`; implementation path `src/core/multitenancy/tenant_identity_schema.ts:64` creates `"setores"`. | PASS |
| SET-P1-6 | Migration creates `setores` in existing tenant schemas without altering records. | `test/modules/core/infra/migrations/tenant_identity_schema.migration.spec.ts:48` - `expect(tables.map(({ table_name }) => table_name).sort()).toEqual(['localidades', 'orgaos', 'setores'])`; `:65` - `expect(localities).toEqual([{ id: localityId }])`. | PASS |

**Status**: PASS. 13/13 ACs have direct evidence and asserted outcomes match the spec.

---

## Edge Cases

- [x] Foreign tenant identifiers are not exposed by schema-qualified repositories: `test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts:108` performs lookup under another tenant, `:112` asserts `expect(result.isLeft()).toBe(true)`, and `:114` asserts `expect(result.value.code).toBe(ErrorCodeConstants.ORGAO_NOT_FOUND)`.
- [x] Unknown fields fail through the global validation pipe: `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:357` asserts `expect(body.message).toContain('property totalObras should not exist')`.
- [x] Missing tenant context rejects before use cases run: `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:459` asserts `expect(body.message).toBe(ErrorCodeConstants.TENANT_CONTEXT_REQUIRED)` and `:462` asserts `expect(listOrgaos.execute.mock.calls).toHaveLength(0)`.

---

## Gate Check

| Command | Result |
| --- | --- |
| `rtk docker compose exec api pnpm run build` | PASS |
| `rtk docker compose exec api pnpm run lint` | PASS exit code 0; 2 existing warnings in `test/modules/orgaos/domain/entities/orgao_setor.entity.spec.ts`. |
| `rtk docker compose exec api pnpm test` | PASS: 22 suites, 113 tests. |
| `rtk docker compose exec api pnpm run test:e2e` | PASS: 4 suites, 39 tests. |
| `rtk docker compose exec api pnpm run test:integration` | PASS: 9 suites, 23 tests. |

Focused feature gates also passed:

- `rtk docker compose exec api pnpm test -- test/modules/localidades/domain/entities/localidade.entity.spec.ts test/modules/localidades/application/localidade.services.spec.ts test/modules/orgaos/domain/entities/orgao_setor.entity.spec.ts test/modules/orgaos/application/orgao_setor.services.spec.ts`: PASS, 4 suites, 42 tests.
- `rtk docker compose exec api pnpm run test:e2e -- test/modules/localidades/controller/localidade.controller.e2e-spec.ts test/modules/orgaos/controller/orgao.controller.e2e-spec.ts`: PASS, 2 suites, 24 tests.
- `rtk docker compose exec api pnpm run test:integration -- test/modules/localidades/infra/repositories/localidade.repository.spec.ts test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts test/modules/core/infra/migrations/tenant_identity_schema.migration.spec.ts test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts`: PASS, 4 suites, 13 tests.

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M1 | `src/modules/orgaos/application/update_setor.service.ts:23` | In `/tmp/obras_org_sensor`, changed destination orgao validation from `if (param.orgaoId !== undefined)` to `if (false)`. | PASS: killed by `test/modules/orgaos/application/orgao_setor.services.spec.ts:306` and `:330`; focused application test failed with 2 failures. |

**Sensor depth**: Lightweight.
**Result**: PASS, 1/1 killed.
**Isolation**: Mutation ran only in `/tmp/obras_org_sensor`; scratch copy was removed after the run.

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
| Documented guidelines followed: `AGENTS.md`, `.specs/features/cadastros_orgaos_setores/tasks.md` | PASS |

---

## Requirement Traceability

| Requirement | Previous Status | Verified Status |
| --- | --- | --- |
| ORG-01 | Complete | Verified |
| ORG-02 | Complete | Verified |
| SET-01 | Complete | Verified |
| SET-02 | Complete | Verified |
| ORG-03 | Complete | Verified |
| SET-03 | Complete | Verified |

## Summary

**Overall**: Ready.

**Spec-anchored check**: 13/13 ACs matched the spec-defined outcome.
**Gate**: build, lint, unit, e2e, and integration passed.
**Sensor**: 1 mutation injected, 1 killed, 0 survived.
