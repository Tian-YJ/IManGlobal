# IMan Investment canonical data contract

This document and `openapi.yaml` define the production contract. Database entities are persistence details; API consumers must not depend on table names, JPA serialization, or untyped `Map<String, Object>` projections.

## Contract-wide rules

### Naming and scalar types

- JSON uses `camelCase`. SQL may remain `snake_case`; mapping belongs at the service boundary.
- Resource IDs and foreign keys are UUID strings. Do not expose file paths or password hashes.
- Instants use RFC 3339 UTC strings (`2026-07-11T16:00:00Z`). Calendar-only values use ISO `YYYY-MM-DD`. IANA names represent time zones.
- Money is `{ "amount": 125000.00, "currency": "USD" }`; never infer a currency or use floating-point arithmetic internally.
- Country values are ISO 3166-1 alpha-2 codes. Currency values are ISO 4217 codes.
- URLs are absolute for external destinations and may be root-relative for same-origin API/download links.
- Enum values are stable uppercase tokens. Display labels are a frontend concern.
- Derived display fields such as `displayName`, `imageUrl`, `downloadUrl`, and counts are read-only.

### Required, nullable, omitted

- A required property must be present. Unless its schema includes `null`, its value is non-null.
- On create/replace, omitted optional values use the documented default or become null.
- On JSON Merge Patch autosave, omitted means unchanged and explicit `null` clears a nullable value.
- Responses include required collections as `[]`, never null. Optional relationships are explicit null.
- Empty strings are rejected for identifiers, names, titles, slugs, email addresses, and body content. Clients should trim human-entered strings before submission; the server also trims them.
- Sensitive write-only values (`password`, `accessToken`, `draftToken`) are never echoed except at their one documented issuance point.

### Resource and response envelopes

Single resources are returned directly. Creates return the created resource and HTTP 201; updates return the current resource and HTTP 200; successful deletes return HTTP 204.

All pageable endpoints return:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "first": true,
  "last": true,
  "empty": true,
  "sort": "createdAt,desc"
}
```

Errors use RFC 9457 `application/problem+json`. Validation responses use HTTP 422 and add `errors[]` entries with a JSON Pointer `field`, stable `code`, user-safe `message`, and optional `rejectedValue`. Authentication is 401, authorization is 403, absence is 404, state/uniqueness conflicts are 409, stale ETags are 412, upload size is 413, and disallowed file type is 415. Every problem includes the request correlation ID.

### Paging, search, filtering, and sorting

- `page` is zero-based; default 0. `size` defaults to 20 and is capped at 100.
- `search` is a trimmed, case-insensitive contains search over the fields appropriate to that endpoint. It is capped at 200 characters.
- Filters combine with AND. Repeating or comma-separated filters are not accepted unless a path documents them.
- `sort` is `field,direction`, for example `createdAt,desc`. Only documented/allow-listed fields are accepted. One sort term is supported in v1.
- Public defaults are content-specific (`displayOrder,asc`, `publishedAt,desc`). Admin defaults to `createdAt,desc`.
- Stable ordering appends `id` in the same direction internally to avoid duplicate/missing rows across pages.

### Authentication and RBAC

`POST /auth/login` returns a short-lived JWT bearer token and its expiry. There is no refresh token in v1; the client returns to login after expiry. `GET /auth/me` is the source of truth for the signed-in user's roles and permissions. The UI may hide unauthorized navigation, but the API always enforces authorization.

Canonical permissions are:

| Permission | Scope |
| --- | --- |
| `dashboard.view` | Dashboard aggregates |
| `business_plans.manage` | Plans, assignments, notes, history, and files |
| `portfolio.manage` | Portfolio companies |
| `jobs.manage` | Job postings |
| `applicants.manage` | Applications, interviews, offers, hiring, notes, and files |
| `cms.manage` | Pages, insights, team profiles, and contact messages |
| `media.manage` | Media library |
| `users.manage` | User lifecycle and notification targeting |
| `roles.manage` | Roles and permissions |
| `audit.view` | Audit events |
| `settings.manage` | Platform settings |

`SUPER_ADMIN` may bypass permission checks. Seed roles (`SUPER_ADMIN`, `ADMIN`, `REVIEWER`, `HR`) are system roles; their names may be retained, but authorization is based on permissions rather than role-name checks.

## Canonical entities

Every mutable persisted entity has `id`, `createdAt`, and `updatedAt`. Entities that participate in optimistic concurrency also have an internal integer `version`, surfaced through ETags.

### Identity and access

- **User**: email, first/last/display name, optional phone/avatar, active flag, and roles. Password hashes never leave the authentication subsystem. Deletion means deactivation so audit references remain valid.
- **Role**: uppercase stable name, optional description, permissions, `userCount`, and `system`. A system role cannot be deleted.
- **Permission**: stable dotted code, name, module, and optional description. Production permission codes are configuration owned by the application; arbitrary runtime permission creation should be limited to SUPER_ADMIN and treated as advanced functionality.

### Business plan intake

- **BusinessPlan** owns `founder`, `company`, optional `traction`, workflow status, current wizard step, submitted timestamp, assignment, documents, notes, and workflow history.
- **Founder** contains full name, position, email, phone, country code, and LinkedIn URL.
- **CompanyProfile** contains company name, website URL, industry, stage, team size, founded date, and description.
- **Traction** contains funding requested, annual revenue, and monthly growth percentage.
- **BusinessPlanDocument** is represented as `FileAsset`. It has metadata and an authorized download URL; storage keys/paths are private.
- **Note** has author, content, and timestamps. Notes are internal and are never exposed through public draft endpoints.
- **WorkflowEvent** is append-only and records status changes, assignment, notes, and actor/time metadata.

The public create endpoint can immediately submit or create a server-side draft. A draft creation returns an opaque `draftToken` once. The client sends it in `X-Draft-Token`; founder email is not authentication and must never authorize draft access. Draft tokens are stored hashed, expire 30 days after last autosave, are revoked on submit, and are excluded from URLs/logs.

Autosave uses `PATCH application/merge-patch+json` with `If-Match`. The client debounces changes (recommended 750–1500 ms), sends only changed fields, persists the returned ETag, and handles 412 by fetching the current draft before resolving conflicts. Files upload separately so ordinary field autosaves remain small and idempotent.

Submission requires founder full name/email, company name/description, at least one business-plan document, and a valid current representation. A submitted plan is immutable to the public client.

### Recruitment

- **Job** contains title, slug, department, location, employment type, status, summary and rich sections, optional salary range, SEO metadata, publication/closing instants, and audit fields.
- **Applicant** contains a job summary, legal/contact details, cover-letter text, resume, optional cover-letter file, workflow status, notes, interviews, optional offer, and hiring date.
- **Interview** contains stage, start instant, duration, display timezone, interviewers, format/location, status, and optional feedback.
- **Offer** contains title, compensation, proposed start date, expiry, status, notes, and sent/responded timestamps.
- **WorkflowEvent** is also used for applicant history.

An application is unique by normalized `(jobId, email)` while active. Public apply responses expose only an opaque reference and do not disclose other applicant data.

### CMS and public content

- **PortfolioCompany**: name, industry, description, optional media reference/derived image URL, website URL, featured flag, display order, and content status.
- **Insight**: title, slug, optional category/excerpt/image/author, content, content status, publication instant, and SEO metadata.
- **TeamMember**: full name, role title, optional biography/image/LinkedIn URL, display order, and content status.
- **CmsPage**: title, slug, page type (`STANDARD` or `LEGAL`), body content, SEO metadata, content status, and publication instant.
- **MediaAsset**: original name, classified media type, MIME type, byte size, URL/download URL, alt text, uploader, and timestamps. Content stores `imageAssetId`; URLs are derived rather than copied.
- **ContactMessage**: sender fields, subject/message, read flag and read timestamp.

Only `PUBLISHED` records whose `publishedAt` is not in the future are publicly readable. Publishing sets `publishedAt` when absent; returning to draft does not destroy its previous audit history. Slugs are unique per resource type and immutable after publication unless an explicit redirect facility is added.

### Operations

- **Notification** belongs to one user and contains title, optional message/type/link, read flag/read timestamp, and audit fields. A user can read or delete only their own notifications.
- **Setting** has a stable key, typed value, value type, category, description, editable flag, and updated timestamp. Secrets are not settings and must live in secret management. Batch updates are atomic.
- **AuditEvent** has actor, action, resource type/ID, redacted changes, IP/user agent, request ID, and occurrence time. It is append-only and has no public update/delete endpoint.
- **Dashboard** is a read model, not an entity. It returns four headline counts, status-count maps, a dated business-plan/application series, and generation time.

## Workflow rules

### Business plans

Allowed transitions:

```text
DRAFT -> SUBMITTED
SUBMITTED -> REVIEWING | REJECTED | ARCHIVED
REVIEWING -> APPROVED | REJECTED | ARCHIVED
APPROVED -> ARCHIVED
REJECTED -> REVIEWING | ARCHIVED
```

Only the draft owner can perform `DRAFT -> SUBMITTED`. Admins perform all subsequent transitions. `REJECTED -> REVIEWING` supports correction/reconsideration without erasing history. Every transition writes one workflow event in the same transaction. Status changes to `REJECTED`, `APPROVED`, or `ARCHIVED` require a nonblank comment. Assignment is independent of status and may be cleared.

### Applicants, interviews, offers, and hiring

Allowed applicant transitions:

```text
NEW -> REVIEWING | REJECTED | WITHDRAWN
REVIEWING -> INTERVIEW | REJECTED | WITHDRAWN
INTERVIEW -> INTERVIEW | OFFER | REJECTED | WITHDRAWN
OFFER -> HIRED | REVIEWING | REJECTED | WITHDRAWN
REJECTED -> REVIEWING
```

`INTERVIEW` requires at least one interview. `OFFER` requires an offer in `SENT` or `ACCEPTED`. `HIRED` requires an accepted offer and `hiredOn`. Terminal `HIRED` and `WITHDRAWN` states cannot transition. An interview can be scheduled, completed, cancelled, or marked no-show. An offer moves `DRAFT -> SENT -> ACCEPTED|DECLINED`; `DRAFT|SENT -> WITHDRAWN`. Applicant and sub-resource changes append history events atomically.

### Jobs and content

- Jobs: `DRAFT -> PUBLISHED -> CLOSED -> ARCHIVED`; `DRAFT -> ARCHIVED`; `CLOSED -> PUBLISHED` is allowed to reopen. Publishing requires title, unique slug, type, description, and publication instant.
- CMS content: `DRAFT -> PUBLISHED -> ARCHIVED`; `PUBLISHED -> DRAFT`; `ARCHIVED -> DRAFT`. Publishing requires all public-required fields and accessible referenced media.

## Upload contract

The edge and application may retain a 50 MiB global request limit, but stricter resource limits apply:

| Upload | Allowed types | Per file | Count/aggregate |
| --- | --- | ---: | ---: |
| Business-plan documents | PDF, PPT, PPTX, DOC, DOCX | 25 MiB | 10 / 50 MiB |
| Resume | PDF, DOC, DOCX | 10 MiB | exactly 1 |
| Cover letter | PDF, DOC, DOCX | 10 MiB | at most 1 |
| CMS image | JPEG, PNG, WebP, SVG after sanitization | 10 MiB | 1 per request |
| CMS document | PDF | 25 MiB | 1 per request |
| CMS video | MP4/WebM | 50 MiB | 1 per request |

Validation uses both MIME sniffing and extension allow-lists; the client-provided MIME type is not trusted. Filenames are normalized for display, storage keys are generated, malware scanning occurs before an asset becomes available, and SVG is sanitized. Downloads use authorization checks, safe `Content-Disposition`, `X-Content-Type-Options: nosniff`, and no raw filesystem path. Public media URLs are available only for media attached to published content. Deleting referenced media returns 409.

## Audit and privacy semantics

All authenticated creates, updates, deletes/deactivations, status changes, assignments, uploads/downloads of sensitive applicant/plan files, login outcomes, and settings/RBAC changes generate audit events. Each event is committed in the same transaction as the mutation where possible.

Audit `changes` may contain field-level before/after values but must redact passwords, JWTs, draft tokens, authorization headers, document bodies, and sensitive free text. Public form payloads are not copied wholesale into logs. IP addresses and user agents are personal data and follow the configured retention policy. Audit rows are immutable and should be partitioned/retained according to legal requirements.

Applicant and founder data is visible only to authorized users. Public receipts prevent email enumeration. Hard deletion/anonymization for data-subject requests is an offline controlled operation that preserves a non-identifying audit trail.

## UI screen coverage and frontend mapping

The public screens map as follows:

- Portfolio cards use `imageUrl`, `industry`, `name`, `description`, and `websiteUrl`.
- Insight cards/detail use `category`, `title`, `slug`, `excerpt`, `content`, `imageUrl`, `authorName`, and `publishedAt`.
- Team cards use `imageUrl`, `fullName`, `roleTitle`, `bio`, and `linkedinUrl`.
- Careers list/detail use `title`, `slug`, `department`, `location`, `type`, `summary`, rich job sections, salary range, and closing/publication dates.
- Job application sends a JSON `application` part plus `resume` and optional `coverLetter` files.
- Business-plan wizard uses nested `founder`, `company`, and `traction`, server autosave, `currentStep`, document metadata, ETag, and draft token.
- Contact and legal screens use contact receipts and `GET /public/pages/{slug}`.

The admin screens map as follows:

- Dashboard consumes `counts`, status count maps, and `submissionSeries`; no `stats.business_plans` or parallel label/value arrays.
- Each list consumes the standard page envelope and documented canonical fields. Review drawers fetch the detail endpoint rather than rendering arbitrary object entries.
- Business-plan detail has assignment, documents, notes, history, status actions, and optimistic concurrency.
- Applicant detail has resume/cover-letter downloads, notes, history, interview scheduling/feedback, offer, and hiring actions.
- CMS is three explicit resources (`pages`, `insights`, `team`), while portfolio and jobs retain dedicated modules.
- Media selection stores asset UUIDs. Users show `roles[]`; roles show `permissions[]` and `userCount`.
- Settings renders typed `Setting[]` and saves an atomic batch. Notifications and contact messages use `read`/`readAt`.

Required frontend renames from the current prototype include:

| Current prototype field | Canonical field |
| --- | --- |
| `image`, `photo` | `imageUrl` |
| `sector` | `industry` |
| `name` (team) | `fullName` |
| `title` (team role) | `roleTitle` |
| `employment_type` | `type` |
| `first_name`, `last_name` | `firstName`, `lastName` |
| `linkedin_url` | `linkedinUrl` |
| `cover_letter_text` | `coverLetterText` |
| `company_name` | `company.name` |
| `summary` (plan) | `company.description` |
| `business_plan` file | `documents[]` |
| `contact_name` | `founder.fullName` |
| `job_title` | `job.title` |
| `created_at`, `updated_at` | `createdAt`, `updatedAt` |
| `users_count` | `userCount` |
| `actor`, `resource` strings | `actor`, `resourceType`, `resourceId` |
| `organization_name` | setting key `organizationName` |
| `contact_email` | setting key `contactEmail` |
| `submissions` | setting key `businessPlanSubmissionsEnabled` (boolean) |

There are no canonical `stage` fields on portfolio companies, generic CMS `type` rows, generic media `name/type/size` aliases, singular user `role`, or arbitrary fallback `title/summary/body` fields. Those prototype columns must be removed or mapped to the real fields above.

## Required migrations from the current implementation

### Database

1. Add optimistic-lock `version`, `submitted_at`, hashed `draft_token_hash`, and `draft_expires_at` to business plans. Replace founder-email draft authorization.
2. Either normalize founder/company/traction into owned tables or retain existing columns with explicit mappers. Add currencies for funding and revenue; rename the semantic `funding_amount` to funding requested.
3. Add applicant `WITHDRAWN`, `hired_on`, `read`-safe file metadata, uniqueness on normalized `(job_id, email)`, and dedicated `applicant_interviews` and `applicant_offers` tables.
4. Add `published_at`/`closes_at`, summary, salary currency/period, and `TEMPORARY`; migrate the old `REMOTE` job type to a location/work-arrangement value rather than an employment type.
5. Add insight category, SEO fields, instant `published_at`, and media FK. Convert `published_date` and CMS `published_at` DATE columns to timestamptz.
6. Add CMS page type and convert portfolio/team/insight image URL columns to media foreign keys (temporarily retain legacy URLs during backfill).
7. Add media availability/scan status and public storage URL/key separation. Never expose `file_path`.
8. Add notification/contact `read_at`; store setting value type and JSON value; add audit user agent, request ID, JSON changes, and timestamptz `occurred_at`.
9. Add missing uniqueness/check constraints: normalized emails, nonnegative sizes/order/team size, valid money ranges, slug format, publication requirements, and offer/interview temporal rules.
10. Replace physical deletes with deactivation/archive where this contract specifies retention.

### Backend/API

1. Replace every `Map<String, Object>` controller/service response with explicit response DTOs and remove entity serialization.
2. Apply a global camelCase JSON policy and RFC 9457 exception handler with 422 field validation.
3. Standardize every list on the full page envelope (`first`, `last`, `empty`, `sort`) and allow-list sort fields.
4. Return `accessToken`, expiry, and nested user from login; add `/auth/me`. Do not add a refresh token without a separate rotation/revocation design.
5. Implement server-side draft token hashing, autosave merge patch, ETags, document upload, and explicit submit. Keep the current multipart create as the compatible create/submit entry point.
6. Add typed detail endpoints, applicant history/interview/offer endpoints, CMS resource detail endpoints, permission-aware authorization, and atomic typed settings batch update.
7. Make public portfolio/team endpoints paged. Keep `/public/legal/{slug}` as a temporary alias to `/public/pages/{slug}` and publish deprecation headers.
8. Preserve `/admin/applicants/{id}/resume`, `/cover-letter`, and business-plan document routes as aliases where needed; canonical parameter names do not change their wire paths.
9. Generate responses from the canonical OpenAPI contract in CI and fail on undocumented/breaking drift.

### Frontend

1. Remove the duplicate API wrappers and generic `unpackPage` fallbacks; consume `content` and page metadata explicitly.
2. Replace all snake_case form/table fields and fallback aliases with the canonical mappings above.
3. Submit the exact multipart part names/types documented in OpenAPI. The current generic `/applications` and flat form upload do not match the backend route.
4. Replace local-only plan autosave with server drafts while optionally caching the plan ID, draft token, and last ETag locally. Files are restored from server metadata.
5. Replace the generic resource editor with resource-specific forms, enum options, validation, and correct PUT/PATCH semantics.
6. Gate navigation/actions using `/auth/me.permissions`, render dashboard from the canonical read model, and add detail workflows for plans and applicants.
7. Fetch legal CMS pages instead of embedding policy copy once CMS becomes authoritative.

## Defaults chosen

- API remains under `/api`; no additional `/v1` prefix is introduced for the first canonical release.
- Page numbering remains zero-based for compatibility.
- Access JWTs have no refresh flow in v1.
- Public drafts use an opaque, hashed, 30-day rotating-expiry token plus ETag concurrency.
- Money defaults to no currency: clients must provide one whenever an amount is supplied.
- Published content uses instants rather than date-only publication fields.
- Public and admin collections are consistently paged, including portfolio and team.
- Search is simple case-insensitive contains matching; full-text ranking is deferred.
- Current seeded permission codes remain canonical; roles remain configurable.
