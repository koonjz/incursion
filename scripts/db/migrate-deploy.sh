#!/usr/bin/env bash
# ==============================================================================
# ACM Resolve — Production Database Migration Runner
#
# Enforces safe execution of `prisma migrate deploy` against direct unpooled
# database endpoints (DIRECT_URL). Refuses execution if a pooled URL is used.
# ==============================================================================

set -euo pipefail

echo "================================================================="
echo " Starting Safe Prisma Migration Deploy"
echo "================================================================="

# 1. Verify DIRECT_URL presence
if [ -z "${DIRECT_URL:-}" ]; then
  if [ -n "${DATABASE_URL:-}" ]; then
    echo "WARNING: DIRECT_URL is not set. Falling back to DATABASE_URL..."
    TARGET_URL="$DATABASE_URL"
  else
    echo "ERROR: Neither DIRECT_URL nor DATABASE_URL is defined."
    exit 1
  fi
else
  TARGET_URL="$DIRECT_URL"
fi

# 2. Safety Check: Disallow pooled connection hosts for DDL migrations
if [[ "$TARGET_URL" == *"-pooler"* ]]; then
  echo "FATAL ERROR: Target migration URL contains '-pooler' in the hostname!"
  echo "Prisma migrations require advisory locks and must run against DIRECT_URL (unpooled)."
  echo "Aborting migration to prevent transaction deadlocks or schema corruption."
  exit 1
fi

# 3. Extract and sanitize host name for secure logging (never log credentials)
# Matches text between '@' and next ':' or '/'
SAFE_HOST=$(echo "$TARGET_URL" | sed -E 's|.*@([^:/]+).*|\1|')

if [ -z "$SAFE_HOST" ] || [ "$SAFE_HOST" = "$TARGET_URL" ]; then
  SAFE_HOST="[host-hidden-or-localhost]"
fi

echo "Connecting to target database host: $SAFE_HOST"
echo "Executing: npx prisma migrate deploy..."

# 4. Run migration with DIRECT_URL set as DATABASE_URL for Prisma runtime
DATABASE_URL="$TARGET_URL" DIRECT_URL="$TARGET_URL" npx prisma migrate deploy

echo "================================================================="
echo " Prisma migration successfully applied to $SAFE_HOST"
echo "================================================================="
