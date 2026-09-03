# Multi-tenant Identity Foundation Context

**Gathered:** 2026-09-02
**Spec:** `.specs/features/multi_tenant_identity/spec.md`
**Status:** Ready for design

---

## Feature Boundary

The application will gain global tenancy and user persistence, safe tenant-schema provisioning, role-bound user factories, email/password authentication, and tenant context derived from a verified JWT. Tenant-owned business tables and their migrations are not part of this feature.

---

## Implementation Decisions

### Tenant data access

- Use one application-wide TypeORM `DataSource`.
- Keep `public.users` and `public.tenancies` explicitly mapped to the `public` schema.
- Resolve a tenant schema from trusted request context and use schema-qualified table paths for future tenant-owned repositories.
- Do not create a `DataSource` or connection pool per tenant.
- Do not use connection-level `search_path` as tenancy state.

### Tenant identity and schema name

- Create a UUID tenancy identity in the domain.
- Preserve the legacy tenant business fields: `name`, unique `slug`, optional `cnpj`, and `active`.
- Generate schema names as `tenant_<uuid-without-hyphens>`.
- Persist the generated schema name and never use caller-supplied identifiers as SQL schema names.

### Request tenant context

- Authenticate the request before resolving tenant context.
- Put only user UUID in JWT `sub`.
- Carry `role` and `tenantId: string | null` as separate verified claims.
- Give `SUPERADMIN` no active tenant schema context.

### Authentication boundary

- Use bcrypt for password hashing with the validated `SALT` configuration value.
- Use `JWT_SECRET` to sign access tokens.
- Issue access tokens for one hour and refresh tokens for seven days.
- Persist only the bcrypt hash of each refresh token in a global user session record.
- Rotate the refresh token and revoke its predecessor in one refresh workflow.
- Validate `type: 'access'` for API authentication and `type: 'refresh'` for token refresh.
- Keep password hashing and token signing behind adapters so application services depend on contracts.

### Provisioning authorization

- Only a verified `SUPERADMIN` can create a tenancy.
- A verified `SUPERADMIN` can create a user in any tenancy.
- A verified `ADMIN` can create only `USER` and `STAFF` users in the same tenancy as its access-token `tenantId` claim.
- Derive the creator scope from the verified access token; never authorize from a request-provided tenant identifier.
- Enforce e-mail uniqueness per tenancy and separately for platform accounts with no tenant.

### Test data ownership

- Put reusable immutable fixtures in `test/constants/<module>/<layer>/`.
- Put typed Jest doubles in `test/mocks/<module>/<layer>/`.
- Mirror the module/layer portion of `src/modules/` so a fixture path makes its domain ownership explicit.

### Agent's Discretion

- The exact controller route and DTO response shape follow the project controller convention, provided login returns a signed access token and no sensitive fields.
- The tenancy name validation rule follows the project domain-validator style when that validator layer is introduced.

### Declined / Undiscussed Gray Areas → Assumptions

- Public self-registration is excluded. Tenant and user provisioning require a verified `SUPERADMIN` or, for same-tenant user creation, a verified `ADMIN`.
- Login rate limiting is excluded because no policy was provided.

---

## Specific References

Context7 TypeORM documentation confirms schema-qualified query paths for PostgreSQL. Context7 NestJS documentation confirms `AsyncLocalStorage` middleware as a request-context mechanism.

## Deferred Ideas

- Tenant business models and migration fan-out.
- Superadmin tenant impersonation.
- Refresh-token rotation, password reset, email verification, SSO, and endpoint-level role guards.
