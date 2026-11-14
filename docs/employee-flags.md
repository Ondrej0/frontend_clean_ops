# Employee schedule overlap flags

The entire app now requires an employee session before mounting navigation or pages. Managers land on their dashboard; cleaners land on My Work. URLs for the other role redirect to the signed-in user's home. A global Sign out button clears the session and returns to sign-in. Sign in with an existing account's email and password. Login uses the company configured by `config.testTenant`; reporting and flag reads derive the actual employee and tenant from the server session, never from that configuration or a submitted employee ID.

## Database and reporting behavior

The backend is the adjacent `clean_ops_backend` project. Flyway V3 adds `employee_flag`, indexed by tenant/status/report date and tenant/employee/report date. A flag stores employee identity/name, type, status, description, source shift IDs, conflict identity, creation time, and resolution time/manager.

Flags are created only by clicking **Flag Overlaps**. The server rereads that employee's shifts for the displayed inclusive date range and detects each overlapping pair. Touching shifts and cancelled shifts do not conflict. Overnight shifts crossing the week boundary are included. Timestamps follow the existing Europe/London scheduling policy.

The current calendar displays dated shifts generated from weekly schedule rules. Reports therefore describe dated occurrences, including their schedule and site names; they do not create speculative reports for ungenerated future weeks. A recurring conflict on another date is a distinct occurrence.

An employee row lock serializes simultaneous report requests. A database uniqueness constraint on tenant, employee, type and the open conflict key supplies a second duplicate barrier. Schedule ID plus scheduled times identifies an occurrence, so regenerating an unchanged shift does not create another unresolved report. Standalone shifts use their shift ID. Different shift pairs remain independent conflicts.

Resolution clears only the open uniqueness key, records the manager and UTC timestamp, and preserves the original record. Repeated resolution is idempotent. Reporting a still-existing conflict after resolution creates a new open record. Resolving a flag does not edit schedules.

Descriptions and source IDs are snapshots with no cascading foreign keys to schedules or shifts. Schedule edits, deletion and cancellation never delete existing reports or resolve them automatically. Deactivating a schedule alone does not cancel its already-generated dated shifts; those remain reportable while present and not cancelled, matching the existing calendar.

## Authentication

Session endpoints support BCrypt-backed sign-in, sign-out, and CSRF tokens. Flyway V4 upgrades the legacy plaintext values written by the existing temporary-password form to BCrypt, preserving already-BCrypt values. Blank legacy passwords remain unusable. New employee creation hashes temporary passwords. No fallback plaintext authentication or default password is added.

Employee creation and editing now require a session and CSRF protection to prevent privilege escalation through the old employee API. Managers can create/edit employees in their tenant. Cleaners can edit only their own personal fields and cannot change role or pay. The frontend employee write helpers send the session and CSRF token.

This is a focused authentication addition: all frontend pages use session identity, while legacy scheduling/site/attendance APIs retain their existing server-side authorization behavior. It is not a complete authentication migration of the rest of CleanOps. Use the same hostname for frontend/backend locally (`localhost`); CORS permits credentialed requests from `http://localhost:5173`. Production deployment must configure its origin, HTTPS and secure session cookies.

## API

| Method and path | Access / behavior |
| --- | --- |
| `GET /api/session/csrf` | Get a session CSRF token; send it as `X-CSRF-TOKEN` on writes, including login/logout. |
| `POST /api/session/login` | Form body: `username=<tenant UUID>:<email>`, `password=<password>`; returns 204 or 401. |
| `GET /api/session/me` | Current active employee identity and role. |
| `POST /api/session/logout` | Invalidate the session. |
| `GET /api/me/shifts?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` | Cleaner: own calendar shifts. |
| `GET /api/me/schedules` | Cleaner: own assigned recurring schedules. |
| `POST /api/employee-flags/schedule-overlaps` | Cleaner: JSON `{ "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD" }`, maximum 31 inclusive days. Returns `detected`, `created`, `alreadyReported` counts. Identity override fields are rejected. |
| `GET /api/employee-flags?status=OPEN&employeeId=<UUID>` | Manager: tenant flags; both filters optional. Open flags sort first, then newest reports. Foreign-tenant employee filters return 404. |
| `GET /api/employee-flags/mine?status=OPEN` | Cleaner: own flags; status optional. |
| `POST /api/employee-flags/{id}/resolve` | Manager: resolve a flag in the same tenant; foreign/missing flags return 404. |

## Frontend

`ScheduleCalendar` reuses its existing overlap highlights to enable the red button. It reports the displayed week, prevents repeated clicks while submitting, and shows distinct feedback for new reports, already-open reports, and schedules that no longer overlap. It refreshes after reporting.

`EmployeeFlagsSection` is a separate reusable component with an optional employee filter. It defaults to open reports, offers resolved/all filters and refresh, and includes loading, empty, error, retry and resolution states. The dashboard contains only this section.

## Verification

Frontend tests cover request identity restrictions, session/CSRF transport, reporting messages, filtering, resolution, and errors. Existing calendar tests cover real dates, touching intervals, overnight boundaries, cancelled shifts and London DST.

Backend integration tests cover successful/no-overlap/multiple-conflict reports, repeated and concurrent reporting, identity overrides, tenant isolation, role enforcement, resolution/re-reporting, regeneration/deletion history, session login/logout with real CSRF tokens, and employee-write privilege guards. Migration tests execute Flyway V1–V4 and verify uniqueness, resolution constraints and password migration.

The repository's pre-existing `AttendanceServiceTest` does not compile because it still uses a removed `AttendanceRequest.clockedIn` field. From the backend directory, run `gradlew.bat test -I gradle/employee-flags-tests.gradle` to run the feature/scheduling/account tests independently until that unrelated test is repaired. The normal test task is unchanged. Existing shared UI lint errors also remain outside this feature.

Browser verification with an isolated H2 database covered cleaner sign-in, reporting, duplicate feedback, disabled reporting in an empty week, manager sign-in, dashboard resolution, and preserved resolved history. Screenshots in `docs/screenshots` use synthetic test accounts and shifts.
