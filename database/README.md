# PostgreSQL operations

The schema authority is `backend/src/main/resources/db/changelog/db.changelog-master.xml`.
Do not create tables, indexes, seed records, or ad-hoc migrations in this directory.
Every schema change must be an append-only Liquibase changeset reviewed and deployed
with the backend.

## Supported operations

- `backup.sh`: compressed, consistent logical backup with a checksum and metadata.
- `restore.sh`: guarded restore into an empty target database.
- `verify.sh`: connectivity, Liquibase state, database size, and invalid-index checks.

The scripts require PostgreSQL client tools matching the database major version or
newer. They accept standard libpq variables (`PGHOST`, `PGPORT`, `PGUSER`,
`PGPASSWORD`, `PGSSLMODE`) and require `PGDATABASE`. Prefer a `.pgpass` file or a
runtime secret mount over exporting `PGPASSWORD`.

## Backup policy

Run backups from a dedicated host/container with encrypted storage. A reasonable
starting policy is daily logical backups retained for 14 days, weekly copies retained
for 8 weeks, and provider-level point-in-time recovery. Adjust to the approved RPO/RTO.
Copy backups off-host and alert on script failure.

Test a restore at least quarterly:

```sh
PGDATABASE=iman_restore ./database/restore.sh backups/iman_20260711T120000Z.dump
PGDATABASE=iman_restore ./database/verify.sh
```

Restores do not replace Liquibase. After restoration, start the same application
release that produced the backup, confirm Liquibase is clean, then upgrade normally.

## Change safety

Before a production migration, review generated SQL, take a verified backup, and test
the changeset against a production-sized copy. Use expand/migrate/contract changes for
zero-downtime releases. Never edit an applied changeset; add a new corrective one.
