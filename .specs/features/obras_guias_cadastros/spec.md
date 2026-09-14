# Obras Guias e Cadastros Complementares Specification

## Problem Statement

O agregado `Obras` do legado (`obras_backend_legado/src/modules/obras`) contém dois domínios auxiliares não portados para o novo backend: **cadastros configuráveis** (`Eixo, Classificacao, Subclassificacao, Tipologia, Subtipologia` com desativação lógica via `ativo`) e **guias da obra** (`localizacoes com lat/lng, orcamentos previstos por fonte, titularidade, licencas, recebimentos`). O novo `obras_gestao_completa` já cobre criação/listagem/atualização/duplicação/equipe/tags/observacoes, mas sem esses sub-recursos a obra permanece com vínculos `eixoId/classificacaoId/...` órfãos e sem as abas exigidas pelo manual 10.1.2/3/6/7/10. Esta spec fecha exatamente essa lacuna intra-Obras, reproduzindo as regras `RN-OBR-12/14/15/16/17/24` no padrão tenant-schema.

## Goals

- [ ] Expor CRUD tenant-scoped de cadastros auxiliares: `eixos, classificacoes, subclassificacoes (filhas de classificacao), tipologias, subtipologias (filhas de tipologia)` com desativação lógica (`ativo`) e sem exclusão física.
- [ ] Expor sub-recursos de guias por obra: `localizacoes (N, com UF+lat/lng), orcamentos previstos (fonteId+valor, >=1), titularidade (EXISTENTE/NAO_EXISTENTE), licencas (EXISTENTE/NAO_EXISTENTE), recebimentos (PROVISORIO/DEFINITIVO/INAUGURACAO)` com validações condicionais do legado.
- [ ] Garantir isolamento por tenant, idempotência de escrita e códigos de erro estáveis para todos os novos endpoints, sem reutilizar código legado verbatim.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Listagem paginada / consulta / atualização parcial / duplicação / equipe / tags / observacoes | Já especificado em `obras_gestao_completa` (T1..T8). |
| Cronograma, estágios, medições | Pertence a `cronograma_medicoes`. |
| Contratos, aditivos, paralisações, empresas | Pertence a `contratos_gestao`. |
| Empenhos, liquidações, pagamentos, visão físico-financeira | Pertence a `financeiro_execucao`. |
| Pastas/arquivos/documentos e listeners | Pertence a `documentos_gestao`. |
| Dashboard, desempenho, fluxo, dossiê, exportação | Pertence a `relatorios_exportacao`. |
| Migração histórica de dados do legado | Fora do escopo — legado é referência, não dump. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Persistência | Tabelas `eixo, classificacao, subclassificacao, tipologia, subtipologia, obra_localizacao, obra_orcamento_previsto, titularidade, licenca, recebimento` no schema do tenant, criadas por migration `CriarObrasGuiasCadastros` | Reproduz `1781203000000-CriarObrasContext` + `1718000000000` do legado, isolado por tenant | y |
| Ids e tenant | Todo registro carrega `tenantId` explícito validado via `TenantContext.require()`; rotas cadastrais são `/api/cadastros/*`, guias são `/api/obras/:obraId/*` | Consistência com `obras_gestao_completa` e `BaseModelPrimaryColumnUuid` | y |
| Desativação vs exclusão | Cadastros nunca são deletados; `PATCH /:id` com `ativo=false` desativa (RN-OBR-24) | Legado proíbe exclusão física | y |
| Hierarquia | `Subclassificacao` exige `classificacaoId` válido do mesmo tenant; `Subtipologia` exige `tipologiaId` válido; criação falha 422 se pai inexistente/inativo de outro tenant | PREMISSA do legado + integridade | y |
| Validação de obra nas guias | Toda escrita em guias valida `obraId` pertence ao tenant caller; caso contrário 404 `OBRA_NOT_FOUND` sem leak | Isolamento cross-tenant | y |
| Fonte em orçamento | `fonteId` deve existir no tenant (lookup `fontes`); `valor` é `numeric(18,2)` positivo como string | RN-OBR-12: >=1 por obra, mas validação de >=1 fica no agregado obra | y |
| Titularidade/licenca singulares | `titularidade` e `licencas/recebimentos` são coleções por obra; `titularidade` possui no máximo 1 por obra (upsert via POST), demais são N | RN-OBR-15/16/17 do legado | y |
| Autorização | `AccessTokenGuard` obrigatório; qualquer usuário autenticado do tenant pode gerenciar cadastros/guias da própria carteira | Mesmo nível de `obras_gestao_completa`; sem RBAC adicional nesta spec | y |
| Paginação | Listagens de cadastros usam `PageOptions/PageMeta` do core; guias listam sem paginação (N pequeno) ordenadas por `criadoEm/nome` | Reuso + comportamento legado (`order: localidade ASC`) | y |
| Observabilidade | Erros propagados via `Either<AppException, R>`; repositórios nunca lançam, retornam `left(RepositoryException)` | Padrão Clean Architecture do projeto | y |

**Open questions:** none.

---

## User Stories

### P1: Cadastros auxiliares de Obras ⭐ MVP

**User Story**: As a tenant admin, I want to manage the auxiliary registries that classify a work so that every obra can reference valid eixo/classificacao/tipologia without orphan links.

**Why P1**: Sem cadastros, `eixoId/classificacaoId/tipologiaId/...` da obra são órfãos; legado bloqueia obra sem vínculo válido.

**Acceptance Criteria**:

1. WHEN an authenticated tenant user calls `GET /api/cadastros/eixos` THEN the system SHALL return paginated eixos of his tenant ordered by `nome ASC`. <!-- event-driven -->
2. WHEN the user posts `POST /api/cadastros/eixos` with `{ nome }` (min 2 chars) THEN the system SHALL create the eixo scoped to his tenant and SHALL return HTTP 201 with `{ id, nome, ativo:true }`. <!-- event-driven -->
3. WHEN the user patches `PATCH /api/cadastros/eixos/:id` with `{ nome?, ativo? }` THEN the system SHALL update only supplied fields and SHALL keep the record (no hard delete). <!-- event-driven -->
4. WHEN the user calls `GET /api/cadastros/classificacoes` and `GET /api/cadastros/classificacoes/:classificacaoId/subclassificacoes` THEN the system SHALL return paginated lists tenant-scoped. <!-- event-driven -->
5. WHEN the user posts `POST /api/cadastros/classificacoes/:classificacaoId/subclassificacoes` with `{ nome }` THEN the system SHALL create the subclassificacao linked to that classificacao and SHALL validate the parent belongs to the same tenant. <!-- event-driven -->
6. WHEN the user calls `GET /api/cadastros/tipologias` and `GET /api/cadastros/tipologias/:tipologiaId/subtipologias` THEN the system SHALL return paginated lists tenant-scoped. <!-- event-driven -->
7. WHEN the user posts `POST /api/cadastros/tipologias/:tipologiaId/subtipologias` with `{ nome }` THEN the system SHALL create the subtipologia linked to that tipologia and SHALL validate parent tenant. <!-- event-driven -->
8. IF `nome` is missing or shorter than 2 chars THEN the system SHALL reject with HTTP 400 and code `CADASTRO_INVALID_NOME`. <!-- unwanted-behavior -->
9. IF the parent `classificacaoId/tipologiaId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `CADASTRO_PARENT_NOT_FOUND` and SHALL not leak existence. <!-- unwanted-behavior -->
10. IF the caller references a cadastro `:id` of another tenant THEN the system SHALL return HTTP 404 with code `CADASTRO_NOT_FOUND`. <!-- unwanted-behavior -->
11. The system SHALL require `AccessTokenGuard` for all `/api/cadastros/*` routes. <!-- ubiquitous -->
12. The system SHALL filter `?apenasAtivos=true` to return only `ativo=true` records. <!-- ubiquitous -->

**Independent Test**: Criar eixo, classificacao, subclassificacao filha, tipologia, subtipologia filha; listar com/sem `apenasAtivos`; PATCH desativar; tentar criar subclassificacao com parent de outro tenant → 404.

### P2: Guias — Localizações e Orçamentos previstos ⭐ MVP

**User Story**: As a tenant user, I want to attach execution locations and forecasted budgets to a work so that the record satisfies manual 10.1.2/10.1.3.

**Why P1**: Localização e orçamento são abas obrigatórias (RN-OBR-12/14) e hoje não existem no novo backend.

**Acceptance Criteria**:

1. WHEN the user calls `GET /api/obras/:obraId/localizacoes` THEN the system SHALL return locations of that obra ordered by `localidade ASC` and tenant-scoped. <!-- event-driven -->
2. WHEN the user posts `POST /api/obras/:obraId/localizacoes` with `{ localidade, uf (2 chars), latitude?, longitude? }` THEN the system SHALL create the location linked to `obraId/tenantId` and SHALL return HTTP 201. <!-- event-driven -->
3. WHEN the user deletes `DELETE /api/obras/:obraId/localizacoes/:id` THEN the system SHALL remove that location if it belongs to the obra and tenant. <!-- event-driven -->
4. WHEN the user calls `GET /api/obras/:obraId/orcamentos` THEN the system SHALL return orcamentos of that obra tenant-scoped. <!-- event-driven -->
5. WHEN the user posts `POST /api/obras/:obraId/orcamentos` with `{ fonteId (uuid), valor (numeric string >0) }` THEN the system SHALL create the orcamento and SHALL validate `fonteId` exists in the tenant. <!-- event-driven -->
6. WHEN the user deletes `DELETE /api/obras/:obraId/orcamentos/:id` THEN the system SHALL remove that orcamento. <!-- event-driven -->
7. IF `obraId` belongs to another tenant THEN the system SHALL return HTTP 404 with code `OBRA_NOT_FOUND`. <!-- unwanted-behavior -->
8. IF `uf` is not exactly 2 chars or `fonteId` is not uuid or `valor` is not positive numeric THEN the system SHALL reject with HTTP 400 and code `GUIA_INVALID_INPUT`. <!-- unwanted-behavior -->
9. IF `fonteId` does not exist in the tenant THEN the system SHALL reject with HTTP 422 and code `FONTE_NOT_FOUND`. <!-- unwanted-behavior -->
10. The system SHALL require `AccessTokenGuard` for all localizacao/orcamento routes. <!-- ubiquitous -->

**Independent Test**: Criar obra, POST 2 localizacoes + GET ordenado, DELETE uma, POST orcamento com fonte válida/ inválida, verificar cross-tenant 404.

### P3: Guias — Titularidade, Licenças e Recebimentos

**User Story**: As a tenant user, I want to record land titularity, environmental licenses and receipt terms per work so that the dossier and compliance checks are complete.

**Why P2**: RN-OBR-15/16/17 exigem essas guias; sem elas o dossiê (`relatorios_exportacao`) fica incompleto.

**Acceptance Criteria**:

1. WHEN the user calls `GET /api/obras/:obraId/titularidade` THEN the system SHALL return the titularidade of that obra or empty if none, tenant-scoped. <!-- event-driven -->
2. WHEN the user posts `POST /api/obras/:obraId/titularidade` with `{ situacao: EXISTENTE|NAO_EXISTENTE, tipo?, observacoes? }` THEN the system SHALL upsert the titularidade for that obra. <!-- event-driven -->
3. WHEN the user calls `GET /api/obras/:obraId/licencas` THEN the system SHALL return licenses ordered by `criadoEm ASC` tenant-scoped. <!-- event-driven -->
4. WHEN the user posts `POST /api/obras/:obraId/licencas` with `{ situacao, tipo?, numero?, validade?, observacoes? }` THEN the system SHALL create the licenca. <!-- event-driven -->
5. WHEN the user patches `PATCH /api/obras/:obraId/licencas/:id` THEN the system SHALL update only supplied fields of that licenca. <!-- event-driven -->
6. WHEN the user deletes `DELETE /api/obras/:obraId/licencas/:id` THEN the system SHALL remove that licenca. <!-- event-driven -->
7. WHEN the user calls `GET /api/obras/:obraId/recebimentos` THEN the system SHALL return recebimentos ordered by `criadoEm ASC` tenant-scoped. <!-- event-driven -->
8. WHEN the user posts `POST /api/obras/:obraId/recebimentos` with `{ tipo: PROVISORIO|DEFINITIVO|INAUGURACAO, data?, dataPrevista? }` THEN the system SHALL create the recebimento. <!-- event-driven -->
9. WHEN the user patches `PATCH /api/obras/:obraId/recebimentos/:id` THEN the system SHALL update only supplied fields. <!-- event-driven -->
10. WHEN the user deletes `DELETE /api/obras/:obraId/recebimentos/:id` THEN the system SHALL remove that recebimento. <!-- event-driven -->
11. IF `situacao/tipo` enum is invalid THEN the system SHALL reject with HTTP 400 and code `GUIA_INVALID_ENUM`. <!-- unwanted-behavior -->
12. IF `obraId` or licenca/recebimento `:id` belongs to another tenant THEN the system SHALL return HTTP 404. <!-- unwanted-behavior -->
13. The system SHALL require `AccessTokenGuard` for all titularidade/licenca/recebimento routes. <!-- ubiquitous -->

**Independent Test**: Criar obra, upsert titularidade, CRUD licenca (create/patch/delete), CRUD recebimento, validar enum inválido → 400 e cross-tenant → 404.

---

## Edge Cases

- IF `POST /api/cadastros/eixos` with `nome` duplicated in same tenant THEN the system SHALL allow duplicate names (legado permite) and SHALL scope uniqueness only by `id`. <!-- unwanted-behavior -->
- IF `GET /api/cadastros/eixos?apenasAtivos=true` and all are `ativo=false` THEN the system SHALL return empty page with `total=0`. <!-- unwanted-behavior -->
- IF `POST /api/obras/:obraId/localizacoes` with `latitude=1000` (out of range) THEN the system SHALL accept as string (legado `numeric(10,7)` nullable) and SHALL persist as-is; range validation is out of scope. <!-- unwanted-behavior -->
- IF `DELETE /api/obras/:obraId/orcamentos/:id` with `id` of another obra same tenant THEN the system SHALL return HTTP 404 with code `ORCAMENTO_NOT_FOUND`. <!-- unwanted-behavior -->
- IF tenant context is missing THEN the system SHALL return HTTP 400 with code `TENANT_CONTEXT_REQUIRED`. <!-- unwanted-behavior -->
- IF obra is soft-deleted THEN the system SHALL reject any guias read/write with HTTP 404 `OBRA_NOT_FOUND`. <!-- state-driven -->
- WHILE `ativo=false` on a cadastro referenced by an existing obra THEN the system SHALL keep the obra readable and SHALL not cascade. <!-- state-driven -->

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| OBG-01 | P1: Cadastros auxiliares | Design | Pending |
| OBG-02 | P1: Cadastros auxiliares | Design | Pending |
| OBG-03 | P1: Cadastros auxiliares | Design | Pending |
| OBG-04 | P1: Cadastros auxiliares | Design | Pending |
| OBG-05 | P1: Cadastros auxiliares | Design | Pending |
| OBG-06 | P1: Cadastros auxiliares | Design | Pending |
| OBG-07 | P1: Cadastros auxiliares | Design | Pending |
| OBG-08 | P1: Cadastros auxiliares | Design | Pending |
| OBG-09 | P1: Cadastros auxiliares | Design | Pending |
| OBG-10 | P1: Cadastros auxiliares | Design | Pending |
| OBG-11 | P1: Cadastros auxiliares | Design | Pending |
| OBG-12 | P1: Cadastros auxiliares | Design | Pending |
| OBG-13 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-14 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-15 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-16 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-17 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-18 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-19 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-20 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-21 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-22 | P2: Localizações e Orçamentos | Design | Pending |
| OBG-23 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-24 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-25 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-26 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-27 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-28 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-29 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-30 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-31 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-32 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-33 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-34 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |
| OBG-35 | P3: Titularidade, Licenças e Recebimentos | Design | Pending |

---

## Success Criteria

- [ ] `GET/POST/PATCH /api/cadastros/*` opera Eixo/Classificacao/Subclassificacao/Tipologia/Subtipologia isolado por tenant, com hierarquia validada e `ativo` como soft-disable.
- [ ] `GET/POST/DELETE /api/obras/:obraId/localizacoes` e `/orcamentos` persistem com validações `uf/fonteId/valor` e isolamento 404 cross-tenant.
- [ ] `titularidade` (upsert), `licencas` e `recebimentos` CRUD com enums `SituacaoTitularidade/SituacaoLicenca/TipoRecebimento` validados e tenant-scoped.
- [ ] `validate_spec.py` passa e todos os ACs são EARS com `SHALL` e `<!-- pattern -->`.
