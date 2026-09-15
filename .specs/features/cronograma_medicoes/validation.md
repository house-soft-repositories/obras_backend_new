# Cronograma e Medições Validation

**Date**: 2026-09-15
**Spec**: `.specs/features/cronograma_medicoes/spec.md`
**Verifier note**: no sub-agent dispatch tool is available in this environment, so verification was performed as a separate evidence-gathering pass after implementation (fresh read of spec, code and test outcomes; mutation probe included), not by re-reading implementation notes.

## Validation

**Result**: PASS — P1, P2 and P3 acceptance criteria are implemented, tenant-scoped, and covered by focused gates; full-suite failures are pre-existing baseline issues in untouched modules (proven via stash).

### P1: Estágios e reordenação (CRO-01..CRO-07)

- Routes wired: `src/modules/cronograma/controller/estagios.controller.ts:43` (create), `src/modules/cronograma/controller/estagios.controller.ts:52` (list), `src/modules/cronograma/controller/estagios.controller.ts:90` (lote), `src/modules/cronograma/controller/estagios.controller.ts:104` (reordenar), `src/modules/cronograma/controller/estagios.controller.ts:67` (predefinidos).
- Atomic reorder in transaction: `src/modules/cronograma/infra/repositories/estagio.repository.ts:198`; rollback on out-of-scope item proven by `test/modules/cronograma/infra/repositories/estagio.repository.spec.ts:120`.
- E2E proves create-3 → reorder → list order: `test/modules/cronograma/controller/estagios.controller.e2e-spec.ts:133`.

### P2: Acompanhamentos e comentários (CRO-08..CRO-12)

- Routes: `src/modules/cronograma/controller/estagios.controller.ts:122` (acompanhamentos), `src/modules/cronograma/controller/estagios.controller.ts:141` (comentarios), `src/modules/cronograma/controller/estagios.controller.ts:74` (datas-agregadas), `src/modules/cronograma/controller/estagios.controller.ts:176` (percentual-direto).
- Service validates obra+stage scope before writes: `src/modules/cronograma/application/estagios.service.ts:140`, `src/modules/cronograma/application/estagios.service.ts:162`; percentual range guard: `src/modules/cronograma/application/estagios.service.ts:182`.
- E2E happy path plus 404/400 negatives: `test/modules/cronograma/controller/estagios.controller.e2e-spec.ts:269`, `test/modules/cronograma/controller/estagios.controller.e2e-spec.ts:354`, `test/modules/cronograma/controller/estagios.controller.e2e-spec.ts:371`.

### P3: Medições e transições (CRO-13..CRO-18)

- Routes: `src/modules/cronograma/controller/estagios.controller.ts:225` (POST medicoes), `src/modules/cronograma/controller/estagios.controller.ts:238` (GET medicoes), `src/modules/cronograma/controller/estagios.controller.ts:158` (concluir), `src/modules/cronograma/controller/estagios.controller.ts:167` (duplicar), `src/modules/cronograma/controller/estagios.controller.ts:82` (atual).
- Fonte-active validation with 422 code: `src/modules/cronograma/application/estagios.service.ts:211`, `src/modules/cronograma/application/estagios.service.ts:223`; code registered at `src/core/constants/error_code.constants.ts:173`.
- Transacional medicao+fontes save: `src/modules/cronograma/infra/repositories/estagio.repository.ts:391`; current-stage query: `src/modules/cronograma/infra/repositories/estagio.repository.ts:540`.
- Domain concluir/duplicar: `src/modules/cronograma/domain/entities/estagio.entity.ts:104`, `src/modules/cronograma/domain/entities/estagio.entity.ts:112`.
- E2E full cycle plus 422: `test/modules/cronograma/controller/estagios.controller.e2e-spec.ts:412`, `test/modules/cronograma/controller/estagios.controller.e2e-spec.ts:507`.

### Discrimination sensor

- Mutation probe: `percentualDireto: 100` → `null` in `concluir()` made exactly one test fail (`concludes stage and sets direct percentage to 100`, 1 failed / 17 passed); after restore, 18/18 green. Tests assert spec outcomes, not implementation mirrors.

## Evidence (gates, Docker `api` container)

- `pnpm run build`: PASS.
- Unit (all modules, 4 chunks): 49 suites / 214 tests PASS, incl. `test/modules/cronograma/application/estagios.service.spec.ts:271` (9 P3 cases, 18 total).
- Integration: `test/modules/cronograma/infra/repositories/estagio.repository.spec.ts:282` (7 P3 cases, 14 total) PASS; full integration 37 passed / 4 failed — all 4 failures pre-existing in untouched modules (`tenancy` table-list drift, `orgao` spec missing `PageOptionsEntity` import at `test/modules/orgaos/infra/repositories/orgao.repository.spec.ts:59`, `localidade` DB-dependent `LOCALIDADE_REPOSITORY_FAILED`).
- E2E: cronograma 12/12 PASS; full e2e failures pre-existing on clean baseline (verified via `git stash`): `test/modules/auth/controller/identity.e2e-spec.ts` (1 test), `test/modules/localidades/controller/localidade.controller.e2e-spec.ts:195` (500 from service), `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:15` (suite fails to run: missing `@/modules/orgaos/domain/read-models/setor_read_model` import).
- `pnpm run lint`: FAIL repo-wide and pre-existing — untouched `fontes` module also fails (15 errors, same `no-unsafe-*`/`require-await` classes); not introduced by this feature. Full-lint cleanup is out of scope (would touch dozens of unrelated files).
- Skill gates: `validate_spec.py` 0 errors, `validate_tasks.py` 0 errors (1 pre-existing T4 granularity warning).

## Remaining work (out of scope for this feature)

- Fix pre-existing baseline failures: identity/localidades/orgaos e2e, tenancy/orgao/localidade integration specs.
- Repo-wide lint cleanup.
