# Cadastros de Identidade Specification

## Problem Statement

O backend novo ainda não oferece os cadastros estruturais de localidades, órgãos e setores existentes no legado. Esses dados pertencem a cada tenant e serão referências obrigatórias para os futuros módulos de obras e de gestão de usuários.

## Goals

- [ ] Disponibilizar CRUD parcial tenant-isolado para localidades, órgãos e setores pela arquitetura Clean Architecture do backend novo.
- [ ] Provisionar as tabelas de localidades, órgãos e setores ao criar cada tenancy, no schema isolado recém-criado.
- [ ] Preservar as regras de negócio e os campos públicos do legado, com rotas sob o prefixo `api` do backend novo.
- [ ] Garantir validação HTTP, autorização por papel, integridade das relações e erros com códigos estáveis.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Exclusão de localidades, órgãos ou setores | O legado não expõe esses fluxos e existem vínculos futuros que exigem uma política própria de remoção. |
| Migração de dados do banco legado | Esta feature cria o domínio novo; estratégia de importação é uma atividade separada. |
| Cadastro ou atribuições de usuários | Pertence à evolução do módulo `users`. |
| Contagem real de obras nos retornos | A tabela/domínio Obras ainda não existe no schema isolado do tenant. A integração será tratada ao portar Obras. |
| Papéis granulares por órgão ou obra | O modelo atual possui somente `SUPERADMIN`, `ADMIN`, `STAFF` e `USER`; atribuições legadas são uma feature própria. |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Prefixo e forma das rotas | Expor os recursos em `/api/localidades`, `/api/orgaos` e `/api/orgaos/:orgaoId/setores`. | O backend novo já expõe sua API pública sob `/api`; não deve introduzir uma segunda convenção. | n |
| Autorização temporária | `ADMIN` cria e atualiza; `STAFF` e `USER` apenas leem; `SUPERADMIN` não acessa dados de tenant sem contexto de tenant verificado. | É a aproximação mais segura dos papéis legados até existir atribuição granular. | n |
| Contador `totalObras` | Não será retornado nesta feature. | O cálculo legado depende da tabela `obra`, ainda ausente; retornar zero fixo esconderia uma integração pendente. | n |
| Provisionamento do schema | A criação de uma tenancy cria `localidades`, `orgaos` e `setores` no novo schema, na mesma transação; uma migração idempotente cria as mesmas tabelas para tenancies já existentes; tabelas de Obras continuam fora deste bootstrap. | Os cadastros estruturais devem estar utilizáveis imediatamente sem antecipar o domínio Obras. | y |
| Atualização de setor | A troca de `orgaoId` será bloqueada se usuários vinculados existirem quando o vínculo de setor for introduzido no módulo `users`. Até então, a troca é permitida após validar o órgão de destino. | Preserva a regra RN-IDE-03 sem criar dependência circular antes do port de usuários organizacionais. | n |
| Limites textuais | Aplicar `trim`, rejeitar texto vazio e manter os limites de tamanho definidos pelo banco/DTO quando forem especificados no design. | O legado valida tipo, mas aceita espaços e não define limites; a fronteira nova deve evitar dados inválidos sem inventar limites arbitrários. | n |

**Open questions:** confirmar os quatro primeiros defaults antes de iniciar o design e as tarefas.

---

## User Stories

### P1: Gerir localidades do tenant ⭐ MVP

**User Story**: As an administrator of a tenant, I want to create, list and update localities so that organizations and future works can reference their territorial location.

**Why P1**: Localidade é a dependência estrutural de órgão e do futuro cadastro de obras.

**Acceptance Criteria**:

1. WHEN an authenticated tenant administrator creates a locality with `nome` and a two-character `uf` THEN the system SHALL persist and return a tenant-scoped locality with a generated UUID and creation timestamp.
2. WHEN an authorized tenant user lists localities THEN the system SHALL return only localities from the verified tenant ordered by `nome` ascending.
3. WHEN an authenticated tenant administrator updates an existing locality THEN the system SHALL persist only the supplied mutable fields and return the updated locality.
4. IF a locality payload omits `nome`, omits `uf`, supplies a `uf` other than two characters, or supplies a value outside `TipoLocalidade` THEN the system SHALL reject the request with HTTP 400 and a registered error code.
5. IF a requested locality does not exist in the verified tenant THEN the system SHALL reject the request with HTTP 404 and a registered error code.
6. IF a caller does not have read or write permission for the operation THEN the system SHALL reject the request with HTTP 403 and a registered error code.

**Independent Test**: Create one locality for a tenant, list it from that tenant, update its municipality, and verify invalid enum input and a foreign-tenant UUID fail with the stated outcomes.

---

### P1: Provisionar a estrutura cadastral do tenant ⭐ MVP

**User Story**: As a platform administrator, I want a new tenant schema to receive the identity tables automatically so that its administrative structure is usable immediately.

**Why P1**: Localidades, órgãos e setores are prerequisites for the Obras domain.

**Acceptance Criteria**:

1. WHEN a superadministrator provisions a tenancy THEN the system SHALL create `localidades`, `orgaos`, and `setores` in the generated tenant schema in the same transaction as the tenancy record.
2. IF creation of any identity table fails THEN the system SHALL roll back the schema and tenancy record.
3. WHEN a tenancy is provisioned THEN the system SHALL NOT create an `obras` table.
4. WHEN the identity foundation migration is applied THEN the system SHALL create `localidades`, `orgaos`, and `setores` in every existing tenancy schema without altering existing records.

**Independent Test**: Provision a tenancy, inspect its schema for the three identity tables, verify no `obras` table exists, force a bootstrap failure to verify that both schema and tenancy record are rolled back, and apply the migration to a pre-existing tenant schema.

---

### P1: Gerir órgãos do tenant ⭐ MVP

**User Story**: As an administrator of a tenant, I want to create, list and update public organizations linked to a locality so that administrative ownership is represented consistently.

**Why P1**: Órgão depende de localidade e é a dependência estrutural de setor.

**Acceptance Criteria**:

1. WHEN an authenticated tenant administrator creates an organization with an existing locality from the verified tenant THEN the system SHALL persist and return the organization linked to that locality.
2. WHEN an authorized tenant user lists organizations THEN the system SHALL return only organizations from the verified tenant ordered by `nome` ascending.
3. WHEN an authenticated tenant administrator updates an existing organization THEN the system SHALL persist the supplied mutable fields, including `ativo`, and return the updated organization.
4. IF an organization payload contains an invalid locality UUID, an invalid organization type, or an invalid email address THEN the system SHALL reject the request with HTTP 400 and a registered error code.
5. IF the referenced locality does not exist in the verified tenant THEN the system SHALL reject the request with HTTP 404 and a registered error code.
6. IF a requested organization does not exist in the verified tenant THEN the system SHALL reject the request with HTTP 404 and a registered error code.

**Independent Test**: Create a locality and then an organization linked to it, deactivate the organization, and verify a nonexistent locality cannot be used.

---

### P1: Gerir setores vinculados a órgãos ⭐ MVP

**User Story**: As an administrator of a tenant, I want to create, list and update sectors under an organization so that its internal structure can be represented.

**Why P1**: Setor completa a hierarquia organizacional consumida por usuários e obras.

**Acceptance Criteria**:

1. WHEN an authenticated tenant administrator creates a sector under an existing organization in the verified tenant THEN the system SHALL persist and return a sector linked to that organization.
2. WHEN an authorized tenant user lists sectors for an organization THEN the system SHALL return only sectors linked to that organization in the verified tenant ordered by `nome` ascending.
3. WHEN an authenticated tenant administrator updates an existing sector THEN the system SHALL persist the supplied `nome`, `ativo`, or destination `orgaoId` and return the updated sector.
4. IF the requested parent organization or sector does not exist in the verified tenant THEN the system SHALL reject the request with HTTP 404 and a registered error code.
5. IF a sector is moved to another organization after users are linked to that sector THEN the system SHALL reject the request with HTTP 422 and a registered error code.
6. IF the destination organization for a sector move does not exist in the verified tenant THEN the system SHALL reject the request with HTTP 404 and a registered error code.

**Independent Test**: Create an organization and sector, list the sector through its parent, move it to another valid organization, and verify moving a user-linked sector is rejected once user organizational links exist.

---

## Edge Cases

- IF a tenant-scoped request has no verified tenant context THEN the system SHALL reject it before accessing tenant-schema persistence.
- IF a request supplies an unknown field THEN the system SHALL reject it with HTTP 400 through the global validation pipe.
- IF two requests use identifiers from different tenant schemas THEN the system SHALL not expose or mutate either foreign-tenant record.
- WHEN the future Obras module is absent THEN the system SHALL not issue a query against an `obra` table while listing localities or organizations.

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CAD-01 | P1: Localidades | Design | Pending |
| CAD-02 | P1: Localidades | Design | Pending |
| CAD-03 | P1: Localidades | Design | Pending |
| CAD-04 | P1: Localidades | Design | Pending |
| CAD-05 | P1: Órgãos | Design | Pending |
| CAD-06 | P1: Órgãos | Design | Pending |
| CAD-07 | P1: Órgãos | Design | Pending |
| CAD-08 | P1: Órgãos | Design | Pending |
| CAD-09 | P1: Setores | Design | Pending |
| CAD-10 | P1: Setores | Design | Pending |
| CAD-11 | P1: Setores | Design | Pending |
| CAD-12 | P1: Isolamento | Design | Pending |
| CAD-13 | P1: Provisionamento | Design | Pending |

**Coverage:** 13 total, 0 mapped to tasks, 13 unmapped.

## Success Criteria

- [ ] A tenant administrator can create, read and update the three levels of the hierarchy through the public API.
- [ ] A newly provisioned tenant schema contains the identity tables needed by those APIs.
- [ ] Requests cannot read or mutate records in another tenant schema.
- [ ] Invalid input and missing relations return deterministic HTTP status codes and registered error codes.
- [ ] The implementation follows the project conventions for entities, use cases, repositories, mappers, DTOs and tests.
