# Contratos Gestão — Tasks

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `AGENTS.md`, `jest` via `package.json`, `test/jest-e2e.json`, `test/jest-integration.json`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Migration / schema | integration | Criação 7 tabelas contrato/aditivo/paralisacao/empresa em tenants novos e existentes | `test/modules/contratos/infra/migrations*` | `docker compose exec api pnpm run test:integration` |
| Domain (Contrato/Aditivo/Paralisacao/Empresa + calculo-prazo) | unit | Validação numero/dataOs/tipo, prazoDias xor Data, fontes>=1, CNPJ dígito, prazo-final considera aditivos+paralisacoes+sab/do | `test/modules/contratos/domain/` | `docker compose exec api pnpm test -- test/modules/contratos/domain` |
| Application (Contratos/Aditivos/Paralisacoes/Empresas) | unit | Tenant isolation 404, duplicate 409, fonte 422, reinicio before 422, 1 contrato por obra | `test/modules/contratos/application/` | `docker compose exec api pnpm test -- test/modules/contratos/application` |
| Controller / HTTP | e2e | CRUD completo, cross-tenant 404, prazo-final/valores, ValidationPipe, AccessTokenGuard | `test/modules/contratos/controller/` | `docker compose exec api pnpm run test:e2e -- test/modules/contratos/controller` |

## Gate Check Commands

| Gate Level | Command |
| --- | --- |
| Quick | `docker compose exec api pnpm test -- <task test path>` |
| Full | `docker compose exec api pnpm test && docker compose exec api pnpm run test:e2e && docker compose exec api pnpm run test:integration` |
| Build | `docker compose exec api pnpm run build && docker compose exec api pnpm run lint` |

## Execution Plan

```
Phase 1: T1
Phase 2: T1 → T2 → T3 → T4
Phase 3: T4 → T5 → T6 → T7
```

## Task Breakdown

### Phase 1: Fundação

#### T1: Migration + error codes + symbols + enums

**What**: Criar migration `1781230000000-contratos.ts` com 7 tabelas tenant-scoped (`empresa_contratada, empresa_contratada_telefone, contrato, contrato_fonte, aditivo, aditivo_fonte, paralisacao`) loop `tenancies`; adicionar `error_code.constants` (`CONTRATO_NOT_FOUND`, `CONTRATO_DUPLICATE_NUMERO`, `CONTRATO_INVALID_INPUT`, `CONTRATO_REPOSITORY_FAILED`, `ADITIVO_NOT_FOUND`, `ADITIVO_DUPLICATE_NUMERO`, `ADITIVO_INVALID_INPUT`, `PARALISACAO_NOT_FOUND`, `PARALISACAO_INVALID_REINICIO`, `EMPRESA_NOT_FOUND`, `EMPRESA_DUPLICATE_CNPJ`, `EMPRESA_INVALID_CNPJ`, `EMPRESA_REPOSITORY_FAILED`, `FONTE_NOT_FOUND`); criar `src/modules/contratos/symbols.ts` (6 symbols); criar `domain/enums/contratos.enums.ts` (`TipoAditivo`, `TipoPrazoExecucao`); portar `domain/calculo_prazo_execucao.ts` puro do legado.
**Where**: `src/core/database/migrations/1781230000000-contratos.ts`, `src/core/constants/error_code.constants.ts`, `src/modules/contratos/symbols.ts`, `src/modules/contratos/domain/enums/*`, `src/modules/contratos/domain/calculo_prazo_execucao.ts`
**Depends on**: none
**Requirement**: CTR-01..CTR-15 (foundation)
**Tests**: integration migration `test/modules/contratos/infra/migrations/contratos.migration.spec.ts`
**Gate**: Full
**Status**: Complete

### Phase 2: Domínio e Infra

#### T2: Domain entities + exceptions

**What**: Implementar `ContratoEntity` (valida obraId/empresaId/numero/dataOs/tipo, prazoDias xor Data, fontes>=1), `AditivoEntity` (numero unique per contrato, tipo/prazo), `ParalisacaoEntity` (dataParalisacao/motivo/termo, dataReinicio?), `EmpresaContratadaEntity` (cnpj 14 dígitos dígito, razaoSocial, ativo, telefones) com `create/fromData/validate/update` + `DomainException`; criar `ContratoDomainException`, `ContratoRepositoryException` etc.; adicionar `CnpjValidator`.
**Where**: `src/modules/contratos/domain/entities/*`, `src/modules/contratos/exceptions/*`, `src/core/validators/cnpj.validator.ts` (se não existe)
**Depends on**: T1
**Requirement**: CTR-01..CTR-15
**Tests**: unit `test/modules/contratos/domain/*.spec.ts`
**Gate**: Quick
**Status**: Complete

#### T3: Infra models + mappers

**What**: Criar 7 TypeORM models (`EmpresaContratadaModel`, `EmpresaTelefoneModel`, `ContratoModel`, `ContratoFonteModel`, `AditivoModel`, `AditivoFonteModel`, `ParalisacaoModel`) estendendo `BaseModelPrimaryColumnUuid` ou manual PK; criar mappers `ContratoMapper`, `AditivoMapper`, `ParalisacaoMapper`, `EmpresaMapper` estáticos `toEntity/toModel`.
**Where**: `src/modules/contratos/infra/models/*`, `src/modules/contratos/infra/mapper/*`
**Depends on**: T2
**Requirement**: CTR-01..CTR-15
**Tests**: unit mapper `test/modules/contratos/infra/mapper/*.spec.ts`
**Gate**: Quick
**Status**: Complete

#### T4: Repositories

**What**: Implementar `ContratoRepository` (DataSource+TenantContext, `save`, `findById`, `findPage()` tenant-global, `assertObraExists`, `prazoFinal` monta Entrada + chama calculo, `valores` soma), `AditivoRepository`, `ParalisacaoRepository` (`save`, `listByContrato`, `findOne`, `reiniciar`), `EmpresaContratadaRepository` (`save`, `list`, `existsCnpj`, `findOne`) com `tenant_id` isolation e `ON CONFLICT` handling 23505→409; criar adapters `IContratoRepository` etc. e usecase types `ICreateContratoUseCase` etc.
**Where**: `src/modules/contratos/adapters/*`, `src/modules/contratos/domain/usecase/*`, `src/modules/contratos/infra/repositories/*`
**Depends on**: T3
**Requirement**: CTR-01..CTR-15
**Tests**: unit mocked DataSource `test/modules/contratos/infra/repositories/*.spec.ts`
**Gate**: Quick
**Status**: Complete

### Phase 3: Casos de uso + HTTP

#### T5: Application services P1 (Contratos)

**What**: Implementar `ContratosService` (`create` valida empresa pertence tenant, obra existe e unique obraId →409, `ContratoEntity.create` → repo.save com fontes; `list` paginado tenant-scoped; `getById` 404 se outro tenant; `prazoFinal`/`valores` delegam repo); `CreateContrato` usa `FONTE_REPOSITORY` check fonte tenant; tratamento `DomainException→left`.
**Where**: `src/modules/contratos/application/contratos.service.ts`
**Depends on**: T4
**Requirement**: CTR-01..CTR-06
**Tests**: unit `test/modules/contratos/application/contratos.service.spec.ts` (isolation 404, duplicate 409, prazoFinal calcula)
**Gate**: Quick
**Status**: Complete

#### T6: Application services P2/P3 (Aditivos, Paralisacoes, Empresas)

**What**: Implementar `AditivosService` (`create` valida contrato tenant, `AditivoEntity.create`, unique numero→409), `ParalisacoesService` (`create`, `reiniciar` valida dataReinicio > dataParalisacao else 422, `list`), `EmpresasContratadasService` (`create` valida cnpj dígito, unique per contrato→409, `list`, `update ativo`); todos `AsyncResult` + `AccessToken`.
**Where**: `src/modules/contratos/application/aditivos.service.ts`, `paralisacoes.service.ts`, `empresas_contratadas.service.ts`
**Depends on**: T5
**Requirement**: CTR-07..CTR-15
**Tests**: unit `test/modules/contratos/application/aditivos.service.spec.ts`, `paralisacoes.service.spec.ts`, `empresas.service.spec.ts`
**Gate**: Quick
**Status**: Complete

#### T7: HTTP controllers + DTOs + wiring + build gate

**What**: Criar DTOs (`CriarContratoDto`, `CriarAditivoDto`, `CriarParalisacaoDto`, `ReinicioDto`, `CriarEmpresaContratadaDto`) com `class-validator`; implementar `ContratosController` (`POST /api/contratos`, `GET /api/contratos?obraId=&page&take`, `GET /api/contratos/:id`, `GET :id/prazo-final`, `GET :id/valores`, `GET /api/obras/:obraId/contratos` alias), `AditivosController` (`POST/GET /api/contratos/:contratoId/aditivos`), `ParalisacoesController` (`POST/GET` + `POST :id/reinicio`), `EmpresasContratadasController` (`POST/GET /api/empresas-contratadas?contratoId=`); criar `ContratosModule` com `TypeOrmModule.forFeature([...7 models])` + 4 repos + 4 services via `useFactory`; registrar no `AppModule`; garantir `build+lint` verde; atualizar `validation.md`.
**Where**: `src/modules/contratos/dtos/*`, `src/modules/contratos/controller/*`, `src/modules/contratos/contratos.module.ts`, `src/app.module.ts`
**Depends on**: T6
**Requirement**: CTR-01..CTR-15
**Tests**: e2e `test/modules/contratos/controller/*.e2e-spec.ts` (CRUD, cross-tenant 404, prazo-final inclui aditivo+paralisacao, cnpj 400)
**Gate**: Full
**Status**: In progress — implementation complete; application/repository/controller verification and lint remain.
