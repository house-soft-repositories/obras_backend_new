# Cadastros de Localidades Design

## Decisão

Localidades serão persistidas exclusivamente no schema resolvido pelo contexto
de tenant. A aplicação não aceitará schema, tenancy ou `tenantId` no payload
HTTP.

## Componentes

| Camada | Responsabilidade |
| --- | --- |
| `TenantIdentitySchema` e migration | Criar a tabela `localidades` para tenancies novas e existentes. |
| `localidades/domain` | Validar os campos de uma localidade e preservar a entidade rica. |
| `localidades/infra` | Executar SQL qualificado pelo schema confiável e mapear linhas para entidade. |
| `localidades/application` | Autorizar leitura/escrita e criar, listar ou atualizar registros. |
| `localidades/controller` | Validar DTOs, instalar o contexto de request e traduzir falhas em HTTP. |

## Fluxo

```text
access token -> AccessTokenGuard -> TenantRequestContextService
             -> LocalidadeController -> use case -> LocalidadeRepository
             -> verified tenant schema.localidades
```

`ADMIN` pode criar e atualizar. `ADMIN`, `STAFF` e `USER` podem listar. Um
superadministrador sem contexto de tenant e qualquer token sem tenancy válida
falham antes de consultar o schema.

## Persistência

A tabela usa UUID fornecido pela entidade, `nome`, `uf(2)`, os campos opcionais
`codigo_ibge`, `tipo`, `municipio` e `observacoes`, além de timestamps. A
consulta de lista ordena por `nome ASC`. Cada acesso usa o nome de schema
validado por `TenantSchemaResolver`; identificadores de outro schema não têm
como corresponder a uma linha local e retornam `LOCALIDADE_NOT_FOUND`.

## Atualização

O use case busca o registro no schema corrente, aplica somente os campos
presentes no DTO, recria o valor validado e solicita a persistência. Não há
remoção nem consulta a Obras.

## Erros

Falhas de formato e de domínio retornam 400 com código `LOCALIDADE_INVALID_*`.
Ausência no schema corrente retorna 404 com `LOCALIDADE_NOT_FOUND`. Falha de
persistência retorna 500 com `LOCALIDADE_REPOSITORY_FAILED`.
