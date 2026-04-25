# Event Notes Web - Private AI Agent API

Secure, private web application with API access restricted to authorized AI agents only.

## Features
- Static frontend (HTML/CSS/JS)
- Express backend with API key authentication
- Bot/AI crawler blocking at server level
- robots.txt + noindex meta tags for extra privacy
- CORS restricted to allowed origins
- Security headers via Helmet.js

## Deployment Options (All Free)

### Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway new
railway add
railway deploy
```

### Option 2: Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 3: Fly.io
```bash
# Install Fly CLI
flyctl launch

# Deploy
flyctl deploy
```

## Setup

1. **Generate a secure API key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Save the output.

2. **Set the environment variable** `AGENT_API_KEY` with your generated key during deployment.

3. (Optional) Set `ALLOWED_ORIGINS` comma-separated for CORS if needed.

4. Deploy using one of the methods below.

## Local Development

Copy `.env.example` to `.env` and set your `AGENT_API_KEY`:
```bash
cp .env.example .env
# Edit .env and add your AGENT_API_KEY
```

Run the server:
```bash
npm start
```

Open http://localhost:3000

Test API:
```bash
curl -H "X-Agent-API-Key: your_key" http://localhost:3000/api/user/profile
``` using one of the methods below.

## AI Agent API Usage

Your AI agents must include the API key in requests:

```http
GET /api/user/profile
X-Agent-API-Key: your_key_here
```

### Protected Endpoints
- `GET /api/user/profile`
- `GET /api/events`
- `POST /api/events`
- `GET /api/calendar/status`
- `GET /api/camera/permissions`

## Security Notes
- Free tiers expose your app to the public internet
- The API key protects your endpoints from unauthorized access
- Bots are blocked via robots.txt, meta tags, and server-level UA filtering
- Only your AI agents with the correct API key can access data
