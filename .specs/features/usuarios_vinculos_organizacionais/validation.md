# Vínculos Organizacionais de Usuários Validation

**Date**: 2026-09-06
**Spec**: `.specs/features/usuarios_vinculos_organizacionais/spec.md`
**Tasks**: `.specs/features/usuarios_vinculos_organizacionais/tasks.md`
**Diff range**: `master` dirty working tree; feature files are uncommitted in current workspace.
**Verifier**: focused implementation validation after removing the out-of-scope user update endpoint.
**Verdict**: PASS

---

## Task Completion

| Task | Status | Evidence |
| --- | --- | --- |
| T1 | Complete | `src/modules/users/infra/models/user.model.ts` includes nullable user organization columns; `src/modules/users/infra/mapper/user.mapper.ts` maps them both ways; `src/core/database/migrations/1781400000000-add_user_organization_links.ts` adds/removes the public user columns. |
| T2 | Complete | `test/modules/users/application/create_user.service.spec.ts:79` asserts verified `localidadeId`, `orgaoId`, and `setorId` are checked and saved; `test/modules/users/application/create_user.service.spec.ts:128` asserts mismatched sector/orgao returns `USER_INVALID_ORGANIZATIONAL_LINK`. |
| T3 | Complete | `test/modules/orgaos/application/orgao_setor.services.spec.ts:287` asserts allowed sector move; `test/modules/orgaos/application/orgao_setor.services.spec.ts:312` asserts linked-user move rejection with `SETOR_HAS_LINKED_USERS` and no save. |

---

## Spec-Anchored Acceptance Criteria

| AC | Spec-defined outcome | `file:line` + assertion | Result |
| --- | --- | --- | --- |
| UOR-P1-1 | `ADMIN` creates a tenant user with organizational identifiers and only verified-tenant references are persisted. | `test/modules/users/application/create_user.service.spec.ts:79` checks repository validation for all three references; `:110` asserts success; `:123` asserts saved user contains `localidadeId`, `orgaoId`, and `setorId`; `test/identity.e2e-spec.ts:391` exercises HTTP creation with all three ids and `:431` asserts the response returns them. | PASS |
| UOR-P1-2 | Missing organizational identifier in the verified tenant returns HTTP 404 with registered code. | `test/identity.e2e-spec.ts:452` maps a missing organization reference to HTTP 404; `:481` asserts `LOCALIDADE_NOT_FOUND`; `test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts:74` and `:145` assert registered 404 codes for missing parent references. | PASS |
| UOR-P1-3 | Sector not belonging to supplied organization returns HTTP 400 with registered code. | `test/modules/users/application/create_user.service.spec.ts:128` creates a sector response with a different `orgaoId`; `:157` asserts failure; `:160` asserts `USER_INVALID_ORGANIZATIONAL_LINK` and status `400`. | PASS |
| UOR-P2-1 | Sector with linked users cannot move to another organization; service returns HTTP 422 code and does not save. | `test/modules/orgaos/application/orgao_setor.services.spec.ts:312` sets `countLinkedUsers` to `1`; `:329` asserts `SETOR_HAS_LINKED_USERS`; `:330` asserts status `422`; `:332` asserts save is not called. | PASS |
| UOR-P2-2 | Sector with no linked users can move to a verified destination organization and returns updated record. | `test/modules/orgaos/application/orgao_setor.services.spec.ts:287` covers destination move; `:303` asserts updated `orgaoId`; `:307` asserts destination organization validation; `test/modules/orgaos/controller/orgao.controller.e2e-spec.ts:432` covers HTTP sector move and `:439` asserts returned destination `orgaoId`. | PASS |

**Status**: PASS. 5/5 acceptance outcomes have direct evidence or matching existing repository evidence.

---

## Edge Cases

- [x] Missing tenant context rejects user provisioning before persistence: `test/modules/users/application/create_user.service.spec.ts:166` asserts failure, `:176` and `:177` assert no repository lookup/save, and `:179` asserts `USER_CREATE_FORBIDDEN`.
- [x] Non-admin HTTP user provisioning is stopped by `RoleDecorator`/`RolePipe`: `test/identity.e2e-spec.ts:243` sends `USER` role, expects `401`, and `:262` asserts the use case was not called.
- [x] Superadmin provisioning can target another tenant: `test/identity.e2e-spec.ts:339` sends a superadmin token; `:378` asserts the selected `tenantId` reaches the use case.
- [x] Out-of-scope HTTP user update was removed; `src/modules/auth/controller/user_provisioning.controller.ts` exposes only `POST /api/users`.

---

## Gate Check

| Command | Result |
| --- | --- |
| `docker compose exec api pnpm test -- test/modules/users/application/create_user.service.spec.ts test/modules/orgaos/application/orgao_setor.services.spec.ts` | PASS: 2 suites, 27 tests. |
| `docker compose exec api pnpm run test:e2e -- test/identity.e2e-spec.ts` | PASS: 1 suite, 15 tests. |
| `docker compose exec api pnpm run test:integration -- test/modules/users/infra/repositories/user.repository.spec.ts test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts` | PASS: 2 suites, 8 tests. |
| `docker compose exec api pnpm run build` | PASS. |

---

## Code Quality

| Principle | Status |
| --- | --- |
| Surgical changes | PASS |
| No update-user scope creep | PASS |
| Matches repository patterns | PASS |
| Spec-anchored asserted outcomes | PASS |
| Per-layer coverage expectation | PASS |

---

## Requirement Traceability

| Requirement | Previous Status | Verified Status |
| --- | --- | --- |
| UOR-01 | Pending | Verified |
| UOR-02 | Pending | Verified |
| UOR-03 | Pending | Verified |

## Summary

**Overall**: Ready.

**Spec-anchored check**: 5/5 ACs matched the spec-defined outcome.
**Gate**: build, focused unit, focused e2e, and focused integration passed.
