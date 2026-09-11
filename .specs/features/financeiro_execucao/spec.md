# Financeiro Execução Specification

## Problem Statement

O legado executa o financeiro da obra via `empenho, liquidacao, pagamento` com `CHECK valor>0`, herança `liquidacao/pagamento → empenho → obra/fonte` e `visao-fisico-financeira` consolidada. O novo backend só tem `fontes` (create/list); falta toda a cadeia de execução orçamentária, impedindo controle de restos, fluxo e aderência à `fonte` ativa. Esta spec implanta o FinanceiroContext no padrão tenant-schema.

## Goals

- [ ] CRUD de `empenhos` por `obra+fonte` com validação `valor>0` e `fonte` ativa no tenant.
- [ ] CRUD de `liquidacoes` por empenho com herança de `obraId` via empenho.
- [ ] CRUD de `pagamentos` por `empenho/liquidacao` com cascata em tenant scope.
- [ ] `visao-fisico-financeira` por obra consolidando `empenhado/liquidado/pago vs físico` já vindo do cronograma.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Gestão de fontes (CRUD completo) | `fontes` já tem create/list; edição/inativação fica fora. |
| Cronograma/estágios | `cronograma_medicoes`. |
| Contratos | `contratos_gestao`. |
| Relatórios consolidados PDF | `relatorios_exportacao`. |
| Migração histórica | Fora do escopo. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Persistência | `empenho, liquidacao, pagamento` em schema do tenant (`CriarFinanceiro`) + `fonte` já existe | Reprodus legado `1781207000000` | y |
| Herança | `liquidacao` e `pagamento` não têm `obraId` próprio; herdam via `empenho` (RN-FIN-01) | Evita divergência obra/fonte | y |
| Valor | `CHECK valor>0` (RN-FIN-10) + RLS por tenant (RN-FIN-11) | Integridade | y |
| Visão | `GET /api/obras/{id}/visao-fisico-financeira` agrega `fonte-lookup` + cronograma | Reuso de `fonte-lookup.service.ts` legado | y |
| Paginação | `PageOptions` para listagens de empenhos/liquidacoes/pagamentos | Padrão core | y |

**Open questions:** none.

## User Stories

### P1: Empenhos ⭐ MVP

**User Story**: As a tenant user, I want to register commitments so that budget execution starts with a valid source.

**Why P1**: Empenho é a origem da cadeia financeira.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras/{obraId}/empenhos` with `fonteId, tipo ORDINARIO/ESTIMATIVO/GLOBAL, numero, dataEmpenho, valor` THEN the system SHALL create the empenho linked to obra/fonte in tenant scope and SHALL return HTTP 201. <!-- event-driven -->
2. WHEN the user lists `GET /api/obras/{obraId}/empenhos` THEN the system SHALL return empenhos of that obra paginated and tenant-scoped. <!-- event-driven -->
3. IF `valor <= 0` THEN the system SHALL reject with HTTP 422 and code `FINANCEIRO_VALOR_INVALIDO`. <!-- unwanted-behavior -->
4. IF `fonteId` inactive or from another tenant THEN the system SHALL return HTTP 422 with code `FONTE_NOT_FOUND` via `fonte-lookup`. <!-- unwanted-behavior -->
5. IF `obraId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `OBRA_NOT_FOUND`. <!-- unwanted-behavior -->
6. The system SHALL require `AccessTokenGuard` for all financeiro routes. <!-- ubiquitous -->

**Independent Test**: Create empenho válido, listar, tentar valor 0 e fonte inativa.

### P2: Liquidações e pagamentos

**User Story**: As a tenant user, I want to liquidate and pay commitments so that execution follows the legal flow.

**Why P2**: Liquidação e pagamento completam a cadeia.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras/{obraId}/liquidacoes` with `empenhoId, dataLiquidacao, valor` THEN the system SHALL create the liquidation linked to that empenho and tenant and SHALL validate `valor>0`. <!-- event-driven -->
2. WHEN the user posts `POST /api/obras/{obraId}/pagamentos` with `empenhoId, liquidacaoId?, dataPagamento, valor` THEN the system SHALL create the payment inheriting obra via empenho and SHALL validate consistency `pagamento.valor <= liquidacao.valor` when `liquidacaoId` supplied. <!-- event-driven -->
3. WHEN the user lists `GET /api/obras/{obraId}/liquidacoes` or `/pagamentos` THEN the system SHALL return paginated results tenant-scoped. <!-- event-driven -->
4. IF `empenhoId`/`liquidacaoId` not in same obra/tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
5. The system SHALL keep all financeiro writes tenant-scoped and SHALL enforce RLS. <!-- ubiquitous -->

**Independent Test**: Create liquidacao para empenho, criar pagamento vinculado, listar ambos.

### P3: Visão físico-financeira

**User Story**: As a tenant user, I want a physical-financial view so that deviations are visible.

**Why P3**: Consolida físico (cronograma) + financeiro.

**Acceptance Criteria**:

1. WHEN the user gets `GET /api/obras/{obraId}/visao-fisico-financeira` THEN the system SHALL return `empenhado, liquidado, pago, percentualFisico, percentualFinanceiro` computed from empenhos/liquidacoes/pagamentos + cronograma for that obra and tenant. <!-- event-driven -->
2. IF the obra has no financial records THEN the system SHALL return zeros and not fail. <!-- unwanted-behavior -->
3. IF `obraId` belongs to another tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
4. The system SHALL keep visão tenant-scoped and SHALL not mix sources across tenants. <!-- ubiquitous -->

**Independent Test**: Create empenho+liquidacao+pagamento+estagio com acompanhamento, get visão e validar percentuais.

## Edge Cases

- IF empenho `numero` duplicates for same obra/fonte THEN the system SHALL return HTTP 409 with code `EMPENHO_DUPLICATE_NUMERO`. <!-- unwanted-behavior -->
- IF liquidacao `valor` exceeds empenho `valor` THEN the system SHALL reject with HTTP 422. <!-- unwanted-behavior -->
- IF two payments race on same liquidacao THEN the system SHALL apply atomic check without overspending. <!-- unwanted-behavior -->
- IF tenant context missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| FIN-01 | P1: Empenhos | Design | Pending |
| FIN-02 | P1: Empenhos | Design | Pending |
| FIN-03 | P1: Empenhos | Design | Pending |
| FIN-04 | P1: Empenhos | Design | Pending |
| FIN-05 | P1: Empenhos | Design | Pending |
| FIN-06 | P1: Empenhos | Design | Pending |
| FIN-07 | P2: Liquidações e pagamentos | Design | Pending |
| FIN-08 | P2: Liquidações e pagamentos | Design | Pending |
| FIN-09 | P2: Liquidações e pagamentos | Design | Pending |
| FIN-10 | P2: Liquidações e pagamentos | Design | Pending |
| FIN-11 | P2: Liquidações e pagamentos | Design | Pending |
| FIN-12 | P3: Visão físico-financeira | Design | Pending |
| FIN-13 | P3: Visão físico-financeira | Design | Pending |
| FIN-14 | P3: Visão físico-financeira | Design | Pending |
| FIN-15 | P3: Visão físico-financeira | Design | Pending |

## Success Criteria

- [ ] Tenant registra empenho→liquidação→pagamento com validações `valor>0` e `fonte` ativa.
- [ ] `visao-fisico-financeira` consolida físico+financeiro corretamente por obra.
- [ ] Testes cobrem chain completa e isolamento por tenant.

