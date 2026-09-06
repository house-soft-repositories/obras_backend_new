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

## Handoff

- **Feature**: `.specs/features/cadastros_orgaos_setores`
- **Phase / Task**: Phase 3, T4 complete
- **Completed**: T1 tenant-schema bootstrap already creates `orgaos` and `setores` for new and existing tenant schemas; T2 orgao/setor entities, mappers and tenant-scoped repositories; T3 orgao/setor use cases with authorization and parent validation; T4 guarded and validated orgao/setor HTTP endpoints; test constants/mocks reorganized under `test/constants` and `test/mocks`.
- **In-progress** (file:line): none
- **Next step**: Await next spec selection or explicit commit authorization.
- **Blockers**: none.
- **Uncommitted files**: locality foundation, plan artifacts and pre-existing identity worktree edits.
- **Branch**: master
