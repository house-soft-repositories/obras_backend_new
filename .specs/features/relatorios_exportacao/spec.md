# Relatórios e Exportação Specification

## Problem Statement

O legado consolida `relatorios` com `dashboard, desempenho-obra, fluxo-fisico-financeiro, listar-obras, quantificadores` e exportações `dossie-obra, relatorio-obra, exportar-lista` (incluindo `relatorios/obras-privadas` e PDFs por `fiscalizacaoId`). O novo backend só lista obras base; falta agregação, filtros avançados e geração de dossiê, bloqueando gestão e auditoria. Esta spec traz o contexto Relatórios no padrão de queries builder do legado.

## Goals

- [ ] `GET /api/relatorios/dashboard` agregado por tenant com quantificadores por `status/tipo/orgao`.
- [ ] `GET /api/relatorios/obras` com `filtro-obras.builder` (texto, status, tipo, orgao, periodo) paginado.
- [ ] `GET /api/relatorios/fluxo-fisico-financeiro` e `desempenho-obra` por obra/periodo.
- [ ] `exportar-lista` e `dossie-obra`/`relatorio-obra` por `obraId` (PDF/stream) e `relatorios/obras-privadas/**`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Gestão transacional de obra/cronograma/financeiro | Outras specs. |
| Bucket/armazenamento dos PDFs | Stream direto; persistência fora do escopo. |
| Migração histórica | Fora do escopo. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Queries | `dashboard.query, desempenho-obra.query, fluxo-fisico-financeiro.query, listar-obras.query, quantificadores-obras.query, filtro-obras.builder` reproduzidos em tenant schema | Legado `queries/` já validado em `__tests__/dashboard.spec.ts` | y |
| Filtros | Filtro de obras reutiliza campos de `obras_gestao_completa` (status, tipo, orgaoId, texto, periodo) | Consistência com listagem | y |
| Exportação | `dossie-obra.dominio` monta agregado obra+cronograma+financeiro+documentos por obra | Legado `exportacao/dossie-obra.dominio.ts` | y |
| Autorização | Apenas tenant dono vê seus relatórios; `AccessTokenGuard` | Isolamento | y |
| Paginação | `PageOptions` onde aplicável; exportação lista respeita filtros mas não pagina PDF | Padrão core | y |

**Open questions:** none.

## User Stories

### P1: Dashboard e listar obras ⭐ MVP

**User Story**: As a tenant manager, I want a dashboard and filtered work list so that portfolio health is visible.

**Why P1**: Visão gerencial mínima.

**Acceptance Criteria**:

1. WHEN the user calls `GET /api/relatorios/dashboard` THEN the system SHALL return `quantificadores` by `status, tipo, orgao` aggregated only for caller tenant. <!-- event-driven -->
2. WHEN the user calls `GET /api/relatorios/obras` with `filtro` (texto, status, tipo, orgaoId, periodo) and `PageOptions` THEN the system SHALL return paginated obras matching `filtro-obras.builder` tenant-scoped. <!-- event-driven -->
3. IF the filter references `orgaoId` of another tenant THEN the system SHALL return empty list and SHALL not leak. <!-- unwanted-behavior -->
4. The system SHALL require `AccessTokenGuard` for all relatorios routes. <!-- ubiquitous -->

**Independent Test**: Create obras com statuses distintos, call dashboard and listar with filter, assert counts.

### P2: Desempenho e fluxo físico-financeiro

**User Story**: As a tenant manager, I want performance and physical-financial flow so that deviations are tracked.

**Why P2**: Consolida cronograma+financeiro.

**Acceptance Criteria**:

1. WHEN the user calls `GET /api/relatorios/fluxo-fisico-financeiro?obraId=` THEN the system SHALL return series `fisico vs financeiro` by period computed via `fluxo-fisico-financeiro.query` tenant-scoped. <!-- event-driven -->
2. WHEN the user calls `GET /api/relatorios/desempenho?obraId=` THEN the system SHALL return `desempenho-obra` via `desempenho.logic` for that obra and tenant. <!-- event-driven -->
3. IF `obraId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `OBRA_NOT_FOUND`. <!-- unwanted-behavior -->
4. The system SHALL keep all flow/desempenho reads tenant-scoped. <!-- ubiquitous -->

**Independent Test**: With cronograma+financeiro seeded, call both endpoints and validate series.

### P3: Exportação e dossiê

**User Story**: As a tenant manager, I want to export the filtered list and a full dossier per work.

**Why P3**: Auditoria e prestação de contas.

**Acceptance Criteria**:

1. WHEN the user calls `GET /api/relatorios/obras/exportar?filtro=` THEN the system SHALL stream a CSV/XLSX of the filtered obras via `exportar-lista.service` tenant-scoped. <!-- event-driven -->
2. WHEN the user calls `GET /api/relatorios/obras/{obraId}/dossie.pdf` or `GET /api/relatorios/obras/{obraId}/relatorio` THEN the system SHALL generate the dossier via `dossie-obra.service` aggregating obra+cronograma+financeiro+documentos for that tenant obra. <!-- event-driven -->
3. WHEN the user calls `GET /api/relatorios/obras-privadas/{obraPrivadaId}/dossie.pdf` or `fiscalizacoes/{id}/relatorio.pdf` THEN the system SHALL generate the private-work dossier/report tenant-scoped. <!-- event-driven -->
4. IF the obra/privada belongs to another tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
5. The system SHALL set `Content-Disposition: attachment` and correct mime for exports. <!-- ubiquitous -->

**Independent Test**: Exportar lista com filtro, get dossie PDF header `%PDF`, verify tenant isolation.

## Edge Cases

- IF dashboard has zero obras THEN the system SHALL return zeroed quantificadores and not fail. <!-- unwanted-behavior -->
- IF export with huge result THEN the system SHALL stream without loading all in memory or SHALL paginate internally. <!-- unwanted-behavior -->
- IF dossie requested for deleted obra THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
- IF tenant context missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| REL-01 | P1: Dashboard e listar obras | Design | Pending |
| REL-02 | P1: Dashboard e listar obras | Design | Pending |
| REL-03 | P1: Dashboard e listar obras | Design | Pending |
| REL-04 | P1: Dashboard e listar obras | Design | Pending |
| REL-05 | P2: Desempenho e fluxo físico-financeiro | Design | Pending |
| REL-06 | P2: Desempenho e fluxo físico-financeiro | Design | Pending |
| REL-07 | P2: Desempenho e fluxo físico-financeiro | Design | Pending |
| REL-08 | P2: Desempenho e fluxo físico-financeiro | Design | Pending |
| REL-09 | P3: Exportação e dossiê | Design | Pending |
| REL-10 | P3: Exportação e dossiê | Design | Pending |
| REL-11 | P3: Exportação e dossiê | Design | Pending |
| REL-12 | P3: Exportação e dossiê | Design | Pending |
| REL-13 | P3: Exportação e dossiê | Design | Pending |

## Success Criteria

- [ ] Dashboard/listar retornam quantificadores e lista filtrada corretos por tenant.
- [ ] Fluxo e desempenho reproduzem queries do legado com testes de query builder.
- [ ] Exportar lista e dossie geram arquivos com `Content-Disposition` e isolamento por tenant.

