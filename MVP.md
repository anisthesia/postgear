# postgear — personal MVP setup

Fork of [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) (AGPL-3.0), run from source for personal use.

## One-time

```bash
source ~/.nvm/nvm.sh && nvm use 22.23.3      # package.json wants 22.23.x
corepack enable && corepack prepare pnpm@10.6.1 --activate
pnpm install                                  # also runs prisma generate
docker compose -f docker-compose.mvp.yaml up -d
pnpm run prisma-db-push                       # creates the schema in postgear-postgres
```

## Every day

```bash
docker compose -f docker-compose.mvp.yaml up -d
pnpm run dev:backend        # http://localhost:3000
pnpm run dev:orchestrator   # Temporal workers, health at http://localhost:3002/health/status
pnpm run dev:frontend       # http://localhost:4200
```

Open http://localhost:4200 and register the first account. With no `RESEND_API_KEY` set,
accounts activate immediately. Set `DISABLE_REGISTRATION=true` in `.env` after you have yours.

## Ports (chosen to avoid conflicts on this machine)

| Service | Port | Note |
|---|---|---|
| Frontend | 4200 | |
| Backend API | 3000 | |
| Orchestrator health | 3002 | |
| Postgres | 5432 | user `postgear-local`, db `postgear-db-local` |
| Redis | 6380 | 6379 is a local redis-server |
| Temporal gRPC | 7233 | |
| Temporal UI | 8233 | 8080 is claude-broker |

## Differences from upstream dev setup

- `docker-compose.mvp.yaml` drops Elasticsearch, pgAdmin and RedisInsight. Temporal runs with SQL
  visibility, which caps `Text` search attributes at 3, so `SKIP_ADD_CUSTOM_SEARCH_ATTRIBUTES=true`
  stops the auto-setup image from pre-creating sample ones. The backend registers `organizationId`
  and `postId` itself on first boot.
- Uploads are stored on disk under `var/uploads/` (git-ignored) and served at `/uploads`.

## Connecting social accounts

Each platform needs your own developer app. Put the client id and secret in `.env` and restart
the backend. The OAuth callback URL is `http://localhost:4200/integrations/social/<provider>` for
local use (it is built from `FRONTEND_URL`); see https://docs.postiz.com for per-provider steps.

## Keeping up with upstream

```bash
git fetch upstream --tags
git merge upstream/main        # or a tag, e.g. v2.25.2
```
