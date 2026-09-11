# STATE

## Decisions

### AD-001
- **Decision**: Tenant-owned persistence will use one global TypeORM DataSource, verified request tenant context, and explicit schema-qualified access.
- **Reason**: This keeps a single managed connection pool while enforcing tenant isolation without trusting client-selected schemas.
- **Trade-off**: Tenant repositories must resolve context explicitly instead of relying on PostgreSQL `search_path` or a per-tenant DataSource.
- **Scope**: Core multi-tenancy infrastructure and every future tenant-scoped repository.
- **Date**: 2026-09-02
- **Status**: active

### AD-002
- **Decision**: The global tenancy record preserves the legacy business shape (`name`, unique `slug`, optional `cnpj`, and `active`) and adds a generated, unique `schemaName` for schema isolation.
- **Reason**: Existing product semantics remain intact while the new architecture receives a safe, durable schema identifier.
- **Trade-off**: Tenant provisioning persists one additional infrastructure-oriented field and no longer treats the display name as unique.
- **Scope**: Tenancy domain, public-schema migration, authentication tenant resolution, and future tenant-scoped repositories.
- **Date**: 2026-09-02
- **Status**: active

### AD-003
- **Decision**: User e-mail uniqueness is scoped to a tenancy, with a separate partial uniqueness rule for platform accounts without a tenant.
- **Reason**: This preserves the established identity model and permits the same e-mail to belong to distinct tenant scopes.
- **Trade-off**: Authentication must resolve credentials within the intended tenant or platform scope rather than assuming one global user record per e-mail.
- **Scope**: User persistence, login lookup, provisioning rules, and identity migrations.
- **Date**: 2026-09-02
- **Status**: active

### AD-004
- **Decision**: Tenant provisioning is superadmin-only; user provisioning is restricted to superadmins for any tenancy and tenant admins for `USER` and `STAFF` roles in their own verified tenancy.
- **Reason**: Management actions must not let a request choose an unauthorized tenant boundary or elevate a tenant administrator's privileges.
- **Trade-off**: User-creation workflows require a verified creator context and explicit authorization checks.
- **Scope**: Tenancy and user application services, HTTP guards, and provisioning controllers.
- **Date**: 2026-09-02
- **Status**: active

### AD-005
- **Decision**: A superadmin-selected tenant applies only for the active authenticated session and is not a permanent user property.
- **Reason**: Superadmins must be able to work inside a chosen tenant context without mutating the stored identity record or persisting a long-lived tenant assignment.
- **Trade-off**: Authentication and refresh flows must carry the selected tenant through the token/session lifecycle, and tenant-aware requests must validate the current session context.
- **Scope**: Auth login/switch/refresh flows, tenant context resolution, and superadmin-facing tenant-bound requests.
- **Date**: 2026-09-08
- **Status**: active

## Handoff

- **Feature**: `.specs/features/obras_gestao_completa`
- **Feature**: `.specs/features/obras_gestao_completa`
- **Phase / Task**: Execute T7+T8 Done → Verify
- **Completed**: T1..T8 completos: migration 20+ cols + domain enums/entities + repos + P1 list/get/update + HTTP + duplicate + equipe/tags/observacoes (16 rotas novas) + build/test verdes, boot sem UnknownDependencies
- **In-progress** (file:line): `Verify: pnpm run build && pnpm test test/modules/obras`
- **Next step**: Verifier + atualizar validation.md + decidir commit (aguardando autorização)
- **Blockers**: none.
- **Uncommitted files**: `src/core/multitenancy/tenant_identity_schema.ts`, `src/core/database/migrations/1781210000000-obra_gestao_completa.ts`, `.specs/features/obras_gestao_completa/tasks.md`, `.specs/STATE.md`
- **Branch**: master
