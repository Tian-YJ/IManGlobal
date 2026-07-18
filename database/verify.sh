#!/usr/bin/env sh
set -eu

: "${PGDATABASE:?PGDATABASE is required}"

psql -Xv ON_ERROR_STOP=1 <<'SQL'
\echo 'Database identity'
SELECT current_database() AS database,
       current_user AS role,
       current_setting('server_version') AS server_version,
       pg_size_pretty(pg_database_size(current_database())) AS size;

\echo 'Liquibase status'
SELECT CASE
         WHEN to_regclass('public.databasechangelog') IS NULL THEN 'MISSING'
         ELSE 'PRESENT'
       END AS databasechangelog;

\echo 'Invalid indexes (must return no rows)'
SELECT n.nspname AS schema_name, c.relname AS index_name
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT i.indisvalid;

\echo 'Unvalidated constraints (must return no rows)'
SELECT conrelid::regclass AS table_name, conname AS constraint_name
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND NOT convalidated;

\echo 'Relationship and uniqueness integrity'
DO $$
DECLARE
  issues bigint;
BEGIN
  SELECT sum(count)
    INTO issues
    FROM (
      SELECT count(*) FROM user_roles x LEFT JOIN users p ON p.id = x.user_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM user_roles x LEFT JOIN roles p ON p.id = x.role_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM role_permissions x LEFT JOIN roles p ON p.id = x.role_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM role_permissions x LEFT JOIN permissions p ON p.id = x.permission_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM business_plan_documents x LEFT JOIN business_plans p ON p.id = x.business_plan_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM business_plan_history x LEFT JOIN business_plans p ON p.id = x.business_plan_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM applicants x LEFT JOIN jobs p ON p.id = x.job_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM applicant_notes x LEFT JOIN applicants p ON p.id = x.applicant_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM applicant_activities x LEFT JOIN applicants p ON p.id = x.applicant_id WHERE p.id IS NULL
      UNION ALL SELECT count(*) FROM notifications x LEFT JOIN users p ON p.id = x.user_id WHERE p.id IS NULL
    ) orphan_counts;
  IF issues <> 0 THEN
    RAISE EXCEPTION 'Detected % orphaned relationship rows', issues;
  END IF;

  SELECT count(*)
    INTO issues
    FROM (
      SELECT email FROM users GROUP BY email HAVING count(*) > 1
      UNION ALL SELECT name FROM roles GROUP BY name HAVING count(*) > 1
      UNION ALL SELECT code FROM permissions GROUP BY code HAVING count(*) > 1
      UNION ALL SELECT slug FROM jobs GROUP BY slug HAVING count(*) > 1
      UNION ALL SELECT slug FROM insights GROUP BY slug HAVING count(*) > 1
      UNION ALL SELECT slug FROM cms_pages GROUP BY slug HAVING count(*) > 1
      UNION ALL SELECT setting_key FROM settings GROUP BY setting_key HAVING count(*) > 1
    ) duplicate_keys;
  IF issues <> 0 THEN
    RAISE EXCEPTION 'Detected % duplicate logical keys', issues;
  END IF;
END
$$;

\echo 'Long-running transactions over five minutes'
SELECT pid, usename, now() - xact_start AS age, state
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
  AND now() - xact_start > interval '5 minutes'
  AND pid <> pg_backend_pid();
SQL
