# Obras Gestão Completa Specification

## Problem Statement

O legado suporta o ciclo completo de obras públicas além da criação: listagem paginada com filtros, consulta detalhada, atualização parcial com transição de status controlada, duplicação com novo código sequencial, e sub-recursos de equipe (responsáveis/seguidores), tags, observações, guias, localizações, titularidade, licenças e recebimentos. O novo backend hoje só cria obras com ~14 campos, sem esses fluxos, e persiste modelo incompleto. Esta spec fecha a lacuna do agregado Obras no nível necessário para operar a carteira sem recorrer ao legado.

## Goals

- [ ] Expor listagem paginada de obras com filtros por `status, tipo, orgaoId, texto` e ordenação, isolada por tenant.
- [ ] Expor consulta detalhada e atualização parcial de obra com validação de `subclassificacaoId` (apenas quando `tipo=OBRA`) e transição de status conforme RN-OBR-02.
- [ ] Suportar duplicação de obra gerando novo `codigo OBR-<ano>-NNNN` sem reutilizar código de soft-delete e copiando `orcamentos/responsaveis/tags` base.
- [ ] Gerenciar equipe: adicionar/remover `responsaveis, corresponsaveis, seguidores` com isolamento por tenant e idempotência.
- [ ] Gerenciar `tags` e `observacoes` por obra com criação, listagem e remoção sob autorização do tenant.
- [ ] Persistir o modelo completo do legado (20+ colunas faltantes: `tipoFinanciamento, modoDuracao, dataInicio, dataPrazo, acaoConveniada, prioritaria, exibirCameraAoVivo, cameraUrl, privado, invisivel, considerarSabado/Domingo, vincularPagamentoPercentual, corresponsaveisPodemEditar, programaPpa, acaoEstrategica, acaoOrcamentaria, unidadeMedida, quantidade, secretario, dataPactuada`) com soft-delete via `deletedAt`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cronograma/estágios/medições | Pertence a `cronograma_medicoes`. |
| Contratos/aditivos/paralisações | Pertence a `contratos_gestao`. |
| Empenhos/liquidações/pagamentos | Pertence a `financeiro_execucao`. |
| Pastas/arquivos | Pertence a `documentos_gestao`. |
| Relatórios/dashboard/dossiê | Pertence a `relatorios_exportacao`. |
| Migração histórica de dados | Legado serve como referência, não cópia. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Modelo de persistência | Tenant-scoped schema via `TenantContext.require()` com colunas nullable para campos opcionais | Preserva isolamento e compatibilidade com migration `CreateObrasContext` | y |
| Código sequencial | `OBR-<ano>-NNNN` com retry em colisão `23505` e nunca reutiliza soft-deleted | Contrato legado imutável e auditável | y |
| Autorização | Apenas usuário autenticado do tenant pode listar/consultar/atualizar/duplicar/gerenciar equipe/tags/observacoes da própria carteira | Evita vazamento cross-tenant | y |
| Validação de vínculos | `orgaoId, setorId, localidadeId, eixoId, classificacaoId, subclassificacaoId, tipologiaId, subtipologiaId` devem existir no tenant | Impede obra órfã | y |
| Transição de status | Status alterado via `PATCH /obras/{id}` dispara validações de `StatusObra` e eventos `EVENTOS_OBRA` | RN-OBR-02 do legado | y |
| Paginação | Usa `PageOptions + PageMeta` já existente no core | Reuso sem nova infra | y |

**Open questions:** none.

## User Stories

### P1: Listar, consultar e atualizar obra ⭐ MVP

**User Story**: As a tenant user, I want to list, view and partially update a public work so that I can operate the portfolio without recreating records.

**Why P1**: Sem consulta/listagem/atualização a carteira é inoperável.

**Acceptance Criteria**:

1. WHEN an authenticated tenant user calls `GET /api/obras` with `PageOptions` THEN the system SHALL return a `Page<Obra>` filtered by `status, tipo, orgaoId, q` and ordered by `createdAt DESC`, scoped to the caller tenant. <!-- event-driven -->
2. WHEN the caller requests `GET /api/obras/{id}` for an obra of his tenant THEN the system SHALL return the obra with its `orcamentos, responsaveis, seguidores` and all model columns. <!-- event-driven -->
3. WHEN the caller sends `PATCH /api/obras/{id}` with partial fields THEN the system SHALL validate `subclassificacaoId` only when `tipo=OBRA` and SHALL persist only the supplied fields. <!-- event-driven -->
4. IF `subclassificacaoId` is supplied while `tipo != OBRA` THEN the system SHALL reject with HTTP 400 and code `OBRA_INVALID_SUBCLASSIFICACAO`. <!-- unwanted-behavior -->
5. IF the obra belongs to another tenant THEN the system SHALL return HTTP 404 with code `OBRA_NOT_FOUND` and SHALL not leak existence. <!-- unwanted-behavior -->
6. WHILE an obra is soft-deleted the system SHALL exclude it from list/get/update and SHALL keep its `codigo` unreusable. <!-- state-driven -->
7. The system SHALL require `AccessTokenGuard` for all obra read/write routes. <!-- ubiquitous -->

**Independent Test**: Create 2 obras, list with filter `status=EM_ABERTO`, get by id, patch `nome` and verify `tipo/subclassificacao` rule.

### P2: Duplicar obra

**User Story**: As a tenant user, I want to duplicate a work so that a similar work can be created with a new sequential code.

**Why P2**: Evita retrabalho de cadastro e preserva o padrão `OBR-<ano>-NNNN`.

**Acceptance Criteria**:

1. WHEN the caller posts `POST /api/obras/{id}/duplicar` THEN the system SHALL create a new obra copying `nome, descricao, tipo, orgaoId, subclassificacao/orcamentos/tags` and SHALL generate a new `codigo` in the same tenant-year sequence. <!-- event-driven -->
2. IF the source obra is soft-deleted or belongs to another tenant THEN the system SHALL return HTTP 404 with code `OBRA_NOT_FOUND`. <!-- unwanted-behavior -->
3. The system SHALL copy `obra_orcamentos` and `obra_responsaveis` base but SHALL not copy `deletedAt` or historical `estagios/medicoes`. <!-- ubiquitous -->

**Independent Test**: Duplicate an obra, assert new `codigo != origem` and same `orcamentos.length`.

### P3: Equipe, tags e observações

**User Story**: As a tenant user, I want to manage responsibles/followers/tags/observations so that collaboration and classification happen inside the work.

**Why P3**: São sub-recursos diários do legado (`equipe/tags/observacoes`).

**Acceptance Criteria**:

1. WHEN the caller manages `POST /api/obras/{id}/equipe/responsaveis` or `seguidores` THEN the system SHALL add/remove the relation idempotently and SHALL validate `usuarioId` exists in tenant. <!-- event-driven -->
2. WHEN the caller manages `POST/DELETE /api/obras/{id}/tags` THEN the system SHALL attach/detach tags scoped to tenant. <!-- event-driven -->
3. WHEN the caller posts `POST /api/obras/{id}/observacoes` THEN the system SHALL persist the observation with `criadoPorUsuarioId` and timestamp and SHALL return it on `GET /api/obras/{id}/observacoes`. <!-- event-driven -->
4. IF any team/tag/observation targets an obra of another tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
5. The system SHALL keep all team/tag/observation writes tenant-scoped and SHALL audit `criadoPorUsuarioId`. <!-- ubiquitous -->

**Independent Test**: Add corresponsavel, add tag, post observation, list each and remove tag.

## Edge Cases

- IF a patch tries to set `codigo` THEN the system SHALL ignore or reject the field and SHALL never persist caller-supplied code. <!-- unwanted-behavior -->
- IF two updates race on same obra THEN the system SHALL apply last-write-wins at row level without duplicating `codigo`. <!-- unwanted-behavior -->
- IF a client sends unknown fields on list/get/patch THEN the system SHALL reject via global `ValidationPipe` (`whitelist + forbidNonWhitelisted`). <!-- unwanted-behavior -->
- IF the tenant context is missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| OGC-01 | P1: Listar, consultar e atualizar obra | In Design | Pending |
| OGC-02 | P1: Listar, consultar e atualizar obra | In Design | Pending |
| OGC-03 | P1: Listar, consultar e atualizar obra | In Design | Pending |
| OGC-04 | P1: Listar, consultar e atualizar obra | In Design | Pending |
| OGC-05 | P1: Listar, consultar e atualizar obra | In Design | Pending |
| OGC-06 | P1: Listar, consultar e atualizar obra | In Design | Pending |
| OGC-07 | P1: Listar, consultar e atualizar obra | In Design | Pending |
| OGC-08 | P2: Duplicar obra | In Design | Pending |
| OGC-09 | P2: Duplicar obra | In Design | Pending |
| OGC-10 | P2: Duplicar obra | In Design | Pending |
| OGC-11 | P3: Equipe, tags e observações | In Design | Pending |
| OGC-12 | P3: Equipe, tags e observações | In Design | Pending |
| OGC-13 | P3: Equipe, tags e observações | In Design | Pending |
| OGC-14 | P3: Equipe, tags e observações | In Design | Pending |
| OGC-15 | P3: Equipe, tags e observações | In Design | Pending |

## Success Criteria

- [ ] Tenant lista, consulta, atualiza, duplica obra e gerencia equipe/tags/observacoes sem tocar legado.
- [ ] Modelo completo com 20+ colunas persistido e `codigo` imutável por tenant-ano.
- [ ] Testes de unidade + integração + e2e cobrem list/update/duplicar/equipe isolation.

