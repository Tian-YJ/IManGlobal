#!/usr/bin/env sh
set -eu

: "${PGDATABASE:?PGDATABASE is required}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-iman}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="${BACKUP_DIR}/${BACKUP_PREFIX}_${timestamp}.dump"

case "$RETENTION_DAYS" in
  ''|*[!0-9]*) echo "RETENTION_DAYS must be a non-negative integer" >&2; exit 2 ;;
esac

mkdir -p "$BACKUP_DIR"
umask 077

echo "Backing up ${PGDATABASE} to ${output}"
pg_dump --format=custom --compress=9 --no-owner --no-acl --file="$output" "$PGDATABASE"
pg_restore --list "$output" >/dev/null

output_name="$(basename "$output")"
if command -v sha256sum >/dev/null 2>&1; then
  (cd "$BACKUP_DIR" && sha256sum "$output_name" >"${output_name}.sha256")
else
  (cd "$BACKUP_DIR" && shasum -a 256 "$output_name" >"${output_name}.sha256")
fi

{
  echo "created_at=${timestamp}"
  echo "database=${PGDATABASE}"
  echo "server_version=$(psql -XAtqc 'SHOW server_version')"
  echo "pg_dump_version=$(pg_dump --version)"
} >"${output}.metadata"

if [ "$RETENTION_DAYS" -gt 0 ]; then
  find "$BACKUP_DIR" -type f -name "${BACKUP_PREFIX}_*.dump*" -mtime "+${RETENTION_DAYS}" -delete
  find "$BACKUP_DIR" -type f -name "${BACKUP_PREFIX}_*.metadata" -mtime "+${RETENTION_DAYS}" -delete
fi

echo "Backup verified: ${output}"
