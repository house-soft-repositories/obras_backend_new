# Cadastros de Localidades Specification

## Problem Statement

Obras precisa de localidades estruturadas e isoladas por tenant para representar referências territoriais sem depender do banco legado.

## Goals

- [ ] Criar, listar e atualizar localidades no schema do tenant verificado.
- [ ] Criar a tabela `localidades` no schema de cada tenancy durante seu provisionamento.
- [ ] Preservar os campos e validações do legado sob o prefixo `/api`.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Exclusão | Exige política de vínculos de Obras. |
| `totalObras` | Obras ainda não existe no schema tenant. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Roles | `ADMIN` escreve; `STAFF` e `USER` leem; `SUPERADMIN` sem tenant é bloqueado. | Mapeia `ADMIN_TENANT`, `GESTOR_ORGAO` e `CONSULTA` ao modelo atual. | y |
| Routes | `/api/localidades`. | Mantém o contrato legado sob o prefixo público novo. | y |

**Open questions:** none.

## User Stories

### P1: Gerir localidades do tenant

**User Story**: As a tenant user, I want localities available to organize organizations and works.

**Acceptance Criteria**:

1. WHEN an `ADMIN` creates a locality with `nome` and a two-character `uf` THEN the system SHALL persist a UUID tenant-scoped locality with `codigoIbge`, `tipo`, `municipio`, and `observacoes` optional. <!-- event-driven -->
2. WHEN an authorized tenant user lists localities THEN the system SHALL return only the verified tenant records ordered by `nome` ascending. <!-- event-driven -->
3. WHEN an `ADMIN` updates a locality THEN the system SHALL persist only supplied mutable fields and return the updated record. <!-- event-driven -->
4. IF `nome` or `uf` is absent, `uf` is not two characters, or `tipo` is outside `BAIRRO`, `DISTRITO`, `REGIAO`, `ZONA_RURAL` THEN the system SHALL return HTTP 400 with a registered code. <!-- unwanted-behavior -->
5. IF the locality is absent from the verified tenant THEN the system SHALL return HTTP 404 with a registered code. <!-- unwanted-behavior -->
6. IF tenant context is absent or the caller lacks permission THEN the system SHALL return HTTP 401 or 403 before schema persistence. <!-- unwanted-behavior -->

**Independent Test**: Create, list, update municipality, reject invalid type, and reject a foreign-tenant UUID.

### P1: Provisionar localidades

**Acceptance Criteria**:

1. WHEN a tenancy is provisioned THEN the system SHALL create the `localidades` table in its generated schema before returning the tenancy. <!-- event-driven -->
2. IF locality-table creation fails THEN the system SHALL roll back the schema and tenancy record. <!-- unwanted-behavior -->
3. WHEN the identity foundation migration is applied THEN the system SHALL create `localidades` in every existing tenancy schema without altering existing records. <!-- event-driven -->

## Edge Cases

- IF an unknown request field is supplied THEN the system SHALL return HTTP 400 through the global validation pipe.
- The system SHALL not query an `obra` table while listing localities.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| LOC-01 | P1: Localities | Execute | Complete |
| LOC-02 | P1: Localities | Execute | Complete |
| LOC-03 | P1: Localities | Execute | Complete |
| LOC-04 | P1: Provisioning | Execute | Complete |

**Coverage:** 4 total, 4 mapped to tasks, 0 unmapped.

## Success Criteria

- [x] Tenant-isolated locality CRUD passes unit, integration, and HTTP tests.
