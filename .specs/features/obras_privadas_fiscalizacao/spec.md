# Obras Privadas Fiscalização Specification

## Problem Statement

O novo backend só cria `obra privada` básica (com `codigo OBP-<ano>-NNNN` e `situacaoAlvara SEM_ALVARA`). O legado completa com `alvaras, habite-se, licenciamento, fiscalizacoes (incluindo bloco CONAMA 307), autos-infracao com prazos, responsaveis técnicos com vigência, observacoes, timeline, pessoas/profissionais técnicos e arquivos por obra privada` (9 controllers). Sem isso a fiscalização municipal fica inoperável. Esta spec fecha a lacuna privada no padrão tenant-schema.

## Goals

- [ ] `alvaras` e `habite-se` por `obraPrivadaId` com vigência e `situacaoAlvara` derivada.
- [ ] `fiscalizacoes` com bloco `entulho CONAMA 307`, `licenciamento` e `timeline` consolidada.
- [ ] `autos-infracao` com prazos (`prazo-auto-infracao.ts`) e resumo `autos/resumo`.
- [ ] `responsaveis, observacoes, arquivos` e consultas `pessoas/profissionais-tecnicos` scoped por tenant, com `timeline` e `no-mesmo-imovel`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Criação base de obra privada | Já em `obras_publicas_privadas`. |
| Gestão pública (estágios/contratos/financeiro público) | Outras specs. |
| Relatórios consolidados privados (PDFs em lote) | `relatorios_exportacao`. |
| Migração histórica | Fora do escopo. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Persistência | `obra_privada, fiscalizacao, licenciamento, alvara, habite-se, auto_infracao, responsavel_tecnico, observacao, arquivo_privado` em schema do tenant (`CriarObrasPrivadas`) | Legado `1781209000000` | y |
| Alvará | `situacao-alvara.ts` deriva `SEM_ALVARA/COM_ALVARA/VENCIDO` por vigência | Legado `situacao-alvara.spec.ts` | y |
| Prazos | `prazo-auto-infracao.ts` calcula prazos de auto com dias úteis | Legado `prazo-auto-infracao.spec.ts` | y |
| Timeline | `timeline.ts` consolida eventos `fiscalizacao+alvara+auto+habite-se` ordenados | Legado `timeline.spec.ts` | y |
| Autorização | Mesmo guard de obra privada: só tenant dono gerencia sua carteira privada | Isolamento | y |
| Código | Reuso de `codigo_privado.service.ts` com `OBP-<ano>-NNNN` | Já implementado | y |

**Open questions:** none.

## User Stories

### P1: Alvarás e habite-se ⭐ MVP

**User Story**: As a tenant inspector, I want to manage permits and occupancy certificates so that private-work legality is tracked.

**Why P1**: `situacaoAlvara` é o estado central da obra privada.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras-privadas/{obraPrivadaId}/alvaras` with `numero, dataEmissao, dataValidade` THEN the system SHALL create the alvará linked to that `obraPrivadaId` and tenant and SHALL derive `situacaoAlvara` via `situacao-alvara`. <!-- event-driven -->
2. WHEN the user posts `POST /api/obras-privadas/{obraPrivadaId}/habite-se` THEN the system SHALL create the habite-se record for that obra and tenant. <!-- event-driven -->
3. WHEN the user lists `GET /api/obras-privadas/{obraPrivadaId}/alvaras` or `/habite-se` THEN the system SHALL return tenant-scoped lists ordered by `dataEmissao DESC`. <!-- event-driven -->
4. IF `obraPrivadaId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `OBRA_PRIVADA_NOT_FOUND`. <!-- unwanted-behavior -->
5. The system SHALL require `AccessTokenGuard` for all privada alvara/habite-se routes. <!-- ubiquitous -->

**Independent Test**: Create alvará, assert `situacaoAlvara=COM_ALVARA`, create habite-se, list.

### P2: Fiscalizações e licenciamento

**User Story**: As a tenant inspector, I want to log inspections and licensing so that municipal oversight is auditable.

**Why P2**: Fiscalização é o fluxo operacional.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras-privadas/{obraPrivadaId}/fiscalizacoes` with `dataFiscalizacao, situacao, entulho{conama307Fields}` THEN the system SHALL create the inspection including the `CONAMA 307` block tenant-scoped. <!-- event-driven -->
2. WHEN the user posts `POST /api/obras-privadas/{obraPrivadaId}/licenciamento` or `PUT /api/obras-privadas/licenciamento/{id}` THEN the system SHALL create/update the licensing record per etapa. <!-- event-driven -->
3. WHEN the user gets `GET /api/obras-privadas/{id}/timeline` THEN the system SHALL return consolidated `timeline` (fiscalizacoes+alvaras+autos+habite-se) ordered chronologically via `timeline.ts`. <!-- event-driven -->
4. WHEN the user gets `GET /api/obras-privadas/{id}/etapas` THEN the system SHALL return licenciamento stages for that privada. <!-- event-driven -->
5. The system SHALL keep all fiscalizacao/licenciamento writes tenant-scoped. <!-- ubiquitous -->

**Independent Test**: Create fiscalização com CONAMA 307, create licenciamento, get timeline, assert order.

### P3: Autos, responsáveis, observações, arquivos e consultas

**User Story**: As a tenant inspector, I want to issue infractions, manage technical responsibles/observations/files and query persons/professionals.

**Why P3**: Fecha o ciclo fiscalização→autuação→responsabilidade.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/obras-privadas/{obraPrivadaId}/autos` with `tipo, dataAuto, prazo` THEN the system SHALL create the auto and SHALL compute `dataPrazo` via `prazo-auto-infracao` and return `GET /api/obras-privadas/autos/resumo` aggregated per tenant. <!-- event-driven -->
2. WHEN the user manages `POST/DELETE /api/obras-privadas/{obraPrivadaId}/responsaveis` with `pessoaId/profissionalId, vigenteAte` THEN the system SHALL add/remove technical responsible with validity. <!-- event-driven -->
3. WHEN the user manages `POST /api/obras-privadas/{obraPrivadaId}/observacoes` THEN the system SHALL persist observation with `autorUsuarioId` and expose `GET /api/obras-privadas/{id}/timeline` including it. <!-- event-driven -->
4. WHEN the user posts `POST /api/obras-privadas/{obraPrivadaId}/arquivos` or `GET /api/obras-privadas-arquivos/{id}/url` THEN the system SHALL attach/fetch the private file via `storage_key` tenant-scoped. <!-- event-driven -->
5. WHEN the user queries `GET /api/pessoas/busca?q=` or `GET /api/profissionais-tecnicos/busca?q=` THEN the system SHALL return tenant-scoped search results paginated. <!-- event-driven -->
6. WHEN the user queries `GET /api/obras-privadas/{id}/no-mesmo-imovel` THEN the system SHALL return other privadas sharing same `inscricaoImobiliaria/endereco` in tenant scope. <!-- event-driven -->
7. The system SHALL require `AccessTokenGuard` for all above routes. <!-- ubiquitous -->

**Independent Test**: Create auto com prazo, add responsavel, post observacao, attach arquivo, busca pessoa, no-mesmo-imovel.

## Edge Cases

- IF alvará `dataValidade` before `dataEmissao` THEN the system SHALL reject with HTTP 422 and code `ALVARA_DATA_INVALIDA`. <!-- unwanted-behavior -->
- IF fiscalização `dataFiscalizacao` future beyond tolerance THEN the system SHALL reject with HTTP 400. <!-- unwanted-behavior -->
- IF auto `prazo` negative THEN the system SHALL reject with HTTP 400. <!-- unwanted-behavior -->
- IF tenant context missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PRV-01 | P1: Alvarás e habite-se | Design | Pending |
| PRV-02 | P1: Alvarás e habite-se | Design | Pending |
| PRV-03 | P1: Alvarás e habite-se | Design | Pending |
| PRV-04 | P1: Alvarás e habite-se | Design | Pending |
| PRV-05 | P1: Alvarás e habite-se | Design | Pending |
| PRV-06 | P2: Fiscalizações e licenciamento | Design | Pending |
| PRV-07 | P2: Fiscalizações e licenciamento | Design | Pending |
| PRV-08 | P2: Fiscalizações e licenciamento | Design | Pending |
| PRV-09 | P2: Fiscalizações e licenciamento | Design | Pending |
| PRV-10 | P2: Fiscalizações e licenciamento | Design | Pending |
| PRV-11 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |
| PRV-12 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |
| PRV-13 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |
| PRV-14 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |
| PRV-15 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |
| PRV-16 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |
| PRV-17 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |
| PRV-18 | P3: Autos, responsáveis, observações, arquivos e consultas | Design | Pending |

## Success Criteria

- [ ] Tenant gerencia alvarás/habite-se com `situacaoAlvara` derivada correta.
- [ ] Fiscalizações com CONAMA 307, licenciamento, timeline e `no-mesmo-imovel` funcionam tenant-scoped.
- [ ] Autos com `prazo-auto-infracao`, responsáveis/observações/arquivos e buscas cobertos por e2e.

