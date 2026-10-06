# Transações multitenant com TypeORM

Helper canônico: `src/core/multitenancy/tenant_manager.ts` (`withTenantManager`).

Ele abre um `QueryRunner` transacional, fixa `SET LOCAL search_path` para o
schema do tenant e entrega um `EntityManager` escopado ao callback. O commit
acontece no sucesso; qualquer throw causa rollback.

## Regra

- Dentro do callback, use **sempre** `manager.getRepository(Model)` + `Mapper.toModel(entity)`.
- **Nunca** use `manager.query` / `dataSource.query` (SQL cru).
- **Nunca** use um repository global fora da transação quando a operação precisa de atomicidade multitenant.

## Uso

```typescript
import { withTenantManager } from '@/core/multitenancy/tenant_manager';

const result = await withTenantManager(dataSource, tenantContext, async (manager) => {
  await manager.getRepository(AlvaraModel).save(AlvaraMapper.toModel(entity));
  await manager
    .getRepository(ObraPrivadaArquivoModel)
    .save(ObraPrivadaArquivoMapper.toModel(arquivoEntity));
  return entity;
});
```

O `schema` continua necessário apenas para construir chaves de storage
(ex.: `buildObraPrivadaArquivoStorageKey(schema, ...)`), nunca para montar
`INSERT INTO "schema".tabela`.

## Origem

Extraído de `src/modules/contratos/infra/repositories/tenant_repository.helper.ts`
(padrão validado em `contrato.repository.ts`, `aditivo.repository.ts`,
`paralisacao.repository.ts`, `empresa_contratada.repository.ts`). O arquivo
antigo permanece apenas como re-export marcado `@deprecated`; código novo
importa do core.
