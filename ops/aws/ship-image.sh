#!/usr/bin/env bash
# Build the fork image locally (linux/amd64) and stream it to the server, no tar file on disk.
#   ops/aws/ship-image.sh [ref]      # builds ref (default HEAD) as postgear:<short-sha>
# Afterwards, on the server: set POSTIZ_IMAGE=postgear and POSTIZ_TAG=<short-sha> in
# /opt/postgear/.env, then: docker compose up -d postiz
set -euo pipefail
cd "$(dirname "$0")"
ROOT="$(git rev-parse --show-toplevel)"
REF="${1:-HEAD}"
SHA="$(git -C "$ROOT" rev-parse --short=8 "$REF")"
KEY="${KEY:-$HOME/.ssh/postgear_aws}"
HOST="$(terraform output -raw public_ip)"
"$PWD/allow-my-ip.sh" >/dev/null

echo "[ship] building postgear:$SHA (linux/amd64) from the committed tree"
# git archive streams only tracked files, so a local .env or other ignored file never reaches the image
git -C "$ROOT" archive "$REF" | docker build --platform linux/amd64 -f Dockerfile.dev -t "postgear:$SHA" -

echo "[ship] streaming postgear:$SHA to $HOST"
docker save "postgear:$SHA" | gzip | ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "ubuntu@$HOST" 'gunzip | docker load'
echo "[ship] done: postgear:$SHA"
