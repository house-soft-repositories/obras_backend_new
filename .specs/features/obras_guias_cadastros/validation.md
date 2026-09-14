# Obras Guias e Cadastros Validation

**Date**: 2026-09-14
**Spec**: `.specs/features/obras_guias_cadastros/spec.md`
**Verdict**: ⚠️ In progress — domain and application coverage pass; controller e2e and lint remediation remain pending.

## Evidence

- `docker compose exec api pnpm run build`: PASS.
- `docker compose exec api pnpm test --runInBand`: PASS — 47 suites, 194 tests.
- `test/modules/obras/domain/cadastros_guias.entity.spec.ts`: validates cadastro normalization and guia enum rules.
- `test/modules/obras/application/guias.service.spec.ts`: validates missing fonte rejection, titularidade create/update, missing recebimento and repository error propagation.
- API boot mapped the cadastros and guias routes successfully in `docker compose logs api`.

## Remaining work

- Add e2e coverage for cadastros and every guia CRUD route, including tenant isolation.
- Resolve lint findings in `GuiasService` and `GuiasRepository` before a final PASS verdict.
