# Obras Guias e Cadastros — Tasks

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `jest` via `package.json`, `test/jest-e2e.json`, `test/jest-integration.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Migration / schema | integration | Criação de 10 tabelas (eixo, classificacao, subclassificacao, tipologia, subtipologia, obra_localizacao, obra_orcamento_previsto, titularidade, licenca, recebimento) em tenants novos e existentes | `test/modules/obras/infra/migrations*` | `docker compose exec api pnpm run test:integration` |
| Domain (CadastroEntity, Guias Entities) | unit | Validação nome>=2, uf length 2, valor numeric>0, enums SituacaoTitularidade/Licenca/TipoRecebimento, parent tenant check | `test/modules/obras/domain/` | `docker compose exec api pnpm test -- test/modules/obras/domain` |
| Application (CadastrosService, GuiasService) | unit | Tenant isolation 404, parent not found 404, fonte not found 422, enum invalid 400, idempotência, soft-delete bloqueia guias | `test/modules/obras/application/` | `docker compose exec api pnpm test -- test/modules/obras/application` |
| Controller / HTTP (CadastrosController, GuiasController) | e2e | CRUD completo, cross-tenant 404, ValidationPipe whitelist, AccessTokenGuard 401, paginação, upsert titularidade | `test/modules/obras/controller/` | `docker compose exec api pnpm run test:e2e -- test/modules/obras/controller` |

## Gate Check Commands

| Gate Level | Command |
| --- | --- |
| Quick | `docker compose exec api pnpm test -- <task test path>` |
| Full | `docker compose exec api pnpm test && docker compose exec api pnpm run test:e2e && docker compose exec api pnpm run test:integration` |
| Build | `docker compose exec api pnpm run build && docker compose exec api pnpm run lint` |

## Execution Plan

Fase 1: T1 (migration + códigos)
Fase 2: T1 → T2 (domain) → T3 (models/mappers) → T4 (repositories)
Fase 3: T4 → T5 (services) → T6 (cadastros HTTP) → T7 (guias HTTP) → Build Gate

```
Phase 1: T1
Phase 2: T1 → T2 → T3 → T4
Phase 3: T4 → T5 → T6 → T7
```

## Task Breakdown

### Phase 1: Fundação

#### T1: Migration + error codes + symbols

**What**: Criar migration `1781220000000-obras_guias_cadastros.ts` que itera `tenancies` e cria 10 tabelas tenant-scoped (5 cadastros + 5 guias) com `IF NOT EXISTS`; adicionar constantes em `src/core/constants/error_code.constants.ts` (`CADASTRO_NOT_FOUND`, `CADASTRO_PARENT_NOT_FOUND`, `CADASTRO_INVALID_NOME`, `CADASTRO_REPOSITORY_FAILED`, `FONTE_NOT_FOUND`, `GUIA_INVALID_INPUT`, `GUIA_INVALID_ENUM`, `GUIA_NOT_FOUND`, `GUIA_REPOSITORY_FAILED`, `TITULARIDADE_NOT_FOUND`, `LICENCA_NOT_FOUND`, `RECEBIMENTO_NOT_FOUND`); estender `src/modules/obras/symbols.ts` com `CADASTROS_REPOSITORY`, `CADASTROS_SERVICE`, `GUIAS_REPOSITORY`, `GUIAS_SERVICE`.
**Where**: `src/core/database/migrations/1781220000000-obras_guias_cadastros.ts`, `src/core/constants/error_code.constants.ts`, `src/modules/obras/symbols.ts`
**Depends on**: none
**Requirement**: OBG-01..OBG-35 (foundation)
**Tests**: integration `test/modules/obras/infra/migrations/obras_guias_cadastros.migration.spec.ts` (verifica 10 tabelas criadas em schema novo)
**Gate**: Full
**Status**: Complete

### Phase 2: Domínio e Infra

#### T2: Domain entities + enums

**What**: Criar enums `SituacaoTitularidade`, `SituacaoLicenca`, `TipoRecebimento` em `domain/enums/`; implementar `CadastroEntity` abstração com `EixoEntity`, `ClassificacaoEntity`, `SubclassificacaoEntity`, `TipologiaEntity`, `SubtipologiaEntity` (factory `create` + `fromData` + `validate` nome>=2); implementar `ObraLocalizacaoEntity`, `ObraOrcamentoPrevistoEntity`, `TitularidadeEntity`, `LicencaEntity`, `RecebimentoEntity` com validações (uf 2 chars, valor >0, enums) e exceptions `CadastroDomainException`, `GuiaDomainException`.
**Where**: `src/modules/obras/domain/enums/situacao_titularidade.enum.ts`, `situacao_licenca.enum.ts`, `tipo_recebimento.enum.ts`, `src/modules/obras/domain/entities/cadastro.entity.ts`, `src/modules/obras/domain/entities/guias.entity.ts`, `src/modules/obras/exceptions/cadastro_domain.exception.ts`, `guia_domain.exception.ts`
**Depends on**: T1
**Requirement**: OBG-01..OBG-12, OBG-13..OBG-35
**Tests**: unit `test/modules/obras/domain/cadastro.entity.spec.ts`, `guias.entity.spec.ts`
**Gate**: Quick
**Status**: Complete

#### T3: Infra models + mappers

**What**: Criar 10 TypeORM models tenant-scoped (`EixoModel`, `ClassificacaoModel`, `SubclassificacaoModel`, `TipologiaModel`, `SubtipologiaModel` em `cadastro.model.ts`; `ObraLocalizacaoModel`, `ObraOrcamentoPrevistoModel`, `TitularidadeModel`, `LicencaModel`, `RecebimentoModel` em `guias.model.ts`) estendendo `BaseModelPrimaryColumnUuid`; criar `CadastroMapper` e `GuiaMapper` com `toEntity`/`toModel` estáticos.
**Where**: `src/modules/obras/infra/models/cadastro.model.ts`, `src/modules/obras/infra/models/guias.model.ts`, `src/modules/obras/infra/mapper/cadastro.mapper.ts`, `src/modules/obras/infra/mapper/guias.mapper.ts`
**Depends on**: T2
**Requirement**: OBG-01..OBG-35
**Tests**: unit mapper `test/modules/obras/infra/mapper/cadastro.mapper.spec.ts`, `guias.mapper.spec.ts`
**Gate**: Quick
**Status**: Complete

#### T4: Repositories tenant-scoped

**What**: Implementar `CadastrosRepository` (DataSource+TenantContext, `findPage`, `findOne`, `save`, `update`, `existsParent`) e `GuiasRepository` (`list/create/delete localizacao`, `list/create/delete orcamento` com fonte check, `get/upsert titularidade`, `list/create/update/delete licenca`, `list/create/update/delete recebimento`, todos com `SELECT ... WHERE deleted_at IS NULL` para obra) usando `ds.query` com schema interpolado; definir interfaces `ICadastrosRepository`, `IGuiasRepository` em `adapters/`.
**Where**: `src/modules/obras/adapters/cadastros_repository.interface.ts`, `guias_repository.interface.ts`, `src/modules/obras/infra/repositories/cadastros.repository.ts`, `guias.repository.ts`, `src/modules/obras/domain/usecase/cadastros.usecase.ts`, `guias.usecase.ts`
**Depends on**: T3
**Requirement**: OBG-01..OBG-35
**Tests**: unit with mocked DataSource `test/modules/obras/infra/repositories/cadastros.repository.spec.ts`, `guias.repository.spec.ts`
**Gate**: Quick
**Status**: Complete

### Phase 3: Casos de uso + HTTP

#### T5: Application services (CadastrosService + GuiasService)

**What**: Implementar `CadastrosService` (valida Entidade.create, checa parent tenant via repo, propaga `CADASTRO_PARENT_NOT_FOUND` 404) e `GuiasService` (valida obra existe tenant, valida fonte via `IFonteRepository`, upsert titularidade com `ON CONFLICT obra_id`, valida enums, trata `deleted_at` bloqueia) implementando `ICadastrosUseCase`/`IGuiasUseCase`; capturar DomainException → `left(ServiceException)`; usar `AsyncResult`.
**Where**: `src/modules/obras/application/cadastros.service.ts`, `src/modules/obras/application/guias.service.ts`
**Depends on**: T4
**Requirement**: OBG-01..OBG-35
**Tests**: unit `test/modules/obras/application/cadastros.service.spec.ts`, `guias.service.spec.ts` (tenant isolation, parent 404, fonte 422, upsert)
**Gate**: Quick
**Status**: Complete

#### T6: Cadastros HTTP (controller + DTOs)

**What**: Criar DTOs `CriarCadastroDto (@MinLength 2)`, `AtualizarCadastroDto (@IsOptional nome + ativo)`; implementar `CadastrosController` com 15 rotas `GET/POST/PATCH eixos|classificacoes|subclassificacoes|tipologias|subtipologias` sob `@Controller('api/cadastros')` + `@UseGuards(AccessTokenGuard)` + `@Param ParseUUIDPipe` + `ValidationPipe whitelist`; mapear `left → HttpException`.
**Where**: `src/modules/obras/dtos/cadastro.dto.ts`, `src/modules/obras/controller/cadastros.controller.ts`
**Depends on**: T5
**Requirement**: OBG-01..OBG-12
**Tests**: e2e `test/modules/obras/controller/cadastros.controller.e2e-spec.ts` (CRUD, apenasAtivos, cross-tenant 404, nome curto 400, parent 404)
**Gate**: Full
**Status**: In progress — implementation complete; application/repository verification and lint remain.

#### T7: Guias HTTP (controller + DTOs) + wiring final

**What**: Criar DTOs `CriarLocalizacaoDto`, `CriarOrcamentoDto`, `SalvarTitularidadeDto`, `SalvarLicencaDto`, `SalvarRecebimentoDto` com `class-validator`; implementar `GuiasController` `@Controller('api/obras/:obraId')` com 14 rotas guias (localizacoes/orcamentos CRUD, titularidade get/upsert, licencas/recebimentos CRUD); estender `ObrasModule` com `TypeOrmModule.forFeature([...10 models])` + providers `CADASTROS_REPOSITORY/GUIAS_REPOSITORY/CADASTROS_SERVICE/GUIAS_SERVICE` via `useFactory`; garantir `docker compose exec api pnpm run build && pnpm run lint` verde; preparar `validation.md` baseline.
**Where**: `src/modules/obras/dtos/guias.dto.ts`, `src/modules/obras/controller/guias.controller.ts`, `src/modules/obras/obras.module.ts`
**Depends on**: T6
**Requirement**: OBG-13..OBG-35
**Tests**: e2e `test/modules/obras/controller/guias.controller.e2e-spec.ts` (CRUD localizacao/orcamento/titularidade/licenca/recebimento, cross-tenant 404, enum 400, obra soft-deleted 404)
**Gate**: Full
**Status**: In progress — implementation complete; controller e2e and lint remain.
