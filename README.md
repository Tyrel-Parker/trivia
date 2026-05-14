# Trivia

A self-hosted trivia/fact notification app. Add facts to a library, assign them to profiles, and each profile receives push notifications on a configurable schedule via [ntfy](https://ntfy.sh).

## How it works

- **Facts** are short pieces of information (e.g. "Grace Hopper wrote the first compiler"). Each fact has a short description (sent in the notification) and an optional long description (shown on the detail page).
- **Profiles** represent people who receive notifications. Each profile has its own ntfy topic, notification frequency, and fact cycling order. Creating a profile also creates the login account for that person.
- The **scheduler** runs every minute and checks whether each profile is due for a notification based on `last_notified_at` and `send_frequency_hours`. When due, it picks the next fact according to the profile's cycling order and publishes it to ntfy.
- Notifications include two action buttons: **View** (opens the fact detail page) and **Remove from list** (removes the fact from that profile via a signed one-time token — no login required).
- Each profile can have **quiet hours** — a start and end hour (24h) during which no notifications are sent. The window wraps midnight (e.g. 21:00–09:00). Times are evaluated in the profile's stored timezone if set, otherwise server local time.

### Cycling modes

| Mode | Behaviour |
|---|---|
| Shuffle | Sends all facts once in random order before repeating any. New facts join at the current minimum send count. |
| Round-robin | Always sends the fact that was sent least recently. |
| Random | Picks a random fact each time with no tracking. |

## Stack

- **Frontend**: React + Vite, served by nginx in a Docker container
- **Backend**: Node.js + Express, live-reloaded by nodemon in dev
- **Database**: PostgreSQL 16
- **Notifications**: Self-hosted ntfy at `ntfy.tyrelparker.dev`
- **Reverse proxy**: Traefik (shared homelab instance)
- **Routing**: `trivia.tyrelparker.dev` → Traefik → nginx → backend at `/api/`

## First-time setup

```bash
make setup
```

This will:
1. Create the `proxy` Docker network if it doesn't exist
2. Generate `.env` from `.env.example` with random credentials (skipped if `.env` already exists)
3. Build and start all containers
4. Wait for the database to be healthy
5. Run migrations

On first boot the backend seeds an **admin** account using `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env` (defaults: `admin` / `admin`). Change these in `.env` before running setup on a new install.

For local development, also run:

```bash
make dev
```

This installs the dnsmasq config so `trivia.tyrelparker.dev` resolves locally, then starts all services.

## Make targets

| Target | Description |
|---|---|
| `make setup` | Full first-time bootstrap (network, .env, build, migrate) |
| `make dev` | Install dnsmasq config if needed, start all services |
| `make prod` | Start all services with `NODE_ENV=production` |
| `make frontend` | Rebuild and restart the frontend container after UI changes |
| `make down` | Stop all containers |
| `make logs` | Tail logs for all services |
| `make migrate` | Run database migrations |
| `make shell-db` | Open a psql shell in the database container |
| `make cleanup` | Remove the dnsmasq config and restart dnsmasq |

## Creating profiles

Log in as admin, go to **Profiles → New Profile**, and fill in:

- **Name** — display name (e.g. "Tyrel")
- **ntfy topic** — the ntfy topic notifications are sent to (e.g. `trivia-tyrel`)
- **Frequency** — how often to send a notification, in hours
- **Cycling order** — shuffle, round-robin, or random
- **Username / Password** — login credentials for this person

The user account is created at the same time as the profile in a single transaction.

## Quiet hours

Each profile can suppress notifications during a configured window. Open the profile's **Edit Settings**, check **Quiet hours**, and set a start and end hour (24h format). The window wraps midnight correctly — `21:00–09:00` means no notifications from 9 pm to 9 am.

Times are evaluated against the profile's stored timezone (see below). If no timezone is set, server local time is used as a fallback.

## Timezone-aware quiet hours (Tasker)

By default quiet hours use server local time. If you want the window to follow your phone's timezone (e.g. when travelling), you can have your Android phone report its current timezone to the server automatically using [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm).

### One-time setup

1. In the profile's **Edit Settings**, click **Generate** under *Device token* to create a token for that profile.
2. The section shows a pre-filled Tasker config. In Tasker, create:
   - **Profile** trigger: *System → Timezone Changed*
   - **Task** action: *Net → HTTP Request*
     - Method: `POST`
     - URL: `https://trivia.tyrelparker.dev/api/profiles/<id>/timezone`
     - Headers: `Authorization: Bearer <your device token>`
     - Body: `{"timezone":"%TZONE"}`  (`%TZONE` is Tasker's built-in current timezone variable)
3. Run the task once manually to seed the initial value.

After that Tasker fires silently whenever the timezone changes. The server uses the stored timezone for all quiet-hour calculations for that profile.

The device token can be regenerated at any time from the profile settings if needed.

## Adding facts to a profile

Facts can be assigned to profiles in two ways:

1. **At creation time** — the Add Fact form shows checkboxes for all profiles. Check any you want the fact added to.
2. **From the profile page** — the profile detail page has an "Add facts" section with a search box listing all facts not already in the profile.

## Environment variables

See `.env.example` for all required variables. Secrets (`POSTGRES_PASSWORD`, `JWT_SECRET`, `DISMISS_SECRET`) are auto-generated by `make setup`.

| Variable | Description |
|---|---|
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password (auto-generated) |
| `POSTGRES_DB` | Database name |
| `JWT_SECRET` | Signs session tokens (auto-generated) |
| `DISMISS_SECRET` | Signs dismiss tokens in ntfy action buttons (auto-generated) |
| `NTFY_URL` | ntfy server URL |
| `NTFY_TOKEN` | ntfy publisher token for this app |
| `ADMIN_USERNAME` | Admin account username (default: `admin`) |
| `ADMIN_PASSWORD` | Admin account password (default: `admin`) |
