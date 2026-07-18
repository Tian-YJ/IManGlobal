# API operations

## Discovery

The backend context path is `/api`. When deployed through Nginx:

- OpenAPI document: `GET /api/v3/api-docs`
- Swagger UI: `GET /api/swagger-ui.html`
- Authentication: `POST /api/auth/login`

The generated OpenAPI document is the endpoint-level source of truth. Export it from a
running release and publish it with release artifacts so consumers can diff changes.
Do not hand-maintain an endpoint inventory here as controllers evolve.

## Authentication

Send credentials to the login endpoint as JSON:

```json
{
  "email": "operator@example.com",
  "password": "<user-supplied-password>"
}
```

Authenticated requests use:

```text
Authorization: Bearer <token>
```

JWT lifetime is controlled by `JWT_EXPIRATION_MS`. Clients must treat tokens as
credentials, keep them out of URLs and logs, and return to login after expiry. The
application currently exposes no refresh endpoint.

## Public and protected routes

Security configuration permits `/auth/**`, OpenAPI/Swagger routes, public GET routes,
and selected public form submissions. All other routes require authentication.
Method-level authorization may further restrict authenticated requests. Confirm the
generated OpenAPI spec and security tests before exposing new controllers.

## HTTP behavior

- Requests and responses use JSON unless an upload endpoint specifies multipart data.
- Upload requests are capped at 50 MiB by both Nginx and Spring Boot.
- Preserve `X-Request-ID` from the edge in logs when adding application tracing.
- Consumers should use bounded retries only for idempotent operations and transient
  `429`, `502`, `503`, or `504` responses, with exponential backoff and jitter.
- Do not retry login or write requests automatically unless an idempotency contract is
  explicitly added.

## Compatibility

Treat removal or renaming of fields, narrower validation, changed enum values, and
changed authorization as breaking changes. Add fields compatibly and use a versioned
base path before introducing an incompatible contract. Database entities are not an
API contract.

## Production exposure

Swagger and `/v3/api-docs` are currently publicly permitted by backend security.
Restrict them at the external load balancer for production if public API discovery is
not intended. Nginx's `/healthz` proves only that the edge process is serving traffic;
it is not a backend or database readiness check.
