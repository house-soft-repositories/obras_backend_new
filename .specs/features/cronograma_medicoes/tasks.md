# Cronograma e Medições Tasks

## Test Coverage Matrix

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Migration | integration | tabelas de cronograma em tenants novos/existentes | `test/modules/cronograma/infra` | `docker compose exec api pnpm run test:integration` |
| Domain | unit | validações, transições e cálculo de datas | `test/modules/cronograma/domain` | `docker compose exec api pnpm test -- test/modules/cronograma/domain` |
| Application | unit | isolamento, lote, reordenação e fontes | `test/modules/cronograma/application` | `docker compose exec api pnpm test -- test/modules/cronograma/application` |
| HTTP | e2e | sequência completa e 401/404/400 | `test/modules/cronograma/controller` | `docker compose exec api pnpm run test:e2e -- test/modules/cronograma/controller` |

## Gate Check Commands

| Gate Level | Command |
| --- | --- |
| Quick | `docker compose exec api pnpm test -- <task test path>` |
| Full | `docker compose exec api pnpm test && docker compose exec api pnpm run test:e2e && docker compose exec api pnpm run test:integration` |
| Build | `docker compose exec api pnpm run build && docker compose exec api pnpm run lint` |

## Execution Plan

```
Phase 1: T1 → T2 → T3 → T4
Phase 2: T4 → T5 → T6
```

## Task Breakdown

## Phase 1: Fundação e P1

#### T1: Migration e modelos de estágio

**What**: Criar migration reversível para `estagio` e modelos/mapper tipados.
**Where**: `src/core/database/migrations/*`, `src/modules/cronograma/infra/*`
**Depends on**: none
**Requirement**: CRO-01..CRO-07
**Tests**: migration e mapper unit tests
**Gate**: Quick
**Status**: Complete

#### T2: Entidade e contrato de estágio

**What**: Implementar `EstagioEntity`, enums, exceções, adapter e use case.
**Where**: `src/modules/cronograma/domain/*`, `src/modules/cronograma/adapters/*`
**Depends on**: T1
**Requirement**: CRO-01..CRO-07
**Tests**: entity tests para validação e transições básicas
**Gate**: Quick
**Status**: Complete

#### T3: Repository e services P1

**What**: Implementar repository tenant-scoped, criação/listagem/obtenção/update,
reordenação transacional, lote e predefinidos.
**Where**: `src/modules/cronograma/application/*`, `src/modules/cronograma/infra/repositories/*`
**Depends on**: T2
**Requirement**: CRO-01..CRO-07
**Tests**: services e repository tests com isolamento tenant
**Gate**: Quick
**Status**: Complete — P1 repository/application implemented with obra validation, atomic lote and focused repository/application tests.

#### T4: Controller P1 e wiring

**What**: Criar DTOs/controller/module, registrar no AppModule e cobrir as rotas P1.
**Where**: `src/modules/cronograma/controller/*`, `src/modules/cronograma/dtos/*`, `src/modules/cronograma/cronograma.module.ts`, `src/app.module.ts`
**Depends on**: T3
**Requirement**: CRO-01..CRO-07
**Tests**: e2e P1
**Gate**: Full
**Status**: Complete — P1 routes wired with serializable responses, predefinidos and focused e2e coverage for CRUD/lote/reorder/auth/validation.

## Phase 2: P2/P3

#### T5: Acompanhamentos e comentários

**What**: Implementar tabelas, entidades, services e rotas de acompanhamento, comentário, percentual direto e datas agregadas.
**Where**: `src/modules/cronograma/*`
**Depends on**: T4
**Requirement**: CRO-08..CRO-12
**Tests**: unit + e2e dos fluxos P2
**Gate**: Full
**Status**: Complete — P2 endpoints, service methods, repository writes, unit/repository tests and e2e happy/404/400 coverage implemented.

#### T6: Medições e transições

**What**: Implementar medições, itens por fonte, assumir/concluir/duplicar e estágio atual.
**Where**: `src/modules/cronograma/*`
**Depends on**: T5
**Requirement**: CRO-13..CRO-18
**Tests**: unit + e2e sequência completa
**Gate**: Full
**Status**: Complete — P3 endpoints, medicao entity, service/repository methods, focused service (9 P3 cases) and repository (7 P3 cases) tests, and e2e happy/422 coverage implemented.
