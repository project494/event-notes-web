# API Documentation for AI Agents

## Authentication

All API endpoints require an API key in the request header:

```
X-Agent-API-Key: your_api_key_here
```

Without a valid key, requests will return `401 Unauthorized` or `403 Forbidden`.

## Base URL

```
https://your-domain.vercel.app
```

## Endpoints

### Health Check
**GET** `/health`

No authentication required. Returns server status.

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-04-25T20:32:00.000Z"
}
```

---

### Get User Profile
**GET** `/api/user/profile`

Returns the current user's profile information.

Response:
```json
{
  "userId": "example_user",
  "name": "Event Notes User",
  "createdAt": "2025-04-25T20:32:00.000Z"
}
```

---

### List Events
**GET** `/api/events`

Returns all events for the user.

Response:
```json
[
  {
    "id": "1234567890",
    "title": "Team Meeting",
    "date": "2025-04-26T10:00:00.000Z",
    "notes": "Discuss Q2 goals",
    "created": "2025-04-25T20:32:00.000Z"
  }
]
```

---

### Create Event
**POST** `/api/events`

Creates a new event.

Request Body:
```json
{
  "title": "Event Title",
  "date": "2025-04-26T10:00:00.000Z",
  "notes": "Optional notes here"
}
```

Response:
```json
{
  "id": "1234567890",
  "title": "Event Title",
  "date": "2025-04-26T10:00:00.000Z",
  "notes": "Optional notes here",
  "created": "2025-04-25T20:32:00.000Z"
}
```

---

### Calendar Integration Status
**GET** `/api/calendar/status`

Returns calendar connection status.

Response:
```json
{
  "connected": false,
  "service": null
}
```

---

### Camera Permissions Status
**GET** `/api/camera/permissions`

Returns camera permission status.

Response:
```json
{
  "granted": false,
  "settings": {}
}
```

---

## Example Agent Request (Node.js)

```javascript
const response = await fetch('https://your-domain.vercel.app/api/events', {
  method: 'GET',
  headers: {
    'X-Agent-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

---

## Error Responses

**401 Unauthorized**
```json
{ "error": "No API key provided" }
```

**403 Forbidden**
```json
{ "error": "Invalid API key" }
```

**404 Not Found**
```json
{ "error": "API endpoint not found" }
```

**500 Internal Server Error**
```json
{ "error": "Internal server error" }
```

---

## Security

- All endpoints are protected by API key authentication
- CORS is restricted to allowed origins
- Server blocks known AI crawlers and bots at the network level
- robots.txt + meta tags prevent search engine indexing
- Helmet.js adds security headers
