# Vínculos Organizacionais de Usuários Design

## Overview

Persist optional organizational references on public users and validate every referenced locality, organization and sector against the verified tenant schema before saving. Sector moves are blocked when at least one public user points to the sector.

## Data Model

- `public.users.localidade_id uuid NULL`
- `public.users.orgao_id uuid NULL`
- `public.users.setor_id uuid NULL`

The columns intentionally remain nullable because organizational assignment is optional and tenant business tables live in per-tenant schemas. Referential integrity is enforced by application/repository checks against the verified tenant schema.

## Application Flow

- User creation resolves the target tenant exactly as today.
- If any organizational reference is supplied, the service validates it through a tenant-aware user organization reference repository.
- Missing locality, organization or sector returns 404 with registered codes.
- A supplied sector must belong to the supplied organization; otherwise the service returns 400 with a registered code.
- Sector update checks linked users before changing `orgaoId`; linked sectors return 422 and are not saved.

## Boundaries

- No user listing or user deletion is introduced.
- Existing role creation policy remains unchanged.
- HTTP update-user is not introduced because no user update endpoint exists in the current API surface.
