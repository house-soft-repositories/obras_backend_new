# Cronograma e Medições Specification

## Problem Statement

O legado orquestra o cronograma físico da obra via `estagios` com estados, `acompanhamentos` (percentual/quantidade), `comentarios`, e `medicoes` com `medicao-fonte`, além de serviços de domínio como `calculo-datas, conclusao-estagio, estagio-atual, duplicar-estagio, estagios-predefinidos` e reordenação. O novo backend não possui nenhuma dessas tabelas/rotas, bloqueando acompanhamento físico, físico-financeiro e relatórios. Esta spec traz o bounded context Cronograma para o novo padrão Clean Arch + tenant schema.

## Goals

- [ ] CRUD de `estagios` por obra com reordenação por posição, lote e predefinidos, isolado por tenant.
- [ ] Transições de estágio: `assumir, concluir, duplicar` com validações de datas e cálculo de `estagio-atual`.
- [ ] `acompanhamentos` por estágio com percentual direto e datas agregadas, e `comentarios` com autor.
- [ ] `medicoes` por obra com `tipo NORMAL/RETIFICACAO/EXTRA/REAJUSTAMENTO`, itens por fonte e consulta paginada.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Gestão base da obra (criação/listagem) | Pertence a `obras_gestao_completa`. |
| Contratos e aditivos | Pertence a `contratos_gestao`. |
| Empenhos/liquidações/pagamentos | Pertence a `financeiro_execucao`. |
| Relatórios consolidados | Pertence a `relatorios_exportacao`. |
| Migração de histórico | Fora do escopo desta entrega. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Persistência | `estagio, estagio_acompanhamento, estagio_comentario, medicao, medicao_fonte` em schema do tenant | Segue `CriarCronogramaContext` + `CriarMedicoes` do legado | y |
| Autorização | Mesmo guard de obra: usuário do tenant vê/edita cronograma apenas de obras do seu tenant | Evita vazamento cross-tenant | y |
| Cálculo de datas | `calculo-datas` centraliza `dataInicio/dataFim` derivadas por `modoDuracao` | Reuso do domínio legado | y |
| Medição-fonte | Cada `medicao` referencia `fonte` existente e ativa no tenant | Consistência com `fonte-lookup` | y |
| Paginação | `PageOptions` para listagens de estágios e medições | Padrão já em `fontes/pessoas` | y |

**Open questions:** none.

## User Stories

### P1: Estágios e reordenação ⭐ MVP

**User Story**: As a tenant user, I want to create, list and reorder work stages so that the physical schedule reflects execution order.

**Why P1**: Sem estágios não há cronograma.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras/{obraId}/estagios` with `nome, posicao` THEN the system SHALL create the stage scoped to that obra and tenant and SHALL return HTTP 201. <!-- event-driven -->
2. WHEN the user lists `GET /api/obras/{obraId}/estagios` THEN the system SHALL return stages ordered by `posicao` paginated and SHALL not leak stages of other tenants. <!-- event-driven -->
3. WHEN the user posts `POST /api/obras/{obraId}/estagios/reordenar` with ordered ids THEN the system SHALL persist the new `posicao` for each stage atomically. <!-- event-driven -->
4. WHEN the user posts `POST /api/obras/{obraId}/estagios/lote` THEN the system SHALL create multiple stages in one transaction. <!-- event-driven -->
5. WHEN the user gets `GET /api/obras/{obraId}/estagios/predefinidos` THEN the system SHALL return stage templates by `tipoObra`. <!-- event-driven -->
6. IF `obraId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `CRONOGRAMA_NOT_FOUND`. <!-- unwanted-behavior -->
7. The system SHALL require `AccessTokenGuard` for all cronograma routes. <!-- ubiquitous -->

**Independent Test**: Create obra, create 3 stages, reorder, list and assert order.

### P2: Acompanhamentos e comentários

**User Story**: As a tenant user, I want to log stage follow-ups and comments so that physical progress is auditable.

**Why P2**: Acompanhamento alimenta percentual físico.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras/{obraId}/estagios/{estagioId}/acompanhamentos` THEN the system SHALL persist `percentual, data, observacao` linked to stage and obra in tenant scope. <!-- event-driven -->
2. WHEN the user posts `POST /api/obras/{obraId}/estagios/{estagioId}/comentarios` THEN the system SHALL persist comment with `autorUsuarioId` and timestamp. <!-- event-driven -->
3. WHEN the user gets `GET /api/obras/{obraId}/estagios/datas-agregadas` THEN the system SHALL return aggregated start/end dates computed via `calculo-datas`. <!-- event-driven -->
4. WHEN the user patches `PATCH /api/obras/{obraId}/estagios/{id}/percentual-direto` THEN the system SHALL update the direct percentage for that stage. <!-- event-driven -->
5. IF the stage does not belong to the obra/tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->

**Independent Test**: Create stage, post acompanhamento+comentario, get datas-agregadas, patch percentual.

### P3: Medições e transições de estágio

**User Story**: As a tenant user, I want to record measurements and conclude/duplicate stages so that billing and execution stay aligned.

**Why P3**: Fecha o ciclo cronograma→medição.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras/{obraId}/medicoes` with `tipo, dataMedicao, itens[{fonteId, valor}]` THEN the system SHALL create the measurement and its `medicao_fonte` rows scoped to tenant and SHALL validate each `fonteId` active. <!-- event-driven -->
2. WHEN the user lists `GET /api/obras/{obraId}/medicoes` THEN the system SHALL return paginated measurements ordered by `dataMedicao DESC`. <!-- event-driven -->
3. WHEN the user posts `POST /api/obras/{obraId}/estagios/{id}/concluir` THEN the system SHALL mark the stage as concluded via `conclusao-estagio` and SHALL emit `EVENTOS_CRONOGRAMA`. <!-- event-driven -->
4. WHEN the user posts `POST /api/obras/{obraId}/estagios/{id}/duplicar` THEN the system SHALL clone the stage with new id and next `posicao`. <!-- event-driven -->
5. WHEN the user gets `GET /api/obras/{obraId}/estagios/atual` THEN the system SHALL return the current stage computed by `estagio-atual`. <!-- event-driven -->
6. The system SHALL keep all cronograma/medicao writes tenant-scoped and SHALL reject cross-tenant `obraId`. <!-- ubiquitous -->

**Independent Test**: Create medicao with 2 fontes, list, concluir estágio, duplicar, get atual.

## Edge Cases

- IF a stage name is blank or posicao negative THEN the system SHALL reject with HTTP 400. <!-- unwanted-behavior -->
- IF a medicao references an unknown `fonteId` THEN the system SHALL return HTTP 422 with code `MEDICAO_FONTE_INVALIDA`. <!-- unwanted-behavior -->
- IF two reorders race THEN the system SHALL apply atomic reorder without duplicating positions. <!-- unwanted-behavior -->
- IF tenant context is missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CRO-01 | P1: Estágios e reordenação | Design | Pending |
| CRO-02 | P1: Estágios e reordenação | Design | Pending |
| CRO-03 | P1: Estágios e reordenação | Design | Pending |
| CRO-04 | P1: Estágios e reordenação | Design | Pending |
| CRO-05 | P1: Estágios e reordenação | Design | Pending |
| CRO-06 | P1: Estágios e reordenação | Design | Pending |
| CRO-07 | P1: Estágios e reordenação | Design | Pending |
| CRO-08 | P2: Acompanhamentos e comentários | Design | Pending |
| CRO-09 | P2: Acompanhamentos e comentários | Design | Pending |
| CRO-10 | P2: Acompanhamentos e comentários | Design | Pending |
| CRO-11 | P2: Acompanhamentos e comentários | Design | Pending |
| CRO-12 | P2: Acompanhamentos e comentários | Design | Pending |
| CRO-13 | P3: Medições e transições de estágio | Design | Pending |
| CRO-14 | P3: Medições e transições de estágio | Design | Pending |
| CRO-15 | P3: Medições e transições de estágio | Design | Pending |
| CRO-16 | P3: Medições e transições de estágio | Design | Pending |
| CRO-17 | P3: Medições e transições de estágio | Design | Pending |
| CRO-18 | P3: Medições e transições de estágio | Design | Pending |

## Success Criteria

- [ ] Tenant cria/reordena estágios, registra acompanhamentos/comentários e medições isolados por tenant.
- [ ] `estagio-atual, conclusao-estagio, calculo-datas, duplicar-estagio` reproduzidos com testes.
- [ ] E2e cobre `estagios→acompanhamentos→medicoes→atual`.

