# Deploy with Docker

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or Docker Engine + Compose plugin (Linux).
- From the **project root** (folder that contains `docker-compose.yml`).

## One-time: Stripe (optional)

If you use Stripe payments, copy the example env file and set your publishable key:

```powershell
copy docker.env.example .env
```

Edit `.env` and set `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` (same idea as your backend Stripe config).

Compose reads `.env` automatically for variable substitution in `docker-compose.yml`.

## Build and run

```powershell
cd "path\to\licenta - Copy"
docker compose up -d --build
```

First start can take several minutes (Maven + npm + images).

## URLs

| Service    | URL |
|-----------|-----|
| **App (UI)** | http://localhost:3000 |
| **API** (direct) | http://localhost:8081/api/v1 |
| **Image AI** | http://localhost:8000 |
| **MySQL** (host) | `localhost:3307` (user `root`, password `12345`, DB `online_rental_db`) |

The frontend container serves the SPA on port **3000** and **proxies** `/api/` and `/images/` to the backend (`nginx.conf`), so the browser uses relative URLs like `/api/v1` — no CORS issues.

## Useful commands

```powershell
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v   # also removes MySQL volume (wipes DB)
```

## Troubleshooting

- **Port already in use**: change host ports in `docker-compose.yml` (e.g. `3001:80` for frontend).
- **Backend unhealthy / won’t start**: wait for MySQL healthcheck; check `docker compose logs mysql backend`.
- **Frontend can’t reach API**: ensure you open **http://localhost:3000**, not the Vite dev port; production build uses the nginx proxy.
