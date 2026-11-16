# CleanOps authentication

The browser carries a session cookie. The backend uses that session to identify the employee, then reads their active status, role and tenant from the database. The cookie does not contain editable employee or tenant IDs. There is no JWT and no authentication token in local storage.

## Sign-in and sign-out

1. React checks `GET /api/session/me` before showing any application pages. A 401 shows the login form.
2. Login obtains a CSRF token and posts the email/password with the configured company ID. Spring Security verifies the BCrypt password hash stored on the existing employee account and establishes the HTTP session.
3. The browser sends its `JSESSIONID` cookie on subsequent requests. `/api/session/me` supplies the name and role for navigation: cleaner workspace or manager workspace.
4. Both roles have a Sign out button. It posts with CSRF protection, invalidates the server session, clears the frontend identity and returns to login.
5. A 401 from a resource API clears the frontend identity and triggers a fresh session check. A 403 reports a denied action; it does not silently sign out a valid user.

## Where the checks live

| Layer | Responsibility |
| --- | --- |
| React and React Router | Show login first, choose the role's pages, and provide sign-out. These are user-interface decisions; the backend independently enforces access. |
| `src/lib/session.ts` | Shared browser `fetch` transport: cookies on requests, CSRF tokens on mutations, expired-session notification. No Axios dependency is used for authentication. |
| Backend `SecurityConfig` | One Spring Security filter chain covers the app. Login and CSRF acquisition are public; resource APIs require authentication. Mutations require a valid CSRF token. |
| Backend `CurrentEmployee` | Resolve the session principal to the current active database account. Role changes and account deactivation are checked against current database values. |
| Backend `ResourceAccess` | Derive the tenant and cleaner identity; validate requested employees, sites, schedules and assignments before resource controllers call their services. |
| Existing services | Apply business rules, including shift ownership and clocking windows. Employee account edits also prevent cleaners from changing role or pay. |
| PostgreSQL, JPA and Flyway | Store accounts, BCrypt password hashes, roles, tenants and business records. Sessions currently live in the backend server, not a session database table. |

## Resource permissions

| Resource | Cleaner | Manager |
| --- | --- | --- |
| Shifts | Own shifts, inferred from session | Selected employee or site in the manager's tenant |
| Schedule/site lists | Assigned resources | Tenant resources, optionally filtered by employee |
| Schedule/site details | Assigned resources | Resources in the manager's tenant |
| Schedule/site creation, editing and assignment | Denied | Allowed within the tenant |
| Employee list | Denied | Employees in the tenant |
| Employee details and edits | Own account; personal fields only | Employees in the tenant |
| Clock in/out | Own shift, valid scanned site and clocking window | Denied |
| Report overlaps | Own shifts | Denied |
| View/resolve employee flags | Own flag history; no resolution | Tenant flags and resolution |
| Create tenant | Denied | Denied pending a separate onboarding/admin policy |

Shift and schedule reads use `/api/shifts` and `/api/schedules/by-site`. Managers filter shifts by either `userId` or `siteId`; cleaners always receive only their own shifts. The duplicate `/api/me/shifts` and `/api/me/schedules` routes have been removed from `EmployeeSessionController`, which only provides session identity and CSRF tokens.

Managers can create one-off shifts with `POST /api/shifts`, adjust a future unstarted occurrence with `PUT /api/shifts/{shiftId}`, and remove one with `DELETE /api/shifts/{shiftId}`. These operations are tenant-scoped and never update a schedule or schedule rule. Schedule-generated occurrences retain provenance so a one-off override or removal is not recreated by ordinary regeneration.

The frontend no longer submits a tenant ID with business requests. Cleaner list requests also omit their own user ID. Manager filters still send an employee ID because it identifies the requested resource, not the signed-in actor. Legacy backend tenant/user fields remain optional for compatibility, but supplied values must satisfy the same ownership checks and cannot override the session.

## Local development and deployment

Cookie sessions, Spring Security, CSRF protection and BCrypt are the authentication mechanism used here. The current deployment settings are for local development: the login company comes from `config.testTenant`, credentialed CORS allows `http://localhost:5173`, and frontend/backend must use the same hostname (`localhost`). The requested local test passwords have not been changed by this refactor.

A production deployment still needs its own company-selection configuration, HTTPS and secure-cookie/origin settings, real passwords, and an operational account-recovery and login-abuse policy. The present server-local session storage also means restarting the backend signs users out; multiple backend instances would need an intentional shared-session or routing setup. This refactor adds no database migration or password reset.
