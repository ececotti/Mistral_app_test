# Mistral Chat App

Minimal web app that chats with the [Mistral API](https://docs.mistral.ai) using the
official TypeScript SDK (`@mistralai/mistralai`) and the `mistral-small-latest` model.
The browser only talks to our own backend (`POST /api/chat`), so `MISTRAL_API_KEY`
never leaves the server.

## Prerequisites

- Node.js 18 or newer (developed on Node 22)
- A Mistral API key from <https://console.mistral.ai/api-keys/>

## Install dependencies

```bash
npm install
```

## Configure the API key (server-side only)

```bash
cp .env.example .env
```

Then edit `.env` and set `MISTRAL_API_KEY=your-key`. Alternatively, export it in your
shell: `export MISTRAL_API_KEY=your-key`. Never put the key in `public/` or any
client-side code.

## Run locally

```bash
npm run dev
```

Open <http://localhost:3000> and start chatting.

## Deploy (use it hosted, not locally)

The app reads `PORT` and `MISTRAL_API_KEY` from the environment, so it runs as-is on any
host. Always set the key as a secret environment variable on the platform — never commit
it (`.env` is gitignored and excluded from the Docker image).

### Render / Railway / Fly.io (easiest)

1. Push this repo to GitHub and connect it on the platform ("Deploy from GitHub").
2. In the platform's env/secret settings, add `MISTRAL_API_KEY=your-key`.
3. Start command: `npm start` (Node 18+, see `engines` in package.json).
4. The platform assigns a public HTTPS URL — that's your chat app.

### Docker (any VPS, Fly.io, etc.)

```bash
docker build -t mistral-chat .
docker run -p 3000:3000 -e MISTRAL_API_KEY=your-key mistral-chat
```

Put a reverse proxy (Caddy or nginx) in front of port 3000 for HTTPS.

### Your own server

```bash
git clone <your-repo> && cd <repo>
npm install
MISTRAL_API_KEY=your-key npm start   # or use .env, pm2, or systemd
```

`npm install` generates `package-lock.json` — commit it for reproducible installs.

## Other commands

```bash
npm start          # run without watch mode
npm run typecheck  # type-check server.ts with tsc --noEmit
```

Set `PORT=8080` in `.env` to change the port.

## How it works

- `server.ts` — Express server. Serves `public/` and exposes `POST /api/chat`,
  which forwards the conversation to `client.chat.complete({ model: 'mistral-small-latest', ... })`
  and returns `{ "reply": "..." }`.
- `public/` — static chat UI (vanilla HTML/CSS/JS) that POSTs the conversation to
  `/api/chat` and renders the reply.

## API

`POST /api/chat`

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

Response `200 OK`: `{ "reply": "Hi there! ..." }` — errors return `400` (bad input)
or `502` (upstream Mistral API failure) with `{ "error": "..." }`.
