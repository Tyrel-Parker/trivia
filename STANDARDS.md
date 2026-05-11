I want to standardize this repo to work with my homelab setup. Apply the following standards:

**Traefik / Networking**
- All services that need external access join the `proxy` Docker network (external, must already exist)
- Internal services (DB, ollama, inter-service traffic) use a private `<app>_net` bridge network — never exposed to Traefik
- Routing is subdomain-based via Traefik labels:
  - Frontend: `Host(\`<app>.tyrelparker.dev\`)`
  - Backend/API: `Host(\`api.<app>.tyrelparker.dev\`)`
  - Other services as needed (e.g. `db.<app>.tyrelparker.dev` via TCP)
- Entrypoint is always `web` (port 80) unless TCP
- The backend joins BOTH `proxy` (for Traefik) and `<app>_net` (to reach the DB) in ALL environments — dev and prod

**dnsmasq (laptop only)**
- Store a dnsmasq conf at `dnsmasq/<app>.tyrelparker.dev.conf` in the repo
- Contents:
  ```
  address=/<app>.tyrelparker.dev/127.0.0.1
  address=/.<app>.tyrelparker.dev/127.0.0.1
  ```
- This file gets copied to `/etc/dnsmasq.d/` via `make dnsmasq-install` — not needed on the homelab
- dnsmasq resolves `*.<app>.tyrelparker.dev` → 127.0.0.1 on the laptop, so Traefik (running on port 80) receives all subdomain traffic and routes it to the correct container

**Frontend**
- Use Vite for all frontends
- `make dev` starts all backend containers in Docker (db + backend, both with Traefik labels), then runs the Vite dev server locally for HMR
- In dev, the frontend calls the backend directly at `http://localhost:3001` — the backend exposes this port in dev. Set `VITE_API_URL=http://localhost:3001` in `frontend/.env.development`.
- In prod, set `VITE_API_URL=http://api.<app>.tyrelparker.dev` in `frontend/.env.production` — Traefik routes this.
- The backend always exposes `ports: "3001:3001"` so the Vite dev server can reach it directly. Traefik also routes `api.<app>.tyrelparker.dev` to the same port for prod access.
- `make prod` builds with `vite build` and serves the `dist/` output via an nginx container inside the project
- The nginx container joins both `proxy` and `<app>_net`
- Do NOT configure a Vite dev server proxy — frontend code uses `VITE_API_URL` env var for all API calls

**Single docker-compose.yml (no separate dev file)**
- One `docker-compose.yml` for both dev and prod
- `make dev` starts only `db` and `backend` services: `docker compose up -d --build db backend`
- `make prod` starts all services including the nginx frontend: `docker compose --profile prod up -d --build`
- The nginx `frontend` service gets `profiles: [prod]` so it is excluded from plain `docker compose up`
- Backend uses a single `Dockerfile` — the `CMD` checks `NODE_ENV`: runs `nodemon` in development, `node` in production. The `./backend/src:/app/src` volume mount in dev enables hot-reload without rebuilding.
- Backend env vars that differ by environment (`NODE_ENV`, `FRONTEND_URL`) default to dev values in the compose file and are overridden by `make prod` via inline env exports
- Do NOT expose db ports to the host — backend reaches db via Docker internal network (`<app>_net`)
- Declare `proxy` as an external network

**Ollama**
- Any service using Ollama mounts `~/.ollama:/root/.ollama` to share the model cache across all projects
- Ollama container stays on `<app>_net` only — never exposed to Traefik

**Push Notifications (ntfy)**
- The homelab runs a shared ntfy instance at `ntfy.tyrelparker.dev` — source at `/home/tyrel/repos/ntfy`
- Apps that need to send push notifications get their own ntfy publisher user and token — never share credentials between apps
- One-time setup per new app (run from `/home/tyrel/repos/ntfy`):
  1. `make user-add USER=<app>` — creates a publisher account (prompts for password)
  2. `make token-create USER=<app>` — prints a token; copy it into the app's `.env` as `NTFY_TOKEN`
- Add to `.env.example`:
  ```
  NTFY_URL=https://ntfy.tyrelparker.dev
  NTFY_TOKEN=
  ```
- Topic naming: `<app>-<identifier>` (e.g., `trivia-tyrel`, `trivia-freya`) — the app prefix prevents collisions across apps on the shared server
- To publish a notification from the backend:
  ```
  POST $NTFY_URL/<topic>
  Authorization: Bearer $NTFY_TOKEN
  Body: <message text>
  ```
- Optional: include an `Actions` header for in-notification buttons that call back to the API (e.g., a signed short-lived URL for a destructive action so no login is required from the notification)
- Users subscribe to their topics in the ntfy mobile app pointed at `ntfy.tyrelparker.dev`
- `NTFY_TOKEN` is covered by `.env` being gitignored — never hardcode it

**Makefile (standard targets)**
```makefile
setup            # full first-time bootstrap (see details below)
dev              # docker compose up -d --build db backend, then npm run dev in frontend/
prod             # docker compose --profile prod up -d --build (all services including nginx frontend)
down             # docker compose --profile prod down
logs             # docker compose logs -f
dnsmasq-install  # sudo cp dnsmasq/<app>.tyrelparker.dev.conf /etc/dnsmasq.d/ && sudo systemctl restart dnsmasq
migrate          # docker compose exec backend npm run migrate
```
Add app-specific targets as needed (e.g. `pull-model`, `shell-db`).

`setup` must do all of the following in order:
1. Create the `proxy` Docker network if it doesn't exist
2. If `.env` does not exist: copy `.env.example` → `.env`, then generate and substitute a random `POSTGRES_PASSWORD` (`openssl rand -hex 24`) and `JWT_SECRET` (`openssl rand -hex 64`) directly into `.env`. If `.env` already exists, skip with a message.
3. Run `dnsmasq-install`
4. Start db + backend via `docker compose up -d --build db backend`
5. Wait for the db to be healthy (`pg_isready` loop against the db container)
6. Run migrations via `docker compose exec backend npm run migrate`

Standard `setup` implementation:
```makefile
setup:
	docker network create proxy 2>/dev/null || true
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$$(openssl rand -hex 24)|" .env; \
		sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$$(openssl rand -hex 64)|" .env; \
		echo ".env created with generated credentials"; \
	else \
		echo ".env already exists, skipping"; \
	fi
	$(MAKE) dnsmasq-install
	docker compose up -d --build db backend
	@echo "Waiting for db to be healthy..."
	@until docker compose exec db pg_isready -U $$(grep POSTGRES_USER .env | cut -d= -f2) > /dev/null 2>&1; do sleep 1; done
	docker compose exec backend npm run migrate
```

**Environment**
- Always include a `.env.example` documenting all required variables
- `.env` is gitignored
- Do NOT include `POSTGRES_HOST` in `.env.example` or `.env` — both dev and prod run the backend inside Docker, so the host is always the Docker service name `db`. Set `POSTGRES_HOST: db` explicitly in the backend service definition in `docker-compose.yml`.

**Postgres healthcheck (standard)**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
  interval: 10s
  timeout: 5s
  retries: 5
```
Backend should use `depends_on: db: condition: service_healthy`

Now apply this standard to the current repo. Tell me what needs to change and make the changes.
