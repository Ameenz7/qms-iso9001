# QMS Frontend — Mock Mode

Angular 18 standalone app with **in-memory mock services only** (no backend
required). The real backend will be implemented in a follow-up.

## Quick start

```bash
npm install
npm start
# open http://localhost:4200
```

## Login

All seeded users share the password `password`. Pick a role:

| Email                 | Role             |
|-----------------------|------------------|
| `super@qms.com`       | Super Admin      |
| `admin@demo.com`      | Org Admin        |
| `qm@demo.com`         | Quality Manager  |
| `auditor@demo.com`    | Auditor          |
| `employee@demo.com`   | Employee         |

You can also switch roles on the fly via the **Demo role** dropdown in the top
bar — handy to test RBAC without re-logging in.

## Modules

- **Dashboard** — KPIs, charts (Chart.js), my tasks
- **Documents** — Upload + auto-versioning (1.0 → 1.1 → …) + metadata + preview
- **Non-Conformities** — Reporting, root cause analysis, corrective actions, close workflow
- **Audits** — Plan, checklist, findings, status transitions
- **Settings** — Profile, organization, users (invite, role change, enable/disable), roles reference
- **Audit Trail** — Immutable log of CRUD events (Super Admin / Org Admin only)
- **Organizations** — Super Admin creates orgs + invites Org Admins
- **Invitations** — Token-based via `/register/:token`

## What's mocked

- Auth is a simple email/password match against `seedUsers`. JWT is **not** issued.
- Email delivery (Resend) is replaced with a `console.info(...)` of the invite link.
- File uploads only store filename/size/MIME — bytes are never persisted.
- Data is held in Angular signals (`DataStore`) and persists for the lifetime of
  the page. Reloading the page resets the data to the seed state (except the
  currently logged-in user, which is in `localStorage`).

## Tech stack

- Angular 18 standalone components + signals
- Angular Material (Indigo/Pink theme)
- Chart.js (auto registration)
- TypeScript strict mode
