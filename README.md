# QMS ISO 9001

A Quality Management System aligned with **ISO 9001**, built as a scaffold with:

- **Frontend**: Angular 18 (standalone components, signals, Angular Material)
- **Backend**: NestJS 10 + TypeORM
- **Database**: PostgreSQL 16
- **Dev**: Docker Compose for a one-command local environment

## Actors & Permissions

| Role              | Can do                                                                                                                         |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `super_admin`     | Manage organizations and their admin owners; audit across all orgs                                                             |
| `admin_owner`     | Manage users within their organization                                                                                          |
| `quality_manager` | Manage CAPAs, controlled documents (with versioning), review NCs, link NCs to CAPAs, manage QM/Employee users                  |
| `employee`        | Submit Non-Conformities and view NCs they submitted and the CAPA they are linked to                                             |

## ISO 9001 Coverage

- **§7.5 Documented Information** — Controlled documents with version history, status (Draft → Under Review → Approved → Obsolete).
- **§9.1 Monitoring** — Non-Conformity reporting with severity and area.
- **§10.2 Nonconformity & Corrective Action** — CAPA workflow with root cause, corrective/preventive actions, verification, and status transitions.
- **Traceability** — Immutable `audit_logs` table records create/update/delete events with actor, organization, entity, and metadata.

## Quick Start

```bash
docker compose up --build
```

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- Postgres: `localhost:5432` (user/pass `qms`/`qms`, db `qms`)

Default bootstrap account (created on first start):

- Email: `admin@qms.local`
- Password: `admin123`

> Change these via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` env vars and rotate `JWT_SECRET` before going to any non-local environment.

## Local Dev (without Docker)

```bash
# 1. Start Postgres
docker run --rm -d --name qms-pg -p 5432:5432 \
  -e POSTGRES_USER=qms -e POSTGRES_PASSWORD=qms -e POSTGRES_DB=qms \
  postgres:16-alpine

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run start:dev

# 3. Frontend (in another terminal)
cd frontend
npm install
npx ng serve
```

## API Surface

All routes are under `/api` and require a JWT bearer token except `POST /auth/login`.

| Resource          | Endpoint                              | Roles                                            |
|-------------------|---------------------------------------|--------------------------------------------------|
| Auth              | `POST /auth/login`, `GET /auth/me`    | Public / Any authenticated                       |
| Organizations     | `CRUD /organizations`                 | `super_admin`                                    |
| Users             | `CRUD /users`                         | `super_admin`, `admin_owner` (within org)        |
| Non-Conformities  | `CRUD /non-conformities`              | `employee` submits; `quality_manager` reviews     |
|                   | `POST /non-conformities/:id/link-capa`| `quality_manager`, `admin_owner`                  |
| CAPAs             | `CRUD /capas`                         | `quality_manager`, `admin_owner`                  |
| Documents         | `CRUD /documents`                     | `quality_manager`, `admin_owner` (read: all)      |
| Audit Logs        | `GET /audit-logs`                     | `super_admin`, `admin_owner`, `quality_manager`   |

## Project Structure

```
qms-iso9001/
├── backend/                  NestJS app
│   ├── src/
│   │   ├── common/           Enums, decorators, guards (JWT, Roles)
│   │   ├── entities/         TypeORM entities
│   │   └── modules/          Feature modules
│   │       ├── auth/
│   │       ├── audit/
│   │       ├── organizations/
│   │       ├── users/
│   │       ├── non-conformities/
│   │       ├── capas/
│   │       ├── documents/
│   │       └── seed/         Bootstraps initial super_admin
│   └── Dockerfile
├── frontend/                 Angular app (standalone components)
│   ├── src/app/
│   │   ├── core/             Auth, guards, API client, models
│   │   ├── shared/           Main layout with sidenav
│   │   └── features/
│   │       ├── auth/         Login page
│   │       ├── dashboard/
│   │       ├── organizations/
│   │       ├── users/
│   │       ├── non-conformities/
│   │       ├── capas/
│   │       ├── documents/
│   │       └── audit/
│   ├── nginx.conf            Serves SPA and proxies /api → backend
│   └── Dockerfile
└── docker-compose.yml
```

## Notes

- `synchronize: true` is enabled on TypeORM for MVP speed. For production, switch to migrations.
- JWT secret and super-admin credentials MUST be rotated before deployment.
- File uploads for NC evidence are intentionally out-of-scope for this MVP — add S3/Minio when needed.
