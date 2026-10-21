# Cronograma e Medições Design

**Status**: In progress
**Date**: 2026-09-14

## Contexto

O módulo será tenant-scoped no schema resolvido por `TenantContext`, seguindo
as convenções DDD do backend atual. A obra será validada por consulta
tenant-scoped antes de criar ou alterar qualquer registro do cronograma.

## Modelo de dados

- `estagio`: identidade, `obra_id`, nome, posição, status, modo de duração,
  datas planejadas/reais, percentual direto e timestamps.
- `estagio_acompanhamento`: estágio/obra, percentual, data, observação e autor.
- `estagio_comentario`: estágio/obra, texto, autor e timestamps.
- `medicao`: obra, número, tipo, data, observação e timestamps.
- `medicao_fonte`: medição, fonte, valor e timestamps.

Todas as tabelas carregam `tenant_id` e índices por pai/posição. Relações são
checadas por `tenant_id` e pela chave do pai; registros de outro tenant são
tratados como inexistentes.

## P1 — Estágios

`EstagioEntity` concentra validações de nome, posição e transições de status.
`EstagioRepository` fornece criação, paginação ordenada, atualização, remoção
e atualização atômica de posições. `EstagiosService` valida a obra e delega
operações ao repositório. A controller usa `AccessTokenGuard`, DTOs validados e
`TenantRequestContextService`.

Rotas P1: criar/listar, obter/atualizar/remover, reordenar, criação em lote e
predefinidos. A reordenação usa uma transação e recebe uma lista ordenada de
UUIDs.

## P2 — Acompanhamentos e comentários

Serviços separados mantêm contratos pequenos. Acompanhamentos validam
percentual entre 0 e 100 e comentários exigem texto não vazio. Datas agregadas
são calculadas em serviço de domínio puro para facilitar testes determinísticos.

## P3 — Medições e transições

Medições usam enum fechado e uma coleção de itens por fonte. A criação valida
fontes ativas no tenant. `assumir`, `concluir`, `duplicar` e `estagio-atual`
serão serviços de domínio separados, sem lógica de transição no controller.

## Testes e gates

- Unitários para entidades, cálculos e services sem `@nestjs/testing`.
- Testes de repository com `DataSource` mockado e SQL tenant-scoped.
- E2E para sequência estágio → acompanhamento → medição → estágio atual.
- Gates: `pnpm test`, e2e focado, `pnpm run build` e validação TLC.
