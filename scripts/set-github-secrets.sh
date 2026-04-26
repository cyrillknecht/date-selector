#!/usr/bin/env bash
# Reads .env and pushes all values as GitHub Actions secrets.
# Run once after: gh auth login

set -euo pipefail

REPO="cyrillknecht/date-selector"
ENV_FILE="$(dirname "$0")/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env not found at $ENV_FILE"
  exit 1
fi

secrets=(
  SUPABASE_PROJECT_ID
  SUPABASE_DB_PASSWORD
  TF_API_TOKEN
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ACCESS_TOKEN
  RESEND_API_KEY
  VERCEL_API_TOKEN
  NEXT_PUBLIC_APP_URL
)

for key in "${secrets[@]}"; do
  value=$(grep "^${key}=" "$ENV_FILE" | cut -d '=' -f2-)
  if [ -z "$value" ]; then
    echo "⚠ Skipping $key (empty)"
    continue
  fi
  echo "Setting $key..."
  echo -n "$value" | gh secret set "$key" --repo "$REPO"
done

echo ""
echo "Done. Verify at: https://github.com/$REPO/settings/secrets/actions"
