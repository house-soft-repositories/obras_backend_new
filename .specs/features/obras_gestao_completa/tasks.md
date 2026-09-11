# Obras Gestão Completa Tasks

**Design**: `.specs/features/obras_gestao_completa/design.md`

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `jest` via `package.json`, `test/jest-e2e.json`, `test/jest-integration.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Migration / schema | integration | ALTER TABLE obras + criação de tag/obra_tag/observacao em tenants novos e existentes | `test/modules/obras/infra/migrations*` or `test/modules/core/infra` | `docker compose exec api pnpm run test:integration` |
| Domain (ObraEntity, Tag, Observacao) | unit | Toda validação: subclassificacao/tipo, status, tag nome, observacao texto, updatePartial | `test/modules/obras/domain/` | `docker compose exec api pnpm test -- test/modules/obras/domain` |
| Application (list/get/update/duplicate/equipe/tags/observacoes) | unit | Tenant isolation, not-found→404, validação subclassificacao, idempotência equipe, código imutável | `test/modules/obras/application/` | `docker compose exec api pnpm test -- test/modules/obras/application` |
| Repository | integration | Schema isolation, paginação, filtros, soft-delete exclusão, list ordering | `test/modules/obras/infra/repositories/` | `docker compose exec api pnpm run test:integration` |
| HTTP | e2e | List/get/patch/duplicate/equipe/tags/observacoes happy + 401/404/400 + cross-tenant leak | `test/modules/obras/controller/` | `docker compose exec api pnpm run test:e2e` |

## Gate Check Commands

| Gate Level | Command |
| --- | --- |
| Quick | `docker compose exec api pnpm test -- <task test path>` |
| Full | `docker compose exec api pnpm test && docker compose exec api pnpm run test:e2e && docker compose exec api pnpm run test:integration` |
| Build | `docker compose exec api pnpm run build && docker compose exec api pnpm run lint` |

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

## Execution Plan

### Phase 1: Fundação persistência

```
T1
```

### Phase 2: Domínio e repositório

```
T1 → T2 → T3
```

### Phase 3: Casos de uso P1 + HTTP

```
T3 → T4 → T5
```

### Phase 4: P2 Duplicação e P3 sub-recursos

```
T5 → T6 → T7 → T8
```

## Task Breakdown

### Phase 1: Fundação persistência

#### T1: Migration Obras Gestão Completa

**What**: ALTER TABLE `obras` adiciona 20+ colunas (`tipoFinanciamento`, `modoDuracao`, `dataInicio`, `dataPrazo`, `acaoConveniada`, `prioritaria`, `exibirCameraAoVivo`, `cameraUrl`, `privado`, `invisivel`, `considerarSabado/Domingo`, `vincularPagamentoPercentual`, `corresponsaveisPodemEditar`, `programaPpa`, `acaoEstrategica`, `acaoOrcamentaria`, `unidadeMedida`, `quantidade`, `secretario`, `dataPactuada`) + cria `tag`, `obra_tag`, `observacao` em cada schema tenant (novos e existentes via loop TenantSchemaResolver). Parcial index `UQ_obra_codigo WHERE deletedAt IS NULL` se ainda não existe.
**Where**: `src/core/database/migrations/1781210000000-obra_gestao_completa.ts`, `src/core/multitenancy/tenant_schema_resolver.ts`
**Depends on**: None
**Requirement**: OGC-01..OGC-15 (modelo completo)
**Tests**: integration (aplica migration em 2 tenants, verifica colunas e soft-delete index)
**Gate**: Full
**Status**: Complete

### Phase 2: Domínio e repositório

#### T2: Estender ObraEntity + novos Enums

**What**: Adicionar enums `TipoFinanciamento`, `ModoDuracao`, `AcaoConveniada` em `domain/enums/`; estender `ObraProps`/`CreateObraProps`/`UpdateObraProps`, `ObraEntity.create` + `updatePartial` + `validate` com regra `subclassificacaoId` só quando `tipo=OBRA`; criar `TagEntity` e `ObraObservacaoEntity` com factories e validações (`nome 2..40`, `texto 1..2000`).
**Where**: `src/modules/obras/domain/entities/obra.entity.ts`, `src/modules/obras/domain/entities/tag.entity.ts`, `src/modules/obras/domain/entities/observacao.entity.ts`, `src/modules/obras/domain/enums/*`, `src/core/constants/error_code.constants.ts`
**Depends on**: T1
**Requirement**: OGC-02, OGC-03, OGC-04, OGC-11..OGC-15
**Tests**: unit (`test/modules/obras/domain/*.spec.ts`)
**Gate**: Quick
**Status**: Complete

#### T3: Estender ObraRepository + novos Repositories e Mappers

**What**: Atualizar `ObraModel` com 20+ colunas + `@Entity('obras')` índices; criar `TagModel`, `ObraTagModel`, `ObservacaoModel` + mappers; estender `ObraRepository` com `findPage({status,tipo,orgaoId,q,page,limit})`, `findOneWithRelations(id)`, `updatePartial(entity)` filtrando `deletedAt IS NULL`, `softDelete`; implementar `TagRepository` e `ObservacaoRepository` tenant-scoped via `DataSource` + `TenantContext`.
**Where**: `src/modules/obras/infra/models/*`, `src/modules/obras/infra/mapper/*`, `src/modules/obras/infra/repositories/*`, `src/modules/obras/adapters/*`
**Depends on**: T2
**Requirement**: OGC-01, OGC-02, OGC-05, OGC-06
**Tests**: integration + unit mapper
**Gate**: Full
**Status**: Complete

### Phase 3: Casos de uso P1 + HTTP

#### T4: Listar / Consultar / Atualizar obra (P1)

**What**: Implementar `IListObrasUseCase`, `IGetObraUseCase`, `IUpdateObraUseCase` em `application/` com `TenantContext.require()`, paginação `PageEntity`, isolamento (outro tenant → 404 `OBRA_NOT_FOUND`), validação `subclassificacaoId` → 400 `OBRA_INVALID_SUBCLASSIFICACAO`, bloqueio de `codigo` no patch, soft-delete exclusão. Criar symbols `LIST_OBRAS_SERVICE`, `GET_OBRA_SERVICE`, `UPDATE_OBRA_SERVICE`.
**Where**: `src/modules/obras/domain/usecase/*.usecase.ts`, `src/modules/obras/application/list_obras.service.ts`, `get_obra.service.ts`, `update_obra.service.ts`, `src/modules/obras/symbols.ts`, `src/modules/obras/exceptions/*`
**Depends on**: T3
**Requirement**: OGC-01, OGC-02, OGC-03, OGC-04, OGC-05, OGC-06, OGC-07
**Tests**: unit (`test/modules/obras/application/list|get|update*.spec.ts`)
**Gate**: Quick
**Status**: Complete

#### T5: HTTP P1 — GET /api/obras, GET /:id, PATCH /:id

**What**: Criar DTOs `ListObrasQueryDto` (filtros + `PaginationOptionsDto`), `UpdateObraDto extends PartialType(CreateObraDto)` + `status`, expor 3 rotas no `ObraController` (ou `ObrasQueryController`) com `AccessTokenGuard`, `ValidationPipe` whitelist, mapeamento `left → HttpException`; registrar providers em `ObrasModule` via `useFactory`.
**Where**: `src/modules/obras/dtos/list_obras.dto.ts`, `update_obra.dto.ts`, `obra_response.dto.ts`, `src/modules/obras/controller/obra.controller.ts`, `src/modules/obras/obras.module.ts`
**Depends on**: T4
**Requirement**: OGC-01..OGC-07
**Tests**: e2e (`test/modules/obras/controller/obra.controller.e2e-spec.ts` — list com filtros, get cross-tenant 404, patch validação subclassificacao)
**Gate**: Full
**Status**: Complete

### Phase 4: P2 Duplicação e P3 sub-recursos

#### T6: Duplicar obra (P2)

**What**: Implementar `IDuplicateObraUseCase` → `DuplicateObraService` que `findOneWithRelations` origem, gera novo `codigo OBR-<ano>-NNNN` via `codigo_obra.service` com retry 23505, clona `ObraEntity.create` + `obra_orcamentos` + `obra_responsaveis`, não clona `deletedAt/seguidores/observacoes`; expor `POST /api/obras/:id/duplicar`.
**Where**: `src/modules/obras/domain/usecase/duplicate_obra.usecase.ts`, `src/modules/obras/application/duplicate_obra.service.ts`, `src/modules/obras/dtos/duplicate_obra.dto.ts`, controller + module
**Depends on**: T5
**Requirement**: OGC-08, OGC-09, OGC-10
**Tests**: unit + e2e (duplica e assert novo código, origem soft-deleted → 404)
**Gate**: Quick
**Status**: Complete

#### T7: Equipe e Tags (P3)

**What**: Implementar `IEquipeUseCase` (responsáveis/corresponsáveis + seguidores idempotentes com validação `usuarioId` existe via `IUserRepository`) e `ITagsUseCase` (attach/detach `tag`+`obra_tag`, split vírgula/;); criar `EquipeController` (`/obras/:id/equipe/responsaveis`, `/seguidores`) e `TagsController` (`/obras/:id/tags`); DTOs `AddMembroDto`, `AplicarTagsDto`.
**Where**: `src/modules/obras/domain/usecase/equipe.usecase.ts`, `tags.usecase.ts`, `application/equipe.service.ts`, `tags.service.ts`, `controller/equipe.controller.ts`, `tags.controller.ts`, `dtos/equipe.dto.ts`, `tags.dto.ts`
**Depends on**: T6
**Requirement**: OGC-11, OGC-12, OGC-14, OGC-15
**Tests**: unit + e2e (add idempotente, cross-tenant 404, tag normalization)
**Gate**: Quick
**Status**: Complete

#### T8: Observações (P3) + fechamento

**What**: Implementar `IObservacoesUseCase` + `ObservacaoRepository` com `POST/GET/PATCH/DELETE /api/obras/:id/observacoes`, `texto 1..2000`, `criadoPorUsuarioId` do token, tenant-scoped; atualizar `error_code.constants` final, garantir build+lint verdes; preparar `validation.md` baseline.
**Where**: `src/modules/obras/domain/usecase/observacoes.usecase.ts`, `application/observacoes.service.ts`, `infra/repositories/observacao.repository.ts`, `controller/observacoes.controller.ts`, `dtos/observacao.dto.ts`
**Depends on**: T7
**Requirement**: OGC-13, OGC-14, OGC-15
**Tests**: unit + e2e (create/list/update/delete, auditoria autor, cross-tenant 404)
**Gate**: Full
**Status**: Complete

## Phase Execution Map

```
Phase 1: T1
Phase 2: T1 → T2 → T3
Phase 3: T3 → T4 → T5
Phase 4: T5 → T6 → T7 → T8
```

