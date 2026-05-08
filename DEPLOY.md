# Deployment

This document describes how to run the Crypto Wallet locally and how the
portal-deploy staging container is built. Architecture context lives in
`docs/architecture/ARCHITECTURE.md`; this file is the operational quickstart.

---

## Local — H2 in-memory (default)

```bash
docker compose up -d
```

- Brings up only the `app` service.
- App boots with `SPRING_PROFILES_ACTIVE=staging` → H2 in-memory datasource,
  no `/h2-console`, ephemeral data (DB resets on container restart).
- Reachable at `http://localhost:8080/`.
- Healthcheck: `wget --spider http://localhost:8080/actuator/health` every 15s
  after a 30s start period. Inspect with:
  ```bash
  docker inspect --format='{{.State.Health.Status}}' cryptowallet-app
  ```

This is the dev-friendly flow and also mirrors what the portal-deploy
staging container does, so behaviour is identical between local and staging.

## Local — Postgres (production-like)

Layer the prod overlay on top of the default compose file:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

- Brings up both `postgres` and `app`. App waits for postgres to report
  `service_healthy` before starting.
- App switches to `SPRING_PROFILES_ACTIVE=prod` and connects to
  `jdbc:postgresql://postgres:5432/cryptowallet`.
- Postgres is exposed on host port `5433` (mapped to container `5432`).
- `/h2-console` is disabled in this profile (and unreachable regardless,
  since H2 is not the active datasource).

Tear down:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
# add -v to drop the postgres volume
```

## Portal-deploy (staging)

Portal-deploy uses Path A on this repo: it builds the image at the
Dockerfile, reads `docker-compose.yml`, and `docker run`s the image
with the first numeric port exposed (`8080`). Postgres is **not** brought
up alongside — that's why the staging path uses H2 in-memory and the deploy
artifact is fully self-sufficient.

Equivalent local invocation:

```bash
docker build -t cryptowallet:staging .
docker run -d -p 8080:8080 --name cryptowallet cryptowallet:staging
```

## Healthcheck

| Aspect       | Value                                                       |
| ------------ | ----------------------------------------------------------- |
| Endpoint     | `GET /actuator/health` (Spring Boot Actuator)               |
| Exposure     | `management.endpoints.web.exposure.include: health` only    |
| Detail level | `management.endpoint.health.show-details: never`            |
| Probe        | `wget --spider --tries=1` from inside the container         |
| Cadence      | `interval=15s timeout=5s retries=3 start-period=30s`        |

The endpoint returns `{"status":"UP"}` (or `DOWN`) as the body. Detail
elements (DB ping, disk space, etc.) are intentionally suppressed so we
don't leak component names externally. The same healthcheck is mirrored on
the `app` service in `docker-compose.yml` so compose health gates match the
container's own.

## Spring profiles

| Profile   | When                                       | Datasource                  | H2 console |
| --------- | ------------------------------------------ | --------------------------- | ---------- |
| `default` | only when `application.yml` runs alone     | Postgres (localhost:5433)   | n/a        |
| `h2`      | local dev with `--h2` or `start.sh --h2`   | H2 in-memory                | enabled    |
| `staging` | portal-deploy + default `docker compose`   | H2 in-memory                | **off**    |
| `prod`    | `docker-compose.prod.yml` overlay          | Postgres (`postgres:5432`)  | **off**    |

`h2` is the only profile where `/h2-console` is reachable.
`H2ConsoleProdProfileTest` enforces this at build time — it boots with the
`prod` profile and asserts a known H2 console URL returns 404.

## Host-mode dev (no Docker)

For host-mode dev (running Maven + npm directly on the workstation), use:

```bash
./start.sh                # auto-detect DB (postgres if container present, else H2)
./start.sh --h2           # force H2
./start.sh --postgres     # force postgres
./start.sh --no-admin     # skip the initial admin bootstrap call
./stopwallet.sh           # tear down
```

`startwallet.sh` and `startwallet-admin.sh` are deprecated compatibility
stubs that delegate to `start.sh`.
