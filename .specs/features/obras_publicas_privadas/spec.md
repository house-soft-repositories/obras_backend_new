# Obras Públicas e Privadas Specification

## Problem Statement

O backend precisa oferecer criação e listagem paginada de fontes de orçamento e pessoas, além da criação de obras públicas e privadas com regras distintas de negócio, mantendo os códigos sequenciais automáticos, as validações de fronteira e a separação entre os fluxos. O legado já demonstra comportamento funcional para esses pontos do contrato; esta spec consolida o que a nova base precisa suportar sem misturar os modelos.

## Goals

- [ ] Criar obras públicas com os campos obrigatórios do legado, validação de orçamento mínimo e geração automática de código imutável por tenant e ano.
- [ ] Criar e listar fontes de orçamento por tenant, com paginação, para que as obras públicas possam referenciá-las como pré-requisito de cadastro.
- [ ] Criar e listar pessoas por tenant, com paginação, para que as obras privadas possam referenciar um proprietário válido.
- [ ] Criar obras privadas com cadastro de imóvel básico, geração automática de código imutável por tenant e ano, e estado inicial consistente com a ausência de alvará.
- [ ] Rejeitar payloads inválidos, combinações de campos incompatíveis e tentativas de informar campos derivados ou imutáveis na criação.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Fluxos de edição e inativação de fontes | A spec cobre apenas criação e listagem paginada das fontes necessárias para orçamentos de obras públicas. |
| Fluxos de edição, inativação e perfil profissional de pessoas | A spec cobre apenas criação e listagem paginada da pessoa necessária como proprietário da obra privada. |
| Edição, duplicação, exclusão e consulta detalhada de obras | A spec cobre apenas criação. |
| Fluxos de cronograma, medições, contratos, arquivos, relatórios e equipe | São capacidades posteriores dos agregados. |
| Regras completas de alvará, fiscalização, auto de infração e habite-se | Dependem da criação da obra privada, mas pertencem a outra spec. |
| Migração de dados do legado | O legado serve como referência, não como tarefa desta entrega. |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Escopo de fonte | A spec cobre `POST` e `GET` paginado de fontes. | A tela de criação de obra precisa criar e selecionar fontes previamente cadastradas. | y |
| Escopo de pessoa | A spec cobre `POST` e `GET` paginado de pessoas. | A tela de criação de obra privada precisa criar e selecionar proprietários previamente cadastrados. | y |
| Escopo de obras | A spec cobre apenas `POST` de obras públicas e privadas. | Mantém a entrega de obras pequena e independente. | y |
| Pré-requisito de orçamento | A obra pública depende de fontes criadas previamente e ativas no mesmo tenant. | O legado valida cada `fonteId` no cadastro da obra. | y |
| Pré-requisito de proprietário | A obra privada depende de uma pessoa criada previamente no mesmo tenant. | O legado valida `proprietarioPessoaId` antes de salvar a obra privada. | y |
| Identidade do registro | O código de obra é gerado automaticamente, permanece imutável e não entra nos DTOs de criação. | O legado valida esse comportamento e ele evita colisões com sequências do tenant. | y |
| Sequência pública | Obra pública usa o prefixo `OBR-<ano>-NNNN` por tenant. | Preserva o contrato legado e a rastreabilidade anual. | y |
| Sequência privada | Obra privada usa o prefixo `OBP-<ano>-NNNN` por tenant. | Preserva o contrato legado e separa o domínio privado do público. | y |
| Estado inicial privado | Nova obra privada nasce com `situacaoAlvara = SEM_ALVARA` quando não há alvará registrado. | O legado trata a ausência de alvará como estado inicial explícito. | y |
| Validação de relacionamentos | `responsavelUsuarioId`, `orgaoId`, `proprietarioPessoaId` e demais UUIDs referenciam registros existentes no tenant autenticado. | Impede criação órfã e mantém o isolamento por tenant. | y |
| Permissão de escrita | Apenas usuários autenticados e autorizados pelo tenant podem criar obras. | A criação não é pública e depende do contexto do tenant verificado. | y |

**Open questions:** none.

## User Stories

### P1: Criar e listar fontes de orçamento ⭐ MVP

**User Story**: As a tenant user, I want to create and list active budget sources so that public works can reference a valid funding record.

**Why P1**: Public-work creation depends on at least one active source in the same tenant.

**Acceptance Criteria**:

1. WHEN an authorized tenant user submits a fonte creation request with `nome` THEN the system SHALL create the fonte and return HTTP 201 with the persisted record. <!-- event-driven -->
2. The system SHALL accept optional `codigo`, `descricao`, `tipo`, `valorPrevisto`, and `vigencia` fields and SHALL keep `ativo` true by default. <!-- ubiquitous -->
3. IF the tenant already has a fonte with the same non-null `codigo` THEN the system SHALL reject the request with HTTP 409. <!-- unwanted-behavior -->
4. IF `nome` is missing or shorter than 2 characters THEN the system SHALL reject the request with HTTP 400. <!-- unwanted-behavior -->
5. WHEN an authorized tenant user lists fontes with pagination parameters THEN the system SHALL return only fontes from the authenticated tenant ordered by `nome` ascending. <!-- event-driven -->
6. The system SHALL return paginated fonte results with items and pagination metadata sufficient for the client to request the next page. <!-- ubiquitous -->
7. IF pagination parameters are absent THEN the system SHALL use safe default `page` and `limit` values. <!-- unwanted-behavior -->
8. IF pagination parameters are invalid or exceed the maximum allowed limit THEN the system SHALL reject the request with HTTP 400. <!-- unwanted-behavior -->
9. The system SHALL keep fonte creation and listing scoped to the authenticated tenant and SHALL not allow a caller to choose another tenant. <!-- ubiquitous -->

**Independent Test**: Create multiple fontes, verify paginated listing returns only tenant records with metadata, verify one fonte can be reused by obra budget validation, and verify duplicate non-null `codigo` values fail.

### P1: Criar e listar pessoas ⭐ MVP

**User Story**: As a tenant user, I want to create and list tenant-scoped people so that private works can reference a valid owner.

**Why P1**: Private-work creation depends on at least one person in the same tenant to act as `proprietarioPessoaId`.

**Acceptance Criteria**:

1. WHEN an authorized tenant user submits a pessoa creation request with `tipo`, `documento`, and `nome` THEN the system SHALL create the pessoa and return HTTP 201 with the persisted record. <!-- event-driven -->
2. The system SHALL accept optional `nomeFantasia`, `rg`, `orgaoExpedidor`, `email`, `telefone`, and address fields and SHALL keep `ativo` true by default. <!-- ubiquitous -->
3. IF `documento` is missing, contains non-digit characters, or has a length outside the documented CPF/CNPJ range THEN the system SHALL reject the request with HTTP 400. <!-- unwanted-behavior -->
4. IF the tenant already has a pessoa with the same `documento` THEN the system SHALL reject the request with HTTP 409. <!-- unwanted-behavior -->
5. WHEN an authorized tenant user lists pessoas with pagination parameters THEN the system SHALL return only pessoas from the authenticated tenant ordered by `nome` ascending. <!-- event-driven -->
6. The system SHALL return paginated pessoa results with items and pagination metadata sufficient for the client to request the next page. <!-- ubiquitous -->
7. IF pagination parameters are absent THEN the system SHALL use safe default `page` and `limit` values. <!-- unwanted-behavior -->
8. IF pagination parameters are invalid or exceed the maximum allowed limit THEN the system SHALL reject the request with HTTP 400. <!-- unwanted-behavior -->
9. The system SHALL keep pessoa creation and listing scoped to the authenticated tenant and SHALL not allow a caller to choose another tenant. <!-- ubiquitous -->

**Independent Test**: Create multiple pessoas, verify paginated listing returns only tenant records with metadata, verify duplicate `documento` fails, verify a created pessoa can be referenced as `proprietarioPessoaId` by an obra privada, and verify invalid document lengths or formats fail.

### P1: Criar obra pública ⭐ MVP

**User Story**: As a tenant user, I want to create a public work with the required business fields so that I can track the work lifecycle from its first registration.

**Why P1**: A obra pública é o fluxo principal e precisa existir antes de qualquer etapa de cronograma, financeiro ou documentos.

**Acceptance Criteria**:

1. WHEN an authorized tenant user submits a public work creation request with `nome`, `tipo`, `responsavelUsuarioId`, `orgaoId`, and at least one `orcamentos` item THEN the system SHALL create the work and return HTTP 201 with the persisted record. <!-- event-driven -->
2. The system SHALL generate `codigo` automatically for each public work using the `OBR-<ano>-NNNN` format and SHALL not accept `codigo` in the creation payload. <!-- ubiquitous -->
3. The system SHALL persist only one public-work code sequence per tenant and year and SHALL not reuse codes from soft-deleted records. <!-- ubiquitous -->
4. WHEN the payload includes `subclassificacaoId` and `tipo` is not `OBRA` THEN the system SHALL reject the request with HTTP 422. <!-- unwanted-behavior -->
5. IF `orcamentos` is empty, missing, or contains no valid `fonteId` and `valor` pair THEN the system SHALL reject the request with HTTP 400. <!-- unwanted-behavior -->
6. IF any required UUID does not reference a record in the authenticated tenant THEN the system SHALL reject the request with HTTP 422 or 404 and SHALL not create the work. <!-- unwanted-behavior -->
7. The system SHALL keep creation scoped to the authenticated tenant and SHALL not allow a caller to choose another tenant. <!-- ubiquitous -->
8. WHEN `seguirAutomatico` is true THEN the system SHALL create the authenticated creator as a follower of the new obra. <!-- event-driven -->
9. WHEN `responsavelUsuarioId` is provided THEN the system SHALL persist the responsible-link record for the obra using the responsible role. <!-- event-driven -->
10. The system SHALL persist each `orcamentos` item as a separate linked budget record for the obra. <!-- ubiquitous -->

**Independent Test**: Create one valid public work, verify the generated code format, verify the work persists with the supplied budgets, and verify invalid budget or subclassification payloads fail.

### P1: Criar obra privada ⭐ MVP

**User Story**: As a tenant user, I want to create a private work with the minimum property and location data so that the municipality can track the work through private-work flows.

**Why P1**: The private-work lifecycle depends on a valid base record before alvará, fiscalização, autos, or habite-se can exist.

**Acceptance Criteria**:

1. WHEN an authorized tenant user submits a private work creation request with `descricao`, `proprietarioPessoaId`, `logradouro`, and `uf` THEN the system SHALL create the work and return HTTP 201 with the persisted record. <!-- event-driven -->
2. The system SHALL generate `codigo` automatically for each private work using the `OBP-<ano>-NNNN` format and SHALL not accept `codigo` in the creation payload. <!-- ubiquitous -->
3. The system SHALL create private works with `situacaoAlvara = SEM_ALVARA` unless an alvará already exists in the same transaction. <!-- state-driven -->
4. IF `proprietarioPessoaId` does not reference an existing person in the authenticated tenant THEN the system SHALL reject the request and SHALL not create the work. <!-- unwanted-behavior -->
5. IF `uf` is absent or is not exactly two characters THEN the system SHALL reject the request with HTTP 400. <!-- unwanted-behavior -->
6. The system SHALL accept optional address, geolocation, and situation fields only when they are valid for the private-work domain and SHALL ignore no derived state in the payload. <!-- ubiquitous -->
7. The system SHALL keep creation scoped to the authenticated tenant and SHALL not allow a caller to choose another tenant. <!-- ubiquitous -->
8. WHEN the request includes `latitude`, `longitude`, or `geoOrigem` THEN the system SHALL persist those geolocation fields on the private-work aggregate and keep them tenant-scoped. <!-- event-driven -->
9. WHEN the request includes `inscricaoImobiliaria` THEN the system SHALL persist it as part of the private-work identity data and use it for duplicate-aware tenant queries. <!-- event-driven -->
10. WHEN the request includes `dataInicio` or `dataPrevistaConclusao` THEN the system SHALL persist those dates as the private-work schedule markers. <!-- event-driven -->
11. IF the request includes explicit `situacaoAlvara`, `andamento`, or `habiteSe` values THEN the system SHALL accept only enum-valid values and SHALL keep the aggregate internally consistent with the current alvará state. <!-- unwanted-behavior -->
12. The system SHALL persist private-work creation as a single aggregate write so that the root record is not saved without its derived initial state. <!-- ubiquitous -->

**Independent Test**: Create one valid private work, verify the generated code format and initial alvará state, and verify invalid person or UF values fail.

## Edge Cases

- IF a creation request includes `codigo` THEN the system SHALL reject the field or ignore it according to the global validation policy, but SHALL never persist a caller-supplied code.
- IF two creations race for the same tenant-year sequence THEN the system SHALL resolve the collision without duplicating codes or SHALL return HTTP 409 after retry exhaustion.
- IF a client supplies unknown fields THEN the system SHALL reject the request through the HTTP validation boundary.
- IF a private work arrives with explicit situation fields that contradict the absence of alvará THEN the system SHALL keep the derived initial state consistent with the domain rules.

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| WPR-01 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-02 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-03 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-04 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-05 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-06 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-07 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-08 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-09 | P1: Criar e listar fontes de orçamento | Execute | Complete |
| WPR-10 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-11 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-12 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-13 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-14 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-15 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-16 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-17 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-18 | P1: Criar e listar pessoas | Execute | Complete |
| WPR-19 | P1: Criar obra pública | Execute | Complete |
| WPR-20 | P1: Criar obra pública | Execute | Complete |
| WPR-21 | P1: Criar obra pública | Execute | Complete |
| WPR-22 | P1: Criar obra pública | Execute | Complete |
| WPR-23 | P1: Criar obra pública | Execute | Complete |
| WPR-24 | P1: Criar obra pública | Execute | Complete |
| WPR-25 | P1: Criar obra pública | Execute | Complete |
| WPR-26 | P1: Criar obra pública | Execute | Complete |
| WPR-27 | P1: Criar obra pública | Execute | Complete |
| WPR-28 | P1: Criar obra pública | Execute | Complete |
| WPR-29 | P1: Criar obra privada | Execute | Complete |
| WPR-30 | P1: Criar obra privada | Execute | Complete |
| WPR-31 | P1: Criar obra privada | Execute | Complete |
| WPR-32 | P1: Criar obra privada | Execute | Complete |
| WPR-33 | P1: Criar obra privada | Execute | Complete |
| WPR-34 | P1: Criar obra privada | Execute | Complete |
| WPR-35 | P1: Criar obra privada | Execute | Complete |
| WPR-36 | P1: Criar obra privada | Execute | Complete |
| WPR-37 | P1: Criar obra privada | Execute | Complete |
| WPR-38 | P1: Criar obra privada | Execute | Complete |
| WPR-39 | P1: Criar obra privada | Execute | Complete |
| WPR-40 | P1: Criar obra privada | Execute | Complete |

**Coverage:** 40 total, 0 mapped to tasks, 40 unmapped ⚠️

## Success Criteria

- [ ] A tenant user can create one valid public work and one valid private work through separate contracts.
- [ ] The backend rejects invalid payloads before persisting derived or immutable fields.
- [ ] Generated codes are unique, tenant-scoped, and stable across retries and soft deletes.
