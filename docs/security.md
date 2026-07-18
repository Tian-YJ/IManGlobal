# Security baseline

## Release blockers

Before the first production release:

- Set a unique, cryptographically random `JWT_SECRET` of at least 32 bytes. The
  development fallback in application configuration is not safe for production.
- Add a new Liquibase changeset that disables or replaces the seeded administrator
  account. Do not modify the already-defined seed changeset.
- Restrict `CORS_ORIGINS` to exact HTTPS origins; never use a wildcard with credentials.
- Terminate TLS 1.2+ at the public edge and redirect HTTP to HTTPS.
- Store database, JWT, and SMTP credentials in the platform secret manager. Limit
  access, rotate on personnel or incident changes, and never place values in images,
  source control, command history, or logs.
- Decide whether Swagger/OpenAPI should be externally reachable and block it at the
  public edge if not required.

## Application controls

The backend is stateless and uses BCrypt passwords and JWT bearer authentication.
Authorization must be enforced server-side for every protected operation. Add tests
for anonymous access, cross-role access, object ownership, and mass assignment whenever
an endpoint changes.

File uploads require defense in depth: allowlist extensions and detected MIME types,
generate server-side names, reject path traversal, scan for malware, enforce quotas,
and serve downloads as attachments from a non-executable storage location. The
configured 50 MiB transport limit is not content validation.

Public contact, application, and business-plan submission routes should have
application-level rate limits, abuse monitoring, and anti-automation controls. Nginx's
per-instance rate limit is only a first layer.

## Infrastructure controls

- Keep PostgreSQL private and use a least-privilege application role without
  superuser, database-creation, or role-creation rights.
- Separate migration and runtime database roles if the platform supports it.
- Encrypt database, upload, backup, and log storage at rest.
- Run containers as non-root with read-only filesystems and `no-new-privileges`.
- Pin deployed images by digest, scan them, and rebuild regularly for base-image fixes.
- Restrict administrative access with SSO/MFA and audited, time-bound permissions.

## Browser controls

Nginx sets CSP, frame, MIME-sniffing, referrer, and permissions headers. Review CSP
against actual third-party resources before deployment; add only narrowly scoped
origins. Enable HSTS at the TLS terminator only after all subdomains are confirmed
HTTPS-capable.

## Logging and privacy

Never log passwords, bearer tokens, mail credentials, full uploaded documents, or
unnecessary applicant/founder personal data. Limit production log access and retention.
Audit privileged operations and review unusual login, export, role, and settings
activity. Establish deletion and data-subject procedures appropriate to applicable
privacy law.

## Vulnerability management and response

CI runs tests, image builds, and CodeQL. Enable repository dependency alerts and secret
scanning in GitHub settings; these features are repository controls rather than
workflow secrets. Define owners and remediation targets by severity.

If a secret is exposed, revoke or rotate it first, then remove it from active history,
redeploy affected services, invalidate sessions where possible, and review audit logs.
For database incidents, preserve evidence and follow the documented restore procedure
only after containment.
