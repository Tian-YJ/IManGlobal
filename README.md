# IMan Investment Platform

Enterprise investment, portfolio, business-plan review, recruitment, and content-management platform.

## Technology

- Frontend: React 18, JavaScript, Material UI, React Router, TanStack Query, Axios, React Hook Form, ECharts, Framer Motion
- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, JWT, MapStruct, Lombok, OpenAPI
- Data: PostgreSQL 16, Liquibase, UUID primary keys
- Delivery: Docker, Docker Compose, Nginx, GitHub Actions

## Repository

```text
iman-investment/
├── frontend/          React public website and administration portal
├── backend/           Spring Boot REST API and Liquibase migrations
├── database/          Database operating and backup resources
├── deployment/        Nginx and production deployment resources
├── docs/              Architecture, API, security, and operations guides
├── .github/workflows/ Continuous integration
├── .env.example       Environment variable template
└── docker-compose.yml Local full-stack environment
```

## Quick start with Docker

Requirements: Docker Engine 24+ and Docker Compose v2.

```bash
cp .env.example .env
# Replace all development credentials in .env before non-local use.
docker compose up --build
```

Once all containers are ready:

- Website and admin: http://localhost:3000
- REST API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/api/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api/v3/api-docs
- PostgreSQL: `localhost:5432`

Liquibase applies the complete schema and seed data when the API starts. Persistent database and uploaded-file data are stored in named Docker volumes.

Stop the stack with `docker compose down`. To remove local data as well, use `docker compose down -v`.

## Local development

### Database

```bash
docker compose up -d postgres
```

Default local connection:

```text
jdbc:postgresql://localhost:5432/iman_investment
username: iman
password: iman_secret
```

Override these values through `.env` or backend environment variables.

### Backend

Requirements: JDK 21 and Maven 3.9+.

```bash
cd backend
mvn spring-boot:run
```

Build and test:

```bash
mvn clean verify
```

### Frontend

Requirements: Node.js 20+ and npm 10+.

```bash
cd frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The development server proxies `/api` to the backend. Set `VITE_API_URL` only when the API is hosted at a different origin.

## Default administrator

- Email: `admin@imaninvestment.com`
- Password: `Admin@123`

The seeded account is intended only for initial local access. Change its password immediately in every shared or production environment.

## Configuration

Important backend variables:

| Variable | Purpose |
| --- | --- |
| `DB_URL` | PostgreSQL JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | Database credentials |
| `JWT_SECRET` | JWT HMAC secret, at least 32 random characters |
| `JWT_EXPIRATION_MS` | Access-token lifetime |
| `CORS_ORIGINS` | Comma-separated allowed browser origins |
| `UPLOAD_PATH` | Persistent document storage path |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP configuration |

Never commit `.env`, production secrets, uploaded documents, or database backups.

## Main capabilities

- Public corporate site: home, about, investment strategy, portfolio, insights, team, careers, contact, privacy, and terms
- Business-plan submission: validated documents, draft updates, workflow review, approval, notes, and history
- Recruitment: jobs, applications, resume and cover-letter upload, interview notes, offers, and hiring status
- Administration: dashboard, portfolio, jobs, applicants, CMS, media, users, roles, permissions, audit logs, settings, and notifications
- Security: stateless JWT authentication, BCrypt passwords, role/permission authorization, validation, audit trails, and restricted uploads

## Database lifecycle

`backend/src/main/resources/db/changelog/db.changelog-master.xml` is the schema source of truth. Do not modify an applied change set. Add a new ordered change set and include it in the master changelog.

For backup and restore procedures, see `database/` and `docs/`.

## Production deployment

1. Provision PostgreSQL 16 and persistent object/file storage.
2. Create production secrets outside the repository.
3. Build immutable backend and frontend images.
4. Run Liquibase through a single backend instance before scaling application replicas.
5. Terminate TLS at the supplied Nginx/reverse-proxy layer.
6. Configure allowed origins, SMTP, backups, monitoring, and log retention.
7. Change the seeded administrator password and verify RBAC.

Detailed architecture, security, and deployment guidance is in `docs/` and `deployment/`.

## Verification

Before release:

```bash
cd backend && mvn clean verify
cd ../frontend && npm ci && npm run build
cd .. && docker compose config
docker compose up --build
```

Verify authentication, Swagger access, public forms, file validation, administration authorization, Liquibase startup, persistence after restart, and responsive layouts.
