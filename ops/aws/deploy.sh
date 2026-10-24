#!/usr/bin/env bash
# Push the stack to the server and (re)start it. Safe to re-run.
#   ops/aws/deploy.sh            # uses terraform output for the host
# On first run it generates /opt/postgear/.env ON THE SERVER with fresh secrets;
# later runs keep that file untouched. Provider keys are added there by hand.
set -euo pipefail
cd "$(dirname "$0")"
HOST="$(terraform output -raw public_ip)"
DOMAIN="${DOMAIN:-social.ridepro.in}"
POSTIZ_TAG="${POSTIZ_TAG:-v2.25.2}"
KEY="${KEY:-$HOME/.ssh/postgear_aws}"
SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "ubuntu@$HOST")

echo "[deploy] waiting for first-boot setup on $HOST"
until "${SSH[@]}" 'test -f /var/lib/postgear-bootstrap-done' 2>/dev/null; do sleep 5; done

echo "[deploy] copying stack files"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new -r deploy/compose.yaml deploy/Caddyfile deploy/dynamicconfig "ubuntu@$HOST:/opt/postgear/"

echo "[deploy] ensuring server-side .env"
"${SSH[@]}" DOMAIN="$DOMAIN" POSTIZ_TAG="$POSTIZ_TAG" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/postgear
if [ ! -f .env ]; then
  umask 077
  PGPW="$(openssl rand -hex 24)"
  cat > .env <<ENV
# --- generated on first deploy; edit here to add provider keys, then: docker compose up -d postiz
DOMAIN=${DOMAIN}
POSTIZ_TAG=${POSTIZ_TAG}
POSTGRES_USER=postiz
POSTGRES_PASSWORD=${PGPW}

MAIN_URL=https://${DOMAIN}
FRONTEND_URL=https://${DOMAIN}
NEXT_PUBLIC_BACKEND_URL=https://${DOMAIN}/api
BACKEND_INTERNAL_URL=http://localhost:3000
DATABASE_URL=postgresql://postiz:${PGPW}@postgres:5432/postiz
REDIS_URL=redis://redis:6379
JWT_SECRET=$(openssl rand -hex 48)
TEMPORAL_ADDRESS=temporal:7233
TEMPORAL_NAMESPACE=default
IS_GENERAL=true
STORAGE_PROVIDER=local
UPLOAD_DIRECTORY=/uploads
NEXT_PUBLIC_UPLOAD_DIRECTORY=/uploads
# Open until the owner registers, then set true and: docker compose up -d postiz
DISABLE_REGISTRATION=false
API_LIMIT=30
NX_ADD_PLUGINS=false

# --- social provider apps (callback: https://${DOMAIN}/integrations/social/<provider>)
X_API_KEY=
X_API_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
THREADS_APP_ID=
THREADS_APP_SECRET=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=
PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
MASTODON_URL=https://mastodon.social
MASTODON_CLIENT_ID=
MASTODON_CLIENT_SECRET=
OPENAI_API_KEY=
ENV
  echo "[remote] generated /opt/postgear/.env"
else
  echo "[remote] keeping existing /opt/postgear/.env"
fi
docker compose pull -q
docker compose up -d
docker compose ps --format 'table {{.Service}}\t{{.State}}\t{{.Status}}'
REMOTE
echo "[deploy] done: https://$DOMAIN"
