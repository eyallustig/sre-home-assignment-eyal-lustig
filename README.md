## Part 1: API + Web + TiDB

### What’s included
- TiDB schema and seed: `db/init.sql`, `db/seed.sql` (users, tokens, products; default user `admin@helfy.local` / `Password123!`; optional token `devtoken-123`).
- Node.js API (`api/`) with login and protected products endpoint.
- Minimal web client (`web/`) with a basic login form and “Load products” button.

### Default credentials
- Email: `admin@helfy.local`
- Password: `Password123!`
- Optional seed token (can be used instead of login): `devtoken-123` (send as `Authorization: Bearer devtoken-123`)

### Quick start (local, without Compose services for API/web yet)
1) Start TiDB from repo root:
   ```
   docker compose up -d
   ```
2) Apply schema + seed:
   ```
   cat db/init.sql db/seed.sql | docker run --rm -i --network=sre-home-assignment-eyal-lustig_default mysql:8.0 \
     mysql -h tidb -P 4000 -u root
   ```
3) Run the API (from `api/`):
   ```
   cd api
   npm install
   DB_HOST=127.0.0.1 DB_PORT=4000 DB_USER=root DB_PASSWORD= DB_NAME=helfy npm start
   ```
   - Watch mode (auto-restart on code changes):  
     `DB_HOST=127.0.0.1 DB_PORT=4000 DB_USER=root DB_PASSWORD= DB_NAME=helfy npm run dev`
   - Health check: `curl http://localhost:3000/health`
   - Login: `curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"email":"admin@helfy.local","password":"Password123!"}'`
   - Protected data: `curl http://localhost:3000/api/products -H "Authorization: Bearer <token>"`
   - Create product: `curl -X POST http://localhost:3000/api/products -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"slug":"demo","name":"Demo","target_audience":"patient","description":"demo item"}'`
   - Delete product: `curl -X DELETE http://localhost:3000/api/products/1 -H "Authorization: Bearer <token>"`
   - Seed token you can use instead of login: `devtoken-123` (send as `Authorization: Bearer devtoken-123`).
4) Run the web (from `web/`):
   ```
   cd web
   npm install
   npm start
   ```
   - Watch mode (auto-restart on code changes):  
     `npm run dev`
   Then open http://localhost:8080 and use the default credentials. The web client calls the API at `http://localhost:3000`.

### How to verify DB contents directly
```
docker run --rm -it --network=sre-home-assignment-eyal-lustig_default mysql:8.0 \
  mysql -h tidb -P 4000 -u root \
  -e "USE helfy; SHOW TABLES; SELECT id,email FROM users; SELECT slug,name,target_audience FROM products;"
```
