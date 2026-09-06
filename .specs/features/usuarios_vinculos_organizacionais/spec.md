# Vínculos Organizacionais de Usuários Specification

## Problem Statement

Obras precisa que usuários possam carregar referências organizacionais e que setores com usuários vinculados não sejam movidos sem uma regra explícita.

## Goals

- [x] Associar usuários de tenant a localidade, órgão e setor do mesmo schema.
- [x] Proteger a movimentação de setores com usuários vinculados.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Perfis legados granulares | O modelo atual não contém atribuições por órgão. |
| Exclusão de vínculos | Exige política de usuário. |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- |
| Integridade | Órgão, setor e localidade devem pertencer ao tenant verificado. | Impede referências cross-tenant. | y |

**Open questions:** none.

## User Stories

### P1: Vincular usuário à estrutura organizacional

**User Story**: As an administrator, I want user organizational references so that Obras can enforce its responsibility chain.

**Acceptance Criteria**:

1. WHEN an `ADMIN` creates a tenant user with organizational identifiers THEN the system SHALL persist only locality, organization, and sector from the verified tenant. <!-- event-driven -->
2. IF an organizational identifier is absent from the verified tenant THEN the system SHALL return HTTP 404 with a registered code. <!-- unwanted-behavior -->
3. IF a sector does not belong to the supplied organization THEN the system SHALL return HTTP 400 with a registered code. <!-- unwanted-behavior -->

### P1: Proteger movimentação de setor

**User Story**: As an administrator, I want linked sectors protected from unsafe moves.

**Acceptance Criteria**:

1. IF a sector has one or more linked users and a move to another organization is requested THEN the system SHALL return HTTP 422 with a registered code and leave the sector unchanged. <!-- unwanted-behavior -->
2. WHEN a sector has no linked users and a verified-tenant destination organization is supplied THEN the system SHALL move the sector and return the updated record. <!-- event-driven -->

## Edge Cases

- IF tenant context is absent THEN the system SHALL reject the request before tenant-schema persistence.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| UOR-01 | P1: User links | Design | Verified |
| UOR-02 | P1: User links | Design | Verified |
| UOR-03 | P1: Sector movement | Design | Verified |

**Coverage:** 3 total, 3 mapped to tasks, 0 unmapped.

## Success Criteria

- [x] User organizational references and sector movement integrity are enforced per tenant.

## Gate Check Commands

| Gate Level | Command |
| --- | --- |
| Quick | `docker compose exec api pnpm test -- test/modules/users/application/create_user.service.spec.ts test/modules/orgaos/application/orgao_setor.services.spec.ts` |
| Full | `docker compose exec api pnpm run test:e2e -- test/identity.e2e-spec.ts && docker compose exec api pnpm run test:integration -- test/modules/users/infra/repositories/user.repository.spec.ts test/modules/orgaos/infra/repositories/orgao_setor.repository.spec.ts` |
| Build | `docker compose exec api pnpm run build && docker compose exec api pnpm run lint && docker compose exec api pnpm test` |

## Execution Plan

### Phase 1: User organization persistence

```
T1 → T2
```

### Phase 2: Sector move protection

```
T2 → T3
```
