# Cadastros de Órgãos e Setores Specification

## Problem Statement

Obras precisa de órgãos e setores tenant-isolados para identificar a responsabilidade administrativa de cada obra.

## Goals

- [x] Criar, listar e atualizar órgãos vinculados a localidades do mesmo tenant.
- [x] Criar, listar e atualizar setores vinculados a órgãos do mesmo tenant.
- [x] Criar as tabelas `orgaos` e `setores` no schema de cada tenancy durante seu provisionamento.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Exclusão | Exige política de referências de Obras. |
| Bloqueio de setor com usuários | Depende da spec de vínculos organizacionais. |
| `totalObras` | Obras ainda não existe. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- |
| Roles | `ADMIN` escreve todos; `STAFF` escreve localidades e setores; `USER` lê; `SUPERADMIN` sem tenant é bloqueado. | Mapeamento confirmado do legado. | y |
| Routes | `/api/orgaos` e `/api/orgaos/:orgaoId/setores`. | Preserva o contrato legado. | y |

**Open questions:** none.

## User Stories

### P1: Gerir órgãos

**User Story**: As a tenant administrator, I want organizations linked to localities.

**Acceptance Criteria**:

1. WHEN an `ADMIN` creates an organization with a verified-tenant locality THEN the system SHALL persist `nome`, `localidadeId`, optional `sigla`, `tipo`, `responsavel`, `email`, `telefone`, and active state. <!-- event-driven -->
2. WHEN an authorized tenant user lists organizations THEN the system SHALL return only verified-tenant organizations ordered by `nome` ascending. <!-- event-driven -->
3. WHEN an authorized writer updates an organization THEN the system SHALL persist supplied mutable fields including `ativo`. <!-- event-driven -->
4. IF locality, organization type, or email is invalid THEN the system SHALL return HTTP 400 with a registered code. <!-- unwanted-behavior -->
5. IF a referenced locality or organization is absent from the verified tenant THEN the system SHALL return HTTP 404 with a registered code. <!-- unwanted-behavior -->

6. WHEN a tenancy is provisioned THEN the system SHALL create the `orgaos` table in its generated schema before returning the tenancy. <!-- event-driven -->
7. WHEN the identity foundation migration is applied THEN the system SHALL create `orgaos` in every existing tenancy schema without altering existing records. <!-- event-driven -->

### P1: Gerir setores

**User Story**: As a tenant writer, I want sectors under organizations.

**Acceptance Criteria**:

1. WHEN an authorized writer creates a sector under a verified-tenant organization THEN the system SHALL persist `nome`, `ativo`, and `orgaoId`. <!-- event-driven -->
2. WHEN an authorized tenant user lists sectors for an organization THEN the system SHALL return only its verified-tenant sectors ordered by `nome` ascending. <!-- event-driven -->
3. WHEN an authorized writer updates a sector THEN the system SHALL persist supplied `nome`, `ativo`, or a verified-tenant destination `orgaoId`. <!-- event-driven -->
4. IF a parent, sector, or destination organization is absent from the verified tenant THEN the system SHALL return HTTP 404 with a registered code. <!-- unwanted-behavior -->

5. WHEN a tenancy is provisioned THEN the system SHALL create the `setores` table in its generated schema before returning the tenancy. <!-- event-driven -->
6. WHEN the identity foundation migration is applied THEN the system SHALL create `setores` in every existing tenancy schema without altering existing records. <!-- event-driven -->

## Edge Cases

- IF identifiers belong to another tenant THEN the system SHALL not expose or mutate those records.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ORG-01 | P1: Organizations | Execute | Complete |
| ORG-02 | P1: Organizations | Execute | Complete |
| SET-01 | P1: Sectors | Execute | Complete |
| SET-02 | P1: Sectors | Execute | Complete |
| ORG-03 | P1: Organizations provisioning | Execute | Complete |
| SET-03 | P1: Sectors provisioning | Execute | Complete |

**Coverage:** 6 total, 6 mapped to tasks, 0 unmapped.

## Success Criteria

- [x] Organizations and sectors are isolated to the verified tenant and usable by Obras.
