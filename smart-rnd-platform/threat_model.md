# InnoBridge — Threat model

This document summarizes assets, trust boundaries, and controls for the InnoBridge graduation–industry collaboration platform (Laravel + Inertia/React + Sanctum API).

## 1. System context

- **Users:** students, supervisors, Heads of Department (HoD), industry partners, administrators.
- **Clients:** browser SPA (Inertia), optional API clients (Bearer Sanctum tokens).
- **Data stores:** relational database, filesystem for uploads, session store.
- **External:** email (if configured), future integrations (AI review, notifications).

## 2. Assets

| Asset | Sensitivity |
| --- | --- |
| User credentials & sessions | High |
| API tokens (Sanctum) with ability metadata | High |
| Project titles, abstracts, milestones | Medium–High |
| Submission files (PDF/DOC/ZIP) | High |
| Team membership, department, supervisor assignment | High |
| Industry challenges and workflow state | Medium |
| HoD approval / team lifecycle actions | High |

## 3. Trust boundaries

1. **Public internet → Application** — TLS required in production; rate limiting and CSRF on web routes.
2. **Guest → Authenticated** — login, registration, password flows.
3. **Web UI vs API** — same policies must hold; API must not expose broader data than UI for the same role.
4. **Role boundaries** — student vs supervisor vs HoD vs industry vs admin (including department scope for HoD).

## 4. STRIDE overview

### Spoofing

- **Risk:** Stolen cookies/session or leaked API tokens.
- **Controls:** HttpOnly session cookies; Sanctum token abilities scoped by role; password hashing (bcrypt); future optional MFA.

### Tampering

- **Risk:** Changing project status, submission status, or milestone workflow without authorization.
- **Controls:** Form requests and validation; server-side state transitions; API updates restricted by role (e.g. students cannot advance project to arbitrary statuses via API).

### Repudiation

- **Risk:** Disputing who approved or submitted work.
- **Controls:** Audit fields where present (`reviewed_by_user_id`, submission `submitted_by_user_id`, timestamps); server logging for security events (recommended in production).

### Information disclosure

- **Risk:** BOLA/IDOR — listing or reading another user’s project, milestone, or submission.
- **Controls:** Scoped queries on API project index/show/update; milestone and submission access aligned with team membership, ownership, supervisor assignment, HoD department, or industry challenge ownership.

### Denial of service

- **Risk:** Large uploads, expensive list endpoints.
- **Controls:** File size limits on submissions; pagination on API index; production rate limiting (recommended).

### Elevation of privilege

- **Risk:** Self-registration as admin/HoD/supervisor/industry via manipulated `role` field.
- **Controls:** Web and API registration force `student` role; elevated accounts provisioned by administrators only.

## 5. Role-specific concerns

### HoD without department

- **Risk:** Ambiguous scope previously allowed overly broad visibility (e.g. all teams).
- **Control:** Fail-closed behaviour — HoD with `department` null sees no teams; actions that toggle global policies or assign supervisors are denied until department is set.

### API project and submission endpoints

- **Risk:** World-readable project list or milestone submissions.
- **Control:** Index/show/update scoped by role; submission create/update distinguishes student content changes vs supervisor review state.

## 6. Dependency and supply chain

- Run **`npm audit`** and **`composer audit`** regularly; apply patches in a test environment.
- Pin critical versions in lockfiles; review breaking changes before major upgrades.

## 7. Operational recommendations

- Enforce **HTTPS**, secure cookie flags, and hardened session configuration in production.
- Restrict CORS and Sanctum stateful domains to known front-end origins.
- Backup database and encrypted uploads; document recovery procedures.
- Periodically **review this document** after major features or auth changes.

## 8. Change log (security-related)

- Registration locked to **student** on web and API; public **Auth/Register** UI no longer posts a client-controlled `role`.
- API **Project** and **Submission** controllers aligned with role and team/challenge scope (see application code for authoritative rules).
- HoD **fail-closed** when department is missing; stricter HoD–team and HoD–supervisor checks on portal mutations.
- Dependency hygiene: **`npm audit`** clean after `npm audit fix`; **`composer audit`** clean after upgrading **league/commonmark** to 2.8.2 (CVE-2026-33347 / embed allowed_domains bypass).
