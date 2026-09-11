# Contratos Gestão Specification

## Problem Statement

O legado gere contratos vinculados à obra com `contrato, aditivo, paralisacao, empresa-contratada`, cálculo de prazo de execução (`calculo-prazo-execucao`) e eventos. O novo backend não possui nenhuma dessas entidades/rotas, impedindo gestão contratual e apuração de prazo final/valores. Esta spec traz o bounded context Contratos para o novo padrão tenant-schema.

## Goals

- [ ] CRUD de `contratos` por obra com `prazo-final` e `valores` calculados.
- [ ] CRUD de `aditivos` por contrato com validação de datas/valores.
- [ ] CRUD de `paralisacoes` com `reinicio` e recálculo de prazo.
- [ ] CRUD de `empresas-contratadas` com vínculo a contrato.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Cronograma/estágios | `cronograma_medicoes`. |
| Financeiro/empenhos | `financeiro_execucao`. |
| Documentos/arquivos | `documentos_gestao`. |
| Migração histórica | Fora do escopo. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Persistência | `contrato, aditivo, paralisacao, empresa_contratada` em schema do tenant + `CriarContratosContext` | Reproduz legado `1781205000000` | y |
| Cálculo de prazo | `calculo-prazo-execucao.service` centraliza prazo considerando aditivos e paralisações | Domínio já validado em legado `calculo-prazo-execucao.spec.ts` | y |
| Autorização | Mesmo guard de obra: só tenant dono da obra gerencia seus contratos | Isolamento | y |
| Validação de empresa | `empresa-contratada` vinculada a contrato do mesmo tenant | Consistência | y |

**Open questions:** none.

## User Stories

### P1: Contratos por obra ⭐ MVP

**User Story**: As a tenant user, I want to create and manage contracts for a work so that contractual execution is tracked.

**Why P1**: Sem contrato não há prazo/valores oficiais.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/contratos` with `obraId, numero, dataInicio, prazoDias, valor` THEN the system SHALL create the contract scoped to that obra and tenant and SHALL return HTTP 201. <!-- event-driven -->
2. WHEN the user lists `GET /api/contratos?obraId=` or `GET /api/obras/{id}/contratos` THEN the system SHALL return contracts of that obra paginated and tenant-scoped. <!-- event-driven -->
3. WHEN the user gets `GET /api/contratos/{id}/prazo-final` THEN the system SHALL compute prazo final via `calculo-prazo-execucao` considering `aditivos+paralisacoes`. <!-- event-driven -->
4. WHEN the user gets `GET /api/contratos/{id}/valores` THEN the system SHALL return valor original + aditivos consolidado. <!-- event-driven -->
5. IF `obraId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `CONTRATO_NOT_FOUND`. <!-- unwanted-behavior -->
6. The system SHALL require `AccessTokenGuard` for all contrato routes. <!-- ubiquitous -->

**Independent Test**: Create obra, create contrato, get prazo-final/valores, list.

### P2: Aditivos e paralisações

**User Story**: As a tenant user, I want to register amendments and stoppages so that deadline and amount stay coherent.

**Why P2**: Aditivos/paralisações alteram prazo/valores.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/contratos/{contratoId}/aditivos` THEN the system SHALL create the aditivo linked to contrato/tenant and SHALL validate `data/valor/prazoAdicional`. <!-- event-driven -->
2. WHEN the user posts `POST /api/contratos/{contratoId}/paralisacoes` THEN the system SHALL create the stoppage with `dataInicio` and optional `dataFim`. <!-- event-driven -->
3. WHEN the user posts `POST /api/contratos/{contratoId}/paralisacoes/{id}/reinicio` with `dataReinicio` THEN the system SHALL close the stoppage and SHALL recalc prazo via `calculo-prazo-execucao`. <!-- event-driven -->
4. IF the aditivo/paralisacao targets a contrato of another tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
5. The system SHALL keep aditivo/paralisacao writes tenant-scoped and SHALL emit `EVENTOS_CONTRATOS`. <!-- ubiquitous -->

**Independent Test**: Create aditivo, create paralisacao, reiniciar, get prazo-final again.

### P3: Empresas contratadas

**User Story**: As a tenant user, I want to manage contracted companies so that responsibilities are traceable.

**Why P3**: Complemento contratual legado.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/empresas-contratadas` with `contratoId, cnpj, razaoSocial` THEN the system SHALL create the company linked to contrato/tenant. <!-- event-driven -->
2. WHEN the user lists `GET /api/empresas-contratadas?contratoId=` THEN the system SHALL return companies of that contract tenant-scoped. <!-- event-driven -->
3. IF `contratoId` belongs to another tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
4. The system SHALL validate `cnpj` format and uniqueness per contrato. <!-- ubiquitous -->

**Independent Test**: Create empresa, list, validate cnpj uniqueness.

## Edge Cases

- IF contrato `numero` duplicates in same obra THEN the system SHALL return HTTP 409 with code `CONTRATO_DUPLICATE_NUMERO`. <!-- unwanted-behavior -->
- IF aditivo `prazoAdicional` negative THEN the system SHALL reject with HTTP 400. <!-- unwanted-behavior -->
- IF paralisacao `dataReinicio` before `dataInicio` THEN the system SHALL reject with HTTP 422. <!-- unwanted-behavior -->
- IF tenant context missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CTR-01 | P1: Contratos por obra | Design | Pending |
| CTR-02 | P1: Contratos por obra | Design | Pending |
| CTR-03 | P1: Contratos por obra | Design | Pending |
| CTR-04 | P1: Contratos por obra | Design | Pending |
| CTR-05 | P1: Contratos por obra | Design | Pending |
| CTR-06 | P1: Contratos por obra | Design | Pending |
| CTR-07 | P2: Aditivos e paralisações | Design | Pending |
| CTR-08 | P2: Aditivos e paralisações | Design | Pending |
| CTR-09 | P2: Aditivos e paralisações | Design | Pending |
| CTR-10 | P2: Aditivos e paralisações | Design | Pending |
| CTR-11 | P2: Aditivos e paralisações | Design | Pending |
| CTR-12 | P3: Empresas contratadas | Design | Pending |
| CTR-13 | P3: Empresas contratadas | Design | Pending |
| CTR-14 | P3: Empresas contratadas | Design | Pending |
| CTR-15 | P3: Empresas contratadas | Design | Pending |

## Success Criteria

- [ ] Tenant cria/lista contratos, aditivos, paralisações e empresas com cálculo de prazo/valores correto.
- [ ] `calculo-prazo-execucao` reproduzido com testes unitários do legado.
- [ ] E2e cobre `contrato→aditivo→paralisacao→reinicio→prazo-final`.

