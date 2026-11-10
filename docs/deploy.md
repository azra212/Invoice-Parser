# Deploy

The app needs MongoDB, a `JWT_SECRET` of at least 16 characters, and a `GEMINI_API_KEY` only if PDF or image extraction is enabled. Redis is optional. Without `REDIS_URL` the API uses an in-memory queue, which is fine for one process and wrong for more than one.

Do not commit `.env`. Copy values from `.env.example`.

## Docker Compose

From the repo root:

```bash
docker compose up --build
```

The UI is at http://localhost:8080 and proxies `/api` to the API. MongoDB and Redis are included. Set `GEMINI_API_KEY` in the shell or a `.env` file beside the compose file if you want PDF and image extraction.

## Render

Single service, closest to the current demo:

- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Environment: `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGINS` set to the public origin
- Health check path: `/api/health`

`npm start` serves the built UI from the API when `apps/web/dist` exists. Leave `REDIS_URL` empty on a single instance, or attach Redis and set it when you run more than one.

Split services:

- API web service using `apps/api/Dockerfile`, with MongoDB and optional Redis
- Static site or the web image using `apps/web/Dockerfile`
- Set `CORS_ORIGINS` to the web origin

Documents stored before organisations existed have no `organizationId` and will not show up after sign-in. Start from an empty database or accept that those rows stay hidden.

## Fly.io

Two apps, or one API app plus Fly static hosting for `apps/web/dist`.

API:

```bash
fly launch --dockerfile apps/api/Dockerfile --name invoice-parser-api
fly secrets set MONGO_URI=... JWT_SECRET=... GEMINI_API_KEY=... CORS_ORIGINS=https://your-web-host
```

Point the web nginx upstream at the API only if both run on the same private network. The compose file does that with the hostname `api`. On Fly, set that hostname in `apps/web/nginx.conf` before building the web image, or keep serving the UI from the API with `npm start` and skip the web image.
