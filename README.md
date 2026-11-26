# CampusHire

CampusHire is a full-stack university placement platform connecting students, recruiters, and placement administrators. It is built as a production-style SaaS app: JWT authentication, role-based access control, PostgreSQL, and real application workflows.

## Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Axios, Lucide, Recharts
- Backend: Node.js, Express, JWT, bcrypt
- Database: PostgreSQL

## Architecture

```
frontend/   React SPA
backend/   Express REST API
backend/sql/schema.sql
docker-compose.yml   local Postgres
```

Roles are never trusted from the client. Every protected action is authorized on the server using the authenticated user record.

## Business rules

- A student cannot apply to the same job twice.
- Only approved recruiters can publish jobs.
- Students can only access their own applications.
- Recruiters can only manage their own jobs and applicants.
- Closed or expired jobs reject new applications.
- Application status changes are written inside a transaction and stored in `application_status_history`.

## Local setup

### 1. Start PostgreSQL

Preferred: Docker.

```bash
docker compose up -d
```

If Docker is not installed, you can run a workspace-local PostgreSQL binary:

```bash
npm run db:local --prefix backend
```

If you already have PostgreSQL, create a database named `campushire` and set `DATABASE_URL` in `backend/.env`.

### 2. Configure the API

```bash
cp backend/.env.example backend/.env
```

Default connection:

```
DATABASE_URL=postgresql://campushire:campushire@localhost:5432/campushire
JWT_SECRET=campushire-dev-secret-change-me
```

### 3. Install, migrate, seed

```bash
npm install
npm run install:all
npm run db:init
npm run db:seed
```

### 4. Run the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5001/api/health

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@campushire.edu` | `Admin@123` |
| Student | `student@university.edu` | `Student@123` |
| Recruiter | `recruiter@technova.com` | `Recruiter@123` |
| Pending recruiter | `pending@orbitlabs.com` | `Recruiter@123` |

## API map

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Students
- `GET /api/students/dashboard`
- `GET /api/students/profile`
- `PUT /api/students/profile`
- `GET /api/students/applications`

### Jobs
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `PATCH /api/jobs/:id/close`
- `DELETE /api/jobs/:id`
- `POST /api/jobs/:jobId/apply`
- `GET /api/jobs/:jobId/applicants`
- `GET /api/jobs/mine`

### Applications
- `GET /api/applications/:id`
- `PATCH /api/applications/:id/status`
- `PATCH /api/applications/:id/withdraw`

### Recruiters
- `GET /api/recruiters/dashboard`
- `PUT /api/recruiters/profile`

### Admin
- `GET /api/admin/overview`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/active`
- `PATCH /api/admin/recruiters/:id/review`
- `GET /api/admin/jobs`
- `PATCH /api/admin/jobs/:id/close`
- `GET /api/admin/applications`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

## Database

Schema lives in `backend/sql/schema.sql`.

Tables: `users`, `student_profiles`, `recruiter_profiles`, `companies`, `jobs`, `applications`, `application_status_history`, `notifications`.
