# Production deployment runbook

## Prerequisites

- Docker Engine with Compose v2
- A TLS-terminating load balancer or reverse proxy
- DNS, firewall, monitoring, centralized logs, and encrypted backup storage
- A protected environment file derived from `deployment/.env.production.example`
- Immutable backend and frontend image references from a trusted registry

The bundled PostgreSQL service is suitable for a single-host deployment. Prefer a
managed PostgreSQL service with high availability and point-in-time recovery for
critical production workloads.

## Environment variables

Required variables are `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
`JWT_SECRET`, and `CORS_ORIGINS`. Image names, bind address, port, token lifetime,
SMTP settings, and JVM tuning are documented in the example environment file.

The Compose file reuses PostgreSQL values for the backend connection. When using a
managed database, adapt `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` through an
environment-specific Compose override and require encrypted transport (for example,
the provider's required JDBC SSL parameters).

## Go-live checklist (Tencent Cloud / single host)

1. **DNS & TLS** — point the public domain to the host / CLB; terminate HTTPS (Nginx, Caddy, or cloud cert).
2. **Secrets** — copy `deployment/.env.production.example` to a host path with `chmod 600`; set unique `POSTGRES_PASSWORD`, `JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`, and exact `CORS_ORIGINS` (e.g. `https://your-domain.com`).
3. **Build & start** — from repo root, either:
   - registry images: set `BACKEND_IMAGE` / `FRONTEND_IMAGE` then `pull` + `up -d --no-build`, or
   - first host build: `docker compose --env-file … -f deployment/compose.production.yml up -d --build`
4. **Migrate** — Liquibase runs on backend start (includes portfolio, insights, careers seed, job publish queue). Watch logs once.
5. **Smoke** — `curl` `/healthz` and `/api/v3/api-docs`; open home, portfolio, insights, careers; submit a test BP; admin login and change the initial password immediately.
6. **Ops** — confirm uploads volume persistence, disk alerts, DB backup script schedule (`database/`), and that careers auto-publish settings look correct under Admin → Jobs.

## Initial deployment

From the repository root:

```sh
cp deployment/.env.production.example /secure/path/iman-production.env
chmod 600 /secure/path/iman-production.env
# Replace every placeholder and review all values.
docker compose --env-file /secure/path/iman-production.env \
  -f deployment/compose.production.yml config --quiet
docker compose --env-file /secure/path/iman-production.env \
  -f deployment/compose.production.yml pull
docker compose --env-file /secure/path/iman-production.env \
  -f deployment/compose.production.yml up -d --no-build
```

For a controlled local build, omit `pull` and use `up -d --build`. Registry images are
preferred in production.

Verify:

```sh
curl --fail http://127.0.0.1:8080/healthz
curl --fail http://127.0.0.1:8080/api/v3/api-docs
docker compose --env-file /secure/path/iman-production.env \
  -f deployment/compose.production.yml ps
```

Then test login, one authorized read, one public submission in a safe test context,
upload persistence, mail delivery if enabled, and centralized log ingestion.

## Release procedure

1. Review changesets and compatibility; test against a production-sized copy.
2. Run and verify database and upload backups.
3. Record current image digests and database changelog state.
4. Pull the new immutable images.
5. Run `up -d --no-build`; Liquibase executes during backend startup.
6. Watch migration logs, health, error rate, latency, and database saturation.
7. Complete functional smoke tests before closing the change window.

Do not start multiple new backend replicas simultaneously when a migration is expected.

## Backup and restore

Run logical database backups with the scripts in `database/`; supply libpq environment
variables from runtime secrets. Back up the `uploads` volume separately at the same
logical point and record both artifact identifiers.

Restore only into an empty database:

```sh
PGHOST=<host> PGUSER=<restore-role> PGDATABASE=<empty-database> \
  ALLOW_RESTORE=yes ./database/restore.sh /secure/backups/iman_<timestamp>.dump
PGHOST=<host> PGUSER=<verify-role> PGDATABASE=<empty-database> \
  ./database/verify.sh
```

Keep the restored environment isolated until access controls, Liquibase state, row
counts, uploads, and application smoke tests pass.

## Rollback

Application rollback means redeploying the recorded previous image digests. Do not
assume database rollback is safe: Liquibase changes may be irreversible and the current
changesets do not define rollback blocks. Design migrations to remain compatible with
the previous application release. If an incompatible migration damaged data, stop
writes and restore to a new database according to the incident plan.

## Routine operations

- Daily: check service health, alerts, backup completion, and storage capacity.
- Weekly: review 5xx/latency trends, failed logins, dependency alerts, and invalid
  indexes.
- Monthly: patch/rebuild images and review access.
- Quarterly: perform a timed restore exercise and verify RPO/RTO evidence.

Scale the backend only after moving uploads to shared durable storage. To decommission,
take final verified backups, revoke credentials, stop the stack, and retain or destroy
data according to policy rather than deleting volumes ad hoc.
