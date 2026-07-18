#!/usr/bin/env sh
set -eu

: "${PGDATABASE:?PGDATABASE is required}"
: "${1:?usage: restore.sh PATH_TO_DUMP}"

dump_file="$1"

if [ "${ALLOW_RESTORE:-}" != "yes" ]; then
  echo "Refusing restore. Set ALLOW_RESTORE=yes after verifying the target." >&2
  exit 2
fi

[ -r "$dump_file" ] || { echo "Backup is not readable: $dump_file" >&2; exit 2; }
pg_restore --list "$dump_file" >/dev/null

if [ -f "${dump_file}.sha256" ]; then
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$(dirname "$dump_file")" && sha256sum -c "$(basename "$dump_file").sha256")
  else
    expected="$(awk '{print $1}' "${dump_file}.sha256")"
    actual="$(shasum -a 256 "$dump_file" | awk '{print $1}')"
    [ "$expected" = "$actual" ] || { echo "Checksum mismatch" >&2; exit 1; }
  fi
fi

table_count="$(psql -XAtv ON_ERROR_STOP=1 -c \
  "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema');")"
[ "$table_count" = "0" ] || {
  echo "Target database is not empty (${table_count} tables); refusing to overwrite." >&2
  exit 2
}

echo "Restoring into ${PGDATABASE}"
pg_restore --exit-on-error --no-owner --no-acl --dbname="$PGDATABASE" "$dump_file"
psql -Xv ON_ERROR_STOP=1 -c "ANALYZE;"
echo "Restore completed. Run database/verify.sh before allowing traffic."
