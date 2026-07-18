# Architecture

## System context

IMan Investment is a three-tier web application:

1. A browser loads the compiled frontend from Nginx.
2. Nginx serves static assets and proxies `/api/*` to the Spring Boot service.
3. Spring Boot authenticates requests, owns business logic and file metadata, and
   persists data in PostgreSQL. Uploaded files use a separate persistent volume.

Only the Nginx listener is intended to be reachable by users. PostgreSQL is isolated on
the data network and the backend is reachable only from the application network.
Production TLS should terminate at a managed load balancer or host reverse proxy in
front of this stack.

## Runtime components

- **Frontend:** Node-built static single-page application, served by Nginx.
- **Edge:** Nginx applies request limits, security headers, SPA fallback, structured
  access logs, and API proxying.
- **Backend:** Java 21 / Spring Boot, stateless JWT authentication, JPA validation,
  Liquibase migrations, SMTP integration, and local persistent upload storage.
- **Database:** PostgreSQL 16. Liquibase files under `backend/src/main/resources` are
  the sole schema authority.

## Data and trust boundaries

- Browser input is untrusted. The backend must enforce authorization and validation;
  frontend controls are not a security boundary.
- Nginx forwards the originating address and protocol. Only trusted proxies should be
  allowed to supply forwarding headers at the public edge.
- Database credentials, JWT signing material, and SMTP credentials enter at runtime
  through environment variables. They must come from the deployment platform's secret
  manager and must not be built into images.
- PostgreSQL data and uploaded documents have independent persistence and backup
  requirements. A database restore alone does not restore uploaded files.

## Schema lifecycle

Application startup runs the master Liquibase changelog and Hibernate uses
`ddl-auto=validate`. Release order is therefore:

1. Back up and verify the database.
2. Deploy backward-compatible expand changes with the backend.
3. Deploy frontend changes.
4. Migrate data asynchronously when needed.
5. Remove obsolete structures in a later release.

Never edit a changeset already applied to any shared environment.

## Scaling and availability

The frontend and backend images are stateless except for uploads. Multiple backend
replicas require shared object storage or a shared filesystem for uploads. PostgreSQL
high availability and point-in-time recovery should be supplied by the hosting
platform. Add load-balancer probes backed by a dedicated application health endpoint
when Spring Boot Actuator is introduced; the current image probe checks OpenAPI
availability.

## Observability

Nginx emits JSON access logs with request IDs and timing. Application and PostgreSQL
logs should be shipped to centralized storage with retention and alerts. At minimum,
alert on unavailable services, HTTP 5xx rate, latency, disk saturation, backup failure,
database connection exhaustion, and long-running transactions.
