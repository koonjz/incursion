#!/usr/bin/env bash
# ==============================================================================
# ACM Resolve — Database Backup Utility (pg_dump)
#
# Dumps the PostgreSQL database schema and data from DIRECT_URL into a local
# timestamped compressed SQL file.
#
# NOTE ON NEON RESTORE WINDOW:
# On the Neon Free Tier, Point-in-Time Restore (PITR) is limited to 24 hours.
# On Neon Pro plans, PITR extends up to 30 days. Running periodic local backups
# provides an independent safety layer prior to running major migrations.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="backups/db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${BACKUP_DIR}/acm_resolve_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

if [ -z "${DIRECT_URL:-}" ]; then
  if [ -n "${DATABASE_URL:-}" ]; then
    echo "WARNING: DIRECT_URL is unset. Falling back to DATABASE_URL..."
    TARGET_URL="$DATABASE_URL"
  else
    echo "ERROR: DIRECT_URL and DATABASE_URL are both missing. Cannot execute pg_dump."
    exit 1
  fi
else
  TARGET_URL="$DIRECT_URL"
fi

# Sanitize host for logging
SAFE_HOST=$(echo "$TARGET_URL" | sed -E 's|.*@([^:/]+).*|\1|')
if [ -z "$SAFE_HOST" ]; then
  SAFE_HOST="[host-hidden]"
fi

echo "================================================================="
echo " Starting Database Backup"
echo " Target Host: $SAFE_HOST"
echo " Destination: $OUTPUT_FILE"
echo "================================================================="

# Check pg_dump availability
if ! command -v pg_dump &> /dev/null; then
  echo "ERROR: pg_dump command not found in PATH."
  echo "Please install PostgreSQL client tools (e.g. postgresql-client or libpq) to use this backup utility."
  exit 1
fi

# Execute pg_dump and pipe through gzip
pg_dump "$TARGET_URL" --no-owner --no-acl --clean --if-exists | gzip > "$OUTPUT_FILE"

FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo "================================================================="
echo " Backup Completed Successfully!"
echo " File: $OUTPUT_FILE ($FILE_SIZE)"
echo " Note: Keep this file secure and uncommitted."
echo "================================================================="
