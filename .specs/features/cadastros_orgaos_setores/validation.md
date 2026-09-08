# Cadastros de Órgãos e Setores Validation

**Date**: 2026-09-08
**Spec**: `.specs/features/cadastros_orgaos_setores/spec.md`
**Tasks**: `.specs/features/cadastros_orgaos_setores/tasks.md`
**Diff range**: `HEAD` dirty working tree (setores global list + read-model with orgao JOIN, denyUnlessSetorReader removido)
**Verifier**: independent verifier (author ≠ verifier) — spec-anchored evidence + discrimination sensor
**Verdict**: PASS

---

## Task Completion

| Task | Status | Evidence |
| --- | --- | --- |
| T1 | Complete | `tasks.md` T1 Complete; `test/modules/tenancy/infra/repositories/tenancy.repository.spec.ts:54` + `:56` asserts `orgaos`/`setores` creation |
| T2 | Complete | `test/modules/orgaos/domain/entities/orgao_setor.entity.spec.ts:23` orgao normalized; `:98` setor normalized; `infra/repositories/orgao_setor.repository.spec.ts:64` + `138` ordered lists |
| T3 | Complete | `application/orgao_setor.services.spec.ts:65` orgao auth; `:235` setor write auth; `:128`/`:300` update semantics; `test/modules/orgaos/application/orgao_setor.services.spec.ts:246` global list returns `PageEntity<SetorWithOrgaoReadModel>` with `orgao:{id,nome}` |
| T4 | Complete | `controller/orgao.controller.e2e-spec.ts:140` POST orgao 201; `:315` POST setor 201; `:326` GET setores global 200 with `data/meta`; `test:integration` 5/5 pass |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| ORG-P1-1 | ADMIN creates orgao with locality, normalized fields, ativo true | `controller/orgao.controller.e2e-spec.ts:140` `expect(body).toMatchObject({ localidadeId, nome:'Secretaria', tipo:'SECRETARIA', ativo:true })` | PASS |
| ORG-P1-2 | List orgaos tenant-scoped nome ASC Page | `infra/repositories/orgao_setor.repository.spec.ts:51` `findAll(PageOptions ASC)` `expect(page.pageData.map(n)).toEqual(['Alpha','Zeta'])` | PASS |
| ORG-P1-3 | Writer updates orgao mutable fields | `application/orgao_setor.services.spec.ts:128` `expect(result.getOrThrow()).toMatchObject({ ativo:false })` | PASS |
| ORG-P1-4 | Invalid locality/type/email/name → 400 registered codes | `controller/orgao.controller.e2e-spec.ts:217` `arrayContaining([ORGAO_INVALID_LOCALIDADE, ...])` | PASS |
| ORG-P1-5 | Missing locality/orgao → 404 | `controller/orgao.controller.e2e-spec.ts:245` `ORGAO_NOT_FOUND` | PASS |
| ORG-P1-6 | Tenancy provision creates orgaos table | `tenant_identity_schema.ts:64` `CREATE TABLE orgaos`; `tenancy.repository.spec.ts:56` | PASS |
| ORG-P1-7 | Migration creates orgaos without altering records | `tenant_identity_schema.migration.spec.ts:48` | PASS |
| SET-P1-1 | ADMIN/STAFF creates setor under orgao with nome/ativo/orgaoId | `controller/orgao.controller.e2e-spec.ts:315` `expect(createdBody).toMatchObject({ orgaoId, nome:'Engenharia' })` | PASS |
| SET-P1-2 | **Global list** `GET /api/orgaos/setores` returns tenant-scoped `Page<SetorWithOrgaoReadModel>` nome ASC, each `orgao:{id,nome}` (sem flat orgaoId, sem denyUnlessSetorReader/existsOrgao) | `controller/orgao.controller.ts:127` `@Get('setores')`; `application/list_setores.service.ts:1` no denyUnless/existsOrgao, `repository.findAllByOrgao(pageOptions)`; `infra/repositories/setor.repository.ts:88` `JOIN orgaos ON s.orgao_id=o.id ORDER BY s.nome LIMIT/OFFSET`; `infra/mapper/setor.mapper.ts:12` `toReadModelWithOrgao`; `controller/orgao.controller.ts:137` `SetorListItemDto.fromReadModel`; `application/orgao_setor.services.spec.ts:246` `expect(page.pageData[0].orgao).toEqual({id,nome})`; `infra/repositories/orgao_setor.repository.spec.ts:121` `expect(page.pageData.map...).toEqual(['Arquitetura','Zeladoria'])` + `expect(page.pageData[0].orgao).toEqual(...)` | PASS |
| SET-P1-3 | Writer updates setor nome/ativo/orgaoId | `application/orgao_setor.services.spec.ts:265` `expect(result.getOrThrow()).toMatchObject({ nome:'Projetos' })` | PASS |
| SET-P1-4 | Missing parent/sector/destination orgao → 404 | `controller/orgao.controller.e2e-spec.ts:379` `ORGAO_NOT_FOUND` | PASS |
| SET-P1-5 | Tenancy provision creates setores table | `tenant_identity_schema.ts:70` `CREATE TABLE setores` | PASS |
| SET-P1-6 | Migration creates setores without altering records | `tenant_identity_schema.migration.spec.ts:48` | PASS |

**Status**: PASS 13/13 ACs have direct evidence matching spec-defined outcomes (EARS).

---

## Edge Cases

- [x] Foreign tenant isolation: `infra/repositories/orgao_setor.repository.spec.ts:108` cross-tenant lookup → 404 `ORGAO_NOT_FOUND`
- [x] Unknown fields via ValidationPipe: `controller/orgao.controller.e2e-spec.ts:357` `totalObras should not exist`
- [x] Missing tenant context before use case: `controller/orgao.controller.e2e-spec.ts:459` `TENANT_CONTEXT_REQUIRED` + zero use-case calls
- [x] Global setor list empty page: `repository.findAllByOrgao` returns `itemCount 0` + empty `pageData` (verified via `PageMeta`), no orgaoId in query

---

## Gate Check

| Command | Result |
| --- | --- |
| `pnpm run build` | PASS |
| `pnpm test -- test/modules/orgaos/application/orgao_setor.services.spec.ts` | PASS 21/21 |
| `pnpm test -- test/modules/orgaos/domain/entities/orgao_setor.entity.spec.ts` | PASS |
| `docker compose exec api pnpm run test:integration -- test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts` | PASS 5/5 |
| `docker compose exec api pnpm run test:e2e -- test/modules/orgaos/controller/orgao.controller.e2e-spec.ts` | PASS (4 suites) — global list expects `data/meta` + `orgao:{id,nome}` |
| `pnpm test -- test/modules/fontes\|pessoas\|obras\|obras-privadas` | PASS 47/47 (obras feature unstaged but build-verified) |

---

## Discrimination Sensor

| Mutation | File:line | Description | Killed? |
| --- | --- | --- | --- |
| M1 | `src/modules/orgaos/infra/repositories/setor.repository.ts:88` | Remove `JOIN orgaos` → `orgaoNome` null | PASS: killed by `infra/repositories/orgao_setor.repository.spec.ts:144` `expect(page.pageData[0].orgao.nome).toBe('Secretaria')` fails |
| M2 | `src/modules/orgaos/application/list_setores.service.ts:1` | Re-add `denyUnlessSetorReader` check | PASS: killed by `application/orgao_setor.services.spec.ts:246` `USER` list would become 403 vs expected 200 |

**Sensor depth**: lightweight tenant-isolation
**Result**: PASS 2/2 killed
**Isolation**: scratch worktree `/tmp/obras_sensor` removed; `git status --porcelain` baseline unchanged

---

## Code Quality

| Principle | Status |
| --- | --- |
| Minimum code | PASS |
| Surgical changes | PASS |
| No scope creep | PASS |
| Matches project patterns (read-model `infra/read-models`, mapper `toReadModelWithOrgao`, PageEntity) | PASS |
| Spec-anchored asserted outcomes | PASS |
| Per-layer coverage | PASS |
| Every test maps to spec requirement | PASS |
| Guidelines `AGENTS.md`, `tasks.md` | PASS |

---

## Requirement Traceability

| Requirement | Previous Status | Verified Status |
| --- | --- | --- |
| ORG-01 | Complete | Verified |
| ORG-02 | Complete | Verified |
| SET-01 | Complete | Verified |
| SET-02 | Complete | Verified (global `SetorWithOrgaoReadModel`, sem denyUnless/existsOrgao) |
| ORG-03 | Complete | Verified |
| SET-03 | Complete | Verified |

## Summary

**Overall**: Ready.

**Spec-anchored check**: 13/13 ACs matched
**Gate**: build + unit + integration + e2e (global list) passed
**Sensor**: 2 mutations killed, 0 survived
