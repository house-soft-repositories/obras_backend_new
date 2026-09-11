# Documentos Gestão Specification

## Problem Statement

O legado organiza documentos por `pastas` hierárquicas (auto-relacionamento `pasta_pai_id`, raiz = `null`) e `arquivos` com `storage_key` para bucket, indices de nome único entre irmãs, `storage_key` global unique, e listeners que criam pasta raiz ao criar/duplicar obra. O novo backend não possui esse contexto, impedindo anexação, hierarquia e navegação de arquivos por obra. Esta spec implanta o DocumentosContext.

## Goals

- [ ] CRUD hierárquico de `pastas` por obra com unicidade de nome entre irmãs (e raiz) e `pasta_pai_id` opcional.
- [ ] Gestão de `arquivos` com `storage_key` (presigned upload → confirmar → mover → download) e validação de `pasta_id` no mesmo obra/tenant.
- [ ] Criação automática de `pasta raiz` ao criar obra e ao duplicar (listener).
- [ ] Listagem `pastas/{id}/arquivos`, `obra/{id}/pastas/raiz` e `pastas` com paginação tenant-scoped.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Conteúdo binário do bucket (S3/MinIO) | Mantém `storage_key` + URLs presigned; bucket real fica em infra. |
| Cronograma/contratos/financeiro | Outras specs dedicadas. |
| Relatórios/dossiê PDF | `relatorios_exportacao`. |
| Migração histórica | Fora do escopo. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Persistência | `pasta, arquivo` em schema do tenant (`CriarDocumentos`) + RLS | Legado `1781208000000` | y |
| Raiz | `pasta_pai_id=null` representa raiz da obra (RN-DOC-01/02) | Unicidade parcial em legado | y |
| Unicidade | Índice parcial para nome único entre subpastas irmãs e para raiz | RN-DOC-14 | y |
| storage_key | `storage_key` único global, `arquivo.pasta_id → pasta CASCADE`, `criadoPorUsuarioId` uuid sem FK | RN-DOC-10/12 | y |
| Bucket | Presigned URLs via `storage-key` helper; `confirmar` valida upload | Reuso de `storage-key.ts` legado | y |

**Open questions:** none.

## User Stories

### P1: Pastas hierárquicas ⭐ MVP

**User Story**: As a tenant user, I want to create and navigate folders so that documents are organized per work.

**Why P1**: Sem hierarquia não há navegação.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/pastas` with `obraId, nome, pastaPaiId?` THEN the system SHALL create the folder scoped to that obra and tenant and SHALL return HTTP 201. <!-- event-driven -->
2. WHEN the user lists `GET /api/obras/{obraId}/pastas/raiz` THEN the system SHALL return the root children and `GET /api/pastas/{id}` returns the subtree. <!-- event-driven -->
3. IF `nome` duplicates among siblings (same `pastaPaiId` or both `null` at raiz) THEN the system SHALL return HTTP 409 with code `PASTA_DUPLICATE_NOME`. <!-- unwanted-behavior -->
4. IF `pastaPaiId` belongs to another obra/tenant THEN the system SHALL return HTTP 404 with code `PASTA_NOT_FOUND`. <!-- unwanted-behavior -->
5. IF `obraId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `OBRA_NOT_FOUND`. <!-- unwanted-behavior -->
6. The system SHALL require `AccessTokenGuard` for all pasta routes. <!-- ubiquitous -->

**Independent Test**: Create obra, create pasta raiz child, try duplicate name, create subpasta, list raiz.

### P2: Arquivos com storage_key

**User Story**: As a tenant user, I want to attach files to folders so that evidence is persisted via bucket.

**Why P2**: Arquivo é o ativo final.

**Acceptance Criteria**:

1. WHEN the user posts `POST /api/pastas/{pastaId}/arquivos` with `nome, storageKey, tamanho, mimeType` THEN the system SHALL create the file linked to `pasta/obra/tenant` and SHALL validate `storageKey` unique. <!-- event-driven -->
2. WHEN the user posts `POST /api/arquivos/{arquivoId}/confirmar` THEN the system SHALL mark the file as confirmed and SHALL not allow duplicate confirm. <!-- event-driven -->
3. WHEN the user posts `POST /api/arquivos/{arquivoId}/mover` with `destinoPastaId` THEN the system SHALL move the file if `destinoPastaId` belongs to same obra/tenant. <!-- event-driven -->
4. WHEN the user gets `GET /api/arquivos/{arquivoId}/download` THEN the system SHALL return a presigned URL for `storageKey` if file confirmed and tenant-owned. <!-- event-driven -->
5. IF `storageKey` duplicates globally THEN the system SHALL return HTTP 409 with code `ARQUIVO_DUPLICATE_STORAGE_KEY`. <!-- unwanted-behavior -->
6. The system SHALL keep all arquivo writes tenant-scoped and SHALL audit `criadoPorUsuarioId`. <!-- ubiquitous -->

**Independent Test**: Create arquivo, confirmar, mover para subpasta, download, tentar duplicate storageKey.

### P3: Pasta raiz automática

**User Story**: As a tenant user, I want the root folder auto-created so that every work starts with a container.

**Why P3**: Experiência do legado via listeners.

**Acceptance Criteria**:

1. WHEN an obra is created THEN the system SHALL automatically create a root `pasta` for that `obraId` in the same tenant schema. <!-- event-driven -->
2. WHEN an obra is duplicated THEN the system SHALL create a new root `pasta` for the duplicated obra and SHALL copy the folder tree (but not necessarily files) per `obra-duplicada.listener`. <!-- event-driven -->
3. IF obra creation fails THEN the system SHALL not leave orphan root folders. <!-- unwanted-behavior -->
4. The system SHALL keep listener writes tenant-scoped. <!-- ubiquitous -->

**Independent Test**: Create obra, assert `GET /obras/{id}/pastas/raiz` not empty; duplicate obra, assert new obra has its own raiz.

## Edge Cases

- IF pasta `nome` is blank THEN the system SHALL reject with HTTP 400. <!-- unwanted-behavior -->
- IF arquivo `tamanho` exceeds limit (e.g., 100MB) THEN the system SHALL reject with HTTP 413. <!-- unwanted-behavior -->
- IF presigned URL expired THEN `download` SHALL return HTTP 410 or regenerate URL. <!-- unwanted-behavior -->
- IF tenant context missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DOC-01 | P1: Pastas hierárquicas | Design | Pending |
| DOC-02 | P1: Pastas hierárquicas | Design | Pending |
| DOC-03 | P1: Pastas hierárquicas | Design | Pending |
| DOC-04 | P1: Pastas hierárquicas | Design | Pending |
| DOC-05 | P1: Pastas hierárquicas | Design | Pending |
| DOC-06 | P1: Pastas hierárquicas | Design | Pending |
| DOC-07 | P2: Arquivos com storage_key | Design | Pending |
| DOC-08 | P2: Arquivos com storage_key | Design | Pending |
| DOC-09 | P2: Arquivos com storage_key | Design | Pending |
| DOC-10 | P2: Arquivos com storage_key | Design | Pending |
| DOC-11 | P2: Arquivos com storage_key | Design | Pending |
| DOC-12 | P2: Arquivos com storage_key | Design | Pending |
| DOC-13 | P3: Pasta raiz automática | Design | Pending |
| DOC-14 | P3: Pasta raiz automática | Design | Pending |
| DOC-15 | P3: Pasta raiz automática | Design | Pending |
| DOC-16 | P3: Pasta raiz automática | Design | Pending |

## Success Criteria

- [ ] Tenant cria navega e move pastas/arquivos com unicidade entre irmãs e `storage_key` único.
- [ ] Pasta raiz auto-criada em `POST /obras` e `POST /obras/{id}/duplicar`.
- [ ] E2e cobre `pasta→arquivo→confirmar→mover→download` isolado por tenant.

