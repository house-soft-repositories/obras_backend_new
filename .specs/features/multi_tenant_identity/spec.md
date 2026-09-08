# Multi-tenant Identity Foundation Specification

## Problem Statement

The application has no persistent identity or tenancy boundary. It needs a TypeORM-managed PostgreSQL foundation that keeps global identity data in `public`, creates isolated tenant schemas for future tenant data, and authenticates users without allowing a request to choose an arbitrary tenant.

## Goals

- [ ] Create reversible TypeORM migrations, run through the existing DataSource, for global tenancy and user data in the `public` schema.
- [ ] Provide DDD modules for tenancy, users, and authentication with UUID identities, role-specific user factories, bcrypt password hashing, and access/refresh JWT issuance.
- [ ] Establish a trusted request tenant context from a verified JWT for future schema-scoped persistence.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Tenant business tables inside each tenant schema | This feature only establishes schema provisioning and tenant resolution. |
| User-management CRUD beyond initial registration/provisioning and login | Not requested as part of the identity foundation. |
| Password reset, email verification, SSO, and RBAC guards for business endpoints | Separate authentication and authorization features. |
| Cross-tenant reports and schema migration fan-out | No tenant-owned business models exist yet. |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here - nothing is left silently unclear.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Tenant data model | Preserve the legacy tenant shape: `id`, `name`, unique `slug`, optional `cnpj`, `active`, `schemaName`, `createdAt`, and `updatedAt`; `slug` and `schemaName` are unique. | Retains the established business identity while adding the safe schema identifier required by the new isolation design. | y |
| Tenant schema naming | Generate and persist `tenant_<uuid-without-hyphens>`; never interpolate a caller-provided schema name into SQL. | Prevents SQL identifier injection and makes names deterministic. | y |
| Tenant resolution | Verify JWT first, then derive the request tenant from its `tenantId` claim; `SUPERADMIN` only carries a tenant context after an explicit switch for the active session. | A client-controlled header or subdomain alone would permit tenant switching, while a permanent tenant assignment would incorrectly mutate the identity record. | y |
| Tenant and user provisioning policy | Only a `SUPERADMIN` can create tenancies and create users in a different tenancy. An `ADMIN` can create only `USER` and `STAFF` users in the authenticated creator's own tenancy; no public self-registration route exists. | Tenant ownership and role elevation must derive from verified identity rather than caller-controlled values. | y |
| JWT claims | Access tokens use `sub` as the user UUID, `type: 'access'`, `role`, and `tenantId: string | null`. Refresh tokens use `sub`, `sid`, `tenantId: string | null`, and `type: 'refresh'`. Neither token contains password, email, or name. | `sub` identifies the principal; a null tenant ID represents an unswitched superadmin session; `sid` binds refresh rotation to a revocable session; distinct type claims prevent cross-token use. | y |
| Token lifecycle | Access tokens expire after one hour. Refresh tokens expire after seven days, rotate on refresh, and are persisted only as a bcrypt hash in a global session record. | The chosen durations balance API usability and revocation capability without retaining a reusable token. | y |
| JWT signing secret | Both token types use the required `JWT_SECRET` with distinct `type` claims. | The current environment contract provides one secret; token type is validated on every use. | y |
| Duplicate email policy | Email is unique within a tenancy; platform accounts with null `tenantId` are unique among platform accounts. | Matches the legacy identity model while preventing duplicate login identities inside the same tenant scope. | y |

**Open questions:** none.

---

## User Stories

### P1: Persist global tenancy and users ⭐ MVP

**User Story**: As a platform operator, I want tenancy and user records stored in `public` so that identities and tenant membership are globally and consistently managed.

**Why P1**: Authentication and tenant isolation depend on an authoritative global identity store.

**Acceptance Criteria**:

1. WHEN TypeORM runs the initial identity migration THEN the application SHALL create `public.tenancies`, `public.users`, and `public.user_sessions` with UUID primary keys and reversible `down` operations. <!-- event-driven -->
2. The application SHALL persist tenancy `id`, `name`, `slug`, optional `cnpj`, `active`, `schemaName`, `createdAt`, and `updatedAt` in `public.tenancies`, with unique `slug` and `schemaName`. <!-- ubiquitous -->
3. The application SHALL persist user `id`, `name`, `email`, `password`, `role`, `tenantId`, `createdAt`, and `updatedAt` in `public.users`, with an email unique within its tenancy and a separate uniqueness constraint for platform accounts. <!-- ubiquitous -->
4. IF a user role is `SUPERADMIN` THEN the application SHALL persist a null `tenantId` and SHALL NOT store any permanent tenant assignment on the user record. <!-- unwanted-behavior -->
5. IF a user role is `ADMIN`, `STAFF`, or `USER` THEN the application SHALL persist a non-null `tenantId` that references an existing tenancy. <!-- unwanted-behavior -->

6. The application SHALL persist only a bcrypt hash, expiry timestamp, and revocation state for each refresh-token session in `public.user_sessions`. <!-- ubiquitous -->

**Independent Test**: Run the migration against PostgreSQL and inspect the public tables, constraints, and rollback.

---

### P1: Authorize tenancy and user provisioning ⭐ MVP

**User Story**: As a platform operator or tenant administrator, I want provisioning authorization tied to my verified identity so that no caller can create records in an unauthorized tenancy.

**Why P1**: Tenant boundaries apply to management workflows as well as read and write access.

**Acceptance Criteria**:

1. WHEN a verified `SUPERADMIN` creates a tenancy THEN the application SHALL permit the provisioning workflow. <!-- event-driven -->
2. WHEN a verified `SUPERADMIN` switches tenancy for the active session THEN the application SHALL issue new access and refresh tokens carrying the selected tenant context. <!-- event-driven -->
3. WHEN a verified `SUPERADMIN` creates a user THEN the application SHALL permit a target tenancy different from the creator's tenancy. <!-- event-driven -->
4. WHEN a verified `ADMIN` creates a user for its own verified `tenantId` THEN the application SHALL permit the workflow. <!-- event-driven -->
5. WHEN a verified `ADMIN` creates a user in its own tenancy THEN the application SHALL permit only the `USER` and `STAFF` roles. <!-- event-driven -->
6. IF an `ADMIN` attempts to create a user for another tenancy or with the `ADMIN` or `SUPERADMIN` role, or a non-authenticated caller attempts tenancy or user provisioning, THEN the application SHALL reject the request before persistence. <!-- unwanted-behavior -->
7. The application SHALL derive the creator tenant from a verified access-token claim and SHALL NOT trust a caller-provided tenant scope for authorization. <!-- ubiquitous -->

**Independent Test**: Unit-test each creator role and target-tenancy combination, asserting that rejected combinations do not invoke persistence.

---

### P1: Enforce role-specific domain creation ⭐ MVP

**User Story**: As an application developer, I want explicit user factories per role so that tenant-membership invariants cannot be bypassed by callers.

**Why P1**: The role/tenant rule is core domain behavior and must not be left to controllers or repositories.

**Acceptance Criteria**:

1. WHEN the application creates a superadmin THEN the user domain entity SHALL use a dedicated superadmin factory and set `tenantId` to null. <!-- event-driven -->
2. WHEN the application creates an admin, staff member, or standard user THEN the user domain entity SHALL use a dedicated role factory and require a valid `tenantId`. <!-- event-driven -->
3. IF any factory receives an invalid name, email, role, or role-incompatible tenant assignment THEN the domain entity SHALL reject creation with a domain exception. <!-- unwanted-behavior -->
4. The application SHALL generate UUIDs and timestamps in domain factories and reconstitute persisted entities without rerunning creation validation. <!-- ubiquitous -->

**Independent Test**: Unit-test each factory's valid state and each forbidden tenant/role combination.

---

### P1: Authenticate and establish tenant context ⭐ MVP

**User Story**: As a registered user, I want to sign in with email and password so that the API can authenticate me and select only my authorized tenant context.

**Why P1**: Requests must establish identity and tenancy before future tenant-scoped repositories can safely operate.

**Acceptance Criteria**:

1. WHEN a non-superadmin user is created or has a password set THEN the application SHALL hash the password with bcrypt using the validated `SALT` environment value before persistence. <!-- event-driven -->
2. WHEN valid email and password credentials are submitted THEN the authentication module SHALL return an access token that expires after one hour and a refresh token that expires after seven days, both signed with `JWT_SECRET`. <!-- event-driven -->
3. The application SHALL issue access tokens with `sub`, `type: 'access'`, `role`, and `tenantId: string | null`, and SHALL issue refresh tokens with `sub`, `sid`, `tenantId: string | null`, and `type: 'refresh'`. <!-- ubiquitous -->
4. WHEN a valid refresh token is submitted THEN the authentication module SHALL verify `type: 'refresh'`, its session hash and expiry, revoke the prior session token, and return a new access/refresh token pair preserving the selected tenant context from the active session. <!-- event-driven -->
5. IF a refresh token is expired, revoked, malformed, has a non-refresh type, or does not match its session hash THEN the authentication module SHALL reject it without issuing tokens. <!-- unwanted-behavior -->
6. IF credentials are invalid THEN the authentication module SHALL return an unauthorized application error without exposing whether the email exists. <!-- unwanted-behavior -->
7. WHEN a request presents a valid access JWT for a non-superadmin THEN the application SHALL establish request tenant context from the verified `tenantId` claim before tenant-scoped work executes. <!-- event-driven -->
8. WHEN a request presents a valid access JWT for a superadmin THEN the application SHALL establish no tenant schema context. <!-- event-driven -->
9. IF a request has no valid access JWT or a non-superadmin token lacks a valid tenant claim THEN the application SHALL reject access to tenant-scoped work. <!-- unwanted-behavior -->

**Independent Test**: Test bcrypt hashing and comparison, typed token claim construction, refresh rotation and reuse rejection, rejected credentials, and tenant-context resolution from verified access payloads.

---

### P2: Provision safe tenant schemas

**User Story**: As a platform operator, I want each tenancy to have its own PostgreSQL schema so that future tenant-owned data has a prepared isolation boundary.

**Why P2**: No tenant-owned tables are in scope yet, but schema provisioning must be safe and deterministic now.

**Acceptance Criteria**:

1. WHEN a tenancy is created THEN the application SHALL create its generated schema within the tenancy provisioning workflow. <!-- event-driven -->
2. IF schema creation or tenancy persistence fails THEN the application SHALL report the failure and SHALL not leave a successfully persisted tenancy pointing to an absent schema. <!-- unwanted-behavior -->
3. The application SHALL use the resolved tenant schema only for tenant-owned tables; `public.users` and `public.tenancies` SHALL remain globally addressed in `public`. <!-- ubiquitous -->

**Independent Test**: Integration-test schema name generation and provisioning failure handling through a PostgreSQL-backed repository or query runner.

---

### P1: Keep test fixtures owned by their domain ⭐ MVP

**User Story**: As an application developer, I want test constants and mocks organized by module and layer so that each test double has an explicit domain owner.

**Why P1**: The identity foundation introduces several domain contracts, and generic shared fixtures would obscure which module owns each behavior.

**Acceptance Criteria**:

1. The application SHALL place immutable test data in `test/constants/<module>/<layer>/`, mirroring the source module and layer that own the represented domain data. <!-- ubiquitous -->
2. The application SHALL place typed Jest mocks in `test/mocks/<module>/<layer>/`, mirroring the source module and layer whose contract they implement. <!-- ubiquitous -->
3. WHEN a test requires user, tenancy, session, or authentication data THEN the test suite SHALL import a module-owned constant or mock instead of defining reusable fixtures inline. <!-- event-driven -->

**Independent Test**: Inspect the test tree and run the unit suite to confirm all introduced fixture imports resolve.

---

## Edge Cases

- IF a second tenancy uses an existing slug or generated schema name THEN the application SHALL reject the duplicate without provisioning another schema.
- IF a second user in the same tenancy uses an existing email, or a second platform user uses an existing email, THEN the application SHALL reject the duplicate without disclosing account details; the same email in different tenancies is allowed.
- IF a non-superadmin is reconstituted with no tenant ID from invalid persisted data THEN the application SHALL reject its use in tenant-context resolution.
- IF the configured `SALT` is absent, non-numeric, or unsafe for bcrypt THEN the application SHALL fail configuration validation at startup.
- IF `JWT_SECRET` is absent THEN the application SHALL fail configuration validation at startup.
- IF an access token is presented to the refresh endpoint, or a refresh token is presented to an access-protected endpoint, THEN the application SHALL reject the token by its `type` claim.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| MTI-01 | P1: Persist global tenancy and users | Execute | Complete |
| MTI-02 | P1: Persist global tenancy and users | Execute | Complete |
| MTI-03 | P1: Enforce role-specific domain creation | Execute | Complete |
| MTI-04 | P1: Authenticate and establish tenant context | Execute | Complete |
| MTI-05 | P2: Provision safe tenant schemas | Execute | Complete |
| MTI-06 | P1: Keep test fixtures owned by their domain | Execute | Complete |
| MTI-07 | P1: Authorize tenancy and user provisioning | Execute | Complete |

**Coverage:** 7 total, 7 mapped to tasks, 0 unmapped.

## Success Criteria

- [ ] A clean PostgreSQL database can apply and revert the identity migration through the configured TypeORM DataSource.
- [ ] Domain tests prove all four user factory invariants.
- [ ] Valid credentials yield a verifiable JWT with no sensitive user data and tenant context is available only to tenant-bound roles.
- [ ] New test constants and mocks visibly identify their source module and layer through their path.
