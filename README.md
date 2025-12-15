# Helfy SRE Home Assignment

Minimal full-stack setup with TiDB, Node.js API, simple client, Kafka + TiCDC, and a CDC consumer. Everything runs via Docker Compose.

## Quick start
1) Clone and enter the repo:
   ```bash
   git clone https://github.com/eyallustig/sre-home-assignment-eyal-lustig.git
   cd sre-home-assignment-eyal-lustig
   ```
2) Bring everything up (add `--build` on first run or after code changes):
   ```bash
   docker compose up -d --build
   ```
3) Check status:
   ```bash
   docker compose ps
   ```
   Services should be `healthy` or `running`; `changefeed-init` should show `exited (0)`.

## Default credentials
- Email: `admin@helfy.local`
- Password: `Password123!`

## Services (Compose)
- `pd`, `tikv`, `tidb`: TiDB cluster (store + SQL endpoint on 4000).
- `db-init`: one-shot schema + seed loader (`db/init.sql`, `db/seed.sql`).
- `api`: Node.js/Express auth + products API (`/api/login`, `/api/products`, health at `/health`).
- `client`: Minimal static UI on `http://localhost:8080` (login + CRUD: add/update/delete products; products load automatically after login).
- `kafka`: Single-node Kafka (KRaft) broker.
- `ticdc`: TiCDC server.
- `changefeed-init`: creates/resumes changefeed from TiDB to Kafka topic `tidb_changes` (canal-json).
- `consumer`: Node.js CDC consumer logging structured change events; health at `/health` on port 8081.

## Verification
- API health: `curl http://localhost:3000/health`
- Login:  
  ```bash
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@helfy.local","password":"Password123!"}'
  ```
- Protected data:  
  `curl http://localhost:3000/api/products -H "Authorization: Bearer <token>"`
- Client UI: open `http://localhost:8080`, log in, products load automatically after login.
- CDC pipeline: watch consumer logs  
  `docker compose logs -f consumer`
